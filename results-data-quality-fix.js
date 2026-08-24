(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>String(v??'').trim();
const BLOCKED=/\b(firearm|gun|rifle|pistol|ammunition|ammo|weapon|knife|knives|machete|sword|switchblade|taser|stun gun|pepper spray|mace|brass knuckles|fireworks|explosive|vape|nicotine|cigarette|cigar|alcohol|beer|wine|liquor|cannabis|marijuana|thc|cbd|psilocybin|magic mushroom|gambling|sports betting|casino|betting|pornography|adult sex toy)\b/i;
const trustedPrice=o=>/structured product data|connected retailer feed/i.test(clean(o?.source))&&Number.isFinite(Number(o?.price));
const priceKey=o=>clean(o?.product_url||`${o?.retailer?.name}|${o?.product_name}`);
function stablePrice(o){
  if(!trustedPrice(o))return null;
  const key=priceKey(o);if(!key)return null;
  const now=Date.now(),ttl=12*60*60*1000,k='findit_verified_price_history_v1';
  let all={};try{all=JSON.parse(localStorage.getItem(k)||'{}')||{}}catch{}
  const old=all[key];const current=Number(o.price);
  if(old&&Number.isFinite(Number(old.price))&&now-Number(old.at||0)<ttl&&Number(old.price)!==current){
    all[key]={price:current,at:now,changedFrom:Number(old.price)};try{localStorage.setItem(k,JSON.stringify(all))}catch{}
    return {changed:true,price:current,old:Number(old.price)};
  }
  all[key]={price:current,at:now};try{localStorage.setItem(k,JSON.stringify(all))}catch{}
  return {changed:false,price:current};
}
function formatMoney(n,c='ZAR'){try{return new Intl.NumberFormat('en-ZA',{style:'currency',currency:c||'ZAR'}).format(Number(n))}catch{return`${c||'ZAR'} ${Number(n).toFixed(2)}`}}
function repairOfferPrices(){
  const intel=window.productIntelligence;if(!intel||!Array.isArray(intel.offers))return;
  const cards=[...document.querySelectorAll('#exactSellerResults .offer-card')];
  const offers=intel.offers.filter(o=>o&&o.verified===true&&Number(o.matchScore||0)>=.68&&o.product_url);
  cards.forEach((card,i)=>{
    const o=offers[i];if(!o)return;const p=$('.price',card);if(!p)return;
    const sp=stablePrice(o);
    if(!sp){p.textContent='Price not verified';p.title='FindIt could not verify an exact-product price from trusted retailer data.';return}
    if(sp.changed){p.textContent='Price changed — verify retailer';p.title=`This retailer source returned ${formatMoney(sp.old,o.currency)} earlier and ${formatMoney(sp.price,o.currency)} now, so FindIt is not presenting either as a stable price.`;return}
    p.textContent=formatMoney(sp.price,o.currency||'ZAR');p.title='Verified from exact structured retailer data or a connected retailer feed.';
  });
  const insight=[...document.querySelectorAll('#exactSellerResults .premium-insights article')].find(x=>/best published price/i.test(x.textContent||''));
  if(insight){const good=offers.map(o=>({o,sp:stablePrice(o)})).filter(x=>x.sp&&!x.sp.changed).sort((a,b)=>a.sp.price-b.sp.price)[0];const b=$('b',insight);if(b)b.textContent=good?formatMoney(good.sp.price,good.o.currency||'ZAR'):'Not verified';}
}
function getState(){try{return state}catch{return null}}
function idText(i={}){return [i.category,i.retailCategory,i.object,i.name,i.searchQuery,i.brand,i.model].filter(Boolean).join(' ')}
let nearbyBusy=false,lastNearbyKey='';
async function fillNearbyFallback(){
  const s=getState(),i=s?.result?.identification||{};if(!s?.coords||!i||BLOCKED.test(idText(i)))return;
  const exact=Array.isArray(s?.stores)?s.stores.filter(x=>x?.exactProductMatch===true&&x?.stockVerified===true):[];if(exact.length)return;
  const el=$('#nearbyStores'),panel=$('#nearbyPanel');if(!el||!panel)return;
  const q=clean(i.searchQuery||i.name||i.object),radius=Number(s.radius||$('#radiusSelect')?.value||10),key=`${q}|${s.coords.lat.toFixed?.(3)||s.coords.lat}|${s.coords.lon.toFixed?.(3)||s.coords.lon}|${radius}`;
  if(nearbyBusy||lastNearbyKey===key&&el.dataset.finditFallback==='1')return;nearbyBusy=true;
  try{
    const r=await fetch('/api/nearby',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({lat:s.coords.lat,lon:s.coords.lon,identification:i,radiusKm:radius,mode:'likely'})});
    const d=await r.json().catch(()=>({}));const rows=Array.isArray(d.stores)?d.stores:[];
    const h=$('#nearbyPanel h3');if(h)h.textContent=rows.length?'Possible nearby retailers':'No nearby retailer match yet';
    const sum=$('#nearbySummary');if(sum)sum.textContent=rows.length?'These stores are relevant to the product type and close to you. Exact product stock is NOT verified, so FindIt will not suggest a trip as an exact-item match.':'FindIt could not verify an exact nearby branch or find a useful category retailer in this radius.';
    if(rows.length){
      el.dataset.finditFallback='1';el.innerHTML=rows.map(x=>{const dist=Number.isFinite(Number(x.distanceKm))?`${Number(x.distanceKm).toFixed(1)} km away`:'Distance unavailable';const map=(x.lat!=null&&x.lon!=null)?`https://www.google.com/maps/search/?${new URLSearchParams({api:'1',query:[x.name,x.address].filter(Boolean).join(' ')||`${x.lat},${x.lon}`})}`:'';return `<article class="store-card findit-likely-store"><div class="store-main"><strong>${esc(x.name||'Nearby retailer')}</strong><small>${esc(dist+(x.address?' • '+x.address:''))}</small><div class="store-tags"><span>Possible nearby retailer</span><span>Exact stock not verified</span></div><div class="store-actions">${x.website?`<a href="${esc(x.website)}" target="_blank" rel="noopener noreferrer">Website</a>`:''}${map?`<a href="${esc(map)}" target="_blank" rel="noopener noreferrer">Map</a>`:''}</div></div></article>`}).join('');
    }else{el.dataset.finditFallback='1';el.innerHTML='<div class="empty-state"><strong>No useful nearby retailer found yet.</strong><p>Try widening the search radius or use the exact retailer links above.</p></div>';}
    lastNearbyKey=key;
  }catch{
    const sum=$('#nearbySummary');if(sum&&!sum.textContent.trim())sum.textContent='Nearby retailer lookup is temporarily unavailable. Exact online retailer results above are still available.';
  }finally{nearbyBusy=false}
}
let timer;function sync(){clearTimeout(timer);timer=setTimeout(()=>{repairOfferPrices();fillNearbyFallback()},180)}
function init(){document.addEventListener('findit:results-rendered',sync);new MutationObserver(sync).observe(document.body,{childList:true,subtree:true});setTimeout(sync,700);setTimeout(sync,1800)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();