(() => {
  function injectMobileDrawerStyles() {
    if (document.getElementById('findit-mobile-drawer-fix')) return;
    const style = document.createElement('style');
    style.id = 'findit-mobile-drawer-fix';
    style.textContent = `
      @media (max-width: 760px) {
        #drawer.drawer {width:min(88vw,390px)!important;max-width:390px!important;height:100dvh!important;overflow-y:auto!important;overflow-x:hidden!important;padding:22px 18px 110px!important;box-sizing:border-box!important}
        #drawer .drawer-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:14px!important;width:100%!important;margin-bottom:22px!important}
        #drawer .drawer-head .brand{min-width:0!important;display:flex!important;align-items:center!important;gap:12px!important}
        #drawer .drawer-head .brand>span:last-child{white-space:nowrap!important;font-size:22px!important}
        #drawer .drawer-nav,#drawer #premiumDrawerNav{width:100%!important;grid-template-columns:none!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:9px!important;overflow:visible!important}
        #drawer .drawer-nav>a,#drawer .drawer-nav>button,#drawer #premiumDrawerNav>a,#drawer #premiumDrawerNav>button{display:flex!important;width:100%!important;min-width:0!important;max-width:100%!important;min-height:50px!important;flex:0 0 auto!important;align-items:center!important;justify-content:flex-start!important;box-sizing:border-box!important;white-space:normal!important;overflow-wrap:anywhere!important;text-align:left!important;padding:13px 15px!important;border-radius:16px!important;line-height:1.2!important}
        #drawer .premium-menu-title{width:100%!important;box-sizing:border-box!important;display:flex!important;align-items:center!important;gap:12px!important;margin:12px 0 4px!important;padding:14px 15px!important;border-radius:16px!important}
        #drawer #premiumDrawerNav{display:none!important;margin-top:14px!important;padding-top:14px!important;border-top:1px solid rgba(255,255,255,.08)!important}
        body.premium-active #drawer #premiumDrawerNav,body.premium-v10 #drawer #premiumDrawerNav{display:flex!important}
      }
      .findit-useful-fallback{padding:18px;border:1px solid rgba(120,145,220,.22);border-radius:18px;background:rgba(16,25,45,.55)}
      .findit-useful-fallback h4{margin:0 0 6px;font-size:17px}.findit-useful-fallback p{margin:0 0 14px;opacity:.76;font-size:13px;line-height:1.5}
      .findit-fallback-actions{display:flex;gap:9px;flex-wrap:wrap}.findit-fallback-actions a,.findit-fallback-actions button{border:1px solid rgba(110,130,255,.35);background:rgba(85,110,255,.16);color:inherit;text-decoration:none;padding:10px 13px;border-radius:12px;font-weight:800;cursor:pointer}
      .findit-fallback-actions a:first-child{background:linear-gradient(135deg,#6d63ff,#24c7ed);color:#fff}
    `;
    document.head.appendChild(style);
  }

  function currentQuery(){
    try{const i=state?.result?.identification||{};return String(i.searchQuery||i.name||i.object||'').trim()}catch{return ''}
  }
  function retailerSearchUrl(){
    const q=currentQuery();
    return `https://www.google.com/search?q=${encodeURIComponent((q||'product')+' buy retailer South Africa')}`;
  }
  function mapsSearchUrl(){
    const q=currentQuery();
    let term=q?`${q} retailer`:'retailer';
    try{if(typeof retailerQuery==='function')term=retailerQuery(state?.result?.identification||{})||term}catch{}
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(term+' near me')}`;
  }
  function usefulFallback(title,body){
    const q=currentQuery();
    return `<div class="findit-useful-fallback"><h4>${title}</h4><p>${body}</p><div class="findit-fallback-actions"><a href="${retailerSearchUrl()}" target="_blank" rel="noopener">Search exact item online →</a><a href="${mapsSearchUrl()}" target="_blank" rel="noopener">Retailers near me</a>${q?'<button type="button" data-findit-correct>Correct item</button>':''}</div></div>`;
  }
  function improveDeadEnds(){
    const noOffers=document.getElementById('noOffers');
    if(noOffers&&!noOffers.classList.contains('hidden')){
      noOffers.innerHTML=usefulFallback('Continue with retailer results','FindIt has not verified a catalogue offer yet, but you can still continue with the exact identified item instead of hitting a dead end.');
    }
    const nothing=document.getElementById('nothingFound');
    if(nothing&&!nothing.classList.contains('hidden')){
      const p=nothing.querySelector('p');
      const msg=p?.textContent||'No verified nearby branch stock is connected yet.';
      nothing.innerHTML=usefulFallback('No verified branch stock yet',msg+' Use the options below to continue without being sent to a random category store.');
    }
    document.querySelectorAll('[data-findit-correct]').forEach(b=>{if(b.dataset.wired)return;b.dataset.wired='1';b.onclick=()=>document.getElementById('correctSearch')?.click()});
  }
  function watchResults(){
    const root=document.getElementById('results');if(!root)return;
    let queued=false;const run=()=>{if(queued)return;queued=true;setTimeout(()=>{queued=false;improveDeadEnds()},40)};
    new MutationObserver(run).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});run();
  }

  function initMobileMenuFix() {
    injectMobileDrawerStyles();
    const drawer=document.getElementById('drawer'),backdrop=document.getElementById('drawerBackdrop');
    const openButtons=[document.getElementById('menuBtn'),document.getElementById('mobileMore')].filter(Boolean),closeButton=document.getElementById('closeMenu');
    if(drawer&&backdrop){
      const open=()=>{drawer.classList.add('open');drawer.setAttribute('aria-hidden','false');backdrop.classList.remove('hidden');document.body.style.overflow='hidden'};
      const close=()=>{drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true');backdrop.classList.add('hidden');document.body.style.overflow=''};
      openButtons.forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open()}));
      closeButton?.addEventListener('click',e=>{e.preventDefault();close()});backdrop.addEventListener('click',close);
      drawer.querySelectorAll('.drawer-nav a,.drawer-nav button').forEach(control=>{if(!control.disabled)control.addEventListener('click',close)});
      document.getElementById('drawerAskFindIt')?.addEventListener('click',()=>{close();document.getElementById('assistantPanel')?.classList.remove('hidden')});
      document.getElementById('drawerPremium')?.addEventListener('click',()=>{close();const modal=document.getElementById('premiumModal');modal?.classList.remove('hidden');modal?.setAttribute('aria-hidden','false')});
      document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drawer.classList.contains('open'))close()});
    }
    watchResults();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initMobileMenuFix);else initMobileMenuFix();
})();
