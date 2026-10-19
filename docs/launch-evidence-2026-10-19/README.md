# 19 October continued repair evidence

**Unfinished; not launch-ready.** Read this alongside `../../docs/LAUNCH_CHECKLIST_2026-10-19.md` and the earlier customer evidence. Earlier failed runs are retained. Original user images are outside git.

## Releases and reproduced repairs

| Code commit | Repair and meaningful evidence |
|---|---|
| d6b2e2c | Retailer image/name duplicate anchors previously kept an inline-CSS title and discarded the real product name. Scoped anchor cleanup and better duplicate selection restored the actual Dis-Chem Anthisan Cream 25g candidate. `cream-d6b2-candidate-browser.txt`. |
| 0aa445a | Extracted scoped Magento product attributes and the published price caveat; excluded a regulator-link CTA from product purpose. Source listing price R76.99 ZAR excludes the dispensing fee and is cash-only SEP. Listing barcode is source data, never a barcode read from the photo. `cream-retailer-source.txt`, `cream-final-candidate-browser.txt`. |
| 055ef18 | Accessible names now identify header Settings, Alerts and Premium tools; actual browser names verified. |
| ec3d598 | Settings → Refresh on a restored saved Find no longer demands a new photo. It refreshes research/commerce using the preserved identity without promoting uncertainty into typed identification. `saved-refresh-final-browser.txt`, repeated on b7896c9 in `saved-refresh-b7896c9-browser.txt`. |
| 4d75c27 | Explicit human confirmation uses the reviewed retailer brand/size instead of retaining a conflicting manufacturer. Actual visible Anthisan Cream 25g candidate confirmed using its button, yielding Anthisan,25g,R76.99 plus fee caveat. No product name typed. `cream-confirm-repaired-browser.txt`. This earlier successful candidate path is not proof of reliable OCR on subsequent runs. |
| 628ad97 | Published branch hours now update all dashboard consumers and display the source timezone (SAST). Unknown backend schedules remain unknown. `branch-details-final-browser.txt`, `official-branch-source.txt`. |
| bd6f737 | Topical/medicated cream and skin-care identities find pharmacy locators even when a provider calls the category Health rather than Beauty. Ice cream does not become a pharmacy query. Actual cream context returned12 Clicks branches at the public Menlyn test point. |
| 72ec890 | Nearest-store answers retain genuine zero distances and do not mistake “closest” for “closed.” Actual repeat `nearest-b7896c9-browser.txt` puts Menlyn Park0.0km first. |
| de338a0 | Generic “gaming headset” hypotheses cannot admit a different numbered headset model beside a specific model hypothesis. Actual earlier bad G321/white suggestions retained in `headset-72ec-final-browser.txt`; unit regression covers this exact failure. Latest browser only identifies headphones, so its absent candidates do not prove specific-model discovery works. |
| bc75000 | Older candidate payloads retain a prior supported brand only when complete brand words occur in the reviewed name. Different manufacturer and partial-word matches remain excluded. Repairs the de338 interaction regression; latest remote CI status still requires checking. |
| b7896c9 | Verified product descriptions can expose technical specifications formatted as bold labels and line breaks under a technical heading. Earlier real Korg source exposed omitted battery/range/accuracy specifications. Parser and worker attribution regressions pass. Actual latest-browser retest remains pending until recorded below. |
| 85ba63d | Open Now previously targeted only legacy `data-store` cards, leaving a scheduled-closed Menlyn Retail branch visible. Filters actual dashboard/quick/top-store structures by branch identity, reapplies after redraw and respects open status in closest recommendation.332 local checks passed. Actual production retest remains pending until recorded below. |

## Actual attachment journeys on b7896c9

Both exact files were uploaded through the website chooser and Identify & Find clicked. Neither journey used a typed product name as recovery.

| Image | Observed result | Customer outcome |
|---|---|---|
| images (4)(3).jpg | “headphones,”65%; visible G branding/black colour/boom mic not reliably retained. Brand/model/size/pack/barcode unconfirmed. Product Info gives only general type guidance; Compare has no price. Ask leaves model,price,PS5 compatibility unverified and does not leak the preceding Korg offer. | **Failed** photo-to-exact-shopping outcome. `headset-b7896c9-info-browser.txt`, `headset-b7896c9-compare-browser.txt`, `headset-b7896c9-ask-browser.txt`. |
| WhatsApp Image 2026-08-09 at 17.56.07.jpeg | “Sanofi topical cream,”65%,25g with label-check warning. Sanofi Anthisan Cream and Sanofi CREAM remain hypotheses; no Anthisan retailer candidate was returned on this run. No unseen strength/formula/barcode or purple product colour invented. | **Failed** repeatable exact-shopping outcome, despite the earlier source-backed candidate success. Saved/reload/reopen and Settings refresh preserve uncertainty. `cream-b7896c9-info-browser.txt`, `saved-refresh-b7896c9-browser.txt`. |

## Separate typed customer journey

Korg Pitchclip2 clip-on tuner returned Marshall Music,R345 ZAR,online in stock,branch stock unverified. Clicked the actual retailer link and confirmed correct model,SKU XTMT-KAT002,current R345 and1 online stock on its product page; no purchase. `korg-de338-browser.txt`, `korg-retailer-source-browser.txt`. Historical filename identifies the initial UI scope; the latest version retest must be recorded separately.

