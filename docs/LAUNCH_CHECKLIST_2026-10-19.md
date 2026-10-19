# FindIt Nearby — customer audit checkpoint, 19 October 2026

## Later 19 October continuation — work remains active

This section supersedes the earlier release/outcome statements below. Current verified frontend/backend code is `b6ad41a16178f06a074217e8c918063d6cbc5be0`;336 local Node checks pass. Full repair history and raw browser/source evidence: [continued evidence](launch-evidence-2026-10-19/README.md).

The original cream photo now reaches a source-backed Anthisan Cream25g candidate without a typed name. After reviewing its visible label/size and the actual Dis-Chem page, the explicit confirmation button reaches the exact R76.99 ZAR offer. Compare preserves the published cash-only SEP/dispensing-fee caveat. Retailer barcode is source data; unseen strength/formula/barcode/colour/pack-count details are not photo-confirmed.12 relevant pharmacy branches, real contact/hours and Maps destination are verified in scoped tests; SKU-by-branch inventory remains unverified. The original headset still lacks reliable exact identification; latest actual-browser repeat is ongoing.

Additional repairs include retailer duplicate-link discovery, scoped product attributes/price caveats, header labels, saved-photo refresh, reviewed brand confirmation, category routing, synchronized branch hours/timezone, zero-distance nearest answers, generic model-hypothesis restrictions, actual Open Now filtering, persistent A–Z/closest sorting, full verified product-content research and manufacturer/consumer-brand label preservation. The Korg retest now shows11 attributed specifications and published compatibility/strengths.

Current copied control/state inventory:272 observed entries,43passed,2failed,6blocked,221untested. This remains an incomplete inventory, not272 unique controls or an exhaustive application pass. Current new failure: shopping subtotals/watch observations omit the dispensing-fee caveat. That repair and a stale-hours replacement-photo investigation are unfinished. Further photo/provider reliability, four typed categories without priced listings, identical-variant multi-retailer comparisons, device/accessibility/load/CPU tests and the remaining inventory are still open. No launch-ready claim. Supabase remains paused, payments/billing disabled.

The earlier checkpoint below is retained as historical evidence.

**NOT launch-ready. The exhaustive application audit is unfinished.** Continue from the latest remote main; do not discard historical failed runs or equate CI success with customer success.

## Production release

- Live: https://findit-nearby.bgbrummer.workers.dev/
- Deployed code: `254e998f7e3f0f907db1c776fa7783e68c09d1dd`.
- Actual browser `meta[name="findit-build"]` and Worker `/api/version` matched this commit. All nine workflow runs returned for this release completed successfully; see `launch-evidence-2026-10-18-customer/workflows-final.json`.
- 312 local Node checks passed, zero failed; syntax and diff checks passed. No test weakened. Final matrices used the same code before/after.
- This documentation checkpoint uses `[skip ci]`; it should not replace the deployed code identifier above. Preserve intervening bot evidence commits.

## Original attachments: actual final customer journeys

Both files were accessible, visually inspected, uploaded using the website's actual chooser, then Identify & Find was clicked. No product name was typed to rescue either photo.

| Attachment | Actual result on final release | Outcome |
|---|---|---|
| `images (4)(3).jpg` | Logitech headphones, 65%; Logitech G Pro X only a possibility. Exact model/variant/size/pack/barcode not confirmed. Visually black with boom mic and G logo; the app did not reliably retain every visible feature. | Failed complete shopping outcome: no verified exact price or nearby retailer location; Compare explicitly empty. Ask and Premium AI did not invent an exact model, price or PS5 compatibility. |
| `WhatsApp Image 2026-08-09 at 17.56.07.jpeg` | Sanofi topical cream, 65%, size25g; Anthisan Cream25g explicitly unconfirmed printed label. No strength, formula, barcode or product colour assigned from unseen details/purple packaging. | Failed complete shopping outcome: no exact priced offer. Saving/reloading/reopening retains uncertainty and now restores both product panels correctly. |

Raw UI snapshots: `cream-254e998-browser.txt`, `headset-254e998-browser.txt`, both `*-compare-254e998-browser.txt`, `saved-reopen-254e998-browser.txt`, `headset-ask-254e998-browser.txt`, `headset-premium-ai-254e998-browser.txt` in the evidence directory. Earlier variable/failed identifications are retained separately.

## Repairs published through this continuation

