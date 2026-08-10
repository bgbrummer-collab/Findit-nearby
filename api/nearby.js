export default {
  async fetch(request) {
    try {
      if (request.method !== "POST") {
        return Response.json({ ok: false, error: "POST requests only" }, { status: 405 });
      }

      const body = await request.json();
      const lat = Number(body.lat);
      const lon = Number(body.lon);

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return Response.json(
          { ok: false, error: "Valid latitude and longitude are required." },
          { status: 400 }
        );
      }

      const radius = 20000;
      const query = `
        [out:json][timeout:18];
        (
          nwr(around:${radius},${lat},${lon})["shop"];
          nwr(around:${radius},${lat},${lon})["amenity"="marketplace"];
        );
        out center tags;
      `;

      const servers = [
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass.private.coffee/api/interpreter",
        "https://overpass-api.de/api/interpreter"
      ];

      const failures = [];

      for (const server of servers) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 9000);

        try {
          const form = new URLSearchParams();
          form.set("data", query);

          const response = await fetch(server, {
            method: "POST",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
              "User-Agent": "FindItNearby/1.0 (+https://findit-nearby.vercel.app)"
            },
            body: form.toString(),
            signal: controller.signal
          });

          if (!response.ok) {
            failures.push(`${server}: HTTP ${response.status}`);
            continue;
          }

          const data = await response.json();

          if (!Array.isArray(data?.elements)) {
            failures.push(`${server}: invalid response`);
            continue;
          }

          return Response.json(
            { ok: true, source: server, count: data.elements.length, elements: data.elements },
            { headers: { "Cache-Control": "public, s-maxage=180, stale-while-revalidate=300" } }
          );

        } catch (error) {
          failures.push(
            `${server}: ${error?.name === "AbortError" ? "timeout" : error?.message || "request failed"}`
          );
        } finally {
          clearTimeout(timer);
        }
      }

      console.error("All Overpass providers failed:", failures);

      return Response.json(
        { ok: false, error: "Nearby retailers could not be loaded right now.", attempts: failures },
        { status: 502 }
      );

    } catch (error) {
      console.error("FindIt nearby API error:", error);

      return Response.json(
        { ok: false, error: "Nearby retailer search failed.", details: error?.message || "Unknown server error" },
        { status: 500 }
      );
    }
  }
};
