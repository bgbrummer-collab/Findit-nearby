(() => {
  const TOKEN_KEY = 'findit_premium_token';
  const EMAIL_KEY = 'findit_premium_email';
  const LEGACY_KEYS = ['findit_premium_beta', 'finditPremium'];
  let verifiedActive = false;

  const qs = (s) => document.querySelector(s);

  function applyPremium(active) {
    verifiedActive = Boolean(active);
    LEGACY_KEYS.forEach((key) => {
      if (verifiedActive) localStorage.setItem(key, key === 'finditPremium' ? 'true' : '1');
      else localStorage.removeItem(key);
    });
    if (typeof premiumState !== 'undefined') premiumState.active = verifiedActive;
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
    if (button) button.textContent = verifiedActive ? 'Premium active ✓' : 'Get Premium — R99/month';
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
    const params = new URLSearchParams(location.search);
    if (params.get('premium_payment') === 'cancelled') {
      const url = new URL(location.href);
      ['premium_payment', 'reference', 'trxref'].forEach((k) => url.searchParams.delete(k));
      history.replaceState({}, '', url.pathname + url.search + url.hash);
      return;
    }
    if (params.get('premium_payment') !== 'return') return;
    const ref = params.get('reference') || params.get('trxref') || sessionStorage.getItem('findit_pending_paystack_reference');
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
      const url = new URL(location.href);
      ['premium_payment', 'reference', 'trxref'].forEach((k) => url.searchParams.delete(k));
      history.replaceState({}, '', url.pathname + url.search + url.hash);
      alert('Payment verified ✓ FindIt Premium is active.');
    } catch (error) {
      applyPremium(false);
      alert(error.message || 'Payment verification failed. Premium was not unlocked.');
    }
  }

  async function syncStatus() {
    const token = localStorage.getItem(TOKEN_KEY);
    applyPremium(false);
    if (!token) { productionCopy(); return; }
    try {
      const response = await fetch('/api/paystack-status', { headers: { Authorization: `Bearer ${token}` } });
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
      const response = await fetch('/api/paystack-manage', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.management_url) throw new Error(data.error || 'Could not open subscription management.');
      window.location.assign(data.management_url);
    } catch (error) {
      alert(error.message || 'Could not open subscription management.');
    }
  }

  function wire() {
    productionCopy();
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
      manage.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        manageSubscription();
      });
      card.appendChild(manage);
    }

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

    finishCheckout().then(syncStatus);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
  window.finditManagePremium = manageSubscription;
})();
