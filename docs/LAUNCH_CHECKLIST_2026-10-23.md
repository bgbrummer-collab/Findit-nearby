# FindIt Nearby — 23 October 2026 continuation audit

**Not launch-ready.** This audit preserves the current design and features. No new paid service, billing or Supabase integration was activated.

## Starting evidence and scope

Reviewed October 17, 18 and 21 launch checklists, existing evidence, current repository tests and deployment workflows, available conversation context and open pull requests. Started at main `94c6d38`, whose production runtime was `9d143f1`. Open historical diagnostic PRs #85–89 explicitly say not to merge; older overlapping PRs were not merged blindly. Expanded PR #308 into one related evidence/input repair set rather than approving its original title-only fallback check.

## Repairs under PR #308

- Active exact-commerce verification rejects a drill package with added batteries and charger when the request did not ask for those components. A real baseline Bosch model-only search reproduced this false positive. Explicit package requests and standalone products retain their paths.
- Smart Choice requires exact identity plus source evidence and suppresses offers for unconfirmed models. Online chain offers no longer inherit the nearest branch's distance/open status. Physical recommendations require branch identity and branch evidence. Nearby branch discovery remains available separately.
- Both dashboard price decorators explicitly label online prices on physical branch cards. Baseline browser showed an unqualified R230 price beside multiple Clicks branches despite unknown branch stock.
- Legacy fallback offers and AI-discovered URLs now use the existing shared exact-product verifier for product-scoped prices, currency and availability, rather than the first rand amount / arbitrary stock text on a rendered page. Mixed currencies cannot determine a cheapest fallback offer. **This module is currently not called by the Worker; do not portray its hardening as increased live discovery coverage.**
- API rejects invalid EAN/UPC check digits and empty photo files before external requests. Formatted valid explicit barcodes retain canonical digits. Baseline live API accepted an invalid check digit as a confirmed input.

PR #308 passed 377 Node tests, including 18 new regressions. The final follow-up passes 389, including 30 total new regressions in this session. Dynamic retailer regression, JavaScript syntax checks and diff checks pass. Before/after logs reproduce failures against the old implementation. Tests also cover matching variants, unconfirmed identity, unavailable sources, currency separation, branch evidence and normal inputs. These checks do not certify every real product.

## Related follow-up under PR #309

Production retest exposed competing writers duplicating Smart Choice prices. Delegate to its existing owner; use the shared same-currency cheapest selector/formatter across dashboard writers; do not convert missing prices to zero or missing currency to ZAR. Require branch-specific price evidence before an online price inherits distance/open status. Preserve exact-match, branch and price-condition metadata through both legacy offer normalizers. Route drill/tool packages to hardware even when their title includes a charger. This preserves UI/design and data access features.

Final #309 branch `8803f35` passed all three required checks: Node regression, Full Production Audit and Release Smoke. Merged as `f4f276a0cc5a58c1b00c087d5d5d64b5ded5e6d6`; production deployment and targeted verification follow.

## Actual baseline customer journeys

- Real conditioner JPEG selected through the file chooser; Identify & Find clicked without typing its name. Marc Anthony Strictly Curls conditioner identified at 85%, one Clicks R230 listing. Actual retailer browser page confirmed the 250 ml product and R230, plus online In Stock. FindIt conservatively left online stock unverified because its retrievable structured source did not supply that stock field. No branch stock was claimed.
- Product Information and Ask FindIt supplied source-linked purpose, published strengths, usage/ingredients and R230, while explicitly leaving branch stock unverified. Populated Compare showed the online offer separately from branch listings.
- Public Menlyn coordinates entered through the UI: 12 relevant branches loaded with distances and published hours; nearest Menlyn Park about 0.1 km. This does not certify physical GPS or branch inventory. The pre-repair Smart Choice price/location combination was misleading and is repaired above.
- Conditioner added to shopping list; online plan and price persisted after reload, with no invented driving trip. Free Premium Beta persisted; real payments remain disabled.
- Real microphone JPEG replaced the conditioner, cleared its identity/price, then identified only the microphone family. Exact model and seller remained unconfirmed, with recovery controls. Nearby provider retrieval was unavailable for this journey. This is a failed exact-shopping journey, not an exact identification success.
- Barcode 5449000000996 entered through Scan barcode/manual entry returned Coca-Cola 330 ml with Open Food Facts provenance and no invented seller. Saved Find persisted after reload and Open product started a fresh evidence refresh. Remote camera decoding is unsupported in this browser.

Raw browser text and source evidence: `launch-evidence-2026-10-23/`.

## Baseline live matrices

Stable runtime `9d143f1`, ten typed searches across electronics, groceries, clothing, shoes, beauty, tools, toys, furniture, household and music: six produced priced listings and product research, four none. The tools result was subsequently found to be an unsolicited package, so six is a baseline test count, **not six certified exact-shopping successes**. Jeans were an unspecified-color family request with several explicitly named variants.

Five actual photo API uploads (neutral upload filename, no product query): one identified conditioner with priced offer; four partial identities (toilet paper, Nike shoes, microphone, eyeglasses), no exact offers. Provider diagnostics include Gemini timeouts, one Cloudflare reader error and Hugging Face HTTP402 credits unavailable. Do not fund these services or weaken identity gates to inflate success counts.

## Remaining launch limitations

