# Retailer identity matching repair

The user's screenshot showed only Clicks for Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml. Independently fetching Dis-Chem's exact product page found an abbreviated title, “Marc Anthony 3x Moist Conditioner 250ml”, and a Product JSON-LD description containing the full Strictly Curls/Triple Blend identity. The previous exact-title requirement discarded this real listing.

Changed generic structured product matching to accept an abbreviated descriptive title only when its own Product node description supplies every requested meaningful word. Explicit models cannot use this fallback. Brand, explicit size/color, numeric identity words and product-type exclusions remain enforced on the title. Unrelated page text and recommended products cannot supply missing identity evidence. Price and online stock still come from the matching Product node's offer. No retailer-specific price was hardcoded.

Application commit: 04fcf3f91c1efac30d921039ea81ab9dbe0a8047. 159 unit tests passed, including wrong size, wrong product type, missing description and conflicting model exclusions. Cloudflare deployment succeeded and the production version endpoint confirmed this commit.

Actual production API and normal browser text-search→Product Info→Compare returned two exact listings: Dis-Chem R206.99 ZAR and Clicks R230 ZAR. Both published online availability in stock, with branch stock explicitly unverified. Dis-Chem's structured current offer price was R206.99; its page also contained the higher original R229.99 price, which was not substituted for the structured current offer. Screenshot and live API evidence saved beside this report.

This is a generic identity-verification repair, not a claim of access to every retailer. Retailer discovery coverage remains incomplete, some pages require unavailable data, and nearby shops do not prove that they sell the exact item. No precise location supplied during this browser test. No private branch inventory verified, and no paid services activated.
