
create or replace view public.findit_product_catalog as
select
  p.id as product_id,p.name,p.brand,p.model,p.category,p.gtin,p.sku,p.image_url,
  r.name as retailer,r.website as retailer_website,
  o.id as offer_id,o.price,o.original_price,o.currency,o.availability,o.stock_quantity,
  o.product_url,o.verified,o.source,o.source_updated_at,o.updated_at
from public.products p
left join public.product_offers o on o.product_id=p.id
left join public.retailers r on r.id=o.retailer_id;
