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

  if (empty) {
    empty.style.display = "none";
  }

  searchBtn.disabled = false;

  status.textContent =
    "Photo ready. FindIt will analyse the actual item, brand and model.";
};

function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject();
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
      ? "Location ready. You can search now."
      : "Location ready.";
  } catch {
    status.textContent =
      "Location permission was not available. You can still identify the item.";
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
  if (product.price == null) {
    return "Price unavailable";
  }

  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: product.currency || "ZAR"
  }).format(product.price);
}

function showIdentification(data) {
  const identification = data.identification || {};

  $("#results").classList.remove("hidden");

  $("#noMatch")?.classList.add("hidden");
  $("#fallback")?.classList.add("hidden");

  $("#resultTitle").textContent =
    identification.name ||
    identification.object ||
    "Item identified";

  $("#summary").textContent =
    identification.summary ||
    data.message ||
    "";

  const confidence =
    typeof identification.confidence === "number"
      ? Math.round(identification.confidence * 100)
      : null;

  $("#confidence").innerHTML = `
    <div class="confidence">
      <strong>
        Gemini identification
        ${confidence !== null ? `— ${confidence}% confidence` : ""}
      </strong>

      <p>
        Object:
        <b>${identification.object || "Unknown"}</b>
      </p>

      <p>
        Brand:
        <b>${identification.brand || "Not detected"}</b>
      </p>

      <p>
        Model:
        <b>${identification.model || "Not detected"}</b>
      </p>

      <p>
        Category:
        <b>${identification.category || "Not detected"}</b>
      </p>

      ${
        identification.searchQuery
          ? `<p>Search phrase: <b>${identification.searchQuery}</b></p>`
          : ""
      }

      ${
        Array.isArray(identification.visibleText) &&
        identification.visibleText.length
          ? `<p>Visible text: <b>${identification.visibleText.join(", ")}</b></p>`
          : ""
      }
    </div>
  `;
}

function renderOffers(data) {
  const products = data.offers || data.products || [];
  const list = $("#productList");
  const banner = $("#liveBanner");

  if (!products.length) {
    list.innerHTML = "";

    banner.textContent =
      data.message ||
      "The item was identified, but no verified retailer catalogue result is connected yet.";

    return;
  }

  banner.textContent =
    "✓ Verified retailer product data found.";

  list.innerHTML = products
    .map((product) => {
      const storeName =
        product.store?.name || "Store unavailable";

      const distance =
        product.distanceKm != null
          ? ` • 📍 ${Number(product.distanceKm).toFixed(1)} km`
          : "";

      const stock =
        product.stock?.status || "Stock unavailable";

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

      const productLink = product.url
        ? `
          <a
            class="link"
            target="_blank"
            rel="noopener"
            href="${product.url}"
          >
            View product →
          </a>
        `
        : "";

      return `
        <article class="product">

          ${
            product.image
              ? `<img src="${product.image}" alt="${product.name || "Product"}">`
              : ""
          }

          <div>

            <h3>${product.name || "Product"}</h3>

            <p class="retailer">
              ${product.brand ? product.brand + " • " : ""}
              ${product.retailer || ""}
            </p>

            ${
              product.match != null
                ? `<p class="match">
                    🎯 Match:
                    ${Math.round(product.match * 100)}%
                  </p>`
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
}

function showLowConfidence(data) {
  const identification = data.identification || {};

  $("#results").classList.remove("hidden");

  $("#resultTitle").textContent =
    identification.name ||
    identification.object ||
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
    "Gemini is analysing the image…";

  try {
    const data = await searchGemini();

    const confidence =
      Number(data.identification?.confidence || 0);

    if (confidence < 0.55) {
      showLowConfidence(data);
    } else {
      showIdentification(data);
      renderOffers(data);
    }

    $("#results").scrollIntoView({
      behavior: "smooth"
    });

    status.textContent =
      "Image analysis complete.";

  } catch (error) {
    console.error(error);

    status.textContent =
      "FindIt could not analyse the image: " +
      error.message;
  } finally {
    searchBtn.disabled = !ready;
  }
};

$("#retry")?.addEventListener("click", () => {
  photo.click();
});
