(() => {
  const KEY = 'findit_premium_beta';
  const $ = (s) => document.querySelector(s);
  const active = () => localStorage.getItem(KEY) === '1';
  let suppressUpgradeModalUntil = 0;
  let explicitPlanOpen = false;

  const FREE = [
    'AI photo identification','Nearby retailer results','Directions & map','Up to 10 km search radius',
    'Basic recent finds','Search exact item online','Search retailer type near you','Copy product name','Share this find'
  ];
  const PREMIUM = [
    'Up to 25 km search radius','Saved Items','Collections','Watchlist','Favourite Stores','Compare Stores',
    'Smart store filters','History+ (up to 50 finds)','Manual product search','Exact Match search','AI retailer search',
    'Premium stats & workspace'
  ];

  function modal(show, explicit = false) {
    const m = $('#premiumModal');
    if (!m) return;
    if (show && active() && !explicit && Date.now() < suppressUpgradeModalUntil) return;
    explicitPlanOpen = Boolean(show && explicit);
    m.classList.toggle('hidden', !show);
    m.setAttribute('aria-hidden', show ? 'false' : 'true');
  }

  function ensureRuntime() {
    const on = active();
    if (typeof premiumState !== 'undefined') premiumState.active = on;
    document.body.classList.toggle('premium-active', on);
    document.body.classList.toggle('premium-v10', on);
    $('#premiumStatusBadge')?.classList.toggle('hidden', !on);
    $('#premiumWorkspaceButton')?.classList.toggle('hidden', !on);
    $('#premiumHome')?.classList.toggle('hidden', !on);
    $('#v10CommandCentre')?.classList.toggle('hidden', !on);
    const drawer = $('#premiumDrawerNav');
    if (drawer) drawer.style.display = on ? '' : 'none';

    const limit = on ? 25 : 10;
    try {
      if (typeof state !== 'undefined' && Number(state.radius) > limit) state.radius = limit;
      const stored = Math.min(limit, Number(localStorage.getItem('finditRadius') || 10));
      localStorage.setItem('finditRadius', String(stored));
      ['#radiusSelect','#settingsRadius'].forEach(s => {
        const el = $(s);
        if (el && Number(el.value) > limit) el.value = String(limit);
      });
    } catch {}
  }

  function updateCopy() {
    const cards = document.querySelectorAll('#premiumModal .premium-plan-card');
    const freeCard = cards[0];
    const pc = $('#premiumModal .premium-plan-card.premium');
    if (freeCard?.querySelector('ul')) freeCard.querySelector('ul').innerHTML = FREE.map(x => `<li>${x}</li>`).join('');
    if (pc?.querySelector('ul')) pc.querySelector('ul').innerHTML = PREMIUM.map(x => `<li>${x}</li>`).join('');
    if (pc?.querySelector('small')) pc.querySelector('small').textContent = 'Free during Premium Beta testing. Real payments are disabled.';
    const p = $('#premiumModal .premium-card > p');
    if (p) p.textContent = 'Premium Beta is free while FindIt is being tested. Premium-only tools are separated from the Free plan.';
    const b = $('#activatePremiumTester');
    if (b) b.textContent = active() ? 'Premium Beta active ✓' : 'Activate Premium Beta — Free';

    $('#v10CommandCentre [data-v10="share"]')?.remove();
    const save = $('#saveFind');
    if (save) {
      save.textContent = active() ? '♡ Save' : '♡ Save ★';
      save.title = active() ? 'Save this Find' : 'Premium feature';
    }

    let back = $('#finditReturnFree');
    if (active() && pc && !back) {
      back = document.createElement('button');
      back.id = 'finditReturnFree';
      back.type = 'button';
      back.textContent = 'Return to Free for testing';
      back.style.marginTop = '10px';
      back.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        localStorage.removeItem(KEY);
        syncAll();
        modal(false);
        window.scrollTo(0,0);
      }, true);
      pc.appendChild(back);
    }
    if (!active()) back?.remove();
  }

  function runV10(a) {
    ensureRuntime();
    if (a === 'scan') return $('#finder')?.scrollIntoView({behavior:'smooth',block:'start'});
    if (a === 'manual' && typeof v10Manual === 'function') return v10Manual();
    if (a === 'exact' && typeof v10Exact === 'function') return v10Exact();
    if (a === 'assistant' && typeof v10Assistant === 'function') return v10Assistant();
    if (a === 'collections' && typeof v10Collections === 'function') return v10Collections();
    if (a === 'watchlist' && typeof v10Watchlist === 'function') return v10Watchlist();
    if (a === 'favourites' && typeof v10FavouriteStores === 'function') return v10FavouriteStores();
    if (a === 'stats' && typeof v10Stats === 'function') return v10Stats();
    if (a === 'history' && typeof v10History === 'function') return v10History();
    if (typeof v10Handle === 'function') return v10Handle(a);
  }

  function runAction(a) {
    ensureRuntime();
    if (a === 'find') return $('#finder')?.scrollIntoView({behavior:'smooth',block:'start'});
    if (a === 'saved' && typeof openTool === 'function') return openTool('saved');
    if (a === 'compare' && typeof openTool === 'function') return openTool('compare');
    if (a === 'map') {
      const r = $('#results');
      if (r && !r.classList.contains('hidden')) {
        r.scrollIntoView({behavior:'smooth',block:'start'});
        setTimeout(() => $('#mapViewBtn')?.click(), 180);
      } else $('#finder')?.scrollIntoView({behavior:'smooth'});
      return;
    }
    if (typeof premiumAction === 'function') return premiumAction(a);
  }

  function runWorkspace(a) {
    ensureRuntime();
    if (typeof closePremiumWorkspace === 'function') closePremiumWorkspace();
    if (a === 'saved' && typeof openTool === 'function') return openTool('saved');
    if (a === 'compare' && typeof openTool === 'function') return openTool('compare');
    if (a === 'filters' && typeof openTool === 'function') return openTool('filters');
    if (a === 'history') return $('#recent')?.scrollIntoView({behavior:'smooth'});
    if (a === 'challenge') return $('#challengeBtn')?.click();
    if (a === 'map') return runAction('map');
    if (a === 'find') return runAction('find');
    if (a === 'radius') return $('#premiumHome')?.scrollIntoView({behavior:'smooth'});
  }

  function saveCurrent(el) {
    ensureRuntime();
    const i = (typeof state !== 'undefined' && state.result?.identification) || null;
    if (!i) return;
    let arr = [];
    try { arr = JSON.parse(localStorage.getItem('finditSaved') || '[]'); } catch {}
    arr = [{name:i.name||i.object||'Item',query:i.searchQuery||'',savedAt:new Date().toISOString()}, ...arr].slice(0,30);
    localStorage.setItem('finditSaved', JSON.stringify(arr));
    el.textContent = '✓ Saved';
    setTimeout(() => { if (active()) el.textContent = '♡ Save'; }, 900);
    if (typeof updatePremiumDashboard === 'function') updatePremiumDashboard();
  }

  function route(el) {
    if (el.matches('[data-v10]')) return runV10(el.dataset.v10);
    if (el.matches('[data-premium-action]')) return runAction(el.dataset.premiumAction);
    if (el.matches('[data-premium-radius]')) {
      ensureRuntime();
      return typeof premiumRadius === 'function' ? premiumRadius(el.dataset.premiumRadius) : undefined;
    }
    if (el.matches('[data-store-sort]')) {
      ensureRuntime();
      return typeof applyPremiumStoreSort === 'function' ? applyPremiumStoreSort(el.dataset.storeSort) : undefined;
    }
    if (el.matches('[data-pw]')) return runWorkspace(el.dataset.pw);
    if (el.id === 'saveFind') return saveCurrent(el);
  }

  // This runs on WINDOW capture, before older document/element handlers in script.js.
  function captureClick(e) {
    const planButton = e.target?.closest?.('#premiumButton,#drawerPremium');
    if (planButton) {
      e.preventDefault();
      e.stopImmediatePropagation();
      modal(true, true);
      return;
    }

    const activate = e.target?.closest?.('#activatePremiumTester');
    if (activate) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!active()) localStorage.setItem(KEY, '1');
      syncAll();
      modal(false);
      const wow = $('#premiumWow');
      wow?.classList.remove('hidden');
      setTimeout(() => wow?.classList.add('hidden'), 1500);
      setTimeout(() => $('#v10CommandCentre')?.scrollIntoView({block:'start'}), 120);
      return;
    }

    const close = e.target?.closest?.('#closePremium');
    if (close) {
      e.preventDefault();
      e.stopImmediatePropagation();
      modal(false);
      return;
    }

    const el = e.target?.closest?.('[data-v10],[data-premium-action],[data-premium-radius],[data-store-sort],[data-pw],#saveFind,#widenSearch');
    if (!el) return;

    if (el.id === 'widenSearch') {
      if (!active()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        modal(true);
      }
      return;
    }

    e.preventDefault();
    e.stopImmediatePropagation();
    if (!active()) {
      modal(true);
      return;
    }

    suppressUpgradeModalUntil = Date.now() + 1500;
    explicitPlanOpen = false;
    modal(false);
    try { route(el); }
    finally {
      // Older code is not allowed to reopen the upgrade modal after a successful Premium action.
      requestAnimationFrame(() => modal(false));
      setTimeout(() => modal(false), 0);
      setTimeout(() => modal(false), 120);
    }
  }

  function installModalGuard() {
    const m = $('#premiumModal');
    if (!m || m.dataset.guardInstalled === '1') return;
    m.dataset.guardInstalled = '1';
    new MutationObserver(() => {
      if (!active()) return;
      if (explicitPlanOpen) return;
      if (Date.now() < suppressUpgradeModalUntil && !m.classList.contains('hidden')) {
        m.classList.add('hidden');
        m.setAttribute('aria-hidden','true');
      }
    }).observe(m, {attributes:true, attributeFilter:['class','aria-hidden']});
  }

  function syncAll() {
    ensureRuntime();
    updateCopy();
    installModalGuard();
  }

  function init() {
    syncAll();
    window.addEventListener('click', captureClick, true);
    document.addEventListener('findit:results-rendered', syncAll);
    setTimeout(syncAll, 300);
    setTimeout(syncAll, 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
  window.addEventListener('pageshow', syncAll);
})();