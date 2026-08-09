export default {
  async fetch(request) {
    try {
      // Only allow POST requests from FindIt
      if (request.method !== "POST") {
        return Response.json(
          {
            ok: false,
            error: "POST requests only"
          },
          { status: 405 }
        );
      }

      // Read location sent by script.js
      const body = await request.json();

      const lat = Number(body.lat);
      const lon = Number(body.lon);

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon)
      ) {
        return Response.json(
          {
            ok: false,
            error: "Valid latitude and longitude are required."
          },
          { status: 400 }
        );
      }

      /*
        Search radius: 20 km

        We deliberately fetch ALL mapped shops nearby.

        script.js will decide which stores are relevant
        to the item Gemini identified.
      */
      const radius = 20000;

      const overpassQuery = `
        [out:json][timeout:20];

        (
          nwr(around:${radius},${lat},${lon})["shop"];

          nwr(around:${radius},${lat},${lon})
            ["amenity"="marketplace"];
        );

        out center tags;
      `;

      /*
        Main public Overpass service first.

        gall and lambert are fallback instances of
        the main Overpass infrastructure.
      */
      const servers = [
        "https://overpass-api.de/api/interpreter",
        "https://gall.openstreetmap.de/api/interpreter",
        "https://lambert.openstreetmap.de/api/interpreter"
      ];

      const failures = [];

      for (const server of servers) {
        try {
          /*
            GET avoids the browser CORS problem because
            THIS request happens inside Vercel.

            It also avoids the 406 problem we saw with
            some POST requests from the server.
          */
          const url =
            server +
            "?data=" +
            encodeURIComponent(overpassQuery);

          const controller =
            new AbortController();

          const timeout =
            setTimeout(() => {
              controller.abort();
            }, 15000);

          let response;

          try {
            response = await fetch(url, {
              method: "GET",
              headers: {
                Accept: "application/json"
              },
              signal: controller.signal
            });
          } finally {
            clearTimeout(timeout);
          }

          if (!response.ok) {
            failures.push(
              `${server}: HTTP ${response.status}`
            );

            continue;
          }

          const data =
            await response.json();

          if (
            !data ||
            !Array.isArray(data.elements)
          ) {
            failures.push(
              `${server}: Invalid response`
            );

            continue;
          }

          /*
            Send raw shop data back to FindIt.

            These tags can include:
            name
            shop type
            phone
            website
            brand
            opening hours
            address
            etc.
          */
          return Response.json({
            ok: true,
            count: data.elements.length,
            elements: data.elements
          });

        } catch (error) {
          const message =
            error?.name === "AbortError"
              ? "Timed out"
              : error?.message || "Request failed";

          failures.push(
            `${server}: ${message}`
          );
        }
      }

      /*
        Every Overpass attempt failed.
        Return useful debugging information instead
        of silently breaking the website.
      */
      console.error(
        "Nearby-store lookup failed:",
        failures
      );

      return Response.json(
        {
          ok: false,
          error:
            "The nearby-store service could not respond.",
          attempts: failures
        },
        { status: 502 }
      );

    } catch (error) {
      console.error(
        "FindIt nearby API error:",
        error
      );

      return Response.json(
        {
          ok: false,
          error: "Nearby-store search failed.",
          details:
            error?.message || "Unknown server error"
        },
        { status: 500 }
      );
    }
  }
};
