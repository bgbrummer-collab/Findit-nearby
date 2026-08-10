const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const photo = $("#photo");
const cameraInput = $("#cameraInput");
const preview = $("#preview");
const emptyState = $("#emptyState");
const searchButton = $("#search");
const locationButton = $("#location");
const statusBox = $("#status");
const overlay = $("#loadingOverlay");
const loadingTitle = $("#loadingTitle");
const loadingText = $("#loadingText");

const API_BASE = window.FINDIT_API_BASE || "/api";

let coords = null;
let imageReady = false;
let searching = false;
let lastResult = null;
let currentStores = [];
let map = null;
let mapLarge = null;

/* =========================================================
   HELPERS
========================================================= */

function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalise(v) {
  return String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function safeUrl(v) {
  if (!v) return null;

  let u = String(v).trim();

  if (!/^https?:\/\//i.test(u)) {
    u = "https://" + u;
  }

  try {
    const parsed = new URL(u);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    return parsed.href;
  } catch {
    return null;
  }
}

function phoneHref(v) {
  return String(v || "")
    .replace(/[^\d+]/g, "");
}

function showLoading(title, text) {
  loadingTitle.textContent = title;
  loadingText.textContent = text;
  overlay.classList.remove("hidden");
}

function hideLoading() {
  overlay.classList.add("hidden");
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const p = Math.PI / 180;

  const a =
    Math.sin((lat2 - lat1) * p / 2) ** 2 +
    Math.cos(lat1 * p) *
      Math.cos(lat2 * p) *
      Math.sin((lon2 - lon1) * p / 2) ** 2;

  return R *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );
}

/* =========================================================
   KNOWN RETAILER DATA
========================================================= */

const KNOWN_PRODUCT_BRANDS = new Set([
  "adidas",
  "nike",
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

const KNOWN_MULTIBRAND_RETAILERS = [
  "totalsports",
  "total sports",
  "footgear",
  "sportscene",
  "sportsmans warehouse",
  "sportsman warehouse",
  "jd sports",
  "studio 88",
  "takealot",
  "makro",
  "incredible connection",
  "game",
  "woolworths",
  "edgars",
  "mr price sport",
  "pna"
];

const RETAILER_DIRECTORY = [
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
  }
];

function retailerDirectoryEntry(storeName) {
  const n = normalise(storeName);

  return RETAILER_DIRECTORY.find((entry) =>
    entry.keys.some((key) =>
      n.includes(key)
    )
  ) || null;
}

/* =========================================================
   IMAGE INPUT
========================================================= */

function acceptFile(file) {
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    statusBox.textContent =
      "Please choose an image file.";
    return;
  }

  if (file.size > 8_000_000) {
    statusBox.textContent =
      "Please use an image smaller than 8 MB.";
    return;
  }

  const transfer =
    new DataTransfer();

  transfer.items.add(file);
  photo.files = transfer.files;

  preview.src =
    URL.createObjectURL(file);

  preview.style.display =
    "block";

  emptyState.style.display =
    "none";

  imageReady =
    true;

  lastResult =
    null;

  searchButton.disabled =
    false;

  statusBox.textContent =
    "Photo ready. FindIt can identify it now.";

  $("#results")
    .classList
    .add("hidden");
}

photo.addEventListener(
  "change",
  () =>
    acceptFile(
      photo.files?.[0]
    )
);

cameraInput.addEventListener(
  "change",
  () =>
    acceptFile(
      cameraInput.files?.[0]
    )
);

$("#heroUpload")
  .addEventListener(
    "click",
    () => photo.click()
  );

$("#heroCamera")
  .addEventListener(
    "click",
    () => cameraInput.click()
  );

