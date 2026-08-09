const $ = (s) => document.querySelector(s);

const photo = $("#photo");
const preview = $("#preview");
const empty = $("#empty");
const searchBtn = $("#search");
const locationBtn = $("#location");
const status = $("#status");

let coords = null;
let ready = false;

const apiBase = window.FINDIT_API_BASE || "/api";

/* =========================
   IMAGE
========================= */

photo.onchange = () => {
  if (!photo.files[0]) return;

  ready = true;

  preview.src = URL.createObjectURL(photo.files[0]);
  preview.style.display = "block";

  if (empty) empty.style.display = "none";

  searchBtn.disabled = false;

  status.textContent =
    "Photo ready. FindIt will identify the item, brand and model.";
};

/* =========================
   LOCATION
========================= */

function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location is not supported."));
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
      reject,
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
      ? "Location ready. Search when you're ready."
      : "Location ready.";
  } catch {
    status.textContent =
      "Location permission was not available. Product identification can still work.";
  }
};

/* =========================
   GEMINI / PRODUCT BACKEND
========================= */

async function searchProduct() {
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
      "FindIt could not analyse this image."
    );
  }

  return data;
}

/* =========================
   FORMATTERS
========================= */

function money(product) {
  if (product.price == null) {
    return "Price not verified";
  }

  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: product.currency || "ZAR"
  }).format(product.price);
}

function cleanPhone(phone) {
  if (!phone) return null;

  return String(phone).trim();
}

function safeWebsite(url) {
  if (!url) return null;

  let website = String(url).trim();

  if (!/^https?:\/\//i.test(website)) {
    website = "https://" + website;
  }

  return website;
}

function domainFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/* =========================
   IDENTIFICATION
========================= */

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
    Array.isArray(item.visibleText) &&
    item.visibleText.length
      ? item.visibleText.join(", ")
      : "None detected";

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

      <p>
        Visible text:
        <b>${visibleText}</b>
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

    </div>
  `;
}

/* =========================
   VERIFIED PRODUCT OFFERS
========================= */

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
      "No verified retailer price/stock result yet. Nearby stores below are relevant retailers, not confirmed exact-product stock.";

    return false;
  }

  banner.textContent =
    "✓ Verified product offers found.";

  list.innerHTML = products
    .map((product) => {
      const storeName =
        product.store?.name ||
        "Store unavailable";

      const distance =
        product.distanceKm != null
          ? ` • ${Number(product.distanceKm).toFixed(1)} km`
          : "";

      const stock =
        product.stock?.status ||
        "Stock not verified";

      const phone =
        cleanPhone(
          product.store?.phone ||
          product.phone
        );

      const website =
        safeWebsite(
          product.store?.website ||
          product.website
        );

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

            ${
              phone
                ? `
                  <a
                    class="link"
                    href="tel:${phone.replace(/\s/g, "")}"
                  >
                    📞 ${phone}
                  </a>
                `
                : ""
            }

            ${
              website
                ? `
                  <a
                    class="link"
                    target="_blank"
                    rel="noopener"
                    href="${website}"
                  >
                    🌐 Store website →
                  </a>
                `
                : ""
            }

            ${
              product.url
                ? `
                  <a
                    class="link"
                    target="_blank"
                    rel="noopener"
                    href="${product.url}"
                  >
                    View exact product →
                  </a>
                `
                : ""
            }

            ${
              product.store?.lat != null &&
              product.store?.lon != null
                ? `
                  <a
                    class="link"
                    target="_blank"
                    rel="noopener"
                    href="https://www.google.com/maps/dir/?api=1&destination=${product.store.lat},${product.store.lon}"
                  >
                    🧭 Directions →
                  </a>
                `
                : ""
            }

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

/* =========================
   UNIVERSAL RETAIL PROFILE
========================= */

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
      "sneaker",
      "footwear",
      "sport"
    ];

    profile.retailerNames = [
      "nike",
      "adidas",
      "footgear",
      "sportscene",
      "totalsports",
      "sneaker factory",
      "shoe city",
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
      "audio",
      "music",
      "electronics",
      "sound",
      "hifi"
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
      "electronics"
    ];
  }

  else if (
    text.includes("computer") ||
    text.includes("laptop")
  ) {
    profile.shopTypes = [
      "computer",
      "electronics"
    ];

    profile.keywords = [
      "computer",
      "laptop",
      "technology"
    ];
  }

  else if (
    text.includes("shirt") ||
    text.includes("sweater") ||
    text.includes("hoodie") ||
    text.includes("jacket") ||
    text.includes("fashion") ||
    text.includes("clothing")
  ) {
    profile.shopTypes = [
      "clothes",
      "fashion",
      "department_store"
    ];

    profile.keywords = [
      "clothes",
      "fashion",
      "clothing"
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
    text.includes("light") ||
    text.includes("lamp")
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
      "home",
      "hardware"
    ];
  }

  else if (
    text.includes("furniture") ||
    text.includes("chair") ||
    text.includes("table")
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

  else if (text.includes("book")) {
    profile.shopTypes = [
      "books",
      "stationery"
    ];

    profile.keywords = [
      "book",
      "books"
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
    text.includes("camera")
  ) {
    profile.shopTypes = [
      "camera",
      "electronics"
    ];

    profile.keywords = [
      "camera",
      "photography"
    ];
  }

  else {
    profile.keywords =
      String(
        item.category ||
        item.object ||
        ""
      )
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

/* =========================
   DISTANCE
========================= */

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

/* =========================
   STORE RELEVANCE
========================= */

function relevanceScore(tags, profile, item) {
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

  const combined = `
    ${name}
    ${shop}
    ${tags.description || ""}
    ${tags.operator || ""}
    ${tags.branch || ""}
  `.toLowerCase();

  let score = 0;

  if (profile.shopTypes.includes(shop)) {
    score += 50;
  }

  for (const keyword of profile.keywords) {
    if (combined.includes(keyword)) {
      score += 12;
    }
  }

  for (const retailer of profile.retailerNames) {
    if (name.includes(retailer)) {
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

/* =========================
   SERVER-SIDE NEARBY SEARCH
========================= */

async function getNearbyData() {
  const radius = 20000;

  const query = `
    [out:json][timeout:20];
    (
      nwr(around:${radius},${coords.lat},${coords.lon})["shop"];
      nwr(around:${radius},${coords.lat},${coords.lon})["amenity"="marketplace"];
    );
    out center tags;
  `;

  const servers = [
    "https://overpass-api.de/api/interpreter",
    "https://z.overpass-api.de/api/interpreter"
  ];

  let lastError = null;

  for (const server of servers) {
    try {
      const body = new URLSearchParams();
      body.set("data", query);

      const controller = new AbortController();

      const timer = setTimeout(() => {
        controller.abort();
      }, 15000);

      try {
        const response = await fetch(server, {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded;charset=UTF-8"
          },
          body,
          signal: controller.signal
        });

        if (!response.ok) {
          lastError = new Error(
            `Nearby server returned ${response.status}`
          );
          continue;
        }

        const data = await response.json();

        return data.elements || [];
      } finally {
        clearTimeout(timer);
      }
    } catch (error) {
      lastError = error;
      console.warn(
        "Nearby server failed:",
        server,
        error
      );
    }
  }

  throw lastError || new Error(
    "Nearby stores could not be loaded."
  );
}

/* =========================
   FIND NEARBY STORES
========================= */

async function findNearbyStores(item) {
  const fallback = $("#fallback");
  const shops = $("#shops");

  if (!fallback || !shops) return;

  fallback.classList.remove("hidden");

  if (!coords) {
    shops.innerHTML = `
      <p>
        Press <b>Use my location</b>
        to see nearby retailers.
      </p>
    `;

    return;
  }

  const profile =
    buildStoreProfile(item);

  shops.innerHTML =
    "<p>Searching nearby retailers…</p>";

  try {
    const elements =
      await getNearbyData();

    const stores =
      elements
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
            "Unnamed retailer";

          const type =
            tags.shop ||
            tags.amenity ||
            "retail";

          const phone =
            cleanPhone(
              tags["contact:phone"] ||
              tags.phone ||
              tags["contact:mobile"]
            );

          const website =
            safeWebsite(
              tags["contact:website"] ||
              tags.website
            );

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
            phone,
            website,
            lat,
            lon,
            distance,
            score
          };
        })
        .filter(Boolean)
        .filter(
          (store) =>
            store.score > 0
        )
        .sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score;
          }

          return a.distance - b.distance;
        });

    const unique = [];
    const seen = new Set();

    for (const store of stores) {
      const key =
        `${store.name.toLowerCase()}-${store.lat.toFixed(4)}-${store.lon.toFixed(4)}`;

      if (seen.has(key)) continue;

      seen.add(key);

      unique.push(store);

      if (unique.length >= 12) break;
    }

    if (!unique.length) {
      shops.innerHTML = `
        <p>
          FindIt reached the map service,
          but no strongly relevant mapped retailers
          were found for this item.
        </p>
      `;

      return;
    }

    shops.innerHTML =
      unique
        .map((store) => {
          const phoneButton =
            store.phone
              ? `
                <a
                  class="link"
                  href="tel:${store.phone.replace(/\s/g, "")}"
                >
                  📞 ${store.phone}
                </a>
              `
              : `
                <small>
                  📞 Phone unavailable
                </small>
              `;

          const websiteButton =
            store.website
              ? `
                <a
                  class="link"
                  href="${store.website}"
                  target="_blank"
                  rel="noopener"
                >
                  🌐 Website →
                </a>
              `
              : "";

          let productSearch = "";

          if (
            store.website &&
            item.searchQuery
          ) {
            const domain =
              domainFromUrl(
                store.website
              );

            if (domain) {
              const query =
                encodeURIComponent(
                  `site:${domain} ${item.searchQuery}`
                );

              productSearch = `
                <a
                  class="link"
                  target="_blank"
                  rel="noopener"
                  href="https://www.google.com/search?q=${query}"
                >
                  🔎 Search this retailer →
                </a>
              `;
            }
          }

          return `
            <div class="shop">

              <div>

                <b>
                  ${store.name}
                </b>

                <br>

                <small>
                  ${store.type}
                  • Relevant nearby retailer
                </small>

                <br>

                <small>
                  ${
                    store.distance.toFixed(1)
                  } km away
                </small>

                <br><br>

                ${phoneButton}

                ${websiteButton}

                ${productSearch}

              </div>

              <div>

                <a
                  class="link"
                  target="_blank"
                  rel="noopener"
                  href="https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lon}"
                >
                  🧭 Directions →
                </a>

                <br>

                <small>
                  Exact stock not verified
                </small>

              </div>

            </div>
          `;
        })
        .join("");

  } catch (error) {
    console.error(
      "Nearby-store error:",
      error
    );

    shops.innerHTML = `
      <p>
        Nearby retailers could not be loaded right now.
        Please try again.
      </p>
    `;
  }
}

/* =========================
   LOW CONFIDENCE
========================= */

function showLowConfidence(data) {
  const item =
    data.identification || {};

  $("#results").classList.remove("hidden");

  $("#resultTitle").textContent =
    item.name ||
    item.object ||
    "We aren't confident enough";

  $("#summary").textContent =
    data.message ||
    "FindIt could not identify this item confidently enough.";

  $("#productList").innerHTML = "";
  $("#liveBanner").textContent = "";
  $("#confidence").innerHTML = "";

  $("#fallback")?.classList.add("hidden");
  $("#noMatch")?.classList.remove("hidden");
}

/* =========================
   MAIN SEARCH
========================= */

searchBtn.onclick = async () => {
  if (!photo.files[0]) return;

  searchBtn.disabled = true;

  $("#noMatch")?.classList.add("hidden");

  status.textContent =
    "Gemini is identifying the item…";

  try {
    const data =
      await searchProduct();

    const confidence =
      Number(
        data.identification?.confidence ||
        0
      );

    if (confidence < 0.55) {
      showLowConfidence(data);
    } else {
      showIdentification(data);

      renderOffers(data);

      status.textContent =
        "Item identified. Finding nearby retailers…";

      await findNearbyStores(
        data.identification
      );
    }

    $("#results").scrollIntoView({
      behavior: "smooth"
    });

    status.textContent =
      "Search complete.";

  } catch (error) {
    console.error(error);

    status.textContent =
      "FindIt could not complete the search: " +
      error.message;
  } finally {
    searchBtn.disabled = !ready;
  }
};

/* =========================
   RETRY
========================= */

$("#retry")?.addEventListener(
  "click",
  () => photo.click()
);
