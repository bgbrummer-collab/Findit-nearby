# FindIt Full Production Audit

Generated: 2026-08-20T18:49:07.811Z

**Passes:** 31  
**Warnings:** 1  
**Failures:** 55

- ✅ **Production homepage loads** — HTTP 200
- ✅ **Desktop has no horizontal overflow** — {"sw":1440,"cw":1440}
- ✅ **Desktop nav Find**
- ✅ **Desktop nav How**
- ✅ **Desktop nav Examples**
- ✅ **Desktop nav Feedback**
- ✅ **Open main drawer**
- ❌ **Main drawer opens** — not visible
- ✅ **Main drawer controls do not overlap** — 9 visible controls
- ❌ **Close main drawer** — locator.click: Timeout 4000ms exceeded.
Call log:
  - waiting for locator('#closeMenu').first()
    - locator resolved to <button id="closeMenu" class="icon-btn">×</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - element is outside of the viewport
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - element is outside of the viewport
    - retrying click actio
- ✅ **Open Challenge**
- ❌ **Challenge modal visible** — not visible
- ❌ **New challenge** — control is not visible
- ✅ **Challenge text populated** — Find something unusual.
- ❌ **Examples render** — 0
- ✅ **Shuffle examples**
- ✅ **Open drawer for settings**
- ❌ **Open Settings** — locator.click: Timeout 4000ms exceeded.
Call log:
  - waiting for locator('#openSettings').first()
    - locator resolved to <button id="openSettings">⚙ Settings</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - element is outside of the viewport
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - element is outside of the viewport
    - retrying click action

- ❌ **Settings visible** — not visible
- ❌ **Animations toggle works** — locator.isChecked: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('#animationsToggle')

- ❌ **Free radius options 3/5/10 work** — locator.selectOption: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('#settingsRadius')

- ❌ **Image picker accepts a real raster image** — Identify disabled
- ✅ **Use my location**
- ❌ **Location becomes ready** — 📍 Use my location
- ❌ **Identify & Find completes** — locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('#search')
    - locator resolved to <button disabled id="search" class="btn find-btn">✨ Identify & Find</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    56 × waiting for element to be visible, enabled and stable
       - element is not enabled
     - retrying click action
       - waiting 500ms

- ❌ **Identification analysis cards render** — 0
- ❌ **Map view** — control is not visible
- ❌ **Map view opens** — locator.getAttribute: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('#mapWrap')

- ❌ **List view** — control is not visible
- ✅ **Offer sort Best** — not applicable: no verified offers
- ✅ **Offer sort Cheapest** — not applicable: no verified offers
- ✅ **Offer sort Closest** — not applicable: no verified offers
- ❌ **Free result actions are truthful** — locator.innerText: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('#resultTitle')

- ✅ **Product intelligence shows no fake zero price** — not applicable: panel hidden for this result
- ❌ **Thumbs up** — control is not visible
- ❌ **Thumbs up sets rating 5** — locator.inputValue: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('#feedbackRating')

- ❌ **Thumbs down** — control is not visible
- ❌ **Thumbs down sets rating 2** — locator.inputValue: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('#feedbackRating')

- ❌ **Feedback form has empty-message validation** — locator.fill: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('#feedbackMessage')

- ❌ **Feedback copy works** — locator.fill: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('#feedbackMessage')

- ❌ **Free 25 km radius is Premium-gated** — not visible
- ❌ **Free Save opens Premium** — control is not visible
- ❌ **Free Save gate visible** — not visible
- ❌ **Open Premium modal** — control is not visible
- ❌ **Free/Premium comparison visible** — comparison missing
- ❌ **Activate Premium Beta** — control is not visible
- ❌ **Premium activates** — local premium flag missing
- ✅ **Premium command centre fits desktop** — {"sw":0,"cw":0}
- ❌ **Premium heading fits** — null
- ✅ **All visible V10 tools include How guidance** — 9 tools
- ❌ **Open Premium guide** — control is not visible
- ❌ **Premium guide has full help** — not visible
- ❌ **V10 scan opens** — locator.scrollIntoViewIfNeeded: Timeout 29996.13399999996ms exceeded.
Call log:
  - attempting scroll into view action
    2 × waiting for element to be stable
      - element is not visible
    - retrying scroll into view action
    - waiting 20ms
    2 × waiting for element to be stable
      - element is not visible
    - retrying scroll into view action
      - waiting 100ms
    56 × waiting for element to be stable
       - element is not visible
     - retrying scroll into view action
       - waiting 500ms

- ❌ **V10 manual opens** — locator.scrollIntoViewIfNeeded: Timeout 29996.045999999973ms exceeded.
Call log:
  - attempting scroll into view action
    2 × waiting for element to be stable
      - element is not visible
    - retrying scroll into view action
    - waiting 20ms
    2 × waiting for element to be stable
      - element is not visible
    - retrying scroll into view action
      - waiting 100ms
    56 × waiting for element to be stable
       - element is not visible
     - retrying scroll into view action
       - waiting 500ms

- ❌ **V10 exact opens** — locator.scrollIntoViewIfNeeded: Timeout 29995.820000000007ms exceeded.
Call log:
  - attempting scroll into view action
    2 × waiting for element to be stable
      - element is not visible
    - retrying scroll into view action
    - waiting 20ms
    2 × waiting for element to be stable
      - element is not visible
    - retrying scroll into view action
      - waiting 100ms
    56 × waiting for element to be stable
       - element is not visible
     - retrying scroll into view action
       - waiting 500ms

