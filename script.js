const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const API_BASE = window.FINDIT_API_BASE || "/api";

const els = {
  photo: $("#photo"),
  cameraInput: $("#cameraInput"),
  preview: $("#preview"),
  emptyState: $("#emptyState"),
  search: $("#search"),
  location: $("#location"),
  status: $("#status"),
  overlay: $("#loadingOverlay"),
  loadingTitle: $("#loadingTitle"),
  loadingText: $("#loadingText"),
  results: $("#results"),
  stores: $("#stores"),
  nearbyCount: $("#nearbyCount"),
  locationLabel: $("#locationLabel"),
  resultImage: $("#resultImage"),
  resultTitle: $("#resultTitle"),
  resultSubtitle: $("#resultSubtitle"),
  matchText: $("#matchText"),
  confidenceNumber: $("#confidenceNumber"),
  confidenceRing: $("#confidenceRing"),
  confidenceLabel: $("#confidenceLabel"),
  productTags: $("#productTags"),
  detailsContent: $("#detailsContent"),
  verifiedOffers: $("#verifiedOffers"),
  verifiedNotice: $("#verifiedNotice"),
  comparisonContent: $("#comparisonContent"),
  lowConfidence: $("#lowConfidence"),
  recentModal: $("#recentModal"),
  recentList: $("#recentList")
};

let selectedFile = null;
let coords = null;
let searching = false;
let lastResult = null;
let map = null;
let mapLarge = null;

