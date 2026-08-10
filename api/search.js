const MODEL_CHAIN = [
  process.env.GEMINI_MODEL,
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash"
].filter(Boolean);

const FAMILY_VALUES = [
  "footwear",
  "stationery",
  "grocery",
  "household",
  "beauty",
  "pharmacy",
  "electronics",
  "clothing",
  "furniture",
  "garden",
  "books",
  "tools",
  "toys",
  "pet",
  "baby",
  "automotive",
  "other"
];

function jsonResponse(body, status = 200, headers = {}) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...headers
    }
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripJsonFence(text) {
  const value = String(text || "").trim();
  return value
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function fallbackFamily(item = {}) {
  const visible = Array.isArray(item.visibleText)
    ? item.visibleText.join(" ")
    : "";

  const text = [
    item.object,
    item.name,
    item.brand,
    item.model,
    item.category,
    item.searchQuery,
    visible
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const rules = [
    ["footwear", /shoe|sneaker|footwear|trainer|boot|sandal/],
    ["stationery", /pencil|pen|stationery|notebook|marker|stapler|eraser|ruler|school supplies|office supplies/],
    ["household", /tissue|toilet paper|paper towel|kitchen towel|napkin|household paper|dishwash|dish soap|washing liquid|laundry|detergent|fabric softener|bleach|cleaner|cleaning|bin bag|trash bag|refuse bag/],
    ["grocery", /food|grocery|supermarket|snack|sauce|spread|jam|butter|icing|frosting|buttercream|baking|flour|sugar|milk|bread|cereal|chocolate|sweet|candy|coffee|tea|juice|drink|beverage|syrup|soup|pasta|rice|cookie|biscuit|chips|lemon curd|lemon butter/],
    ["beauty", /skin care|skincare|body cream|face cream|hand cream|lotion|moisturizer|moisturiser|cosmetic|makeup|beauty|serum|shampoo|conditioner|soap|deodorant|perfume|fragrance|body wash|face wash/],
    ["pharmacy", /medicine|medication|pharmacy|chemist|vitamin|painkiller|bandage|first aid|medical supply/],
    ["electronics", /microphone|headphone|earphone|speaker|audio|sound|amplifier|earbud|smartphone|mobile phone|iphone|android phone|cellphone|computer|laptop|monitor|keyboard|mouse|printer|desktop pc|gaming pc|camera|photography|dslr|mirrorless/],
    ["clothing", /shirt|t shirt|tshirt|sweater|hoodie|jacket|dress|clothing|fashion|jeans|pants|trousers|shorts|skirt|coat/],
    ["garden", /flower|plant|bouquet|rose|orchid|succulent/],
    ["furniture", /chair|table|desk|sofa|couch|furniture|cabinet|shelf|bookshelf|wardrobe|bed frame/],
    ["books", /book|novel|textbook|magazine|comic book/],
    ["tools", /tool|drill|hammer|hardware|screwdriver|saw|spanner|wrench|pliers/],
    ["toys", /toy|lego|board game|video game|gaming console|playstation|xbox|nintendo/],
    ["pet", /dog food|cat food|pet food|pet treat|cat litter|pet toy|pet accessory/],
    ["baby", /baby wipe|nappy|diaper|baby formula|baby bottle|baby shampoo|baby food/],
    ["automotive", /car accessory|motor oil|engine oil|car care|windscreen|windshield|car battery/]
  ];

  for (const [family, regex] of rules) {
    if (regex.test(text)) return family;
  }

  return "other";
}

function normaliseIdentification(raw = {}) {
  const item = {
    object: String(raw.object || "").trim(),
    name: String(raw.name || raw.productName || raw.object || "Item").trim(),
    brand: String(raw.brand || "").trim(),
    model: String(raw.model || "").trim(),
    category: String(raw.category || "").trim(),
    color: String(raw.color || raw.colour || "").trim(),
    summary: String(raw.summary || "").trim(),
    searchQuery: String(raw.searchQuery || raw.search_query || raw.name || raw.object || "").trim(),
    visibleText: Array.isArray(raw.visibleText)
      ? raw.visibleText.map((x) => String(x)).filter(Boolean).slice(0, 12)
      : [],
    confidence: Number(raw.confidence)
  };

  if (!Number.isFinite(item.confidence)) {
    item.confidence = 0.72;
  }
  if (item.confidence > 1) {
    item.confidence = item.confidence / 100;
  }
  item.confidence = Math.max(0, Math.min(1, item.confidence));

  const proposed = String(raw.retailerFamily || raw.retailer_family || "").trim().toLowerCase();
  item.retailerFamily = FAMILY_VALUES.includes(proposed)
    ? proposed
    : fallbackFamily(item);

  return item;
}

function extractCandidateText(data) {
  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || "")
      .join("")
      .trim() || ""
  );
}

