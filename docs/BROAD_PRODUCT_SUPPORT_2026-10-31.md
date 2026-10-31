# Broad product support and specific identification

The new live baseline uses 16 previously untested queries: gym machine, car, mouse, mouse pad, keyboard, headphones, two medical devices, appliance, printer, garden equipment, pet food, lighting, calculator, backpack and camera. It is a typed-search baseline, not a photo-identification claim. The original numeric metric reported 1/16, but that camera result included a cage and lens kit beside a body listing. Consequently there are zero complete valid shopping passes in this baseline. Manufacturer information without a usable price is not a complete commerce pass. Evidence: `launch-evidence-2026-10-31/broad-before.json`.

## Shared repairs

- Independently agreeing brand/model claims no longer lose specificity solely because one reader says gaming mouse and another says computer mouse. The object vocabulary now covers peripherals, cameras versus lenses/cages, rowing machines, treadmills, exercise bikes, medical-device types, printers, appliances and vehicles. Conflicting models/brands remain unconfirmed. Corroborated size and colour are retained in confirmed titles without duplication. Photo prompts explicitly request readable model/generation/style codes; hidden codes and medical strengths are not inferred.
- Generic typed queries, including brand plus type, no longer claim an exact product. They enter the existing model-confirmation flow. Model-coded queries remain unchanged.
- A shared specialist decision now drives medical, fitness and whole-vehicle commerce/nearby routing. Medical monitors go to medical-supply shops and pharmacies rather than computer retailers; gym machines go to sports-equipment retailers rather than general shops; whole cars go to car sellers rather than parts/repair shops. Pharmacy amenities and official Clicks locations are included. These remain relevant retailers, never proof of branch stock.
- Keyboard, mouse, mouse pad, printer and appliance names now reach electronics catalogues instead of falling through to unrelated general sources. Fitness Network's published GET `/search?q=` form and MiFitness's published Shopify search are used for gym equipment. Existing medical retailer adapters are reused.
- Exact alphanumeric identifiers tolerate spacing within the same full token (EX42 versus EX 42) and recognized object synonyms, while adjacent codes EX420 and unrelated brands remain rejected.
- Shorter catalogue queries are retrieval only, within a shared request deadline. The original model, colour, size and quantity still verify each candidate. Search/category pages and wrong variants do not become offers.
- Camera-body searches reject compatible cages and unrequested lens packages. Mouse searches reject pads and keyboard searches reject keycap/cover accessories. These checks are general type constraints, not product-specific URLs.
- Commerce/research fallback namespaces and the photo-cache version are rotated so earlier generic identities or incompatible accessory results are not reused.

The OpenStreetMap category decisions follow its published shop=sports, shop=medical_supply and amenity=pharmacy documentation. No private retailer API, credentials, paid service, CAPTCHA bypass or fabricated price is introduced.

Local validation: 616 Node tests and syntax/diff checks pass. The broader matrix now checks accessory/type conflicts as well as positive prices and attributed research. Production rollout, new photo uploads and the same broader matrix must still be verified separately. This is not a promise that every product/photo or every branch's inventory is covered.


Hosted browser diagnostics exposed the earlier intermittent feature-suggestion failure: the 50 ms initial-focus timer could move focus back to the title during rapid details entry. The logged title contained both fields while the required details field was empty. Focus the initial field synchronously instead, and add a deterministic regression that moves focus immediately after opening and verifies it stays in the chosen field. Delivery success assertions remain unchanged; no real feedback is sent by this mocked test.

The live broad matrix exposed Large mouse pad searches accepting XXL listings. A shared named-size comparison now rejects conflicting Small/Medium/Large/XL/XXL/XXXL sizes, including the single-letter pad labels, while preserving Large/L equivalence. This is a verification constraint, not a relaxed discovery score.

## Deployed verification of PR 349

