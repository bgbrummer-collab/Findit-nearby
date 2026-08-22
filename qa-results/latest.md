# FindIt Full Production Audit

Generated: 2026-08-22T10:02:47.496Z

**Passes:** 69  
**Warnings:** 0  
**Failures:** 19

- ✅ **Production homepage loads** — HTTP 200
- ✅ **Desktop has no horizontal overflow** — {"sw":1440,"cw":1440}
- ✅ **Desktop nav Find**
- ✅ **Desktop nav How**
- ✅ **Desktop nav Examples**
- ✅ **Desktop nav Feedback**
- ✅ **Open main drawer**
- ✅ **Main drawer opens**
- ✅ **Main drawer controls do not overlap** — 8 visible controls
- ✅ **Close main drawer**
- ✅ **Open Challenge**
- ✅ **Challenge modal visible**
- ✅ **New challenge**
- ✅ **Challenge text populated** — Find something you don't know the name of 👀
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
- ❌ **Feedback copy works** — locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('#copyFeedback')
    - locator resolved to <button type="button" id="copyFeedback" class="btn secondary" data-release-copy="1">Copy feedback</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not stable
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not stable
    - retrying click action
      - waiting 100ms
    - waiting for element to be visible, enabled and stable
    - element is not stable
  - retrying click action
    - waiting 500ms
    - waiting for element to be 
- ✅ **Free 25 km radius is Premium-gated** — gated
- ❌ **Free Save opens Premium** — control is not visible
- ❌ **Free Save gate visible** — not visible
- ✅ **Open Premium modal**
- ✅ **Free/Premium comparison visible**
- ✅ **Activate Premium Beta**
- ✅ **Premium activates** — active
- ✅ **Premium command centre fits desktop** — {"sw":1218,"cw":1218}
- ✅ **Premium heading fits** — width=958
- ❌ **All visible V10 tools include How guidance** — scan,manual,exact,assistant,collections,watchlist,favourites,stats,history
- ❌ **Open Premium guide** — control is not visible
- ❌ **Premium guide has full help** — not visible
- ❌ **V10 scan opens** — locator.click: Timeout 4000ms exceeded.
Call log:
  - waiting for locator('[data-v10="scan"]').first()
    - locator resolved to <button type="button" data-v10="scan" class="v10-launch-main">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div id="searchOverlay" class="search-overlay">…</div> intercepts pointer events
    - retrying click action
    - waiting 20ms
    - waiting for element to be visible, enabled and stable
    - element is not stable
  - retrying click action
    - waiting 100ms
    - waiting for element to b
- ❌ **V10 manual opens** — locator.click: Timeout 4000ms exceeded.
Call log:
  - waiting for locator('[data-v10="manual"]').first()
    - locator resolved to <button type="button" data-v10="manual">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div id="searchOverlay" class="search-overlay">…</div> intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not stable
    - retrying click action
      - waiting 100ms
    - waiting for element to be visible, e
- ❌ **V10 exact opens** — locator.click: Timeout 4000ms exceeded.
Call log:
  - waiting for locator('[data-v10="exact"]').first()
    - locator resolved to <button type="button" data-v10="exact">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div id="searchOverlay" class="search-overlay">…</div> intercepts pointer events
    - retrying click action
    - waiting 20ms
    - waiting for element to be visible, enabled and stable
    - element is not stable
  - retrying click action
    - waiting 100ms
    - waiting for element to be visible, enabled and
- ✅ **V10 assistant opens** — AI Search
- ✅ **V10 collections opens** — Collections
- ✅ **Collections create control works** — created
- ✅ **V10 watchlist opens** — Exact price & stock tracker
- ✅ **V10 favourites opens** — Favourite Stores
- ✅ **V10 stats opens** — My FindIt Stats
- ✅ **V10 history opens** — History+
- ✅ **Premium drawer has visible, vertical controls** — 12 controls
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
- ✅ **Mobile drawer controls vertical** — 8
- ✅ **Mobile bottom nav visible** — 4
- ✅ **Mobile More**
- ✅ **Mobile More opens drawer**
- ✅ **Health API live** — {"ok":true,"geminiKeyConfigured":true,"model":"gemini-3.6-flash","modelReachable":true,"message":"Gemini connection is ready."}
- ✅ **Feedback health API live** — {"ok":true,"provider":"formspree","formspreeConfigured":true,"message":"Formspree feedback delivery is configured."}
- ❌ **Built-in FindIt QA report passes** — Error
- ✅ **No uncaught desktop JavaScript errors** — none
- ✅ **No uncaught mobile JavaScript errors** — none
- ✅ **No meaningful console errors** — none
- ✅ **No unexpected network failures** — none