const RECENT_KEY = "findit_recent_searches";

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalise(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function safeUrl(value) {
  if (!value) return null;

  let url = String(value).trim();

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  try {
    const parsed = new URL(url);

    return ["http:", "https:"].includes(parsed.protocol)
      ? parsed.href
      : null;
  } catch {
    return null;
  }
}

function phoneHref(value) {
  return String(value || "")
    .replace(/[^\d+]/g, "");
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const p = Math.PI / 180;

  const a =
    Math.sin(((lat2 - lat1) * p) / 2) ** 2 +
    Math.cos(lat1 * p) *
      Math.cos(lat2 * p) *
      Math.sin(((lon2 - lon1) * p) / 2) ** 2;

  return (
    R *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
}

function showLoading(title, text) {
  if (els.loadingTitle) {
    els.loadingTitle.textContent = title;
  }

  if (els.loadingText) {
    els.loadingText.textContent = text;
  }

  els.overlay?.classList.remove("hidden");
}

function hideLoading() {
  els.overlay?.classList.add("hidden");
}

function setSearchBusy(busy) {
  searching = busy;

  if (!els.search) {
    return;
  }

  els.search.disabled =
    busy ||
    !selectedFile;

  els.search.textContent =
    busy
      ? "◎ Finding your item…"
      : "◎ Identify this item";
}


/* =========================================================
   RETAILER DIRECTORY
========================================================= */

const RETAILERS = [
  {
    keys: ["pna"],
    domain: "pna.co.za",
    website: "https://www.pna.co.za"
  },
  {
    keys: ["totalsports", "total sports"],
    domain: "totalsports.co.za",
    website: "https://www.totalsports.co.za"
  },
  {
    keys: ["footgear"],
    domain: "footgear.co.za",
    website: "https://www.footgear.co.za"
  },
  {
    keys: ["sportscene"],
    domain: "sportscene.co.za",
    website: "https://www.sportscene.co.za"
  },
  {
    keys: [
      "sportsmans warehouse",
      "sportsman warehouse"
    ],
    domain: "sportsmanswarehouse.co.za",
    website: "https://www.sportsmanswarehouse.co.za"
  },
  {
    keys: ["jd sports"],
    domain: "jdsports.co.za",
    website: "https://www.jdsports.co.za"
  },
  {
    keys: ["studio 88"],
    domain: "studio-88.co.za",
    website: "https://www.studio-88.co.za"
  },
  {
    keys: ["mr price sport"],
    domain: "mrpsport.com",
    website: "https://www.mrpsport.com"
  },
  {
    keys: ["nike"],
    domain: "nike.com",
    website: "https://www.nike.com"
  },
  {
    keys: ["adidas"],
    domain: "adidas.co.za",
    website: "https://www.adidas.co.za"
  },
  {
    keys: ["puma"],
    domain: "puma.com",
    website: "https://www.puma.com"
  },
  {
    keys: ["skechers"],
    domain: "skechers.co.za",
    website: "https://www.skechers.co.za"
  },
  {
    keys: ["incredible connection"],
    domain: "incredible.co.za",
    website: "https://www.incredible.co.za"
  },
  {
    keys: ["makro"],
    domain: "makro.co.za",
    website: "https://www.makro.co.za"
  },
  {
    keys: ["game"],
    domain: "game.co.za",
    website: "https://www.game.co.za"
  },
  {
    keys: ["clicks"],
    domain: "clicks.co.za",
    website: "https://www.clicks.co.za"
  },
  {
    keys: ["dis chem", "dischem"],
    domain: "dischem.co.za",
    website: "https://www.dischem.co.za"
  },
  {
    keys: ["checkers"],
    domain: "checkers.co.za",
    website: "https://www.checkers.co.za"
  },
  {
    keys: ["pick n pay", "pnp"],
    domain: "pnp.co.za",
    website: "https://www.pnp.co.za"
  },
  {
    keys: ["woolworths"],
    domain: "woolworths.co.za",
    website: "https://www.woolworths.co.za"
  },
  {
    keys: ["spar"],
    domain: "spar.co.za",
    website: "https://www.spar.co.za"
  }
];

const SINGLE_BRANDS = new Set([
  "nike",
  "adidas",
  "puma",
  "reebok",
  "converse",
  "vans",
  "new balance",
  "under armour",
  "asics",
  "skechers",
  "crocs",
  "fila",
  "salomon",
  "hoka",
  "apple",
  "samsung",
  "huawei",
  "xiaomi",
  "sony",
  "lg",
  "bose",
  "jbl",
  "canon",
  "nikon",
  "lenovo",
  "hp",
  "dell",
  "acer",
  "asus",
  "logitech",
  "microsoft"
]);

const MULTIBRAND = [
  "totalsports",
  "total sports",
  "footgear",
  "sportscene",
  "sportsmans warehouse",
  "sportsman warehouse",
  "jd sports",
  "studio 88",
  "mr price sport",
  "pna",
  "takealot",
  "makro",
  "incredible connection",
  "game",
  "woolworths",
  "edgars",
  "clicks",
  "dis chem",
  "dischem",
  "checkers",
  "pick n pay",
  "pnp",
  "spar"
];

function retailerInfo(name) {
  const n = normalise(name);

  return (
    RETAILERS.find((retailer) =>
      retailer.keys.some((key) =>
        n.includes(key)
      )
    ) || null
  );
}


/* =========================================================
   PHOTO INPUT
========================================================= */

function acceptFile(file) {
  if (!file) {
    return;
  }

  if (
    !file.type ||
    !file.type.startsWith("image/")
  ) {
    if (els.status) {
      els.status.textContent =
        "Please choose an image file.";
    }

    return;
  }

  if (file.size > 8000000) {
    if (els.status) {
      els.status.textContent =
        "Please use an image smaller than 8 MB.";
    }

    return;
  }

  selectedFile = file;
  lastResult = null;

  if (els.preview) {
    els.preview.src =
      URL.createObjectURL(file);

    els.preview.style.display =
      "block";
  }

  if (els.emptyState) {
    els.emptyState.style.display =
      "none";
  }

  if (els.status) {
    els.status.textContent =
      "Photo ready. Tap Identify this item once.";
  }

  els.results?.classList.add(
    "hidden"
  );

  setSearchBusy(false);
}

els.photo?.addEventListener(
  "change",
  () =>
    acceptFile(
      els.photo.files?.[0]
    )
);

els.cameraInput?.addEventListener(
  "change",
  () =>
    acceptFile(
      els.cameraInput.files?.[0]
    )
);

$("#heroUpload")
  ?.addEventListener(
    "click",
    () =>
      els.photo?.click()
  );

$("#heroCamera")
  ?.addEventListener(
    "click",
    () =>
      els.cameraInput?.click()
  );


/* =========================================================
   DRAG AND DROP
========================================================= */

[
  $("#heroDropzone"),
  $("#finderDropzone")
]
  .filter(Boolean)
  .forEach((zone) => {

    zone.addEventListener(
      "dragover",
      (event) => {
        event.preventDefault();

        zone.classList.add(
          "dragging"
        );
      }
    );

    zone.addEventListener(
      "dragleave",
      () =>
        zone.classList.remove(
          "dragging"
        )
    );

    zone.addEventListener(
      "drop",
      (event) => {
        event.preventDefault();

        zone.classList.remove(
          "dragging"
        );

        acceptFile(
          event.dataTransfer
            ?.files?.[0]
        );

        $("#finder")
          ?.scrollIntoView({
            behavior:
              "smooth"
          });
      }
    );
  });


/* =========================================================
   LOCATION
========================================================= */

function getLocation() {
  return new Promise(
    (resolve, reject) => {

      if (
        !navigator.geolocation
      ) {
        reject(
          new Error(
            "Location is not supported by this browser."
          )
        );

        return;
      }

      navigator.geolocation
        .getCurrentPosition(
          (position) => {

            coords = {
              lat:
                position.coords.latitude,

              lon:
                position.coords.longitude
            };

            resolve(coords);
          },

          reject,

          {
            enableHighAccuracy:
              true,

            timeout:
              15000,

            maximumAge:
              300000
          }
        );
    }
  );
}

async function ensureLocation() {
  if (
    coords &&
    Number.isFinite(coords.lat) &&
    Number.isFinite(coords.lon)
  ) {
    return coords;
  }

  if (els.location) {
    els.location.textContent =
      "⌖ Getting location…";
  }

  const result =
    await getLocation();

  if (els.location) {
    els.location.textContent =
      "✓ Location ready";
  }

  if (els.locationLabel) {
    els.locationLabel.textContent =
      "your current location";
  }

  return result;
}

els.location
  ?.addEventListener(
    "click",
    async () => {

      if (
        els.location.disabled
      ) {
        return;
      }

      els.location.disabled =
        true;

      try {
        showLoading(
          "Getting your location…",
          "Allow location so FindIt can show nearby retailers."
        );

        await ensureLocation();

        if (
          lastResult
            ?.identification
        ) {
          showLoading(
            "Finding nearby retailers…",
            "Checking stores that match this product."
          );

          await renderNearby(
            lastResult.identification
          );
        }

        if (els.status) {
          els.status.textContent =
            "Location ready.";
        }

      } catch (error) {
        console.error(
          "Location error:",
          error
        );

        els.location.textContent =
          "⌖ Try location again";

        if (els.status) {
          els.status.textContent =
            "We couldn't get your location. Please allow location access and try again.";
        }

      } finally {
        hideLoading();

        els.location.disabled =
          false;
      }
    }
  );

$("#changeLocation")
  ?.addEventListener(
    "click",
    async () => {

      coords = null;

      if (els.location) {
        els.location.textContent =
          "⌖ Use my location";
      }

      try {
        showLoading(
          "Updating location…",
          "Your browser may ask for permission."
        );

        await ensureLocation();

        if (
          lastResult
            ?.identification
        ) {
          showLoading(
            "Finding nearby retailers…",
            "Refreshing results near you."
          );

          await renderNearby(
            lastResult.identification
          );
        }

      } catch (error) {
        console.error(
          "Change location error:",
          error
        );

        if (els.status) {
          els.status.textContent =
            "Could not update location.";
        }

      } finally {
        hideLoading();
      }
    }
  );


/* =========================================================
   AI SEARCH
========================================================= */

async function identifyItem() {
  if (!selectedFile) {
    throw new Error(
      "Choose a photo first."
    );
  }

  const form =
    new FormData();

  form.append(
    "image",
    selectedFile,
    selectedFile.name ||
      "upload.jpg"
  );

  const response =
    await fetch(
      `${API_BASE}/search`,
      {
        method: "POST",
        body: form
      }
    );

  let data;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      "FindIt received an unreadable AI response."
    );
  }

  if (
    !response.ok ||
    data.ok === false
  ) {
    const message =
      data.details ||
      data.error ||
      "Image identification failed.";

    if (
      /quota|rate|429/i.test(
        message
      )
    ) {
      throw new Error(
        "The AI service is temporarily at its usage limit. Please try again later."
      );
    }

    throw new Error(
      message
    );
  }

  return data;
}


