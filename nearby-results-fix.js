/* FindIt nearby-results fallback: only fills nearby/top stores when exact branch results are empty. */
(()=>{
'use strict';
if(window.__finditNearbyResultsFallbackV1)return;window.__finditNearbyResultsFallbackV1=true;
let runToken=0,busy=false,lastKey='';
const getState=()=>{try{return window.finditState||window.state||null}catch{return null}};
const keyFor=i=>[i?.brand,i?.model,i?.searchQuery,i?.name,i?.object].filter(Boolean).join('|').toLowerCase();
function normalize(rows){return (Array.isArray(rows)?rows:[]).filter(x=>x&&x.name&&Number.isFinite(Number(x.distanceKm))).map(x=>({...x,exactProductMatch:x.exactProductMatch===true,stockVerified:x.stockVerified===true,branchStockVerified:x.branchStockVerified===true,branchPriceVerified:x.branchPriceVerified===true,directionsAvailable:x.directionsAvailable===true&&x.exactProductMatch===true&&(x.branchStockVerified===true||x.stockVerified===true)})).sort((a,b)=>Number(a.distanceKm)-Number(b.distanceKm));}
async function fillIfNeeded(){
 const st=getState(),i=st?.result?.identification;
 if(!st?.coords||!i||Number(i.confidence||0)<.55||st?.result?.blocked)return;
 if(Array.isArray(st.stores)&&st.stores.length){document.dispatchEvent(new CustomEvent('findit:nearby-updated',{detail:{stores:st.stores}}));return;}
 const key=keyFor(i);if(!key||busy||lastKey===key)return;
 busy=true;lastKey=key;const token=++runToken;
 try{
  const r=await fetch('/api/nearby',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({lat:st.coords.lat,lon:st.coords.lon,identification:i,radiusKm:Number(st.radius)||10,mode:'likely'})});
  const d=await r.json().catch(()=>({}));if(token!==runToken||!r.ok||!d?.ok)return;
  const rows=normalize(d.stores);if(!rows.length)return;
  st.stores=rows;
  if(st.diagnostics)Object.assign(st.diagnostics,{nearbyStoreCount:rows.length,closestStoreDistanceKm:rows[0]?.distanceKm??null,nearbyRadiusKm:Number(st.radius)||10,nearbyReliable:d.reliable!==false,lastSearchCompletedAt:new Date().toISOString()});
  try{if(typeof window.renderStores==='function')window.renderStores()}catch{}
  try{if(typeof window.updateMap==='function')window.updateMap()}catch{}
  document.dispatchEvent(new CustomEvent('findit:nearby-updated',{detail:{stores:rows,fallback:true}}));
 }catch(e){console.warn('FindIt nearby fallback unavailable',e)}finally{busy=false}
}
function schedule(){const token=++runToken;setTimeout(()=>{if(token===runToken)fillIfNeeded()},900)}
document.addEventListener('findit:results-rendered',schedule);
document.addEventListener('findit:location-ready',()=>{const st=getState();if(st?.result?.identification)schedule()});
document.addEventListener('findit:nearby-updated',()=>{const st=getState();if(st?.stores?.length)lastKey=keyFor(st.result?.identification)});
})();