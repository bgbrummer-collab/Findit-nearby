# AI identification and product information verification — 10 October 2026

Production application commit: `21bb6ae7f5a834dff7587499470d50fa96e4e0de`.
Live site: https://findit-nearby.bgbrummer.workers.dev/
The production `/api/version` endpoint was checked and reported that commit. Cloudflare deployment run 38040565206 succeeded.

## Changes

- Replaced all-or-nothing vision agreement with independent product-type and field agreement. Supported brand and object details survive model disagreement. Container words such as tube/bottle can resolve to the independently identified product inside the packaging.
- Brand corroboration retains two agreeing readings despite a third mistaken logo reading. Beats and Beats by Dr. Dre spellings resolve to the same brand; conflicting exact models remain unconfirmed.
- Correctly parses nested vision responses and completion envelopes. Provider transport fields such as `text_completion` and the provider model name can no longer become product identity.
- Scout receives the actual photograph through a multimodal message. A real production response confirmed it read the photographed label; no new paid service was enabled.
- Strengthened prompts to distinguish company brand from product line and identify the retail item inside its package.
- Enabled versioned SHA-256 photo identity caching. Retailer prices/stock are checked separately rather than cached with photo identity. Calls stop on the daily AI limit, with an accurate explanation and name/barcode recovery.
- Preserved model uncertainty in legacy, active and dynamically loaded commerce requests, including GET retries. The backend rejects exact prices and specifications for unconfirmed variants. The browser retest found a GET retry bypassing the first guard; that actual cause was fixed and regression-tested.
- Uncertain Product Info routes to a working model/label confirmation action. Confirming by text opens existing exact-product research rather than discarding all recognised details.
- Added source-scoped published specifications and source links to product information. Neighbouring product JSON-LD does not supply facts for the selected item. General product-type guidance is labelled separately; brand recognition is no longer invented as a product advantage.
- Refreshed changed browser asset versions, including dynamic bootstraps. Switching from an uploaded photo to another named product clears the previous photo.
- Preserved the existing application, visual design and other features.

## Actual production observations

| Input/action | Observed result | Limit |
| --- | --- | --- |
| Real Marc Anthony Strictly Curls conditioner photo | Retains `MARC ANTHONY conditioner`; model-confirmation controls work; final browser result has no unrelated variant prices | Providers disagree on complete variant; exact model, size and specifications are not claimed |
| Official Apple Beats Solo3 hero photograph | Retains `Beats headphones` in API and browser; no stale Sony offers or guessed exact prices | Contains three colour examples; two older models guessed Studio and Scout read Solo3. Exact model is deliberately unconfirmed. This is a comparable official fixture, not the unavailable original user attachment |
| Confirm model/label action | Opens product-name/model/barcode form and completes typed search | Requires a user-supplied exact identity when the photo is ambiguous |
| Typed `Sony WH-1000XM5 black` | Two independently verified online listings, Incredible Connection and HiFi Corp, each R5,999; sourced description and published brand specification; source links displayed | Not a photo-identification success. Branch inventory is not verified; no sourced product-specific drawbacks were found |
| Photo → different typed product | Old conditioner photograph disappears from Sony result | Does not invent a replacement product image |

Raw provider observations: `ai-photo-probe-2026-10-10.json`, `ai-beats-photo-probe-2026-10-10.json`.
Screenshots: `findit-ai-photo-proof-20261010.png`, `findit-ai-beats-proof-20261010.png`, `findit-ai-product-info-proof-20261010.png`.

## Tests

- `npm test`: **119 passed, 0 failed**, on final application code.
- Tests cover independent consensus, conflicting models/brands, completion-envelope parsing, actual multimodal input construction, invalid uploads, service quota exhaustion, active-client uncertainty round trip, GET commerce/research retry uncertainty, and product-scoped structured specifications.
- Existing deterministic commerce/research tests cover electronics, groceries, clothing, shoes, beauty, tools, toys, furniture and household goods. These fixtures do not establish real-photo accuracy across every category.
- Final GitHub regression checks, smoke checks, production smoke, release smoke, dashboard commerce regression, full production audit, final production audit, live photo probe and deployment: **passed**.
- Interaction suite run 38040565164: **local and production desktop/mobile interaction suites passed**. Upload controls, product relevance, retailer cards, feedback UI, smart choices, shopping tools, hours and user-experience regression checks passed. These include mocked API scenarios; they do not establish camera hardware or every real product lookup.
- A test syntax error in an earlier intermediate commit was repaired; the final unit suite passes. Superseded releases are not evidence of final verification.

## Remaining limits

This release improves recovery, recognition and integrity; it does not establish perfect identification. The two real photograph probes both remain partial model identifications. AI can misread logos/labels and visually identical variants cannot always be distinguished. The existing free daily provider allowance can exhaust; caching and fallback do not make it unlimited. Exact facts, pros/cons, prices and stock depend on accessible published sources. Unpublished or inaccessible details remain unavailable rather than invented. Camera hardware, actual user GPS and every possible product/category were not exhaustively verified in this AI-focused pass. Existing broader project limitations in the 9 October verification report still apply.

No claim that FindIt is completely finished or that AI will never fail is justified.
