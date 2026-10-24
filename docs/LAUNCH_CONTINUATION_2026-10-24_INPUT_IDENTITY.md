# FindIt Nearby — 24 October 2026 identity and input continuation

**Release verdict: not certified for public launch.** Repairs are deployed, but broad photo-to-exact-offer coverage and several real product searches remain inadequate. A passing workflow is not proof of a successful shopping journey for every product.

## Checkpoint and review

Started from main `7681e4b`, runtime `57285eaf`. Read the October 23 checklist and its recorded October 17/18/21 findings, available previous conversation checkpoint, tests, Cloudflare configuration and deployment/release workflows. PR #308 was already merged, as were #309 and #310. Historical open diagnostic PRs explicitly marked “Do not merge” were left alone. Other old overlapping branches were not merged blindly.

PR #312 appeared during the session. Reviewed its changes, tested the combined implementation, preserved its work when resolving a Worker conflict, and merged only after its three branch checks passed. No CSS/layout redesign, feature removal or paid-service activation occurred.

## Repairs and commits

- **#311, `0bdb6e1a`: exact quantities and barcode equivalence.** Reproduced a model-specific **1.5 L request accepting 5 L** because punctuation splitting discarded the decimal prefix. The same verifier rejected equivalent 1500 ml. Canonical metric volume, mass and length now use exact decimal strings in shared verification/discovery. Tiny quantities do not round into one another. Ambiguous comma/thousands notation remains distinct rather than being interpreted silently. Existing brand/model/colour and package gates remain in force. Product-scoped valid EAN/UPC/GTIN values can match their zero-padded GTIN14 equivalent; absent, invalid or different codes cannot establish identity. Corrected two old test fixtures with invalid check digits.
- **#312, `ec52496e`: category routing and sourced purpose.** Reviewed and merged the concurrent repair: chair/hair, Moleskine/skin, dressing-table/dress and Fortuner/tuner substring collisions no longer choose those incorrect categories. Furniture table phrases and intended plural category words retain their paths. Product Information prefers a sourced functional statement over an earlier material/fit fragment. General product-type guidance follows the corrected route.
- **#313, `916a0e64`: truthful input errors and route resilience.** Malformed JSON, null/array search bodies, non-text fields, unreadable multipart uploads and unsupported payload types no longer masquerade as accepted photos with an AI outage. Overlong searches are rejected before truncation can discard a size/model qualifier. These return actionable, nonretryable 400/415 responses before provider calls. The shared JSON reader prevents null/array payloads from crashing assistant, information and feedback routes. Valid aliases and existing upload paths remain available.

All three branch checks passed before each merge: Node regression, Full Production Audit and Release Smoke. After resolving the combined changes, **409 Node tests passed**, with syntax, diff and dynamic retailer discovery checks passing. Nine new test cases/suites in this session cover quantities, barcodes, malformed inputs and route recovery; #312 adds eleven further regressions. Tests include wrong models/colours, quantities and barcode codes; tiny/ambiguous quantities; unavailable providers; and invalid requests. Mocked cases verify logic, not real catalogue coverage.

## Demonstrated customer journeys

The direct browser journeys below were exercised through actual controls. Public Menlyn coordinates were used; no personal GPS location was supplied. Evidence text is in `launch-evidence-2026-10-24/`.

1. **Exact text search:** Logitech PRO X Gaming Headset 981-000818 returned Computer Mania at **R2299 ZAR** and sourced product information. The actual retailer browser page independently showed that SKU, price and online In stock. This does not establish physical branch inventory.
2. **Microphone photo:** selected the repository's real JPEG with the file chooser, clicked Identify & Find without typing its identity, and received only microphone-family recognition. Old headset price/results were cleared. No exact model/offer was claimed. This is not an exact-shopping success.
3. **Conditioner photo:** selected the real JPEG and clicked Identify & Find. This run returned a partial Marc Anthony conditioner identity, unlike the previous audit's automatic full match. Review possible product opened a source-linked candidate with details and R230. Explicit candidate selection completed the shopping flow. This tests assisted selection; it is **not automatic exact-photo identification**, and the low-resolution photo does not independently prove the 250 ml size.
4. **Retailer verification:** actual Clicks page showed Strictly Curls 3X Moisture Triple Blend Conditioner, **250 ml, R230**, online In Stock and matching description. FindIt conservatively left online availability unverified where its retrievable structured source lacked that field. Unknown branch stock remained unknown.
5. **Ask FindIt:** combined purpose, price and nearest-branch-stock question returned sourced purpose/strengths, R230, and explicit lack of verified branch inventory. No product-specific drawbacks were invented.
6. **Locations/map:** entered public Menlyn coordinates (-25.7823, 28.2751), obtained twelve relevant Clicks branches, published addresses/hours and distances. Nearest branch about 0.1 km. Smart Choice kept the R230 online offer separate from physical branch distance/open state. Open location map and Zoom in responded. Published scheduled opening is not a live inventory check.
7. **Shopping tools:** added conditioner to shopping list, saved Find, reloaded, verified both persisted, and reopened saved product to start fresh information/offer checks. The list retained an explicitly online shopping plan without inventing a driving trip.
8. **Barcode:** Scan barcode/manual entry with **5449000000996** returned Coca-Cola 330 ml with Open Food Facts provenance. No seller or price was fabricated. Camera decoding was explicitly unsupported in this cloud browser, so physical scanning is uncertified.

