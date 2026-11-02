# FindIt repair and acceptance tracker — 2 November 2026

**NOT launch-ready.** Baseline: main `0931b2b2b568acf38f6c63d327ff4ca4a4953fe3`, confirmed by production `/api/version`. No redesign, rebuild, paid integration or secret change.

## Architecture and audit

The original static dashboard loads multiple existing runtime layers. Cloudflare serves root assets from `cloudflare-public` and handles search, commerce, research, assistant and nearby APIs. Photo identification reconciles independent readers, including the existing Vercel Gemini bridge and Workers AI. Commerce discovers candidates through public retailer catalogues/search and verifies individual pages using the shared intelligence core. Product Info extracts attributed source text; Ask FindIt consumes this research. Browser fallback caches and device-local saved/history/settings remain separate from server data. Deployment is GitHub Actions plus Wrangler with a stamped frontend build and Worker BUILD_COMMIT.

Reviewed October 17/18 launch checklists, October 31 feature/category/retailer reports, current workflows, latest five commits, open PR inventory and production UI. PR #308 is already merged. PR #353 remains open; its photo-schema/pet/fitness changes are not on baseline main. Do not recreate them or count them as deployed. Older open probe PRs are not production evidence. Latest main deploy and sampled workflows succeeded; this does not certify product data quality.

## Confirmed issue tracker

| ID | Priority | Root cause / observed problem | Focused repair | Acceptance evidence required | State |
|---|---|---|---|---|---|
| EXACT-01 | P0 | Subset identity matching accepted R50 V for an R50 query; Product Info borrowed the used V listing's condition/contents | Reject differing camera generation/video suffixes in shared identity and variant gates | Failing regression, real production search, no V offer or source facts, genuine R50 listings retained | Local repair, production pending |
| PHOTO-01 | P0 | Real original shoe upload yields Nike shoes, no confirmed model/price; prior reports record conflicting model readers | Diagnose provider claims and review existing PR353 before further changes; retain uncertainty | New photographs through customer UI, repeatability and exact variant/page evidence | Unresolved |
| DATA-01 | P0 | Broad live catalogue coverage remains poor | Investigate failed categories without relaxing exactness | Stable production matrix and independent listing review | Unresolved |
| INFO-01 | P1 | Keyword classification promoted slogans to strengths and social connection wording to compatibility | Filter advertising calls/slogans; require technical connection context | Failing regression plus Sony production Product Info and Ask FindIt | Local repair, production pending |
| CACHE-01 | P1 | Browser fallback data could retain previously misclassified facts/offers after server repair | Rotate only research/commerce fallback namespaces | Regression suites and production reload | Pending |
| STOCK-01 | P1 | No authoritative SKU-by-branch inventory integration established | Keep branch stock unverified; integrate only a permitted authoritative source | Independent current branch inventory evidence | Integration unresolved |
| DEVICE-01 | P1 | Remote browser cannot prove physical Samsung camera/GPS/barcode hardware behavior | Test available browser paths; retain physical-device limitation | Actual physical device testing | NOT TESTED |
| REL-01 | P1 | Previous reports reproduce resource errors; current scoped tests are not load certification | Capture actual failures and traces before changing architecture | Production traces plus scoped reliability tests | Unresolved |
| TOOLS-01 | P2 | Complete populated tool/navigation/settings sweep outstanding | Exercise real customer actions | Latest production evidence for each action | In progress |

## Baseline real customer observations

- Actual Upload Photo chooser accepted original `tests/user-images/nike.jpg.b64`, then Identify & Find returned **Nike shoes, 65%, model confirmation required**, no price. Upload transport works; precise identification fails this journey. No typed identity was substituted.
- Actual typed Sony WH-1000XM5 Black returned FirstShop R8399 ZAR, online stock, explicitly unverified branch stock. Product Info repeated three advertising slogans and classified “connect with friends” as compatibility. This is a useful priced listing with failed information classification, not a full feature PASS.
- Actual Canon EOS R50 camera body search returned three Orms listings, including **USED R50 V**. Product Info used its condition/shutter-count/purchase-document text as the selected product's purpose. Wrong model source is a confirmed P0 failure.
- The 16-query API matrix held baseline version stable. Its original metric reported 4/16; independent review invalidates the camera result because of the wrong model. Therefore at most **3/16** baseline journeys meet that matrix's criteria. Colour alternatives in the mouse-pad query are not identical variants for cheapest-price comparison. Unpriced relevant pages remain incomplete commerce journeys. Raw baseline: `launch-evidence-2026-11-02/broad-before.json`.
- Baseline local tests: 637 passed. Added regression reproduced the slogans/compatibility failure; camera regressions reproduced the model failure. After local repairs, 645 tests pass. Local tests are not production acceptance.

## Acceptance matrix

Statuses below describe this session's current evidence, not inherited blanket passes.

| Feature | Status | Test performed | Evidence | Remaining problem |
|---|---|---|---|---|
| Photo identification | PARTIAL | Original shoe upload and real identify action | Browser, baseline main | Family only, exact model absent |
| Text search | PARTIAL | Sony and Canon actual UI; 16-query API matrix | Baseline raw JSON and UI | Wrong model and incomplete catalogue coverage |
| Barcode search | NOT TESTED | No current session journey yet | Historical tests excluded | Real latest-build retest |
| Product information | FAIL | Sony and Canon actual dialogs | Baseline observations above | Slogans, wrong model facts |
| Ask FindIt | NOT TESTED | Current session pending | None yet | Grounded answer retest |
| Retailer matching | FAIL | R50 actual UI | Wrong R50 V accepted | Production repair verification |
| Prices and currency | PARTIAL | Sony R8399 ZAR | Actual UI and raw matrix | Broader variant coverage |
| Stock information | PARTIAL | Sony online/branch distinction | Actual UI | Authoritative branch feeds absent |
| Nearby stores | NOT TESTED | Current session pending | None yet | Location/category retest |
| Maps | NOT TESTED | Current session pending | None yet | Real map controls and pins |
| Saved items | NOT TESTED | Current session pending | None yet | Save/reload/reopen |
| Search history | PARTIAL | Sony/shoe/Canon shown in recent history | Actual UI | Reopen/reload pending |
| Mobile functionality | NOT TESTED | Current session pending | None yet | Responsive and hardware scope |
| Desktop functionality | PARTIAL | Upload/search/dialogs used | Actual UI | Complete tool sweep |
| Deployment | PARTIAL | Version matches main, workflow succeeded | `/api/version`, Actions | Repairs not deployed yet |

No all-product reliability, physical device parity or public launch acceptance is claimed.
