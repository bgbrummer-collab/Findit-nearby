# FindIt repair and acceptance tracker — 2 November 2026

**NOT launch-ready.** Baseline: main `0931b2b2b568acf38f6c63d327ff4ca4a4953fe3`, confirmed by production `/api/version`. No redesign, rebuild, paid integration or secret change.

## Architecture and audit

The original static dashboard loads multiple existing runtime layers. Cloudflare serves root assets from `cloudflare-public` and handles search, commerce, research, assistant and nearby APIs. Photo identification reconciles independent readers, including the existing Vercel Gemini bridge and Workers AI. Commerce discovers candidates through public retailer catalogues/search and verifies individual pages using the shared intelligence core. Product Info extracts attributed source text; Ask FindIt consumes this research. Browser fallback caches and device-local saved/history/settings remain separate from server data. Deployment is GitHub Actions plus Wrangler with a stamped frontend build and Worker BUILD_COMMIT.

Reviewed October 17/18 launch checklists, October 31 feature/category/retailer reports, current workflows, latest five commits, open PR inventory and production UI. PR #308 is already merged. PR #353 remains open; its photo-schema/pet/fitness changes are not on baseline main. Do not recreate them or count them as deployed. Older open probe PRs are not production evidence. Latest main deploy and sampled workflows succeeded; this does not certify product data quality.

## Confirmed issue tracker

| ID | Priority | Root cause / observed problem | Focused repair | Acceptance evidence required | State |
|---|---|---|---|---|---|
| EXACT-01 | P0 | Subset identity matching accepted R50 V for an R50 query; Product Info borrowed the used V listing's condition/contents | Reject differing camera generation/video suffixes in shared identity and variant gates | Failing regression, real production search, no V offer or source facts, genuine R50 listings retained | Verified on production 77da27c |
| PHOTO-01 | P0 | Real original shoe upload yields Nike shoes, no confirmed model/price; prior reports record conflicting model readers | Diagnose provider claims and review existing PR353 before further changes; retain uncertainty | New photographs through customer UI, repeatability and exact variant/page evidence | Unresolved |
| DATA-01 | P0 | Broad live catalogue coverage remains poor | Investigate failed categories without relaxing exactness | Stable production matrix and independent listing review | Unresolved |
| INFO-01 | P1 | Keyword classification promoted slogans to strengths and social connection wording to compatibility | Filter advertising calls/slogans; require technical connection context | Failing regression plus Sony production Product Info and Ask FindIt | Verified on production 77da27c |
| CACHE-01 | P1 | Browser fallback data could retain previously misclassified facts/offers after server repair | Rotate only research/commerce fallback namespaces | Regression suites and production reload | Deployed; fresh results verified |
| STOCK-01 | P1 | No authoritative SKU-by-branch inventory integration established | Keep branch stock unverified; integrate only a permitted authoritative source | Independent current branch inventory evidence | Integration unresolved |
| DEVICE-01 | P1 | Remote browser cannot prove physical Samsung camera/GPS/barcode hardware behavior | Test available browser paths; retain physical-device limitation | Actual physical device testing | NOT TESTED |
| REL-01 | P1 | Previous reports reproduce resource errors; current scoped tests are not load certification | Capture actual failures and traces before changing architecture | Production traces plus scoped reliability tests | Unresolved |
| TOOLS-01 | P2 | Complete populated tool/navigation/settings sweep outstanding | Exercise real customer actions | Latest production evidence for each action | In progress |

## Baseline real customer observations

