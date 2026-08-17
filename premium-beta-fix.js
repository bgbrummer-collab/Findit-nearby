(() => {
  const TOKEN_KEY = 'findit_premium_token';
  const EMAIL_KEY = 'findit_premium_email';
  const LEGACY_KEYS = ['findit_premium_beta', 'finditPremium'];
  const checkoutParams = new URLSearchParams(location.search);
  let verifiedActive = false;

  const qs = (s) => document.querySelector(s);

  function scrubCheckoutUrl() {
    if (!checkoutParams.has('premium_payment') && !checkoutParams.has('reference') && !checkoutParams.has('trxref')) return;
    const url = new URL(location.href);
    ['premium_payment', 'reference', 'trxref'].forEach((k) => url.searchParams.delete(k));
    history.replaceState({}, '', url.pathname + url.search + url.hash);
  }

  function clearLegacyUnlocks() {
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
  }

  function enforceFreeLimits() {
    if (verifiedActive) return;
    try {
      if (typeof state !== 'undefined' && Number(state.radius) > 10) state.radius = 10;
      localStorage.setItem('finditRadius', String(Math.min(10, Number(localStorage.getItem('finditRadius') || 10))));
      const radius = qs('#radiusSelect');
      const settings = qs('#settingsRadius');
      if (radius && Number(radius.value) > 10) radius.value = '10';
      if (settings && Number(settings.value) > 10) settings.value = '10';
    } catch {}
  }

  function applyPremium(active) {
    verifiedActive = Boolean(active);
    clearLegacyUnlocks();
    if (typeof premiumState !== 'undefined') premiumState.active = verifiedActive;
    if (!verifiedActive) enforceFreeLimits();
    document.body.classList.toggle('premium-active', verifiedActive);
    document.body.classList.toggle('premium-v10', verifiedActive);
    qs('#premiumStatusBadge')?.classList.toggle('hidden', !verifiedActive);
    qs('#premiumWorkspaceButton')?.classList.toggle('hidden', !verifiedActive);
    qs('#premiumHome')?.classList.toggle('hidden', !verifiedActive);
    qs('#v10CommandCentre')?.classList.toggle('hidden', !verifiedActive);
    if (typeof refreshPremiumUI === 'function') refreshPremiumUI();
    if (typeof updatePremiumDashboard === 'function') updatePremiumDashboard();
  }

  function productionCopy() {
    const replacements = new Map([
      ['FINDIT PREMIUM BETA', 'FINDIT PREMIUM'],
      ['PREMIUM BETA', 'PREMIUM'],
      ['Premium Beta', 'Premium'],
      ['Premium Beta active ✓', 'Premium active ✓'],
      ['Activate Premium Beta on this device', 'Get Premium — R99/month'],
      ['No payment during beta', 'R99/month • Cancel anytime'],
      ['No payment required during beta.', 'R99/month • Cancel anytime.'],
      ['These personal stats are stored on this device during Beta.', 'These personal stats are stored on this device.']
    ]);
    document.querySelectorAll('*').forEach((el) => {
      if (el.children.length) return;
      const t = (el.textContent || '').trim();
      if (replacements.has(t)) el.textContent = replacements.get(t);
    });
    const intro = qs('#premiumModal p');
    if (intro) intro.textContent = 'Upgrade to FindIt Premium for R99/month. Cancel anytime through Paystack.';
    const button = qs('#activatePremiumTester');
    if (button) {
      button.disabled = false;
      button.textContent = verifiedActive ? 'Manage Premium' : 'Get Premium — R99/month';
    }
    const manage = qs('#managePremiumSubscription');
    if (manage) manage.classList.toggle('hidden', !verifiedActive);
  }

  async function startCheckout() {
    if (verifiedActive) return manageSubscription();
    const email = window.prompt('Enter the email you want to use for FindIt Premium:');
    if (!email) return;
    const button = qs('#activatePremiumTester');
    if (button) { button.disabled = true; button.textContent = 'Opening secure checkout…'; }
    try {
      const response = await fetch('/api/paystack-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.authorization_url) throw new Error(data.error || 'Could not start payment.');
      sessionStorage.setItem('findit_pending_paystack_reference', data.reference || '');
      window.location.assign(data.authorization_url);
    } catch (error) {
      alert(error.message || 'Payment could not start. Please try again.');
      if (button) { button.disabled = false; button.textContent = 'Get Premium — R99/month'; }
    }
  }

  async function finishCheckout() {
    if (checkoutParams.get('premium_payment') === 'cancelled') {
      sessionStorage.removeItem('findit_pending_paystack_reference');
      return;
    }
    if (checkoutParams.get('premium_payment') !== 'return') return;
    const ref = checkoutParams.get('reference') || checkoutParams.get('trxref') || sessionStorage.getItem('findit_pending_paystack_reference');
    if (!ref) { alert('Payment reference missing. Premium was not unlocked.'); return; }
    try {
      const response = await fetch(`/api/paystack-verify?reference=${encodeURIComponent(ref)}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.paid || !data.token) throw new Error(data.error || 'Payment could not be verified.');
      localStorage.setItem(TOKEN_KEY, data.token);
      if (data.email) localStorage.setItem(EMAIL_KEY, data.email);
      sessionStorage.removeItem('findit_pending_paystack_reference');
      applyPremium(true);
      productionCopy();
      alert('Payment verified ✓ FindIt Premium is active.');
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EMAIL_KEY);
      applyPremium(false);
      productionCopy();
      alert(error.message || 'Payment verification failed. Premium was not unlocked.');
    }
  }

  async function syncStatus() {
    const token = localStorage.getItem(TOKEN_KEY);
    clearLegacyUnlocks();
    if (!token) {
      applyPremium(false);
      productionCopy();
      return;
    }
    try {
      const response = await fetch('/api/paystack-router?action=status', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EMAIL_KEY);
      }
      applyPremium(Boolean(response.ok && data.active));
    } catch {
      applyPremium(false);
    }
    productionCopy();
  }

  async function manageSubscription() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return startCheckout();
    try {
      const response = await fetch('/api/paystack-router?action=manage', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.management_url) throw new Error(data.error || 'Could not open subscription management.');
      window.location.assign(data.management_url);
    } catch (error) {
      alert(error.message || 'Could not open subscription management.');
    }
  }

  function openResultsMap() {
    if (typeof closeDrawer === 'function') closeDrawer();
    const results = qs('#results');
    if (!results || results.classList.contains('hidden')) {
      qs('#finder')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => qs('#mapViewBtn')?.click(), 220);
  }

  function repairSorting() {
    if (window.__finditSortFixed || typeof applyPremiumStoreSort !== 'function') return;
    window.__finditSortFixed = true;
    applyPremiumStoreSort = function(mode) {
      premiumStoreSort = mode;
      if (!Array.isArray(state.stores)) return;
      state.stores.forEach((s, i) => {
        if (!Number.isFinite(Number(s.__finditOriginalRank))) s.__finditOriginalRank = i;
      });
      if (mode === 'closest') state.stores.sort((a, b) => Number(a.distanceKm) - Number(b.distanceKm));
      else if (mode === 'name') state.stores.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
      else state.stores.sort((a, b) => Number(a.__finditOriginalRank) - Number(b.__finditOriginalRank));
      if (typeof premiumCompareSelection !== 'undefined') premiumCompareSelection.clear();
      if (typeof renderStores === 'function') renderStores();
      if (typeof updateMap === 'function') updateMap();
      if (typeof updatePremiumDashboard === 'function') updatePremiumDashboard();
    };
  }

  function repairCompareCheckboxes() {
    if (window.__finditCompareDelegated) return;
    window.__finditCompareDelegated = true;
    document.addEventListener('change', (event) => {
      const input = event.target?.closest?.('[data-compare-store]');
      if (!input || typeof premiumCompareSelection === 'undefined') return;
      const index = Number(input.dataset.compareStore);
      if (!Number.isFinite(index)) return;
      if (input.checked) premiumCompareSelection.add(index);
      else premiumCompareSelection.delete(index);
      if (typeof updatePremiumDashboard === 'function') updatePremiumDashboard();
    });
  }

  function repairExactNearbySearch() {
    const link = qs('#searchNearbyFree');
    if (!link || link.dataset.exactSearchFixed === '1') return;
    link.dataset.exactSearchFixed = '1';
    const title = link.querySelector('strong');
    const note = link.querySelector('span');
    if (title) title.textContent = 'Search exact item near me';
    if (note) note.textContent = 'Web results • verify branch stock before travelling';
    link.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const item = typeof state !== 'undefined' ? (state.result?.identification || {}) : {};
      const q = String(item.searchQuery || item.name || item.object || '').trim();
      if (!q) return;
      window.open(`https://www.google.com/search?q=${encodeURIComponent(q + ' near me')}`, '_blank', 'noopener');
    }, true);
  }

  function repairOfferRendering() {
    if (window.__finditOfferRendererFixed || typeof renderOffers !== 'function') return;
    window.__finditOfferRendererFixed = true;
    renderOffers = function() {
      const list = [...state.offers];
      if (state.sort === 'price') list.sort((a, b) => (Number(a.price) || Infinity) - (Number(b.price) || Infinity));
      if (state.sort === 'distance') list.sort((a, b) => (Number(a.distanceKm) || Infinity) - (Number(b.distanceKm) || Infinity));
      if (state.sort === 'best') list.sort((a, b) => Number(b.match || 0) - Number(a.match || 0));
      if (!list.length) {
        noOffers.classList.remove('hidden');
        offersEl.innerHTML = '';
        return;
      }
      noOffers.classList.add('hidden');
      const stockText = (p) => {
        const s = p?.stock;
        const raw = typeof s === 'string' ? s : (s?.status || s?.availability || '');
        const x = String(raw || '').toLowerCase().replace(/[_-]+/g, ' ').trim();
        if (!x) return 'Stock not verified';
        if (x === 'in stock' || x === 'available') return 'In stock';
        if (x === 'out of stock' || x === 'unavailable') return 'Out of stock';
        if (x === 'preorder' || x === 'pre order') return 'Pre-order';
        return raw;
      };
      offersEl.innerHTML = list.map((p) => {
        const distance = Number.isFinite(Number(p.distanceKm)) ? ` • 📍 ${Number(p.distanceKm).toFixed(1)} km` : '';
        const store = p.store?.name ? ` • ${p.store.name}` : '';
        return `<article class="offer-card"><img src="${esc(p.image || placeholderImage())}" alt=""><div><h4>${esc(p.name || 'Product')}</h4><p>${esc([p.brand,p.model,p.retailer].filter(Boolean).join(' • '))}${esc(store)}</p><p>🎯 ${Math.round(Number(p.match || 0) * 100)}% match • 📦 ${esc(stockText(p))}${esc(distance)}</p>${validUrl(p.url)?`<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">View product →</a>`:''}</div><div class="price">${money(p)}</div></article>`;
      }).join('');
    };
  }

  function repairControls() {
    document.querySelectorAll('a[href="#nearbyPanel"], [data-premium-action="map"]').forEach((el) => {
      if (el.dataset.mapFixed === '1') return;
      el.dataset.mapFixed = '1';
      if (el.matches('a[href="#nearbyPanel"]')) {
        el.removeAttribute('href');
        el.setAttribute('role', 'button');
        el.tabIndex = 0;
      }
      el.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        openResultsMap();
      }, true);
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openResultsMap(); }
      });
    });

    const widen = qs('#widenSearch');
    if (widen && !widen.dataset.productionWired) {
      widen.dataset.productionWired = '1';
      widen.addEventListener('click', (event) => {
        if (!verifiedActive) {
          event.preventDefault();
          event.stopImmediatePropagation();
          if (typeof openPremium === 'function') openPremium();
        }
      }, true);
    }

    document.querySelectorAll('[data-pw]').forEach((button) => {
      if (button.dataset.workspaceFixed === '1') return;
      button.dataset.workspaceFixed = '1';
      button.addEventListener('click', (event) => {
        const action = button.dataset.pw;
        if (!['saved', 'compare', 'filters', 'challenge', 'history', 'map'].includes(action)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (typeof closePremiumWorkspace === 'function') closePremiumWorkspace();
        if (action === 'saved' && typeof openTool === 'function') openTool('saved');
        if (action === 'compare' && typeof openTool === 'function') openTool('compare');
        if (action === 'filters' && typeof openTool === 'function') openTool('filters');
        if (action === 'challenge') qs('#challengeBtn')?.click();
        if (action === 'history') qs('#recent')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (action === 'map') openResultsMap();
      }, true);
    });

    repairSorting();
    repairCompareCheckboxes();
    repairExactNearbySearch();
    repairOfferRendering();
  }

  clearLegacyUnlocks();
  if (typeof premiumState !== 'undefined') premiumState.active = false;
  enforceFreeLimits();
  if (checkoutParams.has('premium_payment')) scrubCheckoutUrl();

  function wire() {
    productionCopy();
    repairControls();

    const button = qs('#activatePremiumTester');
    if (button && !button.dataset.productionWired) {
      button.dataset.productionWired = '1';
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        startCheckout();
      }, true);
    }

    const card = qs('#premiumModal .premium-plan-card.premium');
    if (card && !qs('#managePremiumSubscription')) {
      const manage = document.createElement('button');
      manage.id = 'managePremiumSubscription';
      manage.type = 'button';
      manage.textContent = 'Manage / cancel subscription';
      manage.style.marginTop = '10px';
      manage.classList.add('hidden');
      manage.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        manageSubscription();
      });
      card.appendChild(manage);
    }

    finishCheckout().then(syncStatus);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
  window.addEventListener('pageshow', () => syncStatus());
  window.finditManagePremium = manageSubscription;
})();
