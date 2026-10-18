# FindIt Nearby — continuation audit, 18 October 2026

**Recommendation: NOT launch-ready.** This continues, and supersedes the outstanding statuses in, `LAUNCH_CHECKLIST_2026-10-17.md`. Preserve historical evidence. No paid service or billing was activated.

## Release evidence

- Browser frontend metadata and live Worker `/api/version` matched `49f4ca0d4870f75e301b5290659de5219e36a57f`.
- All 11 workflows on that commit completed successfully; Vercel production deployment READY. See `launch-evidence-2026-10-18/final-workflows.json`. These do not certify every customer outcome.
- Subsequent barcode validation repair: `b6842a00fb782f3561e260119793108b7d0518f5`; followed by scanner journey repair `c231e92c6870e3043eaeba669f3a66922fdd9cfc`. Latest deployment and actual-browser recheck pending at this checkpoint.
- Local Node checks: **291 passed, zero failed**. Syntax and diff checks passed. Raw log retained.
- Stable ten-photo sweep on 49f4ca0: 10 HTTP200 uploads, one identified household pack, nine partial identities, zero confirmed exact priced offers. Sources, submitted paths, raw identity/commerce/research responses are in `bridge-real-photo-matrix.json`. No product names were entered to bypass photo failures.
- Separate stable typed-query sweep on 50bfab5: 30/30 API stages HTTP200 JSON, six of ten queries returned verified priced listings; four had no verified priced listing. This is typed-search evidence, not photo success. No resource error1102 occurred in that sweep; it is not a load guarantee.

## Verified repairs

1. Official Clicks nearby discovery retrieves the existing public locator and safely parses inert published JSON; exact regular branches only, no Clicks Baby/Claire’s substitution. At the public Menlyn test point, 12 regular branches within5km were returned. Locator presence does not imply inventory.
2. Zero-distance branches now sort correctly in all three affected lists. Actual browser placed Menlyn Park0.0km first.
3. Legacy Premium modals now mount outside the dashboard’s transparent historical main element. Actual Collections creation/addition works; saved product name/count and favourite branch persisted after reload.
4. Premium first click reliably opens Workspace; Saved/Compare/Filter modal paths are portalled and labelled, with shared Escape/focus handling.
5. History+ opens the selected product inside FindIt; search/filter/delete retained. Premium history capacity50 is preserved. Manual search starts a fresh identity rather than inheriting a previous photo’s model/category.
6. Watchlists share one migrated local state without losing existing records or targets. Dashboard and Premium see the same item. Unknown prices are not R0; unknown stock is not out of stock. Cross-retailer/currency observations cannot create false price drops. Uncertain identities retain exact-match restrictions during recheck.
7. Exact verified branch contact refresh can replace a short locator address with the supported full address; coordinate/name safeguards retained.
8. Gemini gets up to24seconds inside the existing bounded total vision budget. A fresh real beauty upload returned independent Gemini/Gemma/Moondream readings. A fully printed possible label survives as a hypothesis without confirming an uncertain variant.
9. Photo GTIN normalization rejects bad checksums and arbitrary prefixes, accepts spaces/hyphens and a unique full printed code, and still requires independent readers to agree. Tests include invalid, multiple, singly read and correctly spaced codes. This does not establish successful real barcode-photo recognition.
10. Actual manual scanner reproduction found its old commerce endpoint/schema disconnected from the current catalogue search. The scanner now uses the maintained full in-app product journey; fallback uses `/api/search`. Browser regression checks the selected product, not a legacy status string. Actual latest-build retest pending.
11. Brand-only evidence no longer claims a recognised product type in the dashboard badge or Smart Choice confidence labels.
12. Retained October17 fixes: reduced duplicate retailer parsing/resource cost, restored existing Gemini and feedback services, Vercel Hobby function-budget repair, truthful provider-outage states, completed loading reset, useful category guidance and exact published store schedules.

## Complete feature status checklist

A passed entry is limited to its stated evidence. “Failed” includes incomplete useful outcome, not just a crash. Untested entries require additional actual-customer verification.