/* =========================================================
   NEARBY API
========================================================= */

async function fetchNearby(item) {
  if (!coords) {
    throw new Error(
      "Location is required."
    );
  }

  const payload = {
    lat: coords.lat,
    lon: coords.lon,
    category:
      item?.category || "",
    object:
      item?.object || "",
    brand:
      item?.brand || "",
    searchQuery:
      item?.searchQuery || ""
  };

  const response =
    await fetch(
      `${API_BASE}/nearby`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(
            payload
          )
      }
    );

  let data;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      "Nearby-store service returned an unreadable response."
    );
  }

  if (
    !response.ok ||
    data.ok !== true
  ) {
    throw new Error(
      data.error ||
      "Nearby retailer service is temporarily unavailable."
    );
  }

  return Array.isArray(
    data.elements
  )
    ? data.elements
    : [];
}


/* =========================================================
   PRODUCT CATEGORY MATCHING
========================================================= */

function categoryProfile(item) {
  const text =
    normalise(
      [
        item?.object,
        item?.name,
        item?.brand,
        item?.model,
        item?.category,
        item?.searchQuery,

        Array.isArray(
          item?.visibleText
        )
          ? item.visibleText.join(
              " "
            )
          : ""
      ]
        .filter(Boolean)
        .join(" ")
    );

  const profile =
    (
      family,
      types,
      words,
      blocked = []
    ) => ({
      family,
      types,
      words,
      blocked,
      strict: true
    });

  if (
    /shoe|sneaker|footwear|trainer|boot|sandal/
      .test(text)
  ) {
    return profile(
      "footwear",

      [
        "shoes",
        "sports",
        "clothes",
        "department_store"
      ],

      [
        "shoe",
        "sneaker",
        "footwear",
        "sport"
      ],

      [
        "florist",
        "beauty",
        "chemist",
        "stationery",
        "hardware",
        "furniture",
        "garden_centre"
      ]
    );
  }

  if (
    /pencil case|pencil|pen|stationery|notebook|marker|stapler|eraser|ruler|highlighter|school supplies|office supplies/
      .test(text)
  ) {
    return profile(
      "stationery",

      [
        "stationery",
        "books",
        "variety_store",
        "department_store"
      ],

      [
        "stationery",
        "office",
        "school",
        "book"
      ],

      [
        "sports",
        "shoes",
        "florist",
        "beauty",
        "chemist",
        "hardware",
        "furniture"
      ]
    );
  }

  if (
    /food|grocery|supermarket|snack|sauce|spread|jam|butter|icing|frosting|buttercream|butter cream|baking|flour|sugar|milk|bread|cereal|chocolate|sweet|candy|coffee|tea|juice|drink|beverage|syrup|soup|pasta|rice|cookie|biscuit|chips|lemon curd|lemon butter/
      .test(text)
  ) {
    return profile(
      "food",

      [
        "supermarket",
        "convenience",
        "deli",
        "bakery",
        "general",
        "department_store"
      ],

      [
        "food",
        "grocery",
        "supermarket",
        "bakery",
        "baking"
      ],

      [
        "sports",
        "shoes",
        "clothes",
        "electronics",
        "computer",
        "hardware",
        "furniture",
        "florist",
        "mobile_phone",
        "stationery",
        "books",
        "beauty"
      ]
    );
  }

  if (
    /skin care|skincare|body cream|face cream|hand cream|lotion|moisturizer|moisturiser|cosmetic|makeup|beauty|serum|shampoo|conditioner|soap|deodorant|perfume|fragrance|body wash|face wash/
      .test(text)
  ) {
    return profile(
      "beauty",

      [
        "beauty",
        "chemist",
        "cosmetics",
        "perfumery",
        "supermarket",
        "department_store"
      ],

      [
        "beauty",
        "cosmetic",
        "skin",
        "pharmacy",
        "chemist"
      ],

      [
        "sports",
        "shoes",
        "electronics",
        "computer",
        "hardware",
        "furniture",
        "stationery",
        "books"
      ]
    );
  }

  if (
    /medicine|medication|pharmacy|chemist|vitamin|painkiller|bandage|first aid|medical supply/
      .test(text)
  ) {
    return profile(
      "pharmacy",

      [
        "chemist",
        "pharmacy",
        "medical_supply"
      ],

      [
        "pharmacy",
        "chemist",
        "medical"
      ],

      [
        "sports",
        "shoes",
        "clothes",
        "electronics",
        "hardware",
        "furniture",
        "florist",
        "stationery"
      ]
    );
  }

  if (
    /microphone|headphone|earphone|speaker|audio|sound|amplifier|earbud/
      .test(text)
  ) {
    return profile(
      "audio",

      [
        "electronics",
        "music",
        "hifi",
        "computer"
      ],

      [
        "audio",
        "music",
        "sound",
        "electronics"
      ],

      [
        "sports",
        "shoes",
        "florist",
        "beauty",
        "chemist",
        "stationery",
        "furniture",
        "hardware"
      ]
    );
  }

  if (
    /smartphone|mobile phone|iphone|android phone|cellphone|cell phone/
      .test(text)
  ) {
    return profile(
      "mobile",

      [
        "mobile_phone",
        "electronics",
        "computer"
      ],

      [
        "mobile",
        "phone",
        "electronics"
      ],

      [
        "sports",
        "shoes",
        "florist",
        "beauty",
        "chemist",
        "stationery",
        "furniture",
        "hardware"
      ]
    );
  }

  if (
    /computer|laptop|monitor|keyboard|mouse|printer|desktop pc|gaming pc/
      .test(text)
  ) {
    return profile(
      "computer",

      [
        "computer",
        "electronics"
      ],

      [
        "computer",
        "technology",
        "electronics"
      ],

      [
        "sports",
        "shoes",
        "florist",
        "beauty",
        "chemist",
        "furniture"
      ]
    );
  }

  if (
    /camera|photography|camera lens|dslr|mirrorless/
      .test(text)
  ) {
    return profile(
      "camera",

      [
        "camera",
        "electronics"
      ],

      [
        "camera",
        "photography"
      ],

      [
        "sports",
        "shoes",
        "florist",
        "beauty",
        "chemist",
        "stationery",
        "furniture"
      ]
    );
  }

  if (
    /shirt|t shirt|tshirt|sweater|hoodie|jacket|dress|clothing|fashion|jeans|pants|trousers|shorts|skirt|coat/
      .test(text)
  ) {
    return profile(
      "clothing",

      [
        "clothes",
        "fashion",
        "department_store"
      ],

      [
        "clothes",
        "fashion",
        "clothing"
      ],

      [
        "electronics",
        "computer",
        "chemist",
        "hardware",
        "furniture",
        "florist",
        "stationery"
      ]
    );
  }

  if (
    /flower|plant|bouquet|rose|orchid|succulent/
      .test(text)
  ) {
    return profile(
      "plants",

      [
        "florist",
        "garden_centre"
      ],

      [
        "flower",
        "florist",
        "plant",
        "garden"
      ],

      [
        "sports",
        "shoes",
        "electronics",
        "computer",
        "chemist",
        "stationery",
        "furniture"
      ]
    );
  }

  if (
    /chair|table|desk|sofa|couch|furniture|cabinet|shelf|bookshelf|wardrobe|bed frame/
      .test(text)
  ) {
    return profile(
      "furniture",

      [
        "furniture",
        "houseware",
        "interior_decoration"
      ],

      [
        "furniture",
        "home",
        "interior"
      ],

      [
        "sports",
        "shoes",
        "electronics",
        "florist",
        "chemist",
        "stationery"
      ]
    );
  }

  if (
    /book|novel|textbook|magazine|comic book/
      .test(text)
  ) {
    return profile(
      "books",

      [
        "books",
        "stationery"
      ],

      [
        "book",
        "books"
      ],

      [
        "sports",
        "shoes",
        "electronics",
        "florist",
        "chemist",
        "furniture"
      ]
    );
  }

  if (
    /tool|drill|hammer|hardware|screwdriver|saw|spanner|wrench|pliers/
      .test(text)
  ) {
    return profile(
      "tools",

      [
        "hardware",
        "doityourself",
        "trade"
      ],

      [
        "hardware",
        "tool",
        "tools"
      ],

      [
        "sports",
        "shoes",
        "florist",
        "beauty",
        "chemist",
        "stationery",
        "furniture"
      ]
    );
  }

  if (
    /toy|lego|board game|video game|gaming console|playstation|xbox|nintendo/
      .test(text)
  ) {
    return profile(
      "toys-games",

      [
        "toys",
        "games",
        "video_games",
        "electronics",
        "variety_store"
      ],

      [
        "toy",
        "game",
        "games"
      ],

      [
        "florist",
        "beauty",
        "chemist",
        "hardware",
        "furniture"
      ]
    );
  }

  return {
    family: "unknown",
    types: [],
    words: [],
    blocked: [],
    strict: false
  };
}


