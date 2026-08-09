export default {
  async fetch(request) {
    try {
      /* =========================================
         ONLY POST
      ========================================= */

      if (request.method !== "POST") {
        return Response.json(
          {
            ok: false,
            error: "POST requests only"
          },
          {
            status: 405
          }
        );
      }

      /* =========================================
         LOCATION FROM FINDIT
      ========================================= */

      const body =
        await request.json();

      const lat =
        Number(body.lat);

      const lon =
        Number(body.lon);

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

      /*
        20 km search radius.

        We retrieve mapped shops.
        script.js decides which ones
        actually match the product.
      */

      const radius =
        20000;

      /* =========================================
         OVERPASS QUERY
      ========================================= */

      const query = `
        [out:json][timeout:20];

        (
          node(around:${radius},${lat},${lon})["shop"];
          way(around:${radius},${lat},${lon})["shop"];
          relation(around:${radius},${lat},${lon})["shop"];

          node(around:${radius},${lat},${lon})["amenity"="marketplace"];
          way(around:${radius},${lat},${lon})["amenity"="marketplace"];
          relation(around:${radius},${lat},${lon})["amenity"="marketplace"];
        );

        out center tags;
      `;

      /* =========================================
         OVERPASS SERVERS

         If one fails, FindIt tries the next.
      ========================================= */

      const servers = [

        "https://overpass-api.de/api/interpreter",

        "https://overpass.kumi.systems/api/interpreter",

        "https://overpass.private.coffee/api/interpreter"

      ];

      const failures = [];

      /* =========================================
         TRY SERVERS
      ========================================= */

      for (
        const server
        of servers
      ) {
        try {

          const controller =
            new AbortController();

          const timer =
            setTimeout(
              () =>
                controller.abort(),
              15000
            );

          try {

            /*
              IMPORTANT FIX:

              Send query using POST
              application/x-www-form-urlencoded.

              This is different from the
              GET request that was giving us
              HTTP 406.
            */

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
                    "Accept":
                      "application/json",

                    "Content-Type":
                      "application/x-www-form-urlencoded;charset=UTF-8"
                  },

                  body:
                    form.toString(),

                  signal:
                    controller.signal
                }
              );

            /* =====================================
               SERVER REJECTED REQUEST
            ===================================== */

            if (
              !response.ok
            ) {

              let message =
                "";

              try {

                message =
                  await response.text();

              } catch {
                message = "";
              }

              failures.push(
                `${server}: HTTP ${response.status}` +
                (
                  message
                    ? ` ${message.slice(0, 120)}`
                    : ""
                )
              );

              continue;
            }

            /* =====================================
               READ JSON
            ===================================== */

            let data;

            try {

              data =
                await response.json();

            } catch {

              failures.push(
                `${server}: Invalid JSON response`
              );

              continue;
            }

            if (
              !data ||
              !Array.isArray(
                data.elements
              )
            ) {

              failures.push(
                `${server}: Missing elements array`
              );

              continue;
            }

            /* =====================================
               SUCCESS
            ===================================== */

            return Response.json(
              {
                ok: true,

                count:
                  data.elements.length,

                elements:
                  data.elements
              },
              {
                status: 200,

                headers: {
                  /*
                    Nearby shop data does not
                    need to be requested every
                    second.

                    Short caching helps protect
                    the free public servers.
                  */

                  "Cache-Control":
                    "public, s-maxage=120, stale-while-revalidate=300"
                }
              }
            );

          } finally {

            clearTimeout(
              timer
            );
          }

        } catch (error) {

          const message =
            error?.name ===
            "AbortError"

              ? "Timed out"

              : error?.message ||
                "Request failed";

          failures.push(
            `${server}: ${message}`
          );
        }
      }

      /* =========================================
         ALL SERVERS FAILED
      ========================================= */

      console.error(
        "All Overpass servers failed:",
        failures
      );

      return Response.json(
        {
          ok: false,

          error:
            "Nearby retailers could not be loaded right now.",

          attempts:
            failures
        },
        {
          status: 502
        }
      );

    } catch (error) {

      /* =========================================
         GENERAL API ERROR
      ========================================= */

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
