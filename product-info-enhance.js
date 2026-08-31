/* FindIt Product Information bootstrap.
   Loads the web-grounded product research runtime used for What it does, Pros and Cons. */
(()=>{
  'use strict';
  if(window.__finditProductInfoEnhance)return;
  window.__finditProductInfoEnhance=true;
  if(window.__finditAiProductInsightsV3)return;
  if(document.querySelector('script[data-findit-product-insights-runtime]'))return;
  const s=document.createElement('script');
  s.src='product-insights-runtime.js?v=20260831-webresearch3';
  s.defer=true;
  s.dataset.finditProductInsightsRuntime='1';
  s.onload=()=>document.dispatchEvent(new CustomEvent('findit:dashboard-sync'));
  document.head.appendChild(s);
})();
