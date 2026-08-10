const FAMILY_SHOPS = {
  grocery: [
    "supermarket",
    "convenience",
    "bakery",
    "deli",
    "greengrocer",
    "general",
    "department_store"
  ],

  household: [
    "supermarket",
    "general",
    "department_store",
    "houseware",
    "variety_store",
    "chemist"
  ],

  beauty: [
    "beauty",
    "chemist",
    "cosmetics",
    "perfumery",
    "supermarket",
    "department_store"
  ],

  pharmacy: [
    "chemist",
    "medical_supply"
  ],

  footwear: [
    "shoes",
    "sports",
    "clothes",
    "department_store"
  ],

  clothing: [
    "clothes",
    "fashion",
    "department_store"
  ],

  stationery: [
    "stationery",
    "books",
    "variety_store",
    "department_store"
  ],

  electronics: [
    "electronics",
    "computer",
    "mobile_phone",
    "hifi",
    "music",
    "camera"
  ],

  furniture: [
    "furniture",
    "houseware",
    "interior_decoration"
  ],

  garden: [
    "florist",
    "garden_centre"
  ],

  books: [
    "books",
    "stationery"
  ],

  tools: [
    "hardware",
    "doityourself",
    "trade"
  ],

  toys: [
    "toys",
    "games",
    "video_games",
    "variety_store",
    "department_store"
  ],

  pet: [
    "pet",
    "supermarket",
    "general"
  ],

  baby: [
    "baby_goods",
    "clothes",
    "supermarket",
    "department_store",
    "chemist"
  ],

  automotive: [
    "car_parts",
    "tyres",
    "car_repair"
  ],

  sports: [
    "sports",
    "shoes",
    "clothes",
    "department_store"
  ],

  jewellery: [
    "jewelry",
    "watches",
    "fashion_accessories"
  ]
};

function normaliseFamily(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_");
}

