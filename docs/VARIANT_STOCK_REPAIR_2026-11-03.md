# Selected-variant stock contradiction — 3 November 2026

Actual production 8 kg retailer-link test found Petworld R1160 and SKU3182550716888 selected, rendered Backordered. FindIt fd01808 incorrectly showed Online in stock. The page JSON-LD publishes InStock even though the primary selected variant publishes inventory quantity zero, available true and inventory policy continue. Buyability is not physical stock.

The verifier now downgrades this conflicting schema availability only after the primary template selected variant ID equals the URL variant and its published SKU equals the independently matched structured Product SKU. It reads that primary inventory component, ignores quick-add/recommendation components, and maps zero quantity plus continued orders to backorder. A nonavailable zero-stock variant becomes out_of_stock; contradictory deny metadata is unknown. Positive quantities do not create new availability claims. Prices and branch inventory claims are unchanged. No hardcoded product, retailer name, SKU or variant ID is in runtime code.

Regression fixture captures the public primary markup. Tests cover the real InStock conflict through verify(), unchanged R1160, sibling variants, wrong SKU, missing selection, recommendations, quick-add, positive inventory and contradictory policy. 682 Node tests passed; syntax and diff checks passed. A live-source local verifier returns backorder/R1160. Hosted branch checks and actual deployed UI verification are still required.

Evidence: launch-evidence-2026-11-03/petworld-eightkg-source.txt, backorder-staged.json and stock-tests.log. Duplicate tracking-URL listing issue remains separately tracked. This repair does not imply broad data coverage or launch readiness.
