const GEMINI_MODEL =
  "gemini-2.5-flash";


const CONFIDENCE_MIN =
  0.55;


const RESTRICTED_TERMS = [

  "firearm",

  "gun",

  "rifle",

  "pistol",

  "ammunition",

  "ammo",

  "weapon",

  "switchblade",

  "taser",

  "pepper spray",

  "vape",

  "nicotine",

  "cigarette",

  "cigar",

  "alcohol",

  "beer",

  "wine",

  "liquor",

  "cannabis",

  "marijuana",

  "thc",

  "drug",

  "gambling",

  "sports betting",

  "casino",

  "pornography",

  "adult sex toy"

];



export default {

  async fetch(request) {


    if (
      request.method !==
      "POST"
    ) {

      return json(
        {
          error:
            "POST only"
        },
        405
      );

    }


    try {


      const apiKey =
        process.env
          .GEMINI_API_KEY;


      if (!apiKey) {

        return json(

          {
            error:
              "GEMINI_API_KEY is missing in Vercel."
          },

          500

        );

      }


      const form =
        await request.formData();


      const image =
        form.get("image");


      if (

        !image ||

        typeof image.arrayBuffer !==
        "function"

      ) {

        return json(

          {
            error:
              "No image uploaded."
          },

          400

        );

      }


      if (

        !String(
          image.type || ""
        )
        .startsWith(
          "image/"
        )

      ) {

        return json(

          {
            error:
              "Uploaded file must be an image."
          },

          400

        );

      }


      if (

        image.size >

        8 *
        1024 *
        1024

      ) {

        return json(

          {
            error:
              "Image must be smaller than 8 MB."
          },

          413

        );

      }


      const lat =
        toNumber(
          form.get("lat")
        );


      const lon =
        toNumber(
          form.get("lon")
        );


      const base64 =

        Buffer
          .from(
            await image.arrayBuffer()
          )
          .toString(
            "base64"
          );


      const identification =

        await identifyWithGemini(

          apiKey,

          base64,

          image.type ||
          "image/jpeg"

        );


      const blocked =
        isRestricted(
          identification
        );


      if (blocked) {

        return json({

          identification,

          offers: [],

          blocked:
            true,

          verified:
            false,

          message:
            "FindIt cannot help search for restricted or age-limited products."

        });

      }


      const confidence =

        Number(

          identification
            .confidence || 0

        );


      if (
        confidence <
        CONFIDENCE_MIN
      ) {

        return json({

          identification,

          offers: [],

          blocked:
            false,

          verified:
            false,

          message:
            "The image was not identified confidently enough. Try a clearer photo showing the whole item, logo or model text."

        });

      }


      const products =

        await loadAuthorisedRetailerProducts();


      const offers =

        matchProducts(

          identification,

          products,

          lat,

          lon

        );


      return json({

        identification,

        offers,

        blocked:
          false,

        verified:
          offers.length > 0,

        message:

          offers.length

            ? "Verified retailer offers found from connected authorised product data."

            : "The item was identified, but no connected authorised retailer feed returned a verified matching offer yet."

      });

    }

    catch (error) {


      console.error(

        "FindIt /api/search error",

        error

      );


      return json(

        {

          error:
            "FindIt image search failed.",

          message:

            error.message ||

            "Unknown error"

        },

        500

      );

    }

  }

};



