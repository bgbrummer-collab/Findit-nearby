# FindIt Nearby — acceptance report, 2 November 2026

**Decision: NOT READY FOR PUBLIC LAUNCH.**

Original repository retained. No redesign, feature removal, paid service, credential exposure or billing change. Final deployed code: d219c95889332543b578a1b2bfa028c8a207c5e9. This report is an evidence record; green tests do not establish complete product coverage.

## Repairs completed in this session

- Shared identity and variant gates reject R50 V and later camera generations for a base-model query. Actual Canon UI changed from three listings including a wrong used R50 V to two genuine R50 listings; borrowed condition/shutter-count/purchase-document facts disappeared.
- Product Info discards the reproduced Sony advertising slogans and social-connection compatibility text while retaining concrete, attributed microphone/noise-control claims. FirstShop's actual black WH1000XM5/BME page independently confirmed R8399.
- Stale upload-assistance scrolling is cancelled after Identify starts. A deterministic regression first reproduced three stale scrolls; the source and full production interaction suites subsequently passed. The earlier intercepted mobile click remains recorded, rather than erased by a retry.
- Reviewed and reconciled existing PR #353 with current repairs. Preserved readable model/size/colour/barcode schema fields and bounded specialist catalogue retrieval. Caught adult food matching a puppy listing during staging; primary-name life-stage rejection shipped before that expansion. Production and independent Petworld UI now verify Adult 2 kg / R370, with no puppy substitution.
- Purchase quantities on photographed packaged products require confirmation before a listing supplies exact price or stock. A retailer's 250ml listing cannot establish an unread photo volume. Its listing remains reviewable; typed, supported-size and exact-code/barcode paths remain. Ask FindIt distinguishes unread photo quantity from published retailer quantity. Verified in the actual final production UI: original chooser/upload retained the full range at 85%, best price remained unverified, and Product Info displayed the Clicks 250 ml / R230 page under Model listings — confirm your variant. Opening Check this variant did not submit it; deliberately confirming the prefilled 250 ml name through Find product information restored R230 with unknown branch stock. This separate explicit-confirmation journey is not automatic exact photo identification.

## Customer acceptance

The report is saved on an evidence branch based on the final code; main remains the verified code deployment. PASS entries are scoped to the stated test, not every device/product or every possible operation.

| Feature | Status | Test performed | Evidence | Remaining problem |
|---|---|---|---|---|
| Photo identification | PARTIAL | Original Nike and conditioner uploads; fresh Sony retailer photo, normal chooser and Identify | Actual production UI; conditioner full range at 85%, Sony/Nike family at 65% | Models/variants remain inconsistent; unknown bottle volume requires review |
| Text search | PARTIAL | Actual Sony/Canon UI, stable sixteen-query API matrix | broad-after-7cb393d.json:5/16 coarse metric | Eleven metric failures plus incomplete useful pet information |
| Barcode search | PARTIAL | Manual scanner 5449000000996; incorrect check digit 5449000000997 | Actual UI: attributed Coca-Cola 330 ml; invalid code rejected | Camera detector unsupported here; no verified catalogue-product retailer offer |
| Product information | PARTIAL | Actual Sony, Canon and conditioner dialogs before/after | Source links, preserved care/ingredients, before/after screenshots | Missing or incomplete exact research in multiple categories |
| Ask FindIt | PARTIAL | Asked current barcode size/nearby stock; photographed bottle quantity/price | Actual attributed 330 ml answer and unknown-stock distinction; final d219c95 answer explicitly says the photo does not confirm purchase size/pack quantity and no exact price is verified, before citing the separate retailer facts | Product research coverage still limits answers |
| Retailer matching | PARTIAL | R50/V and adult/puppy negative cases; real positive listings | Actual R50 UI; Petworld selected Adult 2 kg at R370 | Eleven matrix journeys incomplete; Korg discovery fails |
| Prices and currency | PARTIAL | Actual Sony R8399 and Petworld R370 pages; source offers in ZAR | Browser and matrix evidence | Alternatives differ in colour/condition/quantity; no universal cheapest-item pass |
| Stock information | PARTIAL | Online versus branch labels checked | Actual UI distinguishes online status from unknown branch stock | No authoritative SKU-by-branch inventory integration |
| Nearby stores | FAIL | Sony family at public Pretoria point -25.7479, 28.2293 | Actual UI returned no relevant stores | Category/provider coverage unreliable |
| Maps | PARTIAL | Manual public coordinates and map open | Leaflet loaded 8/8 tiles | No retailer pins in that empty nearby journey; physical navigation untested |
| Saved items | PASS | Save Coca-Cola, reload, Saved, Open product | Actual UI retained item and completed fresh research | Device-local scoped journey; no cross-device sync |
| Search history | PASS | Reopen typed Sony after reload on 46eda4d | Actual UI refreshed current sourced information | Exhaustive History+ actions not certified |
| Mobile functionality | PARTIAL | Hosted 390 px photo/review/tool checks | Source and deployed interaction suites; final result below | Physical Samsung camera/gallery/GPS/barcode capture untested; real data coverage incomplete |
| Desktop functionality | PARTIAL | Upload/search/info/assistant/history/save/settings/shopping plan | Actual browser and hosted 1440 px checks | Complete populated tool sweep not finished |
| Deployment | PASS | Frontend build meta, API version, Cloudflare workflow and Vercel status | Frontend meta and API both d219c95; Cloudflare deployment and Vercel status succeeded | Deployment success does not imply customer acceptance |

