# Customer audit continuation, 18 October 2026

NOT launch-ready. This is a partial audit with committed engineering repairs, not an exhaustive certification.

Starting checkpoint: c275bcc. Read both October17/18 checklists and retained prior evidence. Published through the existing GitHub connection using expected-parent leases; shell git has no push credentials. No force push, billing, purchases, paid-service activation, secret disclosure or Supabase activation.

Final deployed code:254e998f7e3f0f907db1c776fa7783e68c09d1dd. Frontend meta and backend /api/version matched in the actual production browser/API. Final stable eight-photo and ten-typed sweeps use this commit. Nine workflows returned for this release all completed successfully.

Code releases in this continuation:
- be819a9: invalidate pending photo research immediately on replacement; clear stale confidence; truthful partial Product Info; reject cream packaging colours as product colours; preserve fully printed label hypotheses separately from exact identity.
- 7aecb87: explicit "not confirmed" model/variant wording. This repaired the interaction regression without weakening its uncertainty assertion. The be819a9 failed job is historical evidence, not a pass.
- 7d10947: persist full uncertain identity in recent history; refresh sidebar; History and History+ reopen partial photos without turning them into typed exact-product searches or reusing a different photo preview.
- 2014010: source-attributed technical tables scoped to a verified Product description, including Shopify product__description. Repeated rows deduplicated; footer tables excluded. Actual Bosch browser retest on d375cba shows voltage, torque, speed, chuck capacity, weight and drilling limits.
- d375cba: copying a suggestion no longer falsely claims the delivery service is unavailable. Actual clipboard and success copy verified, no duplicate message submitted.
- 154ff9d: retain printed hypotheses in brand-only disagreement, reconcile topical cream/container synonyms without treating ice cream as topical cream; expire previous cached identities.

Local checks:312 passing, zero failed. No tests weakened. The two new table tests check exact source units and reject a wrong footer specification. History regression asserts no /api/search request and retained requiresModelConfirmation on uncertain history reopen. Printed candidates remain confirmed:false and never become exact offers automatically.

- c18f839: saved/collection snapshots retain uncertain identity independently of recent history; the reopen API accepts the stored entry rather than promoting its name into a typed exact search.
- 3998cbc: older Premium/quick-save handlers preserve the same identity; legacy Saved Search again stays in-app; Smart Choice rerender preserves existing quick-action nodes and handlers.

- 931526f: older saved queries without identity evidence reopen unverified instead of becoming confirmed typed products.
- 254e998: reproduce saved reopen central strip “No item selected” mismatch; synchronize both panel identities and regression-check the restored name/meta. Actual final saved/reload/reopen now agrees.

## Original attachment ground truth and actual journeys

Both exact Library files were accessible and visually inspected. Neither filename was passed as a product-name hint. The website chooser was used and Identify & Find was clicked for both files; no product name was typed to bypass either photo result.

- images (4)(3).jpg: black over-ear headset with boom microphone and visible G logo. No legible exact model, size, pack quantity or barcode. Earlier browser run returned headphones only; subsequent browser run returned Logitech G headphones and explicitly possible Pro X hypotheses. All remained partial; no verified exact price. API uploads can differ because the browser resizes its submitted image. Preserve the separate raw API and browser records rather than combining their successes.
- WhatsApp Image 2026-08-09 at17.56.07.jpeg: readable Anthisan CREAM,25g,SANOFI; purple belongs to the tube. Earlier browser/API runs returned Sanofi cream tube,25g, with Anthisan only possible. A later d375cba browser repeat returned Sanofi product at brand-only50%, demonstrating real variability. Final repair preserves a fully printed candidate through this branch without claiming an exact identity. The actual strength/formula and barcode are not visible in this photo and must remain unconfirmed.

Browser source checks: a separate typed Bosch GSB18V-50 search returned TMB Supplies' explicitly titled drill+batteries+charger kit. Followed its View retailer page link and inspected exact title/included items/technical tables. FindIt displays online availability separately from unverified branch stock. Retailer currency script localized this cloud browser to GBP despite its South Africa selector; the API's underlying listing evidence remains ZAR. Do not claim the cloud browser displayed R4999 or certify a global currency conversion from this test.

A separate web-source lookup found Anthisan25g pages at Clicks and Dis-Chem. These were not discovered as verified matching offers by FindIt's photo journey. Their existence must not be counted as application success, nor may the unseen2% strength be assigned to the photo.

## Evidence scope