Production `/api/version` and both live matrices reported commit `1743f167f2f419ded61c9ad638311137e14a2405` throughout. All four pre-merge hosted suites passed; 616 Node tests passed. The unfamiliar matrix improved to 3/16 complete journeys (mouse, mouse pad, camera); gym information and several listings were found but some prices were missing and a ten-machine pack contaminated the offers. The established matrix returned 4/10 complete journeys; the clothing case failed the strict metric because a newly found Superbalist listing had no published price alongside priced Levi's listings. Empty or incomplete journeys remain failures. Compact evidence: `launch-evidence-2026-10-31/broad-deployed-349.json`.

The pack contamination is addressed by a shared purchase-count guard: unrequested multi-unit packs/sets/cases cannot pass as a single product. Explicit equivalent pack quantities remain accepted. Validation after this guard: 629 Node tests, syntax and diff checks pass. Rollout of this follow-up is tracked separately.

Fresh public-photo UI observations on the previous version: Logitech mouse yielded unconfirmed G502 candidates with sourced facts and prices; Toyota Hilux was named without an invented trim/year; a photo of multiple upright rowing machines remained generic. On the deployed version a Clicks blood-pressure-monitor photo failed at the image service. These are not exact-photo passes or proof that every category is covered. Physical-device GPS/notifications and cross-device sync remain unverified or unimplemented as previously recorded. Full product coverage is unfinished.

Live specialist-nearby checks at a public Pretoria centroid returned 12 medical retailers with no branch-stock claim. Gym and car map sources were unavailable, not proof that no shops exist. Fitness now reuses the existing official Sportsmans Warehouse locator as a fallback, supported by its published home-cardio catalogue (rowers, exercise bikes and treadmills). A regression verifies contact details and location survive map-provider failure without claiming exact-product stock. Car-locator coverage remains incomplete.

The medical-photo diagnostic follow-up showed two conflicting readings: Gemini read Clicks blood-pressure monitor; Gemma misread the brand and device. A fallback returned HTTP 402 credits. No identity was promoted from the conflict. The deployed mouse upload retained Logitech mouse with G502 candidates and source-backed information, pending model confirmation.

A direct reproducer showed typed WH-1000XM5 failed against WH1000XM5 and FX-82ZA failed against FX82ZA. Exact technical-code segments now tolerate punctuation/spacing in either direction; different digits, suffixes, colours and generations remain rejected. This removes a general formatting barrier without changing model identity.

## Verification after PR 350

Production commit `6c80d4817aa390cff361eeb453c29e29c7a7daa5` remained stable across a fresh 16-product live matrix: still 3/16 complete journeys. The rowing-machine results no longer include the ten-machine pack; unpriced source pages mean the strict complete-commerce criterion still fails. Exact code-formatting regressions pass, but the live Sony/calculator discovery gaps persist. 629 Node tests and all four pre-merge hosted suites passed. The deployed gym nearby result still had no upstream data.

A fresh download of the official Sportsmans Warehouse locator parsed 52 published branches; the nearest three to the public test centroid are about 6.0, 8.1 and 9.2 km away. The worker could not fetch that source during the live test. Add a deployment-refreshed dated fallback of those published locations. It expires after 14 days, rejects future/malformed provenance, and deliberately excludes opening hours, open-now status, prices and inventory. This preserves verified published location/contact data during a source outage without presenting it as live branch stock. The build refresh retains the original publication date if a refresh fails. Validation: 636 Node tests and syntax/diff checks pass. The final deployed fallback still requires verification.

A repeated deployed vehicle upload returned only Toyota car, showing inconsistent model recognition across repeated reads. The earlier Hilux result must not be counted as a stable exact-photo pass. Free image-provider disagreement and credit-limited fallback, incomplete car-locator coverage, and the 13/16 incomplete commerce journeys remain release limitations.

The actual vehicle UI also exposed a Ford manufacturer link in every car search, including Toyota. Remove that unrelated manufacturer from shared vehicle defaults; brand-neutral vehicle marketplaces remain candidates, while an actually discovered manufacturer page still requires identity verification.
