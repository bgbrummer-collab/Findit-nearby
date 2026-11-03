# Commerce evidence and display follow-up — 3 November 2026

NOT LAUNCH-READY.

PR359 deployed as e0930a5ccbb35ce7042a2761200a392fee3fee95; actual browser frontend metadata and public API version match. All ten workflows for that commit succeeded. The actual Accu-Chek production search still returns zero offers. A separate production API request returns zero offers in 4492 ms. The direct Dis-Chem browser page displays the matching Instant Meter, R284.99, with its cash-only Single Exit Price disclaimer excluding the dispensing fee. The local Worker with real sources recovers the page. Therefore the queue bug is fixed structurally, but it is not the complete root cause of this production failure. Do not call this customer issue fixed.

This follow-up adds bounded diagnostics to the existing commerce result: candidate counts and up to 48 public-source read outcomes (host, phase, status, outcome and character count). It does not return source bodies, query URLs, credentials or customer location. Product reads distinguish HTTP errors, timeout, fetch error, unsupported content and a rendered verification challenge. Detected challenges are rejected without a reader retry. This is investigative evidence, not proof that a source is healthy or that a result is correct. Public health remains configuration-only.

The real 8kg search on e0930a5 shows Petworld's matching variant at R1229.90 as `Online stock not verified` even though the verifier returns backorder. Top Stores previously handled only in_stock and out_of_stock. It now retains supported backorder and preorder labels, with branch stock separately unverified. Current prices differ from prior captures; no stored price was added or fixed in code.

Local validation: 688 tests passed, zero failed; syntax and diff checks passed. Real-source staging returns Accu-Chek R284.99/online in_stock and the selected 8kg Petworld page R1229.90/backorder. Production diagnostics and actual repaired label remain pending deployment.

Additional actual production evidence on e0930a5/predecessor: a new neutrally named real Logitech mouse photograph produces Logitech mouse,65%, exact model unconfirmed, no price. This is an honest partial identification; the photo does not show a model code. Shopping-list add survives reload; the test item was removed afterwards. Manual barcode5449000000996 retrieves attributed Coca-Cola330ml catalogue data; no exact retailer listing is verified. Camera barcode detection is unsupported in this browser. Premium entitlements were preserved; no premium feature was unlocked to test it.
