(() => {
  function injectMobileDrawerStyles() {
    if (document.getElementById('findit-mobile-drawer-fix')) return;
    const style = document.createElement('style');
    style.id = 'findit-mobile-drawer-fix';
    style.textContent = `
      @media (max-width: 760px) {
        #drawer.drawer {
          width: min(88vw, 390px) !important;
          max-width: 390px !important;
          height: 100dvh !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          padding: 22px 18px 110px !important;
          box-sizing: border-box !important;
        }
        #drawer .drawer-head {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 14px !important;
          width: 100% !important;
          margin-bottom: 22px !important;
        }
        #drawer .drawer-head .brand {
          min-width: 0 !important;
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
        }
        #drawer .drawer-head .brand > span:last-child {
          white-space: nowrap !important;
          font-size: 22px !important;
        }
        #drawer .drawer-nav,
        #drawer #premiumDrawerNav {
          width: 100% !important;
          grid-template-columns: none !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: stretch !important;
          gap: 9px !important;
          overflow: visible !important;
        }
        #drawer .drawer-nav > a,
        #drawer .drawer-nav > button,
        #drawer #premiumDrawerNav > a,
        #drawer #premiumDrawerNav > button {
          display: flex !important;
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          min-height: 50px !important;
          flex: 0 0 auto !important;
          align-items: center !important;
          justify-content: flex-start !important;
          box-sizing: border-box !important;
          white-space: normal !important;
          overflow-wrap: anywhere !important;
          text-align: left !important;
          padding: 13px 15px !important;
          border-radius: 16px !important;
          line-height: 1.2 !important;
        }
        #drawer .premium-menu-title {
          width: 100% !important;
          box-sizing: border-box !important;
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          margin: 12px 0 4px !important;
          padding: 14px 15px !important;
          border-radius: 16px !important;
        }
        #drawer #premiumDrawerNav {
          display: none !important;
          margin-top: 14px !important;
          padding-top: 14px !important;
          border-top: 1px solid rgba(255,255,255,.08) !important;
        }
        body.premium-active #drawer #premiumDrawerNav,
        body.premium-v10 #drawer #premiumDrawerNav {
          display: flex !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function initMobileMenuFix() {
    injectMobileDrawerStyles();

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

    // Every actionable drawer control must release the mobile scroll lock.
    // The main app handles where the action goes; this controller guarantees
    // the drawer/backdrop/body state is always cleaned up afterward.
    drawer.querySelectorAll('.drawer-nav a, .drawer-nav button').forEach(control => {
      if (control.disabled) return;
      control.addEventListener('click', () => close());
    });

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
