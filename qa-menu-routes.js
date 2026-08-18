/* FindIt Premium route hardening: fixes hidden/broken drawer/workspace targets and adds management controls. */
(() => {
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const closeDrawerSafe=()=>{try{if(typeof closeDrawer==='function')closeDrawer()}catch{}};
  const premiumOn=()=>localStorage.getItem('findit_premium_beta')==='1'||document.body.classList.contains('premium-active');

  function openRadiusTool(){
    if(!premiumOn()){document.getElementById('premiumButton')?.click();return}
    if(typeof v10Open!=='function')return;
    let current=10;try{current=Number(state?.radius||localStorage.getItem('finditRadius')||10)}catch{}
    v10Open('Search Radius',`<p class="premium-tool-note">Choose how far FindIt should look for relevant nearby retailers. Premium supports up to 25 km.</p><div class="radius-pills" id="qaRadiusPills">${[3,5,10,15,25].map(n=>`<button data-qa-radius="${n}" class="${n===current?'active':''}">${n} km${n>10?' ★':''}</button>`).join('')}</div>`);
    $$('[data-qa-radius]').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.qaRadius);if(typeof premiumRadius==='function')premiumRadius(n);else{try{state.radius=n;localStorage.setItem('finditRadius',String(n))}catch{}}openRadiusTool()});
  }

  function openNearbyMap(){
    closeDrawerSafe();
    const results=$('#results');
    if(results&&!results.classList.contains('hidden')){results.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>$('#mapViewBtn')?.click(),180)}
    else{if(typeof v10Open==='function')v10Open('Nearby Map','<p class="premium-tool-note">Run a FindIt search with location first. Once nearby retailers are available, open Nearby Map again to see them on the map.</p><div class="v10-actions"><button id="qaGoFind">Go to Find</button></div>');setTimeout(()=>{$('#qaGoFind')?.addEventListener('click',()=>$('#finder')?.scrollIntoView({behavior:'smooth'}))},0)}
  }

  function patchDrawer(){
    const home=$('#premiumDrawerNav a[href="#premiumHome"]');if(home&&!home.dataset.qaRoute){home.dataset.qaRoute='1';home.href='#v10CommandCentre';home.onclick=e=>{e.preventDefault();closeDrawerSafe();$('#v10CommandCentre')?.scrollIntoView({behavior:'smooth',block:'start'})}}
    const map=$('#premiumDrawerNav a[href="#nearbyPanel"]');if(map&&!map.dataset.qaRoute){map.dataset.qaRoute='1';map.href='#results';map.onclick=e=>{e.preventDefault();openNearbyMap()}}
    const radius=$('#premiumRadiusMenu');if(radius&&!radius.dataset.qaRoute){radius.dataset.qaRoute='1';radius.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();closeDrawerSafe();openRadiusTool()},true)}
    const history=$('#premiumHistoryMenu');if(history&&!history.dataset.qaRoute){history.dataset.qaRoute='1';history.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();closeDrawerSafe();if(typeof v10History==='function')v10History()},true)}
    const price=$$('#premiumDrawerNav button').find(b=>/price|stock/i.test(b.textContent||''));if(price&&!price.dataset.qaRoute){price.dataset.qaRoute='1';price.disabled=false;price.classList.remove('premium-coming');price.innerHTML='♢ Price & Stock Watchlist';price.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();closeDrawerSafe();window.finditOpenAlertsWatchlist?.()},true)}
  }

  function patchWorkspace(){
    const alert=$('[data-pw="alerts"]');if(alert&&!alert.dataset.qaRoute){alert.dataset.qaRoute='1';alert.classList.remove('coming');alert.innerHTML='♢ <span><b>Price & Stock Watchlist</b><small>Track target prices and restocks</small></span>';alert.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();try{if(typeof closePremiumWorkspace==='function')closePremiumWorkspace()}catch{}window.finditOpenAlertsWatchlist?.()},true)}
    const radius=$('[data-pw="radius"]');if(radius&&!radius.dataset.qaRoute){radius.dataset.qaRoute='1';radius.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();try{if(typeof closePremiumWorkspace==='function')closePremiumWorkspace()}catch{}openRadiusTool()},true)}
    const hist=$('[data-pw="history"]');if(hist&&!hist.dataset.qaRoute){hist.dataset.qaRoute='1';hist.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();try{if(typeof closePremiumWorkspace==='function')closePremiumWorkspace()}catch{}if(typeof v10History==='function')v10History()},true)}
  }

  function patchFavouriteStores(){
    if(typeof window.v10FavouriteStores!=='function'||window.v10FavouriteStores.__qaPatched)return;
    const original=window.v10FavouriteStores;
    const fn=function(){
      let saved=[];try{saved=JSON.parse(localStorage.getItem('findit_v10_favourite_stores')||'[]');if(!Array.isArray(saved))saved=[]}catch{}
      const stores=(()=>{try{return Array.isArray(state?.stores)?state.stores:[]}catch{return[]}})();
      if(typeof v10Open!=='function')return original();
      v10Open('Favourite Stores',`<p class="premium-tool-note">Save retailers from your current nearby results. Delete favourites any time to make space.</p><div class="v10-list">${stores.length?stores.map((s,i)=>`<div class="v10-row"><div><b>${esc(s.name)}</b><br><small>${Number(s.distanceKm||0).toFixed(1)} km</small></div><button data-qa-fav-add="${i}">${saved.some(x=>x.name===s.name)?'Saved ✓':'Save store'}</button></div>`).join(''):'<p>Run a nearby search first to see retailers you can save.</p>'}</div>${saved.length?`<h3 style="margin-top:20px">Saved retailers</h3><div class="v10-list">${saved.map((x,i)=>`<div class="v10-row"><div><b>${esc(x.name)}</b><br><small>${esc(x.address||'Retailer')}</small></div><button class="findit-delete-btn" data-qa-fav-del="${i}">Delete</button></div>`).join('')}</div>`:''}`);
      $$('[data-qa-fav-add]').forEach(b=>b.onclick=()=>{const s=stores[Number(b.dataset.qaFavAdd)];if(s&&!saved.some(x=>x.name===s.name)){saved.unshift({name:s.name,address:s.address||'',lat:s.lat,lon:s.lon});localStorage.setItem('findit_v10_favourite_stores',JSON.stringify(saved.slice(0,50)))}fn()});
      $$('[data-qa-fav-del]').forEach(b=>b.onclick=()=>{saved.splice(Number(b.dataset.qaFavDel),1);localStorage.setItem('findit_v10_favourite_stores',JSON.stringify(saved));fn()});
    };fn.__qaPatched=true;window.v10FavouriteStores=fn;
  }

  function patchHistory(){
    if(typeof window.v10History!=='function'||window.v10History.__qaPatched)return;
    const fn=function(){
      let all=[];try{all=JSON.parse(localStorage.getItem('finditRecent')||'[]');if(!Array.isArray(all))all=[]}catch{}
      if(typeof v10Open!=='function')return;
      v10Open('History+',`<p class="premium-tool-note">Premium keeps up to 50 recent finds. Delete individual entries whenever you want to make room.</p><input id="qaHistorySearch" class="v10-input" placeholder="Search your recent finds"><div id="qaHistoryRows" class="v10-list"></div>`);
      const draw=()=>{const q=($('#qaHistorySearch')?.value||'').toLowerCase();const rows=all.map((x,index)=>({x,index})).filter(({x})=>`${x.name||''} ${x.query||''}`.toLowerCase().includes(q)).slice(0,50);const out=$('#qaHistoryRows');if(!out)return;out.innerHTML=rows.length?rows.map(({x,index})=>`<div class="v10-row"><div><b>${esc(x.name||'FindIt item')}</b><br><small>${esc(x.query||'')}</small></div><div class="findit-row-actions"><button data-qa-history-search="${index}">Search again</button><button class="findit-delete-btn" data-qa-history-delete="${index}">Delete</button></div></div>`).join(''):'<p>No matching history.</p>';$$('[data-qa-history-search]').forEach(b=>b.onclick=()=>{const x=all[Number(b.dataset.qaHistorySearch)];if(x?.query)window.open(`https://www.google.com/search?q=${encodeURIComponent(x.query)}`,'_blank')});$$('[data-qa-history-delete]').forEach(b=>b.onclick=()=>{all.splice(Number(b.dataset.qaHistoryDelete),1);localStorage.setItem('finditRecent',JSON.stringify(all));try{if(typeof renderRecent==='function')renderRecent()}catch{};draw()})};draw();$('#qaHistorySearch').oninput=draw;
    };fn.__qaPatched=true;window.v10History=fn;
  }

  function sync(){patchDrawer();patchWorkspace();patchFavouriteStores();patchHistory()}
  function init(){sync();setTimeout(sync,500);setTimeout(sync,1600)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();window.addEventListener('pageshow',()=>setTimeout(sync,100));
})();