## Real product matrices

Baseline and final production matrices used ten unchanged queries across electronics, groceries, clothing, shoes, beauty, tools, toys, furniture, household and music, with two independent requests in parallel. Final matrix ran on a stable Worker version `916a0e64` from start to finish.

**5/10 categories returned priced listings and researched information:** electronics, clothing, beauty, toys and music. Examples: headset R2299, conditioner R230, LEGO Classic 10696 R559 and Shure MV7+ R7095 (retailer SKU MV7+K). Clothing results represent explicitly named variants under an unspecified-colour family request, not proof of a selected clothing size being in stock.

**No priced offers:** Coca-Cola Original Taste 2L; Nike Air Force 1 Low White Blue; bare Bosch GSB 18V-50; IKEA BILLY bookcase 80x28x202 white; Twinsaver Comfort 3 Ply Tissues 120. The bare drill still correctly excludes an unsolicited kit. Empty offers do not prove the item is unavailable in the market. Discovery coverage, source access and authoritative evidence remain incomplete; more retailer integration work may help.

Five real photo API uploads used neutral filenames and no product-name query: **one model-level identity** (Twinsaver Twin Ply 18 Rolls), **four partial identities** (conditioner, microphone, Nike shoes, glasses). The automatically identified Twinsaver photo was then sent through real retailer discovery and research: zero offers and researched=false (`twinsaver-photo-commerce.json`). This is not one verified photo-to-priced-offer success. Diagnostics include a Cloudflare reader error and Hugging Face HTTP402 credits unavailable. Existing corroboration prevented unsupported exact model claims. These small repository fixtures are a bounded regression sample, not a representative accuracy benchmark.

## Final deployment verification

Cloudflare deployment succeeded. Worker `/api/version`, HTTP homepage build metadata and actual browser homepage metadata all reported **`916a0e64b47440876ac47b2b523c067e89893580`**.

The actual saved-product reopening and Compare Prices journey was repeated on this frontend build: the refreshed conditioner offer remained R230, with branch stock unverified. See `findit-final-compare-20261024.txt` and its screenshot.

Ten direct production input checks passed: malformed JSON, null search, object query, invalid barcode checksum, overlong query, null assistant, null information, null feedback, normal product text and formatted valid barcode. Responses and matching frontend/Worker versions are retained in `deployed-input-checks.json`.

All eleven workflows returned for the final code commit completed successfully, including deployment, regression, Full Production Audit, Final Production Audit, production smoke, release smoke, dashboard commerce and interaction freeze. Workflow status snapshots are in `final-workflows.json`. Release smoke includes 390 px and desktop checks, including simulated product flows. Full audit includes mobile dashboard/control visibility and overflow checks. These do not certify physical camera/GPS, OS file pickers, every phone/browser, all accessibility states or load endurance. See the exact captured conclusions; running or cancelled checks are not passed.

## Seven-priority status and remaining work

| Priority | Current evidence | Remaining limitation |
|---|---|---|
| AI photo identification | Two browser chooser/Identify journeys; five-photo API sweep; truthful partial recovery | Four partial identities; broad automatic exact recognition remains inadequate; unreadable identifiers and service failures cannot be guessed |
| Exact retailer matching | Fixed fractional-size false positive, equivalent metrics and GTINs; model/colour/package regressions; ten-category sweep | Five no-offer cases; broader retailer coverage still needs work |
| Product information | Sourced headset/conditioner panels; barcode provenance; functional-purpose selection repair | Unconfirmed products receive general guidance; catalogue facts and specifications depend on accessible sources |
| Ask FindIt | Actual mixed purpose/price/branch-stock question returns source-linked evidence and uncertainty | Broader uncommon-product/conversation coverage remains uncertified |
| Prices and locations | Two retailer pages checked independently; R230/R2299; twelve branches, map, distances and published hours | No authoritative SKU-by-branch price/stock feed; earlier TMB browser/source currency discrepancy not resolved in this session |
| Other features | Saved/list persistence and saved reopening; barcode/manual location; current release/commerce/interaction tests | No physical phone/camera/GPS test; durable background alerts/notifications and central analytics remain unconfigured; every inherited state is not certified |
| Launch testing | 409 combined tests, successful branch release gates, stable final ten-category matrix and ten deployed input cases | Green checks do not erase incomplete real shopping outcomes; launch certification withheld |

No zero-failure or zero-future-improvement claim is made. The remaining recognition/coverage work must not be reclassified as passed or solved merely because errors are handled safely. No work is implied to continue after this session's final response.