- production-photo-matrix.json: final stable-version real-image API sweep,8photos, with photo→commerce→research responses.6downloaded previous retailer/category fixtures plus2original attachments. A filename/source title is never supplied to the inference request. Raw files are kept separate by release; inspect versionStable and both versions.
- final-code-live-data-matrix.json: separate10typed-query API journeys. These never prove photo success.
- photo-inputs.json: source provenance and unavailable fixtures. Previous original shoe,beauty,household,music files were not in this workspace and have no recorded download URL; not retested here. They are not counted among the8photos.
- control-inventory.csv:265 observed control/state entries, including retained legacy/dynamic controls. This is not265 unique visible controls, and captures do not prove unseen dialogs were exhaustively inventoried.34passed,2failed,6blocked,223untested at inventory checkpoint; each pass is scoped to its evidence. Remaining all-control discovery/usefulness testing is explicitly unfinished.
- *-browser.txt: actual UI snapshots for uploads,product information,History/History+,settings persistence,collections,watchlist,barcode,instructions,suggestion validation/copy.
- local-tests.log:312Node checks; syntax/diff also checked.
- workflows-final.json: actual final release workflow conclusions, not inferred from deployment success.

## Feature outcomes retained for continuation

| Area | Status | Scope / outstanding work |
|---|---|---|
| File/gallery chooser;replacement/repeated uploads | Passed | Both original JPEGs through actual chooser; old exact offers cleared. |
| Invalid file and oversized image | Passed | TXT rejected;9MBJPEG rejected; valid photo recovery works. |
| Physical phone camera capture | Untested | No physical camera in this environment. |
| Actual OS drag/drop | Untested | CI/event tests do not establish physical drag/drop. |
| Exact photo identity and photo-to-priced-offer | Failed | Partial/inconsistent identity and no exact priced offers; see final sweep. |
| Label hypotheses | Passed | Scoped preservation and explicit uncertainty; does not imply correct automatic identification. |
| Product/pack/variant/barcode OCR | Failed | Broad exact coverage inadequate; original photo barcode absent; cannot guess size/model. |
| Text search | Failed | Only6/10typed queries previously yielded verified prices; inspect final sweep separately. |
| Manual barcode | Passed |123rejected;5449000000996→Coca-Cola330ml with Open Food Facts attribution. Separate from photos. |
| Camera barcode scanner | Blocked | Remote Chrome lacks BarcodeDetector; physical-device retest needed. |
| Product description and source specifications | Passed | Scoped typed Bosch source,table units,compatibility,included items; all-category coverage still failed. |
| Ask FindIt | Passed | Scoped cream question kept exact model/price uncertain; global quality not certified. |
| Premium Exact/AI/Manual | Passed | Final headset AI context stays uncertain; Exact opens confirmation. Separate Manual Bosch journey yields sourced specs. Does not certify all products. |
| Exact retailer matching / variant safeguards | Failed | Negative safeguards retained; discovery coverage inadequate. |
| Prices/currencies/product links | Passed | Scoped sourced typed listings/direct Bosch link; external localization noted above. |
| Multiple identical-variant comparisons | Untested | One populated Bosch listing is not a multi-retailer comparison. |
| Online vs branch availability | Passed | Actual Compare says online in-stock and branch stock not verified. |
| Branch inventory | Blocked | Needs authorized current SKU-by-branch inventory feed. |
| Manual location | Passed | Public Menlyn coordinates accepted; not user's private location. |
| Electronics nearby discovery | Failed | Menlyn sources unavailable; honest outage UI. |
| Other category/location reliability | Failed | Existing provider/source gaps remain. |
| Permission denied/error/success;GPS | Untested | Prior automated recovery retained; latest physical success not certified. |
| Radius/sort/auto-verification/settings reset | Passed | Actual5km,A–Z,Offpersist/reload; reset10km,Bestmatch,On. |
| Maps/directions/branch contact/hours | Untested | Prior scoped Clicks checks retained; no blanket latest certification. |
| History/History+ | Passed | Actual partial cream reopen retains uncertainty; filter works; history deletion/50-entry live capacity not exhaustively checked. |
| Sidebar recent history | Passed | Populates and survives reload. |
| Collections | Passed | New audit collection,headset,count1survive reload. |
| Saved items | Passed | Final cream quick-save/reload/Open product keeps25g,possible label and uncertain identity; both panels agree. |
| Favourite stores | Untested | Earlier scoped persistence retained; latest complete path not repeated. |
| Shopping list/trip plan | Passed | Cream persists;0retailers/priceunverified;no invented driving trip. Physical journey unavailable. |
| Watchlist/price history | Passed | Shared same cream,missing price not0,uncertain Checknowdoesnotclaimexactprice;all-item/target/drop scenarios incomplete. |
| Background alerts | Blocked | Needs durable scheduler,storage,notification delivery; current checks while site open only. |
| Deals | Untested | Empty or opened panel does not establish genuine useful deals. |
| Premium activation/payments | Passed | Free Beta activation,workspace tools; payments remain disabled. |
| Premium stats/radius | Passed | Final device counts agree;25km selected and persists reload. Populated distance/filter usefulness remains untested. |
| Populated filters | Untested | Empty result controls cannot establish usefulness. |
| Instructions | Passed | Actual instructions opened,read,closed. |
| Suggestion validation/copy/consent/back | Passed | Empty required fields;clipboard exact draft;diagnostics off;return to feedback. |
| Feedback/suggestion actual delivery | Untested | Prior confirmed Formspree delivery retained; not resubmitted this continuation. |
| Sharing/all copy variants | Untested | Only suggestion copy certified here. |
| Mobile/tablet/desktop | Untested | Responsive CI evidence retained; physical devices and all controls/layout combinations incomplete. |
| Keyboard/accessibility | Untested | Scoped modal checks/CI retained; full screen-reader,contrast,zoom,long-text audit incomplete. |
| Loading/stale requests | Passed | New photo immediately invalidates pendingresearch; tests cover late typed response and actual reset. Broader timing variations untested. |
| Worker1102/load/traces | Untested | Scoped matrices may show no recurrence; production CPU traces and broad load testing unavailable. |
| Central analytics | Blocked | Needs authorized central data/storage integration; do not reactivate Supabase. |
| Every button/menu/uncommon path | Untested | Inventory explicitly retains untested entries. |

