FindIt Nearby V9 — Product Matching Prototype

V9 is the first version that separates:
1) visual understanding of the uploaded item
2) product-catalogue matching
3) future local-store inventory

CURRENT V9:
- GitHub Pages friendly.
- Uses Transformers.js + CLIP in the browser.
- Includes a small DEMO product catalogue in data/catalog.json.
- Upload an item photo and the visual model chooses a likely item type, then V9 shows catalogue candidates of that type.
- Product images/prices in the demo catalogue are clearly labelled demo data. They are NOT claims of live retailer prices or stock.

IMPORTANT:
A generic image model cannot guarantee an exact retail SKU from an arbitrary photo. Exact SKU matching needs a real catalogue containing product images and product IDs, plus a backend or approved API. Current V9 intentionally avoids fake exact-match claims.

NEXT PRODUCTION STEP:
Replace data/catalog.json with legitimate retailer catalogue data, then add a secure backend for:
- image embeddings / visual similarity
- product IDs
- retailer
- current price
- store-level stock
- affiliate/merchant links
- rate limiting and caching

DO NOT put private API keys in GitHub Pages files.

To deploy:
Replace index.html, style.css, script.js and the data folder in your existing GitHub repository, commit to main, wait for GitHub Pages to rebuild, then hard refresh the site.
