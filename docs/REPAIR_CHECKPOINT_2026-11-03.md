# FindIt continuation — 3 November 2026

## Recovery milestone — verified

The prior workspace command completed successfully and left a clean tree. GitHub main and the live Worker both report d219c95889332543b578a1b2bfa028c8a207c5e9. PRs #353–#356 are merged. Acceptance evidence is saved separately at 547edb6c3762112469e2cf45334e266779fc17b0 on verification/acceptance-20261102. No incomplete push or lost code was found. The Work interface being stuck does not establish a failed Git command.

## Product-information milestone — verified on production

Reproduced the Royal Canin Mini Adult 2 kg failure through the actual production search form: correct Petworld R370 listing, but only a SKU and generic guidance in Product Info. The fetched publisher page contains a ProductGroup description and two child Product records. FindIt reads the child, whose description is absent, and never uses the parent description.

Research now reads that parent text only after the child independently matches. Require direct group membership, explicit matching primary-page addresses, consistent parent/child identity and brand, and matching published purchase quantities. A 2 kg annotation cannot supply 8 kg facts. Own child descriptions win; unrelated pages, missing provenance, conflicting names and recommendation lists remain excluded. Do not inherit prices, stock, SKUs, barcodes or identity. A trailing pipe/bullet pack annotation is validated, then excluded from prose so the preceding complete EPA-DHA sentence survives extraction. This is a generic ProductGroup repair, not stored product facts or a product-name exception.

The affected child recovers source-attributed functional text. Regression evidence retains 370/1160 prices unchanged and rejects inherited 2 kg text for 8 kg. Live-source staging confirms a useful 2 kg description and no borrowed 8 kg description. Local suite: 679 passed, 0 failed; syntax and diff checks pass. At that staging checkpoint, hosted checks and production UI verification remained required; completed Product Info verification is recorded below. Ask FindIt remains blocked.

The broad live-data gate now excludes SKU-only research and repeated product titles. It requires substantive attributed claims or at least two attributed non-identity technical fields. This corrects the weak 5/16 metric noted in the previous acceptance report; a changed metric is not claimed as an improved coverage percentage.

## Outstanding limits

Photo model/variant consistency, broad retailer coverage, Korg discovery, authoritative branch inventory and physical Samsung testing remain unfinished. Nearby production verification was not completed in this continuation: automatic approval review rejected a request containing exact test coordinates. That request was not retried or routed through another transport. Local fixture tests and public-source inspection can continue without transmitting coordinates. No new paid service, provider, secret or billing configuration was introduced.

## Deployed acceptance milestone

PR #357 is merged as fd01808738c0b3e0532b850a4ba30e7390755c97. All four PR checks passed before merge. Cloudflare deployment succeeded and /api/version returned that exact commit. Through the actual desktop customer search form, the 2 kg result showed source-linked small-breed energy/weight purpose and the publisher EPA-DHA claim. R370 online offer and branch-stock-unverified labels remained. The 8 kg search showed its own SKU and R1160 offer, with no inherited 2 kg description or strength. This is a pass for the repaired extraction/variant-isolation behavior; overall product information remains PARTIAL.

Evidence: launch-evidence-2026-11-03/product-info-production.txt and eightkg-production.txt. Screenshot was captured from the actual production dialog. All 679 local tests passed. Source fixture tests include unrelated groups, brands, pages, quantity units and another non-food category. No working UI was redesigned.

Ask FindIt browser verification remains blocked: automatic approval review rejected clicking “Activate Premium Beta — Free” because it changes access entitlements without specific authorization. No activation or indirect workaround was attempted after rejection. Exact-coordinate production nearby verification remains blocked separately as recorded above. Safe public locator reads, without coordinates, parsed 93 Incredible and 58 South African HiFi Corp branches. An initial inspection used the wrong HiFi Corp source URL spelling (extra slash); correcting the local test input proved the parser works. No parser repair was warranted.

## Latest live coverage measurement

The stricter 16-case API matrix ran against stable fd01808 at start and finish. Five cases passed: Logitech G502 HERO, SteelSeries QcK Heavy Large, Sony WH-1000XM5 black, Royal Canin Mini Adult 2 kg, Canon EOS R50 body. Eleven failed: RowErg, Corolla Cross, Keychron K2, Omron M2 Basic, Accu-Chek Instant, Philips NA230/00, HP DeskJet 2820, Gardena shears, Philips Hue E27, Casio calculator, JanSport backpack. This count uses the new useful-facts criterion, so is not a direct improvement percentage over the prior coarse metric. Mouse-pad/camera colour differences still prevent a universal identical-variant comparison. JanSport has a USD priced listing and a source with unknown price, so cannot pass the complete priced-offer gate. Missing offers are retrieval failures, not evidence that retailers do not sell the product. API journeys do not constitute photo tests or complete browser acceptance.

Raw requests/responses and summary: launch-evidence-2026-11-03/broad-matrix-production.json and .log.

## Remaining issue tracker

