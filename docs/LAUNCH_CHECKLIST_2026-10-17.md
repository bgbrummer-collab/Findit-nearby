# FindIt launch audit — 17 October 2026

**Recommendation: NOT launch-ready.** User testing is welcome; this is not a completion certificate.

Current repair release: `e0a83b16055bc814053981a043d113f1e077c1d1`. Production API version and actual browser build metadata both returned this code release. All eleven workflows triggered for this backend release passed; all twelve workflows for frontend release 29e3720 also passed. Existing features/design are preserved. No purchase or paid service activation was performed.

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

## Complete feature checklist

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
| Exact retailer discovery | failed | Stable final e0a83b1 release: 6 of 10 category cases pass; no other variant was substituted. |
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
| Deals/collections/favourites | untested | Existing tools preserved. Complete usefulness/persistence sweeps remain. |
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
