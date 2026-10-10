# Screenshot search failure: 10 October 2026

Deployed code: 4aaa5bf661d70b5a7206e236f9746b4396e6ff36.

The supplied screenshots showed the typed query `Marc Anthony strictly curls triple blend conditioner` with no researched product facts, no verified listing, and an empty online shopping plan.

Before this fix, the live Product Info API returned `researched:false` for this exact query without supplied offers. Live commerce discovery did find Clicks on later attempts, including with an empty brand field: this was an intermittent discovery problem, not an assertion that this query always failed. Known retailer candidate discovery previously required a separately parsed brand; typed searches do not supply one. Product Info relied on search-engine results or already found offers.

The existing retailer candidate function now also recognises the brand in typed identity text. Product Info reuses these candidate URLs independently of commerce or search-engine results. Every candidate must still pass the existing exact product/page/variant verification before its facts or price can appear. No matching requirements were relaxed.

Verification:
- 147 automated tests passed, zero failures; syntax checks passed.
- New regression simulates empty search-engine results and the user's typed query without a parsed brand; both commerce and product research succeed from the verified retailer page.
- Production `/api/version` confirmed the deployed code SHA above.
- Actual production browser search used the screenshot's exact wording. Product Info displayed the retailer description, brand, four published strengths, and source URL.
- Clicks listing displayed R230 ZAR and online in-stock availability; branch inventory remained explicitly unverified.
- Adding this Find to Shopping List produced one online retailer at R230.
- Ask FindIt answered the combined purpose/price/stock question with sourced facts, R230 and online availability, distinguishing branch stock.
- Deployment, unit regression, syntax/smoke checks, dashboard commerce, live photo probe, production smoke, release smoke (including live product research) and local/production interaction checks all passed. Release run 38068882426 and interaction run 38068882424 completed successfully.

Remaining limitations: no user GPS/camera test in this turn, no private branch inventory, no claim of universal retailer or product coverage, no verified product-specific drawbacks. Nearby stores were not tested using a user's location. Existing saved shopping-list entries are historical snapshots; repeat the search and re-add an item to capture current verified offers.

Browser proof: `findit-screenshot-search-fixed-20261010.jpg`.