/* =========================================================
   STORE DATA
========================================================= */

function extractStore(place) {
  const lat =
    Number(
      place.lat ??
      place.center?.lat
    );

  const lon =
    Number(
      place.lon ??
      place.center?.lon
    );

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon)
  ) {
    return null;
  }

  const tags =
    place.tags || {};

  const name =
    tags.name ||
    tags.brand ||
    "Unnamed retailer";

  const known =
    retailerInfo(name);

  const website =
    safeUrl(
      tags["contact:website"] ||
      tags.website
    ) ||
    known?.website ||
    null;

  const phone =
    tags["contact:phone"] ||
    tags.phone ||
    tags["contact:mobile"] ||
    tags.mobile ||
    null;

  const type =
    tags.shop ||
    (
      tags.amenity === "pharmacy"
        ? "pharmacy"
        : tags.amenity
    ) ||
    "retail";

  return {
    name,
    lat,
    lon,
    type,
    website,
    phone,

    opening:
      tags.opening_hours ||
      null,

    address: [
      tags["addr:housenumber"],
      tags["addr:street"],
      tags["addr:suburb"],
      tags["addr:city"]
    ]
      .filter(Boolean)
      .join(", "),

    tags,
    known
  };
}

function findSingleBrand(text) {
  const value =
    normalise(text);

  for (
    const brand
    of SINGLE_BRANDS
  ) {
    if (
      value === brand ||
      value.includes(
        ` ${brand} `
      ) ||
      value.startsWith(
        `${brand} `
      ) ||
      value.endsWith(
        ` ${brand}`
      )
    ) {
      return brand;
    }
  }

  return null;
}

function isMultiBrand(store) {
  const name =
    normalise(
      store.name
    );

  return MULTIBRAND
    .some(
      (retailer) =>
        name.includes(
          retailer
        )
    );
}

