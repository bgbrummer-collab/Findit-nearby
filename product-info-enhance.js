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
      if(existing){if(ready?.())return done();if(existing.dataset.finditLoaded==='1')return done();existing.addEventListener('load',done,{once:true});existing.addEventListener('error',done,{once:true});return;}
      const s=document.createElement('script');s.src=src;s.async=false;s.dataset.finditLoader=key;
      s.onload=()=>{s.dataset.finditLoaded='1';done()};s.onerror=()=>{s.dataset.finditLoaded='1';done()};document.head.appendChild(s);
    });pending.set(key,p);return p;
  }

  const loadPolish=()=>loadScript('modal-polish','modal-polish-fix.js?v=20260912-modal3',()=>window.__finditModalPolishFix);
  const loadActionOwner=()=>loadScript('commerce-action-owner','commerce-modal-action-owner.js?v=20260913-owner4',()=>window.__finditCommerceModalActionOwner);
  const loadCompare=()=>loadScript('compare','compare-stock-reliability-fix.js?v=20260913-pricestock8',()=>window.__finditCompareStockReliabilityV2).then(()=>{if(window.__finditCompareStockReliabilityV2)window.__finditCompareStockReliability=true});
  const loadPriceSweep=()=>loadScript('price-sweep-ui','price-sweep-ui-fix.js?v=20260911-sweep1',()=>window.__finditPriceSweepUiFix);
  const loadRelevance=()=>loadScript('relevance','dashboard-retailer-relevance-fix.js?v=20260910-relevance2',()=>window.__finditDashboardRetailerRelevance);
  const loadCommerce=()=>loadScript('commerce','dashboard-commerce-status.js?v=20260911-live9',()=>window.__finditDashboardCommerceStatus);
  const loadStructure=()=>loadScript('product-structure','product-info-structure-guard.js?v=20260913-structure2',()=>window.__finditProductInfoStructureGuard);
  const loadProductGuard=()=>loadScript('product-click','product-info-click-fix.js?v=20260912-research5',()=>window.__finditProductInfoClickFix);
  const loadBuyingContext=()=>loadScript('product-buying-context','product-buying-context-fix.js?v=20260911-context1',()=>window.__finditProductBuyingContextFix);
  const loadLocalMarket=()=>loadScript('local-market-commerce','local-market-commerce-fix.js?v=20260911-local1',()=>window.__finditLocalMarketCommerceFix);
  const loadResearch=()=>loadScript('product-insights','product-insights-runtime.js?v=20260910-research2',()=>window.__finditAiProductInsightsV5);
  const loadExactnessGuard=()=>loadScript('commerce-exactness','commerce-exactness-guard.js?v=20260911-exact1',()=>window.__finditCommerceExactnessGuard);
  const loadCommerceUiV4=()=>loadScript('commerce-ui-v4','commerce-ui-v4.js?v=20260913-compare7',()=>window.__finditCommerceUiV4);
  const loadDashboardAudit=()=>loadScript('dashboard-audit-controls','dashboard-audit-controls.js?v=20260913-audit8',()=>window.__finditDashboardAuditControls);
  const loadFeedbackUi=()=>loadScript('feedback-feature-ui','feedback-feature-ui.js?v=20260913-feedback2',()=>window.__finditFeedbackFeatureUi);
  const loadSmartChoice=()=>loadScript('smart-choice','smart-choice-ui.js?v=20260913-smart2',()=>window.__finditSmartChoiceUi);
  const loadShoppingAssistant=()=>loadScript('shopping-assistant','shopping-assistant-ui.js?v=20260913-shop3',()=>window.__finditShoppingAssistantUi);
  const loadShoppingOfferGuard=()=>loadScript('shopping-offer-guard','shopping-assistant-current-offer-guard.js?v=20260913-offerguard1',()=>window.__finditShoppingAssistantCurrentOfferGuard);
  const loadShoppingStoreAccess=()=>loadScript('shopping-store-access','shopping-assistant-store-access.js?v=20260914-store3',()=>window.__finditShoppingAssistantStoreAccess);
  const loadFindActionsHours=()=>loadScript('find-actions-hours','find-actions-hours.js?v=20260914-actions4',()=>window.__finditFindActionsHours);
  const loadFindActionsSettle=()=>loadScript('find-actions-settle','find-actions-settle.js?v=20260914-settle1',()=>window.__finditFindActionsSettle);

  function reserveFeatureCardsForSingleOwner(){const shell=document.querySelector('#finditExactShell');if(!shell)return false;shell.querySelectorAll('.fx-feature-row article[data-fx]').forEach(card=>{if(!card.dataset.wired)card.dataset.wired='single-owner'});return true}
  async function loadGuards(){await loadDashboardAudit();await loadFeedbackUi();await loadSmartChoice();await loadShoppingAssistant();await loadShoppingOfferGuard();await loadShoppingStoreAccess();await loadFindActionsHours();await loadFindActionsSettle();await loadActionOwner();await Promise.all([loadPolish(),loadPriceSweep(),loadRelevance(),loadCommerce(),loadStructure(),loadProductGuard(),loadBuyingContext(),loadLocalMarket(),loadExactnessGuard()]);await loadCommerceUiV4();await loadCompare()}
  async function loadDashboardRuntime(){if(!document.querySelector('#finditExactShell'))return;reserveFeatureCardsForSingleOwner();if(window.__finditDashboardV8Loader){shellObserver?.disconnect();shellObserver=null;return}if(dashboardLoading)return;dashboardLoading=true;await loadGuards();if(!window.__finditDashboardV8Loader)await loadScript('dashboard-stable','dashboard-runtime-stable.js?v=20260913-product5',()=>window.__finditDashboardV8Loader);dashboardLoading=false;if(window.__finditDashboardV8Loader){shellObserver?.disconnect();shellObserver=null}try{document.dispatchEvent(new CustomEvent('findit:dashboard-sync'))}catch{}}
  loadGuards();
  shellObserver=new MutationObserver(()=>{if(document.querySelector('#finditExactShell')){reserveFeatureCardsForSingleOwner();loadDashboardRuntime()}});shellObserver.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(loadDashboardRuntime,0);setTimeout(loadDashboardRuntime,500);setTimeout(loadDashboardRuntime,1200);
  document.addEventListener('findit:results-rendered',()=>{loadResearch();reserveFeatureCardsForSingleOwner();loadGuards().then(()=>{try{document.dispatchEvent(new CustomEvent('findit:dashboard-sync'))}catch{}})});
})();