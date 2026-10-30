# FindIt continuation audit — 30 October 2026

Continues the 29 October audit, preserving the existing design and features.

## Verified checkpoint

- Repository main: `055f77b163c3ba373aac48378832c5192ca63004` (merged PR #343).
- Production `/api/version` returned the same commit on 30 October.
- All 539 existing Node tests passed again, with zero failures; syntax checks passed.

## New live regression and repair

Using the production dashboard Search Product control, entered `Logitech G435` and submitted Find product information. The completed Product Information dialog had no product purpose, strengths or verified specifications. A direct production product-insights request reproduced the empty result.

The known manufacturer document adapter required a headset/headphones word, even when the user supplied the manufacturer and distinctive model. Permit the explicit Logitech + G435 query to discover the existing manufacturer document. Bare ambiguous models, conflicting explicit brands, wrong product types and accessory queries remain excluded. Every fetched page still passes the existing canonical/model/identity checks; no product specifications, prices or stock are stored in the repair.

A worker-route regression checks brand-and-model searches with and without separate brand fields, attributed manufacturer specifications, and rejection cases. The new test uses synthetic source content; it is not live-specification evidence.

## Open release limits

The previous audit's exact retailer coverage, tuner verification challenge, unverified branch stock, physical Samsung camera/GPS/notifications and lack of cross-device storage synchronization remain open. This audit is not a full launch or desktop/phone parity sign-off. Deployment of this repair and its UI retest must be recorded separately.

## Continued live and source verification

- All 543 local Node tests pass after the related fixes; syntax/diff checks pass.
- Production Dashboard Commerce suite passes on #343, including the prior G PRO purpose/strength failures.
- Ten-category live matrix on unchanged deployed #343: 5 passed and 5 failed. Electronics, clothing, beauty, toys and music returned verified offers plus information. Groceries, the requested white/blue shoe, tools, furniture and household did not complete the required useful-offer/information journey. Full compact evidence is in `launch-evidence-2026-10-30/commerce-matrix.json`. An HTTP 200 or honest empty state is not counted as a useful shopping pass.
- Actual G435 manufacturer photo uploaded using the visible Upload Photo control. First identification failed with a service message; retry identified `G435 headphones`, model G435, 85%, with brand left unconfirmed by the photo. Product Info then retrieved primary manufacturer weight, battery, included items and connection facts. Ask FindIt answered the submitted Bluetooth/weight/battery question with those attributed facts.
- That live dialog exposed package contents repeated under strengths and compatibility. New worker filtering keeps boxed contents in included items while retaining technical strengths and actual connections; a worker regression checks source attribution and section boundaries.
- Actual FirstShop catalogue returns G435 headset listings. The commerce verifier rejected them because `headphones` and `headset` scored as different type words when the model was known but photo brand was not. Canonicalize those two audio terms without lowering verification thresholds. The new code verifies the fetched FirstShop primary G435 blue/raspberry page at R1750 ZAR and in-stock online; this snapshot is not a confirmed colourway match for the photo. The photo did not corroborate colour. No branch inventory is established. New rejection tests cover wrong model, accessories, other product type and requested colour.
- Catalogue discovery can retry a distinctive explicit model when the full wording gives no valid candidate. Filtering retains the original separate colour/size constraints and leaves final SKU/page verification strict. Existing omitted-SKU discovery coverage still passes.
- A Bosch battery/charger kit was found but is deliberately excluded from a query that does not establish that package. Checkers' search response was a CloudFront rejection. Neither is treated as an exact offer success.
- The G435 API diagnostic is separate from the actual website upload; it is not substituted for the failed first UI attempt. Photo AI remains nondeterministic and cannot be certified failure-proof.
- The four PR GitHub suites remain queued with no assigned hosted runner. Local browser suites cannot start here because the Playwright browser executable is unavailable; cloud-browser live interactions above are separate evidence. No missing check is marked passed, and no workflow expectations were relaxed.

## Nivea actual photo retest

Selected the current Clicks 307992 primary front photograph through Upload Photo and clicked Identify & Find, without substituting a typed name. Result: `NIVEA deodorant`, 65%, with full Dark Wood/Black Carbon anti-perspirant label retained only as an unconfirmed hypothesis. Product Info supplies appropriate type guidance but no confirmed exact model or useful exact offer. This remains a failed exact-identification example, not a passed test. A separate API request hit the partial-identity cache; it does not provide fresh independent-reader diagnostics. The partial cache already expires after 120 seconds.

Playwright's official browser installer was attempted, but the downloaded browser archive was invalid/truncated. Automated local browser suites therefore remain unavailable. Hosted GitHub workflows still have no assigned runner. No CI or production rollout success is claimed for PR #344.