| Priority | Problem / evidence | Root cause or uncertainty | Next repair / verification requirement |
|---|---|---|---|
| P0 | Broad discovery incomplete in 11/16 live journeys | Existing public-source discovery/verification coverage insufficient; per-source causes not established for every case | Diagnose source retrieval and candidate rejection per category; preserve exact-match gates; verify primary pages and actual browser searches |
| P0 | Photo model/variant consistency | Readers disagree; visible labels may be insufficient | Diverse unseen real photos, honest uncertainty, full deployed upload flow |
| P1 | Nearby previously returned empty | Public locator data exists; production request path not reverified this turn | Permitted test-location end-to-end run, pins/distances and source availability evidence |
| P1 | Physical stock unavailable | No authoritative SKU-by-branch inventory feed | Authorized retailer data integration; retain unverified branch stock until proven |
| P1 | Ask FindIt new-context verification pending | Free beta activation rejected by automatic review | Specific permission to activate existing beta; test grounded answers through UI |
| P1 | Physical mobile parity incomplete | Cloud browser/hosted tests cannot prove Samsung permissions and capture | Physical camera/gallery/GPS/barcode acceptance and responsive real-data paths |
| P2 | Duplicate 8 kg Petworld offers displayed | Same page/variant differs only in Shopify search tracking parameters; canonical deduplication gap | Reproduce, canonicalize only tracking keys while retaining variant identity, regression and production UI test |

## Feature acceptance status

Prior scoped acceptance evidence remains on verification/acceptance-20261102 at 547edb6; no prior pass is silently broadened to all products or re-certified on the current commit.

| Feature | Status | Test performed / evidence | Remaining problem |
|---|---|---|---|
| Photo identification | PARTIAL | Prior actual photos; current hosted live photo probe | Diverse exact model/variant consistency unproven |
| Text search | PARTIAL | Actual 2 kg/8 kg production forms; 16 live API cases | Broad discovery failures |
| Barcode search | PARTIAL | Prior recorded scoped tests | Physical capture and broad exact coverage incomplete |
| Product information | PARTIAL | Repaired source-group facts and 8 kg isolation verified through production UI | Many products still lack useful verified facts |
| Ask FindIt | NOT TESTED | New deployed-context browser attempt blocked at beta entitlement activation | Permission needed; prior grounding evidence not a new-context pass |
| Retailer matching | PARTIAL | Genuine primary-page offers; negative variant guards | Eleven matrix journeys incomplete; duplicate listing observed |
| Prices and currency | PARTIAL | Actual R370 and R1160; live matrix ZAR sources | Missing prices, foreign sources and variant comparability |
| Stock information | PARTIAL | Actual online vs branch-unverified labels | No authoritative branch inventory |
| Nearby stores | FAIL | Prior actual empty journey; current locators readable | Production nearby reproduction blocked this turn |
| Maps | PARTIAL | Prior tile/manual-map evidence | Populated real nearby pins/directions and physical navigation incomplete |
| Saved items | PASS | Prior scoped device-local save/reload/reopen evidence | Not rerun this turn; no cross-device guarantee |
| Search history | PASS | Prior scoped reload/reopen evidence; current recent queries visible | Full History+ sweep not certified |
| Mobile functionality | PARTIAL | Hosted responsive interaction checks | Physical Samsung and full real-data parity unverified |
| Desktop functionality | PARTIAL | Actual deployed search/info and variant checks | Assistant blocked; broad coverage incomplete |
| Deployment | PASS | Exact browser build and /api/version 6920010, successful Cloudflare deployment | Deployment success is not launch readiness |

**Launch decision: NOT READY.** Targeted extraction defect is fixed and verified; the broader product-data and physical-device blockers remain.

## Final stock follow-up — production 6920010

PR #358 merged as 692001060011197d5a2391f2d36fa77037777a6e after all four PR checks passed. 682 local tests passed. The actual retailer link selected 8 kg / SKU3182550716888 / R1160 and showed Backordered, contradicting its generic JSON-LD InStock. The primary selected-variant/SKU guard now returns backorder, as verified from the real production commerce API. The actual customer card no longer says Online in stock: it shows Online stock not verified. Thus suppression of the false positive is verified, but full stock presentation is PARTIAL because that card does not display the available backorder status. Branch stock remains unverified. Evidence: stock-production.txt, stock-production-api.json, stock-before-regression.log and the stock repair report on main.

The final 6920010 2 kg customer search retained its useful source-linked purpose and EPA-DHA claim and R370 offer. Evidence: product-info-final.txt and product-info-final.jpg. Both frontend build metadata and /api/version matched 6920010. The 16-case matrix above is from fd01808; it was not represented as a rerun on the later stock-only release.

Additional outstanding P1 accuracy issue: the later 8 kg search discovered a Central Vet source, displayed its published Brand as Central Vet Midwater, and reused that as a product brand despite Royal Canin in the product name. Publisher/vendor metadata needs identity consistency validation. The new 8 kg description is from that independently matched source, not inherited from Petworld 2 kg. No universal product-information pass is claimed. Additional P2 presentation issue: explicit backorder/preorder should remain visible consistently across result cards, comparison and assistant views; the backend value is currently lost in the Top Stores card label.

[Final product-information screenshot](launch-evidence-2026-11-03/product-info-final.jpg). Detailed stock cause, regression fixture and staging evidence: VARIANT_STOCK_REPAIR_2026-11-03.md. The remaining issue tracker and PARTIAL/FAIL/NOT TESTED classifications above still apply. No final launch sign-off was issued.

Final workflow verification: all ten runs triggered by 6920010 completed successfully, including the deployed interaction regression. Snapshot: launch-evidence-2026-11-03/final-release.json. This does not certify the broad matrix failures or blocked browser checks.
