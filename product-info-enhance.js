/* FindIt Product Information bootstrap.
   Loads the maintained dashboard controls once the exact shell exists, and loads
   web-grounded product research only when it is actually needed. */
(()=>{
  'use strict';
  if(window.__finditProductInfoEnhance)return;
  window.__finditProductInfoEnhance=true;

  let loading=false;
  let dashboardLoading=false;
  function loadDashboardRuntime(){
    if(window.__finditDashboardV8Loader||dashboardLoading)return;
    if(!document.querySelector('#finditExactShell'))return;
    if(document.querySelector('script[data-findit-dashboard-stable]'))return;
    dashboardLoading=true;
    const s=document.createElement('script');
    s.src='dashboard-runtime-stable.js?v=20260906-askfix1';
    s.async=false;
    s.dataset.finditDashboardStable='1';
    s.onload=()=>{dashboardLoading=false;try{document.dispatchEvent(new CustomEvent('findit:dashboard-sync'))}catch{}};
    s.onerror=()=>{dashboardLoading=false};
    document.head.appendChild(s);
  }
  const dashboardObserver=new MutationObserver(()=>{
    if(document.querySelector('#finditExactShell')){
      loadDashboardRuntime();
      dashboardObserver.disconnect();
    }
  });
  dashboardObserver.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(loadDashboardRuntime,0);
  setTimeout(loadDashboardRuntime,800);

  function loadResearchRuntime(){
    if(window.__finditAiProductInsightsV3)return Promise.resolve();
    const existing=document.querySelector('script[data-findit-product-insights-runtime]');
    if(existing){
      if(existing.dataset.loaded==='1')return Promise.resolve();
      return new Promise(resolve=>existing.addEventListener('load',resolve,{once:true}));
    }
    if(loading)return Promise.resolve();
    loading=true;
    return new Promise(resolve=>{
      const s=document.createElement('script');
      s.src='product-insights-runtime.js?v=20260831-webresearch4';
      s.async=true;
      s.dataset.finditProductInsightsRuntime='1';
      s.onload=()=>{
        s.dataset.loaded='1';
        loading=false;
        document.dispatchEvent(new CustomEvent('findit:dashboard-sync'));
        resolve();
      };
      s.onerror=()=>{loading=false;resolve();};
      document.head.appendChild(s);
    });
  }

  // Do not fetch the research runtime during the browser's initial page load.
  // Load it only once results exist or the user opens Product Information.
  document.addEventListener('findit:results-rendered',()=>setTimeout(loadResearchRuntime,0));
  window.addEventListener('click',e=>{
    const trigger=e.target?.closest?.('#finditExactShell [data-fx="product"]');
    if(trigger)loadResearchRuntime();
  },true);
})();
