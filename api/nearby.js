export default {
  async fetch(request) {
    try {
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

      let body;

      try {
        body = await request.json();
      } catch {
        return Response.json(
          {
            ok: false,
            error: "Invalid request body."
          },
          {
            status: 400
          }
        );
      }

      const lat = Number(body.lat);
      const lon = Number(body.lon);

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
        Search close by first.

        This makes the Overpass request MUCH lighter
        than immediately requesting every shop in 20 km.
      */
      const radiuses = [
        8000,
        12000,
        18000
      ];

      /*
        Backup Overpass providers.

        If one is busy, FindIt automatically tries
        the next one.
      */
      const servers = [
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass-api.de/api/interpreter",
        "https://overpass.nchc.org.tw/api/interpreter",
        "https://overpass.private.coffee/api/interpreter"
      ];

      const failures = [];

      /*
        Try each radius.
      */
      for (const radius of radiuses) {
        const query = `
          [out:json][timeout:20];

          (
            nwr(around:${radius},${lat},${lon})["shop"];
            nwr(around:${radius},${lat},${lon})["amenity"="marketplace"];
          );

          out center tags qt;
        `;

        /*
          Try each server for this radius.
        */
        for (const server of servers) {
          const controller =
            new AbortController();

          /*
            Give each provider 12 seconds.

            If it hangs, FindIt automatically
            moves to the next provider.
          */
          const timer =
            setTimeout(
              () =>
                controller.abort(),
              12000
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
                      "FindItNearby/1.1 https://findit-nearby.vercel.app",

                    "X-Requested-With":
                      "FindItNearby"
                  },

                  body:
                    form.toString(),

                  signal:
                    controller.signal
                }
              );

            if (!response.ok) {
              failures.push(
                `${server} radius ${radius}: HTTP ${response.status}`
              );

              continue;
            }

            let data;

            try {
              data =
                await response.json();
            } catch {
              failures.push(
                `${server} radius ${radius}: invalid JSON`
              );

              continue;
            }

            if (
              !Array.isArray(
                data?.elements
              )
            ) {
              failures.push(
                `${server} radius ${radius}: invalid response`
              );

              continue;
            }

            /*
              Remove elements with no usable location.
            */
            const usableElements =
              data.elements.filter(
                (place) => {
                  const placeLat =
                    place.lat ??
                    place.center?.lat;

                  const placeLon =
                    place.lon ??
                    place.center?.lon;

                  return (
                    Number.isFinite(
                      Number(placeLat)
                    ) &&
                    Number.isFinite(
                      Number(placeLon)
                    )
                  );
                }
              );

            /*
              If this radius found stores,
              immediately return them.

              No need to hammer more public servers.
            */
            if (
              usableElements.length >
              0
            ) {
              return Response.json(
                {
                  ok: true,

                  source:
                    server,

                  radius,

                  count:
                    usableElements.length,

                  elements:
                    usableElements
                },
                {
                  headers: {
                    "Cache-Control":
                      "public, s-maxage=300, stale-while-revalidate=600"
                  }
                }
              );
            }

            failures.push(
              `${server} radius ${radius}: no retailers found`
            );

          } catch (error) {
            const reason =
              error?.name ===
              "AbortError"
                ? "timeout"
                : error?.message ||
                  "request failed";

            failures.push(
              `${server} radius ${radius}: ${reason}`
            );

          } finally {
            clearTimeout(
              timer
            );
          }
        }
      }

      console.error(
        "All FindIt nearby providers failed:",
        failures
      );

      return Response.json(
        {
          ok: false,

          error:
            "Nearby retailers could not be loaded right now. Please try again shortly.",

          attempts:
            failures
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
