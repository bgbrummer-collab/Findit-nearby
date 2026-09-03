/* Compatibility loader: maintained controls live in dashboard-runtime-v8.js. */
(()=>{
  if(window.__finditDashboardV8Loader)return;
  window.__finditDashboardV8Loader=true;
  const s=document.createElement('script');
  s.src='/dashboard-runtime-v8.js?v=20260903-tools5';
  s.async=false;
  document.head.appendChild(s);

  const hasLiveStock=el=>/\bLive Stock\b/i.test(el?.textContent||'');

  // Legacy dashboard layouts do not always render Live Stock with the same
  // element type or data-fx value. Find the deepest label node and promote its
  // nearest interactive/card container to the maintained stock action.
  const wireLiveStock=()=>{
    const shell=document.querySelector('#finditExactShell');
    if(!shell)return;
    const labels=[...shell.querySelectorAll('*')].filter(el=>{
      if(!hasLiveStock(el))return false;
      return ![...el.children].some(hasLiveStock);
    });
    labels.forEach(label=>{
      const target=label.closest('[data-fx],button,[role="button"],article')||label.parentElement||label;
      target.dataset.fx='stock';
    });
  };
  wireLiveStock();
  document.addEventListener('findit:dashboard-sync',wireLiveStock);
  const observer=new MutationObserver(wireLiveStock);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(wireLiveStock,100);
  setTimeout(wireLiveStock,700);

  // Catch the explicitly wired stock control at window capture before older
  // document-level dashboard handlers can swallow the click.
  window.addEventListener('click',e=>{
    const el=e.target?.closest?.('#finditExactShell [data-fx="stock"]');
    if(!el)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    window.finditDashboardAction?.('stock');
  },true);
})();
