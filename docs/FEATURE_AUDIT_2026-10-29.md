# FindIt continuation audit — 29 October 2026

## Release decision

Not an all-features quality pass. This continues the controls matrix in `FEATURE_AUDIT_2026-10-28.md`; previous observations are not silently upgraded to current verification. The design and existing features are retained. No paid data provider or purchased service was added.

## Completed repairs

- PR #341, merged as `07329eb60adb78dcd5c92c3b58bcb357c0e06318`: keep known manufacturer sources inside the four-page information budget; validate abbreviated primary Product records against their canonical page before expanding their names. All four PR suites passed; production version confirmed.
- PR #342, merged as `684c0a6c3f6033e8b6b5cfe3fcc065a4b05a65a0`: repair larger Clicks catalogue discovery, reject additional personal-care variants, retain independent printed-label consensus across deodorant aliases, add FirstShop discovery, parse primary Logitech published data, prioritize question-relevant specifications, and exclude contact lines from product strengths. All four PR suites passed and Cloudflare deployment succeeded. Production `/api/version` confirmed this commit.
- Follow-up: retain primary manufacturer SEO descriptions when display copy is empty, expose attributed technical features as published strengths, research a known manufacturer model when the image did not establish its brand, and use the exact Nivea manufacturer page for supported model/size queries. The complete printed name remains visible; the generic anti-germ label claim is separated from the discovery query, retaining scent and quantity. Cache namespace refreshed.

## Reproducible inputs and observed results

| Test | Observation and limit |
|---|---|
| Clicks Nivea Deep 150ml primary product image, selected using FindIt's visible Upload Photo control | Before repair, actual UI returned only `NIVEA product`, 50%. API diagnostics showed Gemma and Gemini independently read the complete visible label, but `deodorant spray` and `aerosol deodorant spray` split the object consensus. No typed name was substituted for this photo test. |
| Same recorded independent label readings, updated reconciliation | Full printed label and 150ml quantity retained, without a guessed barcode or bottle-colour-as-product-colour claim. Missing independent label/quantity, conflicting scent/model and conflicting size remain unconfirmed in tests. Post-deployment photo retest recorded below. |
| Named `Nivea Men Deep Anti-Perspirant 150ml`, new code with live upstream pages | Verified [Clicks 307992](https://clicks.co.za/nivea-men_deodorant-spray-deep-150ml/p/307992), R52.99 and in-stock online during the check. New code rejected Deep Extreme and Espresso. This is a timestamped upstream result, not a stored price or verified branch stock. |
| Full printed Nivea Dark Wood label, updated code with live source | Retrieved a purpose and protection claim from [Nivea's exact 150ml product page](https://www.nivea.co.za/products/nivea-men-deep-aerosol-150ml-60010510028870147.html). Source says Dark Wood; the retailer's abbreviated title alone is not proof of this exact photographed variant. |
| Logitech primary G435 photograph, actual live upload on #342 | Actual UI identified `G435 headphones`, 85%, without a supported photo brand. The uploaded photograph was obtained from the manufacturer's primary Product image, not generated. Missing model-specific information exposed an overly strict manufacturer-discovery requirement for the word Logitech. |
| G435 model with no photo brand, updated code | Validates the manufacturer model and canonical page without changing the photo brand. Extracts weight, battery, connections and box contents from the primary published record. Recommendation facts and variant-only properties are excluded; conflicting explicit brands are rejected. |
| Logitech G PRO live source, updated code | Retrieves source overview, driver, noise-isolation and surround fields from [the primary manufacturer page](https://www.logitechg.com/en-sg/shop/p/pro-gaming-headset). Fixes an empty display description overriding the primary SEO overview. |
| Ask FindIt relevance | Regression asks about Bluetooth, weight and battery with relevant facts beyond the first eight fields. Those facts are now prioritized. Battery-life questions no longer imply a question about included batteries. Package and unsupported-device checks remain. |

## Validation

- 539 local Node tests passed, zero failures, before the follow-up release. Syntax and diff checks passed.
- PR #342: regression, Full Production Audit, Release Smoke and Interaction Freeze all passed.
- Production #342: deployment, Node regression, smoke and Full Production Audit passed when inspected. Dashboard Commerce failed two assertions (G PRO purpose and useful pros); this failure motivated the primary-SEO and attributed-feature follow-up. It is not waived or hidden.
- Uncommon Commerce continued failing because it retrieved no verified exact tuner listing. A direct Marshall Music response was a verification challenge. Direct probing was stopped; no bypass was attempted and the test expectation was not relaxed.
- Browser test: manually applied public Menlyn coordinates `-25.7821, 28.2752`, with the selection correctly disclosed as visit-local. Premium Beta was activated in the QA browser only; the UI explicitly says free and real payments disabled.

## Remaining verification and blockers

1. Exact retailer discovery still has coverage gaps. A manufacturer fact page is not a priced seller; an abbreviated retailer title does not verify an unprinted/missing scent, size or colourway. No substitute offers are promoted to exact matches.
2. No public source checked here established exact live branch inventory or branch prices for the tested products. The shopping planner, deals and price ranking must not invent these inputs.
3. Marshall Music's verification challenge prevents completing the exact tuner-source check through this environment. The failing check remains visible.
4. Physical Samsung camera/gallery capture, actual GPS accuracy and notification receipt require physical-device testing. A desktop browser or phone-width automation is not hardware evidence.
5. Saved items, settings and history are device-local. Cross-device storage sync is not implemented or claimed. Independent AI readings remain nondeterministic; cached images do not establish globally identical independent results.
6. The existing draft PR #337 investigation of intermittent partial guidance remains open; it is not silently closed by unrelated passing tests.

## Post-deployment retest

Pending the follow-up's GitHub checks and Cloudflare deployment. Record exact deployed commit and actual UI results here before a quality sign-off.
