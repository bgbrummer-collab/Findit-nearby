# Information and saved-shopping recovery

Fixed delayed Product Info research reopening a closed panel, failed candidate lookups leaving loading text, missing refresh/correction controls, saved collection flattening and cross-storage aggregation, reopening saved products for fresh research, stale previous-product offers entering shopping tools, and saved shopping snapshots remaining empty after verified prices arrive.

Product Info now shows sourced brand and identified size, hides the generic category `product`, and uses published precautions as clearly labelled practical considerations when independent drawbacks are unavailable.

Validation: 158 local unit tests passed, including six targeted recovery checks. Syntax checks passed. Production browser lookup of Marc Anthony Strictly Curls 3X Moisture Conditioner 250ml returned a sourced description, usage, ingredients, warnings and one retailer listing. Initial recovery deployment fe0df500 succeeded. Final production verification is still pending at report creation.

Limitations: local Playwright browser unavailable; browser download returned an invalid archive. Attached screenshot paths absent in this workspace, so the original photo was not reuploaded. Universal product coverage, unpublished facts and branch stock are not verified. This report does not certify all features as perfect.

## Final verification

Deployed code commit: 1f7ce5c4beaaac0e1764225a76421d4201d02074. Cloudflare deployment, release smoke, production smoke, regression checks, dashboard commerce regression and the complete local/production interaction suite all completed successfully. Local suite: 158 tests passed.

Manual production browser checks confirmed the current-product Product Info button uses the updated panel and exposes refresh/correction controls; conditioner research includes sourced brand and 250ml size, purpose, ingredients, usage and published precautions. Ask FindIt answered a combined purpose/use/price question with the Clicks R230 listing and source. Comparison and watchlist show the same price. Shopping list retained Clicks R230 across reload, and Saved Items reopened the product for current research.

Two manual cloud-browser actions reported Runtime.evaluate/protocol timeouts. The original photo attachments were unavailable at supplied paths, so this turn did not repeat the original image-upload test. Closing an in-flight lookup was manually confirmed to remain closed after its price arrived, and six targeted unit regressions cover recovery and saved evidence. These checks are not a guarantee for every product, retailer, device or network failure.
