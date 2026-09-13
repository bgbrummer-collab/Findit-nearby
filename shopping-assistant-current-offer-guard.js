/* FindIt Shopping Assistant current-Find offer guard.
   Keeps the current completed Find authoritative if another runtime temporarily clears state.offers. */
(()=>{
  'use strict';
  if(window.__finditShoppingAssistantCurrentOfferGuard)return;
  window.__finditShoppingAssistantCurrentOfferGuard=true;
  const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  let cache={key:'',offers:[]};
  const state=()=>window.finditState||window.state||{};
  function productKey(){
    const s=state(),i=s.result?.identification||s.identification||{};
    return norm([i.brand,i.model,i.name||i.product||i.object||s.query].filter(Boolean).join(' '))||'current-item';
  }
  function capture(){
    const s=state(),rows=Array.isArray(s.offers)?s.offers:[];
    if(rows.length)cache={key:productKey(),offers:rows.map(o=>({...o}))};
  }
  function restore(){
    const s=state();
    if((!Array.isArray(s.offers)||!s.offers.length)&&cache.offers.length&&cache.key===productKey()){
      s.offers=cache.offers.map(o=>({...o}));
    }
  }
  function wrapRefresh(){
    const fn=window.finditShoppingAssistantRefresh;
    if(typeof fn!=='function'||fn.__currentOfferGuard)return false;
    const wrapped=function(...args){capture();restore();return fn.apply(this,args)};
    wrapped.__currentOfferGuard=true;
    window.finditShoppingAssistantRefresh=wrapped;
    return true;
  }
  document.addEventListener('findit:results-rendered',()=>{capture();setTimeout(capture,0)},true);
  document.addEventListener('findit:dashboard-sync',capture,true);
  window.addEventListener('click',e=>{
    const t=e.target?.closest?.('#fxAddCurrentItem,#fxWatchCurrentItem');
    if(!t)return;
    restore();
  },true);
  const timer=setInterval(()=>{if(wrapRefresh()){capture();clearInterval(timer)}},20);
  setTimeout(()=>{wrapRefresh();capture();clearInterval(timer)},2500);
})();
