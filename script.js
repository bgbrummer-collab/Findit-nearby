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

photo.onchange = () => {
  if (!photo.files[0]) return;

  ready = true;
  preview.src = URL.createObjectURL(photo.files[0]);
  preview.style.display = "block";

  if (empty) empty.style.display = "none";

  searchBtn.disabled = false;

  status.textContent =
    "Photo ready. FindIt will identify the actual item, brand and model.";
};

function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject();

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
      ? "Location ready. You can search now."
      : "Location ready.";
  } catch {
    status.textContent =
      "Location permission was not available.";
  }
};

async function searchGemini() {
  const form = new FormData();

  form.append("image", photo.files[0]);

  if (coords) {
    form.append("lat", coords.lat);
    form.append("lon", coords.lon);
  }

  const response = await fetch(apiBase + "/search", {
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

function money(product) {
  if (product.price == null) return "Price unavailable";

  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: product.currency || "ZAR"
  }).format(product.price);
}

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
          ? `<p>Search phrase:
               <b>${item.searchQuery}</b>
             </p>`
          : ""
      }

    </div>
  `;
}

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
      return `
        <article class="product">

          ${
            product.image
              ? `<img src="${product.image}"
                   alt="${product.name || "Product"}">`
              : ""
          }

          <div>

            <h3>${product.name || "Product"}</h3>

            <p class="retailer">
              ${
                product.brand
                  ? product.brand + " • "
                  : ""
              }
              ${product.retailer || ""}
            </p>

            <p>
              🏪 ${product.store?.name || "Store unavailable"}
            </p>

            <p class="stock">
              📦 ${
                product.stock?.status ||
                "Stock unavailable"
              }
            </p>

            ${
              product.url
                ? `<a
                     class="link"
                     href="${product.url}"
                     target="_blank"
                     rel="noopener"
                   >
                     View product →
                   </a>`
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

function categoriesFor(item) {
  const text =
    `${item.object || ""} ${item.category || ""}`
      .toLowerCase();

  if (
    text.includes("shoe") ||
    text.includes("sneaker") ||
    text.includes("footwear")
  ) {
    return ["shoes", "sports"];
  }

  if (
    text.includes("microphone") ||
    text.includes("headphone") ||
    text.includes("speaker") ||
    text.includes("audio")
  ) {
    return ["electronics", "music"];
  }

  if (
    text.includes("shirt") ||
    text.includes("sweater") ||
    text.includes("clothing") ||
    text.includes("fashion")
  ) {
    return ["clothes", "fashion"];
  }

  if (
    text.includes("lamp") ||
    text.includes("light")
  ) {
    return ["lighting", "hardware"];
  }

  if (
    text.includes("phone") ||
    text.includes("computer") ||
    text.includes("camera") ||
    text.includes("electronics")
  ) {
    return ["electronics"];
  }

  if (
    text.includes("flower") ||
    text.includes("plant")
  ) {
    return ["florist", "garden_centre"];
  }

  if (
    text.includes("book")
  ) {
    return ["books"];
  }

  if (
    text.includes("chair") ||
    text.includes("furniture")
  ) {
    return ["furniture"];
  }

  if (
    text.includes("tool") ||
    text.includes("hardware")
  ) {
    return ["hardware"];
  }

  if (
    text.includes("toy")
  ) {
    return ["toys"];
  }

  return [];
}

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

function escapeRegex(text) {
  return String(text || "")
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findNearbyStores(item) {
  const fallback = $("#fallback");
  const shops = $("#shops");

  if (!coords) {
    fallback.classList.remove("hidden");

    shops.innerHTML =
      "<p>Press <b>Use my location</b> to see relevant nearby stores.</p>";

    return;
  }

  const categories = categoriesFor(item);

  if (!categories.length) {
    fallback.classList.add("hidden");
    return;
  }

  fallback.classList.remove("hidden");

  const radius = 15000;

  const categoryQueries =
    categories
      .map(
        (shop) =>
          `nwr(around:${radius},${coords.lat},${coords.lon})["shop"="${shop}"];`
      )
      .join("");

  let brandQuery = "";

  if (item.brand) {
    const brand = escapeRegex(item.brand);

    brandQuery = `
      nwr(around:${radius},${coords.lat},${coords.lon})
      ["name"~"${brand}",i];
    `;
  }

  const query = `
    [out:json][timeout:25];

    (
      ${brandQuery}
      ${categoryQueries}
    );

    out center tags;
  `;

  shops.innerHTML =
    "<p>Searching for relevant nearby stores…</p>";

  try {
    const response = await fetch(
      "https://overpass-api.de/api/interpreter",
      {
        method: "POST",
        body: query
      }
    );

    if (!response.ok) throw new Error();

    const data = await response.json();

    const stores = (data.elements || [])
      .map((place) => {
        const lat =
          place.lat ??
          place.center?.lat;

        const lon =
          place.lon ??
          place.center?.lon;

        if (lat == null || lon == null) {
          return null;
        }

        const tags = place.tags || {};

        const name =
          tags.name ||
          tags.brand ||
          "Unnamed store";

        return {
          name,
          type:
            tags.shop ||
            tags.brand ||
            "Retail",
          lat,
          lon,
          distance:
            distanceKm(
              coords.lat,
              coords.lon,
              lat,
              lon
            )
        };
      })
      .filter(Boolean)
      .sort(
        (a, b) =>
          a.distance - b.distance
      );

    const unique = [];

    const seen = new Set();

    for (const store of stores) {
      const key =
        `${store.name}-${store.lat}-${store.lon}`;

      if (seen.has(key)) continue;

      seen.add(key);
      unique.push(store);

      if (unique.length >= 10) break;
    }

    if (!unique.length) {
      shops.innerHTML =
        "<p>No relevant mapped stores were found nearby.</p>";

      return;
    }

    shops.innerHTML =
      unique
        .map(
          (store) => `
            <div class="shop">

              <span>

                <b>${store.name}</b>

                <br>

                <small>
                  ${store.type}
                  • Nearby relevant store
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

  } catch {
    shops.innerHTML =
      "<p>The free nearby-store service is temporarily unavailable. Try again later.</p>";
  }
}

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

searchBtn.onclick = async () => {
  if (!photo.files[0]) return;

  searchBtn.disabled = true;

  status.textContent =
    "Gemini is identifying the item…";

  try {
    const data =
      await searchGemini();

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
      "FindIt could not analyse the image: " +
      error.message;
  } finally {
    searchBtn.disabled = !ready;
  }
};

$("#retry")?.addEventListener(
  "click",
  () => photo.click()
);
