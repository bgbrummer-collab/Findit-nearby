# Branch details repair checkpoint — 2026-10-11

Production commit 53a6d4534234cab8064b29e649fdf0296962a8f5 was verified using /api/version. Its store-hours endpoint returned the official Computer Mania The Grove Mall phone, address and weekly opening schedule for the public branch coordinates -25.766866, 28.321128. Full response is in evidence/computer-mania-branch-2026-10-11.json.

Underlying failures: missing map address prevented website research; Computer Mania locator cards were not parsed and exceeded the old HTML size limit; official pages loaded slower than the 3.5-second limit; product discovery used an outdated Computer Mania hostname. Repairs preserve coordinate/address branch corroboration and scoped contact extraction. Concurrent branch requests share locator downloads, and official research runs alongside map queries.

Local suite: 172 tests passed, zero failed, including wrong-branch rejection, locator scoping, missing-address coordinate matching, AM/PM conversion, concurrent locator sharing and exact-product catalogue verification with mocked evidence. Mock catalogue price is test data, not a production price claim.

Limitations: the production branch status remains unknown for holiday-exception schedules. All-retailer coverage is NOT verified. Google Places integration is not configured or enabled; no paid service was activated. A customer browser search for Logitech PRO X Gaming Headset 981-000818 still returned generic product guidance and no verified offers before the hostname repair. Exact-image product research remains incomplete. Nearby category discovery is not proof of exact branch stock. Headphone searches no longer include phone-only shop tags.

Next: verify the corrected product-discovery deployment, retest customer product info and Ask FindIt, expand source adapters based on actual other-chain branch pages, and test the full retailer-details UI at a permitted location. Do not claim project completion from passing mocked tests.
