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


ZERO-BUDGET PRODUCT SEARCH FALLBACK
- Confident Gemini identifications now show:
  • Search exact item online
  • Search relevant nearby stores in Google Maps
  • Copy exact product query
  • Share find
- These links never claim a verified price or stock amount.
- No paid retailer account is required for these fallback tools.


CENTRAL FEEDBACK STORAGE — SUPABASE FREE TIER
==============================================
1. Create a Supabase project.
2. Open Supabase SQL Editor.
3. Run SUPABASE_SETUP.sql.
4. In Vercel add these PRIVATE environment variables:
   SUPABASE_URL
   SUPABASE_SERVICE_ROLE_KEY
5. Redeploy FindIt.

After that, every submitted rating/message is stored in:
Supabase Dashboard -> Table Editor -> feedback

IMPORTANT:
- Never put SUPABASE_SERVICE_ROLE_KEY in index.html or script.js.
- Never send the service-role key in chat.
- The feedback table has RLS enabled and no public read policy.


VERCEL NATIVE SUPABASE INTEGRATION
==================================
This build supports the environment variable names created by the Vercel Supabase integration.

URL:
  NEXT_PUBLIC_SUPABASE_URL
or:
  SUPABASE_URL

SECRET:
  SUPABASE_SERVICE_ROLE_KEY
or:
  SUPABASE_SECRET_KEY

After deployment open:
  /api/feedback-health

Expected:
  ok: true
  feedbackTableReachable: true
