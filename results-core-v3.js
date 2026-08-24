/* FindIt Results Core v3 — one search flow, no duplicate fetches, useful nearby fallback. */
(()=>{
  'use strict';
  if(window.__finditResultsCoreV3)return; window.__finditResultsCoreV3=true;
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clean=v=>String(v??'').trim();
  const validUrl=v=>{try{const u=new URL(v);return /^https?:$/.test(u.protocol)}catch{return false}};
  const S=()=>{try{return state}catch{return null}};
  const exactBranch=s=>Boolean(s&&s.exactProductMatch===true&&s.stockVerified===true&&Number.isFinite(Number(s.lat))&&Number.isFinite(Number(s.lon)));
  let running=false, runId=0;

  const status=(txt,bad=false)=>{const e=$('#status');if(e){e.textContent=txt;e.style.color=bad?'#ff9da7':''}};
  const radius=()=>{const n=Number(S()?.radius||$('#radiusSelect')?.value||10);return Number.isFinite(n)?n:10};
  const money=(n,c='ZAR')=>{if(n==null||!Number.isFinite(Number(n)))return 'Price not published';try{return new Intl.NumberFormat('en-ZA',{style:'currency',currency:c||'ZAR'}).format(Number(n))}catch{return `${c||'ZAR'} ${Number(n).toFixed(2)}`}};
  const stockText=v=>{const x=String(v||'').toLowerCase();if(x==='in_stock')return'In stock online';if(x==='out_of_stock')return'Out of stock online';if(x==='preorder')return'Pre-order';if(x==='backorder')return'Back-order';return'Stock not published'};
  const mapsUrl=s=>{const q=[s?.name,s?.address].filter(Boolean).join(' ');return q?`https://www.google.com/maps/search/?${new URLSearchParams({api:'1',query:q})}`:''};
  const directionsUrl=s=>exactBranch(s)?`https://www.google.com/maps/dir/?${new URLSearchParams({api:'1',destination:`${Number(s.lat)},${Number(s.lon)}`})}`:'';

  function getLocation(){return new Promise((resolve,reject)=>{
    if(!navigator.geolocation)return reject(new Error('Location unavailable'));
    navigator.geolocation.getCurrentPosition(p=>resolve({lat:p.coords.latitude,lon:p.coords.longitude}),reject,{enableHighAccuracy:true,timeout:10000,maximumAge:120000});
  })}

  function clearResults(){
    const s=S();if(s){s.result=null;s.offers=[];s.stores=[]}
    $('#exactSellerResults')?.remove();
    if($('#nearbyStores'))$('#nearbyStores').innerHTML='';
    if($('#resultMeta'))$('#resultMeta').innerHTML='';
    if($('#resultNote'))$('#resultNote').textContent='';
    $('#results')?.classList.add('hidden');
  }

  function renderIdentification(i){
    const conf=Math.max(0,Math.min(100,Math.round(Number(i?.confidence||0)*100)));
    if($('#resultName'))$('#resultName').textContent=i?.name||i?.model||i?.object||'Item identified';
    if($('#resultDescription'))$('#resultDescription').textContent=i?.summary||'FindIt analysed the uploaded image.';
    if($('#confidenceValue'))$('#confidenceValue').textContent=`${conf}%`;
    const meta=$('#resultMeta');
    if(meta){
      const visible=Array.isArray(i?.visibleText)?i.visibleText.slice(0,5).join(' • '):clean(i?.visibleText);
      const rows=[['Object',i?.object],['Brand',i?.brand],['Model',i?.model],['Category',i?.retailCategory||i?.category],['Search',i?.searchQuery],['Visible text',visible]].filter(([,v])=>v);
      meta.innerHTML=rows.map(([k,v])=>`<div class="analysis-card"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('');
    }
    const note=$('#resultNote');if(note){note.textContent=conf<55?'Try a clearer photo before trusting seller matches.':'';note.classList.toggle('error',conf<55)}
  }

  function ensureSellerRoot(){
    let root=$('#exactSellerResults');if(root)return root;
    root=document.createElement('section');root.id='exactSellerResults';root.className='exact-seller-results';
    const near=$('#nearbyPanel');if(near?.parentNode)near.parentNode.insertBefore(root,near);
    return root;
  }

  function normalizeOffer(o){
    if(!o)return null;
    const retailer=clean(o.retailer?.name||o.retailer||'Retailer');
    const url=clean(o.product_url||o.url);
    const title=clean(o.product_name||o.name||o.title);
    const score=Number(o.matchScore??o.match??0);
    const price=o.price==null?null:Number(o.price);
    return {retailer,url,title,score:Number.isFinite(score)?score:0,price:Number.isFinite(price)?price:null,currency:o.currency||'ZAR',availability:o.availability||o.stock?.status||null,verified:o.verified===true||o.listingType==='connected_feed'||o.source?.toLowerCase?.().includes('verified'),branchStockVerified:o.branchStockVerified===true};
  }

  function mergeOffers(...sets){
    const out=[],seen=new Set();
    for(const raw of sets.flat()){
      const o=normalizeOffer(raw);if(!o||!validUrl(o.url)||!o.title)continue;
      if(o.score&&o.score<.58)continue;
      const key=(o.retailer+'|'+o.title+'|'+o.url).toLowerCase();if(seen.has(key))continue;seen.add(key);out.push(o);
    }
    return out.sort((a,b)=>(Number(b.verified)-Number(a.verified))||(b.score-a.score)||((a.price??1e15)-(b.price??1e15))).slice(0,8);
  }

  function retailerLinks(d,i){
    const q=clean(i?.searchQuery||i?.name||i?.model||i?.object);
    const rows=Array.isArray(d?.webRetailers)?d.webRetailers:[];
    const chosen=[];
    for(const x of rows){if(validUrl(x.searchUrl)&&!chosen.some(y=>y.name===x.name))chosen.push({name:x.name,url:x.searchUrl})}
    const brand=clean(i?.brand).toLowerCase();
    if(brand==='nike'&&!chosen.some(x=>/nike/i.test(x.name)))chosen.unshift({name:'Nike official',url:`https://www.google.com/search?q=${encodeURIComponent(`site:nike.com/za "${q}"`)}`});
    return chosen.slice(0,4);
  }

  function renderSellers(primary,secondary,i){
    window.productIntelligence=primary||secondary||null;
    const root=ensureSellerRoot();if(!root)return;
    const offers=mergeOffers(primary?.offers||[],secondary?.offers||[]);
    const priced=offers.filter(o=>o.price!=null).sort((a,b)=>a.price-b.price);
    const links=retailerLinks(primary||secondary||{},i);
    const best=priced[0];
    if(offers.length){
      root.innerHTML=`<div class="section-title-row"><div><p class="section-kicker">WHERE TO BUY</p><h3>${offers.length} strong online match${offers.length===1?'':'es'}</h3><p>Prices and stock below are online listing data. Physical branch stock is shown separately only when verified.</p></div></div>${best?`<div class="result-note"><strong>Best published price: ${esc(money(best.price,best.currency))}</strong> • ${esc(best.retailer)}</div>`:''}<div class="offer-list">${offers.map(o=>`<article class="offer-card"><div><h4>${esc(o.title)}</h4><p>${esc(o.retailer)}</p><p>${o.verified?'✓ Strong product-page match':'Strong product match'} • ${esc(stockText(o.availability))}${o.branchStockVerified?' • ✓ Branch stock verified':''}</p><a href="${esc(o.url)}" target="_blank" rel="noopener noreferrer">View retailer →</a></div><div class="price">${esc(money(o.price,o.currency))}</div></article>`).join('')}</div>`;
    }else{
      root.innerHTML=`<div class="section-title-row"><div><p class="section-kicker">WHERE TO BUY</p><h3>No live product listing verified automatically</h3><p>FindIt identified the item, but it did not get trustworthy current price/stock data from a retailer feed or product page. It will not invent it.</p></div></div>${links.length?`<div class="free-action-grid">${links.map(x=>`<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">🛍️ <strong>${esc(x.name)}</strong><span>Search this exact product</span></a>`).join('')}</div>`:''}`;
    }
    const s=S();if(s)s.offers=offers;
  }

  function renderStores(list,verified){
    const el=$('#nearbyStores'),head=$('#nearbyPanel h3');if(!el)return;
    const stores=(Array.isArray(list)?list:[]).slice(0,8);
    if(head)head.textContent=verified?'Verified nearby sellers':'Likely nearby retailers';
    if($('#nearbySummary'))$('#nearbySummary').textContent=verified?'These branches have the exact item and branch stock verified.':'These are real nearby stores for this product type. Exact item stock is not verified, so FindIt does not tell you to drive there.';
    if(!stores.length){el.innerHTML='<div class="empty-state">No relevant nearby retailer found inside this radius.</div>';return}
    el.innerHTML=stores.map((s,i)=>{
      const exact=exactBranch(s),dist=Number.isFinite(Number(s.distanceKm))?`${Number(s.distanceKm).toFixed(1)} km`:'Distance unavailable';
      const map=mapsUrl(s),dir=directionsUrl(s),phone=clean(s.phone);
      return `<article class="store-card" data-store="${i}" data-exact-branch="${exact?'1':'0'}"><div class="store-main"><strong>${esc(s.name||'Retailer')}</strong><small>${esc(dist+(s.address?' • '+s.address:''))}</small><div class="store-tags"><span>${exact?'✓ Exact item':'Likely retailer'}</span><span>${exact?'✓ Branch stock verified':'Stock not verified'}</span></div><div class="store-actions">${validUrl(s.website)?`<a href="${esc(s.website)}" target="_blank" rel="noopener noreferrer">Website</a>`:''}${phone?`<a href="tel:${esc(phone.replace(/[^+0-9]/g,''))}">Call</a>`:''}${map?`<a href="${esc(map)}" target="_blank" rel="noopener noreferrer">View map</a>`:''}${dir?`<a class="exact-directions" href="${esc(dir)}" target="_blank" rel="noopener noreferrer">Directions →</a>`:''}</div></div></article>`;
    }).join('');
    const st=S();if(st)st.stores=stores;
  }

  async function postJson(url,body,timeout=16000){
    const ctrl=new AbortController(),t=setTimeout(()=>ctrl.abort(),timeout);
    try{const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:ctrl.signal});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||`${url} failed`);return d}finally{clearTimeout(t)}
  }

  async function loadCommerce(i,id){
    const body={query:i?.searchQuery||i?.name||i?.object||'',name:i?.name||i?.object||'',object:i?.object||'',brand:i?.brand||'',model:i?.model||'',category:i?.category||'',retailCategory:i?.retailCategory||''};
    const root=ensureSellerRoot();if(root)root.innerHTML='<div class="empty-state">Checking current product listings, prices and stock…</div>';
    const [a,b]=await Promise.allSettled([postJson('/api/product-intelligence-v2',body,18000),postJson('/api/product-intelligence',body,12000)]);
    if(id!==runId)return;
    renderSellers(a.status==='fulfilled'?a.value:null,b.status==='fulfilled'?b.value:null,i);
  }

  async function loadNearby(i,coords,id){
    if(!coords){renderStores([],false);if($('#nearbySummary'))$('#nearbySummary').textContent='Allow location to see nearby retailers.';return}
    const body={lat:coords.lat,lon:coords.lon,identification:i,radiusKm:radius()};
    if($('#nearbyStores'))$('#nearbyStores').innerHTML='<div class="empty-state">Finding nearby stores…</div>';
    try{
      const exact=await postJson('/api/nearby',body,13000);if(id!==runId)return;
      if(Array.isArray(exact.stores)&&exact.stores.length){renderStores(exact.stores,true);return}
      const likely=await postJson('/api/nearby',{...body,mode:'likely'},13000);if(id!==runId)return;
      renderStores(likely.stores||[],false);
    }catch(e){if(id===runId){renderStores([],false);if($('#nearbySummary'))$('#nearbySummary').textContent='Nearby lookup is temporarily unavailable.'}}
  }

  function saveRecent(i){try{const key='finditRecent',q=clean(i?.searchQuery||i?.name||i?.object);let a=JSON.parse(localStorage.getItem(key)||'[]');a=[{id:Date.now(),name:i?.name||i?.object||'Item',brand:i?.brand||'',query:q,date:new Date().toISOString()},...a.filter(x=>x.query!==q)].slice(0,20);localStorage.setItem(key,JSON.stringify(a))}catch{}}

  async function runSearch(e){
    const target=e.target?.closest?.('#search');if(!target)return;
    e.preventDefault();e.stopImmediatePropagation();
    if(running)return;
    const s=S();if(!s?.file){status('Choose a photo first.',true);return}
    running=true;const id=++runId;target.disabled=true;clearResults();status('Identifying the item…');
    try{
      if(!s.coords){try{s.coords=await getLocation();if($('#location'))$('#location').textContent='✓ Location ready'}catch{}}
      const fd=new FormData();fd.append('image',s.file);if(s.coords){fd.append('lat',s.coords.lat);fd.append('lon',s.coords.lon)}
      const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),25000);
      let r,data;try{r=await fetch('/api/search',{method:'POST',body:fd,signal:ctrl.signal});data=await r.json().catch(()=>({}))}finally{clearTimeout(timer)}
      if(!r.ok)throw new Error(data.message||data.error||`Search failed (${r.status})`);
      if(id!==runId)return;
      s.result=data;const i=data.identification||{};renderIdentification(i);$('#results')?.classList.remove('hidden');
      if(data.blocked){if($('#resultNote'))$('#resultNote').textContent=data.message||'This product cannot be searched.';status('Search complete.');return}
      if(Number(i.confidence||0)<.55){renderStores([],false);status('Try a clearer photo.',true);return}
      status('Item identified. Checking sellers and nearby stores…');
      await Promise.allSettled([loadCommerce(i,id),loadNearby(i,s.coords,id)]);
      if(id!==runId)return;
      saveRecent(i);status('Search complete.');$('#results')?.scrollIntoView({behavior:'smooth',block:'start'});
      document.dispatchEvent(new CustomEvent('findit:results-rendered'));
    }catch(err){if(id===runId){$('#results')?.classList.remove('hidden');if($('#resultNote')){$('#resultNote').textContent=`Search error: ${err.name==='AbortError'?'The request took too long. Please try again.':err.message}`;$('#resultNote').classList.add('error')}status('Search failed. Please try again.',true)}}
    finally{if(id===runId){running=false;target.disabled=!S()?.file}}
  }

  document.addEventListener('click',runSearch,true);
})();
