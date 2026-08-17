(() => {
  function initMobileMenuFix() {
    const drawer = document.getElementById('drawer');
    const backdrop = document.getElementById('drawerBackdrop');
    const openButtons = [document.getElementById('menuBtn'), document.getElementById('mobileMore')].filter(Boolean);
    const closeButton = document.getElementById('closeMenu');

    if (!drawer || !backdrop) return;

    const open = () => {
      drawer.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
      backdrop.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    };

    const close = () => {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      backdrop.classList.add('hidden');
      document.body.style.overflow = '';
    };

    openButtons.forEach(btn => btn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      open();
    }));

    closeButton?.addEventListener('click', (event) => {
      event.preventDefault();
      close();
    });
    backdrop.addEventListener('click', close);
    drawer.querySelectorAll('a').forEach(link => link.addEventListener('click', close));

    document.getElementById('drawerAskFindIt')?.addEventListener('click', () => {
      close();
      document.getElementById('assistantPanel')?.classList.remove('hidden');
    });

    document.getElementById('drawerPremium')?.addEventListener('click', () => {
      close();
      const modal = document.getElementById('premiumModal');
      modal?.classList.remove('hidden');
      modal?.setAttribute('aria-hidden', 'false');
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && drawer.classList.contains('open')) close();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileMenuFix);
  } else {
    initMobileMenuFix();
  }
})();
