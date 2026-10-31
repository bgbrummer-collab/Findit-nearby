# Catalogue and product-evidence repair — 31 October 2026

Bash's primary published search route is `/s?search=...`, also indexed at `https://bash.com/s?search=NIKE+AIR+FORCE+1`. Its captured live search HTML contains product anchors and an ItemList. Correct the clothing adapter and add the same retailer search for footwear without dropping the existing footwear retailers. Discovery still returns only candidate URLs, followed by independent product-page verification.

The investigation exposed a separate reproducible evidence defect: unrestricted JSON-LD traversal admitted Product nodes nested in ItemList recommendations. A failing regression demonstrated an unrelated page borrowing a matching recommended item's price and stock. Restrict traversal to top-level records, graphs, primary entities and explicit variants. Product and Offer URLs, when published, must identify the checked publisher and product path. Apply the same node scope to product facts and photo candidate facts.

The captured Bash primary product page for `nike-men-s-air-force-1-white-blue-sneaker-060601ahxd9/p` publishes nested size offers inside AggregateOffer. Previously their prices were missed. Read the actual nested offers, without guessing from lowPrice/highPrice summaries. Preserve a common price only when every nested variant publishes that price, null conflicting prices or availability, flag multiple SKUs or unnamed aggregate variants as ambiguous, and omit an arbitrary variant SKU. Do not confirm a requested size absent from the source record. Ambiguous footwear listings also require review when a photo established colour but not size. Decode entities in published names.

Replaying that captured primary page now gives R2399.95 ZAR, mixed availability unverified and variant ambiguity for the title-supported White/Blue model query. The matrix's more specific `Low` query still rejects this listing because the published product identity does not establish that requested model term. This is not claimed as an improved matrix pass. Native live search can exceed its existing 6.5-second request budget; the successful captured response and mocked regression are not substituted for a production success.

The drill stock investigation found conditional Alpine templates containing both stock states. Its raw `Out of Stock` text is not sufficient to override product-scoped structured availability. No stock override was shipped from that text alone.

Rotate only the commerce and research fallback cache namespaces so earlier evidence cannot reappear after this validation change. Saved items/history are not deleted.

Validation before PR: 568 Node tests pass with syntax/diff checks. New regressions were first observed failing for recommendation leakage and ignored aggregate prices, then pass after the repair. Deployment and hosted browser validation are pending; existing source restrictions, physical-phone checks, synchronization and 5/10 matrix limits remain open.

## Deployed verification and URL-equivalence correction

PR #347 passed all four source suites and merged as `3243ac00fa9c7d4ca0e69219fb71971fdfb530bd`; production confirms this commit. Actual UI search for Nike Air Force 1 White Blue Sneaker now finds Bash product facts and one listing, where the pre-deployment journey found neither. Live information API checks retain G435 manufacturer facts (15 specifications) and retrieve the matching Bash source. This query is distinct from the matrix's more specific Low query.

The unchanged ten-category matrix on #347 fell to 4/10: the prior Levi's clothing pass returned no offers. This is a discovered regression, not a waived source gap. Captured primary Levi's HTML reproduces the cause: its Product URL uses lowercase `%c2%ae` while Offer/request paths use uppercase `%C2%AE`. Percent-escape hex case is equivalent; ordinary product-path character case is not. Normalize only percent-escape hex case before comparing source paths. A regression test first fails, then passes while rejecting genuinely different paths. The captured listing then verifies at R1399 ZAR, with mixed size availability unknown and variant ambiguity retained.

The actual Bash dialog also exposed a literal `&apos;` and dropped a complete material sentence when a trailing `(Supplier Style:...)` lacked terminal punctuation. Decode the entity, retain the complete sentence, and expose the explicitly published supplier style separately with source attribution. A worker regression first reproduced the lost sentence, then verifies its recovery and code attribution. No style code is guessed.

Local follow-up: 570 tests pass, with syntax/diff checks. Hosted checks and post-deployment confirmation of this correction remain pending. The 4/10 deployed observation above remains recorded until a new run verifies recovery.


## Correction deployed and verified

PR #348 passed all four source suites and merged as `cf51ae8ea04c7b2c56c0074692565d231930673a`; `/api/version` confirms this production commit. The ten-category live matrix uses that same commit at start and finish and returns to 5/10. Levi's clothing recovers two verified listings (R1199 dark indigo and R1399 brown); this does not imply comparable variants or selected-size stock. The original five unresolved cases remain failed. Compact evidence: `launch-evidence-2026-10-31/post-url-correction-matrix.json`.

Actual website search for Nike Air Force 1 White Blue Sneaker shows the source-attributed synthetic-leather description and supplier style IV5732-100. The apostrophe displays normally. Compare Prices retains the matching Bash R2399.95 listing and explicitly says branch stock is not verified. The best-price field says to confirm the listing variant before comparing prices. This is a successful journey for this separate typed query, not a passed result for the matrix's more specific Low query.

Production Node checks, release smoke, final/full production audits, dashboard commerce, photo probe, production smoke and deployment complete successfully when inspected. The production interaction suite subsequently completed successfully, including both local and deployed behavior checks (run 41198754274). The PR interaction/browser suites also passed before merging, including desktop and 390px runs.

Full launch/parity remains unsigned: exact retailer coverage, restricted tuner discovery, physical Samsung camera/gallery/GPS/notifications and cross-device synchronization remain open. Source facts and listing prices are separate from selected-size availability and physical branch inventory.
