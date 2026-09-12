# FindIt User-First Release Standard

This standard applies to every FindIt change, fix, test run, and release.

A feature is not finished because code compiles or an automated test passes. It is finished only when it behaves correctly from a real user's point of view.

## Required checks for every user-facing change

1. **Works correctly** — the action produces the intended result, not merely any result.
2. **Stays responsive** — no freezing, long main-thread stalls, repeated handlers, observer loops, or stuck controls.
3. **Shows the exact product** — no adjacent model, colour, size, product type, category page, or unrelated result may be presented as exact.
4. **Truthful commerce data** — prices, stock, branch availability, and retailer links must be verified or clearly marked unknown. Never infer branch stock from online stock.
5. **User-friendly presentation** — important information is easy to scan, layouts do not collapse, text remains readable, buttons are obvious, and error/loading/empty states explain what is happening.
6. **Useful behavior** — ask what a normal user expects the control to do. A technically functioning control that is confusing or unhelpful is not considered complete.
7. **Desktop and mobile** — check both common desktop and phone widths.
8. **Failure handling** — denied location, no results, API timeout, slow connection, unavailable retailer, bad image, and missing data must fail cleanly without freezing.
9. **Real interaction testing** — important flows must be clicked through, including opening, closing, switching tools, repeated clicks, and rapid navigation.
10. **No assumptions** — do not report a feature as finished unless the relevant behavior has been directly checked.

## Release blockers

Any of the following blocks a release-ready claim:

- freezing or major lag
- wrong product/variant shown as exact
- invented or misleading price/stock data
- broken or unreadable layout
- button or modal that does not respond as expected
- stale async result replacing the user's newer action
- desktop/mobile regression
- error state that leaves the interface stuck

## Testing rule

Automated tests are evidence, not proof by themselves. A release-ready claim requires automated checks plus realistic interaction checks for the changed user flow.

If a real user finds a bug that automated tests missed, add or strengthen a regression check so the same class of bug is less likely to return.
