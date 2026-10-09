# FindIt Nearby verification checkpoint — 9 October 2026

Status: fixes deployed; application is **not fully verified or finished**. Continue this repository and its Cloudflare deployment. Preserve the existing interface and feature set.

Production: https://findit-nearby.bgbrummer.workers.dev/

Latest deployed application commit: `406536d9207be5bdec09a19c7f9d0bb438ba0fa3`. Production `/api/version` confirmed this SHA. Deployment run `37977443593` and local/production interaction run `37977443684` succeeded. Documentation and audit-bot commits do not change the application build. Earlier results below are historical; the current checkpoint appears at the end.

## Changes implemented

- Exact listing checks retain model numbers, sizes, capacities, colours and barcodes; reject neighbouring variants, accessories and bundles. Prices require product-scoped retailer evidence and an explicit currency. Removed stale catalogue-price fallbacks.
- Online availability stays separate from independently verified branch inventory. Nearby stores are category-relevant suggestions, not claimed exact-product sellers. Online prices alone cannot create a verified driving trip.
- Shared frontend price evidence rejects missing/blank/zero values, preserves USD/EUR/ZAR, and prevents mixed-currency cheapest comparisons or shopping totals. Typed searches no longer show invented image-confidence percentages.
- Product research fetches matching source pages. Manufacturer feature headings can support product-specific strengths; unsupported descriptions, specifications and drawbacks remain unknown. Corrected the Logitech headset source/parser and preserved the product-information sections.
- Photo response parsing handles nested provider objects. Generic fallback identities require corroboration; unsupported brands/models are removed or rejected. Primary brand/model claims need a witness if the second model is unavailable. Live fixtures now check visible Nike/Marc Anthony brands rather than accepting category words alone.
- Photo requests capture their input and generation: an older upload cannot replace a newer photo or typed search. Removed repeated automatic inference attempts for uncertain photos and aligned the client deadline with the worker deadline.
- AI daily-limit errors now explain the actual service limit, offer typed/barcode search, and stop further inference calls in that request. Failed searches synchronously dismiss the loading overlay; legacy scan journeys recognize terminal failures and return control to the dashboard. Continuing with typed search clears the stale photo-error status and provides fresh loading/completion messages.
- Store-hours requests now reach the correct route. Published OSM hours are matched to the actual named branch, evaluated in its time zone only for supported schedules, and remain unknown when unavailable or ambiguous. Client-supplied hours are not evidence.
- Feedback returns a delivery error when no delivery service is configured. Health explicitly reports configuration checks; deployment exposes its build SHA.
- Updated stale frontend fixtures and added behavioral tests for photo races, quota recovery, currencies, shopping plans and hours. No existing product feature was intentionally removed.

## Verification completed

- `npm test`: **71 passed, 0 failed**; no skipped tests. Covers backend routes, nine commerce categories with controlled retailer evidence, exact matching/GTIN, source-scoped price/currency extraction, research, nearby semantics, photo parsing/consensus, stale responses, quota handling, shopping plans and store hours.
- Syntax checks passed for changed files; an earlier repository-wide pass checked 129 JavaScript files without parse errors.
- Full Production Audit on application commit `0ca3ee11`: workflow `37946157282` succeeded. Its current dashboard/plan-aware checks reported 35 passes and zero failures. These use controlled API fixtures; they do not prove real-provider recognition or retailer coverage.
- Final Production Audit `37946157305`, Dashboard Commerce Regression `37946157234`, regression checks `37946157188` and smoke checks `37946157096` succeeded. Desktop/mobile controls, responsive layout, menus, free/premium gates, product information, comparison and error-free frontend operation were exercised. Mobile checks use browser viewports, not physical devices.
- Browser production retest: gallery/file upload selected the existing Nike photo; real quota failure displayed the daily-limit explanation; `#searchOverlay` was hidden (`display:none`); Search Product opened afterward. Earlier browser search for Sony WH-1000XM5 black returned the exact Sweetwater listing at USD 398, matching source description and an online-only shopping plan.
- Nine live typed product probes responded successfully without invented offers. Sony WH-1000XM5 black returned one verified USD 398 listing. Kelloggs Corn Flakes 500g, Levis 501 blue jeans, Nike Air Force 1 white, Nivea body lotion 250ml, Bosch GSB 13 RE drill, LEGO 75301, IKEA Billy white bookcase and Twinsaver 18 rolls returned no verified listings. This is a coverage gap, not successful shopping coverage.

