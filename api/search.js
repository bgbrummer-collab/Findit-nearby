export default {
  async fetch(request) {
    try {
      if (request.method !== "POST") {
        return Response.json({ ok: false, error: "POST requests only" }, { status: 405 });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";

      if (!apiKey) {
        return Response.json(
          { ok: false, error: "GEMINI_API_KEY is not configured in Vercel." },
          { status: 500 }
        );
      }

      const form = await request.formData();
      const image = form.get("image");

      if (!image || typeof image.arrayBuffer !== "function") {
        return Response.json({ ok: false, error: "No image was uploaded." }, { status: 400 });
      }

      if (image.size > 8_000_000) {
        return Response.json(
          { ok: false, error: "Please use an image smaller than 8 MB." },
          { status: 413 }
        );
      }

      const bytes = new Uint8Array(await image.arrayBuffer());
      let binary = "";
      for (const byte of bytes) binary += String.fromCharCode(byte);
      const base64 = btoa(binary);

      const prompt = `
You are FindIt Nearby's visual product identification engine.

Identify the MAIN physical item in the uploaded image.

Rules:
- Be precise but never invent details.
- Use visible logos, text, labels, model numbers, shapes, colours and design clues.
- Do not confuse related products.
- Brand must be null unless there is reasonable evidence.
- Model must be null unless there is reasonable evidence.
- If the exact model is uncertain, give a broader accurate name.
- category must help identify the type of retailer that could realistically sell the item.
- searchQuery should be the best web/product-search phrase for the closest real match.
- confidence must honestly represent certainty.
- visibleText should contain only useful visible words.

Return ONLY valid JSON with exactly this shape:
{
  "object": "general object type",
  "name": "best specific item name",
  "brand": "brand or null",
  "model": "model or null",
  "visibleText": ["important visible text"],
  "color": "useful main colour or null",
  "category": "accurate shopping category",
  "searchQuery": "best exact-product search phrase",
  "confidence": 0.0,
  "summary": "one short accurate description"
}
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
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
                      data: base64
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json",
              thinkingConfig: { thinkingLevel: "low" }
            }
          })
        }
      );

      const raw = await response.json();

      if (!response.ok) {
        const message = raw?.error?.message || "Gemini could not analyse this image.";
        return Response.json(
          { ok: false, error: "Gemini could not analyse this image.", details: message },
          { status: response.status === 429 ? 429 : 500 }
        );
      }

      const text = raw?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim();

      if (!text) {
        return Response.json({ ok: false, error: "Gemini returned no identification." }, { status: 500 });
      }

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        return Response.json(
          { ok: false, error: "Gemini returned an unreadable identification." },
          { status: 500 }
        );
      }

      const confidence = Math.max(0, Math.min(1, Number(parsed.confidence || 0)));

      const identification = {
        object: parsed.object || null,
        name: parsed.name || parsed.object || "Unknown item",
        brand: parsed.brand || null,
        model: parsed.model || null,
        visibleText: Array.isArray(parsed.visibleText) ? parsed.visibleText.filter(Boolean).slice(0, 12) : [],
        color: parsed.color || null,
        category: parsed.category || null,
        searchQuery: parsed.searchQuery || parsed.name || parsed.object || "",
        confidence,
        summary: parsed.summary || ""
      };

      if (confidence < 0.55) {
        return Response.json({
          ok: true,
          identification,
          verified: false,
          offers: [],
          message: "FindIt is not confident enough to search retailers. Try a clearer photo."
        });
      }

      return Response.json({
        ok: true,
        identification,
        verified: false,
        offers: [],
        message: "Item identified. Nearby retailers can be shown, but exact price and stock require verified retailer data."
      });

    } catch (error) {
      console.error("FindIt search API error:", error);
      return Response.json(
        { ok: false, error: "FindIt image analysis failed.", details: error?.message || "Unknown server error" },
        { status: 500 }
      );
    }
  }
};
