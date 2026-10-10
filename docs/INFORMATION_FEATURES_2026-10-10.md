# Information features: verified changes and limits

Live site: https://findit-nearby.bgbrummer.workers.dev/

Code commit: `a43ea67f5f5340b41e5e68709ecca56f84f7811c`.

## Fixed

- The Cloudflare assistant previously returned canned directions to other panels. It now returns sourced product purpose, published strengths, specifications, named current retailer prices, online availability, nearby distances and available branch contact fields. Combined questions can receive both product and commerce information.
- The small assistant chat previously removed source URLs, verification flags, online availability and model-confirmation requirements before sending context. These are now preserved.
- Known retailer sources with shortened product titles are no longer discarded before fetching. The actual source page must still pass identity verification before supplying product facts.
- Missing branch details are researched through exact-location OpenStreetMap records and matching official retailer branch pages. Corporate contacts and other branches are rejected. Generic JSON-LD and Clicks' actual branch HTML are supported; website scripts are not executed.
- All twelve displayed branches are eligible for research, instead of only the first eight. Matching uses coordinates or an unambiguous branch identity so same-chain branches cannot borrow one another's fields.
- Published phone, address and hours are retained in store state for Check Store. Published weekly hours remain visible even when holiday/complex rules prevent a reliable open-now determination.
- Browser asset versions and the branch-data cache version were refreshed.

## Real production evidence

1. Browser typed search for Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250 ml displayed the published product purpose, four retailer-described strengths, brand specification and the exact Clicks source page. Price was R230 ZAR; online in stock; branch stock explicitly unverified.
2. The real small assistant chat answered a combined purpose/price/stock question with those facts and source link. A separate price/stock question displayed the retailer price and online/branch distinction. These were actual browser API calls, not mocked answers.
3. The assistant API was retested with a shortened retailer title after the source-filter fix and returned sourced conditioner facts.
4. The branch API retrieved Clicks Middestad's actual published shop phone **012 322 1111**, full address and weekly schedule from https://clicks.co.za/store/Middestad/309. The schedule includes public-holiday rules, so the current open/closed flag remained unknown. No product inventory was inferred.
5. A separate nearby lookup around a public Pretoria reference coordinate returned zero branches at test time. This is a live coverage/reliability limitation, not a successful populated-location test. The reference coordinate was not the user's location.

Evidence: `assistant-live-information-2026-10-10.json`, `branch-official-information-2026-10-10.json`, `findit-sourced-assistant-20261010.jpg`, `findit-assistant-price-20261010.jpg`.

## Testing

146 unit tests passed, with no failures, plus relevant JavaScript syntax checks. New tests cover combined assistant intents, currency separation, rejecting unsupported prices, returning researched facts and sources, shortened titles, all twelve branches, same-chain separation, official-domain filtering, branch-address/coordinate corroboration and Clicks branch HTML excluding the corporate footer.

The initial branch-parser tests caught a house-number omission in address matching; numeric address tokens were included without relaxing the multi-token/location requirement. A test with an extra uncorroborated address token was corrected to represent the actual branch fixture. All tests passed afterward.

Release, desktop/mobile interaction, commerce, production smoke, live-photo and full/final audit workflows passed for the assistant code `82db8180732c1765c1ba618ae0114a5363adffba`. Final deployment/check results for the final code are recorded below after completion.

## Remaining limits

This is not a guarantee that every “Not published” field can be filled. A published, matching source is required. Retailers can omit inventory, change pages or provide no readable branch data; indexed discovery can fail or time out. Official branch lookup currently reads structured data plus the observed Clicks branch template, not every retailer template worldwide. Missing addresses/websites can prevent branch corroboration.

Branch product inventory and branch-specific prices still require retailer evidence or authorised feeds. Product research and the assistant remain constrained by available exact-product sources; unsupported facts and downsides are not invented. Nearby coverage, broad product-category commerce coverage, production feedback configuration and physical-device camera/GPS verification remain outstanding as described in `VERIFICATION_FINAL_AI_2026-10-10.md`.

No paid service, upgrade or purchase was activated. The user's attachment was unavailable at its supplied scratch path, so its particular retailer rows could not be inspected directly.

## Final release checks

Production `/api/version` confirmed `a43ea67f5f5340b41e5e68709ecca56f84f7811c`; Cloudflare deployment run 38060163693 succeeded. Regression 38060163734, smoke 38060163667, commerce 38060163623, production smoke 38060163695, release smoke 38060163666, full audit 38060163751 and final audit 38060163711 passed. The final dashboard audit reported 44 desktop/mobile checks passed, zero failures.

Interaction run 38060163687 initially timed out at the feature-suggestion status check (local phase, job 114236676237). A single rerun, job 114237213235, passed the entire local and deployed suite, including feature suggestions and model confirmation at 1440 px and 390 px. No timeout was suppressed or assertion relaxed. The failure did not reproduce on that rerun; its underlying intermittent cause has not been established and remains recorded for follow-up. Passing mocked feedback UI checks does not fix the separately unconfigured production feedback destination.
