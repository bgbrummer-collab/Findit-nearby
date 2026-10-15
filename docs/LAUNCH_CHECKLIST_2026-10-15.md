# FindIt launch audit — 15 October 2026

Recommendation: **NOT launch-ready**. This is an evidence checklist and continuation checkpoint, not a completion certificate. Existing features/design are preserved. Production is Cloudflare Workers, deployed from GitHub main; legacy Vercel is disabled. Previous conversation records were reviewed via Personal Context; repository runtimes, API routes, tests and recent CI/deployment history were inspected.

## Verified repairs in this audit

- Short complete visual model hypotheses (e.g. Nike Dunk Low, Shure MV7) can be researched; a bare brand or isolated number cannot. Numeric model differences remain strict. Candidates remain unconfirmed until reviewed.
- Up to two model hypotheses are researched in parallel with a four-page verification budget. Observed colour is included in web discovery. URLs are interleaved across hypotheses.
- Incomplete prefix suggestions and isolated numeric fragments are removed when a fuller hypothesis exists. Photo cache version increments so old cached suggestions do not mask the repair.
- Music, clothing, furniture and household products route to relevant retailer categories instead of the general marketplace fallback. Manufacturer-specific Levi's discovery is conditional on the requested brand. No candidate retailer is promoted to a verified seller without product evidence.
- Verified offer URLs take priority over seed URLs in the bounded product research fetch list.
- General buying guidance now covers drills, clothing, furniture, toys and packaged groceries. It remains explicitly distinct from verified model specifications.
- Product research extracts published connection/compatibility statements. Ask FindIt explicitly addresses an unsupported device instead of ignoring that part of the question. No Xbox support was inferred from a USB claim.
- Retailer marketing prompts (such as “Close your eyes”) no longer become the product description. Useful descriptive clauses are retained. Conflicting product codes/specifications are kept with individual retailer variants, rather than blended into one selected product.
- Dashboard Save now persists the selected Find. Delegated saved-row actions reopen it for fresh product research, including after reload. Stale photo confidence is cleared for typed searches.
- Original jeans searches reject adjacent Shrink-to-Fit, Thermadapt/Thermodapt and Loose variants. Actual listing colours remain visible; clothing sizes still need selection/verification.
- Public WooCommerce adapters support official custom nested product permalinks, independently match the full canonical URL, decode published names and preserve online-only stock scope. Bothners MV7+ listings now return real prices and research; MV7+ and MV7i are correctly rejected for an MV7 request.
- Shopping-plan renderers no longer continually rewrite unchanged text and trigger their own observers. Live browser regression measured zero further shopping-plan DOM mutations in the settled observation window.
- Alerts reads both the current and legacy watchlists and displays recorded verified changes. New watched items no longer disappear from Alerts.
- Failed feedback shows the server's delivery error and offers Copy feedback / Copy suggestion while preserving the draft. This is a recovery mechanism, not a repair of the missing delivery integration.
- Dynamic UI modules inherit the frontend build identifier. Deployments are serialized; responsive checks require both frontend and backend version convergence, including bounded propagation checks on individual page loads.

## Feature checklist

Statuses refer to this audit unless explicitly marked historical. A narrowly passing example does not validate the whole category.

