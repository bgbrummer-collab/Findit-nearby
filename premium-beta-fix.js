(() => {
  const BETA_KEY = 'findit_premium_beta';
  const qs = (s) => document.querySelector(s);
  const isActive = () => localStorage.getItem(BETA_KEY) === '1';

  const FREE_FEATURES = [
    'AI photo identification',
    'Nearby retailer results',
    'Directions & map',
    'Up to 10 km search radius',
    'Basic recent finds',
    'Search exact item online',
    'Search retailer type near you',
    'Copy product name',
    'Share this find'
  ];
  const PREMIUM_FEATURES = [
    'Up to 25 km search radius',
    'Saved Items',
    'Collections',
    'Watchlist',
    'Favourite Stores',
    'Compare Stores',
    'Smart store filters',
    'History+ (up to 50 finds)',
    'Manual product search',
    'Exact Match search',
    'AI retailer search',
    'Premium stats & workspace'
  ];

  function openPremiumModal() {
    const modal = qs('#premiumModal');
    modal?.classList.remove('hidden');
    modal?.setAttribute('aria-hidden', 'false');
  }

  function setRadiusLimit(active) {
    try {
      const limit = active ? 25 : 10;
      const current = Math.min(limit, Number(localStorage.getItem('finditRadius') || 10));
      localStorage.setItem('finditRadius', String(current));
      if (typeof state !== 'undefined') state.radius = Math.min(limit, Number(state.radius || current));
      const radius = qs('#radiusSelect');
      const settings = qs('#settingsRadius');
      if (radius && Number(radius.value) > limit) radius.value = String(limit);
      if (settings && Number(settings.value) > limit) settings.value = String(limit);
    } catch {}
  }

  function updatePlanCopy(active) {
    const cards = document.querySelectorAll('#premiumModal .premium-plan-card');
    const freeCard = cards[0];
    const premiumCard = qs('#premiumModal .premium-plan-card.premium');
    if (freeCard) {
      const ul = freeCard.querySelector('ul');
      if (ul) ul.innerHTML = FREE_FEATURES.map(x => `<li>${x}</li>`).join('');
    }
    if (premiumCard) {
      const ul = premiumCard.querySelector('ul');
      if (ul) ul.innerHTML = PREMIUM_FEATURES.map(x => `<li>${x}</li>`).join('');
      const small = premiumCard.querySelector('small');
      if (small) small.textContent = 'Free during Premium Beta testing. Real payments are disabled.';
    }
    const kicker = qs('#premiumModal .premium-kicker');
    if (kicker) kicker.textContent = 'FINDIT PREMIUM BETA';
    const intro = qs('#premiumModal .premium-card > p');
    if (intro) intro.textContent = 'Premium Beta is free while FindIt is being tested. Premium-only tools are separated from the Free plan.';
    const button = qs('#activatePremiumTester');
    if (button) button.textContent = active ? 'Premium Beta active ✓' : 'Activate Premium Beta — Free';

    let switchBtn = qs('#finditReturnFree');
    if (active && premiumCard && !switchBtn) {
      switchBtn = document.createElement('button');
      switchBtn.id = 'finditReturnFree';
      switchBtn.type = 'button';
      switchBtn.textContent = 'Return to Free for testing';
      switchBtn.style.marginTop = '10px';
      switchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        localStorage.removeItem(BETA_KEY);
        apply(false, true);
      });
      premiumCard.appendChild(switchBtn);
    }
    if (!active) switchBtn?.remove();
  }

  function updatePremiumVisibility(active) {
    if (typeof premiumState !== 'undefined') premiumState.active = active;
    document.body.classList.toggle('premium-active', active);
    document.body.classList.toggle('premium-v10', active);
    qs('#premiumStatusBadge')?.classList.toggle('hidden', !active);
    qs('#premiumWorkspaceButton')?.classList.toggle('hidden', !active);
    qs('#premiumHome')?.classList.toggle('hidden', !active);
    qs('#v10CommandCentre')?.classList.toggle('hidden', !active);
    const drawer = qs('#premiumDrawerNav');
    if (drawer) drawer.style.display = active ? '' : 'none';
    if (typeof refreshPremiumUI === 'function') refreshPremiumUI();
    if (typeof updatePremiumDashboard === 'function') updatePremiumDashboard();
    if (typeof v10Refresh === 'function' && active) v10Refresh();
  }

  function lockFreeOnlyDuplicates() {
    // Sharing is intentionally FREE. Remove it from Premium-only marketing/UI so nobody pays for a duplicate.
    const shareTile = qs('#v10CommandCentre [data-v10="share"]');
    shareTile?.remove();

    // Saving is a real Premium benefit: Free users see it as locked instead of silently receiving Premium storage.
    const save = qs('#saveFind');
    if (save && !save.dataset.premiumGate) {
      save.dataset.premiumGate = '1';
      save.addEventListener('click', (e) => {
        if (isActive()) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        openPremiumModal();
      }, true);
    }
    if (save) {
      save.textContent = isActive() ? '♡ Save' : '♡ Save ★';
      save.title = isActive() ? 'Save this Find' : 'Premium feature';
    }
  }

  function gatePremiumControls() {
    document.querySelectorAll('[data-premium-radius],[data-store-sort],[data-premium-action],[data-v10],[data-pw]').forEach(el => {
      if (el.dataset.finditGate === '1') return;
      el.dataset.finditGate = '1';
      el.addEventListener('click', (e) => {
        if (isActive()) return;
        // Basic Find/Map entry points remain available in Free where equivalent free controls exist.
        const basic = el.matches('[data-premium-action="find"],[data-premium-action="map"],[data-v10="scan"],[data-pw="find"],[data-pw="map"]');
        if (basic) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        openPremiumModal();
      }, true);
    });
  }

  function repairWidenSearch() {
    const widen = qs('#widenSearch');
    if (!widen || widen.dataset.finditPremiumWiden === '1') return;
    widen.dataset.finditPremiumWiden = '1';
    widen.addEventListener('click', (e) => {
      if (isActive()) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      openPremiumModal();
    }, true);
  }

  function apply(active, showMessage = false) {
    if (active) localStorage.setItem(BETA_KEY, '1'); else localStorage.removeItem(BETA_KEY);
    setRadiusLimit(active);
    updatePremiumVisibility(active);
    updatePlanCopy(active);
    lockFreeOnlyDuplicates();
    gatePremiumControls();
    repairWidenSearch();
    if (showMessage) {
      if (active) {
        const wow = qs('#premiumWow');
        wow?.classList.remove('hidden');
        setTimeout(() => wow?.classList.add('hidden'), 2200);
        qs('#premiumModal')?.classList.add('hidden');
        setTimeout(() => qs('#v10CommandCentre')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
      } else {
        qs('#premiumModal')?.classList.add('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  function wireActivation() {
    const button = qs('#activatePremiumTester');
    if (!button || button.dataset.betaFreeWired === '1') return;
    button.dataset.betaFreeWired = '1';
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!isActive()) apply(true, true);
    }, true);
  }

  function auditUI() {
    const active = isActive();
    updatePlanCopy(active);
    lockFreeOnlyDuplicates();
    gatePremiumControls();
    repairWidenSearch();
  }

  function init() {
    // Beta mode: no Gmail prompt, no Paystack checkout, no payment verification.
    apply(isActive(), false);
    wireActivation();
    auditUI();
    const results = qs('#results');
    if (results) new MutationObserver(() => auditUI()).observe(results, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.addEventListener('pageshow', () => apply(isActive(), false));
})();
