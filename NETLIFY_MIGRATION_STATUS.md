# FindIt Nearby Netlify migration status

The site can run on Netlify without a Gemini environment variable.

The production-safe behavior for image upload is conservative: accept and validate the image, but do not invent an identification when an approved vision provider is unavailable. Users can continue through typed product search. Nearby results, retailer evidence, price and stock verification remain separate concerns.

This replaces the previous hard 500 error caused by a missing `GEMINI_API_KEY` on Netlify.
