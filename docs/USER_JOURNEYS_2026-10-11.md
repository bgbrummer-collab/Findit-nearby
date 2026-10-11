# Original-photo customer journeys, 11 October 2026

All four original JPEGs were uploaded through the production website's normal file chooser and Identify & Find button. Product Info was opened for each. Questions were entered in the visible FindIt Assistant.

| Photo | Observed identity | Actual buying question | Before-fix outcome |
|---|---|---|---|
| Build it paint | Build it paint, possible Floor & Stoep label | Outdoor concrete suitability, application, size and price | No useful product explanation or verified offer; assistant repeated missing price and model confirmation |
| Nike shoe | Nike shoes | Exact model, colourway, running suitability and sizes | Generic footwear overview; assistant repeated unconfirmed model and missing availability |
| Twinsaver tissues | Twinsaver tissues, size text 120 | Sheet count, plies, purpose and exact pack seller | Generic object sentence; assistant gave no useful pack explanation |
| Shure microphone | Shure microphone | USB or XLR, required equipment and seller | Basic microphone definition; assistant repeated missing model and retailers |

The full Twinsaver Comfort Super Soft & Gentle 3 ply 120 white tissues label was also entered through the normal correction form. Exact search still found no sourced description or verified offer. This is an outstanding source-discovery failure, not a successfully completed shopping journey.

Normal free Premium Beta activation was used (the UI explicitly says real payments are disabled). Tissue price comparison displayed no verified prices. Shopping list addition, Save Find and Watch Item worked. The list did not invent a total. Watchlist showed waiting for a verified price and disclosed that closed-site background notifications require a server service.

## Shared repair

- Added general product-type buying guidance for floor paint, paint, facial tissues, footwear, microphones, conditioner and headphones. No exact model specification, price or inventory is inferred from this guidance.
- Product Info and Ask FindIt use the same guidance module.
- Partial assistant answers explain practical checks rather than only repeating model confirmation.
- Unconfirmed size/model fields are marked check label.
- Source-free exact search also retains explicitly general guidance.
- Static deployment includes the browser guidance module.

165 Node tests pass, including partial-photo practical question coverage and rejecting exact invented models/pack specifications. Production `/api/version` confirms `bf2821a9e6bf34b3a6b4eccb76f3e7b93ed559d7`; its browser module is served successfully.

## Outstanding

These four photo-to-purchase journeys have not passed exact SKU, researched specification, verified price and stock acceptance. Native catalogue searches returned no useful confirmed candidate in the observed panels. Broader live uncommon-product regression previously failed. Exact variant selection, authoritative research discovery and accessible branch inventory remain material gaps. Do not describe this report as full application completion.
