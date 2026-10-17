# FindIt launch audit — 17 October 2026

**Recommendation: NOT launch-ready.** User testing is welcome; this is not a completion certificate.

Historical deployed follow-up: `a5147d111da6652a2f170428c5fe9e3d5d4bd81b`; API and actual browser metadata both verified. Runtime repair is `0c2d29c`; a5147d1 changes only the smoke assertion to recognize either valid unconfirmed-stock wording, retaining rejection of stock/directions claims. 245/245 local tests passed. See the final follow-up below for current release workflow results and reliability failures.

Earlier audited repair release: `e0a83b16055bc814053981a043d113f1e077c1d1`. Production API version and actual browser build metadata both returned this code release. All eleven workflows triggered for this backend release passed; all twelve workflows for frontend release 29e3720 also passed. Existing features/design are preserved. No purchase or paid service activation was performed.

## Repairs since the previous checkpoint

- Correct native discovery scoring for typed input whose object field repeats the full product name. Production Bosch GSB 18V-50 now reaches TMB Supplies' exact kit listing (two batteries and charger), R4999 ZAR and online stock; branch stock remains unverified.
- Let exact-page candidates undergo independent verification when a retailer search fails. Korg still fails from GitHub despite a local live pass; do not count this as completed coverage.
- Remove corporate marketing from Product Info's purpose/strength selection. Ask FindIt includes sourced package contents and compatibility, including the Bosch batteries and GAL 18V-20 charger.
- History entries reopen their stored query and retrieve fresh data. Actual production browser journey passed.
- Add an attributed, read-only Open Food Facts lookup for supported food GTINs. Validate checksum and identical returned barcode. Unknown codes remain unchanged; food catalogue data does not prove retailer price or stock. A real 5449000000996 browser journey displayed Coca-Cola 330 ml, pack quantity and source. Correct catalogue provenance labels instead of AI/user-confirmation claims.
- Add keyboard/screen-reader support to existing product/dashboard/feedback dialogs: role/name, focus entry/wrap, Escape and return focus; keep focus inside when a form is replaced by loading content. Label Ask FindIt and announce answers.
- Respect feedback diagnostic opt-out, validate integer rating/message bounds, send only allowed technical fields, bound delivery waits and preserve failed drafts. Real production failure retained the draft; delivery remains unconfigured.
- Load existing core dashboard/feedback controls during initial page setup, repairing a missed first click. Added first-click and feedback opt-out browser regressions.
- Vision: current Gemma reader, explicit JSON/non-thinking output within the request deadline, reject empty JSON templates as products, keep partial-photo corroboration running where configured, and reconcile supported bookcase/bookshelf and toilet-roll/paper family wording. Exact recognition remains failed in the recorded real retests.

Local checks: **244/244 Node tests passed**, syntax and diff checks passed. All twelve workflows for frontend repair 29e3720 passed, including responsive/upload/location/saved-item checks and the new feedback consent regression. The actual first Feedback click after reload, dialog keyboard wrap/Escape/focus restoration and retained failed-feedback draft were verified in the cloud browser. All eleven latest backend workflows passed; raw workflow records are included.

## Feature checklist (earlier checkpoint; evening updates below supersede it)

The table carries forward scoped evidence. The updates below it supersede older run counts/details.

