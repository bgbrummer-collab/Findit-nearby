# FindIt retailer integrations

## Non-negotiable trust rules

1. An online product listing is not physical branch stock.
2. A collection point is not physical branch stock unless the retailer explicitly says the exact item is stocked at that branch.
3. A website price is not a branch price unless the retailer/store-specific source says it is.
4. Directions are allowed only when the exact product matches, that physical branch is in stock, and branch coordinates are known.
5. Unknown values stay unknown. FindIt never invents price, stock, quantity, branch, or distance.
6. Every verified branch result should carry a checked timestamp/source so freshness is visible.

## Connected branch-feed contract

`RETAILER_FEEDS_JSON` can point FindIt at retailer/partner feeds. Each feed should return either an array of products or `{ "products": [...] }`.

```json
{
  "id": "retailer-product-id",
  "name": "Exact product title",
  "brand": "Brand",
  "model": "Model or exact retailer SKU/model",
  "sku": "SKU",
  "category": "Category",
  "url": "https://retailer.example/product/exact-item",
  "price": 999.99,
  "currency": "ZAR",
  "availability": "in_stock",
  "stores": [
    {
      "id": "store-id",
      "name": "Retailer Branch Name",
      "address": "Physical address",
      "lat": -25.0,
      "lon": 28.0,
      "phone": "",
      "availability": "in_stock",
      "stock_quantity": 4,
      "price": 999.99,
      "currency": "ZAR",
      "checked_at": "2026-08-23T19:00:00Z"
    }
  ]
}
```

A product-level `price` is treated as retailer/online price. A store-level `price` is the only value eligible to be labelled a verified branch price. A branch with no coordinates may be shown as verified stock, but must not get Directions.

## Retailer-by-retailer semantics

| Retailer | Exact online product | Online price | Physical-branch rule | Branch price rule | Current FindIt behavior |
| --- | --- | --- | --- | --- | --- |
| Takealot | Direct product listing | Published listing price | Online-only marketplace; no retail branch assumption | N/A | Exact listing/search; no fake Directions |
| Makro | Product/search pages | Online/location-aware website price | Verify only from selected pickup/store stock or connected branch feed | Website price is not automatically in-store price | Exact listing + `Check pickup stock`; branch requires evidence |
| Checkers | Product/search/catalogue evidence | Local/promotional where available | Must be tied to store/delivery area or connected branch feed | Regional/store-specific source required | Exact search/listing; no generic-store trip |
| Pick n Pay | Product/search pages | Requires shopper location for local pricing | Local availability must be location/store-linked | Location-specific source required | Exact search/listing + local stock/price check |
| Shoprite | Product/search/catalogue evidence | Regional/local where available | Store/location-specific data required | Regional/store source required | Exact search/listing; no branch claim without feed |
| Woolworths | Direct product pages | Published online price | `Check In-store Availability` / selected-store data must confirm item | Store deal/price must be store-specific | Exact listing + `Check in-store availability` |
| Nike SA | Official product listing | Official online price | No branch inventory assumption from online listing | Store-specific source required | Exact official listing; no fake branch |
| adidas SA | Official product listing | Official online price | No branch inventory assumption from online listing | Store-specific source required | Exact official listing; no fake branch |
| Sportscene | Bash/retailer product listing | Published online price | TFG collection point alone is not shelf stock; connected inventory required | Store-specific source required | Exact listing + collection/store check; no fake branch |
| Totalsports | Bash/retailer product listing | Published online price | TFG collection point alone is not shelf stock; connected inventory required | Store-specific source required | Exact listing + collection/store check; no fake branch |
| Bash | Direct product listing | Published online price | Collection at a TFG store can be fulfilment, not proof of shelf stock | Store-specific inventory source required | Exact listing; collection not treated as branch stock |
| Superbalist | Direct online product listing | Published online price | Online-only for FindIt branch purposes | N/A | Exact listing; no branch Directions |
| Sportsmans Warehouse | Direct product listing | Published online price | Store-specific stock evidence required | Store-specific source required | Exact listing; no fake branch |
| Incredible Connection | Direct product page | Published product price | Product/store-stock lookup must explicitly say the item is available at that store; collection point alone is insufficient | Store-specific source required for branch price | Exact listing + `Check store stock`; ready for connected inventory |
| Game | Direct product page | Published online price | Online stock is not branch stock; store-specific inventory required | Store-specific source required | Exact listing; no fake branch |
| HiFi Corp | Direct product page | Published online price | Store-specific inventory required | Store-specific source required | Exact listing; no fake branch |
| Builders | Direct product/search page | Published online price | Click & Collect is useful, but branch shelf stock is verified only by store-specific inventory | Store-specific source required | Exact listing + `Check Click & Collect`; no fake branch |
| Leroy Merlin | Direct product/search page | Published online price | Store/location-specific inventory required | Store-specific source required | Exact listing; no fake branch |
| Clicks | Direct product/search page | Published online price | Store-specific inventory required | Store-specific source required | Exact listing; no fake branch |
| Dis-Chem | Direct product/search page | Published online price | Store-specific inventory required | Store-specific source required | Exact listing; no fake branch |

## Public retailer behavior checked during implementation

- Makro: online pricing can differ from physical-store pricing; pickup chooses a fulfilment store and stock should be confirmed before visiting. https://www.makro.co.za/pages/terms-of-use
- Pick n Pay: product availability and local pricing require delivery/location details. https://preview.pnp.co.za/
- Woolworths: product pages expose `Check In-store Availability`, and Click & Collect uses selected stores. https://www.woolworths.co.za/content/look/click-collect/_/A-cmp216144
- Incredible Connection: Click & Collect/store-stock flows can identify stores with stock, but collection can also involve moving stock to a collection point. https://www.incredible.co.za/services/help-centre/click-and-collect
- Builders: supports Click & Collect. https://www.builders.co.za/Click-and-Collect
- Bash/TFG: collection is available at many TFG stores, which must not be confused with existing shelf stock at that collection location. https://help.bash.com/support/solutions/articles/101000373234

## Next integration step when branch data is available

Add the retailer/partner feed to `RETAILER_FEEDS_JSON`. The existing product-intelligence and nearby endpoints will then use the feed for exact product matching and will promote a physical branch only when its stock is verified. If the feed also supplies a store-specific price, FindIt can label it `Verified branch price`; otherwise the branch can still be verified in stock while the price remains `Branch price not published`.
