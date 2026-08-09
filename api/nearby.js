export default {
  async fetch(request) {
    try {
      if (request.method !== "POST") {
        return Response.json(
          { error: "POST requests only" },
          { status: 405 }
        );
      }

      const body = await request.json();

      const lat = Number(body.lat);
      const lon = Number(body.lon);

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return Response.json(
          { error: "Valid latitude and longitude are required." },
          { status: 400 }
        );
      }

      const radius = 20000;

      /*
        Ask OSM for all mapped shops nearby.
        FindIt will rank relevance on the frontend.
      */
      const query = `
        [out:json][timeout:20];

        (
          nwr(
            around:${radius},
            ${lat},
            ${lon}
          )
          ["shop"];

          nwr(
            around:${radius},
            ${lat},
            ${lon}
          )
          ["amenity"="marketplace"];
        );

        out center tags;
      `;

      const servers = [
        "https://overpass.private.coffee/api/interpreter",
        "https://overpass-api.de/api/interpreter",
        "https://lz4.overpass-api.de/api/interpreter",
        "https://z.overpass-api.de/api/interpreter"
      ];

      let lastError = null;

      for (const server of servers) {
        try {
          const form = new URLSearchParams();
          form.set("data", query);

          const controller = new AbortController();

          const timeout = setTimeout(
            () => controller.abort(),
            12000
          );

          try {
            const response = await fetch(server, {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/x-www-form-urlencoded;charset=UTF-8"
              },
              body: form,
              signal: controller.signal
            });

            if (!response.ok) {
              lastError =
                `Server returned ${response.status}`;

              continue;
            }

            const data = await response.json();

            return Response.json({
              ok: true,
              source: server,
              elements: data.elements || []
            });

          } finally {
            clearTimeout(timeout);
          }

        } catch (error) {
          lastError = error.message;
        }
      }

      return Response.json(
        {
          ok: false,
          elements: [],
          error:
            lastError ||
            "All nearby-store services failed."
        },
        { status: 502 }
      );

    } catch (error) {
      console.error(error);

      return Response.json(
        {
          error: "Nearby-store search failed.",
          details: error.message
        },
        { status: 500 }
      );
    }
  }
};
