export default {
  async fetch(request) {
    try {
      if (request.method !== "POST") {
        return Response.json(
          { error: "POST requests only" },
          { status: 405 }
        );
      }

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return Response.json(
          { error: "GEMINI_API_KEY is not configured in Vercel." },
          { status: 500 }
        );
      }

      const form = await request.formData();
      const image = form.get("image");

      if (!image || typeof image.arrayBuffer !== "function") {
        return Response.json(
          { error: "No image was uploaded." },
          { status: 400 }
        );
      }

      // Keep uploads small enough for the Vercel request limit.
      if (image.size > 4_000_000) {
        return Response.json(
          { error: "Image is too large. Please upload an image smaller than 4 MB." },
          { status: 413 }
        );
      }

      const bytes = new Uint8Array(await image.arrayBuffer());

      let binary = "";
      for (const byte of bytes) {
        binary += String.fromCharCode(byte);
      }

      const base64Image = btoa(binary);

      const prompt = `
You are the visual product-identification engine for a shopping app called FindIt Nearby.

Study the uploaded image carefully.

Your job is to identify the ACTUAL PHYSICAL ITEM shown in the image.

Do NOT force the image into an unrelated shopping category.
Do NOT guess a brand or model if it is not visible or reasonably identifiable.
If the image is a flower, identify it as a flower.
If it is a car, identify it as a car and identify make/model only if reasonably possible.
If it is a microphone, identify it as a microphone, not headphones.
If visible text, logos, brand names, model numbers, labels or product codes appear, use them as evidence.

Return ONLY valid JSON with this exact structure:

{
  "object": "general physical object",
  "name": "best specific name for the item",
  "brand": "brand if identifiable, otherwise null",
  "model": "model or product number if identifiable, otherwise null",
  "visibleText": ["important visible text"],
  "color": "main colour if useful",
  "category": "accurate shopping/product category",
  "searchQuery": "best search phrase for finding this exact item",
  "confidence": 0.0,
  "summary": "short explanation of what was identified"
}

confidence must be a number from 0 to 1.

If uncertain, lower the confidence instead of inventing information.
`;

      const geminiResponse = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: image.type || "image/jpeg",
                      data: base64Image
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1
            }
          })
        }
      );

      const raw = await geminiResponse.json();

      if (!geminiResponse.ok) {
        console.error("Gemini error:", raw);

        return Response.json(
          {
            error: "Gemini could not analyse this image.",
            details: raw?.error?.message || "Unknown Gemini error"
          },
          { status: 500 }
        );
      }

      const text =
        raw?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        return Response.json(
          { error: "Gemini returned no identification." },
          { status: 500 }
        );
      }

      let identification;

      try {
        identification = JSON.parse(text);
      } catch {
        return Response.json(
          {
            error: "Gemini returned an unreadable identification.",
            raw: text
          },
          { status: 500 }
        );
      }

      const confidence = Number(identification.confidence || 0);

      // Very important: weak identifications do not become random searches.
      if (confidence < 0.55) {
        return Response.json({
          identification,
          offers: [],
          verified: false,
          message:
            "FindIt is not confident enough to search for stores. Try a clearer photo showing the whole item, logo or model details."
        });
      }

      // Retailer/catalogue connections will fill this later.
      // For now we NEVER invent prices, stock or stores.
      return Response.json({
        identification,
        offers: [],
        verified: false,
        message:
          "The item was identified successfully. Verified retailer catalogue connections are still required for real prices, stock and store availability."
      });

    } catch (error) {
      console.error(error);

      return Response.json(
        {
          error: "FindIt image analysis failed.",
          details: error.message
        },
        { status: 500 }
      );
    }
  }
};
