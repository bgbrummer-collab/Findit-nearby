const $ = (selector) => document.querySelector(selector);

const photo = $("#photo");
const preview = $("#preview");
const empty = $("#empty");
const searchBtn = $("#search");
const locationBtn = $("#location");
const status = $("#status");

let coords = null;
let ready = false;

const apiBase = window.FINDIT_API_BASE || "/api";

/* =========================================================
   IMAGE UPLOAD
========================================================= */

photo.onchange = () => {
  if (!photo.files[0]) return;

  ready = true;

  preview.src = URL.createObjectURL(photo.files[0]);
  preview.style.display = "block";

  if (empty) {
    empty.style.display = "none";
  }

  searchBtn.disabled = false;

  status.textContent =
    "Photo ready. FindIt will identify the actual item, brand and model.";
};

/* =========================================================
   LOCATION
========================================================= */

function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        coords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };

        locationBtn.textContent = "✓ Location ready";

        resolve(coords);
      },
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000
      }
    );
  });
}

locationBtn.onclick = async () => {
  try {
    await getLocation();

    status.textContent = ready
      ? "Location ready. You can search now."
      : "Location ready.";
  } catch {
    status.textContent =
      "Location permission was not available. FindIt can still identify the item.";
  }
};

/* =========================================================
   GEMINI BACKEND
========================================================= */

async function searchGemini() {
  const form = new FormData();

  form.append("image", photo.files[0]);

  if (coords) {
    form.append("lat", coords.lat);
    form.append("lon", coords.lon);
  }

  const response = await fetch(`${apiBase}/search`, {
    method: "POST",
    body: form
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.details ||
      data.error ||
      "FindIt could not analyse the image."
    );
  }

  return data;
}

/* =========================================================
   PRICE FORMATTER
========================================================= */

function money(product) {
  if (product.price == null) {
    return "Price unavailable";
  }

  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: product.currency || "ZAR"
  }).format(product.price);
}

/* =========================================================
   IDENTIFICATION UI
========================================================= */

function showIdentification(data) {
  const item = data.identification || {};

  $("#results").classList.remove("hidden");

  $("#noMatch")?.classList.add("hidden");

  $("#resultTitle").textContent =
    item.name ||
    item.object ||
    "Item identified";

  $("#summary").textContent =
    item.summary ||
    data.message ||
    "";

  const confidence =
    typeof item.confidence === "number"
      ? Math.round(item.confidence * 100)
      : null;

  const visibleText =
    Array.isArray(item.visibleText) && item.visibleText.length
      ? `
        <p>
          Visible text:
          <b>${item.visibleText.join(", ")}</b>
        </p>
      `
      : "";

  $("#confidence").innerHTML = `
    <div class="confidence">

      <strong>
        Gemini identification
        ${
          confidence !== null
            ? `— ${confidence}% confidence`
            : ""
        }
      </strong>

      <p>
        Object:
        <b>${item.object || "Unknown"}</b>
      </p>

      <p>
        Brand:
        <b>${item.brand || "Not detected"}</b>
      </p>

      <p>
        Model:
        <b>${item.model || "Not detected"}</b>
      </p>

      <p>
        Category:
        <b>${item.category || "Not detected"}</b>
      </p>

      ${
        item.searchQuery
          ? `
            <p>
              Search phrase:
              <b>${item.searchQuery}</b>
            </p>
          `
          : ""
      }

      ${visibleText}

    </div>
  `;
}

/* =========================================================
   VERIFIED PRODUCT OFFERS
   This stays empty until real retailer catalogue data
   is connected.
========================================================= */

function renderOffers(data) {
  const products =
    data.offers ||
    data.products ||
    [];

  const list = $("#productList");
  const banner = $("#liveBanner");

  if (!products.length) {
    list.innerHTML = "";

    banner.textContent =
      "No verified retailer catalogue result yet. FindIt will not invent prices or stock.";

    return false;
  }

  banner.textContent =
    "✓ Verified retailer product data found.";

  list.innerHTML = products
    .map((product) => {
      const storeName =
        product.store?.name ||
        "Store unavailable";

      const distance =
        product.distanceKm != null
          ? ` • 📍 ${Number(product.distanceKm).toFixed(1)} km`
          : "";

      const stock =
        product.stock?.status ||
        "Stock unavailable";

      const productLink =
        product.url
          ? `
            <a
              class="link"
              href="${product.url}"
              target="_blank"
              rel="noopener"
            >
              View product →
            </a>
          `
          : "";

      const directions =
        product.store?.lat != null &&
        product.store?.lon != null
          ? `
            <a
              class="link"
              target="_blank"
              rel="noopener"
              href="https://www.google.com/maps/dir/?api=1&destination=${product.store.lat},${product.store.lon}"
            >
              Directions →
            </a>
          `
          : "";

      return `
        <article class="product">

          ${
            product.image
              ? `
                <img
                  src="${product.image}"
                  alt="${product.name || "Product"}"
                >
              `
              : ""
          }

          <div>

            <h3>
              ${product.name || "Product"}
            </h3>

            <p class="retailer">
              ${
                product.brand
                  ? product.brand + " • "
                  : ""
              }

              ${product.retailer || ""}
            </p>

            ${
              product.match != null
                ? `
                  <p class="match">
                    🎯 Match:
                    ${Math.round(product.match * 100)}%
                  </p>
                `
                : ""
            }

            <p>
              🏪 ${storeName}${distance}
            </p>

            <p class="stock">
              📦 ${stock}
            </p>

            ${productLink}

            ${directions}

          </div>

          <div class="price">
            ${money(product)}
          </div>

        </article>
      `;
    })
    .join("");

  return true;
}

