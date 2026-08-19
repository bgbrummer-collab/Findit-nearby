/* FindIt exact-retailer hardening: never send exact-product users to a generic category Maps search. */
(()=>{
 const $=s=>document.querySelector(s);
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const clean=v=>String(v??'').trim();
 function current(){try{return state?.result?.identification||null}catch{return null}}
 function exactTerms(i){
   if(!i)return'';
   if(i.schoolName)return `${clean(i.schoolName)} ${clean(i.uniformItem||i.name||i.object)} uniform supplier`;
   const brand=clean(i.brand),model=clean(i.model),name=clean(i.name||i.object),q=clean(i.searchQuery);
   const base=[brand,model||name||q].filter(Boolean).join(' ').trim();
   return base?`${base} retailer store`:'';
 }
 function exactMapsUrl(i){
   const term=exactTerms(i);if(!term)return'';
   let query=term;
   try{if(state?.coords)query=`${term} near ${state.coords.lat},${state.coords.lon}`}catch{}
   const p=new URLSearchParams({api:'1',query});
   return `https://www.google.com/maps/search/?${p.toString()}`;
 }
 function exactWebUrl(i){
   const brand=clean(i?.brand),model=clean(i?.model),q=clean(i?.searchQuery||i?.name||i?.object);
   const terms=[brand,model,q].filter(Boolean).join(' ');
   return terms?`https://www.google.com/search?q=${encodeURIComponent('"'+terms+'" retailer')}`:'';
 }
 function patchFreeActions(){
   const i=current();if(!i)return;
   const near=$('#searchNearbyFree');
   if(near){const u=exactMapsUrl(i);if(u)near.href=u;const strong=near.querySelector('strong'),span=near.querySelector('span');if(strong)strong.textContent='Find exact retailer nearby';if(span)span.textContent='Uses brand/model/product — not generic category stores';}
   const online=$('#searchOnline');if(online){const u=exactWebUrl(i);if(u)online.href=u;}
 }
 function installRendererPatch(){
   try{
     if(typeof renderFreeActions==='function'&&!renderFreeActions.__exactRetailer){
       const old=renderFreeActions;
       const next=function(i){const r=old(i);setTimeout(patchFreeActions,0);return r};
       next.__exactRetailer=true;renderFreeActions=next;
     }
   }catch{}
 }
 function enhanceWatchlist(){
   const body=$('#v10ModalBody');if(!body||!/price\s*&\s*stock|watchlist/i.test(body.textContent||''))return;
   const items=(()=>{try{const a=JSON.parse(localStorage.getItem('findit_v10_watchlist')||'[]');return Array.isArray(a)?a:[]}catch{return[]}})();
   body.querySelectorAll('.v10-list>.v10-row').forEach((row,idx)=>{
     if(row.querySelector('.findit-exact-retailer-actions'))return;
     const item=items[idx];if(!item)return;
     const fakeI={brand:item.brand,model:item.model,name:item.name,object:item.name,searchQuery:item.query};
     const maps=exactMapsUrl(fakeI),web=exactWebUrl(fakeI);
     const wrap=document.createElement('div');wrap.className='findit-exact-retailer-actions';wrap.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:10px';
     if(web){const a=document.createElement('a');a.href=web;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Find exact listing →';wrap.appendChild(a)}
     if(maps){const a=document.createElement('a');a.href=maps;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Find exact retailer nearby →';wrap.appendChild(a)}
     const first=row.firstElementChild;if(first&&wrap.children.length)first.appendChild(wrap);
   });
 }
 function installWatchObserver(){const b=$('#v10ModalBody');if(!b)return;new MutationObserver(()=>setTimeout(enhanceWatchlist,0)).observe(b,{childList:true,subtree:true});enhanceWatchlist()}
 function init(){installRendererPatch();patchFreeActions();installWatchObserver();document.addEventListener('findit:results-rendered',()=>setTimeout(patchFreeActions,0));setTimeout(()=>{installRendererPatch();patchFreeActions()},700)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();