| Feature | Status | Evidence / remaining work |
|---|---|---|
| Gallery/files photo picker | passed | Original user Nike shoe, Twinsaver tissues and existing Marc Anthony fixture uploaded through actual live browser chooser, without typing replacement names. |
| Camera capture on real phone | untested | Cloud browser has no physical phone camera. Capture controls exist; device journey still needed. |
| Drag/drop | untested | Existing implementation inspected; real drop not exercised this audit. |
| Photo identification | failed | Shoe, paint, tissues and microphone families recognised. Exact model still partial. Shure suggestions include incorrect U87/SM58, and the small Marc Anthony photo recognised only conditioner, losing the brand; cannot claim reliable model identification. See saved raw diagnostics. |
| Barcode OCR from photograph | untested | No legible real barcode photo exercised in this audit. |
| Text search | passed | Ten category queries reached production search and commerce APIs. This does not mean those searches found offers. |
| Barcode catalogue search | untested | Existing tests cover validation/matching; live catalogue coverage not established. |
| Product Info | failed | Logitech exact-page research works when supplied verified offer; Marc Anthony research works. Other eight baseline queries have no researched exact information. Shoe browser shows family guidance and unconfirmed hypotheses only. |
| Ask FindIt | passed (limited) | Real browser mixed headset question returned current price and product facts. Follow-up production API verifies published USB information plus explicit unverified Xbox compatibility. Broad arbitrary question quality remains unverified. |
| Exact retailer verification | failed | Positive Logitech, Marc Anthony, Levi’s and Shure MV7+ examples after repairs. Several baseline queries still return zero offers; variant-specific coverage is not complete. No invented offers accepted as success. |
| Price/currency extraction | passed | Logitech R2299 ZAR; Marc Anthony Dis-Chem R206.99 / Clicks R230; Bothners MV7+ R6695 and R6995; Levi’s listings have published ZAR prices. Verified product URLs recorded. Broad category coverage remains failed. |
| Online availability | passed | Above exact retailer listings report online availability; final actual Compare and Live Stock views showed Bothners R6695 and in stock online, while explicitly withholding branch inventory claims. |
| Branch inventory | blocked | No connected authoritative branch inventory feed. Online availability and map presence do not prove shelf stock. Public pickup lead times must be treated separately if implemented. |
| Nearby lookup | passed (API only) | Fresh API at public Woodlands test coordinates returned Sportsmans Atterbury (3.956 km) and Menlyn (6.139 km), inside 10 km, with published addresses/phones/hours. Real user GPS/browser map journey remains unverified. |
| GPS permission/denial | passed (denial only) | Actual location request returned permission denied; UI explained the problem and re-enabled the button. Successful real GPS/browser nearby journey is blocked in this cloud browser. No user coordinates invented. |
| Manual town/location | failed | No town/postcode entry implementation found in active dashboard. |
| Radius/distances/maps/directions | untested | Earlier tests exist; latest actual customer journey with branch results pending. |
| Addresses/phones/hours/status | passed (limited) | Fresh production checks verify Computer Mania Grove and Incredible Woodlands details and scheduled open status at the recorded time. Coverage for every retailer/branch is not established. |
| Premium Beta activation | passed | Actual live UI activation through “Activate Premium Beta — Free”; no payment. |
| Saved/shopping list | passed (limited) | Actual Save, persisted reload, reopen for fresh research, adding to shopping list and settled plan browser checks passed. Actual History navigation displayed the completed headset, microphone, tissue, shoe and conditioner searches. |
| Watchlists/alerts | passed (basic only) | Actual Watch item and Alerts connection browser regression passes. True background monitoring/notification delivery while closed is blocked by missing service. |
| History | passed (display only) | Actual completed searches displayed. Full History+ tooling remains untested. |
| Deals/collections/favourites | untested | Existing tools preserved; full useful-data and persistence journeys remain to be completed. |
| Feedback/feature delivery | blocked | Current health reports feedbackEndpoint:false. Vercel Formspree variable exists as sensitive; connector cannot retrieve its value. Legacy URL returns DEPLOYMENT_DISABLED. Requires FORMSPREE_ENDPOINT configured in Cloudflare; no secret was published. |
| Analytics | blocked | Cloudflare API explicitly returns stored:false. Historical 57/58 counts were visitors, not feedback submissions. Central event persistence is not configured. |
| Every button/menu/settings path | untested | Full interaction sweep pending; old green CI is not equivalent to all information working. |
| Mobile/desktop layout | passed (historical) | Fresh local and production checks passed at 390, 768, 901, 1024, 1180, 1273, 1440 and 1920 px on the information/Save/Alerts repairs. No claim of physical-device testing. |
| Accessibility | untested | No full keyboard/screen reader/contrast audit this run. |
| Loading/reliability/performance | failed | Browser had multiple interaction/selector timeouts and slow photo flow. A concrete self-triggering shopping-plan mutation loop was fixed and its settled DOM check passed. No load test or general performance budget established. |
| Local automated suite | passed | 208/208 Node tests, zero failures. Syntax checks passed. Mocked and local checks are not counted as live retailer coverage. |
| Frontend/backend deployed version | passed | Final frontend meta, backend API version and dynamic UI module URLs all matched release 18770497e76dff70dad1ba7782b3ca9e9b89bb29. See final-deployment.json and actual browser verification. |

## Baseline category results

Real production calls, with unchanged typed user queries. These supplement, not replace, the four real-photo tests. `commerce-baseline.json` contains source URLs and response details. Baseline research calls ran independently without offers; Logitech research was separately repeated with the verified retailer offer and succeeded (`headset-research.json`), matching the frontend's normal evidence flow.

| Category | Query | Exact offers | Exact research at baseline |
|---|---|---:|---|
| Electronics | Logitech PRO X Gaming Headset 981-000818 | 1 | yes with verified offer |
| Groceries | Coca-Cola Original Taste 2L | 0 | no |
| Clothing | Levis 501 Original Jeans | 0 | no |
| Shoes | Nike Air Force 1 Low White Blue | 0 | no |
| Beauty | Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml | 2 | yes |
| Tools | Bosch GSB 18V-50 | 0 | no |
| Toys | LEGO Classic 10696 | 0 | no |
| Furniture | IKEA BILLY bookcase 80x28x202 white | 0 | no |
| Household | Twinsaver Comfort 3 Ply Tissues 120 | 0 | no |
| Music | Shure MV7 microphone | 0 | no |

## Next work / prerequisites

