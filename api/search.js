const ALLOWED_FAMILIES = new Set([
  "grocery",
  "household",
  "beauty",
  "pharmacy",
  "footwear",
  "clothing",
  "stationery",
  "electronics",
  "furniture",
  "garden",
  "books",
  "tools",
  "toys",
  "pet",
  "baby",
  "automotive",
  "sports",
  "jewellery",
  "other",
  "unsupported"
]);

function normalise(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function inferRetailerFamily(parsed) {
  const declared = normalise(parsed?.retailerFamily).replace(/\s+/g, "_");

  if (ALLOWED_FAMILIES.has(declared)) {
    return declared;
  }

  const text = normalise(
    [
      parsed?.object,
      parsed?.name,
      parsed?.category,
      parsed?.searchQuery,
      Array.isArray(parsed?.visibleText) ? parsed.visibleText.join(" ") : ""
    ]
      .filter(Boolean)
      .join(" ")
  );

  // Keep restricted/unsafe categories out of nearby-store discovery.
  if (
    /weapon|firearm|gun|ammunition|knife|taser|pepper spray|alcohol|beer|wine|liquor|vape|cigarette|nicotine|cannabis|marijuana|thc|gambling|betting/
      .test(text)
  ) {
    return "unsupported";
  }

  const rules = [
    ["household", /tissue|toilet paper|paper towel|kitchen towel|napkin|household paper|cleaning|detergent|dishwashing|dish soap|laundry|fabric softener|bleach|bin bag|trash bag|refuse bag|sponge|cleaner|disinfectant/],
    ["pet", /pet food|dog food|cat food|pet toy|dog toy|cat toy|pet supplies/],
    ["baby", /baby wipes|nappy|nappies|diaper|diapers|baby bottle|baby food|infant/],
    ["grocery", /food|grocery|supermarket|snack|sauce|spread|jam|butter|icing|frosting|buttercream|baking|flour|sugar|milk|bread|cereal|chocolate|sweet|candy|coffee|tea|juice|drink|beverage|syrup|soup|pasta|rice|cookie|biscuit|chips|lemon curd|lemon butter/],
    ["beauty", /skin care|skincare|body cream|face cream|hand cream|lotion|moisturizer|moisturiser|cosmetic|makeup|beauty|serum|shampoo|conditioner|soap|deodorant|perfume|fragrance|body wash|face wash/],
    ["pharmacy", /medicine|medication|pharmacy|chemist|vitamin|painkiller|bandage|first aid|medical supply/],
    ["footwear", /shoe|sneaker|footwear|trainer|boot|sandal/],
    ["stationery", /pencil case|pencil|pen|stationery|notebook|marker|stapler|eraser|ruler|highlighter|school supplies|office supplies/],
    ["electronics", /microphone|headphone|earphone|speaker|audio|sound|amplifier|earbud|smartphone|mobile phone|iphone|android phone|cellphone|computer|laptop|monitor|keyboard|mouse|printer|camera|photography|dslr|mirrorless/],
    ["clothing", /shirt|t shirt|tshirt|sweater|hoodie|jacket|dress|clothing|fashion|jeans|pants|trousers|shorts|skirt|coat/],
    ["garden", /flower|plant|bouquet|rose|orchid|succulent/],
    ["furniture", /chair|table|desk|sofa|couch|furniture|cabinet|shelf|bookshelf|wardrobe|bed frame/],
    ["books", /book|novel|textbook|magazine|comic book/],
    ["tools", /tool|drill|hammer|hardware|screwdriver|saw|spanner|wrench|pliers/],
    ["toys", /toy|lego|board game|video game|gaming console|playstation|xbox|nintendo/],
    
    ["sports", /sports equipment|fitness|gym equipment|soccer ball|football|rugby ball|tennis racket|golf club/],
    ["jewellery", /jewelry|jewellery|necklace|bracelet|earring|watch/]
  ];

  for (const [family, pattern] of rules) {
    if (pattern.test(text)) {
      return family;
    }
  }

  return "other";
}

function cleanString(value, fallback = null) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 300) : fallback;
}

