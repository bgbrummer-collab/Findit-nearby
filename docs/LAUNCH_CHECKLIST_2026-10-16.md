# FindIt launch audit — 16 October 2026

**Recommendation: NOT launch-ready.** This is a repair checkpoint, not a completion certificate. Existing design and features were continued from GitHub main. Prior conversations, the 15 October checkpoint, code/history, workflows and live Cloudflare deployment were reviewed.

Production: https://findit-nearby.bgbrummer.workers.dev/

Application-code release: `abb0d739fcb066f062dae22144f712a55144227f`. Backend `/api/version` and browser build metadata both returned this release. Final packaging release: `0395ea3c56f53afc5475166eb2d1da7f65ef8936` (same application code; additionally packages robots.txt and sitemap.xml). No paid service, billing change or purchase was introduced.

## Repairs published in this session

1. Validate uploads before dashboard and legacy chooser/drop bridges mutate state. Non-image, empty and over-8-MB files preserve the previous valid selection and show an error. Gallery and camera-input transports use the same guard.
2. Add manual map-point selection and coordinate entry without GPS permission or a paid geocoder. Coordinates are validated and are session-only. The interface explains that distances use the selected point. Town/postcode geocoding is not implemented.
3. Reject nearby responses belonging to older locations, radii, products or photos across the core, fallback, typed-search and photo-research paths. Respect the actual selected radius when widening a search.
4. Correct canonical/Open Graph/sitemap/robots references from obsolete hosting to the production Workers URL. Reproduce the live sitemap 404 and correct the deployment asset-copy filter to include robots.txt and sitemap.xml.
5. Discover LEGO Certified Stores' public catalogue through its search interface. Parse its native Shopify product data when bound to the canonical product and one unambiguous variant, with corroborated published currency. Preserve real price/availability/SKU and description. Never convert a SKU into a barcode. Reject multiple variants, unrelated canonical pages and currency conflicts.
6. Reuse independently fetched official Sportsmans locator evidence for branch contacts and schedules. Require both branch name and coordinates to match; never trust client-supplied hours as verification. Handle weekday/public-holiday rules without inventing missing days.
7. Clear a previous photo preview for a new text search, including a brand/product-family search. Preserve it only for an explicit retailer-candidate confirmation.
8. Reject IP, IPv6, local/internal, credential-bearing and nonstandard-port destinations before store-website checks issue requests.
9. Reuse parsed exact-product evidence for identity, price and availability rather than parsing each full retailer page four times. This reduces CPU work; it is not proof that all Worker resource-limit failures are fixed.
10. Prevent toy descriptions mentioning windows from being categorised as Windows operating-system compatibility.
11. Add live-data coverage and production browser regressions. Empty offers fail the live-data matrix rather than count as success. Browser checks test real upload bridges, invalid inputs, camera-input transport and drop events at three widths.

## Feature checklist

A passed row is scoped to its evidence; it does not establish universal product coverage. Historical evidence is explicitly identified.

