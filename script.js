/* =========================================================
   FINDIT NEARBY
   Premium Frontend + Search Engine
========================================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

/* =========================================================
   DOM
========================================================= */

const photo = $("#photo");
const preview = $("#preview");
const empty = $("#empty");

const searchBtn = $("#search");
const locationBtn = $("#location");
const status = $("#status");

const apiBase =
  window.FINDIT_API_BASE || "/api";

/* =========================================================
   STATE
========================================================= */

let coords = null;

let imageReady = false;

let searching = false;

let lastIdentification = null;

let currentStores = [];

let mainMap = null;

let largeMap = null;

/* =========================================================
   SAFE TEXT
========================================================= */

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
   URL
========================================================= */

function safeWebsite(value) {
  if (!value) {
    return null;
  }

  let url =
    String(value).trim();

  if (
    !/^https?:\/\//i.test(url)
  ) {
    url =
      "https://" + url;
  }

  try {
    const parsed =
      new URL(url);

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

/* =========================================================
   PHONE
========================================================= */

function cleanPhone(value) {
  if (!value) {
    return null;
  }

  const phone =
    String(value).trim();

  return phone || null;
}

function phoneHref(value) {
  return String(value || "")
    .replace(/[^\d+]/g, "");
}

/* =========================================================
   PRICE
========================================================= */

function money(product) {
  if (
    product.price == null
  ) {
    return "Price not verified";
  }

  try {
    return new Intl.NumberFormat(
      "en-ZA",
      {
        style: "currency",

        currency:
          product.currency ||
          "ZAR"
      }
    ).format(
      Number(product.price)
    );

  } catch {
    return String(
      product.price
    );
  }
}

/* =========================================================
   IMAGE UPLOAD
========================================================= */

photo.addEventListener(
  "change",
  () => {
    const file =
      photo.files?.[0];

    if (!file) {
      return;
    }

    imageReady = true;

    lastIdentification =
      null;

    currentStores = [];

    preview.src =
      URL.createObjectURL(file);

    preview.style.display =
      "block";

    if (empty) {
      empty.style.display =
        "none";
    }

    searchBtn.disabled =
      false;

    status.textContent =
      "Photo ready. FindIt will identify the actual item, brand and model.";

    $("#results")
      ?.classList.add(
        "hidden"
      );
  }
);

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

locationBtn.addEventListener(
  "click",
  async () => {

    locationBtn.disabled =
      true;

    status.textContent =
      "Getting your location…";

    try {

      await getLocation();

      locationBtn.textContent =
        "✓ Location ready";

      $("#locationLabel")
        .textContent =
          "your current location";

      /*
        IMPORTANT:

        If Gemini already identified
        the product, we can search the
        shops WITHOUT using Gemini again.

        This helps save Gemini quota.
      */

      if (
        lastIdentification
      ) {

        status.textContent =
          "Location ready. Finding nearby retailers…";

        await renderNearbyStores(
          lastIdentification
        );

        status.textContent =
          "Nearby retailer search complete.";

      } else {

        status.textContent =
          "Location ready. Upload and identify an item.";

      }

    } catch (error) {

      console.error(
        "Location error:",
        error
      );

      status.textContent =
        "Location permission was not available. Product identification can still work.";

    } finally {

      locationBtn.disabled =
        false;
    }
  }
);

/* =========================================================
   GEMINI IMAGE IDENTIFICATION
========================================================= */

async function identifyItem() {

  const file =
    photo.files?.[0];

  if (!file) {
    throw new Error(
      "Please choose a photo first."
    );
  }

  const form =
    new FormData();

  form.append(
    "image",
    file
  );

  if (coords) {

    form.append(
      "lat",
      coords.lat
    );

    form.append(
      "lon",
      coords.lon
    );
  }

  const response =
    await fetch(
      `${apiBase}/search`,
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

    throw new Error(
      data.details ||
      data.error ||
      "FindIt could not identify this image."
    );
  }

  return data;
}

/* =========================================================
   SHOW IDENTIFICATION
========================================================= */

function renderIdentification(
  data
) {

  const item =
    data.identification || {};

  lastIdentification =
    item;

  $("#results")
    .classList.remove(
      "hidden"
    );

  $("#noMatch")
    ?.classList.add(
      "hidden"
    );

  $("#resultTitle")
    .textContent =
      item.name ||
      item.object ||
      "Item identified";

  $("#summary")
    .textContent =
      item.summary ||
      data.message ||
      "";

  /*
    Show original uploaded image
    in the result card.
  */

  $("#resultImage").src =
    preview.src;

  /* =========================
     CONFIDENCE
  ========================== */

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

  $("#confidenceNumber")
    .textContent =
      confidence + "%";

  $("#confidenceRing")
    .style
    .setProperty(
      "--score",
      confidence + "%"
    );

  if (
    confidence >= 90
  ) {

    $("#confidenceLabel")
      .textContent =
        "Very High Match";

  } else if (
    confidence >= 75
  ) {

    $("#confidenceLabel")
      .textContent =
        "Strong Match";

  } else if (
    confidence >= 55
  ) {

    $("#confidenceLabel")
      .textContent =
        "Possible Match";

  } else {

    $("#confidenceLabel")
      .textContent =
        "Low Confidence";
  }

  /* =========================
     PRODUCT TAGS
  ========================== */

  const tags = [
    item.brand,
    item.model,
    item.category
  ].filter(Boolean);

  $("#productTags")
    .innerHTML =
      tags
        .map(
          (tag) =>
            `<span>${esc(tag)}</span>`
        )
        .join("");

  /* =========================
     DETAILS TAB
  ========================== */

  const visibleText =
    Array.isArray(
      item.visibleText
    ) &&
    item.visibleText.length

      ? item.visibleText
          .join(", ")

      : "None detected";

  $("#confidence")
    .innerHTML = `

      <span class="kicker">
        PRODUCT DETAILS
      </span>

      <h3>
        ${esc(
          item.name ||
          item.object ||
          "Identified item"
        )}
      </h3>

      <div class="details-grid">

        <div class="detail">

          <small>
            Object
          </small>

          <b>
            ${esc(
              item.object ||
              "Unknown"
            )}
          </b>

        </div>


        <div class="detail">

          <small>
            Brand
          </small>

          <b>
            ${esc(
              item.brand ||
              "Not detected"
            )}
          </b>

        </div>


        <div class="detail">

          <small>
            Model
          </small>

          <b>
            ${esc(
              item.model ||
              "Not detected"
            )}
          </b>

        </div>


        <div class="detail">

          <small>
            Category
          </small>

          <b>
            ${esc(
              item.category ||
              "Not detected"
            )}
          </b>

        </div>


        <div class="detail">

          <small>
            Colour
          </small>

          <b>
            ${esc(
              item.color ||
              "Not detected"
            )}
          </b>

        </div>


        <div class="detail">

          <small>
            Visible text
          </small>

          <b>
            ${esc(
              visibleText
            )}
          </b>

        </div>


        <div class="detail">

          <small>
            Search phrase
          </small>

          <b>
            ${esc(
              item.searchQuery ||
              "Not available"
            )}
          </b>

        </div>


        <div class="detail">

          <small>
            AI confidence
          </small>

          <b>
            ${confidence}%
          </b>

        </div>

      </div>
    `;
}

/* =========================================================
   VERIFIED PRODUCT OFFERS
========================================================= */

function renderVerifiedOffers(
  data
) {

  const offers =
    Array.isArray(
      data.offers
    )
      ? data.offers

      : Array.isArray(
          data.products
        )
      ? data.products

      : [];

  const list =
    $("#productList");

  const banner =
    $("#liveBanner");

  /*
    NO VERIFIED DATA YET
  */

  if (
    !offers.length
  ) {

    list.innerHTML =
      "";

    banner.textContent =
      "No verified price or exact stock result yet. Nearby retailers below are relevant stores, not confirmed exact-product inventory.";

    $("#compareMessage")
      .textContent =
        "Verified prices will appear here when legitimate retailer or catalogue data is connected.";

    return;
  }

  /*
    VERIFIED OFFERS EXIST
  */

  banner.textContent =
    "✓ Verified retailer product offers found.";

  $("#compareMessage")
    .textContent =
      `${offers.length} verified retailer offer${offers.length === 1 ? "" : "s"} found.`;

  list.innerHTML =
    offers
      .map(
        (product) => {

          const store =
            product.store || {};

          const website =
            safeWebsite(
              store.website ||
              product.website
            );

          const productUrl =
            safeWebsite(
              product.url
            );

          const storePhone =
            cleanPhone(
              store.phone ||
              product.phone
            );

          const stock =
            product.stock?.status ||
            "Stock status unavailable";

          return `

            <article class="verified-offer">

              <b>
                ${esc(
                  product.name ||
                  "Verified product"
                )}
              </b>

              <div>
                ${esc(
                  product.retailer ||
                  store.name ||
                  "Retailer"
                )}
              </div>

              <div>
                ${esc(
                  money(product)
                )}
              </div>

              <small>
                ${esc(stock)}
              </small>

              ${
                storePhone
                  ? `

                    <br>

                    <a
                      href="tel:${esc(
                        phoneHref(
                          storePhone
                        )
                      )}"
                    >
                      📞 ${esc(storePhone)}
                    </a>

                  `
                  : ""
              }

              ${
                productUrl
                  ? `

                    <br>

                    <a
                      href="${esc(productUrl)}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View exact product →
                    </a>

                  `
                  : ""
              }

              ${
                website
                  ? `

                    <br>

                    <a
                      href="${esc(website)}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Retailer website →
                    </a>

                  `
                  : ""
              }

            </article>
          `;
        }
      )
      .join("");
}