1. Retest the deployed routing/candidate changes and actual shoe/packaging photo journeys. Record frontend build meta and backend `/api/version` against the same commit.
2. Broaden retailer discovery using correct retailer-specific search interfaces, then independently verify actual product pages. Do not make failing live tests pass by accepting empty results or replacing the user's photo with typed identity.
3. Improve vision provider accuracy and evaluate unseen photos with ground truth. Never promise zero identification failures. Existing providers misread model text; a more reliable provider may need an explicitly budgeted integration.
4. Add a usable manual-location fallback; verify location, radius, maps, branch details and scheduled hours with real journeys.
5. Configure existing feedback delivery in Cloudflare, configure analytics storage, and obtain authorized inventory data for branch-stock claims. Do not activate billing without explicit approval.
6. Complete all untested checklist rows, including actual photos for missing categories and device-camera testing, before changing the launch recommendation.

Local workspace contains substantial pre-existing uncommitted work. Only reviewed audit changes are published on top of a fresh remote tree; do not reset the workspace or force-push its old HEAD. Secrets remain in their providers.

## Additional test results and limits

- Existing GitHub smoke, regression, production smoke, dashboard commerce, release smoke and interaction checks passed on the verified preceding releases. All eight workflows triggered for release 18770497 completed successfully, including production smoke, dashboard commerce, release smoke and the interaction regression. The earlier eight-width + saved/watchlist/settled-plan run also passed. These do not override the separate live-data coverage failures.
- Responsive regression initially correctly failed on a stale frontend build while the backend was newer. It was not treated as a layout pass; version convergence checks were strengthened and subsequent eight-width runs passed.
- The uncommon Korg Pitchclip 2 discovery workflow failed on its GitHub runner (no verified exact page discovered). Local/production success from earlier work does not erase that failure. A single rerun of the failed GitHub job also failed. The same current local live regression passed with Marshall Music R345 ZAR in stock online. This environment-dependent failure remains unresolved; do not weaken the assertion or mark the GitHub runner passed.
- The independent baseline research probe did not supply commerce offers. Its Logitech research miss was corrected by a separate real request using the verified offer, matching the frontend evidence flow. No empty response has been counted as product research success.
- A small Marc Anthony photo returned only the conditioner family in the real browser, despite the typed product finding two real retailers. This remains a photo-identification failure; the typed result is not a substitute.
- After retailer routing fixes, Levi’s original listings and research now load. A subsequent real response exposed rhetorical descriptions and conflicting variant codes; those issues were reproduced and repaired with a dedicated regression. Fresh live research confirmed “A classic straight leg and iconic styling”, no shared SKU fields, and four separately scoped retailer variants.

## Launch blockers that remain

1. Photo identification is not consistently useful across real photos. Current model consensus can lose a visible brand or suggest wrong models. Improve inference/OCR and measure it on unseen labelled photos before launch.
2. Broad retailer discovery, exact colour/size/pack matching, useful product facts and comparisons still fail for multiple everyday queries. Correct category routing and additional source adapters improve coverage but do not complete it.
3. No authorized branch inventory feed is connected. Retailer online stock cannot be promoted to branch stock. A data agreement/API is required for that capability.
4. Existing Formspree delivery must be configured in the Cloudflare environment. Vercel's sensitive variable cannot be recovered through the connected API; do not ask the user to paste credentials into chat. Configure it securely in the provider dashboard.
5. Central analytics persistence and real background alert delivery are not configured. Neither has been claimed as working.
6. Remaining untested checklist rows still need actual journeys, especially real phone camera, barcode photo/catalogue matching, GPS/maps/directions, accessibility and the remaining Premium tools. Not all remaining work is a credentials blocker.

No paid provider, purchase or billing activation was introduced in this audit.

## Final deployed code checkpoint

- Deployed frontend/backend release: `18770497e76dff70dad1ba7782b3ca9e9b89bb29`.
- Production: https://findit-nearby.bgbrummer.workers.dev/
- Deployment version checked at 2026-10-15T14:41:46Z; actual browser also loaded build-stamped dynamic modules with that same release.
- All eight workflows triggered for this release passed. The responsive and saved/watchlist/settled-plan workflow last passed on its preceding affected-code commit (924d3d02); final release adds feedback recovery and dynamic module versioning. No CSS was changed after the eight-width pass.
- Last local result: 208 tests, 208 passed, zero failed/skipped. Syntax and workflow YAML checks passed.
- Browser proof saved: `launch-evidence-2026-10-15/findit-final-production-info-20261015.jpg` (actual final production MV7+ Product Info with compatibility and scoped retailer variants).
- This checkpoint remains **not launch-ready**. Outstanding failures/blocked/untested items above remain real work, not a request for the user to repeat “keep going.” A secure feedback configuration, reliable inventory/data integrations, further recognition/discovery engineering and remaining real-device/user-journey testing are still required.

Final browser checks also verified History display, the MV7+ Compare Prices view (Bothners R6695 ZAR), and Live Stock explicitly separating its in-stock online listing from unverified branch inventory. The live feedback failure and successful Copy fallback were tested through the dashboard Feedback navigation, not the hidden legacy form.
