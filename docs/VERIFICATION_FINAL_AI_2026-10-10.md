# FindIt Nearby verification checkpoint — 10 October 2026

Production: https://findit-nearby.bgbrummer.workers.dev/

Verified deployed code: `171f125cffd1cf8f59b307884ee7887800d23179`.
This checkpoint records real improvements, not a claim that every requested feature has passed.

## Changes delivered

- Prioritised the strongest existing vision provider, simplified label reading, retained size, colour, barcode and visible-text evidence, and bounded inference time and free-quota failures.
- Reconciled independent label readings and metric sizes without accepting conflicting models or unsupported secondary units. Constructed complete packaged-product names only from words actually read on the label.
- Preserved useful product-type identification when an exact model cannot be corroborated. Added clear general-purpose information, immediate model confirmation and suggested label text only when supported by printed-word evidence.
- Reused verified retailer sources for product research. Read safe generated product JSON-LD and scoped product descriptions; retained source links, feature boundaries and identified size/colour/barcode fields.
- Fixed cancelled research preventing a fresh Product Information request after reopening.
- Fixed duplicate exact-product structured records hiding a current selling price. Conflicting prices, currencies and stock remain unverified.
- Matched equivalent technical model spacing and furniture dimension formats while rejecting different models and measurements.
- Fixed carpet being classified as a car and drinking glasses as eyewear.
- Refreshed browser asset versions and added unit and desktop/mobile interaction regressions. Existing features and design were preserved.

## Direct production evidence

| Test | Observed result |
| --- | --- |
| Real yellow Marc Anthony conditioner photo | Exact full identity: Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250 ml; independent model consensus; no model confirmation required. |
| Same photo, commerce and Product Information in browser | Clicks R230 ZAR; online availability verified; branch stock explicitly unverified. Published product purpose, retailer-described strengths, brand, size and source link displayed. |
| Official Apple Beats Solo3 multi-colour fixture | Beats headphones recognised, exact model not corroborated. General audio-device purpose displayed; model confirmation available; no invented exact specifications, prices or stock. This is not the user's missing original black-headphone upload. |
| Sony WH-1000XM5 typed search | Two verified offers, Incredible Connection and HiFi Corp, R5999 ZAR. Known-source research returned published battery, connection, microphone and noise-cancellation features. This is not a Sony photo test. |
| LEGO Classic Creative Dinosaurs 11041 typed search after price-parser fix | Exact Toys R Us listing, R649.90 ZAR, online in stock; physical branch stock not verified. Full-name native search already found the product, so no speculative discovery change was needed. |

Raw responses and screenshots are stored beside this report. The earlier ten-category matrix is retained unchanged as historical evidence: electronics and beauty returned verified offers; groceries, clothing, shoes, tools, furniture and household examples returned no verified offers. The current LEGO example was subsequently fixed and retested successfully. Safe empty results are not proof of complete category coverage.

## Automated verification

- 136 unit tests passed; zero failures; relevant JavaScript syntax checks passed.
- Cloudflare deployment run 38051431046 passed; deployed version was checked through `/api/version`.
- Regression run 38051431045, smoke checks 38051431048, production smoke 38051431081 and dashboard commerce 38051431100 passed.
- Real live-photo probe 38051431062 passed and its actual full Marc Anthony identity was inspected.
- Interaction regression 38051431115 passed locally and against the deployed commit, including model confirmation at 1440 px and 390 px, upload recovery, research close/reopen, price comparison, online/branch-stock separation, settings, shopping assistant and current-find relevance.
- Release smoke 38051430987 passed: responsive page loading, duplicate-ID/error guards, exact variant rejection, scoped research, plan controls and live research probes.
- The newly added confirmation test initially failed because its locator matched a hidden duplicate control. The visible-control selector was corrected and both viewport checks now pass.

Some browser suites use mocked API responses to verify UI behaviour. Their success does not establish universal live retailer coverage or successful real feedback delivery.

## Outstanding limitations and next work

1. Exact AI recognition cannot be guaranteed for every image. Ambiguous variants, unreadable labels and provider free-quota exhaustion still require confirmation, another image, a barcode or typed details.
2. Broader retailer discovery still needs work, especially the category examples with zero verified offers. Source availability, changing retailer markup and response times also limit coverage. Prices are observations at test time, not permanent promises.
3. Generic research queries can return family-level content. The release live PROAR USB-microphone probe included general condenser/XLR guidance; its passing test must not be treated as verified exact-model specifications. Further source/model filtering and usefulness checks are needed.
4. No branch-specific inventory integration is configured. Online stock is never evidence of stock at a nearby branch.
5. Production feedback delivery is blocked by an unconfigured FORMSPREE_ENDPOINT. UI tests verify behaviour with mocked delivery; they do not resolve this configuration. Central analytics storage is also unconfigured.
6. Physical phone camera capture and real hardware GPS permissions were not verified. Mobile viewport tests passed; they are not physical-device tests. Original user image files were unavailable.
7. No paid service was activated and no purchase or paid upgrade was made.

The application is improved and deployed, but the original requirement that all critical features work across every listed category has not been completely verified. Resume from this deployed code and the evidence here; do not restart or discard existing functionality.
