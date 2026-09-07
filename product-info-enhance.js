/* FindIt Product Information bootstrap.
   Loads maintained dashboard controls and product research without adding a second
   Product Information click handler. */
(()=>{
  'use strict';
  if(window.__finditProductInfoEnhance)return;
  window.__finditProductInfoEnhance=true;
  let loading=false,dashboardLoading=false,guardPromise=null;
  function loadClickGuard(){
    if(window.__finditProductInfoClickFix)return Promise.resolve();
    if(guardPromise)return guardPromise;
    const existing=document.querySelector('script[data-findit-product-click-fix]');
    guardPromise=new Promise(resolve=>{
      if(existing){if(window.__finditProductInfoClickFix)return resolve();existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',resolve,{once:true});return}
      const g=document.createElement('script');g.src='product-info-click-fix.js?v=20260907-final2';g.async=false;g.dataset.finditProductClickFix='1';g.onload=resolve;g.onerror=resolve;document.head.appendChild(g);
    });
    return guardPromise;
  }
  function loadQualityGuard(){
    if(window.__finditProductInfoQualityFix||document.querySelector('script[data-findit-product-quality]'))return;
    const q=document.createElement('script');q.src='product-info-quality-fix.js?v=20260907-proscons1';q.async=false;q.dataset.finditProductQuality='1';document.head.appendChild(q);
  }
  async function loadDashboardRuntime(){
    await loadClickGuard();
    if(window.__finditDashboardV8Loader||dashboardLoading){loadQualityGuard();return}
    if(!document.querySelector('#finditExactShell'))return;
    if(document.querySelector('script[data-findit-dashboard-stable]')){loadQualityGuard();return}
    dashboardLoading=true;
    const s=document.createElement('script');s.src='dashboard-runtime-stable.js?v=20260906-askfix1';s.async=false;s.dataset.finditDashboardStable='1';
    s.onload=()=>{dashboardLoading=false;loadQualityGuard();try{document.dispatchEvent(new CustomEvent('findit:dashboard-sync'))}catch{}};
    s.onerror=()=>{dashboardLoading=false;loadQualityGuard()};document.head.appendChild(s);
  }
  loadClickGuard();
  const observer=new MutationObserver(()=>{if(document.querySelector('#finditExactShell')){loadDashboardRuntime();observer.disconnect()}});observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(loadDashboardRuntime,0);setTimeout(loadDashboardRuntime,800);setTimeout(loadQualityGuard,1200);
  function loadResearchRuntime(){
    if(window.__finditAiProductInsightsV5)return Promise.resolve();
    const existing=document.querySelector('script[data-findit-product-insights-runtime]');
    if(existing){if(existing.dataset.loaded==='1')return Promise.resolve();return new Promise(resolve=>{existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',resolve,{once:true})})}
    if(loading)return Promise.resolve();loading=true;
    return new Promise(resolve=>{const s=document.createElement('script');s.src='product-insights-runtime.js?v=20260907-research1';s.async=true;s.dataset.finditProductInsightsRuntime='1';s.onload=()=>{s.dataset.loaded='1';loading=false;loadQualityGuard();resolve()};s.onerror=()=>{loading=false;loadQualityGuard();resolve()};document.head.appendChild(s)});
  }
  document.addEventListener('findit:results-rendered',()=>setTimeout(loadResearchRuntime,0));
})();
