(() => {
  const KEY = 'findit_premium_beta';

  function isPremium() {
    return localStorage.getItem(KEY) === 'true' || localStorage.getItem('finditPremium') === 'true';
  }

  function applyPremium(active) {
    document.body.classList.toggle('premium-active', active);
    const badge = document.getElementById('premiumStatusBadge');
    const workspaceButton = document.getElementById('premiumWorkspaceButton');
    const premiumHome = document.getElementById('premiumHome');
    const command = document.getElementById('v10CommandCentre');
    if (badge) badge.classList.toggle('hidden', !active);
    if (workspaceButton) workspaceButton.classList.toggle('hidden', !active);
    if (premiumHome) premiumHome.classList.toggle('hidden', !active);
    if (command) command.classList.toggle('hidden', !active);
  }

  function activate() {
    localStorage.setItem(KEY, 'true');
    localStorage.setItem('finditPremium', 'true');
    applyPremium(true);

    const modal = document.getElementById('premiumModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
    }

    const wow = document.getElementById('premiumWow');
    if (wow) {
      wow.classList.remove('hidden');
      wow.setAttribute('aria-hidden', 'false');
      setTimeout(() => {
        wow.classList.add('hidden');
        wow.setAttribute('aria-hidden', 'true');
      }, 1400);
    }

    setTimeout(() => {
      const home = document.getElementById('premiumHome') || document.getElementById('v10CommandCentre');
      if (home) home.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 250);
  }

  function wire() {
    applyPremium(isPremium());
    const btn = document.getElementById('activatePremiumTester');
    if (!btn || btn.dataset.betaFixed === '1') return;
    btn.dataset.betaFixed = '1';
    btn.textContent = isPremium() ? 'Premium Beta Active ✓' : 'Activate Premium Beta on this device';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      activate();
      btn.textContent = 'Premium Beta Active ✓';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