| Feature | Status | Evidence or remaining work |
|---|---|---|
| Gallery/files photo upload | Passed | Actual JPEG/WebP chooser journeys; 10 original real-photo API transports. |
| Camera capture on physical phone | Untested | No physical camera available; event/transport tests are scoped evidence. |
| Drag/drop | Untested | Automated event coverage exists; real OS drag/drop not verified. |
| Photo brand/family/model/variant | Failed | 1 identified pack,9 partials; correct uncertainty retained but exact match coverage inadequate. |
| Printed pack count | Passed | Original Twinsaver photo retains Twin Ply and18Rolls, without typed substitution. |
| Visible barcode from real photo | Failed | Coca-Cola can photo has printed5449000000996; live result retained brand only. Checksum repair alone does not make OCR pass. |
| Manual barcode search | Failed | API/main-search catalogue works, but actual scanner still expected a removed legacy commerce schema. c231e92 connects it to maintained product search; actual production retest pending. |
| Camera barcode scanner | Blocked | This remote Chrome reports BarcodeDetector unsupported; manual fallback shown. Physical-device verification still needed. |
| Text search | Failed | Six of10 exact queries yield verified priced offers; four no listings. Additional “Bosch GSB18V-50 kit” yielded no verified offer, while original no-kit query had one; do not equate variants. |
| Product descriptions/purpose | Failed | Useful family guidance and sourced exact facts exist; incomplete exact coverage across photo categories. |
| Specifications/compatibility/strengths/limits | Failed | Exact supported listings retain source facts; unknown-model photos cannot supply exact specifications. |
| Ask FindIt | Passed | Scoped live sourced Bosch compatibility and photo-selected toilet-paper guidance; no general all-product guarantee. |
| Exact retailer/variant matching | Failed | Negative gates preserved; coverage still poor. Beauty/tool possible listings stay separate from confirmed offers. |
| Prices/currency/product links | Passed | Six-query source evidence, positive prices/currency and direct retailer URLs; not all categories. |
| Meaningful price comparison | Failed | Same-variant comparable coverage insufficient; no invented comparison when evidence absent. |
| Online availability | Passed | Supported retailer-page status is separately labelled. |
| Verified branch inventory | Blocked | Requires an authorized current SKU-by-branch inventory feed. No such feed configured. |
| Nearby beauty retailers | Passed | Official Clicks source + actual photo journey/12branches5km. |
| Nearby shoes retailers | Passed | Existing official Sportsmans locator support; not every branch stocks selected shoe. |
| Other-category nearby reliability | Failed | Remaining reliance on unreliable Overpass; source integration work remains. |
| Location permission denial/error | Passed | Existing automated recovery coverage; physical GPS success untested. |
| Manual coordinates/radius/distance | Passed | Actual Menlyn coordinates,5km search and persisted settings; zero-distance sorting repaired. |
| Maps/directions | Passed | Actual Google Maps destination resolved to selected Clicks branch; not a physical navigation test. |
| Branch address/phone/hours | Passed | Exact official Menlyn details sourced,0123486162, published store schedule excluding clinic hours; latest full-address display retest pending. |
| Scheduled open/closed | Passed | Published schedule/timezone calculations and live displayed status; exceptional closures not guaranteed. |
| Saved items | Passed | Actual Saved dialog displays collection product after reload; Searchagain moved in-app. Latest action retest pending. |
| Collections | Passed | Created Launch audit, added photo-identified pack, name/count survived reload. |
| Favourite stores | Passed | Clicks Menlyn Park/address persisted after reload. |
| History+ | Passed | Filter and in-app Openproduct actual journey;50limit covered locally. |
| Shopping lists/trip planning | Passed | Previous actual persisted online-only plan; full physical trip/stock verification unavailable. |
| Watchlist local storage/recheck | Passed | Same saved pack visible in Premium, no fictitious price/stock, uncertain model recheck stays restricted. |
| Alerts/background notifications | Blocked | Local while-open observations only; no authorized durable scheduler/delivery integration configured. |
| Deals | Untested | No blanket usefulness claim from opening a panel; exact current deal evidence needs full retest. |
| Premium Beta | Passed | Free activation preserved, first Workspace click and nested tools tested. |
| Compare/Smart Filters | Untested | Visibility repaired and empty Compare inspected; populated sorting/usefulness needs latest live retest. |
| Manual Premium search | Passed | In-app fresh Bosch query, current product changed; no verified offer for kit wording. |
| Exact/AI Premium searches | Untested | Identity restriction repair covered by tests; latest actual partial-photo tool journey pending. |
| Premium stats/radius tools | Untested | Latest actual complete action/persistence retest outstanding. |
| Settings | Passed | Radius/automatic-verification persisted through actual reload; not every setting certified. |
| Feedback | Passed | Actual delivery via existing Formspree service with diagnostics unchecked, explicit success. |
| Suggest a Feature/share/copy | Untested | Prior smoke coverage does not certify all actual delivery/share journeys. |
| All buttons/menus/navigation | Untested | Broad CI smoke exists; remaining per-action usefulness checks explicitly outstanding. |
| Mobile/desktop layouts | Passed | Responsive CI suite49f succeeded; physical-device coverage untested. |
| Accessibility | Untested | Keyboard/dialog regressions passed and actual Escape verified; full screen-reader/device audit outstanding. |
| Loading/errors | Passed | Completed zero-offer research settles; provider outage distinguished from successful empty result. |
| Performance/reliability | Failed | Repeated resource1102 not seen in latest matrices, but no broad concurrent load certification. |
| Production frontend/backend consistency | Passed | 49f versions match; subsequent b684 verification pending. |
| Analytics | Blocked | No authorized central analytics/storage integration configured; do not activate paused Supabase/billing. |