function retailerScore(
  store,
  item,
  profile
) {
  const type =
    normalise(
      store.type
    );

  const name =
    normalise(
      store.name
    );

  const blob =
    normalise(
      [
        store.name,
        store.type,
        store.tags.brand,
        store.tags.operator,
        store.tags.description
      ]
        .filter(Boolean)
        .join(" ")
    );

  const itemBrand =
    normalise(
      item?.brand
    );

  if (
    profile.blocked.includes(
      type
    )
  ) {
    return -9999;
  }

  if (
    itemBrand &&
    !isMultiBrand(store)
  ) {
    const storeBrand =
      findSingleBrand(
        store.tags.brand ||
        store.tags.name ||
        store.name
      );

    if (
      storeBrand &&
      storeBrand !== itemBrand
    ) {
      return -9999;
    }
  }

  let score = 0;

  if (
    itemBrand &&
    (
      name.includes(
        itemBrand
      ) ||
      normalise(
        store.tags.brand
      ) === itemBrand
    )
  ) {
    score += 240;
  }

  if (
    profile.types.includes(
      type
    )
  ) {
    score += 110;
  }

  if (
    isMultiBrand(store)
  ) {
    score += 35;
  }

  if (
    store.known
  ) {
    score += 10;
  }

  for (
    const word
    of profile.words
  ) {
    if (
      blob.includes(
        normalise(word)
      )
    ) {
      score += 15;
    }
  }

  if (
    profile.strict &&
    !profile.types.includes(type) &&
    !profile.words.some(
      (word) =>
        blob.includes(
          normalise(word)
        )
    )
  ) {
    score -= 100;
  }

  return score;
}

function dedupeStores(stores) {
  const kept = [];

  for (
    const store
    of stores
  ) {
    const duplicate =
      kept.find(
        (existing) =>
          normalise(
            existing.name
          ) ===
          normalise(
            store.name
          ) &&
          distanceKm(
            existing.lat,
            existing.lon,
            store.lat,
            store.lon
          ) < 1
      );

    if (
      !duplicate
    ) {
      kept.push(store);
      continue;
    }

    const informationScore =
      (value) =>
        Number(!!value.phone) +
        Number(!!value.website) +
        Number(!!value.address) +
        Number(!!value.opening);

    if (
      informationScore(store) >
      informationScore(
        duplicate
      )
    ) {
      kept[
        kept.indexOf(
          duplicate
        )
      ] = store;
    }
  }

  return kept;
}

function storeLogo(store) {
  let domain =
    store.known?.domain ||
    null;

  if (
    !domain &&
    store.website
  ) {
    try {
      domain =
        new URL(
          store.website
        )
          .hostname
          .replace(
            /^www\./,
            ""
          );
    } catch {}
  }

  return domain
    ? (
      "https://www.google.com/s2/favicons?domain=" +
      encodeURIComponent(domain) +
      "&sz=128"
    )
    : null;
}

function retailerSearchUrl(
  store,
  item
) {
  if (
    !store.website ||
    !item?.searchQuery
  ) {
    return null;
  }

  try {
    const domain =
      new URL(
        store.website
      )
        .hostname
        .replace(
          /^www\./,
          ""
        );

    return (
      "https://www.google.com/search?q=" +
      encodeURIComponent(
        `site:${domain} ${item.searchQuery}`
      )
    );

  } catch {
    return null;
  }
}


/* =========================================================
   PRODUCT RESULT
========================================================= */

function renderIdentification(data) {
  const item =
    data.identification || {};

  const confidence =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(
          Number(
            item.confidence ||
            0
          ) *
          100
        )
      )
    );

  lastResult =
    data;

  els.results
    ?.classList
    .remove("hidden");

  els.lowConfidence
    ?.classList
    .add("hidden");

  if (els.resultImage) {
    els.resultImage.src =
      els.preview?.src ||
      "";
  }

  if (els.resultTitle) {
    els.resultTitle.textContent =
      item.name ||
      item.object ||
      "Item identified";
  }

  if (els.resultSubtitle) {
    els.resultSubtitle.textContent =
      item.summary ||
      item.searchQuery ||
      "";
  }

  if (els.matchText) {
    els.matchText.textContent =
      `${confidence}% match`;
  }

  if (els.confidenceNumber) {
    els.confidenceNumber.textContent =
      `${confidence}%`;
  }

  els.confidenceRing
    ?.style
    .setProperty(
      "--score",
      `${confidence}%`
    );

  if (els.confidenceLabel) {
    els.confidenceLabel.textContent =
      confidence >= 90
        ? "Very High Match"
        : confidence >= 75
        ? "Strong Match"
        : confidence >= 55
        ? "Possible Match"
        : "Low Confidence";
  }

  if (els.productTags) {
    els.productTags.innerHTML =
      [
        item.brand,
        item.model,
        item.category
      ]
        .filter(Boolean)
        .map(
          (tag) =>
            `<span>${esc(tag)}</span>`
        )
        .join("");
  }

  const visibleText =
    Array.isArray(
      item.visibleText
    ) &&
    item.visibleText.length
      ? item.visibleText.join(", ")
      : "None detected";

  if (els.detailsContent) {
    els.detailsContent.innerHTML = `
      <div class="eyebrow">
        PRODUCT DETAILS
      </div>

      <h3>
        ${esc(
          item.name ||
          item.object ||
          "Identified item"
        )}
      </h3>

      <div class="details-grid">

        <div class="detail-box">
          <small>Object</small>
          <b>
            ${esc(
              item.object ||
              "Unknown"
            )}
          </b>
        </div>

        <div class="detail-box">
          <small>Brand</small>
          <b>
            ${esc(
              item.brand ||
              "Not detected"
            )}
          </b>
        </div>

        <div class="detail-box">
          <small>Model</small>
          <b>
            ${esc(
              item.model ||
              "Not detected"
            )}
          </b>
        </div>

        <div class="detail-box">
          <small>Category</small>
          <b>
            ${esc(
              item.category ||
              "Not detected"
            )}
          </b>
        </div>

        <div class="detail-box">
          <small>Colour</small>
          <b>
            ${esc(
              item.color ||
              "Not detected"
            )}
          </b>
        </div>

        <div class="detail-box">
          <small>Visible text</small>
          <b>
            ${esc(
              visibleText
            )}
          </b>
        </div>

        <div class="detail-box">
          <small>Search phrase</small>
          <b>
            ${esc(
              item.searchQuery ||
              "Not available"
            )}
          </b>
        </div>

        <div class="detail-box">
          <small>Confidence</small>
          <b>
            ${confidence}%
          </b>
        </div>

      </div>
    `;
  }

  renderVerifiedOffers(
    data
  );
}


