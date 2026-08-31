/* FindIt Product Information bootstrap.
   Loads the web-grounded product research runtime only when it is actually needed,
   so FindIt's initial page load is never held open by the research bundle. */
(()=>{
  'use strict';
  if(window.__finditProductInfoEnhance)return;
  window.__finditProductInfoEnhance=true;

  let loading=false;
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
