(()=>{
  /* Install this before premium-beta-fix.js so the Premium button uses Paystack checkout in test mode. */
  window.addEventListener('click',e=>{
    const b=e.target?.closest?.('#activatePremiumTester');
    if(!b)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if(typeof finditStartPremiumPayment==='function'){
      b.disabled=true;
      const old=b.textContent;
      b.textContent='Opening secure checkout…';
      Promise.resolve(finditStartPremiumPayment()).finally(()=>{setTimeout(()=>{b.disabled=false;b.textContent=old||'Get Premium — R99/month'},600)});
    }
  },true);

  const relabel=()=>{
    const b=document.getElementById('activatePremiumTester');
    if(b&&!localStorage.getItem('findit_premium_beta'))b.textContent='Test Premium subscription — R99/month';
    const pc=document.querySelector('#premiumModal .premium-plan-card.premium small');
    if(pc&&!localStorage.getItem('findit_premium_beta'))pc.textContent='Paystack Test Mode — no real money is charged. Monthly subscription can be cancelled.';
  };
  document.addEventListener('DOMContentLoaded',()=>{relabel();setTimeout(relabel,400);setTimeout(relabel,1300)});

  const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.defer=true;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
  load('https://cdn.jsdelivr.net/gh/bgbrummer-collab/Findit-nearby@f510ae6c231c45e9c2e6137d6296c14efa2c57ac/mobile-menu-fix.js').catch(()=>{})
    .then(()=>load('/premium-upgrades.js').catch(()=>{}))
    .then(()=>load('/qa-hardening.js').catch(()=>{}))
    .then(()=>load('/qa-menu-routes.js').catch(()=>{}))
    .then(()=>load('/qa-final-polish.js').catch(()=>{}))
    .then(()=>load('/school-uniform-fix.js').catch(()=>{}))
    .then(()=>load('/final-release-fixes.js').catch(()=>{}))
    .then(()=>load('/release-polish.js').catch(()=>{}))
    .then(()=>load('/exact-retailer-fix.js').catch(()=>{}))
    .then(()=>load('/official-brand-client.js').catch(()=>{}))
    .then(()=>load('/feature-suggestions.js').catch(()=>{}));
})();