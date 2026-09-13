/* FindIt Product Information bootstrap.
   Deterministic loader: user-facing interaction ownership is ready before legacy handlers. */
(()=>{
  'use strict';
  if(window.__finditProductInfoEnhance)return;
  window.__finditProductInfoEnhance=true;
  const pending=new Map();
  let dashboardLoading=false;
  let shellObserver=null;

  function loadScript(key,src,ready){
    if(ready?.())return Promise.resolve();
    if(pending.has(key))return pending.get(key);
    const existing=document.querySelector(`script[data-findit-loader="${key}"]`);
    const p=new Promise(resolve=>{
      const done=()=>{if(key==='compare'&&window.__finditCompareStockReliabilityV2)window.__finditCompareStockReliability=true;resolve()};
      if(existing){if(ready?.())return done();existing.addEventListener('load',done,{once:true});existing.addEventListener('error',done,{once:true});return}
      const s=document.createElement('script');s.src=src;s.async=false;s.dataset.finditLoader=key;s.onload=done;s.onerror=done;document.head.appendChild(s);
    });
    pending.set(key,p);return p;
  }

  const loadPolish=()=>loadScript('modal-polish','modal-polish-fix.js?v=20260912-modal3',()=>window.__finditModalPolishFix);
  const loadActionOwner=()=>loadScript('commerce-action-owner','commerce-modal-action-owner.js?v=20260913-owner4',()=>window.__finditCommerceModalActionOwner);
  const loadCompare=()=>loadScript('compare','compare-stock-reliability-fix.js?v=20260913-pricestock8',()=>window.__finditCompareStockReliabilityV2).then(()=>{if(window.__finditCompareStockReliabilityV2)window.__finditCompareStockReliability=true});
  const loadPriceSweep=()=>loadScript('price-sweep-ui','price-sweep-ui-fix.js?v=20260911-sweep1',()=>window.__finditPriceSweepUiFix);
  const loadRelevance=()=>loadScript('relevance','dashboard-retailer-relevance-fix.js?v=20260910-relevance2',()=>window.__finditDashboardRetailerRelevance);
  const loadCommerce=()=>loadScript('commerce','dashboard-commerce-status.js?v=20260911-live9',()=>window.__finditDashboardCommerceStatus);
  const loadStructure=()=>loadScript('product-structure','product-info-structure-guard.js?v=20260910-structure1',()=>window.__finditProductInfoStructureGuard);
  const loadProductGuard=()=>loadScript('product-click','product-info-click-fix.js?v=20260912-research5',()=>window.__finditProductInfoClickFix);
  const loadBuyingContext=()=>loadScript('product-buying-context','product-buying-context-fix.js?v=20260911-context1',()=>window.__finditProductBuyingContextFix);
  const loadLocalMarket=()=>loadScript('local-market-commerce','local-market-commerce-fix.js?v=20260911-local1',()=>window.__finditLocalMarketCommerceFix);
  const loadResearch=()=>loadScript('product-insights','product-insights-runtime.js?v=20260910-research2',()=>window.__finditAiProductInsightsV5);
  const loadExactnessGuard=()=>loadScript('commerce-exactness','commerce-exactness-guard.js?v=20260911-exact1',()=>window.__finditCommerceExactnessGuard);
  const loadCommerceUiV4=()=>loadScript('commerce-ui-v4','commerce-ui-v4.js?v=20260913-compare7',()=>window.__finditCommerceUiV4);
  const loadDashboardAudit=()=>loadScript('dashboard-audit-controls','dashboard-audit-controls.js?v=20260913-audit7',()=>window.__finditDashboardAuditControls);

  // Own Compare/Stock at the browser-event boundary. Crucially, modal/render work is placed
  // in a new task (not a Promise microtask), so the physical click always returns first.
  window.addEventListener('click',e=>{
    const el=e.target?.closest?.('#finditExactShell [data-fx="compare"],#finditExactShell [data-fxnav="compare"],#finditExactShell [data-fx="stock"]');
    if(!el)return;
    const action=el.dataset.fxnav||el.dataset.fx||'';
    if(action!=='compare'&&action!=='stock')return;
    e.preventDefault();
    e.stopImmediatePropagation();
    setTimeout(()=>{
      loadDashboardAudit().then(()=>{
        if(typeof window.finditDashboardAuditAction==='function')window.finditDashboardAuditAction(action);
      }).catch(err=>console.warn('FindIt commerce action unavailable',err?.message||err));
    },0);
  },true);

  async function loadGuards(){
    // Install the user-facing click owner first. Nothing slower may register ahead of it.
    await loadDashboardAudit();
    await loadActionOwner();
    await Promise.all([loadPolish(),loadPriceSweep(),loadRelevance(),loadCommerce(),loadStructure(),loadProductGuard(),loadBuyingContext(),loadLocalMarket(),loadExactnessGuard()]);
    await loadCommerceUiV4();
    await loadCompare();
  }

  async function loadDashboardRuntime(){
    if(window.__finditDashboardV8Loader){shellObserver?.disconnect();shellObserver=null;return}
    if(dashboardLoading||!document.querySelector('#finditExactShell'))return;
    dashboardLoading=true;
    await loadGuards();
    if(!window.__finditDashboardV8Loader){
      await loadScript('dashboard-stable','dashboard-runtime-stable.js?v=20260910-product3',()=>window.__finditDashboardV8Loader);
    }
    dashboardLoading=false;
    if(window.__finditDashboardV8Loader){shellObserver?.disconnect();shellObserver=null}
    try{document.dispatchEvent(new CustomEvent('findit:dashboard-sync'))}catch{}
  }

  loadGuards();
  shellObserver=new MutationObserver(()=>{
    if(document.querySelector('#finditExactShell'))loadDashboardRuntime();
  });
  shellObserver.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(loadDashboardRuntime,0);setTimeout(loadDashboardRuntime,500);setTimeout(loadDashboardRuntime,1200);
  document.addEventListener('findit:results-rendered',()=>{loadResearch();loadGuards().then(()=>{try{document.dispatchEvent(new CustomEvent('findit:dashboard-sync'))}catch{}})});
})();
