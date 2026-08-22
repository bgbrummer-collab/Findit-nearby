/* FindIt exact-retailer + directions hardening.
   Core rule: never claim that a shop has the exact product unless FindIt has
   exact-product evidence. Directions are only shown for a verified branch
   with coordinates. Generic nearby stores remain useful discovery only. */
(()=>{
 const $=s=>document.querySelector(s);
 const clean=v=>String(v??'').trim();
 const current=()=>{try{return state?.result?.identification||null}catch{return null}};
 const stores=()=>{try{return Array.isArray(state?.stores)?state.stores:[]}catch{return[]}};
 const exactStore=s=>Boolean(s&&s.exactProductMatch===true&&s.stockVerified===true&&Number.isFinite(Number(s.lat))&&Number.isFinite(Number(s.lon)));
 const exactEnough=i=>Boolean(i&&(i.exactIdentityVerified||i.userConfirmedCandidate||i.modelEvidence||i.schoolName||Number(i.confidence||0)>=.75));
 function terms(i){
  if(!i||!exactEnough(i))return'';
  if(i.schoolName)return [i.schoolName,i.uniformItem||i.name||i.object,'uniform retailer'].map(clean).filter(Boolean).join(' ');
  return [i.brand,i.model,i.searchQuery||i.name||i.object].map(clean).filter(Boolean).join(' ');
 }
 function searchMaps(i){const q=terms(i);if(!q)return'';return `https://www.google.com/maps/search/?${new URLSearchParams({api:'1',query:q+' retailer'})}`}
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
   if(strong)strong.textContent='Search exact item near me';
   if(span)span.textContent='Search only — verify the exact product before travelling';
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

/* FINDIT CURRENT-UI CORE RESTORE
   Restores the useful old result experience on top of the current design:
   - exact identification
   - verified/catalogue offers when returned by the backend
   - retailer options such as Takealot, Makro and brand stores
   - nearby-store discovery without pretending generic stores have the item
   - directions only for exact, stock-verified branches */
(()=>{
 const $=s=>document.querySelector(s);
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const getState=()=>{try{return state}catch{return null}};
 const setText=(sel,text)=>{const el=$(sel);if(el)el.textContent=text??''};
 const show=(sel)=>$(sel)?.classList.remove('hidden');
 const hide=(sel)=>$(sel)?.classList.add('hidden');
 const validUrl=v=>{try{const u=new URL(v);return /^https?:$/.test(u.protocol)}catch{return false}};
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
  const actions=$('#freeActions');if(actions)actions.innerHTML='';
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
  setText('#nearbySummary',`${stores.length} nearby retailer${stores.length===1?'':'s'} found. Exact product availability is shown only when verified.`);
  el.innerHTML=stores.map((s,i)=>{
   const distance=Number.isFinite(Number(s.distanceKm))?`${Number(s.distanceKm).toFixed(1)} km`:'Distance unavailable';
   const d=exactDirections(s),m=mapsSearch(s);
   const exact=s.exactProductMatch===true&&s.stockVerified===true;
   const action=d?`<a href="${esc(d)}" target="_blank" rel="noopener noreferrer">Directions →</a>`:m?`<a href="${esc(m)}" target="_blank" rel="noopener noreferrer">Map</a>`:'';
   return `<article class="store-card" data-store="${i}"><div class="store-main"><strong>${esc(s.name||'Retailer')}</strong><small>${esc(distance+(s.address?' • '+s.address:''))}</small><div class="store-tags"><span>${exact?'Exact product verified':'Relevant retailer'}</span><span>${exact?'Branch stock verified':'Exact item not verified'}</span>${s.type?`<span>${esc(s.type)}</span>`:''}</div><div class="store-actions">${s.phone?`<a href="tel:${esc(s.phone)}">Call</a>`:''}${validUrl(s.website)?`<a href="${esc(s.website)}" target="_blank" rel="noopener noreferrer">Website</a>`:''}${action}</div></div></article>`;
  }).join('');
 }
 function sellerSearchUrl(domain,q){return `https://www.google.com/search?q=${encodeURIComponent(`site:${domain} "${q}"`)}`}
 function retailerCandidates(i){
  const q=String(i?.searchQuery||i?.name||i?.model||i?.object||'').trim();
  const brand=String(i?.brand||'').trim();
  const t=[i?.retailCategory,i?.category,i?.object,i?.name,i?.searchQuery].filter(Boolean).join(' ').toLowerCase();
  const list=[];
  const add=(name,url,note)=>{if(url&&!list.some(x=>x.name===name))list.push({name,url,note})};
  if(brand){
   const brandDomain=brand.toLowerCase()==='nike'?'nike.com/za':brand.toLowerCase()==='adidas'?'adidas.co.za':null;
   if(brandDomain)add(`${brand} official`,sellerSearchUrl(brandDomain,q),`Search ${brand}'s official catalogue`);
   add(`${brand} stores / factory`,`https://www.google.com/search?q=${encodeURIComponent(`${q} ${brand} factory store South Africa`)}`,'Search official or outlet locations');
  }
  add('Takealot',`https://www.takealot.com/all?q=${encodeURIComponent(q)}`,'Search the exact product on Takealot');
  add('Makro',sellerSearchUrl('makro.co.za',q),'Search Makro for this exact product');
  if(/shoe|sneaker|footwear|clothing|fashion|sport/.test(t)){
   add('Bash',sellerSearchUrl('bash.com',q),'Search Bash stores and brands');
   add('Superbalist',sellerSearchUrl('superbalist.com',q),'Search Superbalist');
   add('Sportsmans Warehouse',sellerSearchUrl('sportsmanswarehouse.co.za',q),'Search Sportsmans Warehouse');
   add('Totalsports',sellerSearchUrl('totalsports.co.za',q),'Search Totalsports');
  }
  if(/electronics|phone|computer|camera|headphone|speaker|gaming|appliance/.test(t)){
   add('Incredible Connection',sellerSearchUrl('incredible.co.za',q),'Search Incredible Connection');
   add('Game',sellerSearchUrl('game.co.za',q),'Search Game');
  }
  if(/tool|hardware|drill|garden|plumbing|electrical/.test(t)){
   add('Builders',sellerSearchUrl('builders.co.za',q),'Search Builders');
   add('Leroy Merlin',sellerSearchUrl('leroymerlin.co.za',q),'Search Leroy Merlin');
  }
  if(/medicine|pharmacy|skincare|beauty|makeup/.test(t)){
   add('Dis-Chem',sellerSearchUrl('dischem.co.za',q),'Search Dis-Chem');
   add('Clicks',sellerSearchUrl('clicks.co.za',q),'Search Clicks');
  }
  return list.slice(0,8);
 }
 function priceText(p){
  if(p?.price==null)return 'Price unavailable';
  try{return new Intl.NumberFormat('en-ZA',{style:'currency',currency:p.currency||'ZAR'}).format(Number(p.price))}catch{return `${p.currency||'ZAR'} ${p.price}`}
 }
 function renderWhereToBuy(i,offers=[]){
  const root=$('#freeActions');if(!root)return;
  const q=String(i?.searchQuery||i?.name||i?.object||'').trim();
  const exactOffers=(Array.isArray(offers)?offers:[]).filter(o=>o&&validUrl(o.url));
  const candidates=retailerCandidates(i);
  const offerHtml=exactOffers.length?`<div class="section-title-row"><div><p class="section-kicker">PRODUCT LISTINGS</p><h3>Retailer listings FindIt found</h3><p>Exact-product status is shown separately from price and stock.</p></div></div><div class="offer-list">${exactOffers.slice(0,8).map(o=>{
   const exact=o.exactProductMatch===true;
   const verifiedStock=o.stockVerified===true||o.stock?.verified===true;
   return `<article class="offer-card"><div><h4>${esc(o.name||q||'Product')}</h4><p>${esc(o.retailer||o.seller||'Retailer')}</p><p>${exact?'🎯 Exact product match':'🔎 Product listing'} • ${verifiedStock?'📦 Stock verified':'📦 Stock not verified'}</p><a href="${esc(o.url)}" target="_blank" rel="noopener noreferrer">Open retailer →</a></div><div class="price">${esc(priceText(o))}</div></article>`;
  }).join('')}</div>`:'';
  const candidateHtml=`<div class="section-title-row"><div><p class="section-kicker">WHERE TO BUY</p><h3>Search retailers for the exact item</h3><p>These buttons search the exact identified product. A retailer is not marked as having it until FindIt verifies the listing.</p></div></div><div class="free-action-grid">${candidates.map(r=>`<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">🛍️ <strong>${esc(r.name)}</strong><span>${esc(r.note)}</span></a>`).join('')}${q?`<a href="https://www.google.com/search?q=${encodeURIComponent(q+' buy South Africa')}" target="_blank" rel="noopener noreferrer">🎯 <strong>Exact web search</strong><span>Search the exact identified item</span></a>`:''}<button id="copyExactProduct" type="button">📋 <strong>Copy product name</strong><span>Copy the exact search query</span></button></div>`;
  root.innerHTML=offerHtml+candidateHtml;
  $('#copyExactProduct')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(q);status('✓ Product name copied.')}catch{status('Copy unavailable.',true)}});
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
 function wireBottomActions(){
  $('#saveFind')?.addEventListener('click',()=>{const s=getState(),i=s?.result?.identification;if(!i)return;try{const a=JSON.parse(localStorage.getItem('finditSaved')||'[]');a.unshift({name:i.name||i.object||'Item',query:i.searchQuery||'',savedAt:new Date().toISOString()});localStorage.setItem('finditSaved',JSON.stringify(a.slice(0,30)));status('✓ Saved.')}catch{}});
  $('#shareFind')?.addEventListener('click',async()=>{const i=getState()?.result?.identification||{};const text=`FindIt identified: ${i.name||i.object||i.searchQuery||'item'}`;try{if(navigator.share)await navigator.share({title:'FindIt Nearby',text,url:location.href});else await navigator.clipboard.writeText(text)}catch{}});
  $('#widenSearch')?.addEventListener('click',async()=>{const s=getState();if(!s?.coords||!s?.result?.identification)return;const sel=$('#radiusSelect');if(sel){const next=Math.min(25,Math.max(15,currentRadius()+5));sel.value=String(next);s.radius=next}await loadNearbyCompat(s.result.identification,s.coords)});
 }
 function install(){
  const btn=$('#search');if(!btn)return;
  wireBottomActions();
  btn.onclick=async e=>{
   e.preventDefault();
   const s=getState();if(!s?.file){status('Choose a photo first.',true);return}
   clearCurrentResults();btn.disabled=true;status('Identifying your item…');
   try{
    if(!s.coords){try{s.coords=await getLocation();const lb=$('#location');if(lb)lb.textContent='✓ Location ready'}catch{}}
    const fd=new FormData();fd.append('image',s.file);if(s.coords){fd.append('lat',s.coords.lat);fd.append('lon',s.coords.lon)}
    const r=await fetch('/api/search',{method:'POST',body:fd});const data=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(data.message||data.error||`Search failed (${r.status})`);
    s.result=data;s.offers=Array.isArray(data.offers)?data.offers:[];
    const i=data.identification||{};renderIdentification(i);renderWhereToBuy(i,s.offers);show('#results');
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
