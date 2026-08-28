from pathlib import Path
import re

p=Path('script.js')
s=p.read_text()

# 1) Exact branch search first; if no verified branch is returned, fall back to truthful nearby retailer discovery.
start=s.index("async function loadNearby(i,radius){")
end=s.index("function renderStores(){",start)
new_load=r'''async function loadNearby(i,radius){
  nearbyStores.innerHTML='<div class="empty-state">Finding the closest relevant retailers…</div>';
  try{
    const payload={lat:state.coords.lat,lon:state.coords.lon,identification:i,radiusKm:radius};
    let r=await fetch('/api/nearby',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    let d=await r.json();
    recordNearbyAnalyticsFromResponse(d,i);
    if(!r.ok||!d.ok)throw Error(d.error||'Nearby search failed');

    let rows=Array.isArray(d.stores)?d.stores:[];
    if(!rows.length){
      const c=new AbortController(),t=setTimeout(()=>c.abort(),9000);
      try{
        const rr=await fetch('/api/nearby',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...payload,mode:'likely'}),signal:c.signal});
        const dd=await rr.json();
        if(rr.ok&&dd.ok&&Array.isArray(dd.stores)){d=dd;rows=dd.stores;recordNearbyAnalyticsFromResponse(dd,i)}
      }finally{clearTimeout(t)}
    }

    state.stores=rows.map(x=>({
      ...x,
      exactProductMatch:x.exactProductMatch===true,
      stockVerified:x.stockVerified===true,
      branchStockVerified:x.branchStockVerified===true,
      branchPriceVerified:x.branchPriceVerified===true,
      directionsAvailable:x.directionsAvailable===true&&x.exactProductMatch===true&&(x.branchStockVerified===true||x.stockVerified===true)
    }));
    Object.assign(state.diagnostics,{nearbyStoreCount:state.stores.length,closestStoreDistanceKm:state.stores[0]?.distanceKm??null,nearbyRadiusKm:d.radiusKm??radius,nearbyRetailGroup:d.retailGroup??null,nearbyReliable:d.reliable!==false,lastSearchCompletedAt:new Date().toISOString()});
    renderStores();updateMap();
    if(!state.stores.length)showNothing(d.message||'No relevant nearby retailers found in this radius.');else nothingFound.classList.add('hidden');
    document.dispatchEvent(new CustomEvent('findit:nearby-updated',{detail:{stores:state.stores}}));
  }catch(e){
    state.diagnostics.lastError=String(e.message||e).slice(0,240);state.diagnostics.nearbyReliable=false;state.diagnostics.lastSearchCompletedAt=new Date().toISOString();trackFindIt('nearby_failed',{success:false});nearbyStores.innerHTML='<div class="empty-state">Nearby retailer search is temporarily unavailable.</div>';showNothing('Nearby retailer search could not return useful results.');
  }
}
'''
s=s[:start]+new_load+s[end:]

# 2) Render nearby stores safely. Only verified exact branch stock may unlock turn-by-turn directions.
start=s.index("function renderStores(){")
end=s.index("function ensureMap(){",start)
new_render=r'''function renderStores(){
  if(!state.stores.length){nearbyStores.innerHTML='';updatePremiumDashboard?.();return}
  if(premiumState.active&&premiumStoreSort!=="original")state.stores=sortedPremiumStores();
  nearbyStores.innerHTML=state.stores.map((s,i)=>{
    const canDirections=s.directionsAvailable===true&&s.exactProductMatch===true&&(s.branchStockVerified===true||s.stockVerified===true);
    const mapUrl=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.lat},${s.lon}`)}`;
    const directions=`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${s.lat},${s.lon}`)}`;
    const stockLabel=(s.branchStockVerified===true||s.stockVerified===true)?'Branch stock verified':'Branch stock not verified';
    return `<article class="store-card" data-store="${i}" data-exact-branch="${canDirections?'1':'0'}"><span class="store-rank">${i+1}</span><div class="store-main"><strong>${esc(s.name)}</strong><small>${esc(s.address||s.type||'Retailer')}</small><div class="store-tags"><span>${esc(s.type||'retail')}</span><span>Consumer retailer</span><span>${esc(stockLabel)}</span></div>${premiumState.active?`<label class="premium-compare-check"><input type="checkbox" data-compare-store="${i}" ${premiumCompareSelection.has(i)?"checked":""}> Compare</label>`:""}</div><div class="store-side"><div class="store-distance">${Number(s.distanceKm).toFixed(1)} km</div><div class="store-actions">${s.phone?`<a href="tel:${esc(s.phone)}">Call</a>`:''}${validUrl(s.website)?`<a href="${esc(s.website)}" target="_blank" rel="noopener noreferrer">Website</a>`:''}${canDirections?`<a href="${directions}" target="_blank" rel="noopener noreferrer">Directions</a>`:`<a href="${mapUrl}" target="_blank" rel="noopener noreferrer">Map</a>`}</div></div></article>`
  }).join('');
  $$('[data-store]').forEach(card=>card.onclick=e=>{if(e.target.closest('a'))return;selectStore(Number(card.dataset.store))});
  $$('[data-compare-store]').forEach(c=>c.onchange=e=>{e.stopPropagation();const i=Number(c.dataset.compareStore);if(c.checked)premiumCompareSelection.add(i);else premiumCompareSelection.delete(i);updatePremiumDashboard()});
  updatePremiumDashboard()
}
'''
s=s[:start]+new_render+s[end:]
p.write_text(s)

# 3) Fullscreen result UX: remove repeated empty cards and infer category from the visible identified title if app state arrives late.
p=Path('journey-results-fix.js')
s=p.read_text()
s=s.replace("$$('.fj-card,.fj-fix-note,.fj-price-helper',r).forEach(x=>x.remove())","$$('.fj-card,.fj-fix-note,.fj-price-helper,.fj-empty-help',r).forEach(x=>x.remove())")
s=s.replace("const s=[i?.object,i?.name,i?.model,i?.searchQuery].filter(Boolean).join(' ').toLowerCase();","const s=[i?.object,i?.name,i?.model,i?.searchQuery,$('#resultName')?.textContent||''].filter(Boolean).join(' ').toLowerCase();")
p.write_text(s)

p=Path('journey-results-v3-fix.js')
s=p.read_text()
needle="const cards=$$('.fj-card',r);if(cards.some(c=>!/no in-store price data yet/i.test(c.textContent||'')))return;"
if needle in s:
    s=s.replace(needle,"$$('.fj-empty-help',r).filter((x,n,a)=>n<a.length-1).forEach(x=>x.remove());const cards=$$('.fj-card',r);if(cards.some(c=>!/no in-store price data yet|no nearby branch data was returned yet/i.test(c.textContent||'')))return;")
listener="document.addEventListener('findit:results-rendered',()=>requestAnimationFrame(sync))"
if listener in s and "findit:nearby-updated" not in s:
    s=s.replace(listener,listener+";document.addEventListener('findit:nearby-updated',()=>requestAnimationFrame(sync))")
p.write_text(s)

# 4) Cache-bust updated browser code.
p=Path('index.html')
s=p.read_text()
for name in ['script.js','journey-results-fix.js','journey-results-v3-fix.js']:
    s=re.sub(rf'{re.escape(name)}(?:\?v=[^\"\']+)?',f'{name}?v=20260828-pipeline3',s)
p.write_text(s)