## Next engineering actions

1. Fetch latest main before edits; preserve bot-generated docs commits. No reset or force push. This workspace retains published local commits with different SHAs from connector-created commits; compare file trees rather than blindly merging both histories.
2. Inspect final image diagnostics and improve independent label/model extraction without assigning product names from filenames or weakening gates. Retain manufacturer/consumer-brand disagreements and clearly separate possible product review from exact matching.
3. Fix allowed public catalogue discovery across groceries/shoes/furniture/household and the original cream; investigate why indexed retailer pages are not returned. No hard-coded product success or copied search-engine prices.
4. Add reliable permitted nearby sources beyond existing Clicks/Sportsmans locators; verify exact branch addresses/phone/schedules separately from inventory.
5. Finish all223untested control/state entries and remaining dynamic discovery, populated filters/deals/comparisons,real-device camera/GPS,screen reader and concurrency/CPU-trace validation. A scoped green CI run is insufficient.
6. Inventory/background alerts/central analytics need authorized feeds and storage/delivery integrations. Configure any credentials only through hosting secret settings,neverchat. Existing Gemini/Formspree paths already work; HF402credits are unavailable and billing staysdisabled.
7. No work continues in the background after this response. This checkpoint is intentionally NOT a launch-ready declaration.

## 19 October final repeat

Both attachments again used the actual chooser and Identify & Find on254e998. Cream returned Sanofi topical cream65%,size25g,Anthisan Cream25g unconfirmed label; no strength/barcode/colour inferred. Headset returned Logitech headphones65%,ProX only possible; no exact variant/price. Both Compare panels explicitly had no verified current price and no nearby retailer locations. Ask FindIt declined to certify PS5 compatibility/model. Premium AI retained current headset context and missing price evidence. The customer cannot complete a verified purchase from either photo, so both end-to-end outcomes remain FAILED.

Final API sweep:8photo uploadsHTTP200;7partial,1uncertain;0exact offers. Clothing did not yield an identity, so commerce/research were not called for it. Remaining7 ran both stagesHTTP200. Separate10typed queries:all30stagesHTTP200,6priced successes,4no verified priced listing(groceries,shoes,furniture,household). No1102 observed in these bounded sweeps; resource traces/load certification remain untested.

Inventory now272observed control/state entries:41passed,2failed,6blocked,223untested. The original265-row inventory was retained;7final dynamic paths were added with scoped evidence. Entries can represent different states of the same visible control. This is explicitly incomplete inventory/discovery and behavior testing.