function escapeRegex(value) {
  return String(value)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildQuery(family, radius, lat, lon) {
  const shops = FAMILY_SHOPS[family] || [];

  if (!shops.length) {
    return null;
  }

  const shopRegex =
    `^(${shops.map(escapeRegex).join("|")})$`;

  const extraAmenity =
    family === "pharmacy"
      ? `
        nwr(around:${radius},${lat},${lon})["amenity"="pharmacy"];
      `
      : "";

  return `
    [out:json][timeout:18];

    (
      nwr(
        around:${radius},
        ${lat},
        ${lon}
      )
      ["shop"~"${shopRegex}"];

      ${extraAmenity}
    );

    out center tags qt;
  `;
}

function usableElements(data) {
  if (!Array.isArray(data?.elements)) {
    return [];
  }

  return data.elements.filter((place) => {
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

    return (
      Number.isFinite(lat) &&
      Number.isFinite(lon)
    );
  });
}

async function fetchOverpass(server, query, timeoutMs) {
  const controller =
    new AbortController();

  const timer =
    setTimeout(
      () => controller.abort(),
      timeoutMs
    );

  try {
    const form =
      new URLSearchParams();

    form.set(
      "data",
      query
    );

    const response =
      await fetch(
        server,
        {
          method: "POST",
          headers: {
            Accept:
              "application/json",
            "Content-Type":
              "application/x-www-form-urlencoded;charset=UTF-8",
            "User-Agent":
              "FindItNearby/2.0 (+https://findit-nearby.vercel.app)"
          },
          body:
            form.toString(),
          signal:
            controller.signal
        }
      );

    if (!response.ok) {
      return {
        ok: false,
        reason:
          `HTTP ${response.status}`
      };
    }

    let data;

    try {
      data =
        await response.json();
    } catch {
      return {
        ok: false,
        reason:
          "invalid JSON"
      };
    }

    return {
      ok: true,
      elements:
        usableElements(data)
    };
  } catch (error) {
    return {
      ok: false,
      reason:
        error?.name === "AbortError"
          ? "timeout"
          : error?.message ||
            "request failed"
    };
  } finally {
    clearTimeout(timer);
  }
}

export default {
  async fetch(request) {
    try {
      if (request.method !== "POST") {
        return Response.json(
          {
            ok: false,
            error:
              "POST requests only"
          },
          {
            status: 405
          }
        );
      }

      let body;

      try {
        body =
          await request.json();
      } catch {
        return Response.json(
          {
            ok: false,
            error:
              "Invalid request body."
          },
          {
            status: 400
          }
        );
      }

      const lat =
        Number(body.lat);

      const lon =
        Number(body.lon);

      const family =
        normaliseFamily(
          body.retailerFamily
        );

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon)
      ) {
        return Response.json(
          {
            ok: false,
            error:
              "Valid latitude and longitude are required."
          },
          {
            status: 400
          }
        );
      }

      if (
        family === "unsupported"
      ) {
        return Response.json(
          {
            ok: true,
            family,
            radius: 0,
            count: 0,
            elements: [],
            message:
              "Nearby-store discovery is not available for this product type."
          },
          {
            headers: {
              "Cache-Control":
                "no-store"
            }
          }
        );
      }

      if (
        family === "other" ||
        !FAMILY_SHOPS[family]
      ) {
        return Response.json(
          {
            ok: true,
            family:
              family || "other",
            radius: 0,
            count: 0,
            elements: [],
            message:
              "No reliable retailer family is available for this item yet."
          },
          {
            headers: {
              "Cache-Control":
                "public, s-maxage=60"
            }
          }
        );
      }

      /*
        Search close first.
        Expand only if we do not get enough useful retailers.
      */

      const radii = [
        5000,
        9000,
        15000
      ];

      /*
        Keep the provider list short so a failed search
        does not take forever on mobile.
      */

      const servers = [
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass-api.de/api/interpreter",
        "https://overpass.private.coffee/api/interpreter"
      ];

      const failures = [];
      let bestElements = [];
      let bestRadius = 0;
      let bestSource = null;

      for (const radius of radii) {
        const query =
          buildQuery(
            family,
            radius,
            lat,
            lon
          );

        if (!query) {
          break;
        }

        for (const server of servers) {
          const result =
            await fetchOverpass(
              server,
              query,
              9000
            );

          if (!result.ok) {
            failures.push(
              `${server} radius ${radius}: ${result.reason}`
            );

            continue;
          }

          if (
            result.elements.length >
            bestElements.length
          ) {
            bestElements =
              result.elements;

            bestRadius =
              radius;

            bestSource =
              server;
          }

          /*
            We have enough data for the frontend to rank.
            Stop early and reduce pressure on public Overpass.
          */

          if (
            result.elements.length >= 8
          ) {
            return Response.json(
              {
                ok: true,
                family,
                source:
                  server,
                radius,
                count:
                  result.elements.length,
                elements:
                  result.elements
              },
              {
                headers: {
                  "Cache-Control":
                    "public, s-maxage=300, stale-while-revalidate=900"
                }
              }
            );
          }
        }

        /*
          A few results are still useful.
          Return them rather than expanding endlessly.
        */

        if (
          bestElements.length >= 3
        ) {
          break;
        }
      }

      if (
        bestElements.length
      ) {
        return Response.json(
          {
            ok: true,
            family,
            source:
              bestSource,
            radius:
              bestRadius,
            count:
              bestElements.length,
            elements:
              bestElements
          },
          {
            headers: {
              "Cache-Control":
                "public, s-maxage=300, stale-while-revalidate=900"
            }
          }
        );
      }

      console.error(
        "All FindIt nearby attempts failed:",
        {
          family,
          failures
        }
      );

      return Response.json(
        {
          ok: false,
          error:
            "Nearby retailers could not be loaded right now. Please try again shortly.",
          family,
          attempts:
            failures.slice(0, 12)
        },
        {
          status: 502
        }
      );
    } catch (error) {
      console.error(
        "FindIt nearby API error:",
        error
      );

      return Response.json(
        {
          ok: false,
          error:
            "Nearby retailer search failed.",
          details:
            error?.message ||
            "Unknown server error"
        },
        {
          status: 500
        }
      );
    }
  }
};
