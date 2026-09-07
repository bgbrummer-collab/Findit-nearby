/* FindIt Product Information bootstrap.
   Loads the maintained dashboard controls once the exact shell exists, and loads
   web-grounded product research only when it is actually needed. */
(()=>{
  'use strict';
  if(window.__finditProductInfoEnhance)return;
  window.__finditProductInfoEnhance=true;

  let loading=false;
  let dashboardLoading=false;
  function loadClickGuard(){
    if(window.__finditProductInfoClickFix||document.querySelector('script[data-findit-product-click-fix]'))return;
    const g=document.createElement('script');
    g.src='product-info-click-fix.js?v=20260907-clickhang1';
    g.async=false;
    g.dataset.finditProductClickFix='1';
    document.head.appendChild(g);
  }
  function loadQualityGuard(){
    if(window.__finditProductInfoQualityFix||document.querySelector('script[data-findit-product-quality]'))return;
    const q=document.createElement('script');
    q.src='product-info-quality-fix.js?v=20260907-proscons1';
    q.async=false;
    q.dataset.finditProductQuality='1';
    document.head.appendChild(q);
  }
  function loadDashboardRuntime(){
    loadClickGuard();
    if(window.__finditDashboardV8Loader||dashboardLoading){loadQualityGuard();return;}
    if(!document.querySelector('#finditExactShell'))return;
    if(document.querySelector('script[data-findit-dashboard-stable]')){loadQualityGuard();return;}
    dashboardLoading=true;
    const s=document.createElement('script');
    s.src='dashboard-runtime-stable.js?v=20260906-askfix1';
    s.async=false;
    s.dataset.finditDashboardStable='1';
    s.onload=()=>{dashboardLoading=false;loadQualityGuard();try{document.dispatchEvent(new CustomEvent('findit:dashboard-sync'))}catch{}};
    s.onerror=()=>{dashboardLoading=false;loadQualityGuard();};
    document.head.appendChild(s);
  }
  loadClickGuard();
  const dashboardObserver=new MutationObserver(()=>{
    if(document.querySelector('#finditExactShell')){
      loadDashboardRuntime();
      dashboardObserver.disconnect();
    }
  });
  dashboardObserver.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(loadDashboardRuntime,0);
  setTimeout(loadDashboardRuntime,800);
  setTimeout(loadQualityGuard,1200);

  function loadResearchRuntime(){
    if(window.__finditAiProductInsightsV5)return Promise.resolve();
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
        loadQualityGuard();
        document.dispatchEvent(new CustomEvent('findit:dashboard-sync'));
        resolve();
      };
      s.onerror=()=>{loading=false;loadQualityGuard();resolve();};
      document.head.appendChild(s);
    });
  }

  // Do not fetch the research runtime during the browser's initial page load.
  // Load it only once results exist or the user opens Product Information.
  document.addEventListener('findit:results-rendered',()=>setTimeout(loadResearchRuntime,0));
})();
