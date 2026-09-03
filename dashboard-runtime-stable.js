/* Compatibility loader: maintained controls live in dashboard-runtime-v8.js. */
(()=>{
  if(window.__finditDashboardV8Loader)return;
  window.__finditDashboardV8Loader=true;
  const s=document.createElement('script');
  s.src='/dashboard-runtime-v8.js?v=20260903-tools2';
  s.async=false;
  document.head.appendChild(s);

  // Live Stock used to share the Nearby action. Catch it at window capture
  // before older document-level dashboard handlers can swallow the click.
  window.addEventListener('click',e=>{
    const el=e.target?.closest?.('#finditExactShell article');
    if(!el||!/^\s*Live Stock\b/i.test(el.textContent||''))return;
    e.preventDefault();
    e.stopImmediatePropagation();
    window.finditDashboardAction?.('stock');
  },true);
})();
