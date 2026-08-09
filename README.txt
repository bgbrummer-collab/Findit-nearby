FindIt Nearby V11

MAIN CHANGE FROM V10:
V11 introduces a confidence gate and removes the unsafe behaviour of showing arbitrary nearby stores when the visual classifier is uncertain.

Search rules:
1. Analyse the image.
2. Require a confidence threshold AND a meaningful gap between the best and second-best class.
3. If uncertain: show "We won't guess" and NO stores.
4. If confident: search only the detected item's relevant categories.
5. Exact prices, stock and store results require verified retailer/catalogue data.
6. If no verified catalogue result exists, the UI clearly says so and may show relevant mapped businesses only as a non-stock fallback.

This prevents a flower image from becoming a random electronics search.

REAL DATA:
The backend deliberately returns no live product offers until an authorised retailer/catalogue connector is configured. Do not fabricate product, price, stock or store information.

DEPLOYMENT:
- GitHub Pages can host the frontend.
- backend/ must be deployed separately on an HTTPS Node host.
- Set window.FINDIT_API_BASE in the frontend to the backend URL when the backend is connected.

© 2026 FindIt Nearby. All rights reserved.