/* =========================================================
   UNIVERSAL STORE PROFILE

   This is NOT shoe-only.
========================================================= */

function buildStoreProfile(
  item
) {

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

  /* =========================
     SHOES
  ========================== */

  if (
    /shoe|sneaker|footwear|trainer/.test(
      text
    )
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

  /* =========================
     AUDIO
  ========================== */

  else if (
    /microphone|headphone|earphone|speaker|audio|sound/.test(
      text
    )
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

      "sound",

      "electronics",

      "hifi"
    ];
  }

  /* =========================
     PHONES
  ========================== */

  else if (
    /smartphone|mobile phone|phone|tablet/.test(
      text
    )
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

  /* =========================
     COMPUTERS
  ========================== */

  else if (
    /computer|laptop|monitor|keyboard|mouse|pc/.test(
      text
    )
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

  /* =========================
     CAMERA
  ========================== */

  else if (
    /camera|photography|lens/.test(
      text
    )
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

  /* =========================
     CLOTHING
  ========================== */

  else if (
    /shirt|sweater|hoodie|jacket|pants|trousers|dress|clothing|fashion/.test(
      text
    )
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

  /* =========================
     FLOWERS
  ========================== */

  else if (
    /flower|plant|bouquet/.test(
      text
    )
  ) {

    profile.shopTypes = [

      "florist",

      "garden_centre"
    ];

    profile.keywords = [

      "flower",

      "florist",

      "plant",

      "garden"
    ];
  }

  /* =========================
     LIGHTING
  ========================== */

  else if (
    /lamp|light|lighting/.test(
      text
    )
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

  /* =========================
     FURNITURE
  ========================== */

  else if (
    /chair|table|desk|sofa|couch|furniture|cabinet/.test(
      text
    )
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

  /* =========================
     BOOKS
  ========================== */

  else if (
    /book|novel|textbook/.test(
      text
    )
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

  /* =========================
     STATIONERY
  ========================== */

  else if (
    /pencil|pen|stationery|school supplies|notebook/.test(
      text
    )
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

  /* =========================
     TOOLS
  ========================== */

  else if (
    /tool|hardware|drill|hammer|screwdriver|saw/.test(
      text
    )
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

  /* =========================
     TOYS / GAMES
  ========================== */

  else if (
    /toy|lego|video game|game|console/.test(
      text
    )
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

  /* =========================
     APPLIANCES
  ========================== */

  else if (
    /appliance|microwave|kettle|toaster|fridge|refrigerator|washing machine|air fryer/.test(
      text
    )
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

  /* =========================
     CAR / AUTO
  ========================== */

  else if (
    /car|vehicle|automobile/.test(
      text
    )
  ) {

    profile.shopTypes = [

      "car",

      "car_parts"
    ];

    profile.keywords = [

      "car",

      "vehicle",

      "motor"
    ];
  }

  /* =========================
     GENERIC FALLBACK
  ========================== */

  else {

    profile.keywords =
      String(
        item.category ||
        item.object ||
        ""
      )
        .toLowerCase()
        .split(
          /[^a-z0-9]+/
        )
        .filter(
          (word) =>
            word.length >= 4
        );
  }

  /*
    Product brand can help
    prioritise branded stores.
  */

  if (
    item.brand
  ) {

    profile.retailerNames
      .push(
        String(
          item.brand
        )
          .toLowerCase()
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

  const p =
    Math.PI / 180;

  const a =

    Math.sin(
      (lat2 - lat1) *
      p / 2
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
      (lon2 - lon1) *
      p / 2
    ) ** 2;

  return (

    R *

    2 *

    Math.atan2(

      Math.sqrt(a),

      Math.sqrt(
        1 - a
      )
    )
  );
}

/* =========================================================
   RELEVANCE SCORE
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
    )
      .toLowerCase();

  const shop =
    String(
      tags.shop ||
      ""
    )
      .toLowerCase();

  const combined = `

    ${name}

    ${shop}

    ${tags.brand || ""}

    ${tags.description || ""}

    ${tags.operator || ""}

    ${tags.branch || ""}

  `.toLowerCase();

  let score = 0;

  /*
    Correct shop category
  */

  if (
    profile.shopTypes
      .includes(shop)
  ) {

    score += 50;
  }

  /*
    Relevant words
  */

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

  /*
    Brand store
  */

  for (
    const retailer
    of profile.retailerNames
  ) {

    if (
      name.includes(
        retailer
      )
    ) {

      score += 40;
    }
  }

  /*
    Exact brand in store name
  */

  if (
    item.brand &&
    name.includes(
      String(
        item.brand
      )
        .toLowerCase()
    )
  ) {

    score += 60;
  }

  return score;
}

/* =========================================================
   LOAD NEARBY STORES

   IMPORTANT:
   Browser calls Vercel.
   Vercel calls Overpass.

   This avoids browser CORS problems.
========================================================= */

async function loadNearbyPlaces() {

  if (!coords) {

    throw new Error(
      "Location is required."
    );
  }

  const response =
    await fetch(
      `${apiBase}/nearby`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({
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
      "Nearby retailer service returned an unreadable response."
    );
  }

  if (
    !response.ok ||
    data.ok !== true
  ) {

    const attempts =
      Array.isArray(
        data.attempts
      )
        ? data.attempts
            .join(" | ")

        : "";

    throw new Error(
      attempts ||
      data.error ||
      "Nearby retailer search failed."
    );
  }

  return Array.isArray(
    data.elements
  )
    ? data.elements

    : [];
}

/* =========================================================
   STORE DATA
========================================================= */

function extractStore(
  place
) {

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

  const storePhone =
    cleanPhone(

      tags["contact:phone"] ||

      tags.phone ||

      tags["contact:mobile"] ||

      tags.mobile
    );

  const website =
    safeWebsite(

      tags["contact:website"] ||

      tags.website
    );

  const openingHours =

    tags.opening_hours ||

    null;

  const address = [

    tags["addr:housenumber"],

    tags["addr:street"],

    tags["addr:suburb"],

    tags["addr:city"]

  ]
    .filter(Boolean)
    .join(", ");

  return {

    name,

    type,

    phone:
      storePhone,

    website,

    openingHours,

    address,

    lat,

    lon,

    tags
  };
}

/* =========================================================
   STORE WEBSITE PRODUCT SEARCH
========================================================= */

function retailerSearchUrl(
  store,
  item
) {

  if (
    !store.website ||
    !item.searchQuery
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

    const query =
      encodeURIComponent(

        `site:${domain} ${item.searchQuery}`
      );

    return (
      "https://www.google.com/search?q=" +
      query
    );

  } catch {

    return null;
  }
}

/* =========================================================
   NEARBY STORES
========================================================= */

async function renderNearbyStores(
  item
) {

  const shops =
    $("#shops");

  if (!shops) {
    return;
  }

  if (!coords) {

    shops.innerHTML = `

      <div class="empty-retailers">

        Item identified.

        Press <b>Use my location</b>

        to see nearby relevant retailers.

      </div>
    `;

    return;
  }

  shops.innerHTML = `

    <div class="empty-retailers">

      Searching nearby retailers…

    </div>
  `;

  try {

    const places =
      await loadNearbyPlaces();

    const profile =
      buildStoreProfile(
        item
      );

    let stores =
      places

        .map(
          extractStore
        )

        .filter(Boolean)

        .map(
          (store) => {

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
          }
        )

        .filter(
          (store) =>
            store.score > 0
        );

    /*
      BEST relevance first.

      Distance is second.
    */

    stores.sort(
      (a, b) => {

        if (
          b.score !==
          a.score
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

    /*
      Remove duplicates.
    */

    const seen =
      new Set();

    const unique = [];

    for (
      const store
      of stores
    ) {

      const key =

        store.name
          .toLowerCase()

        +

        "|" +

        store.lat
          .toFixed(5)

        +

        "|" +

        store.lon
          .toFixed(5);

      if (
        seen.has(key)
      ) {

        continue;
      }

      seen.add(key);

      unique.push(
        store
      );

      if (
        unique.length >= 12
      ) {

        break;
      }
    }

    currentStores =
      unique;

    if (
      !unique.length
    ) {

      shops.innerHTML = `

        <div class="empty-retailers">

          FindIt reached the map service,

          but there was not enough mapped

          retailer information for this item nearby.

        </div>
      `;

      updateMaps([]);

      return;
    }

    shops.innerHTML =
      unique

        .map(
          (store, index) => {

            const directionsUrl =

              "https://www.google.com/maps/dir/?api=1&destination="

              +

              encodeURIComponent(

                `${store.lat},${store.lon}`
              );

            const searchUrl =
              retailerSearchUrl(
                store,
                item
              );

            return `

              <article class="store-card">

                <div class="rank">

                  ${index + 1}

                </div>


                <div>

                  <div class="store-name">

                    ${esc(
                      store.name
                    )}

                  </div>


                  <div class="store-meta">

                    ${
                      store.address
                        ? esc(
                            store.address
                          )

                        : esc(
                            store.type
                          )
                    }

                    <br>

                    ${store.distance.toFixed(1)}
                    km away

                    ${
                      store.openingHours
                        ? ` • ${esc(
                            store.openingHours
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

                            🌐 Website

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

                            🔎 Search retailer

                          </a>

                        `
                        : ""
                    }


                    <a
                      href="${esc(
                        directionsUrl
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

                    ${store.distance.toFixed(1)}
                    km

                  </div>

                  <div class="unverified">

                    Exact stock
                    not verified

                  </div>

                </div>

              </article>
            `;
          }
        )
        .join("");

    updateMaps(
      unique
    );

  } catch (error) {

    console.error(
      "Nearby retailer error:",
      error
    );

    shops.innerHTML = `

      <div class="empty-retailers">

        Nearby retailers could not be loaded right now.

        <br><br>

        ${esc(
          error.message
        )}

      </div>
    `;
  }
}

/* =========================================================
   MAP
========================================================= */

function createMap(
  id
) {

  const element =
    document.getElementById(
      id
    );

  if (
    !element ||
    typeof L === "undefined"
  ) {

    return null;
  }

  const map =
    L.map(id);

  const defaultPosition =

    coords

      ? [
          coords.lat,
          coords.lon
        ]

      : [
          -30.5595,
          22.9375
        ];

  map.setView(
    defaultPosition,
    coords ? 12 : 5
  );

  L.tileLayer(

    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

    {
      maxZoom: 19,

      attribution:
        "&copy; OpenStreetMap contributors"
    }

  ).addTo(map);

  return map;
}

/* =========================================================
   MAP UPDATE
========================================================= */

function updateMaps(
  stores
) {

  if (
    !coords ||
    typeof L === "undefined"
  ) {

    return;
  }

  if (!mainMap) {

    mainMap =
      createMap(
        "map"
      );
  }

  if (!largeMap) {

    largeMap =
      createMap(
        "mapLarge"
      );
  }

  const maps = [

    mainMap,

    largeMap

  ];

  maps.forEach(
    (map) => {

      if (!map) {
        return;
      }

      /*
        Remove old markers.
      */

      map.eachLayer(
        (layer) => {

          if (
            layer instanceof L.Marker ||
            layer instanceof L.CircleMarker
          ) {

            map.removeLayer(
              layer
            );
          }
        }
      );

      /*
        YOU ARE HERE
      */

      L.circleMarker(

        [
          coords.lat,
          coords.lon
        ],

        {
          radius: 8,

          color: "#4d7cff",

          fillColor:
            "#4d7cff",

          fillOpacity: 1
        }

      )
        .addTo(map)

        .bindPopup(
          "You are here"
        );

      /*
        STORE MARKERS
      */

      stores.forEach(
        (store) => {

          L.marker(
            [
              store.lat,
              store.lon
            ]
          )
            .addTo(map)

            .bindPopup(

              `<b>${esc(
                store.name
              )}</b>

              <br>

              ${store.distance.toFixed(1)}
              km away`
            );
        }
      );

      /*
        MAP BOUNDS
      */

      if (
        stores.length
      ) {

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

        map.fitBounds(
          points,
          {
            padding:
              [30,30],

            maxZoom:
              14
          }
        );

      } else {

        map.setView(

          [
            coords.lat,
            coords.lon
          ],

          13
        );
      }

      setTimeout(
        () =>
          map.invalidateSize(),
        100
      );
    }
  );
}

/* =========================================================
   LOW CONFIDENCE
========================================================= */

function renderLowConfidence(
  data
) {

  const item =
    data.identification || {};

  lastIdentification =
    null;

  $("#results")
    .classList.remove(
      "hidden"
    );

  $("#noMatch")
    .classList.remove(
      "hidden"
    );

  $("#resultTitle")
    .textContent =

      item.name ||

      item.object ||

      "FindIt isn't confident enough";

  $("#summary")
    .textContent =

      data.message ||

      "Try a clearer photo showing the entire item, logo or model details.";

  $("#productTags")
    .innerHTML =
      "";

  $("#productList")
    .innerHTML =
      "";

  $("#confidence")
    .innerHTML =
      "";

  $("#shops")
    .innerHTML =
      "";
}

/* =========================================================
   MAIN SEARCH
========================================================= */

searchBtn.addEventListener(
  "click",
  async () => {

    if (
      searching ||
      !imageReady
    ) {

      return;
    }

    searching =
      true;

    searchBtn.disabled =
      true;

    $("#noMatch")
      ?.classList.add(
        "hidden"
      );

    status.textContent =
      "FindIt is identifying the item…";

    try {

      const data =
        await identifyItem();

      const confidence =
        Number(
          data.identification
            ?.confidence || 0
        );

      /*
        TOO WEAK
      */

      if (
        confidence < 0.55
      ) {

        renderLowConfidence(
          data
        );

      }

      /*
        GOOD MATCH
      */

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

        } else {

          $("#shops")
            .innerHTML = `

              <div class="empty-retailers">

                Item identified successfully.

                <br><br>

                Press <b>Use my location</b>

                to see nearby relevant retailers.

              </div>
            `;
        }
      }

      $("#results")
        .scrollIntoView(
          {
            behavior:
              "smooth"
          }
        );

      status.textContent =
        "Search complete.";

    } catch (error) {

      console.error(
        "FindIt search error:",
        error
      );

      /*
        If Gemini quota is exceeded,
        this message will show the real
        API reason instead of pretending
        the website is broken.
      */

      status.textContent =

        "FindIt could not complete the search: "

        +

        error.message;

    } finally {

      searching =
        false;

      searchBtn.disabled =
        !imageReady;
    }
  }
);

/* =========================================================
   RESULT TABS
========================================================= */

$$(".tab")
  .forEach(
    (button) => {

      button
        .addEventListener(
          "click",
          () => {

            $$(".tab")
              .forEach(
                (tab) =>
                  tab.classList
                    .remove(
                      "active"
                    )
              );

            $$(".tab-panel")
              .forEach(
                (panel) =>
                  panel.classList
                    .remove(
                      "active"
                    )
              );

            button
              .classList
              .add(
                "active"
              );

            const target =
              $(
                "#tab-" +
                button.dataset.tab
              );

            target
              ?.classList
              .add(
                "active"
              );

            /*
              Leaflet map needs to
              recalculate after hidden
              panel becomes visible.
            */

            if (
              button.dataset.tab ===
              "map" &&
              largeMap
            ) {

              setTimeout(
                () =>
                  largeMap
                    .invalidateSize(),
                120
              );
            }
          }
        );
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

/* =========================================================
   SHARE
========================================================= */

$("#shareResult")
  ?.addEventListener(
    "click",
    async () => {

      const title =
        "FindIt Nearby";

      const text =
        lastIdentification

          ? `FindIt identified ${
              lastIdentification.name ||
              lastIdentification.object
            }`

          : "FindIt Nearby";

      try {

        if (
          navigator.share
        ) {

          await navigator.share(
            {
              title,

              text,

              url:
                window.location.href
            }
          );

        } else {

          await navigator.clipboard
            .writeText(
              window.location.href
            );

          status.textContent =
            "FindIt link copied.";
        }

      } catch {
        /*
          User may simply close
          the share menu.
        */
      }
    }
  );
