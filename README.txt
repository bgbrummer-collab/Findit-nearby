FINDIT NEARBY — ONE COMPLETE BUILD
==================================

This build combines the current functional backend with the complete visual redesign discussed in chat.

INCLUDED
- New slogan: You saw it. You wanted it. You found it with FindIt.
- Dark blue/purple/cyan visual redesign
- Animated glowing hero/upload card
- Rotating sets of 6 example-item cards with staggered transitions
- FindIt Challenge random prompts
- Searching/scanning overlay with staged progress messages
- You FoundIt result moment
- Correct/change item controls
- Consumer-facing nearby retailer cards
- List / map toggle and linked map markers
- 3 / 5 / 10 km radius controls and 20 km manual wider fallback
- Nothing-found actions
- Recent finds stored locally
- Slide-out main menu
- Mobile bottom navigation
- Settings for animations, radius, clear history
- Quick thumbs-up / thumbs-down feedback flow
- Full Supabase feedback + diagnostic metadata
- Universal + specialist item categories
- Hearing aids / audiology and many less-common items
- Hot chocolate / grocery mapping
- Consumer-retailer rule: factories/manufacturers/warehouses are excluded from nearby results
- Maps fallback searches retailer types (e.g. supermarket) rather than the product/manufacturer
- Verified prices/stock are shown only if an authorised retailer feed supplies them
- Copyright: © 2026 Bernard Brummer — FindIt Nearby. All rights reserved.

VERCEL ENVIRONMENT
Keep the environment variables already connected:
- GEMINI_API_KEY
- NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY

OPTIONAL
- RETAILER_FEEDS_JSON for authorised retailer catalogues later

HEALTH TESTS AFTER DEPLOYMENT
- /api/health
- /api/feedback-health

IMPORTANT DATA RULE
A nearby retailer is a relevant consumer-facing place that may sell that item type. It is not an exact-stock claim unless FindIt has verified retailer inventory data.