Additional actual checks: invalid text-file upload rejected while the existing Sony result/price remained; radius 5 km persisted after reload and was restored to 10 km; shopping list displayed Sony R8399 as an online-only plan and refused to invent a driving trip.

## Latest broad data matrix

Stable production code 7cb393d at start and finish. Five cases meet the coarse priced-offer-plus-any-sourced-field API metric: Logitech G502 HERO, SteelSeries QcK Heavy Large, Sony WH-1000XM5 black, Royal Canin Mini Adult 2 kg, Canon EOS R50 body. Mouse-pad/camera colours remain different variants, so these passes do not prove an identical-variant price comparison. The quantity follow-up changes photo classification; it does not change these typed requests.

Incomplete cases: Concept2 RowErg, Toyota Corolla Cross 1.8 Xi, Keychron K2 keyboard, Omron M2 Basic, Accu-Chek Instant meter, Philips NA230/00 air fryer, HP DeskJet 2820 printer, Gardena pruning shears, Philips Hue E27 bulb, Casio fx-82ZA Plus II, JanSport SuperBreak Plus. RowErg has relevant source pages but incomplete price evidence. Empty offers are failed retrieval examples, not proof the products are unavailable.

The final actual pet-food UI retained the correct Adult 2 kg / R370 offer but provided only an attributed retailer SKU and general guidance, without a verified useful product description. Therefore **the 5/16 API metric is not five complete useful customer journeys**; pet Product Info remains incomplete. Do not treat researched:true alone as acceptance.

The original baseline metric reported 4/16, but independently inspecting its camera case exposed the wrong R50 V, so at most 3/16 baseline cases met that metric. The intermediate repaired matrix was 4/16; the specialist expansion achieved 5/16. No combined count across releases is used.

## Validation and release state

- Final local suite: 668 passed, 0 failed; syntax and diff checks passed. New defects were first captured by failing regressions.
- PR #354 source checks passed; camera/fact repair production 77da27c verified in actual UI.
- PR #355 source and full deployed interaction checks passed on 46eda4d. This is scoped evidence for viewport ownership and the existing tested paths, not a universal mobile guarantee.
- Amended PR #353 source checks passed on 9e64feb; production 7cb393d matched Cloudflare browser/API and Vercel status. Its stable matrix is retained.
- All ten triggered workflows on final d219c95889332543b578a1b2bfa028c8a207c5e9 completed successfully, including deployment, Node regression, full/final audits, dashboard commerce, production/release smoke, interaction freeze and Pages. Snapshot: launch-evidence-2026-11-02/final-release.json. The separate Korg coverage failure below remains unresolved.
- The uncommon-commerce check fails with no verified exact Korg Pitchclip 2 page. Latest recorded run 41443879329 failed after native discovery returned an empty list. Its assertion was not removed or relaxed. Historical retailer verification restrictions were not bypassed.

Final actual customer text search on d219c95 also retained Adult 2 kg / R370 with unknown branch stock and no puppy substitution. Its missing useful product description is explicitly a remaining failure.

## Remaining work and actual limits

1. Improve photo model/variant consistency without converting guesses into exact identities. The available readers still disagree on ordinary photos; a generic unlabelled photo cannot honestly establish an exact model.
2. Extend and verify public catalogue adapters/source access for the eleven incomplete cases. This remains engineering/data-coverage work; the current integrations do not cover the expected shopping breadth. No new credential is claimed necessary for the existing Gemini/feedback bridges.
3. Obtain permitted authoritative SKU-by-branch inventory data for physical stock claims. Locator presence and online stock remain insufficient.
4. Perform physical Samsung camera/gallery/GPS/barcode testing, full responsive data parity, exhaustive populated tools, accessibility and reliability/load verification. Hosted simulated failures and responsive UI fixtures are not physical-device or load tests.
5. Durable background alerts, central analytics and cross-device synchronization remain unimplemented/unconfigured as recorded in prior audits. No new paid integration was activated.

Detailed chronology and root-cause tracker: LAUNCH_VERIFICATION_2026-11-02.md. Raw data and screenshots: launch-evidence-2026-11-02/. Work completed in this session does not constitute launch sign-off.

[Final quantity-review screenshot](launch-evidence-2026-11-02/final-quantity-review.jpg) · [Live-data matrix](launch-evidence-2026-11-02/broad-after-7cb393d.json) · [Final workflow snapshot](launch-evidence-2026-11-02/final-release.json)