## Concrete remaining requirements

- Finish latest-build browser/API verification, complete CI, and publish evidence/checklist checkpoint.
- Continue recorded untested populated tools/actions. Do not call them passed from a modal opening.
- Photo exactness requires readable discriminating labels plus corroborated catalogue discovery; a generic bookcase/microphone cannot honestly be assigned IKEA/Shure from a source filename. Improve extraction/candidate research without weakening gates.
- Retailer listing gaps and non-beauty/non-shoe nearby coverage need appropriate authorized public sources or data services. Store inventory and background alerts need integrations rather than fabricated data.
- Configure any future provider/feed tokens through hosting secret settings; never paste secrets in chat. Existing Gemini/feedback work without new credentials. HF402 credits remain unavailable and billing must remain disabled.

All raw evidence is under `docs/launch-evidence-2026-10-18/`. No capability here is declared globally complete merely because its tests pass.


## Further continuation — 18 October, afternoon (SAST)

**NOT launch-ready. This is an unfinished repair checkpoint.** Existing design/features retained; no purchase, billing, paid service, or credential change.

Deployed code: `096b21f154476e2b48bb26802711cbc90db8ab9c`. Actual browser `findit-build` and Worker `/api/version` both matched. This final commit only wraps long assistant messages; the preceding complete API matrices stayed on `e022eee1f5def6c7409ca6fa09720a2cfae9e20e` before and after. Do not describe them as matrices on 096b21f.

### Reproduced causes and repairs

- Scanner focus remained on its background opener. Connect scanner/store dialogs to the existing accessible-dialog helper and restore the opener on removal. Production keyboard journey enters Close, Shift+Tab wraps to Find product, Escape restores Scan barcode.
- Pending camera acquisition could complete after closing/reopening the scanner. A generation guard now stops late media tracks and rejects stale detector results. Three isolated lifecycle regressions pass; physical camera remains untested.
- Premium Exact Match opened external Google with the uncertain photo family. The repaired actions depended on a research-loaded script absent from initial startup, while legacy routing remained reachable. Load the maintained script directly, expose a dedicated action dispatcher, and route workspace Manual/Exact/AI actions through it. Actual latest logic build: uploaded headset without any typed name; Exact Match opens in-app evidence review with G Pro X and G gaming headset explicitly possible, not confirmed. Manual search then independently entered a barcode and selected Coca-Cola 330 ml with catalogue attribution. This separate manual journey does not count as photo success.
- Premium manual dialogs use the existing styled modal layout and keyboard support.
- A long assistant source URL caused horizontal scrolling. Final CSS uses wrapping and bounded message sizing. Actual source-bearing reply: message pane clientWidth373, scrollWidth373. Screenshot retained.

Local checks: **297 passed, zero failed**, syntax and diff checks pass. Final workflow state is in the evidence snapshot; pending workflows are not passes.

