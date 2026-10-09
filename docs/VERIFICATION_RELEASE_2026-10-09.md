# FindIt Nearby — verified improvements and outstanding work

This is a development checkpoint, not a claim that FindIt is finished. Existing design, features, repository and Cloudflare deployment were retained. No paid service or plan was activated.

## Released fixes

- Clicks discovery now tries the broader brand search when the exact search misses the item. Candidates are ranked together before the verification budget is applied; exact brand/model/size requirements remain mandatory.
- Literal generated JSON-LD is parsed safely without executing retailer JavaScript. Clicks brand-only names require the exact product description. A dynamic image identifier cannot supply price, currency or stock evidence.
- Corrected actual retailer search routes for Dis-Chem, BUCO, HiFi Corp, Toys R Us, PNA and GeeWiz. Electronics searches include the working adapters within their discovery budget.
- Added toy/LEGO and footwear discovery terms. Fixed misleading category substring matches for Caterpillar, smart products, BabySoft and bookcases. Internal apostrophes no longer prevent Kelloggs/Kellogg's matching.
- Fixed Toys R Us retailer naming; unknown sellers retain their actual domain rather than an invented business name.
- Legacy retailer discovery now uses the same exact-product, structured price/currency and stock verifier as the primary commerce API. Removed page-wide price and add-to-cart stock inference.
- Removed a product-specific photo heuristic that overwrote independently reported identity details. Provider identity claims are logged as diagnostics, not accepted as verified facts. Real accuracy remains unverified under the exhausted free quota.
- New photo selection clears the previous product labels and retailer counts. Repeated rendering avoids rewriting unchanged value-strip content and restarting observer feedback loops.
- Research reads the actual product-description container, excludes neighbouring recommendations, retains complete sentences and handles abbreviations such as T.rex. Purpose, supported strengths and considerations come from source text. Conflicting colour-variant descriptions are rejected even when the retailer's product title and price are correct.
- Corrected the upload regression's isolated API fixtures and URL-constructor shadowing. Deployment now runs on all ordinary main pushes so exact deployed-commit verification also works for test-only releases.
- Reduced redundant live photo calls from CI. The real single-photo check remains enabled for relevant code changes and the complete five-image matrix remains available manually. Photo failures have not been converted into passes.

## Genuine production commerce probes

Raw responses and timestamps: [category-production-results-final-2026-10-09.json](category-production-results-final-2026-10-09.json). These ten probes ran against deployed commit `b951511f29653a265f54e544ad67bf47c319fb4e`. Subsequent releases changed research, result reset and CI; these responses must not be misrepresented as newly rerun on a different commit.

| Product | Verified result at test time |
|---|---|
| Sony WH-1000XM5 black | Incredible Connection and HiFi Corp, R5,999 each; online in stock |
| Nivea Rich Nourishing Body Lotion 250ml | Clicks, R59.99; online in stock |
| LEGO Classic Creative Dinosaurs 11041 | Toys R Us, R649.90; online in stock |
| Kelloggs Corn Flakes 500g | No exact offer verified |
| Levi 501 Original Fit Jeans | No exact offer verified |
| Nike Air Force 1 07 white | No exact offer verified |
| Bosch GSB 185 LI drill | No exact offer verified |
| LEGO Classic 10698 | No exact offer verified |
| IKEA Billy white 80x28x202cm | No exact offer verified |
| BabySoft 2 ply 9 rolls | No exact offer verified |

All ten API requests returned HTTP 200, taking approximately 8–29 seconds. This is not a load/performance certification. An empty result does not prove that no retailer sells the product. Every accepted offer explicitly reports branch stock as unverified. Prices may change after these observations.

## Browser evidence

Actual production interactions, without retailer fixtures, verified the Nivea and LEGO results, direct product links, the researched LEGO purpose, four supported strengths and two sourced considerations. The public Marc Anthony photo was uploaded through the real gallery/file chooser. The real quota failure released the loading state and exposed search-by-name recovery. A new photo cleared previous product counts.

- [Latest deployed Sony result](findit-sony-latest-2026-10-09.jpg)
- [Verified Nivea result](findit-nivea-verified-2026-10-09.jpg)
- [Researched LEGO information](findit-lego-research-2026-10-09.jpg)
- [Verified LEGO retailer result](findit-lego-store-2026-10-09.jpg)

