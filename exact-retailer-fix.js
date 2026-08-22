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