## Failures and unresolved limitations

1. **Live photo recognition is blocked by provider allowance.** Cloudflare returned error 4006: daily free allocation of 10,000 neurons exhausted. Earlier Hugging Face fallback returned HTTP 402. No paid plan was activated. Latest live matrix `37947020214`, Live Photo Probe `37947020277` and Production Smoke `37947020167` failed. All five matrix images could not be recognized under the quota. These failures remain visible.
2. Photo recognition was inconsistent even before quota exhaustion. Nike succeeded in a direct/live test, but other fixtures failed or disagreed; one Marc Anthony output had the wrong brand and exposed a weak test assertion. Strengthened guards/tests are implemented, but the complete real-image accuracy matrix must pass after service capacity returns.
3. Real retailer discovery is insufficient across categories: eight of nine live sample queries had no verified offer. Do not relax exact/source verification to manufacture coverage. Improve supported source integrations and retain clearly labelled retailer-search alternatives where exact listings cannot be verified.
4. There is no demonstrated working real branch inventory integration. Never claim exact branch stock, price, driving directions or open-now availability without the required evidence. Published hours can also be absent or unavailable.
5. Feedback delivery endpoint is not configured (`/api/health` reports `feedbackEndpoint:false`). Form/modal behavior passed controlled tests, but actual delivery is not operational.
6. Physical camera capture, real mobile hardware, actual user GPS permissions, sustained load/performance and successful paid-provider failover were not verified. Synthetic coordinates were used for automated nearby tests.
7. Some live workflows still use fixed deployment delays. A future improvement should wait for `/api/version` to match the tested commit and consolidate duplicate AI probes to conserve the free allowance; never convert a failed real photo test into a passing mock test.

## Resume procedure

1. Read this checkpoint and existing history; fetch current `main`. Audit-bot commits can update `AUDIT_LATEST.txt`; preserve those updates when publishing with a branch lease.
2. Confirm production `/api/version`, then rerun the real photo matrix after allowance returns. Do not purchase capacity or activate billing without the owner's explicit approval.
3. Inspect every real image's name, brand, model and category, not only its confidence or HTTP status. Investigate incorrect identities without hardcoding fixture answers.
4. Improve verifiable retailer coverage for the eight unsuccessful category probes, and retest working source URLs/currencies/availability.
5. Configure a genuinely authorized feedback destination and prove delivery. Obtain a retailer-supported branch inventory source if exact local stock is required.
6. Rerun local behavioral tests and production desktop/mobile workflows; verify the deployed SHA. Do not call the application finished while these critical gaps remain.

Release Smoke `37947020186`, Dashboard Commerce `37947020112`, regression `37947020182` and smoke `37947020147` completed successfully on the latest application commit. The earlier Interaction Freeze Regression `37946157087` completed successfully. That interaction workflow ran the new quota-recovery browser test against local and production interfaces and confirmed that manual search remains reachable after photo failure. The successful interaction tests use controlled responses and do not erase the failed real-provider photo tests.

Latest Interaction Freeze Regression `37947020165` completed successfully. Its production run reported `PHOTO_QUOTA_RECOVERY_PASS` after submitting a typed query following a controlled photo-quota failure; it verifies both overlay cleanup and replacement of stale quota status. The final manual browser connection timed out while capturing typed-search completion, so that last completion check relies on this successful production automation; the fresh typed loading status was observed manually.