async function callGemini({ apiKey, model, base64, mimeType, prompt }) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64
            }
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
      maxOutputTokens: 1400
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  return { response, payload };
}

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return jsonResponse({ ok: false, error: "POST requests only" }, 405);
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return jsonResponse(
        {
          ok: false,
          error: "AI configuration is missing.",
          details: "No Gemini API key is configured on the server."
        },
        500
      );
    }

    let form;
    try {
      form = await request.formData();
    } catch {
      return jsonResponse({ ok: false, error: "Invalid upload." }, 400);
    }

    const image = form.get("image");
    if (!(image instanceof File)) {
      return jsonResponse({ ok: false, error: "An image file is required." }, 400);
    }

    if (!image.type?.startsWith("image/")) {
      return jsonResponse({ ok: false, error: "Please upload an image." }, 400);
    }

    if (image.size > 8_000_000) {
      return jsonResponse({ ok: false, error: "Please use an image smaller than 8 MB." }, 413);
    }

    const bytes = new Uint8Array(await image.arrayBuffer());
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    const base64 = btoa(binary);

    const prompt = `
You are the product-identification engine for FindIt Nearby.
Analyze the supplied image and return ONLY valid JSON.

Do not guess an exact brand/model when the image does not support it.
Confidence means confidence in the identification, not proof that a nearby shop stocks the exact product.

Return this schema:
{
  "object": "general object",
  "name": "best product name",
  "brand": "",
  "model": "",
  "category": "human readable category",
  "retailerFamily": "one value from the allowed list",
  "color": "",
  "summary": "one concise sentence",
  "searchQuery": "useful exact-ish shopping search phrase",
  "visibleText": ["text visible on packaging"],
  "confidence": 0.0
}

Allowed retailerFamily values:
${FAMILY_VALUES.join(", ")}

Examples:
tissues/toilet paper/paper towels/cleaning products/laundry detergent -> household
food/baking/drinks -> grocery
pencil cases/pens/notebooks -> stationery
shoes/sneakers -> footwear
phones/laptops/cameras/audio -> electronics
body cream/skincare/makeup -> beauty
medicine/first aid -> pharmacy
baby wipes/nappies -> baby
pet food/pet supplies -> pet
`.trim();

    const attempts = [];
    let saw429 = false;
    let retryAfterSeconds = 0;

    for (const model of [...new Set(MODEL_CHAIN)]) {
      for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt > 0) {
          await sleep(1800);
        }

        const { response, payload } = await callGemini({
          apiKey,
          model,
          base64,
          mimeType: image.type || "image/jpeg",
          prompt
        });

        if (response.status === 429) {
          saw429 = true;
          const retryHeader = Number(response.headers.get("retry-after"));
          if (Number.isFinite(retryHeader)) {
            retryAfterSeconds = Math.max(retryAfterSeconds, retryHeader);
          }

          attempts.push({
            model,
            status: 429,
            reason: payload?.error?.status || "RESOURCE_EXHAUSTED"
          });
          continue;
        }

        if (!response.ok) {
          attempts.push({
            model,
            status: response.status,
            reason: payload?.error?.message || "Gemini request failed"
          });
          break;
        }

        const text = extractCandidateText(payload);

        if (!text) {
          attempts.push({
            model,
            status: 502,
            reason: "Gemini returned no candidate text"
          });
          break;
        }

        let parsed;
        try {
          parsed = JSON.parse(stripJsonFence(text));
        } catch {
          attempts.push({
            model,
            status: 502,
            reason: "Gemini returned invalid JSON"
          });
          break;
        }

        const identification = normaliseIdentification(parsed);

        return jsonResponse({
          ok: true,
          model,
          identification,
          offers: []
        });
      }
    }

    if (saw429) {
      return jsonResponse(
        {
          ok: false,
          code: "AI_RATE_LIMITED",
          error: "The AI service is temporarily busy.",
          details:
            "Gemini returned HTTP 429 RESOURCE_EXHAUSTED. FindIt tried its available AI fallbacks, but the provider is still rate-limiting this project.",
          retryAfterSeconds: retryAfterSeconds || 60,
          attempts
        },
        429,
        { "Retry-After": String(retryAfterSeconds || 60) }
      );
    }

    return jsonResponse(
      {
        ok: false,
        error: "FindIt could not identify this image right now.",
        attempts
      },
      502
    );
  }
};