1. Replacement photos invalidate pending identity/research immediately; stale confidence/offers cannot survive a new-photo generation.
2. Partial Product Info keeps manufacturer/brand disagreements, missing model/variant facts and complete printed-label hypotheses explicitly uncertain. Topical cream packaging colour is not claimed as product colour. Brand-only identity retains possible label evidence.
3. Recent history, History+, saved and collection snapshots preserve original identity evidence. Reopen does not promote a photo guess into a confirmed typed search. Older saved names without evidence also reopen unverified.
4. All discovered legacy Premium and quick-save handlers retain identity. Saved Search again stays in FindIt. Smart Choice updates preserve existing quick-action nodes and handlers.
5. Final reproduced saved-reopen mismatch fixed: central strip formerly said No item selected while the right panel showed cream. Both now show the restored product; production quick-save → reload → Saved → Open product verified. Regression asserts restored name/meta and no typed `/api/search` bypass.
6. Verified source product-description tables yield bounded, deduplicated specifications with original units; footer tables excluded. Separate final typed Bosch GSB18V-50 journey displayed15 attributed specs and a TMB kit listing, R4999 ZAR, online in-stock and branch stock unverified. Clicked source opens the actual matching drill + two2Ah batteries + charger page. The retailer localizes this browser to GBP despite ZA selector; this external display discrepancy is recorded, not hidden.
7. Copying a suggestion now reports successful clipboard copy without falsely claiming delivery service unavailable. Exact draft/consent/validation/back behavior inspected; no duplicate feedback sent.

See evidence README for release-by-release commits and reproduction details.

## Current test results and scope

- Final real-photo API sweep:8 uploads HTTP200;7 partial identities,1 uncertain,0 exact offers. Clothing returned no identity, so no commerce/research request was made for that row. Remaining7 completed both stages HTTP200. This is API evidence separate from the two original actual-browser journeys.
- Final separate typed sweep:30/30 stages HTTP200;6/10 verified priced listings. Groceries,shoes,furniture,household had none. Typed success does not prove photo success.
- No1102 observed in these bounded sweeps. Broad load, production CPU traces and recurrence analysis remain untested.
- `control-inventory.csv`:272 observed control/state entries,41 passed,2 failed,6 blocked,223 untested. These are not272 unique visible controls. Inventory/discovery and usefulness testing are incomplete; the README feature table provides broader failed customer outcomes independently of individual button statuses.

| Status | Explicit scope |
|---|---|
| Passed | Scoped file chooser/replacement/invalid/oversized recovery, manual barcode validation/catalogue, saved/history uncertainty persistence, collections, shopping/watchlist missing-price handling, source specs, suggestion copy, settings persistence, final Premium AI/Exact/Manual routing, device stats and25km persistence. See README and raw evidence for version/scenario limits. |
| Failed | Exact photo-to-shopping journeys, complete OCR/model/variant coverage,4/10 typed catalogue results, broad retailer/nearby discovery and meaningful identical-variant multi-retailer comparison. |
| Blocked | Remote camera barcode detector unsupported; no authorized SKU-by-branch inventory feed; no durable background scheduler/storage/notification delivery; no central analytics integration. Existing unavailable HF credits must not be funded. Supabase remains paused. |
| Untested | Remaining223 control/state entries plus dynamic discovery, physical phone camera/GPS and OS drag/drop, populated filters/deals/multi-retailer comparisons, all-device/zoom/long-text layouts, full keyboard/screen-reader/contrast accessibility, concurrency/load/CPU traces and remaining uncommon paths. |

## Precise continuation instructions

1. Fetch main and inspect newer commits/deployment runs before changes. Local commits have different SHAs from connector-created commits but matching code trees. Do not reset or merge duplicate histories blindly. Publish through expected-parent GitHub tree/commit/ref updates; shell push lacks credentials.
2. Start with final photo diagnostics and catalogue discovery failures. Improve independent label/model extraction and permitted real retailer discovery without hard-coded product success, filename hints, invented data, or relaxed exact-match safeguards. The cream's known public retailer pages were not returned by FindIt's photo journey and must not be counted as success.
3. Add permitted reliable nearby sources beyond current scoped Clicks/Sportsmans support. Independently verify schedules/contact details and SKU-by-branch stock. Do not call a locator an inventory feed.
4. Continue the remaining inventory entries with actual meaningful behavior and persistence tests. Record new dynamic controls, failures and blocked paths; do not blanket-mark passed from panel opening or CI.
5. Retest both exact attachments through the actual browser on each final deployed code; separately repeat varied photo and typed sweeps. Verify frontend/backend versions and real source variants/currencies. Commit raw evidence and conclusions.
6. Configure any genuinely required credentials only in existing hosting secret settings, never chat. Do not enable payments/billing/paid services or reactivate Supabase. No purchase or external communication beyond user authorization.

Repository-backed working directory: `/workspace/scratch/82322af24170/Findit-nearby`. Original photos remain outside the repository; evidence records their paths without committing the images. No work continues in the background after a final response.