/* =========================================================
   UNIVERSAL STORE MATCHING
========================================================= */

function buildStoreProfile(item) {
  const text = `
    ${item.object || ""}
    ${item.name || ""}
    ${item.category || ""}
    ${item.searchQuery || ""}
  `.toLowerCase();

  const profile = {
    shopTypes: [],
    keywords: [],
    retailerNames: []
  };

  if (
    text.includes("shoe") ||
    text.includes("sneaker") ||
    text.includes("footwear")
  ) {
    profile.shopTypes = [
      "shoes",
      "sports",
      "clothes",
      "department_store"
    ];

    profile.keywords = [
      "shoe",
      "shoes",
      "sneaker",
      "sport",
      "sports",
      "footwear"
    ];

    profile.retailerNames = [
      "nike",
      "adidas",
      "sportscene",
      "totalsports",
      "footgear",
      "sneaker factory",
      "shoe city",
      "mr price sport",
      "sportsmans warehouse"
    ];
  }

  else if (
    text.includes("microphone") ||
    text.includes("headphone") ||
    text.includes("speaker") ||
    text.includes("audio")
  ) {
    profile.shopTypes = [
      "electronics",
      "music",
      "hifi",
      "computer"
    ];

    profile.keywords = [
      "electronics",
      "audio",
      "music",
      "sound",
      "hifi",
      "computer"
    ];
  }

  else if (
    text.includes("phone") ||
    text.includes("smartphone") ||
    text.includes("tablet")
  ) {
    profile.shopTypes = [
      "mobile_phone",
      "electronics",
      "computer"
    ];

    profile.keywords = [
      "phone",
      "mobile",
      "electronics",
      "computer"
    ];
  }

  else if (
    text.includes("computer") ||
    text.includes("laptop") ||
    text.includes("monitor")
  ) {
    profile.shopTypes = [
      "computer",
      "electronics"
    ];

    profile.keywords = [
      "computer",
      "electronics",
      "laptop",
      "technology"
    ];
  }

  else if (
    text.includes("camera")
  ) {
    profile.shopTypes = [
      "camera",
      "electronics"
    ];

    profile.keywords = [
      "camera",
      "photography",
      "electronics"
    ];
  }

  else if (
    text.includes("shirt") ||
    text.includes("sweater") ||
    text.includes("hoodie") ||
    text.includes("jacket") ||
    text.includes("clothing") ||
    text.includes("fashion")
  ) {
    profile.shopTypes = [
      "clothes",
      "fashion",
      "department_store"
    ];

    profile.keywords = [
      "clothing",
      "fashion",
      "clothes"
    ];
  }

  else if (
    text.includes("flower") ||
    text.includes("plant")
  ) {
    profile.shopTypes = [
      "florist",
      "garden_centre"
    ];

    profile.keywords = [
      "flower",
      "florist",
      "garden",
      "plant"
    ];
  }

  else if (
    text.includes("lamp") ||
    text.includes("light") ||
    text.includes("lighting")
  ) {
    profile.shopTypes = [
      "lighting",
      "hardware",
      "furniture",
      "houseware"
    ];

    profile.keywords = [
      "lighting",
      "lights",
      "hardware",
      "home"
    ];
  }

  else if (
    text.includes("chair") ||
    text.includes("table") ||
    text.includes("furniture")
  ) {
    profile.shopTypes = [
      "furniture",
      "houseware",
      "interior_decoration"
    ];

    profile.keywords = [
      "furniture",
      "home",
      "interior"
    ];
  }

  else if (
    text.includes("book")
  ) {
    profile.shopTypes = [
      "books",
      "stationery"
    ];

    profile.keywords = [
      "book",
      "books",
      "stationery"
    ];
  }

  else if (
    text.includes("pencil") ||
    text.includes("stationery") ||
    text.includes("school")
  ) {
    profile.shopTypes = [
      "stationery",
      "variety_store"
    ];

    profile.keywords = [
      "stationery",
      "school",
      "office"
    ];
  }

  else if (
    text.includes("tool") ||
    text.includes("hardware")
  ) {
    profile.shopTypes = [
      "hardware",
      "doityourself",
      "trade"
    ];

    profile.keywords = [
      "hardware",
      "tool",
      "tools"
    ];
  }

  else if (
    text.includes("toy") ||
    text.includes("game")
  ) {
    profile.shopTypes = [
      "toys",
      "games",
      "video_games",
      "variety_store"
    ];

    profile.keywords = [
      "toy",
      "toys",
      "game",
      "games"
    ];
  }

  else if (
    text.includes("appliance") ||
    text.includes("kettle") ||
    text.includes("microwave") ||
    text.includes("toaster")
  ) {
    profile.shopTypes = [
      "appliance",
      "electronics",
      "houseware"
    ];

    profile.keywords = [
      "appliance",
      "home",
      "electronics"
    ];
  }

  else if (
    text.includes("car") ||
    text.includes("vehicle")
  ) {
    profile.shopTypes = [
      "car",
      "car_repair",
      "car_parts"
    ];

    profile.keywords = [
      "car",
      "vehicle",
      "motor"
    ];
  }

  else {
    profile.shopTypes = [];

    profile.keywords =
      String(item.category || item.object || "")
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length > 3);
  }

  if (item.brand) {
    profile.retailerNames.unshift(
      String(item.brand).toLowerCase()
    );
  }

  return profile;
}