| Feature | Status | Evidence / limitation |
|---|---|---|
| Gallery/files picker and preview | passed | Actual cloud-browser upload of original conditioner/shoe fixtures. Production browser regression also verifies transport at 390/768/1440 px. |
| Invalid/oversized upload handling | passed | Live text-file rejection; browser regression verifies oversized files preserve valid selections, including camera input. Local tests cover empty files. |
| Camera file-input transport | passed | Production browser regression at three widths. |
| Physical phone camera capture | untested | No physical camera is available in this environment. |
| Drag/drop event transport | passed | Production browser regression dispatches a real File/DataTransfer drop event through deployed handlers; physical OS drag remains untested. |
| Photo brand/family/model/variant identification | failed | Conditioner returned only MARC ANTHONY product; shoe returned no agreed identity. Separate conditioner API probe returned provider failures/timeouts and no consensus. No typed replacement was counted as a successful photo journey. |
| Photo barcode OCR | untested | No legible real barcode photo journey tested this session. |
| Text search | passed | Ten real query journeys through production APIs. Returned useful data varies, as shown below. |
| Barcode catalogue search | untested | Local matching checks exist; live catalogue coverage is not established. |
| Product details/specifications/compatibility | failed | Useful sourced LEGO/Logitech/beauty/clothing examples; missing research for several other categories. Toy-window compatibility misclassification repaired. |
| Ask FindIt | untested | Previously tested limited headset compatibility/price examples remain historical evidence; no broad new answer-quality sweep this session. |
| Exact retailer discovery | failed | Final release: five of ten live-category cases pass. No unrelated product was accepted to hide missing results. |
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
| History | untested | Earlier display checks are historical; not every History+ tool retested. |
| Deals/collections/favourites | untested | Existing tools preserved. Complete usefulness/persistence sweeps remain. |
| Premium Beta | passed | Free activation occurs in real saved-product browser regression; no payment. Every Premium tool is not validated. |
| Feedback/feature delivery | blocked | Production configuration reports feedbackEndpoint:false. Copy recovery remains available. Requires existing FORMSPREE_ENDPOINT configured securely in Cloudflare. |
| Analytics persistence | blocked | Existing handler does not persist central events; prior visitor counters are not feedback counts. Storage integration is required. |
| Every button/menu/form/settings path | untested | Several smoke/commerce/interaction suites run, but not every tool/data path is exhaustively verified. |
| Desktop/mobile layout | passed | Production and local browser checks at eight widths, plus manual-location/upload checks at three widths. Full physical-device testing remains untested. |
| Accessibility | untested | No complete keyboard, screen-reader or contrast audit. |
| Performance/reliability | failed | Provider timeouts and intermittent Cloudflare HTTP 503 / error 1102 reproduced. Repeated parsing reduced; broad load/resource reliability not established. |
| Local automated checks | passed | 220/220 Node tests in a fresh worktree of the published release; syntax checks passed. |
| Frontend/backend deployment consistency | passed | Final API version and actual browser build metadata match code release above. |

## Live evidence and run interpretation

- `launch-evidence-2026-10-16/preceding-live-data-matrix.json`: release 9aa4429, four of ten category cases passed; music failed with a non-JSON response. A separate direct microphone request reproduced HTTP 503 with Cloudflare `error code: 1102`. That failure is retained, not overwritten by an earlier successful run.
- Earlier d4d402e matrix passed five of ten including Bothners MV7+ at R6695/R6995. The failed categories in both runs were Coca-Cola Original Taste 2L, Nike Air Force 1 Low White Blue, Bosch GSB 18V-50, IKEA BILLY bookcase 80x28x202 white and Twinsaver Comfort 3 Ply Tissues 120.
- `launch-evidence-2026-10-16/official-branch-hours.json`: production official Menlyn evidence after the hours repair.
- `launch-evidence-2026-10-16/conditioner-photo-diagnostics.json`: unchanged original photo API probe, retaining provider failures and inconclusive OCR.
- `launch-evidence-2026-10-16/preceding-browser-checks.json`: successful 9aa4429 responsive/upload/location/saved/watchlist/settled-list checks. GitHub run 38945069422. Layout checks include 390, 768, 901, 1024, 1180, 1273, 1440, 1920 px locally and in production.
- The Korg Pitchclip 2 uncommon discovery workflow failed on d4d402e (run 38944410816); logs show no verified exact product page. Do not count it as passed because another environment or product worked.
- The local browser runner could not download Chromium in this environment; GitHub's browser runner succeeded. The cloud browser was used independently for real manual-location and photo/product interactions.

Final-release matrix is `launch-evidence-2026-10-16/final-live-data-matrix.json`: both start/end API versions are abb0d739, and five of ten cases passed. The final microphone retest succeeded after the parsing optimisation; the earlier error 1102 remains recorded and no broad resource reliability claim is made. The actual final-release LEGO browser showed its published description, SKU, correct LEGO compatibility sentence, source links, R559 comparison and online/branch-stock distinction. The final original-shoe upload again returned no agreed identity. Screenshot: `launch-evidence-2026-10-16/final-lego-product-info.jpg`. Final browser workflow 38945854621 passed eight local and eight production widths, upload/location checks at three widths, and saved/watchlist/settled-shopping-plan checks. A green CI result cannot override the real photo/data coverage failures above.

## Required access and continuation checkpoint

No credentials should be pasted into chat. Configure the existing feedback endpoint securely in the Cloudflare provider environment. Central analytics storage, authorized branch-inventory data and background alert/notification delivery require suitable integrations; none was purchased or activated.

Further engineering remains independently actionable: improve recognition reliability without promoting guesses; implement/research additional correct retailer search adapters; profile/bound resource usage on long commerce requests; finish the untested menu/tool/accessibility and device journeys. Do not describe all remaining work as a credentials blocker.