/* =========================================================
   VERIFIED PRICES / STOCK
========================================================= */

function renderVerifiedOffers(data) {
  const offers =
    Array.isArray(
      data.offers
    )
      ? data.offers
      : [];

  if (
    !offers.length
  ) {
    if (
      els.verifiedOffers
    ) {
      els.verifiedOffers.innerHTML =
        "";
    }

    if (
      els.comparisonContent
    ) {
      els.comparisonContent.innerHTML = `
        <div class="feature-icon">
          ⇄
        </div>

        <h3>
          Ready for real retailer prices.
        </h3>

        <p>
          FindIt only displays prices and exact stock
          when a legitimate retailer catalogue or
          inventory connection supplies them.
        </p>
      `;
    }

    return;
  }

  if (
    els.verifiedNotice
  ) {
    els.verifiedNotice.textContent =
      "✓ Verified retailer offers are available for this item.";
  }

  const html =
    offers
      .map(
        (offer) => {
          const store =
            offer.store || {};

          const price =
            offer.price == null
              ? "Price unavailable"
              : new Intl.NumberFormat(
                  "en-ZA",
                  {
                    style:
                      "currency",

                    currency:
                      offer.currency ||
                      "ZAR"
                  }
                )
                .format(
                  Number(
                    offer.price
                  )
                );

          return `
            <article class="offer-card">

              <div>

                <b>
                  ${esc(
                    offer.name ||
                    lastResult
                      ?.identification
                      ?.name ||
                    "Product"
                  )}
                </b>

                <div>
                  ${esc(
                    store.name ||
                    offer.retailer ||
                    "Retailer"
                  )}
                </div>

                <small class="offer-stock">
                  ${esc(
                    offer.stock
                      ?.status ||
                    "Stock status unavailable"
                  )}
                </small>

              </div>

              <div class="offer-price">
                ${esc(price)}
              </div>

            </article>
          `;
        }
      )
      .join("");

  if (
    els.verifiedOffers
  ) {
    els.verifiedOffers.innerHTML =
      `<div class="offer-grid">${html}</div>`;
  }

  if (
    els.comparisonContent
  ) {
    els.comparisonContent.innerHTML =
      `<div class="offer-grid">${html}</div>`;
  }
}


/* =========================================================
   NEARBY RESULTS
========================================================= */

async function renderNearby(item) {
  if (!coords) {
    return;
  }

  const profile =
    categoryProfile(item);

  if (
    profile.family ===
    "unknown"
  ) {
    if (els.stores) {
      els.stores.innerHTML = `
        <div class="empty-card">

          FindIt identified the item,
          but isn't confident enough about
          which type of retailer should sell it.

          <br><br>

          Try a clearer image showing
          the label, packaging or brand.

        </div>
      `;
    }

    if (
      els.nearbyCount
    ) {
      els.nearbyCount.textContent =
        "";
    }

    updateMaps([]);

    return;
  }

  const raw =
    await fetchNearby(
      item
    );

  let stores =
    raw
      .map(
        extractStore
      )
      .filter(Boolean)
      .map(
        (store) => ({
          ...store,

          score:
            retailerScore(
              store,
              item,
              profile
            ),

          distance:
            distanceKm(
              coords.lat,
              coords.lon,
              store.lat,
              store.lon
            )
        })
      )
      .filter(
        (store) =>
          store.score >= 40
      )
      .sort(
        (a, b) =>
          b.score -
            a.score ||
          a.distance -
            b.distance
      );

  const seen =
    new Set();

  stores =
    stores.filter(
      (store) => {
        const key =
          `${normalise(store.name)}|` +
          `${store.lat.toFixed(5)}|` +
          `${store.lon.toFixed(5)}`;

        if (
          seen.has(key)
        ) {
          return false;
        }

        seen.add(key);

        return true;
      }
    );

  stores =
    dedupeStores(
      stores
    )
      .slice(
        0,
        12
      );

  if (
    els.nearbyCount
  ) {
    els.nearbyCount.textContent =
      stores.length
        ? `(${stores.length})`
        : "";
  }

  if (
    !stores.length
  ) {
    if (els.stores) {
      els.stores.innerHTML = `
        <div class="empty-card">

          FindIt couldn't find a strong nearby
          retailer match for this item.

          <br><br>

          We would rather show no result than
          send you to unrelated shops.

        </div>
      `;
    }

    updateMaps([]);

    return;
  }

  if (els.stores) {
    els.stores.innerHTML =
      stores
        .map(
          (
            store,
            index
          ) => {

            const directions =
              "https://www.google.com/maps/dir/?api=1&destination=" +
              encodeURIComponent(
                `${store.lat},${store.lon}`
              );

            const logo =
              storeLogo(store);

            const searchUrl =
              retailerSearchUrl(
                store,
                item
              );

            const fallback =
              esc(
                store.name
                  .charAt(0)
                  .toUpperCase()
              );

            const logoHtml =
              logo
                ? `
                  <img
                    src="${esc(logo)}"
                    alt=""
                    onerror="this.parentElement.textContent='${fallback}'"
                  >
                `
                : fallback;

            const relevance =
              store.score >= 200
                ? "Best brand match"
                : store.score >= 110
                ? "Strong retailer match"
                : "Relevant retailer";

            return `
              <article class="store-card">

                <div class="store-logo">
                  ${logoHtml}
                </div>

                <div>

                  <div class="store-title">

                    <span class="rank-pill">
                      ${index + 1}
                    </span>

                    ${esc(store.name)}

                    <span class="relevance-chip">
                      ${esc(relevance)}
                    </span>

                  </div>

                  <div class="store-sub">

                    ${esc(
                      store.address ||
                      store.type
                    )}

                    <br>

                    ${store.distance.toFixed(1)}
                    km away

                    ${
                      store.opening
                        ? ` • ${esc(store.opening)}`
                        : ""
                    }

                  </div>

                  <div class="store-actions">

                    ${
                      store.phone
                        ? `
                          <a
                            href="tel:${esc(
                              phoneHref(
                                store.phone
                              )
                            )}"
                          >
                            ☎ Call
                          </a>
                        `
                        : ""
                    }

                    ${
                      store.website
                        ? `
                          <a
                            href="${esc(store.website)}"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            ▣ Website
                          </a>
                        `
                        : ""
                    }

                    ${
                      searchUrl
                        ? `
                          <a
                            href="${esc(searchUrl)}"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            ⌕ Search retailer
                          </a>
                        `
                        : ""
                    }

                    <a
                      href="${esc(directions)}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ⌖ Directions
                    </a>

                  </div>

                </div>

                <div class="store-side">

                  <div class="store-distance">
                    ${store.distance.toFixed(1)}
                    km
                  </div>

                  <div class="store-stock">
                    Exact stock not verified
                  </div>

                </div>

              </article>
            `;
          }
        )
        .join("");
  }

  updateMaps(
    stores
  );
}


