# FindIt Nearby — 21 October 2026 continuation checkpoint

**NOT launch-ready. The full customer audit remains unfinished.** Continue the existing design and features. No billing, payment, paid service or Supabase activation occurred.

## Release and repairs

Started from remote main `7fe046dbc9df672ef9c18b21b646f54fb80abe9b`, after reading the October 17/18/19 checklists, evidence, code and available conversation history. Checked GitHub for newer commits before publishing. Preserved the intervening audit-bot commit using an expected-parent update.

Final code deployment: `1a28a197ef91ac031c7a92447c96d59635840b1d`. Actual browser frontend metadata and Worker `/api/version` match. Nine returned workflows completed successfully, including deployment, commerce, interaction-freeze and release smoke. These are not a complete customer-outcome certificate.

| Repair | Evidence and verification |
|---|---|
| fd8f3a4: visible Identify button stayed enabled and status said new image ready while inference ran | Disable both search controls at request start and publish an identifying status. Existing repeat-click regression now starts with a genuinely enabled dashboard button; failed before repair. Final real headset/cream chooser journeys show disabled button and identifying status, then recover. |
| f387f4f: service failure/model disagreement wrongly produced a clearer-photo warning | Preserve backend requires-user-input explanation in the warning as well as status. Actual earlier cream service-failure reproduction retained; two regressions failed before repair and pass after. Final successful partial-photo runs do not reproduce the transient provider outage, so the same-outage production browser retest remains untested. |
| d974b1e: instructions native dialog had no accessible name | Label with its existing heading. Actual production named-dialog lookup and Escape dismissal verified. |
| 1a28a19: isolated Compare/Live Stock dialogs bypassed accessible-dialog support | Connect existing shared name/focus/Tab/Escape handling, removing the duplicate inner dialog role. Actual empty and populated Compare: Close receives focus; forward/reverse Tab wrap; Escape restores Compare Prices. Live Stock uses the same path but its complete current-product journey is not separately certified. |

346 local Node checks pass, zero failed. Syntax and diff checks pass. No matching safeguards, features or tests were removed or weakened.

## Exact original attachments — actual final browser journeys

Both original files were retrieved, visually inspected and uploaded through the live file chooser; Identify & Find was clicked. No product name was typed to rescue either photo. Earlier failures and variable outputs remain in the evidence.

| Attachment | Actual result on final code | Outcome |
|---|---|---|
| images (4)(3).jpg | Headphones,65%; brand/model not confirmed on final browser repeat. Earlier run said Logitech headphones. General purpose guidance only; visible G/black/boom microphone not reliably retained. No confirmed size/pack/variant/barcode. | **Failed** exact-shopping journey: no exact offer. Compare honestly empty. Earlier scoped Ask leaves model,PS5 compatibility and price unverified. |
| WhatsApp Image 2026-08-09 at 17.56.07.jpeg | Sanofi topical cream,65%,25g marked check-label. Anthisan Cream25g remains a possible printed label, not a confirmed retail identity. No unseen strength/formula/barcode/colour/pack-count assertion. Refresh possible matches settled without a confirmable retailer candidate. | **Failed** exact-shopping journey: no exact priced offer. At public Menlyn coordinates,12 relevant Clicks pharmacies loaded; these are not verified sellers of this SKU. |

Nearest branch Menlyn Park:0.1km from the explicitly entered public test point, full address,0123486162 and Wednesday09:00–20:00. Clicked Published branch source and compared the actual official page: address,store/pharmacy schedule and phone agree. Clinic hours remain separate. This proves published branch details, not branch inventory or physical GPS.

Cream added to shopping list/watchlist; reload retains it, displays missing verified price, no fabricated total/route/alert, and explains while-open versus background monitoring. History reopening preserves its partial identity and possible label. Raw snapshots document the scope.

## Stable final API sweeps — separate from browser evidence

Both matrices start/end on1a28a19. Eight photos across electronics,clothing,tools,toys,furniture,groceries plus both attachments: one identified, six partial,one unidentified; **zero exact priced offers**.22 requested stages HTTP200. Separate ten typed queries:30 stages HTTP200; six yield verified priced listings; groceries,shoes,furniture,household have none. No1102 observed in52 bounded requests; no production CPU trace/root-cause or broad load guarantee.

Mixed-version matrices are explicitly retained under `mixed-version-*`; do not describe them as stable final evidence.

Separate typed Bosch GSB18V-50 actual browser journey yields15 sourced specifications and the explicitly labelled drill+two2Ah batteries+charger kit at TMB,R4999 ZAR,online in-stock,branch stock unverified. Clicked actual matching source. **External currency discrepancy persists:** retailer displays GBP prices despite South Africa/ZAR selector; FindIt shows its retrieved ZAR offer. Do not call this a fully reconciled currency journey or compare this kit to a bare tool as an identical variant.

## Inventory and remaining statuses

`launch-evidence-2026-10-21/inherited-control-inventory.csv` preserves the historical272 observed control/state entries:43passed,2failed,6blocked,221untested. These are not272 unique controls. `visible-controls-final.json/csv` additionally records105 visible entries in one final headset state; it is discovery evidence, with untested default, not a duplicate-free complete inventory. Dynamic dialogs and all uncommon paths still need enumeration. New scoped evidence above does not silently upgrade every inherited row.

| Status | Scope |
|---|---|
| Passed | Four repairs within stated verification limits; actual final chooser/replacement journeys, named instructions/Escape, empty+populated comparison keyboard behavior, free Beta activation/persistence with payments disabled, public coordinate entry,12pharmacy branches and one actual official branch source, cream shopping/watch persistence and partial-history reopening;346 local checks and nine workflows. |
| Failed | Repeatable exact photo recognition and photo-to-offer; four typed categories without priced listings; broad retailer/nearby coverage and identical-variant comparisons; retailer browser currency discrepancy. |
| Blocked | Authoritative SKU-by-branch inventory feed absent; durable background storage/scheduler/notification delivery absent; central analytics integration absent; unsupported remote camera barcode detector and unavailable physical camera/GPS/OS drag context. Unavailable HF credits must not be funded. |
| Untested | Remaining221 inherited states, full dynamic inventory, mobile/tablet/zoom/long-text/accessibility/device sweep on this final code, populated multi-retailer filters/deals/comparisons, Live Stock modal full journey, final transient-provider-outage browser replay, remaining validation/recovery paths and production load/CPU1102 analysis. |

## Precise continuation

Fetch remote main and newer deployment/audit commits first. Preserve all evidence and bot updates. Fix photo label/model extraction and independent catalogue discovery without filename hints,hard-coded products or relaxed identity/variant gates. Inspect fresh provider diagnostics; distinguish service failure from disagreement. Improve missing-category retailer and official-locator coverage. Resolve external price/currency source context before certifying source agreement. Continue populated tools and the221remaining inventory states, physical-device/accessibility and CPU/load work. Inventory/background alerts/analytics require authorized integrations configured securely through hosting settings, never secrets in chat; leave Supabase and billing disabled.

Working directory `/workspace/scratch/e56c2af3a8d6/Findit-nearby`. Published source was written through GitHub tree/commit/expected-parent ref updates; local source edits match those code commits but remain uncommitted locally. Do not reset or force-push. Original images are outside the repository in `test-images`. Raw evidence and scripts: `docs/launch-evidence-2026-10-21/`. No background work continues after the response ends.