- Actual Upload Photo chooser accepted original `tests/user-images/nike.jpg.b64`, then Identify & Find returned **Nike shoes, 65%, model confirmation required**, no price. Upload transport works; precise identification fails this journey. No typed identity was substituted.
- Actual typed Sony WH-1000XM5 Black returned FirstShop R8399 ZAR, online stock, explicitly unverified branch stock. Product Info repeated three advertising slogans and classified “connect with friends” as compatibility. This is a useful priced listing with failed information classification, not a full feature PASS.
- Actual Canon EOS R50 camera body search returned three Orms listings, including **USED R50 V**. Product Info used its condition/shutter-count/purchase-document text as the selected product's purpose. Wrong model source is a confirmed P0 failure.
- The 16-query API matrix held baseline version stable. Its original metric reported 4/16; independent review invalidates the camera result because of the wrong model. Therefore at most **3/16** baseline journeys meet that matrix's criteria. Colour alternatives in the mouse-pad query are not identical variants for cheapest-price comparison. Unpriced relevant pages remain incomplete commerce journeys. Raw baseline: `launch-evidence-2026-11-02/broad-before.json`.
- Baseline local tests: 637 passed. Added regression reproduced the slogans/compatibility failure; camera regressions reproduced the model failure. After local repairs, 645 tests pass. Local tests are not production acceptance.

## Acceptance matrix

Statuses below describe this session's current evidence, not inherited blanket passes.

| Feature | Status | Test performed | Evidence | Remaining problem |
|---|---|---|---|---|
| Photo identification | PARTIAL | Original shoe upload and real identify action | Browser, baseline main | Family only, exact model absent |
| Text search | PARTIAL | Sony and Canon actual UI; 16-query API matrix | Baseline raw JSON and UI | Wrong model and incomplete catalogue coverage |
| Barcode search | PARTIAL | Scanner manual entry 5449000000996 | Actual baseline UI: attributed Coca-Cola 330 ml | Camera detector unsupported; no exact retailer offer |
| Product information | PARTIAL | Sony and Canon dialogs before/after | Actual 77da27c UI and screenshots | Wrong-model facts/slogans removed; broad facts coverage incomplete |
| Ask FindIt | PASS | Asked barcode product size and nearby stock | Actual baseline response cites Open Food Facts, 330 ml, stock unknown | Scoped question only; broad coverage incomplete |
| Retailer matching | PARTIAL | R50 actual UI before/after | 77da27c: two R50 listings; no R50 V | Broad coverage incomplete |
| Prices and currency | PARTIAL | Sony R8399 ZAR | Actual UI and raw matrix | Broader variant coverage |
| Stock information | PARTIAL | Sony online/branch distinction | Actual UI | Authoritative branch feeds absent |
| Nearby stores | FAIL | Sony photo family + public Pretoria coordinates | Actual 77da27c UI | No relevant nearby stores returned |
| Maps | PARTIAL | Entered public Pretoria point and opened map | 77da27c: Leaflet present, 8/8 tiles loaded | No retailer pins because nearby results empty |
| Saved items | PASS | Saved Coca-Cola, reload, Saved, Open product | Actual baseline UI refresh completed | Device-local scoped journey |
| Search history | PARTIAL | Sony/shoe/Canon shown in recent history | Actual UI | Reopen/reload pending |
| Mobile functionality | FAIL | Hosted 390px photo variant review | Interaction run 41441652892 | Product Info intercepted; investigation below; physical device untested |
| Desktop functionality | PARTIAL | Upload/search/dialogs used | Actual UI | Complete tool sweep |
| Deployment | PASS | Frontend meta and API both 77da27c; deployment success | Run 41441654694 | Deployment PASS does not imply launch readiness |

No all-product reliability, physical device parity or public launch acceptance is claimed.

## Production verification of PR354

All four pre-merge hosted suites passed for source dd8c235685acbb023c2c2f566342a225617d31b7. PR354 merged as **77da27cdcb04daa3f42a17b8b3f7755809dda1e6**. Actual browser meta and API version both matched.

