# Unresolved barcode repair

Production reproduction on commit 5fb11c3 used the normal Scan barcode panel with EAN 4959112179103, published on the previously verified Korg retailer listing. The interface labelled the numeric query as confirmed and Product Information displayed unrelated Spotify Community support material. An unresolved catalogue lookup must not establish product identity.

The repair keeps an unresolved barcode separate from a confirmed product name, removes the code from the model field, suppresses broad web research for barcode-only identities, and provides a product-name/model recovery action. Sourced food-catalogue matches keep their existing behavior. The commerce endpoint still independently checks GTINs before accepting exact retailer offers.

696 local tests passed, including the new unknown-barcode regression. Production deployment and UI recheck follow the repair PR.