| Feature | Status | Evidence / limitation |
|---|---|---|
| Gallery/files picker and preview | passed | Actual cloud-browser upload of original conditioner/shoe fixtures. Production browser regression also verifies transport at 390/768/1440 px. |
| Invalid/oversized upload handling | passed | Live text-file rejection; browser regression verifies oversized files preserve valid selections, including camera input. Local tests cover empty files. |
| Camera file-input transport | passed | Production browser regression at three widths. |
| Physical phone camera capture | untested | No physical camera is available in this environment. |
| Drag/drop event transport | passed | Production browser regression dispatches a real File/DataTransfer drop event through deployed handlers; physical OS drag remains untested. |
| Photo brand/family/model/variant identification | failed | Stable ten-photo matrix: 8 partial readings, 2 unidentified; 0 exact product-to-offer journeys. Family recovery improved; no typed substitutions counted. |
| Photo barcode OCR | untested | No legible real barcode photo journey tested this session. |
| Text search | passed | Ten real query journeys through production APIs. Returned useful data varies, as shown below. |
| Barcode catalogue search | passed | Scoped real Open Food Facts lookup and browser journey for 5449000000996; retailer coverage and all-category catalogue coverage remain incomplete. |
| Product details/specifications/compatibility | failed | Useful sourced LEGO/Logitech/beauty/clothing examples; missing research for several other categories. Toy-window compatibility misclassification repaired. |
| Ask FindIt | passed | Scoped actual Bosch kit-content/compatibility answer with source; broad product coverage remains incomplete. |
| Exact retailer discovery | failed | Earlier e0a83b1:6/10; follow-up0c2d29c:5/10 verified offers,3 no verified listing,2 transport failures. No other variant substituted. |
| Prices/currency/links | passed | Scoped: Logitech R2299; conditioner R206.99/R230; LEGO R559. All are published ZAR offers linked to product pages. Clothing colours are separate listings, not a universally cheaper identical variant. |
| Price comparisons | passed | Actual LEGO Compare UI shows R559, product link, online stock and explicitly unverified branch stock. Broad comparable-variant coverage remains failed. |
| Online availability | passed | Scoped verified retailer examples. |
| Verified branch inventory | blocked | No authoritative inventory feed; locator presence/online stock cannot prove shelf stock. |
| Manual search location | passed | Actual map selection, coordinate apply, invalid-coordinate rejection and production browser tests. No town/postcode lookup. |
| GPS success on a physical device | untested | Earlier permission-denial test is historical; manual path avoids requiring GPS. |
| Radius/distances | passed | Scoped: real manual map point produced Sportsmans branches at 5.3/8.0/8.3 km within the selected 10 km radius. Race rejection tests cover older locations/radii. |
| Maps | passed | Actual production manual map tiles loaded and click selected a point. All other result-map interactions are not exhaustively tested. |
| Directions | untested | Links/guards remain; full real trip/navigation journey not completed this session. |
| Addresses/phones/hours/open status | passed | Scoped official Menlyn lookup returns its address, 012 348 2882, Friday close 21:00 and scheduled open at the recorded time. No holiday/real-time exception guarantee. |
| Saved items/persistence/reopen | passed | Production browser workflow saves Logitech, reloads and reopens for fresh research. |
| Shopping list | passed | Basic add and settled DOM browser regression: zero further mutations in the observation window. |
| Watchlist/Alerts display | passed | Production browser regression connects watched current product to Alerts. |
| Background monitoring/notifications | blocked | No configured background monitoring and notification-delivery service. |
| History | passed | Actual reopen/research journey for Bosch passed; every History+ tool is not yet verified. |
| Deals | passed | Scoped final-build actual Bosch journey displays TMB R4999 as a current online price, with no invented discount claim or nearby stock. Broad coverage remains incomplete. |
| Collections/favourites | untested | Existing tools preserved. Complete usefulness/persistence sweeps remain. |
| Premium Beta | passed | Free activation occurs in real saved-product browser regression; no payment. Every Premium tool is not validated. |
| Feedback/feature delivery | blocked | Submission validation, diagnostic opt-out, timeout and draft recovery repaired; real unavailable-delivery draft remained intact.  Production configuration reports feedbackEndpoint:false. Copy recovery remains available. Requires existing FORMSPREE_ENDPOINT configured securely in Cloudflare. |
| Analytics persistence | blocked | Existing handler does not persist central events; prior visitor counters are not feedback counts. Storage integration is required. |
| Every button/menu/form/settings path | untested | Several smoke/commerce/interaction suites run, but not every tool/data path is exhaustively verified. |
| Desktop/mobile layout | passed | Production and local browser checks at eight widths, plus manual-location/upload checks at three widths. Full physical-device testing remains untested. |
| Accessibility | untested | Basic dialog roles/labels, keyboard entry/wrap/Escape/restore repaired and tested. Full screen-reader, contrast and every control audit remains untested. |
| Performance/reliability | failed | Provider timeouts and intermittent Cloudflare HTTP 503 / error 1102 reproduced. Repeated parsing reduced; broad load/resource reliability not established. |
| Local automated checks | passed | 244/244 tests for the current repair; eleven final deployment workflows passed. |
| Frontend/backend deployment consistency | passed | Final API version and actual browser build metadata match code release above. |


