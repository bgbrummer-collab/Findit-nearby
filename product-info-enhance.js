/* FindIt Product Information bootstrap.
   Deterministic loader: reliability guards are ready before dashboard handlers. */
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

  const loadPolish=()=>loadScript('modal-polish','modal-polish-fix.js?v=20260910-modal2',()=>window.__finditModalPolishFix);
  const loadActionOwner=()=>loadScript('commerce-action-owner','commerce-modal-action-owner.js?v=20260912-owner3',()=>window.__finditCommerceModalActionOwner);
  const loadCompare=()=>loadScript('compare','compare-stock-reliability-fix.js?v=20260910-pricestock7',()=>window.__finditCompareStockReliabilityV2).then(()=>{if(window.__finditCompareStockReliabilityV2)window.__finditCompareStockReliability=true});
  const loadPriceSweep=()=>loadScript('price-sweep-ui','price-sweep-ui-fix.js?v=20260911-sweep1',()=>window.__finditPriceSweepUiFix);
  const loadRelevance=()=>loadScript('relevance','dashboard-retailer-relevance-fix.js?v=20260910-relevance2',()=>window.__finditDashboardRetailerRelevance);
  const loadCommerce=()=>loadScript('commerce','dashboard-commerce-status.js?v=20260911-live9',()=>window.__finditDashboardCommerceStatus);
  const loadStructure=()=>loadScript('product-structure','product-info-structure-guard.js?v=20260910-structure1',()=>window.__finditProductInfoStructureGuard);
  const loadProductGuard=()=>loadScript('product-click','product-info-click-fix.js?v=20260910-research4',()=>window.__finditProductInfoClickFix);
  const loadBuyingContext=()=>loadScript('product-buying-context','product-buying-context-fix.js?v=20260911-context1',()=>window.__finditProductBuyingContextFix);
  const loadLocalMarket=()=>loadScript('local-market-commerce','local-market-commerce-fix.js?v=20260911-local1',()=>window.__finditLocalMarketCommerceFix);
  const loadResearch=()=>loadScript('product-insights','product-insights-runtime.js?v=20260910-research2',()=>window.__finditAiProductInsightsV5);
  const loadExactnessGuard=()=>loadScript('commerce-exactness','commerce-exactness-guard.js?v=20260911-exact1',()=>window.__finditCommerceExactnessGuard);
  const loadCommerceUiV4=()=>loadScript('commerce-ui-v4','commerce-ui-v4.js?v=20260911-compare5',()=>window.__finditCommerceUiV4);
  const loadDashboardAudit=()=>loadScript('dashboard-audit-controls','dashboard-audit-controls.js?v=20260911-audit1',()=>window.__finditDashboardAuditControls);

  async function loadGuards(){
    await loadActionOwner();
    await Promise.all([loadPolish(),loadCompare(),loadPriceSweep(),loadRelevance(),loadCommerce(),loadStructure(),loadProductGuard(),loadBuyingContext(),loadLocalMarket(),loadExactnessGuard()]);
    await loadCommerceUiV4();
    await loadDashboardAudit();
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