Screenshots record the actual release visible when captured; they are not mockups. Later manual Sony testing found both R5,999 offers and exposed stale silver-variant copy on the black retailer page, leading to the additional colour-conflict fix. The subsequent real browser retest on `b3ff631199bbeda5795813ab011471ae4e30cdcb` again returned both R5,999 offers and now showed matching product facts without the conflicting silver description.

## Verification and deployment

- **Deployed application commit:** `b3ff631199bbeda5795813ab011471ae4e30cdcb`. Wrangler deployment succeeded: [run 37991243765](https://github.com/bgbrummer-collab/Findit-nearby/actions/runs/37991243765). Production `/api/version` returned this exact SHA. The later documentation checkpoint is intentionally not an application redeployment.
- **Unit tests:** 103 passed, zero failed/skipped. Worker/runtime syntax checks and `git diff --check` passed.
- **Full local and deployed browser interaction suite:** [run 37991243839](https://github.com/bgbrummer-collab/Findit-nearby/actions/runs/37991243839) passed both stages. Covers desktop/mobile retailer cards, settings, product information, closing slow research, comparison, online/branch stock separation, Ask FindIt, controlled feedback/suggestions, Smart Choice, shopping tools, store hours, responsiveness, current-find relevance, upload action, quota recovery and clearing old retailer counts.
- **Release smoke:** [run 37991243807](https://github.com/bgbrummer-collab/Findit-nearby/actions/runs/37991243807) passed, including exact-product web research integration. Production smoke, dashboard commerce regression and ordinary smoke/regression checks also passed on this SHA.
- **Real photo probe:** [run 37991243851](https://github.com/bgbrummer-collab/Findit-nearby/actions/runs/37991243851) failed. The actual response was `PHOTO_DAILY_LIMIT_REACHED`, `identification:null`, `visionDiagnostics:[]`. This is a critical unresolved check, not a passing identification.
- Earlier upload regression failures were repaired (isolated fixtures and URL shadowing); earlier superseded runs were cancelled by the new release. The latest completed full interaction run passes. The genuine photo failure remains.
- Production feedback-health was checked at `2026-10-09T21:09:20.636Z`: `feedbackEndpoint:false`, `checksAreConfigurationOnly:true`.

Browser regressions use controlled API responses to verify interface behavior. Their passing results cannot establish live provider accuracy, real feedback delivery, branch inventory or hardware camera/GPS functionality. Genuine production probes and manual observations are listed separately above.

## Critical remaining limitations

1. **Photo identification has not passed real accuracy verification.** A clear Marc Anthony conditioner photo previously produced conflicting specific identity claims. Subsequent probes fail with `PHOTO_DAILY_LIMIT_REACHED` because the free Cloudflare Workers AI allowance is exhausted. Removing the heuristic still requires a real retest after quota resets; a reset alone is not evidence of accuracy. No paid upgrade was made.
2. **Coverage is incomplete.** The sampled grocery, clothing, footwear, tools, furniture and household products returned no verified exact offers. The original LEGO 10698 also returned none, although another current LEGO item works. Reliable sources/discovery must improve before broad-category completion can be claimed.
3. **Nearby branch inventory is not supplied by verified retailer integrations.** Online stock does not establish branch stock. Hardware GPS, real-world distance/directions and branch inventory have not all passed end-to-end verification.
4. **Feedback delivery is not configured on the Cloudflare Worker.** Read-only inspection confirmed an existing `FORMSPREE_ENDPOINT` in FindIt's old Vercel production configuration. It was not exposed or committed. The connected tools do not offer Cloudflare/GitHub secret writes to transfer it. Live `/api/feedback-health` is configuration-only; fixture feedback tests do not establish delivery. The endpoint needs a secure transfer to the existing Worker configuration, followed by an authorized delivery test.
5. Hardware camera capture, exhaustive barcode/size matching across categories, sustained load testing, international location/currency behavior and the full real-photo matrix remain unverified. Unit tests cover important matching and currency failure cases but do not replace these real-world checks.

## Resume sequence

Start from current remote main and its tree; preserve concurrent audit changes. Confirm `/api/version` matches the intended deployment. After free AI quota resets, rerun the genuine single-photo probe and investigate each provider identity claim; then run the five-image matrix. Resolve category source/discovery gaps without accepting unrelated products or inventing data. Securely transfer the existing feedback endpoint to Cloudflare. Verify actual mobile camera/GPS, directions and branch evidence. Repeat appropriate tests and production verification before declaring completion.

Live website: https://findit-nearby.bgbrummer.workers.dev/