Shopping list preserves the R345 online offer and refuses to fabricate a driving trip without verified branch price/stock. Cheapest mode remains online-only. Watchlist records oneR345 observation; no price change or alert invented; reload retains shopping mode and observation. Deals displays the current online price. `korg-shopping-watch-browser.txt`, `korg-deals-browser.txt`. This is a single-retailer test, not a meaningful multi-retailer comparison.

## API sweeps and limitations

The b7896c9 stable-version sweep contains8 real photo uploads:7partial,1uncertain,0exact offers;22 total requested stages returned HTTP200. The separate typed sweep contains10queries/30stages,6priced results; groceries,shoes,furniture,household have no verified price. Source evidence and uncertain candidates remain separate from exact identity. No1102 observed in these bounded sweeps; production CPU traces and broad load remain untested.

Earlier de338 attempts hit environment CONNECT403/timeouts; retained as `*-de338-network-blocked.json`. These are transport blocks, not proof that the app/provider failed. Network subsequently recovered. Earlier successful and failed matrices remain version-labelled.

`uncommon-local.log` records the real Korg test passing locally. The earlier uncommon-commerce CI run failed twice when live discovery returned no listing. Do not weaken this test or call provider reliability solved from the later browser success.

## Checklist scope and outstanding work

The previous272-entry control/state inventory remains historical:41passed,2failed,6blocked,223untested. Those are observed states, not unique controls. This continuation adds evidence and scenarios; it does not silently mark the entire inventory passed.

- Passed in scoped scenarios: retailer duplicate cleanup, source price caveat/attributes, accessible header names, saved identity/refresh, reviewed candidate confirmation on an earlier run, category routing, hours synchronization/timezone, zero-distance nearest answer, single-priced-item shopping/watch/deals persistence.
- Failed: repeatable complete attachment journeys, broad OCR/model/variant coverage, four typed categories without listings, robust retailer/nearby provider coverage, meaningful identical-variant multi-retailer comparison. Open Now failed on b7896c9; retest the repair before changing status.
- Blocked: physical camera/GPS/OS drag/drop in this remote environment; unsupported camera barcode detector; SKU-by-branch inventory requires a real retailer feed; durable alerts require configured background storage/scheduler/delivery; central analytics absent; unavailable Hugging Face credits must not be funded. Supabase remains paused and payments disabled.
- Untested: remaining inventory states, full phone/tablet/desktop/zoom/long-text/keyboard/screen-reader audit, populated multi-retailer filters/comparisons, rare recovery paths, true background alert delivery, broad load/CPU/resource-error recurrence.

## Precise continuation

Fetch remote main and newer deployment/evidence commits first. Preserve bot updates to AUDIT_LATEST.txt. Local and connector commits have different SHAs but matching source trees; never force-push or merge duplicate history. Shell push lacks credentials; publish through GitHub expected-parent tree/commit/ref updates.

Finish actual85ba63d Open Now closed-branch/redraw/off retest, Korg specification retest, both original photo journeys, stable-version varied photo/typed sweeps and final frontend/backend version check. Then improve the manufacturer/consumer-brand OCR mismatch using fresh provider diagnostics and visible text without weakening exact matching. Continue remaining inventory and providers. Commit all evidence and update the main checklist before any handback. No background-work promise.

## In-session checkpoint at b6ad41a

Frontend meta and backend /api/version both verified `b6ad41a16178f06a074217e8c918063d6cbc5be0`.336 local Node checks pass. New code also includes7143417 (A–Z/closest overrides repaired),620883c (full verified Woo product-page content enrichment) andb6ad41a (complete printed consumer name+quantity survives a separately printed manufacturer without inventing its retail brand; cache generation34).

Actual cream upload onb6ad41a now reaches a Dis-Chem Anthisan Cream25g candidate. Its visible name+25g were reviewed against the exact attachment and actual retailer page, then the Yes button clicked. No name was typed. It reaches a verified R76.99 ZAR offer with cash-only SEP/dispensing-fee caveat, ANTHISAN brand and25g. Compare retains the caveat. The source barcode is listing data, not a photo read. Strength/formula/colour/pack count remain unverified. Purpose is honestly unavailable on the checked page.12 relevant pharmacies appear at the public Menlyn point; branch stock remains unverified. Menlyn address,phone,store/pharmacy hours agree with the actual official source; Maps resolves the correct destination, but the remote-browser origin is not the user's origin. See `cream-b6ad41a-*` snapshots.

Open Now actually hides closed branches on85ba63d and restores them when switched off. A–Z sorting was then found to be overridden by the relevance renderer;7143417 repairs that. Actualb6ad41a main/top cards now appear alphabetically, with Smart Choice retaining the true zero-distance closest branch. Further sorting/filter combinations remain uncertified.

Korg actual browser retest using backend620883c now shows11 attributed specifications, published compatibility and supported strengths. The earlierb7896c9/85ba63d two-specification result was a real incomplete repair; the page-content source path had still been skipped. `korg-620883c-specs-browser.txt` proves the later result.

Newly reproduced and NOT yet repaired at this checkpoint: the two-item R421.99 shopping subtotal and cream watch observation omit the fee caveat (`cream-b6ad41a-shopping-caveat-missing-browser.txt`). A replacement-photo check is also investigating whether the old branch-hours panel survives a product change. Continue these repairs; do not certify final full journeys yet. The original headset's latest actual-browserb6ad41a run is in progress.

Current copied control/state inventory:272 entries,43passed,2failed,6blocked,221untested. Added passes are the scoped actual Open Now behavior and saved-photo Settings refresh. New scenario evidence does not imply the rest passed. CI API status responses still report queued despite completed deployment evidence; do not assert all CI green from those responses.