export default {
  async fetch(request) {
    try {
      if (request.method !== "POST") {
        return Response.json(
          { ok: false, error: "POST requests only" },
          { status: 405 }
        );
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
        return Response.json(
          { ok: false, error: "No image was uploaded." },
          { status: 400 }
        );
      }

      if (image.size > 8_000_000) {
        return Response.json(
          { ok: false, error: "Please use an image smaller than 8 MB." },
          { status: 413 }
        );
      }

      if (image.type && !image.type.startsWith("image/")) {
        return Response.json(
          { ok: false, error: "Please upload an image file." },
          { status: 415 }
        );
      }

      const bytes = new Uint8Array(await image.arrayBuffer());
      let binary = "";

      for (const byte of bytes) {
        binary += String.fromCharCode(byte);
      }

      const base64 = btoa(binary);

      const prompt = `
You are FindIt Nearby's visual product identification engine.

Identify the MAIN physical product in the uploaded image.

Important rules:
- Be accurate. Never invent a brand, model, size, flavour, variant, material or feature that is not reasonably supported by the image.
- Use visible logos, labels, text, packaging, model numbers, colours, shapes and design clues.
- If the exact model is uncertain, use a broader but accurate product name.
- Brand must be null when there is not enough evidence.
- Model must be null when there is not enough evidence.
- confidence means confidence in the IDENTIFICATION, not proof of exact retailer stock.
- visibleText should include only useful readable words.
- category can be descriptive, for example "Household Paper Products".
- retailerFamily MUST be exactly ONE of:
  grocery, household, beauty, pharmacy, footwear, clothing, stationery,
  electronics, furniture, garden, books, tools, toys, pet, baby,
  automotive, sports, jewellery, other, unsupported.

Use these retailerFamily rules:
- grocery: edible food, drinks, baking ingredients, packaged groceries.
- household: tissues, toilet paper, paper towels, cleaning products, detergent, bin bags, household consumables.
- beauty: skincare, cosmetics, perfume, shampoo, body-care products.
- pharmacy: ordinary pharmacy/medical-supply items.
- footwear: shoes, sneakers, boots, sandals.
- clothing: apparel and fashion clothing.
- stationery: pens, pencils, pencil cases, notebooks and school/office stationery.
- electronics: phones, computers, cameras, headphones, microphones, speakers and consumer electronics.
- furniture: furniture and home interior furniture products.
- garden: flowers, plants and gardening products.
- books: books, textbooks, magazines.
- tools: hand tools, power tools and hardware products.
- toys: toys and games.
- pet: pet food and ordinary pet supplies.
- baby: nappies/diapers, baby wipes, baby bottles and ordinary baby products.
- automotive: ordinary car parts/accessories.
- sports: sports and fitness equipment.
- jewellery: jewellery, watches and fashion accessories.
- other: legitimate ordinary retail products that do not fit a family above.
- unsupported: weapons, age-restricted/intoxicating products, gambling-related products, or other products FindIt should not locate for the user.

Examples:
- Twinsaver tissues -> household
- toilet paper -> household
- dishwashing liquid -> household
- lemon butter / baking spread -> grocery
- body cream -> beauty
- Nike sneaker -> footwear
- pencil case -> stationery
- laptop -> electronics

Return ONLY valid JSON with exactly this shape:
{
  "object": "general object type",
  "name": "best specific item name",
  "brand": "brand or null",
  "model": "model or null",
  "visibleText": ["important visible text"],
  "color": "useful main colour or null",
  "category": "accurate shopping category",
  "retailerFamily": "one allowed family",
  "searchQuery": "best product-search phrase",
  "confidence": 0.0,
  "summary": "one short accurate description"
}
`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);

      let response;

      try {
        response = await fetch(
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
            }),
            signal: controller.signal
          }
        );
      } finally {
        clearTimeout(timer);
      }

      const raw = await response.json();

      if (!response.ok) {
        const message =
          raw?.error?.message ||
          "Gemini could not analyse this image.";

        return Response.json(
          {
            ok: false,
            error: "Gemini could not analyse this image.",
            details: message
          },
          {
            status:
              response.status === 429
                ? 429
                : 500
          }
        );
      }

      const text = raw?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim();

      if (!text) {
        return Response.json(
          { ok: false, error: "Gemini returned no identification." },
          { status: 500 }
        );
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

      const confidence = Math.max(
        0,
        Math.min(1, Number(parsed.confidence || 0))
      );

      const retailerFamily =
        inferRetailerFamily(parsed);

      const identification = {
        object: cleanString(parsed.object),
        name:
          cleanString(parsed.name) ||
          cleanString(parsed.object) ||
          "Unknown item",
        brand: cleanString(parsed.brand),
        model: cleanString(parsed.model),
        visibleText: Array.isArray(parsed.visibleText)
          ? parsed.visibleText
              .filter((value) => typeof value === "string" && value.trim())
              .slice(0, 12)
              .map((value) => value.trim().slice(0, 120))
          : [],
        color: cleanString(parsed.color),
        category: cleanString(parsed.category),
        retailerFamily,
        searchQuery:
          cleanString(parsed.searchQuery) ||
          cleanString(parsed.name) ||
          cleanString(parsed.object) ||
          "",
        confidence,
        summary: cleanString(parsed.summary, "") || ""
      };

      if (retailerFamily === "unsupported") {
        return Response.json({
          ok: true,
          identification,
          verified: false,
          offers: [],
          message:
            "FindIt identified the item, but nearby-store discovery is not available for this type of product."
        });
      }

      if (confidence < 0.55) {
        return Response.json({
          ok: true,
          identification,
          verified: false,
          offers: [],
          message:
            "FindIt is not confident enough to search retailers. Try a clearer photo."
        });
      }

      return Response.json({
        ok: true,
        identification,
        verified: false,
        offers: [],
        message:
          "Item identified. Nearby retailers can be shown, but exact price and stock require verified retailer data."
      });
    } catch (error) {
      console.error("FindIt search API error:", error);

      const timedOut =
        error?.name === "AbortError";

      return Response.json(
        {
          ok: false,
          error: timedOut
            ? "Image analysis timed out. Please try again."
            : "FindIt image analysis failed.",
          details:
            error?.message ||
            "Unknown server error"
        },
        { status: 500 }
      );
    }
  }
};