### Actual production results

Evidence: `launch-evidence-2026-10-18-continuation/`. Earlier continuation matrices crossed deployments and are labelled non-stable; use the `final-code-*` files for stable e022eee comparisons.

| Journey | Status | Actual evidence |
|---|---|---|
| Ten-category photo upload/identity/research transport | Passed | Stable e022eee,30/30 API stages HTTP200 JSON. No typed product names submitted. |
| Exact photo-to-priced-offer | Failed | One identified household pack,nine partial identities,zero confirmed exact priced offers. |
| Typed query coverage | Failed | Stable e022eee,30/30 stages HTTP200 JSON;6/10 verified priced listings. Groceries,shoes,furniture,household have none. |
| Worker1102 recurrence | Untested at broad load | No1102 in these60 staged requests; scoped concurrency only,not a load guarantee or production trace-based root-cause proof. |
| Original household browser photo | Passed for identity only | TWINSAVER TWIN PLY toilet paper18Rolls; no verified exact retailer offer. |
| Original beauty browser photo | Failed for exact identity | Marc Anthony conditioner; possible listing remains separate. |
| Retailer headset browser photo | Failed for exact identity | Logitech headphones; suggested models disagree, no exact price. |
| Manual scanner catalogue journey | Passed | Actual scanner5449000000996→Coca-Cola330ml→attributed Product Information on final096b21f. Camera detector unsupported here. |
| Premium Exact Match | Passed for safe partial-photo review | Opens in-app supported family guidance and explicitly possible models; no false exact offer. |
| Premium Manual Search | Passed | Usable styled form→new barcode journey; prior headset identity cleared. |
| Premium AI Retailer Search/Ask | Passed for scoped question | Opens in-app assistant; actual current-product price/stock question states no verified price/online availability and separates branch stock; includes Open Food Facts source. |
| Premium Stats/watch state | Passed for scoped activity | Watchlist changes0→1 after adding current catalogue product; remains1 after reload. Other count categories not exhaustively exercised. |
| Premium25km radius | Passed | Selected25km via workspace; reload retained25; restored10km via visible selector. No nearby inventory claim. |
| Assistant source wrapping | Passed | Final browser client/scroll widths both373; no horizontal message overflow. |
| All other checklist entries | Prior scope retained | Earlier Passed/Failed/Blocked/Untested rows remain; no wholesale certification from these repairs. |

### Concrete remaining work and blockers

1. Exact photo-to-offer remains critically failed across every tested category. Multiple readers disagree or lack discriminating model/variant text. Generic object photos must not be assigned a manufacturer/model from a source filename. Improve extraction and independent catalogue corroboration without relaxing gates.
2. Four typed categories still lack verified priced listings. Exact retailer discovery needs further permitted source coverage; missing listings do not mean products cannot be bought.
3. Non-beauty/non-shoe nearby discovery remains unreliable in previous evidence. Full source/locator coverage and latest category/location retests remain engineering work.
4. Authoritative SKU-by-branch inventory feed, durable background monitoring/delivery, and central analytics storage remain unconfigured. Those capabilities are blocked on authorized integrations. Do not activate paused Supabase or billing. Existing Gemini and feedback bridges already work; no new credentials are requested for them.
5. Physical phone camera/GPS, real barcode capture, actual OS drag/drop, full screen-reader/contrast review, exhaustive populated Compare/filter/deal usefulness and every remaining action are not certified. The full final production customer checklist has not passed.
6. Production CPU traces and broader reliability/load validation remain outstanding; no1102 during this scoped rerun is insufficient to declare it solved.

Continuation: fetch main and preserve bot audit commits. Worktree `/workspace/scratch/2460bb5b9c00/Findit-nearby` contains published modifications against its initial clone; do not reset or force-push. Code commits in this continuation:70c11d6(scanner),17b75a1(Premium dispatcher),e022eee(startup loading/dialogs),096b21f(URL wrap). Check latest workflow state before claiming CI complete. No work continues after this session ends.

Final workflow recheck: all 10 workflows for096b21f completed successfully, including Interaction Freeze Regression and Release Smoke. This does not override critical photo, catalogue, nearby and integration failures.
