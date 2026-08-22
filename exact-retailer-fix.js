/* FindIt retailer/directions hardening.
   Never turn a brand name into a Directions destination.
   Directions are exposed only for an exact, stock-verified branch with coordinates.
   Unverified fallback actions are clearly SEARCH actions, not directions. */
(()=>{
 const $=s=>document.querySelector(s);
 const clean=v=>String(v??'').trim();
 const current=()=>{try{return state?.result?.identification||null}catch{return null}};
 const stores=()=>{try{return Array.isArray(state?.stores)?state.stores:[]}catch{return[]}};
 const exactStore=s=>Boolean(s&&s.exactProductMatch===true&&s.stockVerified===true&&Number.isFinite(Number(s.lat))&&Number.isFinite(Number(s.lon)));
 const exactEnough=i=>Boolean(i&&(i.exactIdentityVerified||i.userConfirmedCandidate||i.modelEvidence||i.schoolName));
 function terms(i){
  if(!i||!exactEnough(i))return'';
  if(i.schoolName)return [i.schoolName,i.uniformItem||i.name||i.object,'uniform retailer'].map(clean).filter(Boolean).join(' ');
  return [i.brand,i.model,i.searchQuery||i.name||i.object,'retailer'].map(clean).filter(Boolean).join(' ');
 }
 function searchMaps(i){const q=terms(i);if(!q)return'';return `https://www.google.com/maps/search/?${new URLSearchParams({api:'1',query:q})}`}
 function web(i){const q=terms(i);return q?`https://www.google.com/search?q=${encodeURIComponent(q)}`:''}
 function directions(s){return exactStore(s)?`https://www.google.com/maps/dir/?${new URLSearchParams({api:'1',destination:`${Number(s.lat)},${Number(s.lon)}`})}`:''}
 function patchFallback(){
  const i=current();if(!i)return;
  const near=$('#searchNearbyFree'),online=$('#searchOnline');
  if(online){const u=web(i);if(u)online.href=u}
  if(near){
   const u=searchMaps(i);
   if(!u){near.style.display='none';return}
   near.style.display='';near.href=u;near.target='_blank';near.rel='noopener noreferrer';
   const strong=near.querySelector('strong'),span=near.querySelector('span');
   if(strong)strong.textContent='Search nearby retailers';
   if(span)span.textContent='Search only — choose a real branch before getting directions';
  }
 }
 function patchStoreDirections(){
  const ss=stores();
  document.querySelectorAll('[data-store]').forEach(card=>{
   const s=ss[Number(card.dataset.store)];
   card.querySelectorAll('a').forEach(a=>{
    if(!/direction/i.test(a.textContent||''))return;
    const u=directions(s);
    if(u){a.href=u;a.target='_blank';a.rel='noopener noreferrer';a.style.display=''}
    else{a.removeAttribute('href');a.style.display='none';}
   });
  });
 }
 function patch(){patchFallback();patchStoreDirections()}
 function install(){
  try{if(typeof renderFreeActions==='function'&&!renderFreeActions.__safeDirections){const old=renderFreeActions;const next=function(i){const r=old(i);setTimeout(patch,0);return r};next.__safeDirections=true;renderFreeActions=next}}catch{}
  try{if(typeof renderStores==='function'&&!renderStores.__safeDirections){const old=renderStores;const next=function(){const r=old.apply(this,arguments);setTimeout(patchStoreDirections,0);return r};next.__safeDirections=true;renderStores=next;window.renderStores=next}}catch{}
  document.addEventListener('click',e=>{
   const a=e.target.closest?.('a');if(!a||!/direction/i.test(a.textContent||''))return;
   const card=a.closest('[data-store]');if(!card)return;
   const s=stores()[Number(card.dataset.store)];const u=directions(s);
   if(!u){e.preventDefault();e.stopImmediatePropagation();return}
   a.href=u;
  },true);
  document.addEventListener('findit:results-rendered',()=>setTimeout(patch,0));
  new MutationObserver(()=>patchStoreDirections()).observe(document.body,{childList:true,subtree:true});
  patch();setTimeout(patch,700);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();

/* FINDIT IDENTIFY BUTTON COMPATIBILITY FIX
   The current index.html uses the new results UI while the older script.js
   still references removed result nodes. This handler bypasses those stale
   nodes and renders directly into the current UI. */
(()=>{
 const $=s=>document.querySelector(s);
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const getState=()=>{try{return state}catch{return null}};
 const setText=(sel,text)=>{const el=$(sel);if(el)el.textContent=text??''};
 const show=(sel)=>$(sel)?.classList.remove('hidden');
 const hide=(sel)=>$(sel)?.classList.add('hidden');
 function status(text,error=false){const el=$('#status');if(!el)return;el.textContent=text;el.style.color=error?'#ff9da7':''}
 function currentRadius(){const s=getState();const n=Number(s?.radius||$('#radiusSelect')?.value||10);return Number.isFinite(n)?n:10}
 function getLocation(){return new Promise((resolve,reject)=>{
  if(!navigator.geolocation)return reject(new Error('Location unavailable'));
  navigator.geolocation.getCurrentPosition(p=>resolve({lat:p.coords.latitude,lon:p.coords.longitude}),reject,{enableHighAccuracy:true,timeout:12000,maximumAge:120000});
 })}
 function clearCurrentResults(){
  const s=getState();if(s){s.result=null;s.offers=[];s.stores=[]}
  setText('#resultName','Item');setText('#resultDescription','');setText('#confidenceValue','—');
  const meta=$('#resultMeta');if(meta)meta.innerHTML='';
  const note=$('#resultNote');if(note){note.innerHTML='';note.classList.remove('error')}
  const nearby=$('#nearbyStores');if(nearby)nearby.innerHTML='';
  setText('#nearbySummary','');hide('#results');
 }
 function renderIdentification(i){
  const name=i?.name||i?.model||i?.object||'Item identified';
  const summary=i?.summary||'FindIt analysed the uploaded image.';
  const confidence=Math.max(0,Math.min(100,Math.round(Number(i?.confidence||0)*100)));
  setText('#resultName',name);setText('#resultDescription',summary);setText('#confidenceValue',`${confidence}%`);
  const meta=$('#resultMeta');if(meta){
   const visible=Array.isArray(i?.visibleText)&&i.visibleText.length?i.visibleText.slice(0,4).join(' • '):'';
   const rows=[['Object',i?.object],['Brand',i?.brand],['Model',i?.model],['Category',i?.retailCategory||i?.category],['Search',i?.searchQuery],['Visible text',visible]].filter(([,v])=>v);
   meta.innerHTML=rows.map(([k,v])=>`<div class="analysis-card"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('');
  }
  const note=$('#resultNote');if(note){note.textContent=confidence<55?'FindIt is not confident enough to guess. Try a clearer photo.':'';note.classList.toggle('error',confidence<55)}
 }
 function exactDirections(s){
  return s?.exactProductMatch===true&&s?.stockVerified===true&&Number.isFinite(Number(s?.lat))&&Number.isFinite(Number(s?.lon))
   ?`https://www.google.com/maps/dir/?${new URLSearchParams({api:'1',destination:`${Number(s.lat)},${Number(s.lon)}`})}`:'';
 }
 function mapsSearch(s){
  const q=[s?.name,s?.address].filter(Boolean).join(' ');return q?`https://www.google.com/maps/search/?${new URLSearchParams({api:'1',query:q})}`:'';
 }
 function renderStores(stores,message=''){
  const el=$('#nearbyStores');if(!el)return;
  if(!stores.length){el.innerHTML=`<div class="empty-state">${esc(message||'No reliable nearby retailers found.')}</div>`;setText('#nearbySummary',message||'No nearby results yet.');return}
  setText('#nearbySummary',`${stores.length} relevant retailer${stores.length===1?'':'s'} found within your search area.`);
  el.innerHTML=stores.map((s,i)=>{
   const distance=Number.isFinite(Number(s.distanceKm))?`${Number(s.distanceKm).toFixed(1)} km`:'Distance unavailable';
   const d=exactDirections(s),m=mapsSearch(s);
   const action=d?`<a href="${esc(d)}" target="_blank" rel="noopener noreferrer">Directions</a>`:m?`<a href="${esc(m)}" target="_blank" rel="noopener noreferrer">View on Maps</a>`:'';
   return `<article class="store-card" data-store="${i}"><span class="store-rank">${i+1}</span><div class="store-main"><strong>${esc(s.name||'Retailer')}</strong><small>${esc(s.address||s.type||'Retailer')}</small><div class="store-tags"><span>${esc(s.type||'retail')}</span><span>Nearby retailer</span><span>${s.stockVerified===true?'Stock verified':'Stock not verified'}</span></div></div><div class="store-side"><div class="store-distance">${esc(distance)}</div><div class="store-actions">${s.phone?`<a href="tel:${esc(s.phone)}">Call</a>`:''}${s.website?`<a href="${esc(s.website)}" target="_blank" rel="noopener noreferrer">Website</a>`:''}${action}</div></div></article>`;
  }).join('');
 }
 async function loadNearbyCompat(i,coords){
  const el=$('#nearbyStores');if(el)el.innerHTML='<div class="empty-state">Finding relevant nearby retailers…</div>';
  try{
   const r=await fetch('/api/nearby',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({lat:coords.lat,lon:coords.lon,identification:i,radiusKm:currentRadius()})});
   const d=await r.json().catch(()=>({}));if(!r.ok||d.ok===false)throw new Error(d.error||'Nearby search failed');
   const list=Array.isArray(d.stores)?d.stores:[];const s=getState();if(s)s.stores=list;
   renderStores(list,d.message||'');
  }catch(e){renderStores([],`Nearby retailer search is temporarily unavailable: ${e.message}`)}
 }
 function saveRecentCompat(i){
  try{
   const key='finditRecent',old=JSON.parse(localStorage.getItem(key)||'[]');
   const item={id:Date.now(),name:i?.name||i?.object||'Item',brand:i?.brand||'',query:i?.searchQuery||'',date:new Date().toISOString()};
   const arr=[item,...old.filter(x=>x.query!==item.query)].slice(0,20);localStorage.setItem(key,JSON.stringify(arr));
   const grid=$('#recentGrid');if(grid)grid.innerHTML=arr.slice(0,8).map(x=>`<article class="recent-card"><strong>${esc(x.name)}</strong><small>${esc([x.brand,x.query].filter(Boolean).join(' • '))}</small></article>`).join('');
  }catch{}
 }
 function install(){
  const btn=$('#search');if(!btn)return;
  btn.onclick=async e=>{
   e.preventDefault();
   const s=getState();if(!s?.file){status('Choose a photo first.',true);return}
   clearCurrentResults();btn.disabled=true;status('Identifying your item…');
   try{
    if(!s.coords){try{s.coords=await getLocation();const lb=$('#location');if(lb)lb.textContent='✓ Location ready'}catch{}}
    const fd=new FormData();fd.append('image',s.file);if(s.coords){fd.append('lat',s.coords.lat);fd.append('lon',s.coords.lon)}
    const r=await fetch('/api/search',{method:'POST',body:fd});const data=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(data.message||data.error||`Search failed (${r.status})`);
    s.result=data;const i=data.identification||{};renderIdentification(i);show('#results');
    if(data.blocked){const note=$('#resultNote');if(note){note.textContent=data.message||'This item cannot be searched.';note.classList.add('error')}}
    if(s.coords&&Number(i.confidence||0)>=.55&&!data.blocked)await loadNearbyCompat(i,s.coords);else renderStores([],s.coords?'Try a clearer photo to search nearby retailers.':'Identification worked. Allow location to see nearby retailers.');
    saveRecentCompat(i);status('Search complete.');
    $('#results')?.scrollIntoView({behavior:'smooth',block:'start'});
    document.dispatchEvent(new CustomEvent('findit:results-rendered'));
   }catch(err){
    show('#results');const note=$('#resultNote');if(note){note.textContent=`Search error: ${err.message}`;note.classList.add('error')}
    status('Search failed. Please try again.',true);
   }finally{btn.disabled=!s?.file}
  };
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