## Current checkpoint — verified live progress, 9 October 2026 evening UTC

The project remains unfinished. Do not describe mock-backed browser results as successful live retailer or vision coverage.

### Changes in this continuation

- Published from the current GitHub main tree, preserving prior files and automated audit output. Earlier publishing from an old base tree had dropped tested fixes. Restored photo recovery, final completion messages, responsive styles, and the missing retailer URL validator.
- Corrected retailer fallback links to actual domains and the current product query, including beauty and footwear typed searches. Links explicitly remain unverified.
- Corrected Incredible Connection's Magento search route and Clicks' Hybris search route; added lotion/fragrance classification and recognition of typed Sony WH-1000XM headphone models. Direct retailer retrieval precedes the reader fallback.
- Ranked relevant retailer product links ahead of navigation; excluded static assets, off-site links, search routes and homepages. Captured real Incredible Connection search HTML now resolves to the exact requested Sony URL. Increased the retained page limit because retailer product links occurred beyond the old 850 KB cutoff.
- Show verified online offers and direct product URLs in Top Stores, with the source currency and separate online/branch stock labels. Removed a newly discovered competing-observer loop that froze the page when verified offers arrived; integrated card rendering into the existing update handlers instead.
- Explain online shopping-plan scope directly in its initial render. Cancel superseded interaction checks so the suite verifies the current production SHA.

### Current verification

- `npm test`: **81 passed, 0 failed, 0 skipped**. Syntax and whitespace checks passed. New tests cover retailer routes, product links after long navigation/page prefixes, real fallback domains, and verified/unverified retailer cards.
- GitHub interaction run **37977443684 succeeded locally and against production**, gated by the exact deployment SHA. It covers desktop/mobile retailer cards, verified direct links, settings, product information, comparison and online stock, feedback UI, shopping tools, hours/maps controls, current-find relevance, upload activation, photo quota recovery, and responsive layouts. External endpoint responses in these browser regressions are controlled fixtures; they do not establish live provider accuracy.
- Manual production search for **Sony WH-1000XM5 black** returned the exact Incredible Connection page with **ZAR 5,999**, online `in_stock`, and `branchStockVerified: false`. Production rendered the direct link, actual currency, researched source description and stock scope. Opening and closing the help dialog after completion confirmed the page remained responsive. Screenshot: `docs/findit-verified-sony-2026-10-09.jpg`. Prices/stock may change after this check.
- Nine live API category queries completed: electronics returned that verified offer; groceries, clothing, shoes, beauty, tools, toys, furniture and household returned zero verified offers. These eight are coverage failures, not proof that retailers do not sell the items. Probe results: `docs/category-production-results-2026-10-09.json`.
- Live photo probe run **37977443632 failed**, code `CF_VISION_SPECIFIC_IDENTITY_CONFLICT`: providers disagreed about visible brand/model details. The app refused to invent an identity. Previous daily quota errors are a separate observed limitation, not the cause of this latest failure.

### Remaining work and boundaries

Prioritize reliable live photo identification and cross-category discovery. Check each store's actual search adapter, pagination and response before accepting any source; retain exact variant/barcode checks and scoped price/currency extraction. A correct parser on captured HTML is not successful production discovery until the live endpoint and browser both confirm it. Do not weaken identity checks or manufacture offers to turn empty searches green.

Physical camera and GPS hardware, branch inventory accuracy, sustained traffic performance, real feedback delivery, and universal product-specific pros/cons have not all passed real-world verification. The existing feedback service lacks confirmed delivery configuration. Do not activate paid providers or incur charges without explicit approval.

Continue from the latest remote tree and use an expected-SHA lease to publish. Never overwrite AUDIT_LATEST.txt manually. Local commit hashes differ from connector-created remote commits. Preserve the current code and design, and do not claim completion while the photo and category coverage failures remain.
