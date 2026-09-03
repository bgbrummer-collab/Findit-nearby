/* Compatibility loader: maintained controls live in dashboard-runtime-v8.js. */
(()=>{
  if(window.__finditDashboardV8Loader)return;
  window.__finditDashboardV8Loader=true;
  const loadPolish=()=>{
    if(document.querySelector('script[data-findit-polish-v9]'))return;
    const p=document.createElement('script');
    p.src='/dashboard-polish-v9.js?v=20260903-fixes1';
    p.async=false;
    p.dataset.finditPolishV9='1';
    document.head.appendChild(p);
  };
  const s=document.createElement('script');
  s.src='/dashboard-runtime-v8.js?v=20260903-tools5';
  s.async=false;
  s.onload=loadPolish;
  s.onerror=loadPolish;
  document.head.appendChild(s);

  const hasLiveStock=el=>/\bLive Stock\b/i.test(el?.textContent||'');
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

  window.addEventListener('click',e=>{
    const actionEl=e.target?.closest?.('#finditExactShell [data-fx="stock"], #finditExactShell [data-fx="product"]');
    if(!actionEl)return;
    const action=actionEl.dataset.fx;
    if(action!=='stock'&&action!=='product')return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const run=()=>{
      if(typeof window.finditDashboardAction==='function'){
        window.finditDashboardAction(action);
        return true;
      }
      return false;
    };
    if(run())return;
    let tries=0;
    const timer=setInterval(()=>{
      if(run()||++tries>20)clearInterval(timer);
    },50);
  },true);
})();