## Updated evidence and unresolved requirements

- Stable production API matrix on e0a83b1: **6/10 passed**, including repaired tools. Failed queries: Coca-Cola Original Taste 2L, Nike Air Force 1 Low White Blue, IKEA BILLY 80x28x202 white, Twinsaver Comfort 3 Ply Tissues 120. Empty offers mean no verified retrieval, not proof the product cannot be bought.
- A complete ten-category real-photo API matrix on 0ad185f used downloaded retailer/manufacturer/catalogue images plus original user fixtures, without typed substitutions. No exact model journeys passed; three partial readings survived. The subsequent complete matrix on 29e3720 retained eight partial identities and had two unsuccessful readings (clothing and toys). No exact model or exact-price photo journey passed. Sources and responses are retained. It reproduced no-JSON output and family synonym losses, prompting the latest repair. These API tests are distinguished from actual chooser/browser tests.
- Excluded a Bothners listing whose MV7+ title conflicts with its MV7K base-model code. Shure publishes MV7-K for MV7 and MV7+-K for MV7+. The remaining consistent listing is evaluated independently; the former R6695 result must no longer be advertised as a verified cheapest MV7+.
- Cloudflare diagnostics reproduced 3040 capacity and 8007 upstream errors, as well as malformed/empty output. Hugging Face returns HTTP 402/credits. No billing was enabled. After non-thinking JSON settings and family reconciliation, the stable ten-photo retest retained eight partial identities. Provider failure/malformed output and missing exact identities remain material limitations.
- Prepared an optional Gemini 2.5 Flash vision adapter. It does not run without GEMINI_API_KEY; independent corroboration and retailer verification still apply. Unit integration tests passed, but live Gemini use is **blocked/unverified** until the existing key is securely configured in Cloudflare and its account/free quota is checked. No billing was enabled.
- Vercel retains GEMINI_API_KEY and FORMSPREE_ENDPOINT as sensitive secrets. Their values cannot be recovered through the existing connection. Cloudflare reports feedbackEndpoint:false. Configure the existing endpoint securely in Cloudflare; do not paste secrets into chat.
- No authoritative branch-inventory feed, central analytics persistence or background alert-delivery integration is configured. Existing Supabase secrets are on old Vercel hosting and cannot be read back. These capabilities are not complete.
- Physical camera/GPS and barcode capture, full screen-reader/contrast audit and exhaustive business-value coverage remain untested. UI interaction-suite passes do not establish live data quality.

## Precise continuation checkpoint

Active audit worktree: `/workspace/scratch/dfb28728663c/Findit-oct17`, detached at earlier audit commit bd38d68, with published changes kept locally. Fetch main before further changes and publish with expected-parent leases; audit workflows may append docs-only commits. Do not force-push. Previous worktrees Findit-next/Findit-reviewed retain earlier evidence.

