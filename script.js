const $ = (selector) => document.querySelector(selector);

const photo = $("#photo");
const preview = $("#preview");
const empty = $("#empty");
const searchBtn = $("#search");
const locationBtn = $("#location");
const status = $("#status");

let coords = null;
let imageReady = false;

const apiBase = window.FINDIT_API_BASE || "/api";

/* =========================================================
   BASIC SAFETY / FORMATTING
========================================================= */

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normaliseWebsite(value) {
  if (!value) return null;

  let url = String(value).trim();

  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  try {
    const parsed = new URL(url);

    if (
      parsed.protocol !== "http:" &&
      parsed.protocol !== "https:"
    ) {
      return null;
    }

    return parsed.href;
  } catch {
    return null;
  }
}

function normalisePhone(value) {
  if (!value) return null;

  const phone = String(value).trim();

  return phone || null;
}

function phoneHref(phone) {
  return String(phone)
    .replace(/[^\d+]/g, "");
}

function money(product) {
  if (product.price == null) {
    return "Price not verified";
  }

  try {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: product.currency || "ZAR"
    }).format(product.price);
  } catch {
    return String(product.price);
  }
}

/* =========================================================
   IMAGE UPLOAD
========================================================= */

photo.addEventListener("change", () => {
  const file = photo.files?.[0];

  if (!file) return;

  imageReady = true;

  preview.src = URL.createObjectURL(file);
  preview.style.display = "block";

  if (empty) {
    empty.style.display = "none";
  }

  searchBtn.disabled = false;

  status.textContent =
    "Photo ready. FindIt will identify the actual item, brand and model.";
});

/* =========================================================
   LOCATION
========================================================= */

function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(
        new Error("Location is not supported by this browser.")
      );

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        coords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };

        locationBtn.textContent =
          "✓ Location ready";

        resolve(coords);
      },

      (error) => {
        reject(error);
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000
      }
    );
  });
}

locationBtn.addEventListener(
  "click",
  async () => {
    try {
      locationBtn.disabled = true;

      status.textContent =
        "Getting your location…";

      await getLocation();

      status.textContent =
        imageReady
          ? "Location ready. You can identify the item now."
          : "Location ready.";
    } catch {
      status.textContent =
        "Location permission was not available. FindIt can still identify the item.";
    } finally {
      locationBtn.disabled = false;
    }
  }
);

/* =========================================================
   GEMINI IDENTIFICATION
========================================================= */

async function identifyItem() {
  const file = photo.files?.[0];

  if (!file) {
    throw new Error(
      "Please upload an image first."
    );
  }

  const form = new FormData();

  form.append("image", file);

  if (coords) {
    form.append("lat", coords.lat);
    form.append("lon", coords.lon);
  }

  const response = await fetch(
    `${apiBase}/search`,
    {
      method: "POST",
      body: form
    }
  );

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "FindIt received an unreadable response."
    );
  }

  if (!response.ok || data.ok === false) {
    throw new Error(
      data.details ||
      data.error ||
      "Image identification failed."
    );
  }

  return data;
}

/* =========================================================
   IDENTIFICATION DISPLAY
========================================================= */

function renderIdentification(data) {
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
    Number.isFinite(
      Number(item.confidence)
    )
      ? Math.round(
          Number(item.confidence) * 100
        )
      : null;

  const visibleText =
    Array.isArray(item.visibleText) &&
    item.visibleText.length
      ? item.visibleText
          .map(esc)
          .join(", ")
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
        <b>${esc(item.object || "Unknown")}</b>
      </p>

      <p>
        Brand:
        <b>${esc(item.brand || "Not detected")}</b>
      </p>

      <p>
        Model:
        <b>${esc(item.model || "Not detected")}</b>
      </p>

      <p>
        Category:
        <b>${esc(item.category || "Not detected")}</b>
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
              <b>${esc(item.searchQuery)}</b>
            </p>
          `
          : ""
      }

    </div>
  `;
}

/* =========================================================
   VERIFIED PRODUCT OFFERS

   These only appear when /api/search eventually returns
   legitimate retailer catalogue information.
========================================================= */

