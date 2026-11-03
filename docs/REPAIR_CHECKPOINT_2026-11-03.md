# FindIt continuation — 3 November 2026

## Recovery milestone — verified

The prior workspace command completed successfully and left a clean tree. GitHub main and the live Worker both report d219c95889332543b578a1b2bfa028c8a207c5e9. PRs #353–#356 are merged. Acceptance evidence is saved separately at 547edb6c3762112469e2cf45334e266779fc17b0 on verification/acceptance-20261102. No incomplete push or lost code was found. The Work interface being stuck does not establish a failed Git command.

## Product-information milestone — staged, production verification pending

Reproduced the Royal Canin Mini Adult 2 kg failure through the actual production search form: correct Petworld R370 listing, but only a SKU and generic guidance in Product Info. The fetched publisher page contains a ProductGroup description and two child Product records. FindIt reads the child, whose description is absent, and never uses the parent description.

Research now reads that parent text only after the child independently matches. Require direct group membership, explicit matching primary-page addresses, consistent parent/child identity and brand, and matching published purchase quantities. A 2 kg annotation cannot supply 8 kg facts. Own child descriptions win; unrelated pages, missing provenance, conflicting names and recommendation lists remain excluded. Do not inherit prices, stock, SKUs, barcodes or identity. A trailing pipe/bullet pack annotation is validated, then excluded from prose so the preceding complete EPA-DHA sentence survives extraction. This is a generic ProductGroup repair, not stored product facts or a product-name exception.

The affected child recovers source-attributed functional text. Regression evidence retains 370/1160 prices unchanged and rejects inherited 2 kg text for 8 kg. Live-source staging confirms a useful 2 kg description and no borrowed 8 kg description. Local suite: 679 passed, 0 failed; syntax and diff checks pass. Hosted branch checks and actual deployed Product Info/Ask FindIt remain required.

The broad live-data gate now excludes SKU-only research and repeated product titles. It requires substantive attributed claims or at least two attributed non-identity technical fields. This corrects the weak 5/16 metric noted in the previous acceptance report; a changed metric is not claimed as an improved coverage percentage.

## Outstanding limits

Photo model/variant consistency, broad retailer coverage, Korg discovery, authoritative branch inventory and physical Samsung testing remain unfinished. Nearby production verification was not completed in this continuation: automatic approval review rejected a request containing exact test coordinates. That request was not retried or routed through another transport. Local fixture tests and public-source inspection can continue without transmitting coordinates. No new paid service, provider, secret or billing configuration was introduced.
