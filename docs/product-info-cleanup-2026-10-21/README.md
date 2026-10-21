# Product information and photo continuation — 21 October 2026

FindIt is **not launch-ready**. This checkpoint follows `docs/LAUNCH_CHECKLIST_2026-10-21.md` and `docs/cream-repair-2026-10-21/README.md`. The complete application inventory and remaining launch work are not certified by this scoped continuation.

All three supplied screenshots were accessible locally, despite the automatic missing-file text in the conversation. They show correct Anthisan Cream 25g identification in that earlier run, duplicated catalogue identifiers, an unqualified pack-size value of 25, and missing independently sourced strengths/limitations. The exact replacement cream photo was also available. Neither photo journey was rescued by typing its product name.

## Published changes

- `035b35a`: consolidate synonymous retailer SKU fields; distinguish the source mirroring its SKU into MPN from an independently established manufacturer number. Preserve distinct manufacturer codes and conflicting retailer variants. Mark a numeric pack size whose source supplies no unit explicitly; do not invent grams from another field. Make catalogue field names readable while retaining values and provenance.
- `43a9a0d`: Ask FindIt uses independently corroborated photo-label purpose when external descriptions are absent. The answer attributes the claim to the uploaded photo and does not assert independently verified effectiveness, ingredients or strength. Partial and single-reader identities remain ineligible.
- `0877efa`: product research records safe source-check outcomes: HTTP error, timeout, fetch error, identity mismatch, missing product facts or accepted facts. Rejected pages never become verified sources.
- `b2f0af7`: retain failed-source checks in the UI, clearly separate them from verified facts, and offer direct source links/retry. Actual typed conditioner journey displays verified Clicks facts separately from a Dis-Chem source unavailable to the Worker. Its recovery link opens the matching Dis-Chem page in the actual browser.
- `95e6f3c`: Logitech/Logitech G readings retain the shared parent brand. Conflicting headset model readings still require confirmation; unrelated brands, unsupported colour and barcode remain unconfirmed.
- `6fb720a`: require fallback Gemma to transcribe readable product-label lines first. A fresh response then revealed a separate spacing defect, rather than proving recognition solved.
- `a7b6b2a`: equivalent printed quantities `25 g` and `25g` no longer create two label candidates. Different quantities remain different. Replay of the same recorded three-reader responses is partial before the repair and a corroborated printed label after it. No inference, price or variant safeguards were removed.
- `0ce5ecf`: correct the new spacing regression fixture to represent the recorded three-reader scenario. The spacing patch was published before this new fixture failure was noticed; that intermediate failure is not hidden or described as green. Existing regression assertions remain intact. Final local suite: **358 passed, 0 failed**; syntax and diff checks passed.

## Source evidence and genuine limitations

The production Worker returned **HTTP 403** for the exact Dis-Chem cream page (`source-check-final.json`). This is a server-side access failure, not proof of a product mismatch or a bot diagnosis. The actual browser can open that same source: it displays Anthisan Cream 25g, R76.99, the Single Exit Price/cash-only/excludes-dispensing-fee condition, and published barcode 6009712390007. It lists pack size as `25` without a unit and catalogue SKU 000000000000004023. These are source observations, not a verified current FindIt offer or branch inventory. The page's Product Details links to the regulator homepage rather than supplying a usable description. No medical formula, dosage, safety advice or independent pros/cons have been invented.

A direct call to the existing Gemini service returned HTTP 503 with a temporary high-demand explanation (`existing-gemini-service.json`). An independent diagnostic also records HF HTTP402 credits unavailable. No credits, billing, paid services, payments or paused Supabase were activated.

## Evidence scope

Names beginning `final-` were written at different intermediate stages and do not by themselves prove the newest build. Explicit filenames and recorded versions must be used together. `assistant-final-browser.txt` is the successful Ask answer on the earlier deployed assistant repair; `typed-conditioner-source-recovery-browser.txt` is a **typed** search, not a photo success. `final-cream-partial-browser.txt` and `final-headset-browser.txt` retain failing actual-browser results on 95e6f3c. Fresh reader responses and their exact before/after replay are separately saved. Original attachment bytes remain outside the repository.

