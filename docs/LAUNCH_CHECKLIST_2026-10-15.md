# FindIt launch audit — 15 October 2026

Recommendation: **NOT launch-ready**. This is an evidence checklist and continuation checkpoint, not a completion certificate. Existing features/design are preserved. Production is Cloudflare Workers, deployed from GitHub main; legacy Vercel is disabled. Previous conversation records were reviewed via Personal Context; repository runtimes, API routes, tests and recent CI/deployment history were inspected.

## Verified repairs in this audit

- Short complete visual model hypotheses (e.g. Nike Dunk Low, Shure MV7) can be researched; a bare brand or isolated number cannot. Numeric model differences remain strict. Candidates remain unconfirmed until reviewed.
- Up to two model hypotheses are researched in parallel with a four-page verification budget. Observed colour is included in web discovery. URLs are interleaved across hypotheses.
- Incomplete prefix suggestions and isolated numeric fragments are removed when a fuller hypothesis exists. Photo cache version increments so old cached suggestions do not mask the repair.
- Music, clothing, furniture and household products route to relevant retailer categories instead of the general marketplace fallback. Manufacturer-specific Levi's discovery is conditional on the requested brand. No candidate retailer is promoted to a verified seller without product evidence.
- Verified offer URLs take priority over seed URLs in the bounded product research fetch list.
- General buying guidance now covers drills, clothing, furniture, toys and packaged groceries. It remains explicitly distinct from verified model specifications.

## Feature checklist

Statuses refer to this audit unless explicitly marked historical. A narrowly passing example does not validate the whole category.

| Feature | Status | Evidence / remaining work |
|---|---|---|
| Gallery/files photo picker | passed | Original user Nike shoe uploaded through actual live browser chooser, without typing a replacement name. |
| Camera capture on real phone | untested | Cloud browser has no physical phone camera. Capture controls exist; device journey still needed. |
| Drag/drop | untested | Existing implementation inspected; real drop not exercised this audit. |
| Photo identification | failed | Shoe, paint, tissues and microphone families recognised. Exact model still partial. Shure suggestions include incorrect U87/SM58; cannot claim reliable model identification. See saved raw diagnostics. |
| Barcode OCR from photograph | untested | No legible real barcode photo exercised in this audit. |
| Text search | passed | Ten category queries reached production search and commerce APIs. This does not mean those searches found offers. |
| Barcode catalogue search | untested | Existing tests cover validation/matching; live catalogue coverage not established. |
| Product Info | failed | Logitech exact-page research works when supplied verified offer; Marc Anthony research works. Other eight baseline queries have no researched exact information. Shoe browser shows family guidance and unconfirmed hypotheses only. |
| Ask FindIt | untested | Evidence answer unit suite passes; full real browser dialogue remains to be retested. |
| Exact retailer verification | failed | Positive Logitech and Marc Anthony examples; eight baseline categories/queries return zero offers. No invented offers accepted as success. |
| Price/currency extraction | passed | Logitech R2299 ZAR; Marc Anthony Dis-Chem R206.99 ZAR / Clicks R230 ZAR; verified product URLs recorded. Broad category coverage remains failed. |
| Online availability | passed | Above exact retailer listings report online availability; branch stock flags remain false. |
| Branch inventory | blocked | No connected authoritative branch inventory feed. Online availability and map presence do not prove shelf stock. Public pickup lead times must be treated separately if implemented. |
| Nearby lookup | untested | Existing official/OSM adapters and prior branch evidence preserved; fresh full location journey pending. |
| GPS permission/denial | untested | Browser had no supplied location during shoe journey. No user coordinates invented. |
| Manual town/location | failed | No town/postcode entry implementation found in active dashboard. |
| Radius/distances/maps/directions | untested | Earlier tests exist; latest actual customer journey with branch results pending. |
| Addresses/phones/hours/status | untested | Prior official branch adapters preserved. Cannot claim all retailers covered; current branch-by-branch live checks pending. |
| Premium Beta activation | passed | Actual live UI activation through “Activate Premium Beta — Free”; no payment. |
| Saved/history/shopping list | untested | Existing tools preserved; persistence/reopen journey pending. |
| Watchlists/alerts/deals/collections/favourites | untested | Existing tools preserved. Background monitoring/delivery must be distinguished from local recorded observations. |
| Feedback/feature delivery | blocked | Current health reports feedbackEndpoint:false. Vercel Formspree variable exists as sensitive; connector cannot retrieve its value. Legacy URL returns DEPLOYMENT_DISABLED. Requires FORMSPREE_ENDPOINT configured in Cloudflare; no secret was published. |
| Analytics | blocked | Cloudflare API explicitly returns stored:false. Historical 57/58 counts were visitors, not feedback submissions. Central event persistence is not configured. |
| Every button/menu/settings path | untested | Full interaction sweep pending; old green CI is not equivalent to all information working. |
| Mobile/desktop layout | passed (historical) | Oct14 eight-width production layout regression passed. Fresh post-change regression required. |
| Accessibility | untested | No full keyboard/screen reader/contrast audit this run. |
| Loading/reliability/performance | failed | Browser had one interaction timeout and slow photo flow. Recovery worked. No load test or performance budget established. |
| Local automated suite | passed | 202/202 Node tests, zero failures. Syntax checks passed. Mocked and local checks are not counted as live retailer coverage. |
| Frontend/backend deployed version | untested | New repair deployment verification recorded separately below when complete. |

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
