
-- Run once in Supabase SQL Editor before the first Awin bulk import.

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_sku_unique'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_sku_unique unique (sku);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'product_offers_retailer_external_unique'
      and conrelid = 'public.product_offers'::regclass
  ) then
    alter table public.product_offers
      add constraint product_offers_retailer_external_unique
      unique (retailer_id, external_product_id);
  end if;
end $$;
