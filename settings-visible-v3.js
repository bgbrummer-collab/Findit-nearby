(()=>{
 'use strict';
 const $=s=>document.querySelector(s);
 function ensureButton(){
  const top=$('.topbar');if(!top||$('#finditSettingsTop'))return;
  const b=document.createElement('button');
  b.id='finditSettingsTop';b.type='button';b.className='icon-btn findit-settings-top';
  b.innerHTML='<span aria-hidden="true">⚙</span><span class="settings-label">Settings</span>';
  b.setAttribute('aria-label','Open FindIt settings');
  const menu=$('#menuBtn');top.insertBefore(b,menu||null);
 }
 function open(){
  const m=$('#settingsModal');if(!m)return;
  m.classList.remove('hidden');m.setAttribute('aria-hidden','false');
  $('#drawer')?.classList.remove('open');$('#drawer')?.setAttribute('aria-hidden','true');$('#drawerBackdrop')?.classList.add('hidden');
 }
 function cleanupDuplicate(){
  $('#settingsV3')?.remove();
 }
 function style(){
  if($('#settingsV3Style'))return;
  const st=document.createElement('style');st.id='settingsV3Style';st.textContent=`
   .findit-settings-top{display:inline-flex!important;align-items:center;gap:8px;width:auto!important;padding:0 13px!important;white-space:nowrap}.settings-label{font-size:13px;font-weight:800}
   #settingsModal .modal-card{width:min(760px,calc(100vw - 28px));max-height:88vh;overflow:auto;padding:28px!important}
   #settingsModal h2{font-size:clamp(28px,4vw,42px);margin-bottom:18px}
   @media(max-width:700px){.settings-label{display:none}.findit-settings-top{padding:0 10px!important}#settingsModal .modal-card{padding:20px!important}}
  `;document.head.appendChild(st);
 }
 function init(){
  style();cleanupDuplicate();ensureButton();
  document.addEventListener('click',e=>{
   if(e.target.closest('#finditSettingsTop,#openSettings,#openSettingsPremium')){
    e.preventDefault();e.stopImmediatePropagation();cleanupDuplicate();open();
   }
  },true);
  new MutationObserver(()=>{ensureButton();cleanupDuplicate()}).observe(document.body,{childList:true,subtree:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();