Resume from GitHub main/final packaging release above. The clean verification worktree is `/workspace/scratch/dfb28728663c/Findit-reviewed`. Original audit checkout is `/workspace/scratch/dfb28728663c/Findit-nearby`; it contains local copies of published patches and a temporary node_modules symlink. Do not force-push its older local HEAD. All published code was created through the authorized GitHub connection with expected-parent leases.

All twelve workflows for application-code release abb0d739 completed successfully, including the Interaction Freeze, full/final production audits, release smoke, responsive and commerce checks. These outcomes do not validate missing retailer data or failed real-photo identification.

Final packaging verification: `/api/version` and homepage build metadata both returned 0395ea3c56f53afc5475166eb2d1da7f65ef8936. `/robots.txt` and `/sitemap.xml` both returned HTTP 200 with the correct production sitemap/URL. See `launch-evidence-2026-10-16/packaging-verification.json`.

The original shoe photo was uploaded again through the actual chooser after the final 0395ea3 packaging deployment, without entering a product name. The final UI again displayed Product not identified and no verified offers. See `launch-evidence-2026-10-16/final-photo-journey.json`.

Empty offers in this audit mean FindIt failed to retrieve/verify an exact listing; they do not establish that the product is unavailable in the real world. Retailer-specific search-adapter coverage remains engineering work.

All nine workflows triggered for final packaging release 0395ea3 completed successfully, including responsive/upload/location/saved-item, commerce, production smoke, release smoke and Interaction Freeze checks. See `launch-evidence-2026-10-16/packaging-workflows.json`. This does not override the live-data/photo failures.

## Final continuation — 16 October, 19:15 UTC

Deployed code: `03ce5aaca4db2063847974b172c683def91e6d68`. Production API version and browser build metadata both match. No paid services were activated.

Additional repairs: overlap primary/secondary vision requests after a 200 ms quota-aware hedge, preserving time for final corroboration; preserve complete printed label candidates without asserting exact identity; add TMB Supplies Shopify discovery, route Bosch GSB/GSR families correctly, and distinguish bundle ` + ` from attached Plus model suffixes. Regression checks: **223/223 local Node tests passed**, syntax/diff checks passed.

Final actual browser journey uploaded the original Nike shoe through the file chooser, clicked Identify & Find, and waited for the result without typing a replacement. UI now shows NIKE shoes and requires exact-model confirmation; API retains NIKE Air Force 1 as an unconfirmed label candidate. Scout failed and LLAVA reported unsupported; the surviving provider alone does not establish exact identity. Thus photo identification remains **failed**, with useful partial recovery. Screenshot is retained locally as `/workspace/scratch/findit-final-photo-20261016.jpg`.

Final live API matrix (`launch-evidence-2026-10-16-next/live-data-matrix.json`) remains **5/10 passed**, stable on this release: electronics, beauty, clothing, toys, music. Groceries, shoes, tools, furniture and household exact discovery failed. The local native Bosch adapter independently verified a TMB GSB 18V-50 kit (two 2 Ah batteries and charger), R4999 ZAR and online stock, but production's complete matrix returned no offer. This adapter is NOT counted as a completed production repair. Retailer adapter/discovery reliability still needs investigation.

Latest CI: regression, smoke, Cloudflare deployment, Pages, live photo probe, dashboard commerce, production smoke and release smoke passed. Uncommon Commerce Regression failed: no verified exact retailer page discovered (run 38953123225, job 117149209668). Local Korg success does not override this CI failure. Interaction Freeze was still running at the recorded check. A passing photo probe does not establish exact identification.

All checklist statuses above continue to apply except local test count is now 223. Critical remaining work: reliable real-photo exact identification; the five failing category searches; uncommon discovery and production/native discrepancies; wider product/Ask FindIt usefulness; full tools/navigation/accessibility/device regression. Integration blockers remain secure feedback endpoint configuration, authoritative branch inventory, analytics persistence and background alert delivery. These are not all credentials blockers; independent engineering and untested journeys remain.

Resume from GitHub main with code release 03ce5aa. Current worktree: `/workspace/scratch/dfb28728663c/Findit-next` (detached earlier HEAD with published changes); fetch before further work, use expected-parent leases, never force-push. **Recommendation remains NOT launch-ready.**
