/* Compatibility loader: the maintained dashboard runtime now lives in dashboard-runtime-v8.js. */
(()=>{
  if(window.__finditDashboardV8Loader)return;
  window.__finditDashboardV8Loader=true;
  const s=document.createElement('script');
  s.src='/dashboard-runtime-v8.js?v=20260903-tools1';
  s.async=false;
  document.head.appendChild(s);
})();