async function identifyWithGemini(

  apiKey,

  imageBase64,

  mimeType

) {


  const prompt = `

You are FindIt Nearby's product-identification engine.

Analyse the ACTUAL physical item in the uploaded photo.

Do not force it into a broad category if more specific evidence exists.

Prioritise visible brand logos, brand names, model numbers, product codes, labels, distinctive shape, colour and design.

If this is a Nike shoe, return Nike if the logo is genuinely visible and describe the likely shoe family/model only if supported by evidence.

If this is a microphone, do not call it headphones.

If it is a flower, call it a flower/plant.

If it is a car, identify make/model only when reasonably supported.

Never invent a brand or model.

Lower confidence when uncertain.

The searchQuery should be the best concise phrase for finding this exact item online or in a retailer catalogue.

features should contain short visual clues useful for product matching.

summary should be a short plain-language description.

`;


  const responseSchema = {

    type:
      "OBJECT",

    properties: {

      object: {
        type:
          "STRING"
      },

      name: {
        type:
          "STRING"
      },

      brand: {

        type:
          "STRING",

        nullable:
          true

      },

      model: {

        type:
          "STRING",

        nullable:
          true

      },

      category: {

        type:
          "STRING"

      },

      searchQuery: {

        type:
          "STRING"

      },

      confidence: {

        type:
          "NUMBER"

      },

      visibleText: {

        type:
          "ARRAY",

        items: {

          type:
            "STRING"

        }

      },

      features: {

        type:
          "ARRAY",

        items: {

          type:
            "STRING"

        }

      },

      summary: {

        type:
          "STRING"

      }

    },

    required: [

      "object",

      "name",

      "category",

      "searchQuery",

      "confidence",

      "visibleText",

      "features",

      "summary"

    ]

  };


  const response =

    await fetch(

      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,

      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/json",

          "x-goog-api-key":
            apiKey

        },

        body:
          JSON.stringify({

            contents: [

              {

                parts: [

                  {
                    text:
                      prompt
                  },

                  {

                    inlineData: {

                      mimeType,

                      data:
                        imageBase64

                    }

                  }

                ]

              }

            ],

            generationConfig: {

              responseMimeType:
                "application/json",

              responseSchema,

              temperature:
                0.1

            }

          })

      }

    );


  const raw =
    await response.json();


  if (!response.ok) {

    throw new Error(

      raw?.error?.message ||

      "Gemini request failed"

    );

  }


  const text =

    raw
      ?.candidates
      ?.[0]
      ?.content
      ?.parts
      ?.find(

        (p) =>
          typeof p.text ===
          "string"

      )
      ?.text;


  if (!text) {

    throw new Error(

      "Gemini returned no identification text"

    );

  }


  const parsed =
    JSON.parse(text);


  parsed.confidence =

    clamp(

      Number(
        parsed.confidence ||
        0
      ),

      0,

      1

    );


  parsed.brand =
    cleanNullable(
      parsed.brand
    );


  parsed.model =
    cleanNullable(
      parsed.model
    );


  parsed.visibleText =

    Array.isArray(
      parsed.visibleText
    )

      ? parsed.visibleText
          .filter(Boolean)
          .slice(0, 12)

      : [];


  parsed.features =

    Array.isArray(
      parsed.features
    )

      ? parsed.features
          .filter(Boolean)
          .slice(0, 12)

      : [];


  return parsed;

}



async function loadAuthorisedRetailerProducts() {

  const configs =
    parseFeedConfigs();


  if (!configs.length) {
    return [];
  }


  const settled =

    await Promise.allSettled(

      configs.map(
        fetchRetailerFeed
      )

    );


  return settled.flatMap(

    (r) =>

      r.status ===
      "fulfilled"

        ? r.value

        : []

  );

}



function parseFeedConfigs() {

  try {

    const raw =

      process.env
        .RETAILER_FEEDS_JSON ||

      "[]";


    const value =
      JSON.parse(raw);


    return Array.isArray(
      value
    )

      ? value.filter(

          (x) =>
            x &&
            x.url &&
            x.name

        )

      : [];

  }

  catch {

    console.error(

      "RETAILER_FEEDS_JSON is invalid JSON"

    );


    return [];

  }

}



async function fetchRetailerFeed(
  config
) {

  const headers = {

    Accept:
      "application/json"

  };


  if (

    config.tokenEnv &&

    process.env[
      config.tokenEnv
    ]

  ) {

    headers.Authorization =

      `Bearer ${process.env[
        config.tokenEnv
      ]}`;

  }


  const response =
    await fetch(

      config.url,

      {
        headers
      }

    );


  if (!response.ok) {

    throw new Error(

      `${config.name} feed returned ${response.status}`

    );

  }


  const data =
    await response.json();


  const products =

    Array.isArray(data)

      ? data

      : Array.isArray(
          data.products
        )

        ? data.products

        : [];


  return products

    .map(
      (p) =>
        normalizeProduct(
          p,
          config.name
        )
    )

    .filter(Boolean);

}



