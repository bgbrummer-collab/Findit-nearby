(()=>{
 const KEY='findit_settings_v3';
 const $=s=>document.querySelector(s);
 const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}};
 const save=(k,v)=>{const x=read();x[k]=v;localStorage.setItem(KEY,JSON.stringify(x));apply()};
 function ensureButton(){
  const top=$('.topbar'); if(!top||$('#finditSettingsTop'))return;
  const b=document.createElement('button');b.id='finditSettingsTop';b.type='button';b.className='icon-btn findit-settings-top';b.innerHTML='<span aria-hidden="true">⚙</span><span class="settings-label">Settings</span>';b.setAttribute('aria-label','Open FindIt settings');
  const menu=$('#menuBtn');top.insertBefore(b,menu||null);
 }
 function open(){
  const m=$('#settingsModal');if(!m)return;
  m.classList.remove('hidden');m.setAttribute('aria-hidden','false');
  $('#drawer')?.classList.remove('open');$('#drawer')?.setAttribute('aria-hidden','true');$('#drawerBackdrop')?.classList.add('hidden');
 }
 function expand(){
  const card=$('#settingsModal .modal-card');if(!card||$('#settingsV3'))return;
  const s=read();const box=document.createElement('div');box.id='settingsV3';box.className='settings-v3';
  box.innerHTML=`<div class="settings-v3-head"><div><p>PREMIUM PREFERENCES</p><h3>Results & search</h3></div><span>Saved on this device</span></div>
  <label class="setting-row"><span><b>Result view</b><small>Choose how much detail results show.</small></span><select id="svResult"><option value="rich">Rich</option><option value="compact">Compact</option></select></label>
  <label class="setting-row"><span><b>Result ordering</b><small>Choose what FindIt prioritises.</small></span><select id="svSort"><option value="best">Best match</option><option value="closest">Closest</option><option value="cheapest">Cheapest verified</option></select></label>
  <label class="setting-row"><span><b>Show source details</b><small>Display verification and source information.</small></span><input id="svSources" type="checkbox"></label>
  <label class="setting-row"><span><b>Verified results first</b><small>Prioritise results with stronger evidence.</small></span><input id="svVerified" type="checkbox"></label>
  <label class="setting-row"><span><b>Auto-open product intelligence</b><small>Jump to price and availability after a search.</small></span><input id="svIntel" type="checkbox"></label>
  <div class="settings-v3-actions"><button id="svWatch" type="button">🔖 Open watchlist</button><button id="svReset" type="button">↺ Reset preferences</button></div>`;
  card.insertBefore(box,card.querySelector('[data-close-modal]')?.nextSibling||null);card.appendChild(box);
  $('#svResult').value=s.result||'rich';$('#svSort').value=s.sort||'best';$('#svSources').checked=s.sources!==false;$('#svVerified').checked=s.verified!==false;$('#svIntel').checked=!!s.intel;
  $('#svResult').onchange=e=>save('result',e.target.value);$('#svSort').onchange=e=>save('sort',e.target.value);$('#svSources').onchange=e=>save('sources',e.target.checked);$('#svVerified').onchange=e=>save('verified',e.target.checked);$('#svIntel').onchange=e=>save('intel',e.target.checked);
  $('#svWatch').onclick=()=>{mClose();if(typeof window.finditOpenAlertsWatchlist==='function')window.finditOpenAlertsWatchlist();else if(typeof v10Watchlist==='function')v10Watchlist()};
  $('#svReset').onclick=()=>{localStorage.removeItem(KEY);location.reload()};
 }
 function mClose(){$('#settingsModal')?.classList.add('hidden')}
 function apply(){const s=read();document.body.classList.toggle('findit-compact-results',s.result==='compact');document.body.classList.toggle('findit-hide-sources',s.sources===false);document.body.dataset.finditSort=s.sort||'best';document.body.dataset.finditVerifiedFirst=s.verified===false?'0':'1'}
 function style(){if($('#settingsV3Style'))return;const st=document.createElement('style');st.id='settingsV3Style';st.textContent=`
 .findit-settings-top{display:inline-flex!important;align-items:center;gap:8px;width:auto!important;padding:0 13px!important;white-space:nowrap}.settings-label{font-size:13px;font-weight:800}
 #settingsModal .modal-card{width:min(720px,calc(100vw - 28px));max-height:88vh;overflow:auto;padding:28px!important}#settingsModal h2{font-size:clamp(28px,4vw,42px);margin-bottom:18px}.settings-v3{margin-top:20px;border-top:1px solid rgba(255,255,255,.1);padding-top:22px}.settings-v3-head{display:flex;justify-content:space-between;gap:16px;align-items:end;margin-bottom:14px}.settings-v3-head p{font-size:11px;letter-spacing:.18em;color:#77e8ff;font-weight:900;margin:0 0 5px}.settings-v3-head h3{font-size:24px;margin:0}.settings-v3-head>span{font-size:11px;opacity:.65}.setting-row{min-height:68px!important;padding:14px 4px!important;border-bottom:1px solid rgba(255,255,255,.08);gap:18px}.setting-row>span{display:flex;flex-direction:column;gap:4px}.setting-row b{font-size:15px}.setting-row small{font-size:12px;opacity:.65;line-height:1.35}.setting-row select{min-width:150px}.settings-v3-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.settings-v3-actions button{border:1px solid rgba(110,130,255,.45);background:#121b35;color:#fff;border-radius:12px;padding:12px 15px;font-weight:800;cursor:pointer}
 .findit-compact-results #results .result-card,.findit-compact-results #results article{padding-top:12px!important;padding-bottom:12px!important}.findit-hide-sources .source-badge,.findit-hide-sources [class*="source-detail"]{display:none!important}
 @media(max-width:700px){.settings-label{display:none}.findit-settings-top{padding:0 10px!important}#settingsModal .modal-card{padding:20px!important}.settings-v3-head{align-items:start;flex-direction:column}.setting-row{align-items:flex-start!important;flex-direction:column}.setting-row select{width:100%}}
 `;document.head.appendChild(st)}
 function init(){style();ensureButton();expand();apply();document.addEventListener('click',e=>{if(e.target.closest('#finditSettingsTop,#openSettings,#openSettingsPremium')){e.preventDefault();e.stopImmediatePropagation();open()}},true);new MutationObserver(()=>ensureButton()).observe(document.body,{childList:true,subtree:true})}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();