Completed final e0a83b1 API matrix (same version before/after), all eleven workflows and actual gallery → identification → Product Info browser retest. The real Logitech photo produced a supported headphones family reading and explicitly unconfirmed G Pro X candidate, with no exact price. Final barcode 5449000000996 browser retest displayed Coca-Cola 330 ml, attributed catalogue fields and “Barcode catalogue match”; no retailer price or stock was invented. Focus remained inside the dialog while loading. Final direct-browser MV7+ price retest was not repeated; its final API result is retained. Korg Pitchclip 2 still returned no production offers despite an earlier local pass. Exact photo-to-offer journeys remain failed. Required user configuration: securely add existing GEMINI_API_KEY and FORMSPREE_ENDPOINT to Cloudflare; never paste keys into chat or enable billing. Four failed exact-product searches still need reliable catalogue/search coverage; missing data must not be filled with other variants. Camera/GPS/full accessibility and remaining business-quality coverage are not complete.

## Evidence files

Raw final responses, source URLs, local test output, workflow results and integration status are in [launch-evidence-2026-10-17](launch-evidence-2026-10-17/). The final ten-photo matrix ran on frontend release 29e3720; the optional-key-only backend adapter then shipped as e0a83b1. No live Gemini result is claimed. The final gallery browser retest and barcode journey ran on e0a83b1. Earlier and final response files are deliberately labelled by run; they must not be combined into a higher success count.

## Follow-up: retailer domain trust boundary

Reproduced an additional exact-retailer bug: `incredible.co.za.unrelated.example` received the same trust boost as the actual retailer because the domain check used a substring regular expression. Replaced it with a complete domain/subdomain boundary check and explicit retailer domains. Unrelated lookalikes no longer receive trust points. Independently verified niche retailers remain eligible through product evidence. Regression covers four unrelated hosts and the genuine domain/www subdomain; **245/245 local tests passed**, syntax and diff checks passed. Deployment and final production retest for this follow-up are recorded separately; the prior e0a83b1 evidence remains scoped to that release.

Current follow-up worktree: `/workspace/scratch/dfb28728663c/Findit-final`. Launch remains blocked by the photo/data failures and integrations described above. Configuration-only health recheck still reports feedbackEndpoint:false.

## Final follow-up production results

- The retailer domain-boundary fix shipped as 0c2d29c. Actual browser typed Logitech search → sourced Product Info → Compare returned Computer Mania R2299 ZAR, online in stock, branch stock explicitly unverified.
- Uploading the real Logitech photo through the chooser, without entering a model, returned only a family match and unconfirmed model candidates. It cleared the typed result and price. The independent API photo retest also remained partial; HF returned 402 credits and another vision reader timed out. Exact photo journey remains failed.
- The ten-query rerun stayed on 0c2d29c before/after: five offers passed; groceries/shoes/furniture had no verified offer. Household and music returned non-JSON responses, so these are transport/reliability failures, not proof of unavailable products. A focused music retry reproduced HTTP503 with Cloudflare error1102. Earlier six-of-ten results must not conceal this instability.
- A first Python urllib run was rejected with HTTP403 by the request environment. It was replaced by the working curl transport; only that rerun is retained as application evidence.
- Settings radius changed to5km, applied and persisted through reload; restored to10km afterwards. Customer How-to instructions were opened and inspected. Every other setting/tool is not thereby certified.
- Release smoke on0c2d29c failed only its exact-string expectation for unconfirmed branch stock. The visible text explicitly said “Branch stock not confirmed” and “Exact product not confirmed at this branch”; no Directions control was exposed. a5147d1 accepts either valid existing wording while preserving negative checks against false confirmation/directions. This is a test repair, not an additional product capability.

Required next work: configure existing Gemini and feedback credentials securely in Cloudflare (no billing), verify their real free-quota operation, diagnose Worker resource error1102 with production traces, extend reliable exact catalogue coverage, then repeat photo/data and remaining feature journeys. There is still engineering work beyond the credential setup. Do not call this complete.

Final a5147d1 workflow snapshot: all 9 triggered workflows succeeded. Corrected Release Smoke passed. No jobs remain pending in this release snapshot. Raw snapshot: domain-repair-final-workflows.json. Actual final-build Bosch search returned TMB Supplies R4999 ZAR and sourced compatibility; Ask FindIt named two GBA18V2.0Ah batteries and GAL18V-20 charger with source URL.