- Canon UI now retains two genuine R50 listings, excludes R50 V and its condition/shutter-count/purchase-document description. Product Info uses R50 source facts instead. Before/after screenshots are retained in the evidence folder. This specific repair is production verified.
- Sony UI retains FirstShop R8399 ZAR and concrete source-backed microphone/noise-control claims, with the three slogans and social-connection compatibility removed. Opened FirstShop's actual product page independently: same black model, R8399 and Available Now. This is online evidence, never branch inventory.
- Downloaded FirstShop's actual Sony product photo and uploaded through Upload Photo and Identify & Find without entering its model. Result: **Sony headphones, 65%, model unconfirmed**, no best price. Prior typed price cleared. Exact-photo capability remains incomplete; the filename/source URL is not identity evidence.
- Stable post-deployment 16-query API matrix: **4/16** priced-offer-plus-research journeys. Camera now genuinely meets that metric with two R50 listings; 12 incomplete journeys remain. Different mouse-pad colours and camera colours remain separate variants; this metric is not identical-variant cheapest-price certification. Raw response: broad-after-77da27c.json.
- Manual public test point -25.7479,28.2293 accepted. Map loaded 8/8 tiles, but Sony-family nearby search returned no stores. No retailer-pin/physical-stock pass claimed.
- Radius 5 km persisted after reload; restored to10 km. Coca-Cola barcode catalogue, saved reload/reopen and scoped assistant answer worked in actual baseline UI. Rechecked frontend after rollout as noted above.

### Failed hosted mobile interaction and follow-up

Production workflows: deploy, regression, photo probe, full audit, final audit, dashboard commerce, production smoke, release smoke, smoke checks and Pages succeeded. **Interaction Freeze Regression failed locally** before its deployed stage, at tests/product-information-user-regression.mjs:63 on the390px photo-variant case. Product Info click was intercepted first by a Nearby article, then a Nearby Stores modal. This failure is retained; no assertion was weakened. Scoped rerun requested.

Investigation found upload-search-stability.js schedules viewport scrolling at two animation frames,120ms and420ms even after Identify has started. A failing deterministic regression demonstrates three stale scrolls after search starts. Invalidate those callbacks on the actual search click, retaining initial photo-selection assistance and rotating the dynamically loaded script URL. This is a confirmed scrolling fault; its causal role in the intermittent hosted click needs the final browser checks. Do not claim the original mobile failure fully resolved from a single passing rerun. Local suite after this follow-up:647 tests pass.

Photo provider disagreements, incomplete retailer adapters/source access, authoritative branch inventory, physical Samsung camera/GPS/barcode capture and exhaustive customer acceptance remain outstanding. No new paid service or credential is requested or activated. PR353 remains separate and unmerged; its changes have not been duplicated.


## Final catalogue/quantity acceptance checkpoint

PR353 source9e64feb passed all four hosted suites and merged as7cb393d0e4122554e6523be31bc0c7368fa7d329. Both Cloudflare's actual browser build and API version match, and the Git-linked Vercel deployment reports success. The adult/puppy fault was caught in staged real-source testing and repaired before merge. The stable deployed sixteen-query matrix now yields **5/16** priced-offer-plus-research journeys, including Petworld's actual Adult2kg listing atR370ZAR. No puppy listing is accepted. Eleven categories remain incomplete. This is typed/API evidence, not five photo passes.

The final original conditioner chooser/upload journey automatically identifies its full Marc Anthony Strictly Curls3X Moisture Triple Blend range at85%, supplies source-backed care/ingredients and a Clicks250ml/R230 listing. However, its identity has **no confirmed volume**. That listing must not supply an exact photographed-variant best price. Extend the existing photo variant-review gate to published bottle/pack quantities for beauty, household, pet and medical packaged products. Keep model listings and prices reviewable, preserve confirmed-size/barcode/typed paths, and rotate only the offer-fallback namespace. Five new tests first failed then pass, including full commerce classification;667Node tests pass. Hosted/source and actual final production verification remain pending for this quantity guard. This photo is a model/range success, not a confirmed-size photo-to-offer pass.

The final catalogue matrix is retained as broad-after-7cb393d.json. The uncommon-commerce workflow remains failed; inspect its log rather than treating other green suites as full shopping acceptance. No source restriction has been bypassed. Physical-device/GPS/camera, branch-stock integration and comprehensive data coverage remain unsigned.