function normalizeProduct(
  p,
  retailerName
) {

  if (
    !p ||
    !p.name
  ) {

    return null;

  }


  return {

    id:
      String(

        p.id ||

        p.sku ||

        p.url ||

        p.name

      ),

    name:
      String(p.name),

    brand:
      cleanNullable(
        p.brand
      ),

    model:
      cleanNullable(

        p.model ||

        p.sku

      ),

    category:
      cleanNullable(
        p.category
      ),

    keywords:

      Array.isArray(
        p.keywords
      )

        ? p.keywords
            .map(String)

        : [],

    features:

      Array.isArray(
        p.features
      )

        ? p.features
            .map(String)

        : [],

    image:
      cleanNullable(
        p.image
      ),

    url:
      cleanNullable(
        p.url
      ),

    retailer:
      retailerName,

    price:
      toNumber(
        p.price
      ),

    currency:
      p.currency ||
      "ZAR",

    stock:
      normalizeStock(
        p.stock
      ),

    stores:

      Array.isArray(
        p.stores
      )

        ? p.stores
            .map(
              normalizeStore
            )
            .filter(Boolean)

        : []

  };

}



function normalizeStock(
  stock
) {

  if (

    stock &&

    typeof stock ===
    "object"

  ) {

    return {

      status:
        stock.status ||
        "UNKNOWN",

      quantity:
        toNumber(
          stock.quantity
        ),

      updatedAt:
        stock.updatedAt ||
        null

    };

  }


  if (
    typeof stock ===
    "string"
  ) {

    return {

      status:
        stock,

      quantity:
        null,

      updatedAt:
        null

    };

  }


  return {

    status:
      "UNKNOWN",

    quantity:
      null,

    updatedAt:
      null

  };

}



function normalizeStore(
  s
) {

  if (!s?.name) {
    return null;
  }


  return {

    name:
      String(s.name),

    address:
      s.address ||
      "",

    lat:
      toNumber(
        s.lat
      ),

    lon:
      toNumber(
        s.lon
      ),

    stock:
      normalizeStock(
        s.stock
      )

  };

}



function matchProducts(

  i,

  products,

  userLat,

  userLon

) {

  const matches =
    [];


  for (
    const p
    of products
  ) {


    const match =
      productScore(
        i,
        p
      );


    if (
      match < 0.55
    ) {

      continue;

    }


    if (
      p.stores.length
    ) {

      for (
        const store
        of p.stores
      ) {

        matches.push(

          makeOffer(

            p,

            store,

            match,

            userLat,

            userLon

          )

        );

      }

    }

    else {

      matches.push(

        makeOffer(

          p,

          null,

          match,

          userLat,

          userLon

        )

      );

    }

  }


  return matches

    .filter(

      (x) =>

        x.price != null ||

        x.url ||

        x.store

    )

    .sort(

      (a, b) =>

        (
          b.match -
          a.match
        )

        ||

        valueOrInfinity(
          a.distanceKm
        )

        -

        valueOrInfinity(
          b.distanceKm
        )

    )

    .slice(
      0,
      20
    );

}



function makeOffer(

  p,

  store,

  match,

  userLat,

  userLon

) {


  const distanceKm =

    store &&

    userLat != null &&

    userLon != null &&

    store.lat != null &&

    store.lon != null

      ? haversine(

          userLat,

          userLon,

          store.lat,

          store.lon

        )

      : null;


  return {

    id:

      `${p.id}:${store?.name || "online"}`,

    name:
      p.name,

    brand:
      p.brand,

    model:
      p.model,

    image:
      p.image,

    url:
      p.url,

    retailer:
      p.retailer,

    price:
      p.price,

    currency:
      p.currency,

    match,

    stock:

      store
        ?.stock
        ?.status &&

      store.stock.status !==
      "UNKNOWN"

        ? store.stock

        : p.stock,

    store,

    distanceKm

  };

}