/* =========================================================
   MAP
========================================================= */

function createMap(id) {
  if (
    typeof L === "undefined" ||
    !document.getElementById(
      id
    )
  ) {
    return null;
  }

  const initial =
    coords
      ? [
          coords.lat,
          coords.lon
        ]
      : [
          -30.5595,
          22.9375
        ];

  const instance =
    L.map(id)
      .setView(
        initial,
        coords
          ? 12
          : 5
      );

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,

      attribution:
        "&copy; OpenStreetMap contributors"
    }
  )
    .addTo(
      instance
    );

  return instance;
}

function updateMaps(stores) {
  if (
    !coords ||
    typeof L === "undefined"
  ) {
    return;
  }

  if (!map) {
    map =
      createMap("map");
  }

  if (!mapLarge) {
    mapLarge =
      createMap(
        "mapLarge"
      );
  }

  for (
    const instance
    of [
      map,
      mapLarge
    ]
  ) {
    if (!instance) {
      continue;
    }

    instance.eachLayer(
      (layer) => {
        if (
          layer instanceof L.Marker ||
          layer instanceof L.CircleMarker
        ) {
          instance.removeLayer(
            layer
          );
        }
      }
    );

    L.circleMarker(
      [
        coords.lat,
        coords.lon
      ],
      {
        radius: 8,
        color: "#3777ff",
        fillColor: "#3777ff",
        fillOpacity: 1
      }
    )
      .addTo(instance)
      .bindPopup(
        "You are here"
      );

    stores.forEach(
      (
        store,
        index
      ) => {
        L.marker(
          [
            store.lat,
            store.lon
          ]
        )
          .addTo(instance)
          .bindPopup(
            `<b>${index + 1}. ${esc(store.name)}</b><br>${store.distance.toFixed(1)} km away`
          );
      }
    );

    if (
      stores.length
    ) {
      instance.fitBounds(
        [
          [
            coords.lat,
            coords.lon
          ],

          ...stores.map(
            (store) => [
              store.lat,
              store.lon
            ]
          )
        ],
        {
          padding:
            [30,30],

          maxZoom:
            14
        }
      );

    } else {
      instance.setView(
        [
          coords.lat,
          coords.lon
        ],
        13
      );
    }

    setTimeout(
      () =>
        instance.invalidateSize(),
      120
    );
  }
}


/* =========================================================
   LOW CONFIDENCE
========================================================= */

function renderLowConfidence(data) {
  const item =
    data.identification || {};

  lastResult =
    null;

  els.results
    ?.classList
    .remove(
      "hidden"
    );

  els.lowConfidence
    ?.classList
    .remove(
      "hidden"
    );

  if (
    els.resultImage
  ) {
    els.resultImage.src =
      els.preview?.src ||
      "";
  }

  if (
    els.resultTitle
  ) {
    els.resultTitle.textContent =
      item.name ||
      item.object ||
      "FindIt isn't confident enough";
  }

  if (
    els.resultSubtitle
  ) {
    els.resultSubtitle.textContent =
      data.message ||
      "Try another photo.";
  }

  if (
    els.matchText
  ) {
    els.matchText.textContent =
      "Low confidence";
  }

  if (
    els.productTags
  ) {
    els.productTags.innerHTML =
      "";
  }

  if (
    els.stores
  ) {
    els.stores.innerHTML =
      "";
  }
}


/* =========================================================
   MAIN SEARCH

   ONE TAP:
   identify -> location -> nearby stores
========================================================= */

