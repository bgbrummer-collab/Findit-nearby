# FindIt deployed verification — 31 October 2026

## Deployed repair

PR #346 merged as `5b3be356d19ad1e462561878e444214eb3569268`. The production `/api/version` endpoint confirms this commit. All four PR suites passed at source head `e4ff0ee4665eb581bbcdb738bf9c74cf40060b86`; the Node suite contains 556 passing tests. Hosted browser checks pass at 1440px and 390px for reviewed-candidate source recovery and photo variant review.

The prior intermittent feedback suggestion assertion did not reproduce on the final source or deployed main. The success assertion remains intact and failure diagnostics now include form validity, posted payloads and browser errors. No feedback root-cause repair is claimed.

## Actual photo journeys on production

The original low-resolution conditioner regression fixture was uploaded with the visible Upload Photo control and Identify & Find, without substituting a text search. The photo still identifies Marc Anthony conditioner at 65%, with conflicting Triple Blend / Jungle Blend model hypotheses. This is not an automatic exact-identification pass. Review possible product supplies the Clicks-backed 250 ml Triple Blend candidate, source facts and a R230 listing price. After deliberately clicking Yes, this is my product, Product Info displays matching purpose, directions, storage, warnings and ingredients. The successful refresh produces one retailer listing; Dis-Chem remains an unavailable source. No physical branch stock is claimed. This real successful refresh is separate from the hosted tests that deliberately force refresh failures.

The primary manufacturer G435 black/neon headset photo was uploaded through the same controls. Product Info provides manufacturer battery, connection and included-items facts. The blue/raspberry FirstShop R1750 listing is shown under Model listings — confirm your variant, with Check this variant. It does not become the selected photo's best price, exact stock or shopping route. The photo's colour remains uncorroborated, so this is useful model information with explicit review, not an exact photographed-variant offer pass.

## Deployed checks

On the merged commit, these GitHub workflows complete successfully: deployment, Node regression, production smoke, release smoke, interaction freeze (local and deployed), dashboard commerce, responsive layout, full production audit, final production audit, live photo probe, and smoke checks. The uncommon commerce workflow remains failed: it discovers no verified exact Korg Pitchclip 2 offer. Its earlier Marshall Music human-verification restriction has not been bypassed or waived.

The ten-category live data matrix ran against the same production commit at start and finish. Five useful offer-plus-information journeys pass: electronics, clothing, beauty, toys and music. Groceries, the specified white/blue shoe, tools, furniture and household remain failed. The drill has researched information but no exact requested offer. See `launch-evidence-2026-10-31/post-resource-matrix.json`. An honest empty response does not count as a useful shopping pass.

## Additional source investigation and remaining limits

Woolworths' primary application publishes `/search?searchterm=...` and its public Constructor catalogue configuration. The catalogue responds, but the grocery example returns adjacent quantities/formulations (including a 2 L listing promoted as less sugar), and the tissue query returns different brands and pack counts. The checked product page could not be verified (HTTP 403). No catalogue price or adjacent item was promoted to an exact offer, and no unvalidated adapter was shipped.

Full launch and desktop/phone parity are not signed off. Physical Samsung camera/gallery permissions, GPS and notifications require actual device verification. Saved items, history and settings remain device-local; cross-device synchronization is not implemented. Exact retailer coverage, source restrictions, nondeterministic photo identification and separately verified branch inventory remain open. No paid service, layout rebuild or reduced test expectation was introduced.
