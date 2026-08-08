FindIt Nearby — Free MVP v3

FREE SERVICES / COMPONENTS
1. Browser Geolocation API — no API key.
2. Leaflet — open-source map UI.
3. OpenStreetMap data — free to use under its licence, with attribution.
4. Public Overpass API — nearby OpenStreetMap places; public instances have capacity/usage policies.
5. Gemini API — optional image understanding. Google currently offers a Free Tier for selected Gemini models. For a real public app, use a backend/serverless function so the API key is not exposed in browser code.

IMPORTANT LIMITATION
OpenStreetMap tells us that a place is mapped as a shop/market/etc. It does NOT tell us that the photographed item is currently in stock or what it costs.

NEXT PRODUCTION STEP
Connect:
photo -> Gemini image identification -> item keywords
item keywords + coordinates -> store/product data source
store/product data -> results + price + stock + directions

DO NOT put a Gemini API key directly in script.js in a public website. Use a backend/serverless function.

OSM requirements:
- Attribute OpenStreetMap.
- Respect the Nominatim/OSM tile policies if those services are used.
- Public services are not guaranteed for high-volume commercial traffic; switch to a suitable provider or self-host when the app grows.

The current app intentionally uses public OpenStreetMap/Overpass data only for mapped nearby places and clearly labels them as such.
