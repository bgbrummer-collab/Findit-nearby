export default {
  async fetch(request) {
    try {
      if (request.method !== "POST") {
        return Response.json(
          {
            ok: false,
            error: "POST requests only"
          },
          { status: 405 }
        );
      }

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return Response.json(
          {
            ok: false,
            error:
              "GEMINI_API_KEY is not configured in Vercel."
          },
          { status: 500 }
        );
      }

      const form =
        await request.formData();

      const image =
        form.get("image");

      if (
        !image ||
        typeof image.arrayBuffer !== "function"
      ) {
        return Response.json(
          {
            ok: false,
            error: "No image was uploaded."
          },
          { status: 400 }
        );
      }

      /*
        Keep uploads reasonably small.

        Gemini supports larger inline requests,
        but a smaller limit makes FindIt faster
        and more reliable on phones.
      */
      if (image.size > 8_000_000) {
        return Response.json(
          {
            ok: false,
            error:
              "The image is too large. Please use an image smaller than 8 MB."
          },
          { status: 413 }
        );
      }

      const bytes =
        new Uint8Array(
          await image.arrayBuffer()
        );

      let binary = "";

      for (const byte of bytes) {
        binary +=
          String.fromCharCode(byte);
      }

      const base64Image =
        btoa(binary);

      const prompt = `
You are the visual product-identification engine for a shopping website called FindIt Nearby.

Analyse the uploaded image carefully.

Your job is to identify the REAL MAIN PHYSICAL ITEM shown.

Important rules:

1. Do not force an image into a shopping category if it does not belong there.
2. Do not confuse related products.
   Example:
   - microphone is not headphones
   - flower is not electronics
   - shoe is not generic clothing
3. Look carefully for:
   - logos
   - visible text
   - model numbers
   - labels
   - brand marks
   - product shape
   - colour
   - distinctive design details
4. Identify the brand only when there is reasonable visual evidence.
5. Identify the exact model only when there is reasonable evidence.
6. Never invent a model number.
7. If the exact model is uncertain, use a broader accurate product name.
8. Confidence must reflect how certain you actually are.
9. The searchQuery should be the best phrase for finding the closest real product match online.
10. category should be useful for finding the correct type of retailer.

Examples:

A Nike sneaker might return:
object: sneaker
brand: Nike
model: Air Force 1 Low
category: Footwear > Sneakers

A branded microphone might return:
object: microphone
brand: the visible brand if clear
category: Electronics > Audio > Microphones

A flower might return:
object: flower
category: Flowers / Plants

A car might return:
object: car
brand and model only when reasonably identifiable.

Return ONLY valid JSON.

Use exactly this structure:

{
  "object": "general object type",
  "name": "best specific product/item name",
  "brand": "brand name or null",
  "model": "model name/number or null",
  "visibleText": [
    "important visible words"
  ],
  "color": "main useful colour or null",
  "category": "accurate product category",
  "searchQuery": "best exact-item search phrase",
  "confidence": 0.0,
  "summary": "one short accurate description"
}

confidence must be between 0 and 1.

If you are uncertain, lower confidence instead of inventing details.
`;

      const geminiResponse =
        await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              "x-goog-api-key":
                apiKey
            },

            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt
                    },
                    {
                      inline_data: {
                        mime_type:
                          image.type ||
                          "image/jpeg",

                        data:
                          base64Image
                      }
                    }
                  ]
                }
              ],

              generationConfig: {
                responseMimeType:
                  "application/json"
              }
            })
          }
        );

      const raw =
        await geminiResponse.json();

      if (!geminiResponse.ok) {
        console.error(
          "Gemini API error:",
          raw
        );

        return Response.json(
          {
            ok: false,
            error:
              "Gemini could not analyse this image.",

            details:
              raw?.error?.message ||
              "Unknown Gemini error"
          },
          { status: 500 }
        );
      }

      const text =
        raw?.candidates?.[0]
          ?.content?.parts?.[0]
          ?.text;

      if (!text) {
        return Response.json(
          {
            ok: false,
            error:
              "Gemini returned no identification."
          },
          { status: 500 }
        );
      }

      let identification;

      try {
        identification =
          JSON.parse(text);
      } catch (error) {
        console.error(
          "Could not parse Gemini JSON:",
          text
        );

        return Response.json(
          {
            ok: false,
            error:
              "Gemini returned an unreadable identification."
          },
          { status: 500 }
        );
      }

      /*
        Normalise the result so the frontend
        always receives predictable fields.
      */

      const confidence =
        Math.max(
          0,
          Math.min(
            1,
            Number(
              identification.confidence ||
              0
            )
          )
        );

      const cleaned = {
        object:
          identification.object ||
          null,

        name:
          identification.name ||
          identification.object ||
          "Unknown item",

        brand:
          identification.brand ||
          null,

        model:
          identification.model ||
          null,

        visibleText:
          Array.isArray(
            identification.visibleText
          )
            ? identification.visibleText
                .filter(Boolean)
                .slice(0, 12)
            : [],

        color:
          identification.color ||
          null,

        category:
          identification.category ||
          null,

        searchQuery:
          identification.searchQuery ||
          identification.name ||
          identification.object ||
          "",

        confidence,

        summary:
          identification.summary ||
          ""
      };

      /*
        Weak identification:
        do NOT turn it into random shops/products.
      */

      if (confidence < 0.55) {
        return Response.json({
          ok: true,

          identification:
            cleaned,

          offers: [],

          verified: false,

          message:
            "FindIt is not confident enough to search for retailers. Try a clearer image showing the full item, logo or model details."
        });
      }

      /*
        IMPORTANT:

        The real retailer layer will later fill
        offers with legitimate product information.

        Until that connection exists,
        FindIt must NEVER invent:
        - price
        - stock
        - product URL
        - exact branch inventory
      */

      return Response.json({
        ok: true,

        identification:
          cleaned,

        offers: [],

        verified: false,

        message:
          "Item identified successfully. Nearby retailer locations can be searched, but exact price and stock require verified retailer catalogue data."
      });

    } catch (error) {
      console.error(
        "FindIt search API error:",
        error
      );

      return Response.json(
        {
          ok: false,

          error:
            "FindIt image analysis failed.",

          details:
            error?.message ||
            "Unknown server error"
        },
        { status: 500 }
      );
    }
  }
};