All nine a5147d1 release workflows completed successfully. The latest frontend/backend versions match a5147d1. This does not override the live-photo, catalogue, resource and integration failures.


## Continued repair checkpoint — 17 October, evening (SAST)

**Recommendation remains NOT launch-ready.** Earlier counts and configuration blockers above are historical; this section supersedes them. The design and existing tools remain intact. No purchase, billing activation, or paid-service activation was performed.

Latest code checkpoint: `d4c235a3149c6a1d400d043638bfd4f473dcaf7c`. Actual browser frontend metadata verified this commit; Vercel deployment also reports READY for it. Final backend-version and journey verification is still in progress; do not infer completion from deployment status. Stable full photo sweep verified `7f249e8c6cd28a45237335d7401395d4b36d5f32` at both ends.

### Verified repairs and evidence

- Reduced duplicate retailer-page parsing and unnecessary reader fetches when exact structured Product data already supplies the requested evidence. In the captured 311,520-byte Bothners case, the same MV7+K SKU/R6995/ZAR/in-stock result used 60 rather than 90 fetches over 30 runs; local CPU time fell about 61%. This is a local benchmark, not a Worker CPU measurement. Two subsequent ten-query production matrices returned all HTTP200 JSON, six verified priced listings and four no-listing results, without the previously reproduced 1102. This does not establish broad load reliability.
- Fixed beverage, construction-toy and shirt family reconciliation; rejected literal vision template values; partial photo cache now expires in 120 seconds and separates provider configurations.
- Removed generic marketing from product strengths, retained concrete connector/DSP/compatibility facts, and fixed toilet-paper photos receiving food/allergen advice.
- Corrected the official Clicks branch parser: store hours exclude clinic schedules, preserve supported South African country context for scheduled status, and reject Clicks Baby being attached to a regular Clicks branch. Actual Menlyn Park source/API returned address, 0123486162 and Mo–Th09–20, Fr/Sa09–21, Su/PH09–18. This proves published schedule parsing, not exceptional closure or shelf inventory.
- Repaired Vercel's Hobby limit failure by moving the retained legacy research implementation from an unused deployable function to `lib/legacy-product-research.js`. Existing public API rewrites remain. Vercel subsequently reached READY without upgrading the plan.
- Reused the project's existing public Vercel Gemini service from the Worker, without retrieving or exposing the saved key. One Gemini service result counts as one claim, regardless of its internal passes; a separate Cloudflare reader still corroborates identity. Redirect mode was reproduced as failing and changed to Workers-compatible manual handling; subsequent production diagnostics confirm Gemini IDENTIFIED. No authentication protection was changed.
- Read explicit printed pack counts separately from model text, so corroborated “Twin Ply”/“Twin Ply 18 Rolls” preserve model and pack count. Actual original Twinsaver photo now shows **TWINSAVER TWIN PLY toilet paper 18 Rolls**, with no typed product name. No price or stock is invented.
- Reconnected the existing configured Formspree delivery through Vercel. Both live Worker API and actual browser form confirmed delivery. Browser submission with diagnostic consent unchecked showed “Feedback sent ✓”; a failed or undelivered receipt remains failure. No credentials need to be copied into chat or Cloudflare for these two existing-service paths.
- Fixed the legacy health endpoint reporting missing Hugging Face credentials despite working Gemini. Health now labels its result as configuration-only; actual inference is evidenced separately.
- Fixed nearby API reporting “no retailers” when all discovery providers fail. Results now distinguish unavailable data from a successful empty query; frontend outage messages are scoped to product, coordinates and radius.
- Fixed completed photo research leaving “Checking retailer evidence…” visible after an empty result. Automated behavior regression verifies loading settles; latest actual-browser retest is pending.

### Actual customer and data results

Local Node checks: **266/266 passing** (see `launch-evidence-2026-10-17-resource/local-tests.log`); syntax and diff checks passed. Inspect individual workflow results before describing CI as fully passed.

