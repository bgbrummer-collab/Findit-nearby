# FindIt continuation audit — 30 October 2026

Continues the 29 October audit, preserving the existing design and features.

## Verified checkpoint

- Repository main: `055f77b163c3ba373aac48378832c5192ca63004` (merged PR #343).
- Production `/api/version` returned the same commit on 30 October.
- All 539 existing Node tests passed again, with zero failures; syntax checks passed.

## New live regression and repair

Using the production dashboard Search Product control, entered `Logitech G435` and submitted Find product information. The completed Product Information dialog had no product purpose, strengths or verified specifications. A direct production product-insights request reproduced the empty result.

The known manufacturer document adapter required a headset/headphones word, even when the user supplied the manufacturer and distinctive model. Permit the explicit Logitech + G435 query to discover the existing manufacturer document. Bare ambiguous models, conflicting explicit brands, wrong product types and accessory queries remain excluded. Every fetched page still passes the existing canonical/model/identity checks; no product specifications, prices or stock are stored in the repair.

A worker-route regression checks brand-and-model searches with and without separate brand fields, attributed manufacturer specifications, and rejection cases. The new test uses synthetic source content; it is not live-specification evidence.

## Open release limits

The previous audit's exact retailer coverage, tuner verification challenge, unverified branch stock, physical Samsung camera/GPS/notifications and lack of cross-device storage synchronization remain open. This audit is not a full launch or desktop/phone parity sign-off. Deployment of this repair and its UI retest must be recorded separately.

## Continued live and source verification

- All 543 local Node tests pass after the related fixes; syntax/diff checks pass.
- Production Dashboard Commerce suite passes on #343, including the prior G PRO purpose/strength failures.
- Ten-category live matrix on unchanged deployed #343: 5 passed and 5 failed. Electronics, clothing, beauty, toys and music returned verified offers plus information. Groceries, the requested white/blue shoe, tools, furniture and household did not complete the required useful-offer/information journey. Full compact evidence is in `launch-evidence-2026-10-30/commerce-matrix.json`. An HTTP 200 or honest empty state is not counted as a useful shopping pass.
- Actual G435 manufacturer photo uploaded using the visible Upload Photo control. First identification failed with a service message; retry identified `G435 headphones`, model G435, 85%, with brand left unconfirmed by the photo. Product Info then retrieved primary manufacturer weight, battery, included items and connection facts. Ask FindIt answered the submitted Bluetooth/weight/battery question with those attributed facts.
- That live dialog exposed package contents repeated under strengths and compatibility. New worker filtering keeps boxed contents in included items while retaining technical strengths and actual connections; a worker regression checks source attribution and section boundaries.
- Actual FirstShop catalogue returns G435 headset listings. The commerce verifier rejected them because `headphones` and `headset` scored as different type words when the model was known but photo brand was not. Canonicalize those two audio terms without lowering verification thresholds. The new code verifies the fetched FirstShop primary G435 blue/raspberry page at R1750 ZAR and in-stock online; this snapshot is not a confirmed colourway match for the photo. The photo did not corroborate colour. No branch inventory is established. New rejection tests cover wrong model, accessories, other product type and requested colour.
- Catalogue discovery can retry a distinctive explicit model when the full wording gives no valid candidate. Filtering retains the original separate colour/size constraints and leaves final SKU/page verification strict. Existing omitted-SKU discovery coverage still passes.
- A Bosch battery/charger kit was found but is deliberately excluded from a query that does not establish that package. Checkers' search response was a CloudFront rejection. Neither is treated as an exact offer success.
- The G435 API diagnostic is separate from the actual website upload; it is not substituted for the failed first UI attempt. Photo AI remains nondeterministic and cannot be certified failure-proof.
- The four PR GitHub suites remain queued with no assigned hosted runner. Local browser suites cannot start here because the Playwright browser executable is unavailable; cloud-browser live interactions above are separate evidence. No missing check is marked passed, and no workflow expectations were relaxed.

## Nivea actual photo retest

Selected the current Clicks 307992 primary front photograph through Upload Photo and clicked Identify & Find, without substituting a typed name. Result: `NIVEA deodorant`, 65%, with full Dark Wood/Black Carbon anti-perspirant label retained only as an unconfirmed hypothesis. Product Info supplies appropriate type guidance but no confirmed exact model or useful exact offer. This remains a failed exact-identification example, not a passed test. A separate API request hit the partial-identity cache; it does not provide fresh independent-reader diagnostics. The partial cache already expires after 120 seconds.

Playwright's official browser installer was attempted, but the downloaded browser archive was invalid/truncated. Automated local browser suites therefore remain unavailable. Hosted GitHub workflows still have no assigned runner. No CI or production rollout success is claimed for PR #344.

## Printed-quantity follow-up

After the partial cache expired, fresh diagnostics for the same Nivea photo showed that Gemma and Gemini both transcribed the full Dark Wood/Black Carbon label and `150 ml`; Gemini omitted its separate size field, and Gemma omitted the product-type phrase from its chosen name. Candidate construction consequently lost the complete label despite the independent printed evidence.

The repair accepts a single distinct metric quantity in a reader's printed-text transcription when its size field is empty, appends that observed quantity to its printed candidate name, and checks product-family words against the same printed text. Confirmation still requires independent support for the complete label and quantity. Conflicting sizes, ambiguous multiple quantities without a selected size, missing independent text, and conflicting scent/model remain unconfirmed in regression tests. No size is inferred from packaging appearance. Replaying the recorded readings now retains the full Nivea label and 150 ml without a guessed barcode or can-colour-as-product-colour. Evidence: `launch-evidence-2026-10-30/nivea-photo-diagnostics.json`.

All **544 local Node tests pass**, with syntax and diff checks passing. This replay is not a successful post-deployment photo UI retest; that remains pending rollout. The original failed production observation remains above.

## PR #344 deployment and actual UI retests

All four PR suites passed. PR #344 merged as `58a1a2e69cd508e3bfde7985dab3c4b48df04bfe`; production API and browser build stamp confirm it. Node regression, Full Production Audit, Final Production Audit, Dashboard Commerce, Release Smoke, production smoke and live-photo probe passed when inspected. The uncommon tuner discovery test still failed because no verified source was retrieved; it is not waived. Interaction checks were still running at that inspection.

The same Clicks Nivea primary front photo was selected through Upload Photo and Identify & Find on the deployed build. It now returns the full DEEP / Black Carbon / Dark Wood / anti-perspirant / anti-germ label and 150 ml. Product Info provides the matching manufacturer's purpose, 48-hour protection claim and source links. No retailer listing is promoted to an exact scented variant without supporting evidence.

The same primary G435 photo returns its model and useful manufacturer specifications. Product Info correctly separates package contents from strengths/connections. However, its only discovered FirstShop result is blue/raspberry while the photographed headset is black. The readers did not corroborate colour, leaving the field blank; the site then displayed that model listing as a best price. This is an unresolved variant-matching defect exposed by the post-deployment UI test, not a successful exact-photo shopping match.

## Follow-up: distinguish model listings from confirmed photo variants

Keep source-verified model listings as reviewable candidates when the photo has not established their retail colour or clothing/shoe size. Such candidates must not supply the exact-match offers array, best price, verified seller stock, watch baseline or shopping route. A reviewed exact product code, supported variant fields or an explicit typed confirmation still allow normal exact matching. Preserve candidate names, source prices and retailer links in Product Info and Compare, with a visible review step before the identity changes.

Carry photo/typed provenance and variant fields through existing POST/GET retry paths, and separate offer-cache keys by that provenance and variant, so a typed or different-colour cached result cannot bypass the guard. New backend and cache/round-trip tests pass; the added browser case checks both 1440px and 390px, usable candidate evidence, no wrong best price and no automatic confirmation. Its hosted execution remains pending this follow-up's PR checks.

Local follow-up suite: **548 tests passed**, zero failures; syntax/diff checks passed. The ten-category live matrix on #344 remains 5/10 complete useful-offer/information journeys; the remaining exact retailer coverage gaps and physical-phone/branch-inventory limits remain open.