function renderVerifiedOffers(data) {
  const products =
    Array.isArray(data.offers)
      ? data.offers
      : Array.isArray(data.products)
      ? data.products
      : [];

  const list = $("#productList");
  const banner = $("#liveBanner");

  if (!products.length) {
    list.innerHTML = "";

    banner.textContent =
      "No verified retailer price/stock result yet. Nearby stores below are relevant retailers, not confirmed exact-product stock.";

    return false;
  }

  banner.textContent =
    "✓ Verified retailer product offers found.";

  list.innerHTML = products
    .map((product) => {
      const store =
        product.store || {};

      const website =
        normaliseWebsite(
          store.website ||
          product.website
        );

      const phone =
        normalisePhone(
          store.phone ||
          product.phone
        );

      const distance =
        product.distanceKm != null
          ? `${Number(product.distanceKm).toFixed(1)} km`
          : null;

      const stock =
        product.stock?.status ||
        "Stock not verified";

      const productUrl =
        normaliseWebsite(product.url);

      return `
        <article class="product">

          ${
            product.image
              ? `
                <img
                  src="${esc(product.image)}"
                  alt="${esc(product.name || "Product")}"
                >
              `
              : ""
          }

          <div>

            <h3>
              ${esc(product.name || "Product")}
            </h3>

            <p class="retailer">
              ${
                product.brand
                  ? `${esc(product.brand)} • `
                  : ""
              }
              ${esc(product.retailer || "")}
            </p>

            ${
              product.match != null
                ? `
                  <p class="match">
                    🎯 Match:
                    ${Math.round(
                      Number(product.match) * 100
                    )}%
                  </p>
                `
                : ""
            }

            <p>
              🏪
              ${esc(
                store.name ||
                "Store unavailable"
              )}
              ${
                distance
                  ? ` • ${esc(distance)}`
                  : ""
              }
            </p>

            <p class="stock">
              📦 ${esc(stock)}
            </p>

            ${
              phone
                ? `
                  <p>
                    <a
                      class="link"
                      href="tel:${esc(phoneHref(phone))}"
                    >
                      📞 ${esc(phone)}
                    </a>
                  </p>
                `
                : ""
            }

            ${
              website
                ? `
                  <p>
                    <a
                      class="link"
                      href="${esc(website)}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      🌐 Store website →
                    </a>
                  </p>
                `
                : ""
            }

            ${
              productUrl
                ? `
                  <p>
                    <a
                      class="link"
                      href="${esc(productUrl)}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      🛍 View exact product →
                    </a>
                  </p>
                `
                : ""
            }

            ${
              store.lat != null &&
              store.lon != null
                ? `
                  <p>
                    <a
                      class="link"
                      href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                        `${store.lat},${store.lon}`
                      )}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      🧭 Directions →
                    </a>
                  </p>
                `
                : ""
            }

          </div>

          <div class="price">
            ${esc(money(product))}
          </div>

        </article>
      `;
    })
    .join("");

  return true;
}

/* =========================================================
   UNIVERSAL STORE PROFILE

   Nike shoes are only one example.
   These rules support many item categories.
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
    /shoe|sneaker|footwear/.test(text)
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
  }

  else if (
    /microphone|headphone|speaker|audio|earphone/.test(text)
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
    /smartphone|mobile phone|phone|tablet/.test(text)
  ) {
    profile.shopTypes = [
      "mobile_phone",
      "electronics",
      "computer"
    ];

    profile.keywords = [
      "mobile",
      "phone",
      "electronics"
    ];
  }

  else if (
    /computer|laptop|monitor|keyboard|mouse/.test(text)
  ) {
    profile.shopTypes = [
      "computer",
      "electronics"
    ];

    profile.keywords = [
      "computer",
      "technology",
      "electronics"
    ];
  }

  else if (
    /camera|photography|lens/.test(text)
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

  else if (
    /shirt|sweater|hoodie|jacket|pants|trousers|clothing|fashion|dress/.test(text)
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
    /flower|plant|bouquet/.test(text)
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
    /light|lamp|lighting/.test(text)
  ) {
    profile.shopTypes = [
      "lighting",
      "hardware",
      "furniture",
      "houseware"
    ];

    profile.keywords = [
      "lighting",
      "light",
      "home",
      "hardware"
    ];
  }

  else if (
    /chair|table|sofa|couch|furniture|desk/.test(text)
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
    /book|novel/.test(text)
  ) {
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
    /pencil|pen|stationery|school supplies/.test(text)
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
    /tool|hardware|drill|screwdriver|hammer/.test(text)
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
    /toy|game|lego|video game/.test(text)
  ) {
    profile.shopTypes = [
      "toys",
      "games",
      "video_games",
      "variety_store"
    ];

    profile.keywords = [
      "toy",
      "game",
      "games"
    ];
  }

  else if (
    /appliance|microwave|kettle|toaster|fridge|refrigerator|washing machine/.test(text)
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
    /car|vehicle|automobile/.test(text)
  ) {
    profile.shopTypes = [
      "car",
      "car_parts"
    ];

    profile.keywords = [
      "car",
      "motor",
      "vehicle"
    ];
  }

  else {
    profile.keywords = String(
      item.category ||
      item.object ||
      ""
    )
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(
        (word) =>
          word.length >= 4
      );
  }

  if (item.brand) {
    profile.retailerNames.push(
      String(item.brand).toLowerCase()
    );
  }

  return profile;
}

/* =========================================================
   DISTANCE
========================================================= */

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
      (lat2 - lat1) * p / 2
    ) ** 2 +
    Math.cos(lat1 * p) *
      Math.cos(lat2 * p) *
      Math.sin(
        (lon2 - lon1) * p / 2
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

/* =========================================================
   STORE RELEVANCE
========================================================= */

function relevanceScore(
  tags,
  profile,
  item
) {
  const name = String(
    tags.name ||
    tags.brand ||
    ""
  ).toLowerCase();

  const shop = String(
    tags.shop ||
    ""
  ).toLowerCase();

  const combined = `
    ${name}
    ${shop}
    ${tags.brand || ""}
    ${tags.description || ""}
    ${tags.operator || ""}
    ${tags.branch || ""}
  `.toLowerCase();

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
      String(item.brand)
        .toLowerCase()
    )
  ) {
    score += 60;
  }

  return score;
}

