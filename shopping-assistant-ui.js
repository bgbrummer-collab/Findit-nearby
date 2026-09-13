/* FindIt Shopping Assistant — Check Store, Shopping List, Watch Item, Barcode Scan. */
(()=>{
'use strict';
if(window.__finditShoppingAssistantUi)return;window.__finditShoppingAssistantUi=true;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state=()=>window.finditState||window.state||{};
const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const n=v=>Number.isFinite(Number(v))?Number(v):null;
const money=(v,c='ZAR')=>{if(!(n(v)>0))return'Price not verified';try{return new Intl.NumberFormat('en-ZA',{style:'currency',currency:c||'ZAR'}).format(Number(v))}catch{return`${c||'ZAR'} ${Number(v).toFixed(2)}`}};
const LS_LIST='findit.shoppingList.v1',LS_WATCH='findit.watchList.v1';
const read=(k,fallback=[])=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return Array.isArray(v)?v:fallback}catch{return fallback}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
let stream=null,scanTimer=null;

function product(){
 const s=state(),id=s.result?.identification||s.identification||{};
 const name=String(id.name||id.product||id.object||s.query||'Current item').trim();
 const brand=String(id.brand||'').trim(),model=String(id.model||'').trim();
 return{name,brand,model,key:norm([brand,model,name].filter(Boolean).join(' '))||'current-item'};
}
function stores(){return Array.isArray(state().stores)?state().stores:[]}
function offers(){
 const s=state(),rows=[...(Array.isArray(s.offers)?s.offers:[]),...(Array.isArray(window.productIntelligence?.offers)?window.productIntelligence.offers:[])];
 const seen=new Set(),out=[];
 for(const o of rows){
  if(!o||o.exactProductMatch===false)continue;
  const verified=o.verified===true||o.sourcePageVerified===true||o.priceComparisonVerified===true||o.searchGroundedVerified===true||o.exactProductMatch===true;
  if(!verified)continue;
  const r=String(o.retailer?.name||o.retailer||o.store||o.seller||'').trim(),key=norm(r)+'|'+String(o.url||o.productUrl||'')+'|'+String(o.price||'');
  if(!r||seen.has(key))continue;seen.add(key);out.push({...o,_retailer:r});
 }
 return out;
}
function storeForRetailer(name){const q=norm(name);return stores().find(s=>{const x=norm(s.name);return x===q||x.startsWith(q+' ')||q.startsWith(x+' ')})||null}
function stockYes(o){return /in[_ ]?stock|available|limited stock/i.test(String(o?.availability||o?.stock?.status||''))}
function storeHours(s){return String(s?.openingHours||s?.opening_hours||s?.hours||s?.openingHoursText||s?.opening_hours_text||'').trim()}
function phone(s){return String(s?.phone||s?.telephone||s?.contactPhone||s?.tags?.phone||s?.tags?.['contact:phone']||'').trim()}
function website(s){return String(s?.website||s?.url||s?.tags?.website||s?.tags?.['contact:website']||'').trim()}
function address(s){return String(s?.address||s?.displayAddress||s?.vicinity||'').trim()}
function directionsUrl(s){
 const lat=n(s?.lat??s?.latitude),lon=n(s?.lon??s?.lng??s?.longitude);
 if(lat!=null&&lon!=null)return`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lat+','+lon)}`;
 const q=[s?.name,address(s)].filter(Boolean).join(' ');return q?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`:'';
}
function bestOffer(){return offers().filter(o=>n(o.price)>0).sort((a,b)=>Number(a.price)-Number(b.price))[0]||offers()[0]||null}
function snapshot(){
 const p=product(),os=offers(),ss=stores();
 return{...p,addedAt:Date.now(),offers:os.map(o=>({retailer:o._retailer,price:n(o.price),currency:o.currency||'ZAR',availability:o.availability||o.stock?.status||'',url:o.url||o.productUrl||'',distanceKm:n(storeForRetailer(o._retailer)?.distanceKm??o.distanceKm)})),stores:ss.map(s=>({name:s.name||'',distanceKm:n(s.distanceKm),address:address(s),phone:phone(s),website:website(s),hours:storeHours(s),lat:n(s.lat??s.latitude),lon:n(s.lon??s.lng??s.longitude)}))};
}
function toast(msg){let el=$('#fxShopToast');if(!el){el=document.createElement('div');el.id='fxShopToast';el.className='fx-shop-toast';document.body.appendChild(el)}el.textContent=msg;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),2200)}

function addCurrentToList(){
 const item=snapshot(),list=read(LS_LIST);const i=list.findIndex(x=>x.key===item.key);
 if(i>=0)list[i]=item;else list.push(item);write(LS_LIST,list);renderList();toast(i>=0?'Shopping list item updated':'Added to Shopping List');
}
function removeListItem(key){write(LS_LIST,read(LS_LIST).filter(x=>x.key!==key));renderList()}
function watchCurrent(){
 const p=product(),o=bestOffer(),list=read(LS_WATCH),rec={...p,createdAt:Date.now(),lastPrice:n(o?.price),lastStock:stockYes(o),retailer:o?._retailer||'',currency:o?.currency||'ZAR'};
 const i=list.findIndex(x=>x.key===p.key);if(i>=0)list[i]={...list[i],...rec};else list.push(rec);write(LS_WATCH,list);renderWatch();toast(i>=0?'Watch updated':'Item added to Watch List');
}
function unwatch(key){write(LS_WATCH,read(LS_WATCH).filter(x=>x.key!==key));renderWatch()}
function evaluateWatch(){
 const p=product(),list=read(LS_WATCH),i=list.findIndex(x=>x.key===p.key);if(i<0)return;
 const o=bestOffer();if(!o)return;const price=n(o.price),inStock=stockYes(o),rec=list[i];let msg='';
 if(price&&rec.lastPrice&&price<rec.lastPrice)msg=`Price drop: ${p.name} is now ${money(price,o.currency||'ZAR')}.`;
 else if(inStock&&!rec.lastStock)msg=`Restock found: ${p.name} is available from ${o._retailer}.`;
 rec.lastPrice=price||rec.lastPrice;rec.lastStock=inStock;rec.retailer=o._retailer||rec.retailer;list[i]=rec;write(LS_WATCH,list);
 if(msg){toast(msg);try{if(Notification?.permission==='granted')new Notification('FindIt Watch Item',{body:msg})}catch{}}
}

function retailerPlan(){
 const list=read(LS_LIST);if(!list.length)return null;
 const chosen=[],missing=[];
 for(const item of list){
  const valid=(item.offers||[]).filter(o=>n(o.price)>0).sort((a,b)=>Number(a.price)-Number(b.price));
  if(!valid.length){missing.push(item.name);continue}chosen.push({item:item.name,offer:valid[0]});
 }
 const total=chosen.reduce((s,x)=>s+Number(x.offer.price||0),0),retailers=[...new Set(chosen.map(x=>x.offer.retailer))];
 const distances=chosen.map(x=>n(x.offer.distanceKm)).filter(x=>x!=null),distance=distances.reduce((a,b)=>a+b,0);
 const single={};
 for(const item of list)for(const o of item.offers||[]){if(!(n(o.price)>0))continue;(single[o.retailer]??=[]).push({item:item.name,price:Number(o.price),distanceKm:n(o.distanceKm)});}
 const complete=Object.entries(single).filter(([,rows])=>new Set(rows.map(r=>r.item)).size===list.length).map(([r,rows])=>({retailer:r,total:rows.reduce((s,x)=>s+x.price,0),distanceKm:Math.min(...rows.map(x=>x.distanceKm).filter(x=>x!=null).concat([1e9]))})).sort((a,b)=>a.total-b.total);
 return{list,chosen,missing,total,retailers,distance,singleStore:complete[0]||null};
}
function renderList(){
 const body=$('#fxShoppingListBody');if(!body)return;const plan=retailerPlan(),list=read(LS_LIST);
 if(!list.length){body.innerHTML='<p class="fx-muted">Your shopping list is empty. Add the current Find to start planning.</p>';return}
 const items=list.map(x=>`<div class="fx-shop-line"><div><strong>${esc(x.name)}</strong><small>${esc([x.brand,x.model].filter(Boolean).join(' '))}</small></div><button data-remove-list="${esc(x.key)}" type="button">Remove</button></div>`).join('');
 const planHtml=plan?`<div class="fx-plan"><strong>Best verified price plan</strong><p>${plan.chosen.length?`${esc(plan.retailers.join(' + '))} · ${money(plan.total,'ZAR')}${plan.distance?` · approx. ${plan.distance.toFixed(1)} km across item-store matches`:''}`:'No verified prices yet.'}</p>${plan.singleStore?`<p>One-store option: <b>${esc(plan.singleStore.retailer)}</b> · ${money(plan.singleStore.total,'ZAR')}</p>`:''}${plan.missing.length?`<p class="fx-warn">Still missing verified prices for: ${esc(plan.missing.join(', '))}</p>`:''}<small>Totals use currently verified product prices. Travel distance is an estimate from item/store matches, not a turn-by-turn route.</small></div>`:'';
 body.innerHTML=items+planHtml;$$('[data-remove-list]',body).forEach(b=>b.onclick=()=>removeListItem(b.dataset.removeList));
}
function renderWatch(){
 const body=$('#fxWatchBody');if(!body)return;const list=read(LS_WATCH);
 body.innerHTML=list.length?list.map(x=>`<div class="fx-shop-line"><div><strong>${esc(x.name)}</strong><small>${x.lastPrice?`Last verified: ${esc(money(x.lastPrice,x.currency||'ZAR'))}`:'Waiting for a verified price'}${x.retailer?` · ${esc(x.retailer)}`:''}</small></div><button type="button" data-unwatch="${esc(x.key)}">Stop watching</button></div>`).join(''):'<p class="fx-muted">No watched items yet.</p>';
 $$('[data-unwatch]',body).forEach(b=>b.onclick=()=>unwatch(b.dataset.unwatch));
}

function showStoreModal(s){
 if(!s)return;closeModal();const p=phone(s),w=website(s),d=directionsUrl(s),h=storeHours(s),a=address(s),dist=n(s.distanceKm);
 const el=document.createElement('div');el.id='fxShopModal';el.className='fx-shop-overlay';el.innerHTML=`<section class="fx-shop-modal" role="dialog" aria-modal="true" aria-label="Check Store"><button class="fx-x" type="button" data-close-shop aria-label="Close">×</button><span class="fx-kicker">CHECK STORE</span><h2>${esc(s.name||'Store')}</h2><div class="fx-store-facts"><p><b>Distance:</b> ${dist!=null?`${dist.toFixed(1)} km`:'Not available'}</p><p><b>Address:</b> ${esc(a||'Not published')}</p><p><b>Opening hours:</b> ${esc(h||'Not published')}</p><p><b>Phone:</b> ${esc(p||'Not published')}</p></div><div class="fx-shop-actions">${p?`<a href="tel:${esc(p.replace(/[^+\d]/g,''))}">Call to confirm stock</a>`:''}${d?`<a href="${esc(d)}" target="_blank" rel="noopener">Directions</a>`:''}${w?`<a href="${esc(w)}" target="_blank" rel="noopener">Store website</a>`:''}</div><p class="fx-truth">Branch stock can change quickly. FindIt only shows confirmed stock when a source publishes it; calling the store is the safest final check.</p></section>`;
 document.body.appendChild(el);el.querySelector('[data-close-shop]').onclick=closeModal;el.onclick=e=>{if(e.target===el)closeModal()};
}
function closeModal(){stopScanner();$('#fxShopModal')?.remove()}
function attachStoreButtons(){
 const ss=stores();$$('[data-store]').forEach(card=>{if(card.querySelector('[data-check-store]'))return;const i=Number(card.dataset.store);if(!Number.isInteger(i)||!ss[i])return;const b=document.createElement('button');b.type='button';b.dataset.checkStore=String(i);b.className='fx-check-store-btn';b.textContent='Check Store';b.onclick=e=>{e.preventDefault();e.stopPropagation();showStoreModal(stores()[i])};card.appendChild(b)});
}

function openBarcode(){
 closeModal();const el=document.createElement('div');el.id='fxShopModal';el.className='fx-shop-overlay';el.innerHTML=`<section class="fx-shop-modal" role="dialog" aria-modal="true" aria-label="Barcode scanner"><button class="fx-x" type="button" data-close-shop aria-label="Close">×</button><span class="fx-kicker">BARCODE SCAN</span><h2>Scan exact product barcode</h2><video id="fxBarcodeVideo" playsinline muted></video><p id="fxBarcodeStatus">Starting camera…</p><div class="fx-manual-barcode"><label for="fxBarcodeManual">Or enter barcode</label><div><input id="fxBarcodeManual" inputmode="numeric" autocomplete="off" placeholder="e.g. 6001234567890"><button id="fxUseBarcode" type="button">Use barcode</button></div></div><p class="fx-truth">Barcode support depends on your browser/device. If camera scanning is unavailable, manual barcode entry still works.</p></section>`;document.body.appendChild(el);el.querySelector('[data-close-shop]').onclick=closeModal;el.onclick=e=>{if(e.target===el)closeModal()};$('#fxUseBarcode').onclick=()=>useBarcode($('#fxBarcodeManual').value);startScanner();
}
function useBarcode(raw){const code=String(raw||'').replace(/\s+/g,'').trim();if(!code){toast('Enter or scan a barcode first');return}window.finditLastBarcode=code;try{document.dispatchEvent(new CustomEvent('findit:barcode',{detail:{code}}))}catch{};const inputs=$$('input[type="search"],input[data-findit-search],input[name="q"],input[name="query"]');if(inputs[0]){inputs[0].value=code;inputs[0].dispatchEvent(new Event('input',{bubbles:true}))}const st=$('#fxBarcodeStatus');if(st)st.textContent=`Barcode captured: ${code}`;toast(`Barcode captured: ${code}`)}
async function startScanner(){
 const status=$('#fxBarcodeStatus'),video=$('#fxBarcodeVideo');if(!status||!video)return;
 if(!('BarcodeDetector'in window)){status.textContent='Camera barcode detection is not supported in this browser. Use manual entry below.';return}
 try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});video.srcObject=stream;await video.play();const detector=new BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e','code_128','code_39','qr_code']});status.textContent='Point the camera at the barcode.';const tick=async()=>{if(!stream||!document.body.contains(video))return;try{const found=await detector.detect(video);if(found?.[0]?.rawValue){useBarcode(found[0].rawValue);stopScanner();return}}catch{}scanTimer=setTimeout(tick,550)};tick()}catch{status.textContent='Camera could not start. Use manual barcode entry below.'}
}
function stopScanner(){if(scanTimer){clearTimeout(scanTimer);scanTimer=null}if(stream){for(const t of stream.getTracks())try{t.stop()}catch{}stream=null}}

function inject(){
 const shell=$('#finditExactShell');if(!shell)return false;let box=$('#fxShoppingAssistant');if(!box){box=document.createElement('section');box.id='fxShoppingAssistant';box.className='fx-shopping-assistant';box.innerHTML=`<div class="fx-shop-head"><div><span class="fx-kicker">FINDIT SHOPPING ASSISTANT</span><h2>Plan, verify and track your shopping</h2><p>Use current verified FindIt data — no guessed prices, stock, phone numbers or opening hours.</p></div></div><div class="fx-shop-tools"><button id="fxAddCurrentItem" type="button">+ Add current item</button><button id="fxWatchCurrentItem" type="button">Watch item</button><button id="fxBarcodeScan" type="button">Scan barcode</button></div><details open><summary>Shopping List</summary><div id="fxShoppingListBody"></div></details><details><summary>Watch List</summary><div id="fxWatchBody"></div></details>`;const anchor=$('#fxSmartChoice')||shell.querySelector('.fx-feature-row')||shell.firstElementChild;if(anchor?.parentNode)anchor.parentNode.insertBefore(box,anchor.nextSibling);else shell.prepend(box);$('#fxAddCurrentItem').onclick=addCurrentToList;$('#fxWatchCurrentItem').onclick=watchCurrent;$('#fxBarcodeScan').onclick=openBarcode}
 renderList();renderWatch();attachStoreButtons();evaluateWatch();return true;
}
function styles(){if($('#fxShoppingAssistantStyles'))return;const st=document.createElement('style');st.id='fxShoppingAssistantStyles';st.textContent=`
.fx-shopping-assistant{margin:18px 0;padding:20px;border:1px solid rgba(145,119,255,.22);border-radius:22px;background:linear-gradient(135deg,rgba(19,22,43,.96),rgba(10,22,35,.96));box-shadow:0 16px 38px rgba(0,0,0,.16)}.fx-shop-head h2{margin:5px 0 6px;font-size:22px}.fx-shop-head p{margin:0;opacity:.78}.fx-kicker{font-size:11px;font-weight:900;letter-spacing:.12em;color:#9de7ff}.fx-shop-tools{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0}.fx-shop-tools button,.fx-check-store-btn,.fx-shop-line button,.fx-manual-barcode button{border:1px solid rgba(157,231,255,.28);border-radius:12px;padding:10px 13px;background:rgba(157,231,255,.08);color:inherit;font-weight:800;cursor:pointer}.fx-shopping-assistant details{border-top:1px solid rgba(255,255,255,.08);padding:13px 0}.fx-shopping-assistant summary{cursor:pointer;font-weight:850}.fx-shop-line{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)}.fx-shop-line strong,.fx-shop-line small{display:block}.fx-shop-line small,.fx-muted,.fx-plan small,.fx-truth{opacity:.7}.fx-plan{margin-top:12px;padding:14px;border-radius:15px;background:rgba(255,255,255,.045)}.fx-plan p{margin:7px 0}.fx-warn{color:#ffd28b}.fx-check-store-btn{margin-top:10px}.fx-shop-overlay{position:fixed;inset:0;z-index:2147483000;background:rgba(2,8,18,.72);display:grid;place-items:center;padding:18px}.fx-shop-modal{position:relative;width:min(560px,100%);max-height:90vh;overflow:auto;border-radius:20px;padding:22px;background:#0f1b2b;color:#eef7ff;border:1px solid rgba(157,231,255,.2);box-shadow:0 24px 70px rgba(0,0,0,.42)}.fx-shop-modal h2{margin:6px 34px 14px 0}.fx-x{position:absolute;right:14px;top:12px;border:0;background:transparent;color:inherit;font-size:28px;cursor:pointer}.fx-store-facts p{margin:8px 0}.fx-shop-actions{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0}.fx-shop-actions a{padding:10px 13px;border-radius:12px;text-decoration:none;background:#9de7ff;color:#082035;font-weight:850}.fx-shop-modal video{width:100%;min-height:180px;background:#050b12;border-radius:14px}.fx-manual-barcode{margin-top:14px}.fx-manual-barcode label{display:block;margin-bottom:6px;font-weight:800}.fx-manual-barcode div{display:flex;gap:8px}.fx-manual-barcode input{min-width:0;flex:1;padding:11px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:#081422;color:#fff}.fx-shop-toast{position:fixed;left:50%;bottom:24px;z-index:2147483640;transform:translate(-50%,18px);opacity:0;pointer-events:none;padding:11px 16px;border-radius:999px;background:#eafaff;color:#062130;font-weight:850;transition:.18s}.fx-shop-toast.show{opacity:1;transform:translate(-50%,0)}@media(max-width:680px){.fx-shopping-assistant{padding:15px}.fx-shop-tools{display:grid;grid-template-columns:1fr}.fx-shop-tools button{width:100%}.fx-shop-line{align-items:flex-start}.fx-shop-line button{flex:0 0 auto}.fx-manual-barcode div{flex-direction:column}}
`;document.head.appendChild(st)}
function refresh(){styles();inject()}
window.finditShoppingAssistantRefresh=refresh;window.finditCheckStore=showStoreModal;window.finditUseBarcode=useBarcode;
document.addEventListener('findit:results-rendered',()=>{refresh();setTimeout(refresh,450);setTimeout(refresh,1300)});document.addEventListener('findit:nearby-updated',refresh);document.addEventListener('findit:dashboard-sync',refresh);document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();setTimeout(refresh,450);setTimeout(refresh,1200);
})();
