-- Optional helper view for easier debugging in Supabase
create or replace view public.feedback_debug as
select
  id,
  rating,
  topic,
  message,
  technical->>'item' as item,
  technical->>'searchQuery' as search_query,
  technical->>'retailCategory' as retail_category,
  technical->>'recognitionConfidence' as recognition_confidence,
  technical->>'exactProductMatch' as exact_product_match,
  technical->>'exactOfferCount' as exact_offer_count,
  technical->>'nearbyStoreCount' as nearby_store_count,
  technical->>'closestStoreDistanceKm' as closest_store_distance_km,
  technical->>'nearbyRadiusKm' as nearby_radius_km,
  technical->>'nearbyRetailGroup' as nearby_retail_group,
  technical->>'nearbyReliable' as nearby_reliable,
  technical->>'lastError' as last_error,
  created_at
from public.feedback
order by created_at desc;

grant select on public.feedback_debug to service_role;
