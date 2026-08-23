/* FindIt exact-product commerce core.
   Truth rule: a nearby shop is NOT an exact-product result unless the product
   and that branch's stock are verified. Generic nearby stores never get a
   Directions button. Exact retailer listings are loaded separately. */
(()=>{
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clean=v=>String(v??'').trim();
  const validUrl=v=>{try{const u=new URL(v);return /^https?:$/.test(u.protocol)}catch{return false}};
  const S=()=>{try{return state}catch{return null}};
  const exactBranch=s=>Boolean(s&&s.exactProductMatch===true&&s.stockVerified===true&&Number.isFinite(Number(s.lat))&&Number.isFinite(Number(s.lon)));
  const setText=(sel,v)=>{const e=$(sel);if(e)e.textContent=v??''};
  const show=sel=>$(sel)?.classList.remove('hidden');
  const hide=sel=>$(sel)?.classList.add('hidden');

  function status(v,bad=false){const e=$('#status');if(!e)return;e.textContent=v;e.style.color=bad?'#ff9da7':''}
  function radius(){const s=S();const n=Number(s?.radius||$('#radiusSelect')?.value||10);return Number.isFinite(n)?n:10}
  function getLocation(){return new Promise((resolve,reject)=>{
    if(!navigator.geolocation)return reject(new Error('Location unavailable'));
    navigator.geolocation.getCurrentPosition(p=>resolve({lat:p.coords.latitude,lon:p.coords.longitude}),reject,{enableHighAccuracy:true,timeout:12000,maximumAge:120000});
  })}
  function money(n,c='ZAR'){if(n==null||!Number.isFinite(Number(n)))return'Price not published';try{return new Intl.NumberFormat('en-ZA',{style:'currency',currency:c||'ZAR'}).format(Number(n))}catch{return`${c||'ZAR'} ${Number(n).toFixed(2)}`}}
  function stockText(v){const x=String(v||'').toLowerCase();if(x==='in_stock')return'Available online';if(x==='out_of_stock')return'Out of stock online';if(x==='preorder')return'Pre-order';return'Online stock not published'}
  function siteSearch(domain,q){return `https://www.google.com/search?q=${encodeURIComponent(`site:${domain} "${q}"`)}`}

  function renderIdentification(i){
    const conf=Math.max(0,Math.min(100,Math.round(Number(i?.confidence||0)*100)));
    setText('#resultName',i?.name||i?.model||i?.object||'Item identified');
    setText('#resultDescription',i?.summary||'FindIt analysed the uploaded image.');
    setText('#confidenceValue',`${conf}%`);
    const meta=$('#resultMeta');
    if(meta){
      const visible=Array.isArray(i?.visibleText)?i.visibleText.slice(0,5).join(' • '):clean(i?.visibleText);
      const rows=[['Object',i?.object],['Brand',i?.brand],['Model',i?.model],['Category',i?.retailCategory||i?.category],['Search',i?.searchQuery],['Visible text',visible]].filter(([,v])=>v);
      meta.innerHTML=rows.map(([k,v])=>`<div class="analysis-card"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('');
    }
    const note=$('#resultNote');if(note){note.textContent=conf<55?'FindIt is not confident enough to search sellers safely. Try a clearer photo.':'';note.classList.toggle('error',conf<55)}
  }

  function mapsUrl(s){const q=[s?.name,s?.address].filter(Boolean).join(' ');return q?`https://www.google.com/maps/search/?${new URLSearchParams({api:'1',query:q})}`:''}
  function directionsUrl(s){return exactBranch(s)?`https://www.google.com/maps/dir/?${new URLSearchParams({api:'1',destination:`${Number(s.lat)},${Number(s.lon)}`})}`:''}

  function renderStores(list,message=''){
    const el=$('#nearbyStores');if(!el)return;
    const head=$('#nearbyPanel h3');if(head)head.textContent='Nearby stores for this product type';
    if(!list.length){el.innerHTML=`<div class="empty-state">${esc(message||'No relevant nearby stores found.')}</div>`;setText('#nearbySummary',message||'No nearby results yet.');return}
    setText('#nearbySummary','These stores are nearby and relevant to the product type. The exact product is not claimed unless branch stock is verified.');
    el.innerHTML=list.map((s,i)=>{
      const exact=exactBranch(s),dist=Number.isFinite(Number(s.distanceKm))?`${Number(s.distanceKm).toFixed(1)} km`:'Distance unavailable';
      const map=mapsUrl(s),dir=directionsUrl(s);
      return `<article class="store-card" data-store="${i}" data-exact-branch="${exact?'1':'0'}"><div class="store-main"><strong>${esc(s.name||'Retailer')}</strong><small>${esc(dist+(s.address?' • '+s.address:''))}</small><div class="store-tags"><span>${exact?'✓ Exact product verified':'Relevant retailer'}</span><span>${exact?'✓ Branch stock verified':'Exact item not verified'}</span>${s.type?`<span>${esc(s.type)}</span>`:''}</div><div class="store-actions">${validUrl(s.website)?`<a href="${esc(s.website)}" target="_blank" rel="noopener noreferrer">Website</a>`:''}${map?`<a href="${esc(map)}" target="_blank" rel="noopener noreferrer">Map</a>`:''}${dir?`<a class="exact-directions" href="${esc(dir)}" target="_blank" rel="noopener noreferrer">Directions →</a>`:''}</div></div></article>`;
    }).join('');
  }

  function fallbackRetailers(i){
    const q=clean(i?.searchQuery||i?.name||i?.model||i?.object);const t=[i?.category,i?.retailCategory,i?.object,i?.name].filter(Boolean).join(' ').toLowerCase();const out=[];
    const add=(name,domain,note)=>{if(!q||out.some(x=>x.name===name))return;out.push({name,url:siteSearch(domain,q),note})};
    add('Takealot','takealot.com','Search Takealot for this exact item');add('Makro','makro.co.za','Search Makro for this exact item');
    if(/grocery|household|toilet|paper|food|drink|supermarket|cleaning/.test(t)){add('Checkers','checkers.co.za','Search Checkers for the exact product');add('Pick n Pay','pnp.co.za','Search Pick n Pay for the exact product');add('Woolworths','woolworths.co.za','Search Woolworths for the exact product');add('Shoprite','shoprite.co.za','Search Shoprite for the exact product')}
    if(/shoe|sneaker|footwear|clothing|fashion|sport/.test(t)){add('Bash','bash.com','Search Bash for the exact product');add('Superbalist','superbalist.com','Search Superbalist');add('Totalsports','totalsports.co.za','Search Totalsports');add('Sportsmans Warehouse','sportsmanswarehouse.co.za','Search Sportsmans Warehouse')}
    if(/electronics|phone|computer|camera|headphone|speaker|gaming|appliance/.test(t)){add('Incredible Connection','incredible.co.za','Search Incredible Connection');add('Game','game.co.za','Search Game')}
    if(/beauty|cosmetic|skincare|pharmacy|health/.test(t)){add('Clicks','clicks.co.za','Search Clicks');add('Dis-Chem','dischem.co.za','Search Dis-Chem')}
    if(/hardware|tool|garden|plumbing|electrical/.test(t)){add('Builders','builders.co.za','Search Builders');add('Leroy Merlin','leroymerlin.co.za','Search Leroy Merlin')}
    const brand=clean(i?.brand);if(brand){const b=brand.toLowerCase();if(b==='nike')out.unshift({name:'Nike official',url:siteSearch('nike.com/za',q),note:'Search Nike South Africa'});if(b==='adidas')out.unshift({name:'adidas official',url:siteSearch('adidas.co.za',q),note:'Search adidas South Africa'})}
    return out.slice(0,10);
  }

  function ensureSellerSection(){
    let root=$('#exactSellerResults');if(root)return root;
    root=document.createElement('section');root.id='exactSellerResults';root.className='exact-seller-results';
    const near=$('#nearbyPanel');if(near?.parentNode)near.parentNode.insertBefore(root,near);else $('#freeActions')?.appendChild(root);
    return root;
  }

  function renderSellerIntelligence(d,i){
    window.productIntelligence=d;
    const root=ensureSellerSection();if(!root)return;
    const offers=(Array.isArray(d?.offers)?d.offers:[]).filter(o=>o&&o.verified===true&&Number(o.matchScore||0)>=.68&&validUrl(o.product_url));
    const sellers=new Set(offers.map(o=>clean(o.retailer?.name)).filter(Boolean));
    const best=offers.filter(o=>o.price!=null).sort((a,b)=>Number(a.price)-Number(b.price))[0];
    const q=clean(d?.normalizedQuery||i?.searchQuery||i?.name||i?.object);
    const searches=(Array.isArray(d?.webRetailers)?d.webRetailers:[]).filter(x=>validUrl(x.searchUrl));
    const fall=fallbackRetailers(i);const links=[...searches.map(x=>({name:x.name,url:x.searchUrl,note:'Search retailer for the exact item'})),...fall];
    const unique=[...new Map(links.map(x=>[x.name,x])).values()].slice(0,10);
    root.innerHTML=`<div class="section-title-row"><div><p class="section-kicker">EXACT PRODUCT SELLERS</p><h3>${offers.length?'Retailer listings found for this exact/strong product match':'No exact seller verified yet'}</h3><p>${offers.length?'These are product-page matches. Branch stock and directions stay separate until a physical branch is verified.':'FindIt has not proved that a retailer has this exact item yet. Use the exact-product searches below.'}</p></div></div><div class="premium-insights"><article><span>✓</span><div><b>${sellers.size}</b><small>Verified sellers</small></div></article><article><span>▥</span><div><b>${offers.length}</b><small>Verified listings</small></div></article><article><span>R</span><div><b>${best?esc(money(best.price,best.currency||'ZAR')):'Not available'}</b><small>Best published price</small></div></article><article><span>◎</span><div><b>${radius()} km</b><small>Nearby radius</small></div></article></div>${offers.length?`<div class="offer-list">${offers.map(o=>`<article class="offer-card"><div><h4>${esc(o.product_name||q||'Product')}</h4><p>${esc(o.retailer?.name||'Retailer')}</p><p>✓ Product listing verified • ${esc(stockText(o.availability))}${o.branchStockVerified?' • ✓ Branch stock verified':' • Branch stock not verified'}</p><a href="${esc(o.product_url)}" target="_blank" rel="noopener noreferrer">View exact listing →</a></div><div class="price">${esc(money(o.price,o.currency||'ZAR'))}</div></article>`).join('')}</div>`:''}<div class="section-title-row"><div><p class="section-kicker">SEARCH MORE RETAILERS</p><p>These are exact-product searches, not claims that the retailer has stock.</p></div></div><div class="free-action-grid">${unique.map(x=>`<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">🛍️ <strong>${esc(x.name)}</strong><span>${esc(x.note||'Search exact product')}</span></a>`).join('')}${q?`<a href="https://www.google.com/search?q=${encodeURIComponent(q+' buy South Africa')}" target="_blank" rel="noopener noreferrer">🎯 <strong>Exact web search</strong><span>Search the exact identified product</span></a>`:''}</div>`;
  }

  async function loadSellerIntelligence(i){
    const root=ensureSellerSection();if(root)root.innerHTML='<div class="empty-state">Checking exact retailer product pages, prices and online availability…</div>';
    try{
      const r=await fetch('/api/product-intelligence-v2',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query:i?.searchQuery||i?.name||i?.object||'',name:i?.name||i?.object||'',object:i?.object||'',brand:i?.brand||'',model:i?.model||'',category:i?.category||'',retailCategory:i?.retailCategory||''})});
      const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Exact retailer lookup failed');renderSellerIntelligence(d,i);const s=S();if(s)s.offers=Array.isArray(d.offers)?d.offers:[];
    }catch(e){if(root)root.innerHTML=`<div class="empty-state"><strong>Exact retailer lookup is temporarily unavailable.</strong><p>${esc(e.message)}. FindIt will not guess that a store has the item.</p></div>`}
  }

  async function loadNearby(i,coords){
    const el=$('#nearbyStores');if(el)el.innerHTML='<div class="empty-state">Finding nearby relevant stores…</div>';
    try{const r=await fetch('/api/nearby',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({lat:coords.lat,lon:coords.lon,identification:i,radiusKm:radius()})});const d=await r.json().catch(()=>({}));if(!r.ok||d.ok===false)throw new Error(d.error||'Nearby lookup failed');const list=Array.isArray(d.stores)?d.stores:[];const s=S();if(s)s.stores=list;renderStores(list,d.message||'')}
    catch(e){renderStores([],`Nearby lookup unavailable: ${e.message}`)}
  }

  function hardenDirections(){
    const list=Array.isArray(S()?.stores)?S().stores:[];
    document.querySelectorAll('#nearbyStores [data-store],#nearbyStores .store-card,#nearbyStores article').forEach(card=>{
      const idx=Number(card.dataset?.store);const st=Number.isInteger(idx)?list[idx]:null;const allowed=exactBranch(st)||card.dataset?.exactBranch==='1';
      card.querySelectorAll('a,button').forEach(x=>{if(!/direction/i.test(x.textContent||''))return;if(!allowed){x.style.display='none';x.removeAttribute?.('href')}});
    });
    document.querySelectorAll('#nearbyStores a,#nearbyStores button').forEach(x=>{if(/direction/i.test(x.textContent||'')&&x.closest('[data-exact-branch="1"]')==null)x.style.display='none'});
  }

  function clearResults(){const s=S();if(s){s.result=null;s.offers=[];s.stores=[]}setText('#resultName','Item');setText('#resultDescription','');setText('#confidenceValue','—');if($('#resultMeta'))$('#resultMeta').innerHTML='';if($('#resultNote'))$('#resultNote').innerHTML='';if($('#freeActions'))$('#freeActions').innerHTML='';$('#exactSellerResults')?.remove();if($('#nearbyStores'))$('#nearbyStores').innerHTML='';hide('#results')}
  function saveRecent(i){try{const key='finditRecent';let a=JSON.parse(localStorage.getItem(key)||'[]');const q=clean(i?.searchQuery||i?.name||i?.object);a=[{id:Date.now(),name:i?.name||i?.object||'Item',brand:i?.brand||'',query:q,date:new Date().toISOString()},...a.filter(x=>x.query!==q)].slice(0,20);localStorage.setItem(key,JSON.stringify(a))}catch{}}

  function install(){
    const btn=$('#search');if(btn){btn.onclick=async e=>{
      e.preventDefault();const s=S();if(!s?.file){status('Choose a photo first.',true);return}clearResults();btn.disabled=true;status('Identifying the exact item…');
      try{
        if(!s.coords){try{s.coords=await getLocation();if($('#location'))$('#location').textContent='✓ Location ready'}catch{}}
        const fd=new FormData();fd.append('image',s.file);if(s.coords){fd.append('lat',s.coords.lat);fd.append('lon',s.coords.lon)}
        const r=await fetch('/api/search',{method:'POST',body:fd});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.message||data.error||`Search failed (${r.status})`);
        s.result=data;const i=data.identification||{};renderIdentification(i);show('#results');
        if(data.blocked){if($('#resultNote')){$('#resultNote').textContent=data.message||'This product cannot be searched.';$('#resultNote').classList.add('error')}}
        if(!data.blocked&&Number(i.confidence||0)>=.55){status('Item identified. Checking exact sellers…');const jobs=[loadSellerIntelligence(i)];if(s.coords)jobs.push(loadNearby(i,s.coords));else renderStores([],'Allow location to see nearby stores.');await Promise.allSettled(jobs)}else renderStores([],'Try a clearer photo before searching sellers.');
        saveRecent(i);status('Search complete.');$('#results')?.scrollIntoView({behavior:'smooth',block:'start'});document.dispatchEvent(new CustomEvent('findit:results-rendered'));setTimeout(hardenDirections,50);
      }catch(err){show('#results');if($('#resultNote')){$('#resultNote').textContent=`Search error: ${err.message}`;$('#resultNote').classList.add('error')}status('Search failed. Please try again.',true)}finally{btn.disabled=!S()?.file}
    }}
    document.addEventListener('click',e=>{const x=e.target.closest?.('#nearbyStores a,#nearbyStores button');if(!x||!/direction/i.test(x.textContent||''))return;const card=x.closest('[data-store]');const st=card?S()?.stores?.[Number(card.dataset.store)]:null;if(!exactBranch(st)){e.preventDefault();e.stopImmediatePropagation()}},true);
    document.addEventListener('findit:results-rendered',()=>{const i=S()?.result?.identification;if(i&&!window.productIntelligence)loadSellerIntelligence(i);setTimeout(hardenDirections,0)});
    new MutationObserver(()=>hardenDirections()).observe(document.body,{childList:true,subtree:true});
    hardenDirections();setTimeout(hardenDirections,500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();


/* CURRENT MAP VIEW BRIDGE — current UI uses #map directly. */
(()=>{
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('#mapViewBtn');if(!b)return;
    const map=document.getElementById('map');if(!map)return;
    e.preventDefault();
    map.classList.toggle('hidden');
    if(!map.classList.contains('hidden')){
      Promise.resolve(window.finditLoadLeaflet?.()).then(()=>{try{if(typeof ensureMap==='function')ensureMap();if(typeof updateMap==='function')updateMap();setTimeout(()=>window.state?.map?.invalidateSize?.(),120)}catch{}});
      b.textContent='Hide map';
    }else b.textContent='Map view';
  },true);
})();
