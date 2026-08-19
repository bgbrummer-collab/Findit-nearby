# FindIt Full Production Audit

Generated: 2026-08-19T13:04:57.937Z

**Passes:** 80  
**Warnings:** 0  
**Failures:** 9

- ✅ **Production homepage loads** — HTTP 200
- ✅ **Desktop has no horizontal overflow** — {"sw":1440,"cw":1440}
- ✅ **Desktop nav Find**
- ✅ **Desktop nav How**
- ✅ **Desktop nav Examples**
- ✅ **Desktop nav Feedback**
- ✅ **Open main drawer**
- ✅ **Main drawer opens**
- ✅ **Main drawer controls do not overlap** — 9 visible controls
- ✅ **Close main drawer**
- ✅ **Open Challenge**
- ✅ **Challenge modal visible**
- ✅ **New challenge**
- ✅ **Challenge text populated** — Find something older than you 🕰️
- ✅ **Examples render** — 6 cards
- ✅ **Shuffle examples**
- ✅ **Open drawer for settings**
- ✅ **Open Settings**
- ✅ **Settings visible**
- ✅ **Animations toggle works**
- ✅ **Free radius options 3/5/10 work** — 3,5,10
- ✅ **Image picker accepts a real raster image**
- ✅ **Use my location**
- ✅ **Location becomes ready** — ✓ Location ready
- ❌ **Identify & Find completes** — page.waitForSelector: Timeout 50000ms exceeded.
Call log:
  - waiting for locator('#results:not(.hidden)') to be visible

- ❌ **Identification analysis cards render** — 0
- ❌ **Map view** — control is not visible
- ❌ **Map view opens** — map-wrap
- ❌ **List view** — control is not visible
- ✅ **Offer sort Best** — not applicable: no verified offers
- ✅ **Offer sort Cheapest** — not applicable: no verified offers
- ✅ **Offer sort Closest** — not applicable: no verified offers
- ✅ **Free result actions are truthful** — low-confidence/result fallback shown instead of fake actions: Item identified
- ✅ **Product intelligence shows no fake zero price** — not applicable: panel hidden for this result
- ❌ **Thumbs up** — control is not visible
- ❌ **Thumbs up sets rating 5** — not 5
- ❌ **Thumbs down** — control is not visible
- ❌ **Thumbs down sets rating 2** — not 2
- ✅ **Feedback form has empty-message validation** — browser required validation active
- ✅ **Feedback copy works** — ✓ Feedback copied.
- ✅ **Free 25 km radius is Premium-gated** — gated
- ✅ **Free Save opens Premium**
- ✅ **Free Save gate visible**
- ✅ **Open Premium modal**
- ✅ **Free/Premium comparison visible**
- ✅ **Activate Premium Beta**
- ✅ **Premium activates** — active
- ✅ **Premium command centre fits desktop** — {"sw":1218,"cw":1218}
- ✅ **Premium heading fits** — width=820
- ✅ **All visible V10 tools include How guidance** — 9 tools
- ✅ **Open Premium guide**
- ✅ **Premium guide has full help** — 13 entries
- ✅ **V10 scan opens** — routed to finder
- ✅ **V10 manual opens** — Manual Search
- ✅ **V10 exact opens** — performed external exact-match action
- ✅ **V10 assistant opens** — AI Search
- ✅ **V10 collections opens** — Collections
- ✅ **Collections create control works** — created
- ✅ **V10 watchlist opens** — Exact price & stock tracker
- ✅ **V10 favourites opens** — Favourite Stores
- ✅ **V10 stats opens** — My FindIt Stats
- ✅ **V10 history opens** — History+
- ✅ **History+ supports per-item delete when entries exist** — 1 -> 0
- ✅ **Premium drawer has visible, vertical controls** — 13 controls
- ✅ **Premium drawer route: Saved Items** — wired
- ✅ **Premium drawer route: Compare Stores** — wired
- ✅ **Premium drawer route: Smart Filters** — wired
- ✅ **Premium drawer route: Search Radius** — wired
- ✅ **Premium drawer route: Extended History** — wired
- ✅ **Premium drawer route: Premium Challenge** — wired
- ✅ **Premium drawer route: Premium Settings** — wired
- ✅ **Price & Stock Watchlist route visible and wired** — wired
- ✅ **Open Ask FindIt**
- ✅ **Assistant opens**
- ✅ **Assistant quick prompt responds** — 3 messages
- ✅ **Mobile homepage loads**
- ✅ **Mobile has no horizontal overflow** — {"sw":390,"cw":390}
- ✅ **Mobile menu opens**
- ✅ **Mobile drawer controls vertical** — 9
- ✅ **Mobile bottom nav visible** — 4
- ✅ **Mobile More**
- ✅ **Mobile More opens drawer**
- ✅ **Health API live** — {"ok":true,"geminiKeyConfigured":true,"model":"gemini-3.6-flash","modelReachable":true,"message":"Gemini connection is ready."}
- ✅ **Feedback health API live** — {"ok":true,"provider":"formspree","formspreeConfigured":true,"message":"Formspree feedback delivery is configured."}
- ✅ **Built-in FindIt QA report passes** — {"time":"2026-08-19T13:04:57.935Z","missingElements":[],"missingPremiumFunctions":[],"premiumButtons":["scan","manual","exact","assistant","collections","watchlist","favourites","stats","history"],"ok":true}
- ✅ **No uncaught desktop JavaScript errors** — none
- ✅ **No uncaught mobile JavaScript errors** — none
- ✅ **No meaningful console errors** — none
- ✅ **No unexpected network failures** — none
