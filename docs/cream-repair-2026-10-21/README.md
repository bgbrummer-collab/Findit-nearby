# Supplied cream photo — identification and Product Info repair

Code deployment: `1eb2bcfc52e5c0b1e4283627b26e1a14fed09edc`. Actual frontend meta and Worker version match.

Input: `WhatsApp Image 2026-08-09 at 17.56.07(1).jpeg`, SHA256 `101e9bb1175f00961c6503606e2474eb01840132c66bef9a948c48fbebd80131`. The uploaded file was accessible and visually inspected. It is byte-identical to the earlier supplied cream photo. No image bytes were committed.

## Reproduced causes and fixes

- Independent readers recognised the complete consumer label and 25g quantity, but split Sanofi/Anthisan/cream differently into brand/model/object. Consensus previously collapsed those readings into Sanofi topical cream. It now preserves a fully printed name and quantity only when another independent reader corroborates them. An object field containing the full printed label can corroborate the independently recognised product family. No product name, filename hint, retailer URL or result was hard-coded for this photo.
- A separately printed company is not automatically the consumer brand or manufacturer. Product Info now displays Sanofi as Company on label. If consumer-brand readings disagree, the brand field stays empty rather than inventing agreement. Unseen strength/formula/barcode and purple packaging are not asserted as product facts.
- Independent matching label statements survive reconciliation. Product Info attributes them to the uploaded product label and uses an appropriate functional statement for What it does when external descriptions are missing. It no longer simultaneously displays the readable purpose and says no description exists. Source descriptions remain separate from photo evidence.
- Existing bounded third-reader verification can retain a corroborated label statement; photo cache generation was advanced so old partial payloads do not conceal the repair.

## Actual final production journey

Uploaded the exact replacement file through the live website chooser, clicked Identify & Find, and waited. No product name was entered. Result: **Anthisan Cream 25g**,85%,size25g,Sanofi separately labelled Company on label. Product Info displays the functional statement read from the package, explicitly attributed to the uploaded photo. Unknown strength/ingredients/barcode remain unconfirmed. Reload → History → Open product → Product Info retains the corrected identity and label evidence.

The screenshot and `verified-final-product-info-browser.txt` record the actual UI. `final-photo.json` and final frontend/backend version files record the matching API/code state. Earlier failed and intermediate runs are preserved separately; dc726856 API files precede the final UI-purpose change.

## Verification and limits

350 local Node checks pass; syntax/diff checks pass. New/expanded cases cover two-reader label/quantity agreement, single-reader rejection, wrong size/model/colour/barcode, unprinted companies, full-label object fields, independently corroborated label statements, and product-info source separation. The purpose-rendering assertion failed before the final repair.

This fixes the scoped photo identity and label-based Product Info journey. External catalogue descriptions/specifications and exact retailer offers still returned no verified result; these remain engineering work. No medical formula, barcode, review strengths, price or branch stock was invented. This does not certify universal photo recognition or launch readiness.

CI review: the responsive workflow passed all eight local and production viewport checks, upload/location checks and saved-product persistence. Its simulated feature-suggestion delivery subtest timed out at `tests/feedback-feature-regression.mjs:47`; this is not a demonstrated layout failure. The failure is retained and its failed job was rerun without changing the test. Check the final workflow snapshot for the current result; pending runs are not passes. No live feedback message was sent by the agent in this repair.

Code commits: bd2e2bc (initial reconciliation/label info),e4263ac (company attribution),dc726856 (full-label object reconciliation),1eb2bcf (useful purpose fallback). Preserve intervening audit-bot commits. No payment/billing/service activation or Supabase change occurred.

Working tree: `/workspace/scratch/e56c2af3a8d6/Findit-cream-fix`, detached from initial9e7eb5c with published source edits still present locally. GitHub commits own the published source; do not reset the older original worktree or force-push. Continue broad unresolved launch work from the October21 checklist after this scoped repair.

Final CI recheck: all nine returned workflows completed successfully. The unchanged responsive job rerun passed every stage, including simulated feedback/feature delivery and retained-draft recovery. Original failed attempt remains documented in `ci-failure-before-rerun.json`; its intermittent timing cause is not claimed fixed by this image repair. These green checks do not override the external catalogue/offer gaps or the broader launch checklist.