function productScore(
  i,
  p
) {

  const brandI =
    norm(i.brand);

  const brandP =
    norm(p.brand);

  const modelI =
    norm(i.model);

  const modelP =
    norm(p.model);


  let score =
    0;


  if (
    brandI &&
    brandP
  ) {

    score +=

      brandI ===
      brandP

        ? 0.28

        : -0.18;

  }


  if (
    modelI &&
    modelP
  ) {

    score +=

      modelI ===
      modelP

        ? 0.42

        : tokenOverlap(
            modelI,
            modelP
          ) * 0.18;

  }


  score +=

    tokenOverlap(

      norm(

        `${i.name} ${i.searchQuery} ${i.object}`

      ),

      norm(

        `${p.name} ${p.keywords.join(" ")}`

      )

    ) * 0.22;


  score +=

    tokenOverlap(

      norm(
        i.category
      ),

      norm(
        p.category
      )

    ) * 0.05;


  score +=

    tokenOverlap(

      norm(

        (
          i.features ||
          []
        ).join(" ")

      ),

      norm(

        p.features.join(" ")

      )

    ) * 0.08;


  return clamp(

    score,

    0,

    1

  );

}



function isRestricted(
  i
) {

  const text =
    norm(

      [

        i.object,

        i.name,

        i.brand,

        i.model,

        i.category,

        i.searchQuery,

        ...(
          i.visibleText ||
          []
        )

      ].join(" ")

    );


  return RESTRICTED_TERMS
    .some(

      (term) =>
        text.includes(
          term
        )

    );

}



function tokenOverlap(
  a,
  b
) {

  const A =
    new Set(
      tokenize(a)
    );

  const B =
    new Set(
      tokenize(b)
    );


  if (
    !A.size ||
    !B.size
  ) {

    return 0;

  }


  let hit =
    0;


  for (
    const x
    of A
  ) {

    if (
      B.has(x)
    ) {

      hit++;

    }

  }


  return

    hit /

    new Set(
      [
        ...A,
        ...B
      ]
    ).size;

}



function tokenize(
  s
) {

  return norm(s)

    .split(
      /[^a-z0-9]+/
    )

    .filter(
      (x) =>
        x.length > 1
    );

}



function norm(
  v
) {

  return String(
    v || ""
  )
  .toLowerCase()
  .trim();

}



function cleanNullable(
  v
) {

  const s =

    String(
      v ?? ""
    )
    .trim();


  return

    !s ||

    /^(null|unknown|not detected|n\/a)$/i
      .test(s)

      ? null

      : s;

}



function toNumber(
  v
) {

  const n =
    Number(v);


  return Number.isFinite(n)

    ? n

    : null;

}



function valueOrInfinity(
  v
) {

  return v == null

    ? Infinity

    : Number(v);

}



function clamp(
  v,
  min,
  max
) {

  return Math.max(

    min,

    Math.min(
      max,
      v
    )

  );

}



function haversine(
  a,
  b,
  c,
  d
) {

  const R =
    6371;

  const p =
    Math.PI / 180;


  const x =

    Math.sin(
      (c - a) *
      p /
      2
    ) ** 2

    +

    Math.cos(
      a * p
    )

    *

    Math.cos(
      c * p
    )

    *

    Math.sin(
      (d - b) *
      p /
      2
    ) ** 2;


  return

    R *

    2 *

    Math.atan2(

      Math.sqrt(x),

      Math.sqrt(
        1 - x
      )

    );

}



function json(
  body,
  status = 200
) {

  return new Response(

    JSON.stringify(
      body
    ),

    {

      status,

      headers: {

        "Content-Type":
          "application/json; charset=utf-8",

        "Cache-Control":
          "no-store"

      }

    }

  );

}
