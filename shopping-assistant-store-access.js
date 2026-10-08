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
    // Surface only retailer links actually supplied by the nearby data provider.
    // Never turn an arbitrary website into a claim of verified branch stock.
    const modal=document.querySelector('#fxShopModal');
    if(modal){
      const candidate=String(s.website||'').trim();
      let official=null;
      try{const u=new URL(candidate.startsWith('www.')?'https://'+candidate:candidate);if(['https:','http:'].includes(u.protocol))official=u.href}catch{}
      if(official&&!modal.querySelector('[data-findit-official-site]')){
        const a=document.createElement('a');a.dataset.finditOfficialSite='1';
        a.href=official;a.target='_blank';a.rel='noopener noreferrer';
        a.textContent='Visit retailer website ↗';
        a.style.cssText='display:block;text-align:center;margin:12px 0;padding:12px;border:1px solid #75d7ef;border-radius:12px;color:#a1e9ff;text-decoration:none;font-weight:700';
        const host=modal.querySelector('.fx-shop-modal,.fx-shop-modal-body,.fx-modal-body,.modal-content')||modal;
        host.appendChild(a);
      }
    }
    if(modal&&official&&official.startsWith('https://')){
      const host=modal.querySelector('.fx-shop-modal,.fx-shop-modal-body,.fx-modal-body,.modal-content')||modal;
      let box=modal.querySelector('[data-findit-site-check]');
      if(!box){box=document.createElement('div');box.dataset.finditSiteCheck='1';box.style.cssText='margin:12px 0;font-size:14px;line-height:1.5;color:#c4d9e9';host.appendChild(box)}
      box.textContent='Checking published retailer website details…';
      fetch('/api/store-website-check',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({website:official,name:s.name,address:s.address||''})})
        .then(r=>r.json()).then(d=>{
          if(!box.isConnected)return;
          const fields=d.verifiedFields||{},items=[['Phone',fields.phone],['Opening hours',fields.openingHours],['Published address',fields.address]].filter(x=>x[1]);
          box.replaceChildren();
          const heading=document.createElement('strong');heading.textContent='Retailer website information';box.appendChild(heading);
          if(items.length){for(const [label,value] of items){const p=document.createElement('p');p.style.margin='6px 0';p.textContent=label+': '+value;box.appendChild(p)}}
          else{const p=document.createElement('p');p.textContent='No matching published store details could be verified automatically.';box.appendChild(p)}
          const note=document.createElement('small');note.textContent='Source: '+(d.source||'Retailer website')+(d.checkedAt?' · Checked '+new Date(d.checkedAt).toLocaleString():'')+' · Confirm the exact branch.';box.appendChild(note);
        }).catch(()=>{if(box.isConnected)box.textContent='Retailer website check unavailable. Use the website link to confirm details.'});
    }
    return !!modal;
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
