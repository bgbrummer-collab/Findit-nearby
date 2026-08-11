FINDIT NEARBY — STABLE BUILD

Fixes included:
- Replaces the old fixed-category classifier with Gemini.
- Updates Gemini from gemini-2.5-flash to gemini-3.6-flash, with gemini-3.5-flash-lite fallback.
- Removes deprecated Gemini temperature sampling setting.
- Uses relative frontend asset paths so CSS/JS work from Vercel and nested static hosting.
- Adds aggressive mobile/coarse-pointer responsive fallback to prevent desktop layout being shrunk on phones.
- Constrains uploaded preview images to phone-safe viewport height.
- No unrelated generic nearby-store fallback.
- Adds /api/health to test the Gemini secret/model without exposing the key.
- Keeps real retailer price/stock/store output disabled unless an authorised retailer feed is connected.

Vercel environment variables:
REQUIRED:
  GEMINI_API_KEY

OPTIONAL:
  GOOGLE_PLACES_API_KEY
  RETAILER_FEEDS_JSON

After deployment:
1. Open https://findit-nearby.vercel.app/api/health
2. It should report ok:true and modelReachable:true.
3. Test the main site with a clear shoe, microphone, flower, clothing item and another product.
4. Real prices/stock need authorised retailer feeds.
