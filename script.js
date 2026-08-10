const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

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
let selectedFile = null;

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

    return ["http:", "https:"].includes(parsed.protocol)
      ? parsed.href
      : null;
  } catch {
    return null;
  }
}

function phoneHref(v) {
  return String(v || "")
    .replace(/[^\d+]/g, "");
}

function showLoading(title, text) {
  if (loadingTitle) {
    loadingTitle.textContent = title;
  }

  if (loadingText) {
    loadingText.textContent = text;
  }

  if (overlay) {
    overlay.classList.remove("hidden");
  }
}

function hideLoading() {
  if (overlay) {
    overlay.classList.add("hidden");
  }
}

function setSearchBusy(isBusy) {
  searching = isBusy;

  if (!searchButton) {
    return;
  }

  searchButton.disabled =
    isBusy ||
    !imageReady;

  searchButton.textContent =
    isBusy
      ? "◎ Finding your item…"
      : "◎ Identify this item";
}

function distanceKm(
  lat1,
  lon1,
  lat2,
  lon2
) {
  const R = 6371;
  const p = Math.PI / 180;

  const a =
    Math.sin(
      ((lat2 - lat1) * p) / 2
    ) ** 2
    +
    Math.cos(
      lat1 * p
    )
    *
    Math.cos(
      lat2 * p
    )
    *
    Math.sin(
      ((lon2 - lon1) * p) / 2
    ) ** 2;

  return (
    R *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
}

const RETAILER_DIRECTORY = [
  {
    keys: ["pna"],
    domain: "pna.co.za",
    website: "https://www.pna.co.za"
  },

  {
    keys: [
      "totalsports",
      "total sports"
    ],
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
    keys: [
      "dis chem",
      "dischem"
    ],
    domain: "dischem.co.za",
    website: "https://www.dischem.co.za"
  },

  {
    keys: ["checkers"],
    domain: "checkers.co.za",
    website: "https://www.checkers.co.za"
  },

  {
    keys: [
      "pick n pay",
      "pnp"
    ],
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

function retailerDirectoryEntry(
  storeName
) {
  const n =
    normalise(
      storeName
    );

  return (
    RETAILER_DIRECTORY.find(
      (entry) =>
        entry.keys.some(
          (key) =>
            n.includes(
              key
            )
        )
    ) || null
  );
}

const KNOWN_PRODUCT_BRANDS =
  new Set([
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

const KNOWN_MULTIBRAND_RETAILERS = [
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

function acceptFile(file) {
  if (!file) {
    return;
  }

  if (
    !file.type ||
    !file.type.startsWith(
      "image/"
    )
  ) {
    if (statusBox) {
      statusBox.textContent =
        "Please choose an image file.";
    }

    return;
  }

  if (
    file.size >
    8000000
  ) {
    if (statusBox) {
      statusBox.textContent =
        "Please use an image smaller than 8 MB.";
    }

    return;
  }

  selectedFile =
    file;

  if (preview) {
    preview.src =
      URL.createObjectURL(
        file
      );

    preview.style.display =
      "block";
  }

  if (emptyState) {
    emptyState.style.display =
      "none";
  }

  imageReady =
    true;

  lastResult =
    null;

  currentStores =
    [];

  setSearchBusy(
    false
  );

  if (statusBox) {
    statusBox.textContent =
      "Photo ready. Tap Identify this item once.";
  }

  const results =
    $("#results");

  if (results) {
    results.classList.add(
      "hidden"
    );
  }
}

if (photo) {
  photo.addEventListener(
    "change",
    () => {
      acceptFile(
        photo.files &&
        photo.files[0]
      );
    }
  );
}

if (cameraInput) {
  cameraInput.addEventListener(
    "change",
    () => {
      acceptFile(
        cameraInput.files &&
        cameraInput.files[0]
      );
    }
  );
}

if ($("#heroUpload")) {
  $("#heroUpload")
    .addEventListener(
      "click",
      () => {
        if (photo) {
          photo.click();
        }
      }
    );
}

if ($("#heroCamera")) {
  $("#heroCamera")
    .addEventListener(
      "click",
      () => {
        if (cameraInput) {
          cameraInput.click();
        }
      }
    );
}

[
  $("#heroDropzone"),
  $("#finderDropzone")
]
  .filter(Boolean)
  .forEach(
    (zone) => {

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
        () => {
          zone.classList.remove(
            "dragging"
          );
        }
      );

      zone.addEventListener(
        "drop",
        (event) => {
          event.preventDefault();

          zone.classList.remove(
            "dragging"
          );

          const file =
            event.dataTransfer &&
            event.dataTransfer.files &&
            event.dataTransfer.files[0];

          acceptFile(
            file
          );

          const finder =
            $("#finder");

          if (finder) {
            finder.scrollIntoView({
              behavior:
                "smooth"
            });
          }
        }
      );
    }
  );

function getLocation() {
  return new Promise(
    (
      resolve,
      reject
    ) => {

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

            resolve(
              coords
            );
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
    Number.isFinite(
      coords.lat
    ) &&
    Number.isFinite(
      coords.lon
    )
  ) {
    return coords;
  }

  if (locationButton) {
    locationButton.textContent =
      "⌖ Getting location…";
  }

  const result =
    await getLocation();

  if (locationButton) {
    locationButton.textContent =
      "✓ Location ready";
  }

  if ($("#locationLabel")) {
    $("#locationLabel")
      .textContent =
      "your current location";
  }

  return result;
}

if (locationButton) {
  locationButton
    .addEventListener(
      "click",
      async () => {

        if (
          locationButton.disabled
        ) {
          return;
        }

        locationButton.disabled =
          true;

        try {
          showLoading(
            "Getting your location…",
            "Allow location so FindIt can show nearby retailers."
          );

          await ensureLocation();

          if (
            lastResult &&
            lastResult.identification
          ) {
            showLoading(
              "Finding nearby retailers…",
              "Checking only stores that match this product."
            );

            await renderNearby(
              lastResult.identification
            );
          }

          if (statusBox) {
            statusBox.textContent =
              "Location ready.";
          }

        } catch (error) {
          console.error(
            error
          );

          if (locationButton) {
            locationButton.textContent =
              "⌖ Try location again";
          }

          if (statusBox) {
            statusBox.textContent =
              "We couldn't get your location. Please allow location access and try again.";
          }

        } finally {
          hideLoading();

          locationButton.disabled =
            false;
        }
      }
    );
}

if ($("#changeLocation")) {
  $("#changeLocation")
    .addEventListener(
      "click",
      async () => {

        coords =
          null;

        if (locationButton) {
          locationButton.textContent =
            "⌖ Use my location";
        }

        try {
          showLoading(
            "Updating location…",
            "Your browser may ask for permission."
          );

          await ensureLocation();

          if (
            lastResult &&
            lastResult.identification
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
            error
          );

          if (statusBox) {
            statusBox.textContent =
              "Could not update location.";
          }

        } finally {
          hideLoading();
        }
      }
    );
}

async function identifyItem() {
  const file =
    selectedFile ||
    (
      photo &&
      photo.files &&
      photo.files[0]
    );

  if (!file) {
    throw new Error(
      "Choose a photo first."
    );
  }

  const form =
    new FormData();

  form.append(
    "image",
    file,
    file.name ||
    "upload.jpg"
  );

  const response =
    await fetch(
      `${API_BASE}/search`,
      {
        method:
          "POST",

        body:
          form
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
      /quota|rate|429/i
        .test(
          message
        )
    ) {
      throw new Error(
        "Gemini's free usage limit is temporarily reached. Try again later."
      );
    }

    throw new Error(
      message
    );
  }

  return data;
}

async function fetchNearby() {
  if (
    !coords ||
    !Number.isFinite(
      coords.lat
    ) ||
    !Number.isFinite(
      coords.lon
    )
  ) {
    throw new Error(
      "Location is required."
    );
  }

  const response =
    await fetch(
      `${API_BASE}/nearby`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(
            coords
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

function categoryProfile(item) {
  const visible =
    Array.isArray(
      item.visibleText
    )
      ? item.visibleText.join(
          " "
        )
      : "";

  const text =
    normalise(
      `
      ${item.object || ""}
      ${item.name || ""}
      ${item.brand || ""}
      ${item.model || ""}
      ${item.category || ""}
      ${item.searchQuery || ""}
      ${visible}
      `
    );

  if (
    /shoe|shoes|sneaker|sneakers|footwear|trainer|trainers|boot|boots|sandal|sandals/
      .test(text)
  ) {
    return {
      family:
        "footwear",

      types: [
        "shoes",
        "sports",
        "clothes",
        "department_store"
      ],

      words: [
        "shoe",
        "sneaker",
        "footwear",
        "sport"
      ],

      blockedTypes: [
        "florist",
        "beauty",
        "chemist",
        "books",
        "stationery",
        "hardware",
        "furniture",
        "car",
        "car_repair",
        "garden_centre",
        "mobile_phone"
      ],

      strict:
        true
    };
  }

  if (
    /pencil case|pencil|pen|stationery|notebook|marker|stapler|school supplies|office supplies|eraser|ruler|highlighter/
      .test(text)
  ) {
    return {
      family:
        "stationery",

      types: [
        "stationery",
        "books",
        "variety_store",
        "department_store"
      ],

      words: [
        "stationery",
        "office",
        "school",
        "book"
      ],

      blockedTypes: [
        "sports",
        "shoes",
        "florist",
        "beauty",
        "chemist",
        "hardware",
        "furniture",
        "car",
        "car_repair",
        "garden_centre"
      ],

      strict:
        true
    };
  }

  if (
    /food|grocery|groceries|supermarket|snack|sauce|spread|jam|butter|cream cheese|icing|frosting|buttercream|butter cream|cake cream|baking|baking ingredient|flour|sugar|milk|bread|cereal|chocolate|sweet|candy|coffee|tea|juice|drink|beverage|syrup|soup|pasta|rice|cookie|biscuit|chips|lemon curd|lemon butter/
      .test(text)
  ) {
    return {
      family:
        "food",

      types: [
        "supermarket",
        "convenience",
        "deli",
        "bakery",
        "general",
        "department_store"
      ],

      words: [
        "food",
        "grocery",
        "supermarket",
        "bakery",
        "baking"
      ],

      blockedTypes: [
        "sports",
        "shoes",
        "clothes",
        "electronics",
        "computer",
        "hardware",
        "furniture",
        "florist",
        "car",
        "car_repair",
        "mobile_phone",
        "stationery",
        "books",
        "beauty"
      ],

      strict:
        true
    };
  }

  if (
    /skin care|skincare|body cream|face cream|hand cream|lotion|moisturizer|moisturiser|cosmetic|cosmetics|makeup|beauty|serum|shampoo|conditioner|soap|deodorant|perfume|fragrance|body wash|face wash/
      .test(text)
  ) {
    return {
      family:
        "beauty",

      types: [
        "beauty",
        "chemist",
        "cosmetics",
        "perfumery",
        "supermarket",
        "department_store"
      ],

      words: [
        "beauty",
        "cosmetic",
        "skin",
        "pharmacy",
        "chemist"
      ],

      blockedTypes: [
        "sports",
        "shoes",
        "electronics",
        "computer",
        "hardware",
        "furniture",
        "car",
        "car_repair",
        "stationery",
        "books"
      ],

      strict:
        true
    };
  }

  if (
    /medicine|medication|pharmacy|chemist|vitamin|painkiller|bandage|first aid|medical supply|medical supplies/
      .test(text)
  ) {
    return {
      family:
        "pharmacy",

      types: [
        "chemist",
        "pharmacy",
        "medical_supply"
      ],

      words: [
        "pharmacy",
        "chemist",
        "medical"
      ],

      blockedTypes: [
        "sports",
        "shoes",
        "clothes",
        "electronics",
        "hardware",
        "furniture",
        "florist",
        "stationery"
      ],

      strict:
        true
    };
  }

  if (
    /microphone|headphone|headphones|earphone|earphones|speaker|audio|sound|amplifier|earbud|earbuds/
      .test(text)
  ) {
    return {
      family:
        "audio",

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

      blockedTypes: [
        "sports",
        "shoes",
        "florist",
        "beauty",
        "chemist",
        "stationery",
        "furniture",
        "hardware"
      ],

      strict:
        true
    };
  }

  if (
    /smartphone|mobile phone|iphone|android phone|cellphone|cell phone/
      .test(text)
  ) {
    return {
      family:
        "mobile",

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

      blockedTypes: [
        "sports",
        "shoes",
        "florist",
        "beauty",
        "chemist",
        "stationery",
        "furniture",
        "hardware"
      ],

      strict:
        true
    };
  }

  if (
    /computer|laptop|monitor|keyboard|mouse|printer|desktop pc|gaming pc/
      .test(text)
  ) {
    return {
      family:
        "computer",

      types: [
        "computer",
        "electronics"
      ],

      words: [
        "computer",
        "technology",
        "electronics"
      ],

      blockedTypes: [
        "sports",
        "shoes",
        "florist",
        "beauty",
        "chemist",
        "furniture"
      ],

      strict:
        true
    };
  }

  if (
    /camera|photography|camera lens|dslr|mirrorless/
      .test(text)
  ) {
    return {
      family:
        "camera",

      types: [
        "camera",
        "electronics"
      ],

      words: [
        "camera",
        "photography"
      ],

      blockedTypes: [
        "sports",
        "shoes",
        "florist",
        "beauty",
        "chemist",
        "stationery",
        "furniture"
      ],

      strict:
        true
    };
  }

  if (
    /shirt|t shirt|tshirt|sweater|hoodie|jacket|dress|clothing|fashion|jeans|pants|trousers|shorts|skirt|coat/
      .test(text)
  ) {
    return {
      family:
        "clothing",

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

      blockedTypes: [
        "electronics",
        "computer",
        "chemist",
        "hardware",
        "furniture",
        "florist",
        "stationery"
      ],

      strict:
        true
    };
  }

  if (
    /flower|flowers|plant|plants|bouquet|rose|roses|orchid|succulent/
      .test(text)
  ) {
    return {
      family:
        "plants",

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

      blockedTypes: [
        "sports",
        "shoes",
        "electronics",
        "computer",
        "chemist",
        "stationery",
        "furniture"
      ],

      strict:
        true
    };
  }

  if (
    /chair|table|desk|sofa|couch|furniture|cabinet|shelf|bookshelf|wardrobe|bed frame/
      .test(text)
  ) {
    return {
      family:
        "furniture",

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

      blockedTypes: [
        "sports",
        "shoes",
        "electronics",
        "florist",
        "chemist",
        "stationery"
      ],

      strict:
        true
    };
  }

  if (
    /book|novel|textbook|magazine|comic book/
      .test(text)
  ) {
    return {
      family:
        "books",

      types: [
        "books",
        "stationery"
      ],

      words: [
        "book",
        "books"
      ],

      blockedTypes: [
        "sports",
        "shoes",
        "electronics",
        "florist",
        "chemist",
        "furniture"
      ],

      strict:
        true
    };
  }

  if (
    /tool|tools|drill|hammer|hardware|screwdriver|saw|spanner|wrench|pliers/
      .test(text)
  ) {
    return {
      family:
        "tools",

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

      blockedTypes: [
        "sports",
        "shoes",
        "florist",
        "beauty",
        "chemist",
        "stationery",
        "furniture"
      ],

      strict:
        true
    };
  }

  if (
    /toy|toys|lego|board game|video game|gaming console|playstation|xbox|nintendo/
      .test(text)
  ) {
    return {
      family:
        "toys-games",

      types: [
        "toys",
        "games",
        "video_games",
        "electronics",
        "variety_store"
      ],

      words: [
        "toy",
        "game",
        "games"
      ],

      blockedTypes: [
        "florist",
        "beauty",
        "chemist",
        "hardware",
        "furniture"
      ],

      strict:
        true
    };
  }

  return {
    family:
      "unknown",

    types:
      [],

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

    blockedTypes:
      [],

    strict:
      false
  };
}

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

function findKnownMaker(text) {
  const n =
    normalise(
      text
    );

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

function isMultiBrandRetailer(store) {
  const name =
    normalise(
      store.name
    );

  return (
    KNOWN_MULTIBRAND_RETAILERS
      .some(
        (retailer) =>
          name.includes(
            retailer
          )
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
    isMultiBrandRetailer(
      store
    )
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

  let score =
    0;

  if (
    isCompetingSingleBrandStore(
      store,
      item
    )
  ) {
    return -9999;
  }

  if (
    profile.blockedTypes
      .includes(
        type
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
    score +=
      240;
  }

  if (
    isMultiBrandRetailer(
      store
    )
  ) {
    score +=
      35;
  }

  if (
    profile.types
      .includes(
        type
      )
  ) {
    score +=
      100;
  }

  for (
    const word
    of profile.words
  ) {
    if (
      word &&
      blob.includes(
        normalise(
          word
        )
      )
    ) {
      score +=
        15;
    }
  }

  if (
    store.directory
  ) {
    score +=
      10;
  }

  if (
    profile.strict &&
    !profile.types
      .includes(
        type
      )
  ) {
    const hasKeyword =
      profile.words
        .some(
          (word) =>
            blob.includes(
              normalise(
                word
              )
            )
        );

    if (
      !hasKeyword
    ) {
      score -=
        85;
    }
  }

  return score;
}

function faviconForStore(store) {
  let domain =
    null;

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

  if (
    !domain
  ) {
    return null;
  }

  return (
    "https://www.google.com/s2/favicons?domain=" +
    encodeURIComponent(
      domain
    ) +
    "&sz=128"
  );
}

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

function dedupeStores(stores) {
  const kept =
    [];

  for (
    const store
    of stores
  ) {
    const duplicate =
      kept.find(
        (existing) => {

          if (
            normalise(
              existing.name
            ) !==
            normalise(
              store.name
            )
          ) {
            return false;
          }

          return (
            distanceKm(
              existing.lat,
              existing.lon,
              store.lat,
              store.lon
            ) < 1
          );
        }
      );

    if (
      !duplicate
    ) {
      kept.push(
        store
      );

      continue;
    }

    const oldInfo =
      Number(
        !!duplicate.phone
      )
      +
      Number(
        !!duplicate.website
      )
      +
      Number(
        !!duplicate.address
      )
      +
      Number(
        !!duplicate.opening
      );

    const newInfo =
      Number(
        !!store.phone
      )
      +
      Number(
        !!store.website
      )
      +
      Number(
        !!store.address
      )
      +
      Number(
        !!store.opening
      );

    if (
      newInfo >
      oldInfo
    ) {
      const index =
        kept.indexOf(
          duplicate
        );

      kept[index] =
        store;
    }
  }

  return kept;
}

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

  $("#results")
    ?.classList
    .remove(
      "hidden"
    );

  $("#lowConfidence")
    ?.classList
    .add(
      "hidden"
    );

  if (
    $("#resultImage")
  ) {
    $("#resultImage").src =
      preview?.src || "";
  }

  if (
    $("#resultTitle")
  ) {
    $("#resultTitle").textContent =
      item.name ||
      item.object ||
      "Item identified";
  }

  if (
    $("#resultSubtitle")
  ) {
    $("#resultSubtitle").textContent =
      item.summary ||
      item.searchQuery ||
      "";
  }

  if (
    $("#matchText")
  ) {
    $("#matchText").textContent =
      `${confidence}% match`;
  }

  if (
    $("#confidenceNumber")
  ) {
    $("#confidenceNumber").textContent =
      `${confidence}%`;
  }

  $("#confidenceRing")
    ?.style
    .setProperty(
      "--score",
      `${confidence}%`
    );

  if (
    $("#confidenceLabel")
  ) {
    $("#confidenceLabel").textContent =
      confidence >= 90
        ? "Very High Match"
        : confidence >= 75
        ? "Strong Match"
        : confidence >= 55
        ? "Possible Match"
        : "Low Confidence";
  }

  if (
    $("#productTags")
  ) {
    $("#productTags").innerHTML =
      [
        item.brand,
        item.model,
        item.category
      ]
        .filter(
          Boolean
        )
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
      ? item.visibleText.join(
          ", "
        )
      : "None detected";

  if (
    $("#detailsContent")
  ) {
    $("#detailsContent").innerHTML = `
      <div class="eyebrow">PRODUCT DETAILS</div>

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
          <b>${esc(item.object || "Unknown")}</b>
        </div>

        <div class="detail-box">
          <small>Brand</small>
          <b>${esc(item.brand || "Not detected")}</b>
        </div>

        <div class="detail-box">
          <small>Model</small>
          <b>${esc(item.model || "Not detected")}</b>
        </div>

        <div class="detail-box">
          <small>Category</small>
          <b>${esc(item.category || "Not detected")}</b>
        </div>

        <div class="detail-box">
          <small>Colour</small>
          <b>${esc(item.color || "Not detected")}</b>
        </div>

        <div class="detail-box">
          <small>Visible text</small>
          <b>${esc(visibleText)}</b>
        </div>

        <div class="detail-box">
          <small>Search phrase</small>
          <b>${esc(item.searchQuery || "Not available")}</b>
        </div>

        <div class="detail-box">
          <small>Confidence</small>
          <b>${confidence}%</b>
        </div>

      </div>
    `;
  }

  renderVerifiedOffers(
    data
  );
}

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

  if (
    !offers.length
  ) {
    if (box) {
      box.innerHTML =
        "";
    }

    if (comparison) {
      comparison.innerHTML = `
        <div class="feature-icon">
          ⇄
        </div>

        <h3>
          Ready for real retailer prices.
        </h3>

        <p>
          FindIt only displays prices and exact stock when a legitimate
          retailer catalogue or inventory connection supplies them.
        </p>
      `;
    }

    return;
  }

  if (
    $("#verifiedNotice")
  ) {
    $("#verifiedNotice")
      .textContent =
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

  if (box) {
    box.innerHTML =
      `<div class="offer-grid">${html}</div>`;
  }

  if (comparison) {
    comparison.innerHTML =
      `<div class="offer-grid">${html}</div>`;
  }
}

async function renderNearby(item) {
  if (
    !coords
  ) {
    if (
      $("#stores")
    ) {
      $("#stores").innerHTML = `
        <div class="empty-card">
          Item identified.
          Please allow location to see nearby retailers.
        </div>
      `;
    }

    return;
  }

  const raw =
    await fetchNearby();

  const profile =
    categoryProfile(
      item
    );

  if (
    profile.family ===
    "unknown"
  ) {
    if (
      $("#stores")
    ) {
      $("#stores").innerHTML = `
        <div class="empty-card">

          FindIt identified the item, but isn't confident enough
          about which type of retailer should sell it.

          <br><br>

          Try a clearer image showing the label, packaging or brand.

        </div>
      `;
    }

    if (
      $("#nearbyCount")
    ) {
      $("#nearbyCount")
        .textContent =
        "";
    }

    updateMaps(
      []
    );

    return;
  }

  let stores =
    raw
      .map(
        extractStore
      )
      .filter(
        Boolean
      )
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
          a.score
          ||
          a.distance -
          b.distance
      );

  const exactSeen =
    new Set();

  stores =
    stores.filter(
      (store) => {
        const key =
          `${normalise(store.name)}|${store.lat.toFixed(5)}|${store.lon.toFixed(5)}`;

        if (
          exactSeen.has(
            key
          )
        ) {
          return false;
        }

        exactSeen.add(
          key
        );

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

  currentStores =
    stores;

  if (
    $("#nearbyCount")
  ) {
    $("#nearbyCount")
      .textContent =
      stores.length
        ? `(${stores.length})`
        : "";
  }

  if (
    !stores.length
  ) {
    if (
      $("#stores")
    ) {
      $("#stores").innerHTML = `
        <div class="empty-card">

          FindIt couldn't find a strong nearby retailer match
          for this item.

          <br><br>

          We would rather show no result than send you
          to unrelated shops.

        </div>
      `;
    }

    updateMaps(
      []
    );

    return;
  }

  if (
    $("#stores")
  ) {
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
                ? `<img src="${esc(logo)}" alt="" onerror="this.parentElement.textContent='${fallback}'">`
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
                        ? `<a href="tel:${esc(phoneHref(store.phone))}">☎ Call</a>`
                        : ""
                    }

                    ${
                      store.website
                        ? `<a href="${esc(store.website)}" target="_blank" rel="noopener noreferrer">▣ Website</a>`
                        : ""
                    }

                    ${
                      searchUrl
                        ? `<a href="${esc(searchUrl)}" target="_blank" rel="noopener noreferrer">⌕ Search retailer</a>`
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
  }

  updateMaps(
    stores
  );
}

function createMap(id) {
  if (
    typeof L ===
      "undefined"
    ||
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

  const mapInstance =
    L.map(
      id
    )
      .setView(
        initial,
        coords
          ? 12
          : 5
      );

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom:
        19,

      attribution:
        "&copy; OpenStreetMap contributors"
    }
  )
    .addTo(
      mapInstance
    );

  return mapInstance;
}

function updateMaps(stores) {
  if (
    !coords ||
    typeof L ===
      "undefined"
  ) {
    return;
  }

  if (
    !map
  ) {
    map =
      createMap(
        "map"
      );
  }

  if (
    !mapLarge
  ) {
    mapLarge =
      createMap(
        "mapLarge"
      );
  }

  for (
    const mapInstance
    of [
      map,
      mapLarge
    ]
  ) {
    if (
      !mapInstance
    ) {
      continue;
    }

    mapInstance
      .eachLayer(
        (layer) => {
          if (
            layer instanceof L.Marker
            ||
            layer instanceof L.CircleMarker
          ) {
            mapInstance
              .removeLayer(
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
        radius:
          8,

        color:
          "#3777ff",

        fillColor:
          "#3777ff",

        fillOpacity:
          1
      }
    )
      .addTo(
        mapInstance
      )
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
          .addTo(
            mapInstance
          )
          .bindPopup(
            `<b>${index + 1}. ${esc(store.name)}</b><br>${store.distance.toFixed(1)} km away`
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
      mapInstance
        .fitBounds(
          points,
          {
            padding:
              [30, 30],

            maxZoom:
              14
          }
        );
    } else {
      mapInstance
        .setView(
          [
            coords.lat,
            coords.lon
          ],
          13
        );
    }

    setTimeout(
      () =>
        mapInstance
          .invalidateSize(),
      120
    );
  }
}

function renderLowConfidence(data) {
  const item =
    data.identification || {};

  lastResult =
    null;

  $("#results")
    ?.classList
    .remove(
      "hidden"
    );

  $("#lowConfidence")
    ?.classList
    .remove(
      "hidden"
    );

  if (
    $("#resultImage")
  ) {
    $("#resultImage").src =
      preview?.src || "";
  }

  if (
    $("#resultTitle")
  ) {
    $("#resultTitle")
      .textContent =
      item.name ||
      item.object ||
      "FindIt isn't confident enough";
  }

  if (
    $("#resultSubtitle")
  ) {
    $("#resultSubtitle")
      .textContent =
      data.message ||
      "Try another photo.";
  }

  if (
    $("#matchText")
  ) {
    $("#matchText")
      .textContent =
      "Low confidence";
  }

  if (
    $("#productTags")
  ) {
    $("#productTags")
      .innerHTML =
      "";
  }

  if (
    $("#stores")
  ) {
    $("#stores")
      .innerHTML =
      "";
  }
}

if (
  searchButton
) {
  searchButton
    .addEventListener(
      "click",
      async () => {

        if (
          !imageReady ||
          searching
        ) {
          return;
        }

        setSearchBusy(
          true
        );

        if (
          statusBox
        ) {
          statusBox.textContent =
            "FindIt is analysing your photo…";
        }

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

          if (
            confidence <
            0.55
          ) {
            hideLoading();

            renderLowConfidence(
              data
            );

            $("#results")
              ?.scrollIntoView({
                behavior:
                  "smooth"
              });

            if (
              statusBox
            ) {
              statusBox.textContent =
                "FindIt needs a clearer photo.";
            }

            return;
          }

          renderIdentification(
            data
          );

          $("#results")
            ?.scrollIntoView({
              behavior:
                "smooth"
            });

          if (
            loadingTitle
          ) {
            loadingTitle.textContent =
              "Finding nearby retailers…";
          }

          if (
            loadingText
          ) {
            loadingText.textContent =
              "Allow location if your browser asks.";
          }

          try {
            await ensureLocation();
          } catch (
            locationError
          ) {
            console.error(
              locationError
            );

            hideLoading();

            if (
              $("#stores")
            ) {
              $("#stores").innerHTML = `
                <div class="empty-card">

                  Your item was identified successfully.

                  <br><br>

                  Tap <b>Use my location</b>
                  to see nearby retailers.

                </div>
              `;
            }

            if (
              statusBox
            ) {
              statusBox.textContent =
                "Item identified. Location permission is needed for nearby stores.";
            }

            saveRecent(
              data.identification
            );

            return;
          }

          if (
            loadingTitle
          ) {
            loadingTitle.textContent =
              "Finding nearby retailers…";
          }

          if (
            loadingText
          ) {
            loadingText.textContent =
              "Removing unrelated shops and duplicate results.";
          }

          try {
            await renderNearby(
              data.identification
            );

            if (
              statusBox
            ) {
              statusBox.textContent =
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
              $("#stores")
            ) {
              $("#stores").innerHTML = `
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
              statusBox
            ) {
              statusBox.textContent =
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
            statusBox
          ) {
            statusBox.textContent =
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
}

if (
  $("#retry")
) {
  $("#retry")
    .addEventListener(
      "click",
      () => {
        if (
          photo
        ) {
          photo.click();
        }
      }
    );
}

$$(
  ".result-tab"
)
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          $$(".result-tab")
            .forEach(
              (tab) =>
                tab.classList
                  .remove(
                    "active"
                  )
            );

          $$(".result-panel")
            .forEach(
              (panel) =>
                panel.classList
                  .remove(
                    "active"
                  )
            );

          button.classList.add(
            "active"
          );

          const target =
            $(
              `#panel-${button.dataset.tab}`
            );

          if (
            target
          ) {
            target.classList.add(
              "active"
            );
          }

          if (
            button.dataset.tab ===
              "map"
            &&
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

const RECENT_KEY =
  "findit_recent_searches";

function recentSearches() {
  try {
    return JSON.parse(
      localStorage
        .getItem(
          RECENT_KEY
        )
      ||
      "[]"
    );
  } catch {
    return [];
  }
}

function saveRecent(item) {
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

  localStorage
    .setItem(
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

  if (
    !$("#recentList")
  ) {
    return;
  }

  $("#recentList")
    .innerHTML =
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
      statusBox
    ) {
      statusBox.textContent =
        "Run a search first.";
    }

    return;
  }

  saveRecent(
    lastResult.identification
  );

  if (
    statusBox
  ) {
    statusBox.textContent =
      "Search saved on this device.";
  }
}

if (
  $("#saveSearch")
) {
  $("#saveSearch")
    .addEventListener(
      "click",
      saveCurrentSearch
    );
}

if (
  $("#saveSearchBottom")
) {
  $("#saveSearchBottom")
    .addEventListener(
      "click",
      saveCurrentSearch
    );
}

if (
  $("#recentButton")
) {
  $("#recentButton")
    .addEventListener(
      "click",
      () => {

        renderRecent();

        $("#recentModal")
          ?.classList
          .remove(
            "hidden"
          );
      }
    );
}

if (
  $("#closeRecent")
) {
  $("#closeRecent")
    .addEventListener(
      "click",
      () => {

        $("#recentModal")
          ?.classList
          .add(
            "hidden"
          );
      }
    );
}

if (
  $("#recentModal")
) {
  $("#recentModal")
    .addEventListener(
      "click",
      (event) => {

        if (
          event.target.id ===
          "recentModal"
        ) {
          $("#recentModal")
            ?.classList
            .add(
              "hidden"
            );
        }
      }
    );
}

if (
  $("#shareResult")
) {
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
          lastResult
            .identification;

        const text =
          `FindIt Nearby identified: ${item.name || item.object}`;

        try {
          if (
            navigator.share
          ) {
            await navigator
              .share({
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
              statusBox
            ) {
              statusBox.textContent =
                "Link copied.";
            }
          }

        } catch {}
      }
    );
}

setSearchBusy(
  false
);

console.log(
  "FindIt Nearby stable launch script loaded."
);
