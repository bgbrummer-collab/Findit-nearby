# Catalogue and product-evidence repair — 31 October 2026

Bash's primary published search route is `/s?search=...`, also indexed at `https://bash.com/s?search=NIKE+AIR+FORCE+1`. Its captured live search HTML contains product anchors and an ItemList. Correct the clothing adapter and add the same retailer search for footwear without dropping the existing footwear retailers. Discovery still returns only candidate URLs, followed by independent product-page verification.

The investigation exposed a separate reproducible evidence defect: unrestricted JSON-LD traversal admitted Product nodes nested in ItemList recommendations. A failing regression demonstrated an unrelated page borrowing a matching recommended item's price and stock. Restrict traversal to top-level records, graphs, primary entities and explicit variants. Product and Offer URLs, when published, must identify the checked publisher and product path. Apply the same node scope to product facts and photo candidate facts.

The captured Bash primary product page for `nike-men-s-air-force-1-white-blue-sneaker-060601ahxd9/p` publishes nested size offers inside AggregateOffer. Previously their prices were missed. Read the actual nested offers, without guessing from lowPrice/highPrice summaries. Preserve a common published price, null conflicting prices or availability, flag multiple SKUs as ambiguous, and omit an arbitrary variant SKU. Do not confirm a requested size absent from the source record. Decode entities in published names.

Replaying that captured primary page now gives R2399.95 ZAR, mixed availability unverified and variant ambiguity for the title-supported White/Blue model query. The matrix's more specific `Low` query still rejects this listing because the published product identity does not establish that requested model term. This is not claimed as an improved matrix pass. Native live search can exceed its existing 6.5-second request budget; the successful captured response and mocked regression are not substituted for a production success.

The drill stock investigation found conditional Alpine templates containing both stock states. Its raw `Out of Stock` text is not sufficient to override product-scoped structured availability. No stock override was shipped from that text alone.

Rotate only the commerce and research fallback cache namespaces so earlier evidence cannot reappear after this validation change. Saved items/history are not deleted.

Validation before PR: 565 Node tests pass with syntax/diff checks. New regressions were first observed failing for recommendation leakage and ignored aggregate prices, then pass after the repair. Deployment and hosted browser validation are pending; existing source restrictions, physical-phone checks, synchronization and 5/10 matrix limits remain open.