/* =========================================================
   DISTANCE
========================================================= */

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const p = Math.PI / 180;

  const a =
    Math.sin((lat2 - lat1) * p / 2) ** 2 +
    Math.cos(lat1 * p) *
    Math.cos(lat2 * p) *
    Math.sin((lon2 - lon1) * p / 2) ** 2;

  return (
    R *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
}

/* =========================================================
   OVERPASS SERVER WITH TIMEOUT
========================================================= */

async function fetchWithTimeout(
  url,
  options,
  timeoutMs = 12000
) {
  const controller =
    new AbortController();

  const timer =
    setTimeout(
      () => controller.abort(),
      timeoutMs
    );

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

async function queryOverpass(query) {
  const servers = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://z.overpass-api.de/api/interpreter"
  ];

  for (const server of servers) {
    try {
      const body =
        new URLSearchParams();

      body.set("data", query);

      const response =
        await fetchWithTimeout(
          server,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded;charset=UTF-8"
            },
            body
          },
          12000
        );

      if (!response.ok) {
        continue;
      }

      return await response.json();

    } catch (error) {
      console.warn(
        "Overpass server failed:",
        server,
        error
      );
    }
  }

  throw new Error(
    "All free nearby-store servers failed."
  );
}

/* =========================================================
   STORE RELEVANCE
========================================================= */

function relevanceScore(
  tags,
  profile,
  item
) {
  const name =
    String(
      tags.name ||
      tags.brand ||
      ""
    ).toLowerCase();

  const shop =
    String(
      tags.shop ||
      ""
    ).toLowerCase();

  const description =
    String(
      tags.description ||
      tags.operator ||
      tags.branch ||
      ""
    ).toLowerCase();

  const combined =
    `${name} ${shop} ${description}`;

  let score = 0;

  if (
    profile.shopTypes.includes(shop)
  ) {
    score += 50;
  }

  for (
    const keyword
    of profile.keywords
  ) {
    if (
      combined.includes(
        keyword.toLowerCase()
      )
    ) {
      score += 12;
    }
  }

  for (
    const retailer
    of profile.retailerNames
  ) {
    if (
      name.includes(
        retailer.toLowerCase()
      )
    ) {
      score += 40;
    }
  }

  if (
    item.brand &&
    name.includes(
      String(item.brand).toLowerCase()
    )
  ) {
    score += 60;
  }

  return score;
}

/* =========================================================
   FIND NEARBY STORES
========================================================= */

