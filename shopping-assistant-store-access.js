/* FindIt Shopping Assistant — visible Check Store access.
   Keeps store verification actions reachable even when the Nearby panel is collapsed. */
(()=>{
  'use strict';
  if(window.__finditShoppingAssistantStoreAccess)return;
  window.__finditShoppingAssistantStoreAccess=true;
  const $=(s,r=document)=>r.querySelector(s),esc=(v='')=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const state=()=>window.finditState||window.state||{};
  let lastOpenAt=0,lastOpenIndex=-1;
  function openStore(index){
    const stores=Array.isArray(state().stores)?state().stores:[],i=Number(index),s=stores[i];
    if(!s||typeof window.finditCheckStore!=='function')return false;
    const now=Date.now();
    if(i===lastOpenIndex&&now-lastOpenAt<250&&document.querySelector('#fxShopModal'))return true;
    lastOpenIndex=i;lastOpenAt=now;
    window.finditCheckStore(s);
    return !!document.querySelector('#fxShopModal');
  }
  function bindButton(b){
    if(!b||b.dataset.shopStoreBound==='1')return;
    b.dataset.shopStoreBound='1';
    const go=e=>{e.preventDefault();e.stopPropagation();openStore(b.dataset.shopStore)};
    b.addEventListener('pointerdown',go,{capture:true});
    b.addEventListener('click',go,{capture:true});
  }
  function render(){
    const host=$('#fxShoppingAssistant');if(!host||typeof window.finditCheckStore!=='function')return false;
    let box=$('#fxCheckStoresQuick');
    if(!box){
      box=document.createElement('details');box.id='fxCheckStoresQuick';box.open=true;
      box.innerHTML='<summary>Check nearby stores</summary><div id="fxCheckStoresQuickBody"></div>';
      const listDetails=host.querySelector('details');
      if(listDetails)host.insertBefore(box,listDetails);else host.appendChild(box);
    }
    box.open=true;
    const body=$('#fxCheckStoresQuickBody',box),stores=Array.isArray(state().stores)?state().stores:[];
    if(!stores.length){body.innerHTML='<p class="fx-muted">Nearby store details will appear after FindIt locates retailers.</p>';return true}
    body.innerHTML=stores.slice(0,8).map((s,i)=>{
      const d=Number.isFinite(Number(s.distanceKm))?`${Number(s.distanceKm).toFixed(1)} km`:'Distance not available';
      const open=typeof s.openNow==='boolean'?(s.openNow?'Open now':'Closed now'):'Hours not published';
      return`<div class="fx-shop-line fx-quick-store"><div><strong>${esc(s.name||'Store')}</strong><small>${esc(d)} · ${esc(open)}</small></div><button type="button" data-shop-store="${i}">Check Store</button></div>`;
    }).join('');
    body.querySelectorAll('[data-shop-store]').forEach(bindButton);
    return true;
  }
  function captureStoreAction(e){
    const b=e.target?.closest?.('#fxCheckStoresQuick [data-shop-store]');if(!b)return;
    e.preventDefault();e.stopImmediatePropagation();openStore(b.dataset.shopStore);
  }
  // pointerdown opens before any legacy click owner can redraw the dashboard.
  // click remains as a keyboard/accessibility fallback.
  window.addEventListener('pointerdown',captureStoreAction,true);
  window.addEventListener('click',captureStoreAction,true);
  document.addEventListener('pointerdown',captureStoreAction,true);
  document.addEventListener('click',captureStoreAction,true);
  window.finditShoppingStoreAccessRefresh=render;
  window.finditOpenQuickStore=openStore;
  document.addEventListener('findit:results-rendered',()=>{render();setTimeout(render,250);setTimeout(render,900)});
  document.addEventListener('findit:nearby-updated',render);
  document.addEventListener('findit:dashboard-sync',render);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
  setTimeout(render,350);setTimeout(render,1200);
})();