els.search
  ?.addEventListener(
    "click",
    async () => {

      if (
        !selectedFile ||
        searching
      ) {
        return;
      }

      setSearchBusy(
        true
      );

      if (
        els.status
      ) {
        els.status.textContent =
          "Thank you for your patience. We are looking for the best possible match.";
      }

      try {
        showLoading(
          "Finding the best possible match…",
          "Thank you for your patience. We are looking for the best possible match."
        );

        const data =
          await identifyItem();

        const confidence =
          Number(
            data.identification
              ?.confidence ||
            0
          );

        if (
          confidence < 0.55
        ) {
          renderLowConfidence(
            data
          );

          els.results
            ?.scrollIntoView({
              behavior:
                "smooth"
            });

          if (
            els.status
          ) {
            els.status.textContent =
              "FindIt needs a clearer photo.";
          }

          return;
        }

        renderIdentification(
          data
        );

        els.results
          ?.scrollIntoView({
            behavior:
              "smooth"
          });

        showLoading(
          "Finding nearby retailers…",
          "Allow location if your browser asks."
        );

        try {
          await ensureLocation();

        } catch (
          locationError
        ) {
          console.error(
            "Location permission error:",
            locationError
          );

          if (
            els.stores
          ) {
            els.stores.innerHTML = `
              <div class="empty-card">

                Your item was identified successfully.

                <br><br>

                Tap <b>Use my location</b>
                to see nearby retailers.

              </div>
            `;
          }

          if (
            els.status
          ) {
            els.status.textContent =
              "Item identified. Location permission is needed for nearby stores.";
          }

          saveRecent(
            data.identification
          );

          return;
        }

        showLoading(
          "Finding nearby retailers…",
          "Removing unrelated shops and duplicate results."
        );

        try {
          await renderNearby(
            data.identification
          );

          if (
            els.status
          ) {
            els.status.textContent =
              "Search complete.";
          }

        } catch (
          nearbyError
        ) {
          console.error(
            "Nearby search error:",
            nearbyError
          );

          if (
            els.stores
          ) {
            els.stores.innerHTML = `
              <div class="empty-card">

                FindIt identified your item,
                but the nearby retailer service
                could not respond right now.

                <br><br>

                Please try again shortly.

              </div>
            `;
          }

          if (
            els.status
          ) {
            els.status.textContent =
              "Item identified. Nearby retailer search can be retried.";
          }
        }

        saveRecent(
          data.identification
        );

      } catch (
        error
      ) {
        console.error(
          "FindIt search error:",
          error
        );

        if (
          els.status
        ) {
          els.status.textContent =
            `FindIt could not complete the search: ${error.message}`;
        }

      } finally {
        hideLoading();

        setSearchBusy(
          false
        );
      }
    }
  );


/* =========================================================
   RESULT TABS
========================================================= */

$("#retry")
  ?.addEventListener(
    "click",
    () =>
      els.photo?.click()
  );

$$(".result-tab")
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          $$(".result-tab")
            .forEach(
              (tab) =>
                tab.classList.remove(
                  "active"
                )
            );

          $$(".result-panel")
            .forEach(
              (panel) =>
                panel.classList.remove(
                  "active"
                )
            );

          button.classList.add(
            "active"
          );

          $(
            `#panel-${button.dataset.tab}`
          )
            ?.classList
            .add(
              "active"
            );

          if (
            button.dataset.tab ===
              "map" &&
            mapLarge
          ) {
            setTimeout(
              () =>
                mapLarge.invalidateSize(),
              120
            );
          }
        }
      );
    }
  );


/* =========================================================
   RECENT / SAVED
========================================================= */

function recentSearches() {
  try {
    return JSON.parse(
      localStorage.getItem(
        RECENT_KEY
      ) || "[]"
    );

  } catch {
    return [];
  }
}

function saveRecent(item) {
  const entry = {
    name:
      item.name ||
      item.object ||
      "Item",

    brand:
      item.brand ||
      "",

    model:
      item.model ||
      "",

    category:
      item.category ||
      "",

    searchQuery:
      item.searchQuery ||
      "",

    time:
      Date.now()
  };

  const filtered =
    recentSearches()
      .filter(
        (existing) =>
          normalise(
            existing.searchQuery ||
            existing.name
          )
          !==
          normalise(
            entry.searchQuery ||
            entry.name
          )
      );

  filtered.unshift(
    entry
  );

  localStorage.setItem(
    RECENT_KEY,

    JSON.stringify(
      filtered.slice(
        0,
        10
      )
    )
  );
}

function renderRecent() {
  if (
    !els.recentList
  ) {
    return;
  }

  const list =
    recentSearches();

  els.recentList.innerHTML =
    list.length

      ? list
          .map(
            (item) => `
              <div class="recent-item">

                <b>
                  ${esc(item.name)}
                </b>

                <small>
                  ${esc(
                    [
                      item.brand,
                      item.model,
                      item.category
                    ]
                      .filter(Boolean)
                      .join(" • ")
                  )}
                </small>

              </div>
            `
          )
          .join("")

      : `
        <div class="empty-card">
          No recent searches yet.
        </div>
      `;
}

function saveCurrentSearch() {
  if (
    !lastResult
      ?.identification
  ) {
    if (
      els.status
    ) {
      els.status.textContent =
        "Run a search first.";
    }

    return;
  }

  saveRecent(
    lastResult.identification
  );

  if (
    els.status
  ) {
    els.status.textContent =
      "Search saved on this device.";
  }
}

$("#saveSearch")
  ?.addEventListener(
    "click",
    saveCurrentSearch
  );

$("#saveSearchBottom")
  ?.addEventListener(
    "click",
    saveCurrentSearch
  );

$("#recentButton")
  ?.addEventListener(
    "click",
    () => {

      renderRecent();

      els.recentModal
        ?.classList
        .remove(
          "hidden"
        );
    }
  );

$("#closeRecent")
  ?.addEventListener(
    "click",
    () =>
      els.recentModal
        ?.classList
        .add(
          "hidden"
        )
  );

els.recentModal
  ?.addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        els.recentModal
      ) {
        els.recentModal
          .classList
          .add(
            "hidden"
          );
      }
    }
  );


/* =========================================================
   SHARE
========================================================= */

$("#shareResult")
  ?.addEventListener(
    "click",
    async () => {

      if (
        !lastResult
          ?.identification
      ) {
        return;
      }

      const text =
        `FindIt Nearby identified: ${
          lastResult
            .identification
            .name ||
          lastResult
            .identification
            .object
        }`;

      try {
        if (
          navigator.share
        ) {
          await navigator.share({
            title:
              "FindIt Nearby",

            text,

            url:
              location.href
          });

        } else if (
          navigator.clipboard
        ) {
          await navigator
            .clipboard
            .writeText(
              location.href
            );

          if (
            els.status
          ) {
            els.status.textContent =
              "Link copied.";
          }
        }

      } catch {}
    }
  );


/* =========================================================
   STARTUP
========================================================= */

setSearchBusy(false);

console.log(
  "FindIt Nearby clean launch script loaded."
);
