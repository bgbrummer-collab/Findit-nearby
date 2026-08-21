# FindIt Full Production Audit

Generated: 2026-08-21T15:12:24.324Z

**Passes:** 87  
**Warnings:** 0  
**Failures:** 2

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
- ✅ **Challenge text populated** — Find a product you've always wondered about ✨
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
- ✅ **Identify & Find completes** — Running Shoe Graphic Art Print
- ✅ **Identification analysis cards render** — 8
- ❌ **Map view** — locator.click: Timeout 4000ms exceeded.
Call log:
  - waiting for locator('#mapViewBtn').first()
    - locator resolved to <button disabled id="mapViewBtn" title="No exact physical branch verified">🗺 Map</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    8 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 500ms

- ❌ **Map view opens** — map-wrap
- ✅ **List view**
- ✅ **Offer sort Best**
- ✅ **Offer sort Cheapest**
- ✅ **Offer sort Closest**
- ✅ **Free result actions are truthful** — search/copy/share available
- ✅ **Product intelligence shows no fake zero price** — No connected catalogue offer yet. The live exact-product search below is still checking real web listings.
Keep searching for the exact item
These links help you continue when veri
- ✅ **Thumbs up**
- ✅ **Thumbs up sets rating 5**
- ✅ **Thumbs down**
- ✅ **Thumbs down sets rating 2**
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
- ✅ **Built-in FindIt QA report passes** — {"time":"2026-08-21T15:12:24.322Z","missingElements":[],"missingPremiumFunctions":[],"premiumButtons":["scan","manual","exact","assistant","collections","watchlist","favourites","stats","history"],"ok":true}
- ✅ **No uncaught desktop JavaScript errors** — none
- ✅ **No uncaught mobile JavaScript errors** — none
- ✅ **No meaningful console errors** — none
- ✅ **No unexpected network failures** — none
