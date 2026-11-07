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

## Authorized online catalogues on Cloudflare

FindIt's production commerce endpoint can query one authorized catalogue gateway per market. The gateway normalizes approved retailer APIs or feeds into a common contract. It can index feeds out of band, so search does not issue a separate request for each participating retailer.

- Configure the Worker secret `RETAILER_CATALOGUES_JSON` as an object keyed by country, for example `{"ZA":{"endpoint":"https://catalogue.example.com/search","currency":"ZAR","retailers":[{"domain":"takealot.com","name":"Takealot"}]}}`.
- Set the Worker secret `RETAILER_CATALOGUE_TOKEN` to the gateway bearer token. Keep retailer credentials on the gateway. Add a retailer to a market only once its source is authorized for FindIt's use. A domain entry alone does not connect a retailer.
- The gateway receives a POST with `country`, `query`, optional `barcode`, and `limit`. It returns `{"products":[...]}`. Each row represents a specific online listing and includes `title`, `sku`, `url`, `country`, and the original source observation timestamp `checkedAt`. Optional fields include `model`, `size`, `color`, `gtin`, numeric `price`, `currency`, `priceConditions`, and `availability` (`in_stock`, `out_of_stock`, `backorder`, or `preorder`). Use source timestamps, including when reading a cached feed. Apply provider-specific freshness or display restrictions before returning a row.
- FindIt accepts up to 50 rows within 256 KiB and five seconds. It checks the exact retailer domain and variant, requires a matching GTIN for barcode searches, rejects rows older than one hour, and drops prices in a currency other than the configured market currency. The gateway receives no coordinates or photos. Physical branch evidence remains separate.
- The request country takes precedence over Cloudflare's country, with ZA as fallback. The existing public discovery paths remain available. This connection does not implement a market selector in the UI.

| Market | Source onboarding |
| --- | --- |
| ZA | Takealot, Makro, Game, Checkers, Pick n Pay, Incredible Connection, HiFi Corp, Sportsmans Warehouse, Woolworths, Clicks, Dis-Chem, Mr Price, PEP and Ackermans can be added through an approved source. Takealot's [Marketplace API](https://marketplace-api.takealot.com/v1/docs) is for seller operations and does not establish permission for storefront-wide discovery. |
| US and other supported markets | Evaluate the [Amazon Creators API](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction) per marketplace and [Best Buy Products API](https://developers.bestbuy.com/apis) for US catalogue access. For [Walmart](https://affiliates.walmart.com/page/faqs) and [Target](https://partners.target.com/), verify access to suitable data and the applicable rights through their partner programmes before connecting. |

### Production baseline on 6 November 2026

Production reported commit `86f513c` throughout the 16-case typed matrix. Six cases returned an exact listing. Four cases passed the strict journey check, including useful product research and verified priced offers. Five cases had a verified price, four in ZAR and one in USD. FirstShop, Central Vet, Petworld and Orms returned ZAR prices. Tillys returned the USD backpack offer. Amazon returned rowing machine listings without a verified price. All four sampled ZAR prices matched a separate direct source read. These measurements cover the sampled listing prices, before checkout.

Five existing photo fixtures were uploaded to production. Four returned partial identities and one (Twinsaver 18-roll toilet paper) returned a variant and pack count without requesting confirmation. The Menlyn-area nearby check returned relevant candidate branches for two of six categories (Sportsmans Warehouse for running shoes and Builders for drills). Music, groceries, clothing and computer accessories returned no branches on this run. Zero results claimed exact branch stock.

The deployed Korg Pitchclip 2 search returned no verified offer. Marshall Music's exact listing and public Store API returned HTTP 403. The staged Worker returned exact listings with live ZAR prices from OneStopMusic (in stock online) and DistriNode (out of stock online), without making branch claims. The regression asserts exact product, direct retailer evidence, a positive ZAR price, exclusion of the adjacent Plus variant and no unsupported physical-store claims. It can be rerun against the deployed Worker using `FINDIT_URL`.
