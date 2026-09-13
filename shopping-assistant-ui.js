/* FindIt Shopping Assistant — verified store checks, lists, route planning, watch history and barcode lookup. */
(()=>{
  'use strict';
  if(window.__finditShoppingAssistantUi)return;
  window.__finditShoppingAssistantUi=true;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=(v='')=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  const n=v=>Number.isFinite(Number(v))?Number(v):null;
  const app=()=>window.finditState||window.state||{};
  const LS={list:'findit.shoppingList.v2',watch:'findit.watchList.v2',alerts:'findit.watchAlerts.v1',history:'findit.priceHistory.v1',mode:'findit.shoppingPlanMode.v1'};
  const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v??f}catch{return f}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
  const money=(v,c='ZAR')=>{if(!(n(v)>0))return'Price not verified';try{return new Intl.NumberFormat('en-ZA',{style:'currency',currency:c||'ZAR'}).format(Number(v))}catch{return`${c||'ZAR'} ${Number(v).toFixed(2)}`}};
  let stream=null,scanTimer=null;

  function product(){
    const s=app(),i=s.result?.identification||s.identification||{};
    const name=String(i.name||i.product||i.object||s.query||'Current item').trim();
    const brand=String(i.brand||'').trim(),model=String(i.model||'').trim();
    return{name,brand,model,confidence:n(i.confidence),key:norm([brand,model,name].filter(Boolean).join(' '))||'current-item'};
  }
  function stores(){return Array.isArray(app().stores)?app().stores:[]}
  function offers(){
    const s=app();
    // The current completed Find owns the screen. Product-intelligence offers are fallback only,
    // never merged into a newer Find, so stale prices cannot contaminate plans or alerts.
    const rows=Array.isArray(s.offers)&&s.offers.length?s.offers:(Array.isArray(window.productIntelligence?.offers)?window.productIntelligence.offers:[]);
    const seen=new Set(),out=[];
    for(const o of rows){
      if(!o||o.exactProductMatch===false)continue;
      const verified=o.verified===true||o.sourcePageVerified===true||o.priceComparisonVerified===true||o.searchGroundedVerified===true||o.exactProductMatch===true;
      if(!verified)continue;
      const retailer=String(o.retailer?.name||o.retailer||o.store||o.seller||'').trim();
      const key=norm(retailer)+'|'+String(o.url||o.productUrl||'')+'|'+String(o.price||'');
      if(!retailer||seen.has(key))continue;
      seen.add(key);out.push({...o,_retailer:retailer});
    }
    return out;
  }
  function storeFor(name){const q=norm(name);return stores().find(s=>{const x=norm(s.name);return x===q||x.startsWith(q+' ')||q.startsWith(x+' ')})||null}
  function stockYes(o){return /in[_ ]?stock|available|limited stock/i.test(String(o?.availability||o?.stock?.status||''))}
  const phone=s=>String(s?.phone||s?.telephone||s?.contactPhone||s?.tags?.phone||s?.tags?.['contact:phone']||'').trim();
  const website=s=>String(s?.website||s?.url||s?.tags?.website||s?.tags?.['contact:website']||'').trim();
  const address=s=>String(s?.address||s?.displayAddress||s?.vicinity||'').trim();
  const hours=s=>String(s?.openingHours||s?.opening_hours||s?.hours||s?.openingHoursText||s?.opening_hours_text||'').trim();
  function coords(s){const lat=n(s?.lat??s?.latitude),lon=n(s?.lon??s?.lng??s?.longitude);return lat!=null&&lon!=null?{lat,lon}:null}
  function directionsUrl(s){const c=coords(s);if(c)return`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${c.lat},${c.lon}`)}`;const q=[s?.name,address(s)].filter(Boolean).join(' ');return q?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`:''}
  function bestOffer(){const a=offers();return a.filter(o=>n(o.price)>0).sort((x,y)=>Number(x.price)-Number(y.price))[0]||a[0]||null}

  function toast(msg){let e=$('#fxShopToast');if(!e){e=document.createElement('div');e.id='fxShopToast';e.className='fx-shop-toast';document.body.appendChild(e)}e.textContent=msg;e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('show'),2200)}
  function snapshot(){
    const p=product();
    return{...p,addedAt:Date.now(),offers:offers().map(o=>{const s=storeFor(o._retailer);return{retailer:o._retailer,price:n(o.price),currency:o.currency||'ZAR',availability:o.availability||o.stock?.status||'',url:o.url||o.productUrl||'',distanceKm:n(s?.distanceKm??o.distanceKm),lat:n(s?.lat??s?.latitude),lon:n(s?.lon??s?.lng??s?.longitude)}}),stores:stores().map(s=>({name:s.name||'',distanceKm:n(s.distanceKm),address:address(s),phone:phone(s),website:website(s),hours:hours(s),openNow:typeof s.openNow==='boolean'?s.openNow:null,lat:n(s.lat??s.latitude),lon:n(s.lon??s.lng??s.longitude)}))};
  }

  function recordHistory(){
    const p=product(),o=bestOffer();if(!o||!(n(o.price)>0))return;
    const all=read(LS.history,{}),arr=Array.isArray(all[p.key])?all[p.key]:[],last=arr[arr.length-1];
    if(!last||last.price!==Number(o.price)||last.retailer!==o._retailer||last.stock!==stockYes(o)){
      arr.push({at:Date.now(),price:Number(o.price),currency:o.currency||'ZAR',retailer:o._retailer,stock:stockYes(o)});
      all[p.key]=arr.slice(-30);write(LS.history,all);
    }
  }
  function historySummary(key){const arr=read(LS.history,{})[key]||[];if(!arr.length)return'';const vals=arr.map(x=>n(x.price)).filter(v=>v>0);if(!vals.length)return`${arr.length} checks`;const last=arr[arr.length-1];return`${arr.length} checks · low ${money(Math.min(...vals),last.currency)} · high ${money(Math.max(...vals),last.currency)}`}

  function addCurrent(){const item=snapshot(),list=read(LS.list,[]),i=list.findIndex(x=>x.key===item.key);if(i>=0)list[i]=item;else list.push(item);write(LS.list,list);renderList();toast(i>=0?'Shopping list item updated':'Added to Shopping List')}
  function removeCurrent(key){write(LS.list,read(LS.list,[]).filter(x=>x.key!==key));renderList()}
  function clearList(){write(LS.list,[]);renderList();toast('Shopping List cleared')}

  function watchCurrent(){
    const p=product(),o=bestOffer(),list=read(LS.watch,[]),rec={...p,updatedAt:Date.now(),lastPrice:n(o?.price),lastStock:stockYes(o),retailer:o?._retailer||'',currency:o?.currency||'ZAR'};
    const i=list.findIndex(x=>x.key===p.key);if(i>=0)list[i]={...list[i],...rec};else list.push({...rec,createdAt:Date.now()});write(LS.watch,list);recordHistory();renderWatch();toast(i>=0?'Watch updated':'Item added to Watch List');
  }
  function unwatch(key){write(LS.watch,read(LS.watch,[]).filter(x=>x.key!==key));renderWatch()}
  function addAlert(key,type,message){const a=read(LS.alerts,[]);a.unshift({id:`${Date.now()}-${Math.random()}`,key,type,message,at:Date.now(),read:false});write(LS.alerts,a.slice(0,50))}
  function evaluateWatch(){
    recordHistory();const p=product(),list=read(LS.watch,[]),i=list.findIndex(x=>x.key===p.key);if(i<0)return;
    const o=bestOffer();if(!o)return;const price=n(o.price),inStock=stockYes(o),rec=list[i];let msg='',type='';
    if(price&&rec.lastPrice&&price<rec.lastPrice){type='price_drop';msg=`Price drop: ${p.name} is now ${money(price,o.currency||'ZAR')}.`}
    else if(inStock&&!rec.lastStock){type='restock';msg=`Restock found: ${p.name} is available from ${o._retailer}.`}
    if(msg){addAlert(p.key,type,msg);toast(msg);try{if(window.Notification&&Notification.permission==='granted')new Notification('FindIt Watch Item',{body:msg})}catch{}}
    rec.lastPrice=price||rec.lastPrice;rec.lastStock=inStock;rec.retailer=o._retailer||rec.retailer;rec.updatedAt=Date.now();list[i]=rec;write(LS.watch,list);
  }
  async function notifications(){if(!window.Notification){toast('Browser notifications are not supported here');return}try{toast(await Notification.requestPermission()==='granted'?'Watch notifications enabled':'Notifications were not enabled')}catch{toast('Could not enable notifications')}}

  function hav(a,b){if(!a||!b)return null;const R=6371,d=Math.PI/180,dLat=(b.lat-a.lat)*d,dLon=(b.lon-a.lon)*d,x=Math.sin(dLat/2)**2+Math.cos(a.lat*d)*Math.cos(b.lat*d)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
  function routeDistance(points,start){let total=0,cur=start||null;for(const p of points){if(cur){const d=hav(cur,p);if(d!=null)total+=d}cur=p}return total}
  function options(item){return(item.offers||[]).filter(o=>n(o.price)>0).sort((a,b)=>Number(a.price)-Number(b.price)).slice(0,5)}
  function origin(){const s=app();const c=coords(s.coords)||coords(s.userLocation)||coords(s.location);return c}
  function score(combo,mode){const price=combo.reduce((t,x)=>t+Number(x.offer.price||0),0),uniq=[...new Map(combo.map(x=>[norm(x.offer.retailer),x])).values()],points=uniq.map(x=>x.offer.lat!=null&&x.offer.lon!=null?{lat:Number(x.offer.lat),lon:Number(x.offer.lon)}:null).filter(Boolean),dist=routeDistance(points,origin()),count=uniq.length;if(mode==='cheapest')return price;if(mode==='shortest')return dist*1000+count*25+price*.005;return price+dist*18+count*35}
  function routeUrl(stops){const pts=stops.map(s=>s.coords).filter(Boolean);if(!pts.length)return'';const o=origin(),dest=pts[pts.length-1],way=pts.slice(0,-1);let url=`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${dest.lat},${dest.lon}`)}`;if(o)url+=`&origin=${encodeURIComponent(`${o.lat},${o.lon}`)}`;if(way.length)url+=`&waypoints=${encodeURIComponent(way.map(x=>`${x.lat},${x.lon}`).join('|'))}`;return url}
  function buildPlan(){
    const list=read(LS.list,[]);if(!list.length)return null;
    const missing=list.filter(i=>!options(i).length).map(i=>i.name),ready=list.filter(i=>options(i).length),mode=String(read(LS.mode,'balanced')||'balanced');
    if(!ready.length)return{list,missing,chosen:[],total:0,stops:[],distance:0,mode,url:''};
    let best=null,visited=0;
    function walk(i,combo){if(visited>5000)return;if(i===ready.length){visited++;const sc=score(combo,mode);if(!best||sc<best.score)best={score:sc,combo:[...combo]};return}for(const o of options(ready[i]))walk(i+1,[...combo,{item:ready[i],offer:o}])}
    walk(0,[]);
    const chosen=best?.combo||ready.map(i=>({item:i,offer:options(i)[0]})),total=chosen.reduce((t,x)=>t+Number(x.offer.price||0),0),map=new Map();
    for(const x of chosen){const k=norm(x.offer.retailer);if(!map.has(k))map.set(k,{name:x.offer.retailer,items:[],coords:x.offer.lat!=null&&x.offer.lon!=null?{lat:Number(x.offer.lat),lon:Number(x.offer.lon)}:null,distanceKm:n(x.offer.distanceKm)});map.get(k).items.push(x.item.name)}
    const stops=[...map.values()].sort((a,b)=>(a.distanceKm??999)-(b.distanceKm??999)),distance=routeDistance(stops.map(s=>s.coords).filter(Boolean),origin());
    return{list,missing,chosen,total,stops,distance,mode,url:routeUrl(stops)};
  }

  function renderList(){
    const body=$('#fxShoppingListBody');if(!body)return;const list=read(LS.list,[]);
    if(!list.length){body.innerHTML='<p class="fx-muted">Your shopping list is empty. Add the current Find to start planning.</p>';return}
    const p=buildPlan(),mode=p?.mode||'balanced';
    const modes=`<div class="fx-plan-modes"><button data-plan-mode="balanced" class="${mode==='balanced'?'active':''}">Best overall</button><button data-plan-mode="cheapest" class="${mode==='cheapest'?'active':''}">Cheapest</button><button data-plan-mode="shortest" class="${mode==='shortest'?'active':''}">Shortest trip</button></div>`;
    const lines=list.map(x=>`<div class="fx-shop-line"><div><strong>${esc(x.name)}</strong><small>${esc([x.brand,x.model].filter(Boolean).join(' '))}</small></div><button data-remove-list="${esc(x.key)}" type="button">Remove</button></div>`).join('');
    const stops=p.stops.map((s,i)=>`${i+1}. ${esc(s.name)} <small>${esc(s.items.join(', '))}</small>`).join('<br>');
    body.innerHTML=lines+`<div class="fx-plan"><strong>Optimised verified shopping plan</strong>${modes}<p><b>${p.stops.length} store${p.stops.length===1?'':'s'}</b> · ${money(p.total,'ZAR')}${p.distance?` · approx. ${p.distance.toFixed(1)} km route`:''}</p>${stops?`<p class="fx-route">${stops}</p>`:''}${p.url?`<a class="fx-route-link" href="${esc(p.url)}" target="_blank" rel="noopener">Open trip in Maps</a>`:''}${p.missing.length?`<p class="fx-warn">Missing verified prices for: ${esc(p.missing.join(', '))}</p>`:''}<small>FindIt optimises only from verified prices and available store coordinates. Route distance is an estimate; Maps provides the final live route.</small></div><button id="fxClearShoppingList" class="fx-clear-list" type="button">Clear list</button>`;
    $$('[data-remove-list]',body).forEach(b=>b.onclick=()=>removeCurrent(b.dataset.removeList));
    $$('[data-plan-mode]',body).forEach(b=>b.onclick=()=>{write(LS.mode,b.dataset.planMode);renderList()});
    $('#fxClearShoppingList')?.addEventListener('click',clearList);
  }
  function renderWatch(){
    const body=$('#fxWatchBody');if(!body)return;const list=read(LS.watch,[]),alerts=read(LS.alerts,[]),unread=alerts.filter(a=>!a.read).length;
    body.innerHTML=`<div class="fx-watch-actions"><button id="fxEnableNotifications" type="button">Enable notifications</button><span>${unread} new alert${unread===1?'':'s'}</span></div>${list.length?list.map(x=>`<div class="fx-shop-line"><div><strong>${esc(x.name)}</strong><small>${x.lastPrice?`Last verified: ${esc(money(x.lastPrice,x.currency||'ZAR'))}`:'Waiting for a verified price'}${x.retailer?` · ${esc(x.retailer)}`:''}</small><small>${esc(historySummary(x.key))}</small></div><button type="button" data-unwatch="${esc(x.key)}">Stop watching</button></div>`).join(''):'<p class="fx-muted">No watched items yet.</p>'}${alerts.length?`<details><summary>Recent watch alerts</summary>${alerts.slice(0,8).map(a=>`<p class="fx-alert">${esc(a.message)}<small>${new Date(a.at).toLocaleString()}</small></p>`).join('')}</details>`:''}<p class="fx-truth">Watch Item checks refreshed verified data while FindIt is open. True background alerts while the site is closed require a server notification service, so FindIt does not pretend they are active yet.</p>`;
    $$('[data-unwatch]',body).forEach(b=>b.onclick=()=>unwatch(b.dataset.unwatch));$('#fxEnableNotifications')?.addEventListener('click',notifications);
  }

  function stopScanner(){if(scanTimer){clearTimeout(scanTimer);scanTimer=null}if(stream){for(const t of stream.getTracks())try{t.stop()}catch{}stream=null}}
  function closeModal(){stopScanner();$('#fxShopModal')?.remove()}
  function storeModal(s){
    if(!s)return;closeModal();const p=phone(s),w=website(s),d=directionsUrl(s),h=hours(s),a=address(s),dist=n(s.distanceKm),open=typeof s.openNow==='boolean'?(s.openNow?'Open now':'Closed now'):'Open status not published';
    const e=document.createElement('div');e.id='fxShopModal';e.className='fx-shop-overlay';
    e.innerHTML=`<section class="fx-shop-modal" role="dialog" aria-modal="true" aria-label="Check Store"><button class="fx-x" type="button" data-close-shop aria-label="Close">×</button><span class="fx-kicker">CHECK STORE</span><h2>${esc(s.name||'Store')}</h2><div class="fx-store-facts"><p><b>Status:</b> ${esc(open)}</p><p><b>Distance:</b> ${dist!=null?`${dist.toFixed(1)} km`:'Not available'}</p><p><b>Address:</b> ${esc(a||'Not published')}</p><p><b>Opening hours:</b> ${esc(h||'Not published')}</p><p><b>Phone:</b> ${esc(p||'Not published')}</p></div><div class="fx-shop-actions">${p?`<a href="tel:${esc(p.replace(/[^+\d]/g,''))}">Call to confirm stock</a>`:''}${d?`<a href="${esc(d)}" target="_blank" rel="noopener">Directions</a>`:''}${w?`<a href="${esc(w)}" target="_blank" rel="noopener">Store website</a>`:''}</div><p class="fx-truth">Branch stock can change quickly. FindIt shows branch stock only when a source publishes it. Calling the store is the safest final confirmation.</p></section>`;
    document.body.appendChild(e);e.querySelector('[data-close-shop]').onclick=closeModal;e.onclick=x=>{if(x.target===e)closeModal()};
  }
  function storeButtons(){const ss=stores();$$('[data-store]').forEach(card=>{if(card.querySelector('[data-check-store]'))return;const i=Number(card.dataset.store);if(!Number.isInteger(i)||!ss[i])return;const b=document.createElement('button');b.type='button';b.dataset.checkStore=String(i);b.className='fx-check-store-btn';b.textContent='Check Store';b.onclick=e=>{e.preventDefault();e.stopPropagation();storeModal(stores()[i])};card.appendChild(b)})}

  async function lookupBarcode(code){
    const st=$('#fxBarcodeStatus');if(st)st.textContent=`Looking up barcode ${code} in connected product data…`;
    try{const r=await fetch('/api/product-intelligence',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query:code,name:code,barcode:code})}),d=await r.json();if(r.ok&&d?.matched&&d.bestProduct){window.finditLastBarcodeProduct=d.bestProduct;const name=d.bestProduct.name||d.bestProduct.product_name||code;if(st)st.innerHTML=`Matched connected product data: <b>${esc(name)}</b>.`;document.dispatchEvent(new CustomEvent('findit:barcode-product',{detail:{code,product:d.bestProduct,offers:d.offers||[]}}));toast(`Barcode matched: ${name}`);return d}if(st)st.textContent=`Barcode captured: ${code}. No connected verified product match yet.`}catch{if(st)st.textContent=`Barcode captured: ${code}. Product lookup is temporarily unavailable.`}return null;
  }
  async function useBarcode(raw){const code=String(raw||'').replace(/\s+/g,'').trim();if(!code){toast('Enter or scan a barcode first');return}if(!/^\d{6,18}$/.test(code)){toast('Use a valid numeric retail barcode');return}window.finditLastBarcode=code;document.dispatchEvent(new CustomEvent('findit:barcode',{detail:{code}}));await lookupBarcode(code)}
  async function startScanner(){
    const st=$('#fxBarcodeStatus'),video=$('#fxBarcodeVideo');if(!st||!video)return;
    if(!('BarcodeDetector'in window)){st.textContent='Camera barcode detection is not supported in this browser. Use manual entry below.';return}
    try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});video.srcObject=stream;await video.play();const detector=new BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e','code_128','code_39','qr_code']});st.textContent='Point the camera at the barcode.';const tick=async()=>{if(!stream||!document.body.contains(video))return;try{const f=await detector.detect(video);if(f?.[0]?.rawValue){await useBarcode(f[0].rawValue);stopScanner();return}}catch{}scanTimer=setTimeout(tick,550)};tick()}catch{st.textContent='Camera could not start. Use manual barcode entry below.'}
  }
  function barcodeModal(){
    closeModal();const e=document.createElement('div');e.id='fxShopModal';e.className='fx-shop-overlay';e.innerHTML=`<section class="fx-shop-modal" role="dialog" aria-modal="true" aria-label="Barcode scanner"><button class="fx-x" type="button" data-close-shop aria-label="Close">×</button><span class="fx-kicker">BARCODE SCAN</span><h2>Scan exact product barcode</h2><video id="fxBarcodeVideo" playsinline muted></video><p id="fxBarcodeStatus">Starting camera…</p><div class="fx-manual-barcode"><label for="fxBarcodeManual">Or enter barcode</label><div><input id="fxBarcodeManual" inputmode="numeric" autocomplete="off" placeholder="e.g. 6001234567890"><button id="fxUseBarcode" type="button">Find product</button></div></div><p class="fx-truth">FindIt checks the barcode against connected product data. If no authorised source matches it, FindIt says so instead of inventing a product.</p></section>`;document.body.appendChild(e);e.querySelector('[data-close-shop]').onclick=closeModal;e.onclick=x=>{if(x.target===e)closeModal()};$('#fxUseBarcode').onclick=()=>useBarcode($('#fxBarcodeManual').value);startScanner();
  }

  function styles(){
    if($('#fxShoppingAssistantStyles'))return;const st=document.createElement('style');st.id='fxShoppingAssistantStyles';st.textContent=`.fx-shopping-assistant{margin:18px 0;padding:20px;border:1px solid rgba(145,119,255,.22);border-radius:22px;background:linear-gradient(135deg,rgba(19,22,43,.96),rgba(10,22,35,.96));box-shadow:0 16px 38px rgba(0,0,0,.16)}.fx-shop-head h2{margin:5px 0 6px;font-size:22px}.fx-shop-head p{margin:0;opacity:.78}.fx-kicker{font-size:11px;font-weight:900;letter-spacing:.12em;color:#9de7ff}.fx-shop-tools,.fx-plan-modes,.fx-watch-actions{display:flex;flex-wrap:wrap;gap:9px;margin:14px 0}.fx-shop-tools button,.fx-check-store-btn,.fx-shop-line button,.fx-manual-barcode button,.fx-plan-modes button,.fx-watch-actions button,.fx-clear-list{border:1px solid rgba(157,231,255,.28);border-radius:12px;padding:10px 13px;background:rgba(157,231,255,.08);color:inherit;font-weight:800;cursor:pointer}.fx-plan-modes button.active{background:#9de7ff;color:#082035}.fx-shopping-assistant details{border-top:1px solid rgba(255,255,255,.08);padding:13px 0}.fx-shopping-assistant summary{cursor:pointer;font-weight:850}.fx-shop-line{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)}.fx-shop-line strong,.fx-shop-line small,.fx-alert small{display:block}.fx-shop-line small,.fx-muted,.fx-plan small,.fx-truth{opacity:.7}.fx-plan{margin-top:12px;padding:14px;border-radius:15px;background:rgba(255,255,255,.045)}.fx-plan p{margin:7px 0}.fx-warn{color:#ffd28b}.fx-route small{display:inline;opacity:.68}.fx-route-link{display:inline-block;margin:4px 0 8px;color:#9de7ff;font-weight:800}.fx-check-store-btn{margin-top:10px}.fx-alert{padding:9px 0;border-bottom:1px solid rgba(255,255,255,.06)}.fx-shop-overlay{position:fixed;inset:0;z-index:2147483000;background:rgba(2,8,18,.72);display:grid;place-items:center;padding:18px}.fx-shop-modal{position:relative;width:min(560px,100%);max-height:90vh;overflow:auto;border-radius:20px;padding:22px;background:#0f1b2b;color:#eef7ff;border:1px solid rgba(157,231,255,.2);box-shadow:0 24px 70px rgba(0,0,0,.42)}.fx-shop-modal h2{margin:6px 34px 14px 0}.fx-x{position:absolute;right:14px;top:12px;border:0;background:transparent;color:inherit;font-size:28px;cursor:pointer}.fx-store-facts p{margin:8px 0}.fx-shop-actions{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0}.fx-shop-actions a{padding:10px 13px;border-radius:12px;text-decoration:none;background:#9de7ff;color:#082035;font-weight:850}.fx-shop-modal video{width:100%;min-height:180px;background:#050b12;border-radius:14px}.fx-manual-barcode{margin-top:14px}.fx-manual-barcode label{display:block;margin-bottom:6px;font-weight:800}.fx-manual-barcode div{display:flex;gap:8px}.fx-manual-barcode input{min-width:0;flex:1;padding:11px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:#081422;color:#fff}.fx-shop-toast{position:fixed;left:50%;bottom:24px;z-index:2147483640;transform:translate(-50%,18px);opacity:0;pointer-events:none;padding:11px 16px;border-radius:999px;background:#eafaff;color:#062130;font-weight:850;transition:.18s}.fx-shop-toast.show{opacity:1;transform:translate(-50%,0)}@media(max-width:680px){.fx-shopping-assistant{padding:15px}.fx-shop-tools{display:grid;grid-template-columns:1fr}.fx-shop-tools button{width:100%}.fx-shop-line{align-items:flex-start}.fx-shop-line button{flex:0 0 auto}.fx-manual-barcode div{flex-direction:column}.fx-plan-modes{display:grid;grid-template-columns:1fr}.fx-shop-actions a{width:100%;text-align:center}}`;document.head.appendChild(st);
  }
  function inject(){
    const shell=$('#finditExactShell');if(!shell)return false;let box=$('#fxShoppingAssistant');
    if(!box){box=document.createElement('section');box.id='fxShoppingAssistant';box.className='fx-shopping-assistant';box.innerHTML=`<div class="fx-shop-head"><span class="fx-kicker">FINDIT SHOPPING ASSISTANT</span><h2>Plan, verify and track your shopping</h2><p>Verified data first. FindIt does not guess prices, stock, phone numbers or opening hours.</p></div><div class="fx-shop-tools"><button id="fxAddCurrentItem" type="button">+ Add current item</button><button id="fxWatchCurrentItem" type="button">Watch item</button><button id="fxBarcodeScan" type="button">Scan barcode</button></div><details open><summary>Shopping List + Trip Planner</summary><div id="fxShoppingListBody"></div></details><details><summary>Watch List + Price History</summary><div id="fxWatchBody"></div></details>`;const anchor=$('#fxSmartChoice')||shell.querySelector('.fx-feature-row')||shell.firstElementChild;if(anchor?.parentNode)anchor.parentNode.insertBefore(box,anchor.nextSibling);else shell.prepend(box);$('#fxAddCurrentItem').onclick=addCurrent;$('#fxWatchCurrentItem').onclick=watchCurrent;$('#fxBarcodeScan').onclick=barcodeModal}
    renderList();renderWatch();storeButtons();evaluateWatch();return true;
  }
  function refresh(){styles();inject()}

  window.finditShoppingAssistantRefresh=refresh;
  window.finditCheckStore=storeModal;
  window.finditUseBarcode=useBarcode;
  window.finditShoppingPlan=buildPlan;
  document.addEventListener('findit:results-rendered',()=>{refresh();setTimeout(refresh,450);setTimeout(refresh,1300)});
  document.addEventListener('findit:nearby-updated',refresh);
  document.addEventListener('findit:dashboard-sync',refresh);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
  setTimeout(refresh,450);setTimeout(refresh,1200);
})();