- Broad photo-to-exact-offer accuracy remains inadequate; family-only photos are not exact SKU recognition. Hidden/unreadable model identifiers cannot be reliably inferred from appearance.
- Groceries, shoes, furniture and household baseline searches had no priced offers. This audit does not prove those products are unavailable; catalogue access, coverage and evidence are incomplete. Further retailer-adapter work may still help.
- Authoritative SKU-by-branch stock and price feeds are absent. Branch opening hours are not stock. Nearby coverage outside supported official locators depends on public map providers and can fail.
- Durable background alerts, external notifications and central analytics remain unconfigured. Local watchlists do not establish an always-running monitoring service.
- Physical phone camera, physical GPS/permission behavior, OS-level drag/drop, broad device/accessibility/load testing and all inherited unchecked control states remain uncertified. Automated responsive tests are scoped evidence only.

## Release verification completed for PR #308

Merged and deployed `65e8de53db5e9a1fe6578213aa122bcf721253de`. Actual browser frontend metadata and Worker `/api/version` match. Production smoke, dashboard commerce, interaction freeze, final production audit, regression, photo probe and static smoke passed. Full Production Audit and Release Smoke were still running at the last snapshot; the previous PR-head Full Production Audit was cancelled during dependency installation. Do not upgrade an unfinished run to passed.

Actual deployed conditioner chooser/Identify run again returned its source-linked R230 offer. Public Menlyn location loaded 12 branches; Smart Choice kept the R230 **online** offer separate from the nearest branch's 0.1 km/open state. Location map opened and Zoom in responded. Actual deployed API now rejects invalid checksum, empty photo, empty search and invalid location, accepts formatted valid barcode and rejects unsupported method.

Stable post-deployment ten-category matrix: **5/10 returned priced listings and research**. The drill model-only query now excludes the unsolicited kit instead of counting it as a success. Remaining no-offer cases were groceries, shoes, furniture, household and tools. A subsequent explicit-package query also returned no offer; follow-up routing repair addresses its electronics misclassification, but production recovery must be retested. Backend and frontend copies of the API responses are retained, not just a green checklist.

Korg Pitchclip 2 uncommon-product regression failed from this execution environment: no exact page could be verified. The retailer's public product endpoint and catalogue API returned HTTP403 with a site-served Cloudflare `Just a moment...` challenge. No circumvention was attempted. Availability and prices are not inferred from this block.

## Final follow-up release verification

PR #309 merged and deployed as `f4f276a0cc5a58c1b00c087d5d5d64b5ded5e6d6`. Actual browser frontend metadata and Worker version matched. Actual photo chooser/Identify retest returned the conditioner and R230 source-linked offer. Its full audit, final production audit, interaction freeze, commerce and production smoke passed. Responsive layout run was cancelled, not passed; its Release Smoke was still running in the captured snapshot. Uncommon-commerce regression failed with no exact Korg page, consistent with the locally observed retailer challenge; the CI log itself establishes only that no verified page was found.

Stable final backend delta on f4f276a: bare Bosch model -> no unsolicited package; **explicit batteries+charger package -> matching named TMB Supplies listing, R4999 ZAR**; Logitech exact product code -> matching Computer Mania listing, R2299 ZAR. The package now routes to hardware retailers. This verifies the engine's current source data, not browser-visible TMB currency agreement. Navigation to the actual TMB page timed out in the cloud browser. Earlier audits recorded a source/browser currency discrepancy; this session cannot certify it resolved.

The browser retest caught a remaining value-fallback writer still duplicating Smart Choice prices. PR #310 makes it leave cards to their existing owner and adds a regression. All three branch checks passed (Node regression, Full Production Audit, Release Smoke), then it merged and deployed as **`57285eaf30d2d11e4a302af646e73ba597a7a328`**.

At the final HTTP check, Worker `/api/version` and homepage build metadata both report 57285eaf; `/value-first-results.js` returns200 and contains the owner guard. All eight workflows returned for that final code commit completed successfully, including deployment, production smoke, dashboard commerce, interaction freeze, release smoke and Node regression. No Full Production Audit was triggered on that final push's paths; its branch audit passed. See `final-workflows.json` for precise statuses rather than inferring from names.

**Final direct visual retest remains unverified:** after the TMB navigation timeout, the subsequent FindIt reload/browser tool call also timed out. This is a limitation of the current browser session; it is not evidence that the public FindIt site is down. HTTP version/asset checks and production test workflows remain available. No final screenshot is presented as verified.

No design/CSS rebuild or feature removal occurred. Source repairs are committed through PRs #308–310. Earlier baseline/raw evidence, failed outcomes, cancelled checks and limitations are preserved. No work is implied to continue after the final response.

## Seven-priority status

| Priority | Demonstrated evidence | Remaining limitation |
|---|---|---|
| AI photo identification | Real conditioner photo-to-offer; family-only microphone UI and five-photo API sweep | Four of five sweep photos have no exact offer; provider failures/credits and unreadable identifiers |
| Exact retailers | Wrong kit excluded; explicit kit and headset code find matching listings; model/size/colour regressions | No verified listings in several categories; niche retailer blocked |
| Product information | Actual sourced conditioner/headset/barcode browser panels; research across successful typed queries | Unconfirmed products get general guidance; no invented specifications |
| Ask FindIt | Actual mixed purpose/price/branch-stock answer uses Clicks source and leaves branch stock unknown | Broader uncommon-product and conversation coverage not certified |
| Prices and locations | R230 matched actual Clicks page;12Menlyn branches; online/branch separation; same-currency rules; explicit packageR4999 | No branch inventory feed; TMB browser currency agreement unresolved; map providers can fail |
| Other features | Shopping-list and saved-Find persistence, saved reopen, free Beta, compare, manual barcode, map open/zoom | Physical camera/GPS/OS drag, durable background alerts, analytics and every inherited state not certified |
| Launch tests |389Node tests; final branch checks;8returned final-code workflows passed; direct version/asset checks | Real outcome gaps, uncommon source failure, cancelled broader layout check and final browser-session timeout prevent launch certification |