[
  $("#heroDropzone"),
  $("#finderDropzone")
].forEach((zone) => {

  zone.addEventListener(
    "dragover",
    (e) => {
      e.preventDefault();
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
    (e) => {
      e.preventDefault();

      zone.classList.remove(
        "dragging"
      );

      acceptFile(
        e.dataTransfer?.files?.[0]
      );

      $("#finder")
        .scrollIntoView({
          behavior: "smooth"
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

      navigator
        .geolocation
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
  if (coords) {
    return coords;
  }

  showLoading(
    "Getting your location…",
    "Your browser may ask for permission."
  );

  try {

    await getLocation();

    locationButton.textContent =
      "✓ Location ready";

    statusBox.textContent =
      "Location ready.";

    $("#locationLabel")
      .textContent =
      "your current location";

    return coords;

  } finally {

    hideLoading();
  }
}

locationButton.addEventListener(
  "click",
  async () => {

    locationButton.disabled =
      true;

    try {

      await ensureLocation();

      if (
        lastResult?.identification
      ) {

        showLoading(
          "Finding nearby retailers…",
          "Ranking the most relevant stores."
        );

        await renderNearby(
          lastResult.identification
        );

        statusBox.textContent =
          "Nearby search complete.";
      }

    } catch (error) {

      console.error(error);

      statusBox.textContent =
        "Location permission was not available.";

    } finally {

      hideLoading();

      locationButton.disabled =
        false;
    }
  }
);

$("#changeLocation")
  .addEventListener(
    "click",
    async () => {

      coords = null;

      locationButton.textContent =
        "⌖ Use my location";

      try {

        await ensureLocation();

        if (
          lastResult?.identification
        ) {

          showLoading(
            "Updating nearby retailers…",
            "Using your refreshed location."
          );

          await renderNearby(
            lastResult.identification
          );
        }

      } catch {

        statusBox.textContent =
          "Could not update location.";

      } finally {

        hideLoading();
      }
    }
  );

/* =========================================================
   GEMINI
========================================================= */

async function identifyItem() {

  const file =
    photo.files?.[0];

  if (!file) {
    throw new Error(
      "Choose a photo first."
    );
  }

  const form =
    new FormData();

  form.append(
    "image",
    file
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

    const msg =
      data.details ||
      data.error ||
      "Image identification failed.";

    if (
      /quota|rate|429/i
        .test(msg)
    ) {

      throw new Error(
        "Gemini's free usage limit is temporarily reached. Try again later."
      );
    }

    throw new Error(msg);
  }

  return data;
}

/* =========================================================
   NEARBY API
========================================================= */

async function fetchNearby() {

  if (!coords) {
    throw new Error(
      "Location is required."
    );
  }

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
          JSON.stringify(coords)
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
   PRODUCT RENDER
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
            item.confidence || 0
          ) * 100
        )
      )
    );

  lastResult = data;

  $("#results")
    .classList
    .remove("hidden");

  $("#lowConfidence")
    .classList
    .add("hidden");

  $("#resultImage").src =
    preview.src;

  $("#resultTitle")
    .textContent =
      item.name ||
      item.object ||
      "Item identified";

  $("#resultSubtitle")
    .textContent =
      item.summary ||
      item.searchQuery ||
      "";

  $("#matchText")
    .textContent =
      `${confidence}% match`;

  $("#confidenceNumber")
    .textContent =
      `${confidence}%`;

  $("#confidenceRing")
    .style
    .setProperty(
      "--score",
      `${confidence}%`
    );

  $("#confidenceLabel")
    .textContent =
      confidence >= 90
        ? "Very High Match"
        : confidence >= 75
        ? "Strong Match"
        : confidence >= 55
        ? "Possible Match"
        : "Low Confidence";

  $("#productTags")
    .innerHTML =
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

  const visibleText =
    Array.isArray(
      item.visibleText
    ) &&
    item.visibleText.length
      ? item.visibleText.join(", ")
      : "None detected";

  $("#detailsContent")
    .innerHTML = `

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
          <b>${esc(
            item.object ||
            "Unknown"
          )}</b>
        </div>

        <div class="detail-box">
          <small>Brand</small>
          <b>${esc(
            item.brand ||
            "Not detected"
          )}</b>
        </div>

        <div class="detail-box">
          <small>Model</small>
          <b>${esc(
            item.model ||
            "Not detected"
          )}</b>
        </div>

        <div class="detail-box">
          <small>Category</small>
          <b>${esc(
            item.category ||
            "Not detected"
          )}</b>
        </div>

        <div class="detail-box">
          <small>Colour</small>
          <b>${esc(
            item.color ||
            "Not detected"
          )}</b>
        </div>

        <div class="detail-box">
          <small>Visible text</small>
          <b>${esc(
            visibleText
          )}</b>
        </div>

        <div class="detail-box">
          <small>Search phrase</small>
          <b>${esc(
            item.searchQuery ||
            "Not available"
          )}</b>
        </div>

        <div class="detail-box">
          <small>Confidence</small>
          <b>${confidence}%</b>
        </div>

      </div>
    `;

  renderVerifiedOffers(data);
}

/* =========================================================
   VERIFIED OFFERS
========================================================= */

function renderVerifiedOffers(data) {

  const offers =
    Array.isArray(
      data.offers
    )
      ? data.offers
      : [];

  const box =
    $("#verifiedOffers");

  const comparison =
    $("#comparisonContent");

  if (!offers.length) {

    box.innerHTML = "";

    comparison.innerHTML = `

      <div class="feature-icon">
        ⇄
      </div>

      <h3>
        Ready for real retailer prices.
      </h3>

      <p>
        FindIt will only display prices
        and exact stock when a legitimate
        retailer catalogue or inventory
        connection supplies them.
      </p>
    `;

    return;
  }

  $("#verifiedNotice")
    .textContent =
      "✓ Verified retailer offers are available for this item.";

  const html =
    offers
      .map((offer) => {

        const store =
          offer.store || {};

        const price =
          offer.price == null
            ? "Price unavailable"
            : new Intl
                .NumberFormat(
                  "en-ZA",
                  {
                    style: "currency",
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
                  offer.stock?.status ||
                  "Stock status unavailable"
                )}
              </small>

            </div>

            <div class="offer-price">
              ${esc(price)}
            </div>

          </article>
        `;
      })
      .join("");

  box.innerHTML =
    `<div class="offer-grid">${html}</div>`;

  comparison.innerHTML =
    `<div class="offer-grid">${html}</div>`;
}

/* =========================================================
   CATEGORY PROFILES
========================================================= */

function categoryProfile(item) {

  const t =
    normalise(
      `${item.object || ""}
       ${item.name || ""}
       ${item.category || ""}
       ${item.searchQuery || ""}`
    );

  if (
    /shoe|sneaker|footwear|trainer/
      .test(t)
  ) {
    return {
      types: [
        "shoes",
        "clothes",
        "department_store",
        "sports"
      ],

      words: [
        "shoe",
        "sneaker",
        "footwear",
        "sport"
      ],

      strictSports: true
    };
  }

  if (
    /microphone|headphone|earphone|speaker|audio|sound/
      .test(t)
  ) {
    return {
      types: [
        "electronics",
        "music",
        "hifi",
        "computer"
      ],

      words: [
        "audio",
        "music",
        "sound",
        "electronics"
      ],

      strictSports: false
    };
  }

  if (
    /phone|smartphone|tablet/
      .test(t)
  ) {
    return {
      types: [
        "mobile_phone",
        "electronics",
        "computer"
      ],

      words: [
        "mobile",
        "phone",
        "electronics"
      ],

      strictSports: false
    };
  }

  if (
    /computer|laptop|monitor|keyboard|mouse/
      .test(t)
  ) {
    return {
      types: [
        "computer",
        "electronics"
      ],

      words: [
        "computer",
        "technology",
        "electronics"
      ],

      strictSports: false
    };
  }

  if (
    /camera|lens|photography/
      .test(t)
  ) {
    return {
      types: [
        "camera",
        "electronics"
      ],

      words: [
        "camera",
        "photography"
      ],

      strictSports: false
    };
  }

  if (
    /shirt|sweater|hoodie|jacket|dress|clothing|fashion/
      .test(t)
  ) {
    return {
      types: [
        "clothes",
        "fashion",
        "department_store"
      ],

      words: [
        "clothes",
        "fashion",
        "clothing"
      ],

      strictSports: false
    };
  }

  if (
    /flower|plant|bouquet/
      .test(t)
  ) {
    return {
      types: [
        "florist",
        "garden_centre"
      ],

      words: [
        "flower",
        "florist",
        "plant",
        "garden"
      ],

      strictSports: false
    };
  }

  if (
    /chair|table|desk|sofa|couch|furniture/
      .test(t)
  ) {
    return {
      types: [
        "furniture",
        "houseware",
        "interior_decoration"
      ],

      words: [
        "furniture",
        "home",
        "interior"
      ],

      strictSports: false
    };
  }

  if (
    /book|novel|textbook/
      .test(t)
  ) {
    return {
      types: [
        "books",
        "stationery"
      ],

      words: [
        "book",
        "books"
      ],

      strictSports: false
    };
  }

  if (
    /pen|pencil|stationery|notebook/
      .test(t)
  ) {
    return {
      types: [
        "stationery",
        "variety_store"
      ],

      words: [
        "stationery",
        "office",
        "school"
      ],

      strictSports: false
    };
  }

  if (
    /tool|drill|hammer|hardware|screwdriver/
      .test(t)
  ) {
    return {
      types: [
        "hardware",
        "doityourself",
        "trade"
      ],

      words: [
        "hardware",
        "tool",
        "tools"
      ],

      strictSports: false
    };
  }

  if (
    /toy|lego|game|console/
      .test(t)
  ) {
    return {
      types: [
        "toys",
        "games",
        "video_games",
        "variety_store"
      ],

      words: [
        "toy",
        "game",
        "games"
      ],

      strictSports: false
    };
  }

  return {
    types: [],

    words:
      normalise(
        item.category ||
        item.object ||
        ""
      )
        .split(" ")
        .filter(
          (word) =>
            word.length >= 4
        ),

    strictSports: false
  };
}

/* =========================================================
   STORE EXTRACTION
========================================================= */

function extractStore(place) {

  const lat =
    place.lat ??
    place.center?.lat;

  const lon =
    place.lon ??
    place.center?.lon;

  if (
    lat == null ||
    lon == null
  ) {
    return null;
  }

  const tags =
    place.tags || {};

  const name =
    tags.name ||
    tags.brand ||
    "Unnamed retailer";

  const directory =
    retailerDirectoryEntry(
      name
    );

  const osmWebsite =
    safeUrl(
      tags["contact:website"] ||
      tags.website
    );

  const website =
    osmWebsite ||
    directory?.website ||
    null;

  const phone =
    tags["contact:phone"] ||
    tags.phone ||
    tags["contact:mobile"] ||
    tags.mobile ||
    null;

  return {
    name,
    lat,
    lon,

    type:
      tags.shop ||
      tags.amenity ||
      "retail",

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

    directory
  };
}

/* =========================================================
   BRAND FILTERING
========================================================= */

function findKnownMaker(text) {

  const n =
    normalise(text);

  for (
    const brand
    of KNOWN_PRODUCT_BRANDS
  ) {

    if (
      n === brand ||
      n.startsWith(
        brand + " "
      ) ||
      n.endsWith(
        " " + brand
      ) ||
      n.includes(
        " " + brand + " "
      )
    ) {
      return brand;
    }
  }

  return null;
}

function isMultiBrandRetailer(
  store
) {

  const n =
    normalise(
      store.name
    );

  return KNOWN_MULTIBRAND_RETAILERS
    .some(
      (retailer) =>
        n.includes(
          retailer
        )
    );
}

function isCompetingSingleBrandStore(
  store,
  item
) {

  const itemBrand =
    normalise(
      item.brand
    );

  if (
    !itemBrand ||
    isMultiBrandRetailer(store)
  ) {
    return false;
  }

  const storeBrand =
    findKnownMaker(
      store.tags.brand ||
      store.tags.name ||
      store.name
    );

  return (
    !!storeBrand &&
    storeBrand !== itemBrand
  );
}

/* =========================================================
   STORE SCORE
========================================================= */

function retailerScore(
  store,
  item,
  profile
) {

  const name =
    normalise(
      store.name
    );

  const type =
    normalise(
      store.type
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
      item.brand
    );

  let score = 0;

  if (
    isCompetingSingleBrandStore(
      store,
      item
    )
  ) {
    return -9999;
  }

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
    score += 220;
  }

  if (
    isMultiBrandRetailer(
      store
    )
  ) {
    score += 45;
  }

  if (
    profile.types.includes(
      type
    )
  ) {
    score += 70;
  }

  for (
    const word
    of profile.words
  ) {

    if (
      word &&
      blob.includes(
        normalise(word)
      )
    ) {
      score += 12;
    }
  }

  if (
    profile.strictSports &&
    type === "sports"
  ) {

    const shoeEvidence =
      /shoe|sneaker|footwear/
        .test(blob);

    const brandEvidence =
      itemBrand &&
      blob.includes(
        itemBrand
      );

    if (
      !isMultiBrandRetailer(store) &&
      !shoeEvidence &&
      !brandEvidence
    ) {
      score -= 80;
    }
  }

  return score;
}

/* =========================================================
   LOGO
========================================================= */

function faviconForStore(
  store
) {

  let domain = null;

  if (
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

  if (
    !domain &&
    store.directory?.domain
  ) {
    domain =
      store.directory.domain;
  }

  if (!domain) {
    return null;
  }

  return (
    "https://www.google.com/s2/favicons?domain=" +
    encodeURIComponent(domain) +
    "&sz=128"
  );
}

/* =========================================================
   RETAILER SEARCH
========================================================= */

function retailerSearchUrl(
  store,
  item
) {

  if (
    !item.searchQuery ||
    !store.website
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
   SMART DEDUPE

   Same chain within ~1 km =
   probably duplicate map objects / duplicate branch record.
========================================================= */

function dedupeStores(
  stores
) {

  const kept = [];

  for (
    const store
    of stores
  ) {

    const sameChain =
      kept.find(
        (existing) => {

          const sameName =
            normalise(
              existing.name
            ) ===
            normalise(
              store.name
            );

          if (!sameName) {
            return false;
          }

          const between =
            distanceKm(
              existing.lat,
              existing.lon,
              store.lat,
              store.lon
            );

          return (
            between < 1.0
          );
        }
      );

    if (!sameChain) {

      kept.push(store);

      continue;
    }

    /*
      Keep whichever duplicate
      has better information.
    */

    const oldInfo =
      Number(
        !!sameChain.phone
      ) +
      Number(
        !!sameChain.website
      ) +
      Number(
        !!sameChain.address
      ) +
      Number(
        !!sameChain.opening
      );

    const newInfo =
      Number(
        !!store.phone
      ) +
      Number(
        !!store.website
      ) +
      Number(
        !!store.address
      ) +
      Number(
        !!store.opening
      );

    if (
      newInfo >
      oldInfo
    ) {

      const index =
        kept.indexOf(
          sameChain
        );

      kept[index] =
        store;
    }
  }

  return kept;
}

/* =========================================================
   RENDER NEARBY
========================================================= */

async function renderNearby(
  item
) {

  if (!coords) {

    $("#stores")
      .innerHTML = `

        <div class="empty-card">
          Press <b>Use my location</b>
          to see nearby retailers.
        </div>
      `;

    return;
  }

  const raw =
    await fetchNearby();

  const profile =
    categoryProfile(item);

  let stores =
    raw
      .map(extractStore)

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
          store.score >= 30
      )

      .sort(
        (a, b) =>
          b.score -
            a.score ||
          a.distance -
            b.distance
      );

  /*
    First remove exact duplicates.
  */

  const exactSeen =
    new Set();

  stores =
    stores.filter(
      (store) => {

        const key =
          `${normalise(store.name)}|` +
          `${store.lat.toFixed(5)}|` +
          `${store.lon.toFixed(5)}`;

        if (
          exactSeen.has(key)
        ) {
          return false;
        }

        exactSeen.add(key);

        return true;
      }
    );

  /*
    Then remove duplicate branch objects
    close to each other.
  */

  stores =
    dedupeStores(stores);

  /*
    Final limit.
  */

  stores =
    stores.slice(
      0,
      12
    );

  currentStores =
    stores;

  $("#nearbyCount")
    .textContent =
      stores.length
        ? `(${stores.length})`
        : "";

  if (
    !stores.length
  ) {

    $("#stores")
      .innerHTML = `

        <div class="empty-card">

          FindIt reached the map service,
          but no strong retailer matches
          were found nearby.

        </div>
      `;

    updateMaps([]);

    return;
  }

  $("#stores")
    .innerHTML =
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
              faviconForStore(
                store
              );

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
              store.score >= 180
                ? "Best brand match"
                : store.score >= 90
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
                        ? ` • ${esc(
                            store.opening
                          )}`
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
                            href="${esc(
                              store.website
                            )}"
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
                            href="${esc(
                              searchUrl
                            )}"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            ⌕ Search retailer
                          </a>

                        `
                        : ""
                    }


                    <a
                      href="${esc(
                        directions
                      )}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ⌖ Directions
                    </a>

                  </div>

                </div>


                <div class="store-side">

                  <div class="store-distance">
                    ${store.distance.toFixed(1)} km
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

  updateMaps(stores);
}

/* =========================================================
   MAPS
========================================================= */

function createMap(id) {

  if (
    typeof L === "undefined" ||
    !document.getElementById(id)
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

  const m =
    L.map(id)
      .setView(
        initial,
        coords ? 12 : 5
      );

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,

      attribution:
        "&copy; OpenStreetMap contributors"
    }
  )
    .addTo(m);

  return m;
}

