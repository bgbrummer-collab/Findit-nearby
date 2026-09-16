# Netlify functions

`api.js` provides compatibility for the existing `/api/*` routes. Netlify routes `/api/search` to the safe no-key image fallback so a missing third-party AI credential cannot crash image upload. The fallback never fabricates product identity, price or stock.
