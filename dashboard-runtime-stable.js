/* Compatibility loader: maintained controls live in dashboard-runtime-v8.js. */
(()=>{
  if(window.__finditDashboardV8Loader)return;
  window.__finditDashboardV8Loader=true;
  const s=document.createElement('script');
  s.src='/dashboard-runtime-v8.js?v=20260903-tools4';
  s.async=false;
  document.head.appendChild(s);

  // The legacy dashboard renders Live Stock as a plain article in some states.
  // Mark the actual visible card as the stock action so the maintained v8
  // router can own it consistently, regardless of its original data-fx value.
  const wireLiveStock=()=>{
    document.querySelectorAll('#finditExactShell article').forEach(el=>{
      if(/\bLive Stock\b/i.test(el.textContent||''))el.dataset.fx='stock';
    });
  };
  wireLiveStock();
  document.addEventListener('findit:dashboard-sync',wireLiveStock);
  const observer=new MutationObserver(wireLiveStock);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(wireLiveStock,100);
  setTimeout(wireLiveStock,700);

  // Catch Live Stock at window capture before older document-level dashboard
  // handlers can swallow the click.
  window.addEventListener('click',e=>{
    const el=e.target?.closest?.('#finditExactShell article');
    if(!el||!/\bLive Stock\b/i.test(el.textContent||''))return;
    e.preventDefault();
    e.stopImmediatePropagation();
    window.finditDashboardAction?.('stock');
  },true);
})();