## Remaining work

Finish final production rechecks below before upgrading any outcome. Continue the inherited control inventory (272 historical state entries, 221 previously untested; not a unique or exhaustive control count), dynamic/uncommon paths, varied product categories and real device/accessibility tests. Photo identity and photo-to-offer reliability, retailer coverage/currency reconciliation and resource/error1102 investigation remain critical. Branch inventory needs an authoritative SKU-by-branch feed; durable alerts need authorized storage/scheduling/delivery; central analytics remains unconfigured. Physical camera/GPS/OS drag-and-drop require a suitable device context. Do not enable paid services or reactivate Supabase.

## Final deployed verification

Final browser results are recorded below; failures are not erased by green automated workflows.

Final code deployment: **b8715697cb318058c44e3f4f13aeb639b40b6dc7**. Browser frontend metadata and `/api/version` both report this SHA. Local suite now **359 passed, 0 failed**, including explicit barcode-answer provenance and unknown/partial-identity checks. `b871569` adds that repair without changing the photo gates.

Actual final customer outcomes:

| Journey | Observed outcome |
|---|---|
| Exact supplied cream JPEG, chooser → Identify, no typed name | **Anthisan CREAM 25 g, 85%** on both 0ce5ecf and b871569. Company on label Sanofi; readable purpose retained. Unprinted formula/strength/barcode/colour/pack count are not asserted. Earlier failing runs remain recorded. This is scoped evidence, not a general reliability guarantee. |
| Cream Product Info and Ask | Correct current product, 25g/company and label-purpose attribution. Latest mixed question explicitly says barcode and strength are not verified. No independent pros/cons are invented. |
| Cream comparison | Empty exact-price comparison is honest. Full price/shopping outcome remains **blocked/failed** because no fresh exact offer is accepted. Direct Dis-Chem Worker request returned HTTP403, while the actual browser source is readable. |
| Manual nearby after unavailable geolocation | Public Menlyn test point returns 12 relevant pharmacies, nearest Menlyn Park 0.1km, with published branch details and scheduled open/closed states. These are not verified sellers or branch inventory. No personal location used. |
| Saved Find | Corrected cream saved, retained across reload and reopened for a fresh lookup without typing. Final reopened Product Info evidence is saved when settled. |
| Original headset JPG, actual final chooser → Identify | **headphones,65%**, brand/model unconfirmed, no exact offer. Exact identification/shopping journey remains **failed**. Product Info gives clearly labelled generic guidance. Ask keeps PS5/model/barcode unknown and does not leak cream facts. No product name typed. |
| Separate manual barcode, not a photo test | Short `123` rejected. Valid `5449000000996` returns the community-maintained Coca-Cola330ml catalogue record and source. No exact retailer offer verified. Camera detector explicitly unsupported in this browser. |
| Source-recovery UI, separate typed search | Verified Clicks conditioner facts remain separate from the unavailable Dis-Chem source. Recovery link opens the matching retailer page. This is not evidence of a successful conditioner photo search. |

`scoped-checklist.csv` records 31 scoped observations, including historical failures. It is not a unique-control inventory or a substitute for the remaining entire-application audit. Catalogue cleanup has automated extraction coverage and the actual source was compared; its populated Anthisan production UI remains blocked while the Worker cannot read that page. Physical-device uploads/camera/GPS/OS drag, the full mobile/tablet/zoom/accessibility sweep and inherited dynamic paths remain untested or blocked. Product purpose is still repeated in the current label and purpose sections; that presentation issue remains to review without losing attribution.

Next engineer: fetch remote/main and audit/deployment history first. Preserve every failure record. Continue headset brand/model evidence and general photo reliability without promoting hypotheses; improve approved retailer access/discovery and currency context; finish the control inventory and current-device journeys. Check the latest interaction workflow result before claiming all workflows passed. No background work is promised after the session ends.

All **10 returned workflows** for b871569 completed successfully, including deploy, regression, production smoke, commerce and interaction checks. See `final-workflows.json`. These workflows are not a full customer-outcome certificate. Frontend and backend version evidence match b871569. The reopened saved cream retained its label facts and company after reload. No background work continues after this session.