- ❌ **V10 assistant opens** — locator.scrollIntoViewIfNeeded: Timeout 29996.301000000036ms exceeded.
Call log:
  - attempting scroll into view action
    2 × waiting for element to be stable
      - element is not visible
    - retrying scroll into view action
    - waiting 20ms
    2 × waiting for element to be stable
      - element is not visible
    - retrying scroll into view action
      - waiting 100ms
    56 × waiting for element to be stable
       - element is not visible
     - retrying scroll into view action
       - waiting 500ms

- ❌ **V10 collections opens** — locator.scrollIntoViewIfNeeded: Timeout 29995.94199999998ms exceeded.
Call log:
  - attempting scroll into view action
    2 × waiting for element to be stable
      - element is not visible
    - retrying scroll into view action
    - waiting 20ms
    2 × waiting for element to be stable
      - element is not visible
    - retrying scroll into view action
      - waiting 100ms
    56 × waiting for element to be stable
       - element is not visible
     - retrying scroll into view action
       - waiting 500ms

- ❌ **V10 watchlist opens** — locator.scrollIntoViewIfNeeded: Timeout 29995.975999999966ms exceeded.
Call log:
  - attempting scroll into view action
    2 × waiting for element to be stable
      - element is not visible
    - retrying scroll into view action
    - waiting 20ms
    2 × waiting for element to be stable
      - element is not visible
    - retrying scroll into view action
      - waiting 100ms
    56 × waiting for element to be stable
       - element is not visible
     - retrying scroll into view action
       - waiting 500ms

- ❌ **V10 favourites opens** — locator.scrollIntoViewIfNeeded: Timeout 29996.236000000034ms exceeded.
Call log:
  - attempting scroll into view action
    2 × waiting for element to be stable
      - element is not visible
    - retrying scroll into view action
    - waiting 20ms
    2 × waiting for element to be stable
      - element is not visible
    - retrying scroll into view action
      - waiting 100ms
    56 × waiting for element to be stable
       - element is not visible
     - retrying scroll into view action
       - waiting 500ms

- ❌ **V10 stats opens** — locator.scrollIntoViewIfNeeded: Timeout 29996.25900000002ms exceeded.
Call log:
  - attempting scroll into view action
    2 × waiting for element to be stable
      - element is not visible
    - retrying scroll into view action
    - waiting 20ms
    2 × waiting for element to be stable
      - element is not visible
    - retrying scroll into view action
      - waiting 100ms
    56 × waiting for element to be stable
       - element is not visible
     - retrying scroll into view action
       - waiting 500ms

- ❌ **V10 history opens** — locator.scrollIntoViewIfNeeded: Timeout 29996.448999999964ms exceeded.
Call log:
  - attempting scroll into view action
    2 × waiting for element to be stable
      - element is not visible
    - retrying scroll into view action
    - waiting 20ms
    2 × waiting for element to be stable
      - element is not visible
    - retrying scroll into view action
      - waiting 100ms
    56 × waiting for element to be stable
       - element is not visible
     - retrying scroll into view action
       - waiting 500ms

- ✅ **Premium drawer has visible, vertical controls** — 13 controls
- ❌ **Premium drawer route: Saved Items** — not visible
- ❌ **Premium drawer route: Compare Stores** — not visible
- ❌ **Premium drawer route: Smart Filters** — not visible
- ❌ **Premium drawer route: Search Radius** — not visible
- ❌ **Premium drawer route: Extended History** — not visible
- ❌ **Premium drawer route: Premium Challenge** — not visible
- ❌ **Premium drawer route: Premium Settings** — not visible
- ❌ **Price & Stock Watchlist route visible and wired** — not visible
- ✅ **Open Ask FindIt**
- ❌ **Assistant opens** — not visible
- ⚠️ **Assistant quick prompt responds** — locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('[data-assistant-quick]').first()
    - locator resolved to <button data-assistant-quick="What did FindIt identify?">What is this?</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
      - waiting 100ms
    56 × waiting for element to be visible, enabled and stable
       - element is not visible
     - retrying click action
       - waiting 500ms

- ✅ **Mobile homepage loads**
- ✅ **Mobile has no horizontal overflow** — {"sw":390,"cw":390}
- ✅ **Mobile menu opens**
- ✅ **Mobile drawer controls vertical** — 9
- ❌ **Mobile bottom nav visible** — 0
- ❌ **Mobile More** — control is not visible
- ❌ **Mobile More opens drawer** — not visible
- ✅ **Health API live** — {"ok":true,"geminiKeyConfigured":true,"model":"gemini-3.6-flash","modelReachable":true,"message":"Gemini connection is ready."}
- ✅ **Feedback health API live** — {"ok":true,"provider":"formspree","formspreeConfigured":true,"message":"Formspree feedback delivery is configured."}
- ❌ **Built-in FindIt QA report passes** — {"time":"2026-08-20T18:49:07.809Z","missingElements":["premiumButton","copyFeedback","clearRecent","mobileMore"],"missingPremiumFunctions":["v10Manual","v10Exact","v10Assistant","v10Collections","v10FavouriteStores","v10Stats","openTool","premiumRadius","applyPremiumStoreSort"],"premiumButtons":["scan","manual","exact","assistant","collections","watchlist","favourites","stats","history"],"ok":false}
- ✅ **No uncaught desktop JavaScript errors** — none
- ✅ **No uncaught mobile JavaScript errors** — none
- ✅ **No meaningful console errors** — none
- ✅ **No unexpected network failures** — none
