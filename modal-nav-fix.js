(()=>{
  'use strict';
  if(window.__finditModalNavFixV3)return;window.__finditModalNavFixV3=true;
  const $=s=>document.querySelector(s);
  function premiumActive(){try{return localStorage.getItem('findit_premium_beta')==='1'||localStorage.getItem('finditPremium')==='1'||localStorage.getItem('finditPremium')==='true'||window.premiumState?.active===true||document.body.classList.contains('premium-active')}catch{return false}}
  /* IMPORTANT: dashboard-runtime-fix.js reopens these panels by removing only the
     hidden class. Do not set hidden=true or inline display:none here, or the
     panel can never be opened again. */
  function hidePanel(sel){const el=$(sel);if(!el)return;el.classList.add('hidden');el.removeAttribute('hidden');el.style.removeProperty('display');el.setAttribute('aria-hidden','true')}
  function closeDashboardModals(){hidePanel('#fxPanelModal');hidePanel('#fxSettingsModal')}
  function removeLegacyChrome(){const drawer=$('#drawer'),backdrop=$('#drawerBackdrop'),menu=$('#menuBtn');if(drawer){drawer.classList.add('hidden');drawer.setAttribute('aria-hidden','true')}if(backdrop)backdrop.classList.add('hidden');if(menu)menu.style.setProperty('display','none','important')}
  function syncPremiumUi(){const on=premiumActive();document.body.classList.toggle('fx-premium-already-active',on);const side=$('#fxPremiumSideButton'),bottom=$('#fxPremiumBottomButton');if(side)side.hidden=on;if(bottom)bottom.hidden=on;const card=$('.fx-premium');if(card&&on)card.setAttribute('aria-label','FindIt Premium is active')}
  function installStyle(){if($('#finditModalNavFixStyleV3'))return;const s=document.createElement('style');s.id='finditModalNavFixStyleV3';s.textContent=`
    #fxPanelModal,#fxSettingsModal{pointer-events:none!important}
    #fxPanelModal .fx-modal-card,#fxSettingsModal .fx-modal-card{pointer-events:auto!important;touch-action:auto!important;overscroll-behavior:contain;scrollbar-gutter:stable}
    body.findit-exact-dashboard #drawer,body.findit-exact-dashboard #drawerBackdrop,body.findit-exact-dashboard #menuBtn{display:none!important;visibility:hidden!important;pointer-events:none!important}
    body.fx-premium-already-active #fxPremiumSideButton,body.fx-premium-already-active #fxPremiumBottomButton{display:none!important}
    body.fx-premium-already-active .fx-premium{cursor:default!important}
  `;document.head.appendChild(s)}
  async function enrichVerifiedOffers(){
    let st=null;try{st=window.finditState||window.state}catch{};const i=st?.result?.identification;if(!i||!String(i.name||i.model||i.object||'').trim())return;
    if(Array.isArray(st?.offers)&&st.offers.some(o=>(o?.verified===true||o?.sourcePageVerified===true)&&Number.isFinite(Number(o.price))))return;
    const q=i.searchQuery||i.query||i.name||i.model||i.object;
    try{const c=new AbortController(),t=setTimeout(()=>c.abort(),18000);const r=await fetch('/api/product-intelligence-v2',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...i,query:q,searchQuery:q}),signal:c.signal});clearTimeout(t);if(!r.ok)return;const data=await r.json();if(Array.isArray(data?.offers)){st.offers=data.offers;window.productIntelligence=data;document.dispatchEvent(new CustomEvent('findit:nearby-updated'))}}catch{}
  }
  window.addEventListener('pointerdown',e=>{
    const t=e.target?.closest?.('#finditExactShell [data-fx],#finditExactShell [data-fxnav]');
    if(!t)return;
    /* Product/Compare/Settings need to be allowed to open or replace a panel. */
    const action=t.dataset.fx||t.dataset.fxnav||'';
    if(!['product','compare','settings'].includes(action))closeDashboardModals();
    if(t.dataset.fx==='premium'&&premiumActive()){e.preventDefault();e.stopImmediatePropagation();syncPremiumUi()}
  },true);
  window.addEventListener('click',e=>{
    const t=e.target?.closest?.('#finditExactShell [data-fx],#finditExactShell [data-fxnav]');
    if(t&&t.dataset.fx==='premium'&&premiumActive()){e.preventDefault();e.stopImmediatePropagation();syncPremiumUi();return}
    if(e.target=== $('#fxPanelModal')||e.target=== $('#fxSettingsModal'))closeDashboardModals();
  },true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDashboardModals()});
  document.addEventListener('findit:results-rendered',()=>{removeLegacyChrome();syncPremiumUi();setTimeout(enrichVerifiedOffers,120)});
  window.addEventListener('storage',syncPremiumUi);
  function init(){installStyle();removeLegacyChrome();syncPremiumUi();setTimeout(enrichVerifiedOffers,500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
