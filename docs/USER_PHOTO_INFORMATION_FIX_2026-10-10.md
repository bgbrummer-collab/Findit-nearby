# Original photo: useful sourced product information

Tested the supplied 225×225 Marc Anthony conditioner photo in the production browser on 10 October 2026.

## Cause and repair
The photo produced a partial identity and an OCR error: “triple bend” rather than “triple blend”. Exact-product safeguards correctly stopped unconfirmed specifications, but also left the user without a useful researched next step. FindIt now researches independently visible label words against published retailer product pages and presents a clearly marked possible product. Single-character OCR tolerance applies to candidate suggestions, never numeric model substitutions. Brand, product type, size and barcode conflicts remain excluded. A user must confirm the candidate before its facts become the selected product's facts.

Fixed safe same-retailer HTTPS redirects and source fetch headers after actual production testing exposed empty candidate results. Reuse verified fetched pages internally. Added extraction of published usage instructions, ingredients, warnings, storage and pack quantity from product-specific sections; exclude unrelated footer instructions. Ask FindIt uses this sourced information and labels unconfirmed candidate information clearly. Candidate confirmation retains the original photo, brand, category and selected size. Recovery offers “Review possible product”.

## Actual production results
Candidate: Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml. Source: https://clicks.co.za/marc-anthony_3x-moisture-conditioner-250-ml/p/335689

Photo → Identify → Review possible product → Yes, this is my product → Product Info completed normally. Product Info displayed the product's purpose, published strengths, usage instructions, full ingredients, storage and warnings with source links. Original photo remained visible. Ask FindIt returned the published usage and ingredients. Comparison, shopping list and watchlist displayed Clicks R230 ZAR. Online availability was in stock; branch stock remained explicitly unverified. Watchlist recorded one verified observation and accurately explained that background alerts require a server notification service.

## Validation
152 unit tests passed. Desktop 1440px and mobile 390px candidate/manual confirmation regressions passed in GitHub Actions against local and production pages. Deployment of application commit ad6eae0fcbb6e78e1ddb8c77f9fd26f6df56ebef succeeded and /api/version confirmed it. Dashboard commerce, production smoke, release smoke, final audit and interaction-freeze jobs passed. The first broader full audit failed on an immediate price read before asynchronous retailer results; comparison later saw the fixture price. Commit b36e289c0dc258563f10be09b7667086979a5605 adds a bounded wait without relaxing the expected price. Full-audit rerun 38085214536 passed: 29/29 broad checks and 35/35 final combined checks, zero failures or warnings. Test-only commit b36e289c0dc258563f10be09b7667086979a5605 was also deployed successfully.

Local Playwright execution was unavailable because its Chromium binary was missing; CI installed Chromium and ran the browser tests. Cloud browser manually verified the real original image and live retailer data, separate from mocked UI regressions.

## Limits
The small photo still needs confirmation; no promise of infallible AI. Retailer coverage is incomplete. No invented negatives, unavailable specifications or private branch inventory. Precise user location was not supplied in this browser, so actual nearby distances, directions and branch stock were not verified in this turn. Existing server-side feedback/analytics configuration and background notifications remain separate limitations. No paid service was activated.

Evidence: user-photo-confirmed-info-20261010.jpg and user-photo-candidate-research-20261010.json.
