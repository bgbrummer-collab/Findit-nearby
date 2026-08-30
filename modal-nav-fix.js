(()=>{
  'use strict';
  if(window.__finditModalNavFix)return;window.__finditModalNavFix=true;
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  function hide(sel){const el=$(sel);if(!el)return;el.classList.add('hidden');el.setAttribute('aria-hidden','true')}
  function closeDashboardModals(){hide('#fxPanelModal');hide('#fxSettingsModal')}
  function installStyle(){if($('#finditModalNavFixStyle'))return;const s=document.createElement('style');s.id='finditModalNavFixStyle';s.textContent=`
    #fxPanelModal,#fxSettingsModal{pointer-events:none!important}
    #fxPanelModal .fx-modal-card,#fxSettingsModal .fx-modal-card{pointer-events:none!important}
    #fxPanelModal button,#fxPanelModal a,#fxPanelModal input,#fxPanelModal select,#fxPanelModal textarea,
    #fxSettingsModal button,#fxSettingsModal a,#fxSettingsModal input,#fxSettingsModal select,#fxSettingsModal textarea{pointer-events:auto!important}
  `;document.head.appendChild(s)}
  window.addEventListener('pointerdown',e=>{
    const t=e.target?.closest?.('#finditExactShell [data-fx],#finditExactShell [data-fxnav]');
    if(t)closeDashboardModals();
  },true);
  window.addEventListener('click',e=>{
    const t=e.target?.closest?.('#finditExactShell [data-fx],#finditExactShell [data-fxnav]');
    if(t)closeDashboardModals();
    if(e.target=== $('#fxPanelModal')||e.target=== $('#fxSettingsModal'))closeDashboardModals();
  },true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDashboardModals()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installStyle,{once:true});else installStyle();
})();