The stable ten-photo production sweep (`bridge-real-photo-matrix.json`) uploaded real files with correct MIME types and never supplied typed product names. All ten upload responses were HTTP200: **one identified pack, eight partial identifications, one unidentified shirt**. The shirt family was repaired afterward and verified in the browser as “shirt”, with no guessed brand, model or colour; do not rewrite the earlier stable matrix as a later all-pass run. **Zero photo journeys produced a confirmed exact priced offer.** A successful upload or plausible family is not an exact retail match.

| Photo category | Stable sweep result | Useful result / remaining gap |
|---|---|---|
| Electronics | partial | Logitech headphones; G Pro versus G Pro X disagreement retained. |
| Clothing | unidentified | Later browser repair retains shirt family; brand/style/size unknown. |
| Tools | partial | Bosch drill; different model hypotheses remain possible listings only. |
| Toys | partial | Building blocks; exact set and maker not corroborated. |
| Furniture | partial | Bookcase; brand, dimensions and model not visible/corroborated. |
| Groceries | partial | Coca-Cola beverage; can size and variant unconfirmed. |
| Shoes | partial | Nike shoes; model splitting and variant uncertainty remain. |
| Beauty | partial | Marc Anthony conditioner; actual browser review shows a clearly labelled possible Strictly Curls 3X Moisture 250ml listing, Clicks R230, online in stock, instructions/ingredients/warnings and product link. Size is not silently assigned to the photo. |
| Household | identified | Twinsaver Twin Ply 18-roll pack; correct paper guidance, no exact priced offer found. |
| Music | partial | Microphone; no confirmed brand/model, no Shure data attached. |

Actual browser settings: radius changed to5km and automatic verification off, saved, reloaded and retained; defaults restored afterward. Existing Shure shopping-list entry persisted across reloads and remained an explicitly online-only plan. Ask FindIt on the photo-selected toilet-paper pack supplied labelled general paper/value guidance and did not invent exact prices. Physical inventory remains unverified. Manual Menlyn search produced no nearby data in this run; this is a provider-retrieval limitation, not evidence that Menlyn has no shops.

### Remaining launch blockers and precise continuation

1. Exact photo-to-offer coverage remains failed. Improve evidence-preserving label/model reconciliation and candidate discovery, then retest original photos across all categories. Do not weaken variant gates or confirm possible listings merely to obtain prices.
2. Nearby discovery reliability remains failed in the recorded Menlyn journey. Retest the deployed outage UI and establish a reliable permitted data source/official locator fallback; opening schedules do not establish inventory.
3. Branch inventory is blocked on an authoritative retailer inventory integration. The existing feed contract can be configured securely when an authorized feed is available; do not infer stock from map presence or online stock.
4. Background alerts/notification delivery and central analytics remain blocked on appropriate storage/delivery integration. Do not activate the paused Supabase service or billing. Local watch observations are not background monitoring.
5. Hugging Face returns402 (credits unavailable). Gemini and Cloudflare can work without it; do not treat this as the explanation for unrelated product/retailer failures or enable billing.
6. Physical camera/GPS success, real OS drag/drop, full screen-reader testing and complete real-device navigation remain untested. Existing transport, keyboard/modal and responsive automated checks are scoped evidence, not hardware certification.
7. Collections/favourites, every History+ tool, all Premium tools and every menu's usefulness/persistence remain incompletely audited despite broad smoke checks. Continue those journeys and update statuses individually.
8. Final latest-version browser/API proof, complete CI results, and latest loading/outage UI retests remain outstanding for the code checkpoint above. Preserve bot-generated audit commits when publishing; local worktree is detached with previously published changes retained as modifications. Never reset or force-push it.

Evidence is in `docs/launch-evidence-2026-10-17-resource/`; reusable live query and photo scripts are included. Screenshots are supporting UI evidence, not substitutes for API/source records.
