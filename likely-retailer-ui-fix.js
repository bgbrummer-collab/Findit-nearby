(()=>{
 function esc2(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
 function valid2(v){try{const u=new URL(v);return /^https?:$/.test(u.protocol)}catch{return false}}
 function paint(){
  if(typeof state==='undefined'||typeof nearbyStores==='undefined')return;
  if(!Array.isArray(state.stores)||!state.stores.length)return;
  nearbyStores.innerHTML=state.stores.map((s,i)=>{
   const directions=`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${s.lat},${s.lon}`)}`;
   const exact=Boolean(s.exactProductMatch&&s.stockVerified);
   const badge=exact?'✓ Exact product verified':'Likely retailer';
   const stock=exact?(s.stockStatus||'Stock verified'):'Exact item & stock not verified';
   const source=exact?'Connected retailer data':(s.source||'Nearby map data');
   return `<article class="store-card ${exact?'verified-store':'likely-store'}" data-store="${i}"><span class="store-rank">${i+1}</span><div class="store-main"><strong>${esc2(s.name)}</strong><small>${esc2(s.address||s.type||'Retailer')}</small><div class="store-tags"><span>${esc2(badge)}</span><span>${esc2(stock)}</span><span>${esc2(source)}</span></div>${typeof premiumState!=='undefined'&&premiumState.active?`<label class="premium-compare-check"><input type="checkbox" data-compare-store="${i}" ${typeof premiumCompareSelection!=='undefined'&&premiumCompareSelection.has(i)?'checked':''}> Compare</label>`:''}</div><div class="store-side"><div class="store-distance">${Number(s.distanceKm).toFixed(1)} km</div><div class="store-actions">${s.phone?`<a href="tel:${esc2(s.phone)}">Call</a>`:''}${valid2(s.website)?`<a href="${esc2(s.website)}" target="_blank" rel="noopener noreferrer">Website</a>`:''}<a href="${directions}" target="_blank" rel="noopener noreferrer">Directions</a></div></div></article>`
  }).join('');
  document.querySelectorAll('[data-store]').forEach(card=>card.onclick=e=>{if(e.target.closest('a,input,label'))return;try{selectStore(Number(card.dataset.store))}catch{}});
  document.querySelectorAll('[data-compare-store]').forEach(c=>c.onchange=e=>{e.stopPropagation();try{const i=Number(c.dataset.compareStore);if(c.checked)premiumCompareSelection.add(i);else premiumCompareSelection.delete(i);updatePremiumDashboard?.()}catch{}});
 }
 function install(){
  try{
   const original=window.renderStores;
   window.renderStores=function(){
    try{if(typeof original==='function')original()}catch{}
    try{paint()}catch(e){console.warn('FindIt retailer-label paint failed',e)}
   };
   if(typeof renderStores!=='undefined')renderStores=window.renderStores;
  }catch{}
 }
 install();
})();