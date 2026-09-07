/* Compatibility loader: maintained controls live in dashboard-runtime-v8.js. */
(()=>{
  if(window.__finditDashboardV8Loader)return;
  window.__finditDashboardV8Loader=true;
  const loadBigClean=()=>{if(document.querySelector('script[data-findit-big-clean]'))return;const b=document.createElement('script');b.src='/big-clean-fix.js?v=20260906-clean1';b.async=false;b.dataset.finditBigClean='1';document.head.appendChild(b)};
  const loadPlanGuard=()=>{if(document.querySelector('script[data-findit-plan-guard]')){loadBigClean();return}const g=document.createElement('script');g.src='/premium-dashboard-guard.js?v=20260905-plans1';g.async=false;g.dataset.finditPlanGuard='1';g.onload=loadBigClean;g.onerror=loadBigClean;document.head.appendChild(g)};
  const loadPolish=()=>{if(!document.querySelector('script[data-findit-polish-v9]')){const p=document.createElement('script');p.src='/dashboard-polish-v9.js?v=20260903-fixes1';p.async=false;p.dataset.finditPolishV9='1';document.head.appendChild(p)}loadPlanGuard()};
  const s=document.createElement('script');s.src='/dashboard-runtime-v8.js?v=20260903-tools5';s.async=false;s.onload=loadPolish;s.onerror=loadPolish;document.head.appendChild(s);
  const hasLiveStock=el=>/\bLive Stock\b/i.test(el?.textContent||'');
  const wireLiveStock=()=>{const shell=document.querySelector('#finditExactShell');if(!shell)return;const labels=[...shell.querySelectorAll('*')].filter(el=>hasLiveStock(el)&&![...el.children].some(hasLiveStock));labels.forEach(label=>{const target=label.closest('[data-fx],button,[role="button"],article')||label.parentElement||label;target.dataset.fx='stock'})};
  wireLiveStock();document.addEventListener('findit:dashboard-sync',wireLiveStock);new MutationObserver(wireLiveStock).observe(document.documentElement,{childList:true,subtree:true});setTimeout(wireLiveStock,100);setTimeout(wireLiveStock,700);
  window.addEventListener('click',e=>{const el=e.target?.closest?.('#finditExactShell [data-fx="stock"]');if(!el)return;e.preventDefault();e.stopImmediatePropagation();window.finditDashboardAction?.('stock')},true);
  // Product Information is intentionally owned only by product-info-click-fix.js.
})();