/* =========================================================
   NEARBY BACKEND

   IMPORTANT:
   Browser never contacts Overpass directly.
   This prevents the CORS problem we encountered.
========================================================= */

async function loadNearbyPlaces() {
  if (!coords) {
    throw new Error(
      "Location is required."
    );
  }

  const response = await fetch(
    `${apiBase}/nearby`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        lat: coords.lat,
        lon: coords.lon
      })
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
    const attempts =
      Array.isArray(data.attempts)
        ? data.attempts.join(" | ")
        : "";

    throw new Error(
      data.error ||
      attempts ||
      "Nearby-store service failed."
    );
  }

  return Array.isArray(data.elements)
    ? data.elements
    : [];
}

/* =========================================================
   STORE DETAILS
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

  const type =
    tags.shop ||
    tags.amenity ||
    "retail";

  const phone =
    normalisePhone(
      tags["contact:phone"] ||
      tags.phone ||
      tags["contact:mobile"] ||
      tags.mobile
    );

  const website =
    normaliseWebsite(
      tags["contact:website"] ||
      tags.website
    );

  const openingHours =
    tags.opening_hours ||
    null;

  const street =
    tags["addr:street"] ||
    "";

  const houseNumber =
    tags["addr:housenumber"] ||
    "";

  const suburb =
    tags["addr:suburb"] ||
    "";

  const city =
    tags["addr:city"] ||
    "";

  const address = [
    houseNumber,
    street,
    suburb,
    city
  ]
    .filter(Boolean)
    .join(", ");

  return {
    name,
    type,
    phone,
    website,
    openingHours,
    address,
    lat,
    lon,
    tags
  };
}

/* =========================================================
   NEARBY RETAILERS UI
========================================================= */