function updateMaps(
  stores
) {

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
    const m
    of [
      map,
      mapLarge
    ]
  ) {

    if (!m) {
      continue;
    }

    m.eachLayer(
      (layer) => {

        if (
          layer instanceof L.Marker ||
          layer instanceof L.CircleMarker
        ) {
          m.removeLayer(
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
      .addTo(m)
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
          .addTo(m)
          .bindPopup(
            `<b>${index + 1}. ${esc(
              store.name
            )}</b><br>${store.distance.toFixed(1)} km away`
          );
      }
    );

    const points = [
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
    ];

    if (
      stores.length
    ) {

      m.fitBounds(
        points,
        {
          padding:
            [30,30],

          maxZoom:
            14
        }
      );

    } else {

      m.setView(
        [
          coords.lat,
          coords.lon
        ],
        13
      );
    }

    setTimeout(
      () =>
        m.invalidateSize(),
      120
    );
  }
}

/* =========================================================
   LOW CONFIDENCE
========================================================= */

function renderLowConfidence(
  data
) {

  const item =
    data.identification || {};

  lastResult =
    null;

  $("#results")
    .classList
    .remove("hidden");

  $("#lowConfidence")
    .classList
    .remove("hidden");

  $("#resultImage").src =
    preview.src;

  $("#resultTitle")
    .textContent =
      item.name ||
      item.object ||
      "FindIt isn't confident enough";

  $("#resultSubtitle")
    .textContent =
      data.message ||
      "Try another photo.";

  $("#matchText")
    .textContent =
      "Low confidence";

  $("#productTags")
    .innerHTML =
      "";

  $("#stores")
    .innerHTML =
      "";
}

/* =========================================================
   MAIN SEARCH
========================================================= */

searchButton.addEventListener(
  "click",
  async () => {

    if (
      !imageReady ||
      searching
    ) {
      return;
    }

    searching = true;

    searchButton.disabled =
      true;

    try {

      showLoading(
        "Identifying your item…",
        "Looking for the object, brand, model and visible text."
      );

      const data =
        await identifyItem();

      const confidence =
        Number(
          data.identification
            ?.confidence ||
          0
        );

      hideLoading();

      if (
        confidence < 0.55
      ) {

        renderLowConfidence(
          data
        );

        $("#results")
          .scrollIntoView({
            behavior: "smooth"
          });

        statusBox.textContent =
          "Try another photo.";

        return;
      }

      renderIdentification(
        data
      );

      if (coords) {

        showLoading(
          "Finding nearby retailers…",
          "Removing duplicates and weak matches."
        );

        await renderNearby(
          data.identification
        );

      } else {

        $("#stores")
          .innerHTML = `

            <div class="empty-card">

              Item identified.

              Press <b>Use my location</b>
              to load nearby retailers.

            </div>
          `;
      }

      saveRecent(
        data.identification
      );

      $("#results")
        .scrollIntoView({
          behavior: "smooth"
        });

      statusBox.textContent =
        "Search complete.";

    } catch (error) {

      console.error(error);

      statusBox.textContent =
        `FindIt could not complete the search: ${error.message}`;

    } finally {

      hideLoading();

      searching =
        false;

      searchButton.disabled =
        !imageReady;
    }
  }
);

/* =========================================================
   RETRY
========================================================= */

$("#retry")
  .addEventListener(
    "click",
    () =>
      photo.click()
  );

/* =========================================================
   TABS
========================================================= */

$$(".result-tab")
  .forEach(
    (button) => {

      button
        .addEventListener(
          "click",
          () => {

            $$(".result-tab")
              .forEach(
                (b) =>
                  b.classList
                    .remove(
                      "active"
                    )
              );

            $$(".result-panel")
              .forEach(
                (p) =>
                  p.classList
                    .remove(
                      "active"
                    )
              );

            button.classList.add(
              "active"
            );

            $(
              `#panel-${button.dataset.tab}`
            )
              .classList
              .add(
                "active"
              );

            if (
              button.dataset.tab === "map" &&
              mapLarge
            ) {

              setTimeout(
                () =>
                  mapLarge
                    .invalidateSize(),
                120
              );
            }
          }
        );
    }
  );

/* =========================================================
   SAVED / RECENT
========================================================= */

const RECENT_KEY =
  "findit_recent_searches";

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

function saveRecent(
  item
) {

  const list =
    recentSearches();

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
    list.filter(
      (x) =>
        normalise(
          x.searchQuery ||
          x.name
        ) !==
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

  const list =
    recentSearches();

  $("#recentList")
    .innerHTML =
      list.length

        ? list
            .map(
              (item) => `

                <div class="recent-item">

                  <b>
                    ${esc(
                      item.name
                    )}
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
    !lastResult?.identification
  ) {

    statusBox.textContent =
      "Run a search first.";

    return;
  }

  saveRecent(
    lastResult.identification
  );

  statusBox.textContent =
    "Search saved on this device.";
}

$("#saveSearch")
  .addEventListener(
    "click",
    saveCurrentSearch
  );

$("#saveSearchBottom")
  .addEventListener(
    "click",
    saveCurrentSearch
  );

$("#recentButton")
  .addEventListener(
    "click",
    () => {

      renderRecent();

      $("#recentModal")
        .classList
        .remove(
          "hidden"
        );
    }
  );

$("#closeRecent")
  .addEventListener(
    "click",
    () =>

      $("#recentModal")
        .classList
        .add(
          "hidden"
        )
  );

$("#recentModal")
  .addEventListener(
    "click",
    (e) => {

      if (
        e.target.id ===
        "recentModal"
      ) {

        $("#recentModal")
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
  .addEventListener(
    "click",
    async () => {

      if (
        !lastResult
          ?.identification
      ) {
        return;
      }

      const item =
        lastResult.identification;

      const text =
        `FindIt Nearby identified: ${item.name || item.object}`;

      try {

        if (
          navigator.share
        ) {

          await navigator.share(
            {
              title:
                "FindIt Nearby",

              text,

              url:
                location.href
            }
          );

        } else {

          await navigator
            .clipboard
            .writeText(
              location.href
            );

          statusBox.textContent =
            "Link copied.";
        }

      } catch {}
    }
  );
