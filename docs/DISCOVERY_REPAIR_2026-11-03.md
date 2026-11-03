# Discovery queue repair — 3 November 2026

Decision: NOT LAUNCH-READY. This report records a focused local repair; production verification is pending.

## Confirmed failure and root cause

Production commit 692001060011197d5a2391f2d36fa77037777a6e was checked through the normal Search Product form with `Accu-Chek Instant blood glucose meter`. The result had no exact retailer listing, no price and no useful product information. The DOM evidence is recorded alongside the staged matrices. A separate direct verifier accepted Dis-Chem's actual Instant Meter product page, with R284.99 ZAR, online availability and explicitly unverified branch stock.

The core concatenated up to 32 web candidates ahead of native retailer candidates, then verified only the first 12. A full web batch could prevent any native catalogue page being inspected. This is candidate starvation, independent of strict identity validation.

## Focused repair

Share the existing 12-page verification budget between native and web candidates, after existing known candidates. Continue with whichever source has unused candidates. Collapse only known analytics query parameters when allocating verification slots and deduplicating offers without SKUs. Preserve variant, country and unknown query parameters. Preserve same-listing conflicting-price rejection. Rotate the browser offer cache namespace so prior empty or duplicate results are not retained.

No identity threshold was relaxed; no product URL, SKU, model or fact was added to runtime code. The synthetic end-to-end regression reproduces web starvation before the repair and verifies the native exact product afterwards. Variant preservation and price-conflict regressions also pass.

## Verification

- 685 automated tests passed, zero failed. Syntax and diff checks passed.
- Local Worker with actual public sources: 6/16 broad cases meet the existing strict requirement of an exact listing, verified price and useful attributed research. The previous strict matrix was 5/16; the additional success is Accu-Chek. Source prices fluctuate; this is not a controlled proof that every difference is caused by this change.
- Frozen independent typed-search holdout: 3/8 meet that same threshold (Logitech M185 grey, LEGO 31136 and Levi's 511 Multi Colour). JBL 520BT, Clinique serum, Samsung A16 and Gardena lopper fail. Casio FX991ZA has a matching page but no verified price or useful research. Levi's still needs waist/length selection; a broad model query is not an exact clothing SKU.
- Neither matrix tests photo identification, branch inventory, mobile hardware or the premium assistant. Holdout reference URLs are recorded for review and are not passed into discovery.
- Public native-source diagnostics cover all eleven prior failed examples. No human-verification challenge was detected by this harness. Some sources returned 429, timeouts or 404; these are recorded without treating them as successful reads.

## Internal issue tracker

| Issue | Priority | Root cause / evidence | Proposed next step | Required acceptance evidence |
|---|---|---|---|---|
| Native candidate starvation | P0 | Web-first truncation skips exact native product | Balanced queue, staged here | Hosted checks and same production UI search must recover source-backed listing |
| Broad exact discovery | P0 | 10/16 broad cases and 5/8 holdouts fail usefulness; adjacent models/source gaps | Investigate each failure; retain exactness guards | Normal customer searches, primary links and useful sourced facts |
| Photo model/variant consistency | P0 | Prior audits identify uncertainty/variant gaps | Continue novel real-photo matrix | Real uploads on production; correct uncertainty and no borrowed variants |
| International routing | P1 | Core retailers and native catalogues remain South Africa oriented | Propagate country into routing before adding coverage | ZA/US/UK/AU browser cases with actual local sources/currencies |
| Backorder display | P1 | Backend repair #358 returns backorder; Top Stores maps it to unknown | Render supported backorder/preorder labels | Actual selected-variant browser link and displayed label |
| Vendor shown as brand | P1 | Central Vet metadata noted in prior audit | Separate publisher/vendor from product brand | Primary product evidence and correctly attributed UI |
| Ask FindIt and Saved | P1 | Current test session is Free; premium controls block these paths | Verify through an authorized entitled test session | Real question/answer and save/reload flows; do not bypass entitlement |
| Nearby, maps, directions | P1 | Exact-coordinate request previously rejected by automatic review; not retried | Continue non-location fixture checks; obtain authorized live test path | Permitted location, actual pins/distances and no branch-stock inference |
| Mobile hardware | P1 | Desktop browser evidence does not prove physical phone camera/permissions | Test real mobile device | Photo, gallery, camera, maps and navigation evidence |

Prior fixes #353–#358 were reviewed and retained. This repair neither changes entitlements nor introduces a paid provider, credentials or deployment infrastructure.