async function findNearbyStores(item) {
  const fallback =
    $("#fallback");

  const shops =
    $("#shops");

  if (!fallback || !shops) {
    return;
  }

  fallback.classList.remove(
    "hidden"
  );

  if (!coords) {
    shops.innerHTML = `
      <p>
        Press <b>Use my location</b>
        to see nearby relevant stores.
      </p>
    `;

    return;
  }

  const profile =
    buildStoreProfile(item);

  shops.innerHTML = `
    <p>
      Searching for relevant nearby stores…
    </p>
  `;

  /*
    Important:
    We deliberately ask OpenStreetMap for ALL mapped shops
    nearby, then FindIt ranks them itself.

    This is much more reliable than only searching
    shop=shoes / shop=electronics / etc.
  */

  const radius = 20000;

  const query = `
    [out:json][timeout:20];

    (
      nwr(
        around:${radius},
        ${coords.lat},
        ${coords.lon}
      )
      ["shop"];

      nwr(
        around:${radius},
        ${coords.lat},
        ${coords.lon}
      )
      ["amenity"="marketplace"];
    );

    out center tags;
  `;

  try {
    const data =
      await queryOverpass(query);

    const allStores =
      (data.elements || [])
        .map((place) => {
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
            "Unnamed retail store";

          const type =
            tags.shop ||
            tags.amenity ||
            "retail";

          const distance =
            distanceKm(
              coords.lat,
              coords.lon,
              lat,
              lon
            );

          const score =
            relevanceScore(
              tags,
              profile,
              item
            );

          return {
            name,
            type,
            lat,
            lon,
            distance,
            score
          };
        })
        .filter(Boolean);

    /*
      First try strongly relevant stores.
    */

    let stores =
      allStores.filter(
        (store) =>
          store.score >= 12
      );

    /*
      If OpenStreetMap tags are weak/incomplete,
      show broader retail matches rather than
      incorrectly saying no stores exist.
    */

    if (!stores.length) {
      stores =
        allStores.filter(
          (store) =>
            store.score > 0
        );
    }

    stores.sort(
      (a, b) => {
        if (
          b.score !== a.score
        ) {
          return (
            b.score -
            a.score
          );
        }

        return (
          a.distance -
          b.distance
        );
      }
    );

    const unique = [];

    const seen =
      new Set();

    for (
      const store
      of stores
    ) {
      const key =
        `${store.name.toLowerCase()}-${store.lat.toFixed(5)}-${store.lon.toFixed(5)}`;

      if (
        seen.has(key)
      ) {
        continue;
      }

      seen.add(key);

      unique.push(store);

      if (
        unique.length >= 12
      ) {
        break;
      }
    }

    if (!unique.length) {
      shops.innerHTML = `
        <p>
          FindIt reached the map service,
          but could not find enough mapped
          retailer information for this item nearby.
        </p>
      `;

      return;
    }

    shops.innerHTML =
      unique
        .map(
          (store) => `
            <div class="shop">

              <span>

                <b>
                  ${store.name}
                </b>

                <br>

                <small>
                  ${store.type}
                  • Nearby relevant retailer
                </small>

              </span>

              <span>

                <small>
                  ${store.distance.toFixed(1)} km
                </small>

                <br>

                <a
                  class="link"
                  target="_blank"
                  rel="noopener"
                  href="https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lon}"
                >
                  Directions →
                </a>

              </span>

            </div>
          `
        )
        .join("");

  } catch (error) {
    console.error(
      "Nearby store search failed:",
      error
    );

    shops.innerHTML = `
      <p>
        The free nearby-store service
        could not respond right now.
        Try again shortly.
      </p>
    `;
  }
}

/* =========================================================
   LOW CONFIDENCE
========================================================= */

function showLowConfidence(data) {
  const item =
    data.identification || {};

  $("#results").classList.remove(
    "hidden"
  );

  $("#resultTitle").textContent =
    item.name ||
    item.object ||
    "We aren't confident enough";

  $("#summary").textContent =
    data.message ||
    "FindIt could not identify this item confidently enough.";

  $("#productList").innerHTML =
    "";

  $("#liveBanner").textContent =
    "";

  $("#confidence").innerHTML =
    "";

  $("#fallback")?.classList.add(
    "hidden"
  );

  $("#noMatch")?.classList.remove(
    "hidden"
  );
}

/* =========================================================
   MAIN SEARCH
========================================================= */

searchBtn.onclick = async () => {
  if (!photo.files[0]) {
    return;
  }

  searchBtn.disabled = true;

  $("#noMatch")?.classList.add(
    "hidden"
  );

  status.textContent =
    "Gemini is identifying the item…";

  try {
    const data =
      await searchGemini();

    const confidence =
      Number(
        data.identification
          ?.confidence || 0
      );

    if (
      confidence < 0.55
    ) {
      showLowConfidence(data);
    }

    else {
      showIdentification(data);

      renderOffers(data);

      status.textContent =
        "Item identified. Searching nearby retailers…";

      await findNearbyStores(
        data.identification
      );
    }

    $("#results")
      .scrollIntoView({
        behavior: "smooth"
      });

    status.textContent =
      "Search complete.";

  } catch (error) {
    console.error(error);

    status.textContent =
      "FindIt could not analyse the image: " +
      error.message;

  } finally {
    searchBtn.disabled =
      !ready;
  }
};

/* =========================================================
   RETRY
========================================================= */

$("#retry")
  ?.addEventListener(
    "click",
    () => photo.click()
  );
