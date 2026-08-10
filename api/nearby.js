export default {
  async fetch(request) {
    try {
      if (request.method !== "POST") {
        return Response.json(
          {
            ok: false,
            error: "POST requests only"
          },
          { status: 405 }
        );
      }

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

      const radius = 20000;

      const query = `
        [out:json][timeout:20];

        (
          nwr(around:${radius},${lat},${lon})["shop"];
          nwr(around:${radius},${lat},${lon})["amenity"="marketplace"];
        );

        out center tags;
      `;

      /*
        Public Overpass instances.
        If one is busy/rejects us,
        FindIt automatically tries another.
      */

      const servers = [
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass.private.coffee/api/interpreter",
        "https://overpass-api.de/api/interpreter"
      ];

      const failures = [];

      for (const server of servers) {
        try {
          const controller =
            new AbortController();

          const timer =
            setTimeout(
              () => controller.abort(),
              14000
            );

          try {
            const form =
              new URLSearchParams();

            form.set("data", query);

            const response =
              await fetch(server, {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/x-www-form-urlencoded;charset=UTF-8",

                  "Accept":
                    "application/json",

                  /*
                    IMPORTANT:
                    The Overpass responses we saw
                    explicitly requested a meaningful
                    User-Agent.

                    This identifies FindIt as our app
                    instead of a generic anonymous bot.
                  */
                  "User-Agent":
                    "FindItNearby/1.0 (product-finder; Vercel server)"
                },

                body:
                  form.toString(),

                signal:
                  controller.signal
              });

            if (!response.ok) {
              let message = "";

              try {
                message =
                  await response.text();
              } catch {
                message = "";
              }

              failures.push({
                server,
                status:
                  response.status,

                message:
                  message
                    .replace(/\s+/g, " ")
                    .slice(0, 180)
              });

              /*
                429 = server is busy/rate limited.
                Just move to the next server.
              */
              continue;
            }

            let data;

            try {
              data =
                await response.json();
            } catch {
              failures.push({
                server,
                status:
                  response.status,

                message:
                  "Invalid JSON response"
              });

              continue;
            }

            if (
              !data ||
              !Array.isArray(
                data.elements
              )
            ) {
              failures.push({
                server,
                status:
                  response.status,

                message:
                  "Response did not include an elements array"
              });

              continue;
            }

            return Response.json(
              {
                ok: true,

                count:
                  data.elements.length,

                source:
                  server,

                elements:
                  data.elements
              },
              {
                status: 200,

                headers: {
                  /*
                    Cache the nearby map response
                    briefly so repeated testing
                    doesn't hammer free servers.
                  */
                  "Cache-Control":
                    "public, s-maxage=180, stale-while-revalidate=300"
                }
              }
            );

          } finally {
            clearTimeout(timer);
          }

        } catch (error) {
          failures.push({
            server,

            status: 0,

            message:
              error?.name ===
              "AbortError"

                ? "Timed out"

                : error?.message ||
                  "Request failed"
          });
        }
      }

      console.error(
        "All nearby-store providers failed:",
        failures
      );

      return Response.json(
        {
          ok: false,

          error:
            "Nearby retailers could not be loaded right now.",

          attempts:
            failures.map(
              (failure) =>
                `${failure.server}: ${
                  failure.status
                    ? `HTTP ${failure.status}`
                    : ""
                } ${failure.message}`
            )
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

          error:
            "Nearby retailer search failed.",

          details:
            error?.message ||
            "Unknown server error"
        },
        { status: 500 }
      );
    }
  }
};