async function renderNearbyStores(item) {
  const fallback =
    $("#fallback");

  const shops =
    $("#shops");

  if (
    !fallback ||
    !shops
  ) {
    return;
  }

  fallback.classList.remove(
    "hidden"
  );

  if (!coords) {
    shops.innerHTML = `
      <p>
        Press <b>Use my location</b>
        to see nearby relevant retailers.
      </p>
    `;

    return;
  }

  shops.innerHTML = `
    <p>
      Searching for nearby relevant retailers…
    </p>
  `;

  try {
    const rawPlaces =
      await loadNearbyPlaces();

    const profile =
      buildStoreProfile(item);

    let stores = rawPlaces
      .map(extractStore)
      .filter(Boolean)
      .map((store) => {
        const score =
          relevanceScore(
            store.tags,
            profile,
            item
          );

        const distance =
          distanceKm(
            coords.lat,
            coords.lon,
            store.lat,
            store.lon
          );

        return {
          ...store,
          score,
          distance
        };
      })
      .filter(
        (store) =>
          store.score > 0
      );

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
    const seen = new Set();

    for (
      const store
      of stores
    ) {
      const key =
        `${store.name.toLowerCase()}|${store.lat.toFixed(5)}|${store.lon.toFixed(5)}`;

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
          but there wasn't enough mapped
          information to identify relevant retailers nearby.
        </p>
      `;

      return;
    }

    shops.innerHTML =
      unique
        .map((store) => {
          const directionsUrl =
            `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
              `${store.lat},${store.lon}`
            )}`;

          let retailerSearch = "";

          if (
            store.website &&
            item.searchQuery
          ) {
            try {
              const domain =
                new URL(
                  store.website
                ).hostname
                .replace(
                  /^www\./,
                  ""
                );

              const search =
                encodeURIComponent(
                  `site:${domain} ${item.searchQuery}`
                );

              retailerSearch = `
                <a
                  class="link"
                  href="https://www.google.com/search?q=${search}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  🔎 Search this retailer →
                </a>
              `;
            } catch {
              retailerSearch = "";
            }
          }

          return `
            <div class="shop">

              <div>

                <b>
                  ${esc(store.name)}
                </b>

                <br>

                <small>
                  ${esc(store.type)}
                  • Relevant nearby retailer
                </small>

                <br>

                <small>
                  📍 ${store.distance.toFixed(1)} km away
                </small>

                ${
                  store.address
                    ? `
                      <br>
                      <small>
                        ${esc(store.address)}
                      </small>
                    `
                    : ""
                }

                ${
                  store.openingHours
                    ? `
                      <br>
                      <small>
                        🕒 ${esc(store.openingHours)}
                      </small>
                    `
                    : ""
                }

                <br><br>

                ${
                  store.phone
                    ? `
                      <a
                        class="link"
                        href="tel:${esc(
                          phoneHref(
                            store.phone
                          )
                        )}"
                      >
                        📞 ${esc(store.phone)}
                      </a>
                    `
                    : `
                      <small>
                        📞 Phone unavailable
                      </small>
                    `
                }

                ${
                  store.website
                    ? `
                      <br>

                      <a
                        class="link"
                        href="${esc(store.website)}"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        🌐 Website →
                      </a>
                    `
                    : ""
                }

                ${
                  retailerSearch
                    ? `
                      <br>
                      ${retailerSearch}
                    `
                    : ""
                }

              </div>

              <div>

                <a
                  class="link"
                  href="${esc(directionsUrl)}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  🧭 Directions →
                </a>

                <br><br>

                <small>
                  Exact product stock not verified
                </small>

              </div>

            </div>
          `;
        })
        .join("");

  } catch (error) {
    console.error(
      "Nearby retailer search error:",
      error
    );

    shops.innerHTML = `
      <p>
        Nearby retailers could not be loaded right now.
        Please try again shortly.
      </p>
    `;
  }
}

/* =========================================================
   LOW-CONFIDENCE RESULT
========================================================= */

function renderLowConfidence(
  data
) {
  const item =
    data.identification || {};

  $("#results").classList.remove(
    "hidden"
  );

  $("#resultTitle").textContent =
    item.name ||
    item.object ||
    "FindIt isn't confident enough";

  $("#summary").textContent =
    data.message ||
    "Try a clearer photo of the full item.";

  $("#confidence").innerHTML =
    "";

  $("#productList").innerHTML =
    "";

  $("#liveBanner").textContent =
    "";

  $("#fallback")
    ?.classList.add(
      "hidden"
    );

  $("#noMatch")
    ?.classList.remove(
      "hidden"
    );
}

/* =========================================================
   MAIN SEARCH
========================================================= */

searchBtn.addEventListener(
  "click",
  async () => {
    if (
      !photo.files?.[0]
    ) {
      return;
    }

    searchBtn.disabled = true;

    $("#noMatch")
      ?.classList.add(
        "hidden"
      );

    status.textContent =
      "Gemini is identifying the item…";

    try {
      const data =
        await identifyItem();

      const confidence =
        Number(
          data.identification
            ?.confidence || 0
        );

      if (
        confidence < 0.55
      ) {
        renderLowConfidence(
          data
        );
      }

      else {
        renderIdentification(
          data
        );

        renderVerifiedOffers(
          data
        );

        if (coords) {
          status.textContent =
            "Item identified. Finding nearby retailers…";

          await renderNearbyStores(
            data.identification
          );
        }

        else {
          const fallback =
            $("#fallback");

          const shops =
            $("#shops");

          fallback
            ?.classList.remove(
              "hidden"
            );

          if (shops) {
            shops.innerHTML = `
              <p>
                Item identified.
                Press <b>Use my location</b>
                to see nearby relevant retailers.
              </p>
            `;
          }
        }
      }

      $("#results")
        .scrollIntoView({
          behavior: "smooth"
        });

      status.textContent =
        "Search complete.";

    } catch (error) {
      console.error(
        "FindIt search error:",
        error
      );

      status.textContent =
        "FindIt could not complete the search: " +
        error.message;

    } finally {
      searchBtn.disabled =
        !imageReady;
    }
  }
);

/* =========================================================
   RETRY
========================================================= */

$("#retry")
  ?.addEventListener(
    "click",
    () => {
      photo.click();
    }
  );
