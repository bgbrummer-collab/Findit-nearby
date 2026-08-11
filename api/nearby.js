const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter"
];

const GROUPS = {
  grocery: [
    "supermarket",
    "convenience",
    "general",
    "department_store",
    "variety_store"
  ],
  clothing: [
    "clothes",
    "shoes",
    "sports",
    "department_store"
  ],
  electronics: [
    "electronics",
    "computer",
    "mobile_phone",
    "hifi",
    "musical_instrument",
    "department_store"
  ],
  home: [
    "hardware",
    "doityourself",
    "lighting",
    "furniture",
    "houseware",
    "department_store"
  ],
  stationery: [
    "stationery",
    "books",
    "variety_store",
    "department_store"
  ],
  garden: [
    "florist",
    "garden_centre",
    "supermarket"
  ],
  automotive: [
    "car",
    "car_parts",
    "tyres"
  ],
  general: [
    "department_store",
    "mall",
    "general",
    "variety_store",
    "supermarket",
    "convenience"
  ]
};

const KNOWN_SA_RETAILERS = [
  "checkers",
  "shoprite",
  "pick n pay",
  "pnp",
  "woolworths",
  "spar",
  "food lover",
  "makro",
  "game"
];

function clean(value) {
  return String(value || "").trim().toLowerCase();
}

function chooseGroup(i = {}) {
  const text = clean([
    i.object,
    i.name,
    i.category,
    i.searchQuery,
    ...(Array.isArray(i.visibleText) ? i.visibleText : [])
  ].join(" "));

  if (/tissue|toilet paper|paper towel|grocery|food|drink|snack|cleaning|soap|shampoo|household/.test(text)) {
    return "grocery";
  }

  if (/shoe|sneaker|shirt|sweater|hoodie|jacket|dress|clothing|fashion|apparel/.test(text)) {
    return "clothing";
  }

  if (/microphone|headphone|headset|speaker|phone|smartphone|camera|computer|laptop|electronic/.test(text)) {
    return "electronics";
  }

  if (/light|lamp|hardware|furniture|chair|appliance|homeware|tool/.test(text)) {
    return "home";
  }

  if (/pencil|stationery|book|school/.test(text)) {
    return "stationery";
  }

  if (/flower|plant|garden/.test(text)) {
    return "garden";
  }

  if (/car|vehicle|automotive|mustang|tyre|tire/.test(text)) {
    return "automotive";
  }

  return "general";
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const p = Math.PI / 180;

  const dLat = (lat2 - lat1) * p;
  const dLon = (lon2 - lon1) * p;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * p) *
      Math.cos(lat2 * p) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildQuery(lat, lon, radiusMetres, tags) {
  const shopQueries = tags
    .map(tag => `nwr(around:${radiusMetres},${lat},${lon})["shop"="${tag}"];`)
    .join("");

  // Also look for well-known SA retailer names. This helps when a store is
  // tagged imperfectly but still exists in OpenStreetMap with its name.
  const retailerQueries = KNOWN_SA_RETAILERS
    .map(name => `nwr(around:${radiusMetres},${lat},${lon})["name"~"${name}",i];`)
    .join("");

  return `[out:json][timeout:18];(${shopQueries}${retailerQueries});out center tags;`;
}

async function fetchOverpass(query) {
  let lastError = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded;charset=UTF-8"
        },
        body: "data=" + encodeURIComponent(query),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`Overpass ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Nearby provider unavailable");
}

function normalise(elements, userLat, userLon, maxKm) {
  const seen = new Map();

  for (const element of elements || []) {
    const tags = element.tags || {};
    const lat = element.lat ?? element.center?.lat;
    const lon = element.lon ?? element.center?.lon;

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      continue;
    }

    const distance = distanceKm(userLat, userLon, lat, lon);

    // Hard safety rule: NEVER let a result outside the active radius leak through.
    if (distance > maxKm + 0.05) {
      continue;
    }

    const name = tags.name || tags.brand || tags.operator;

    if (!name) {
      continue;
    }

    const key =
      clean(name) +
      "|" +
      Math.round(lat * 1000) +
      "|" +
      Math.round(lon * 1000);

    const store = {
      name,
      type: tags.shop || "retail",
      distanceKm: distance,
      lat,
      lon,
      address: [
        tags["addr:housenumber"],
        tags["addr:street"],
        tags["addr:suburb"],
        tags["addr:city"]
      ]
        .filter(Boolean)
        .join(" "),
      openingHours: tags.opening_hours || null
    };

    if (!seen.has(key) || distance < seen.get(key).distanceKm) {
      seen.set(key, store);
    }
  }

  return [...seen.values()].sort(
    (a, b) => a.distanceKm - b.distanceKm
  );
}

export default async function handler(req, res) {
  res.setHeader(
    "Cache-Control",
    "s-maxage=180, stale-while-revalidate=600"
  );

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const {
      lat,
      lon,
      identification = {}
    } = req.body || {};

    const userLat = Number(lat);
    const userLon = Number(lon);

    if (
      !Number.isFinite(userLat) ||
      !Number.isFinite(userLon)
    ) {
      return res.status(400).json({
        error: "Valid location required"
      });
    }

    const group = chooseGroup(identification);

    const tags = [
      ...new Set([
        ...(GROUPS[group] || []),
        ...GROUPS.general
      ])
    ];

    // Important change:
    // Search very close first and NEVER show anything beyond 10 km.
    const stages = [3, 5, 10];

    let stores = [];
    let radiusKm = 3;

    for (const stageRadiusKm of stages) {
      radiusKm = stageRadiusKm;

      const data = await fetchOverpass(
        buildQuery(
          userLat,
          userLon,
          stageRadiusKm * 1000,
          tags
        )
      );

      stores = normalise(
        data.elements,
        userLat,
        userLon,
        stageRadiusKm
      );

      // If we have at least 4 close options, stop.
      if (stores.length >= 4) {
        break;
      }
    }

    // Final hard rules:
    // - never over 10 km
    // - nearest first
    // - max 8 results
    stores = stores
      .filter(store => store.distanceKm <= 10)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 8);

    // If all returned stores are still unhelpfully far away,
    // don't show a misleading list.
    const closestDistance =
      stores.length > 0
        ? stores[0].distanceKm
        : null;

    const reliable =
      stores.length > 0 &&
      closestDistance !== null &&
      closestDistance <= 10;

    return res.status(200).json({
      ok: true,
      source: "OpenStreetMap / Overpass",
      categoryGroup: group,
      radiusKm,
      reliable,
      stores: reliable ? stores : [],
      message: reliable
        ? `Showing the closest relevant mapped retailers within ${radiusKm} km.`
        : "No reliable nearby mapped stores were found within 10 km.",
      disclaimer:
        "Nearby stores are relevant retailer types, not proof that the exact item is in stock."
    });
  } catch (error) {
    console.error("nearby error", error);

    return res.status(503).json({
      ok: false,
      reliable: false,
      stores: [],
      error:
        "Nearby store search is temporarily unavailable."
    });
  }
}
