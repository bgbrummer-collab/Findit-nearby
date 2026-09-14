/* FindIt user-first polish — fixes misleading labels, empty nearby states and low-value UI copy. */
(()=>{
'use strict';
if(window.__finditUserFirstPolish)return;window.__finditUserFirstPolish=true;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const state=()=>window.finditState||window.state||{};
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const norm=v=>clean(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=v=>Number.isFinite(Number(v))?Number(v):null;
let nearbyBusy=false,nearbyKey='';

function decode(v=''){
 const s=String(v??'');
 if(!/[&][a-z#0-9]+;/i.test(s))return s;
 const t=document.createElement('textarea');t.innerHTML=s;return t.value;
}
function titleCase(v=''){return clean(v).split(/[\s._-]+/).filter(Boolean).map(x=>x.length<=3&&/^[A-Z0-9]+$/.test(x)?x:(x.charAt(0).toUpperCase()+x.slice(1))).join(' ')}
const hostNames={
 'amazon':'Amazon','takealot':'Takealot','bobshop':'Bob Shop','gumtree':'Gumtree','nike':'Nike','adidas':'Adidas','sportscene':'Sportscene','totalsports':'Totalsports','jdsports':'JD Sports','bash':'Bash','superbalist':'Superbalist','makro':'Makro','game':'Game','woolworths':'Woolworths','checkers':'Checkers','shoprite':'Shoprite','pnp':'Pick n Pay','picknpay':'Pick n Pay','clicks':'Clicks','dischem':'Dis-Chem','incredible':'Incredible Connection','computermania':'Computer Mania','hirschs':"Hirsch's",'hificorp':'HiFi Corp','builders':'Builders','pna':'PNA','waltons':'Waltons','toysrus':'Toys R Us','mrphome':'Mr Price Home','loot':'Loot'
};
function retailerFromUrl(raw){
 try{
  const h=new URL(raw).hostname.toLowerCase().replace(/^www\./,'');
  const parts=h.split('.').filter(Boolean);if(!parts.length)return'';
  let base='';
  if(parts.length>=3&&parts.at(-2)==='co'&&parts.at(-1)==='za')base=parts.at(-3);
  else if(parts.length>=3&&['com','org','net'].includes(parts.at(-2))&&parts.at(-1)==='au')base=parts.at(-3);
  else base=parts.length>=2?parts.at(-2):parts[0];
  return hostNames[base]||titleCase(base.replace(/shop$/i,' Shop'));
 }catch{return''}
}
function badRetailer(v){const n=norm(v);return !n||n.length<3||/^(co|com|za|www|shop|store|retailer|seller|online|marketplace|unknown|n a|na)$/.test(n)}
function retailerLabel(o){
 const raw=decode(o?.retailer?.name||o?.retailer||o?.store||o?.seller||'');
 if(!badRetailer(raw))return clean(raw);
 const byUrl=retailerFromUrl(o?.product_url||o?.productUrl||o?.url||'');
 return !badRetailer(byUrl)?byUrl:'Online retailer';
}
function repairOffer(o){
 if(!o||typeof o!=='object')return o;
 for(const k of ['product_name','name','title','description','source'])if(typeof o[k]==='string')o[k]=decode(o[k]);
 const label=retailerLabel(o);
 if(o.retailer&&typeof o.retailer==='object')o.retailer={...o.retailer,name:label};else o.retailer=label;
 o._finditRetailerLabel=label;
 return o;
}
function repairOffers(){
 const s=state();
 if(Array.isArray(s.offers))s.offers.forEach(repairOffer);
 if(Array.isArray(window.productIntelligence?.offers))window.productIntelligence.offers.forEach(repairOffer);
}
window.finditRetailerDisplayName=retailerLabel;

function currentIdentification(){return state()?.result?.identification||state()?.identification||{}}
function hasProduct(){const i=currentIdentification();return !!clean(i.name||i.object||i.model||i.searchQuery)}
function coords(){const s=state(),x=s.coords||s.userLocation||s.location;const lat=number(x?.lat??x?.latitude),lon=number(x?.lon??x?.lng??x?.longitude);return lat!=null&&lon!=null?{lat,lon}:null}
function nearbySearchKey(){const i=currentIdentification(),c=coords();return c?norm(`${c.lat.toFixed(3)}|${c.lon.toFixed(3)}|${i.searchQuery||i.name||i.object}`):''}
function renderFallbackNearby(stores){
 const host=$('#nearbyStores');if(!host||!Array.isArray(stores)||!stores.length)return;
 host.innerHTML=stores.slice(0,12).map((s,i)=>{const d=number(s.distanceKm),q=[s.name,s.address].filter(Boolean).join(' '),map=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q||`${s.lat},${s.lon}`)}`;return `<article class="store-card" data-store="${i}"><span class="store-rank">${i+1}</span><div class="store-main"><strong>${esc(s.name||'Nearby retailer')}</strong><small>${esc(s.address||s.type||'Relevant retailer')}</small><div class="store-tags"><span>Relevant nearby retailer</span><span>Exact branch stock not verified</span></div></div><div class="store-side"><div class="store-distance">${d!=null?`${d.toFixed(1)} km`:'Distance unavailable'}</div><div class="store-actions"><a href="${esc(map)}" target="_blank" rel="noopener noreferrer">View store</a></div></div></article>`}).join('');
}
async function fetchLikely(radius){
 const c=coords(),i=currentIdentification();if(!c)return null;
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),18000);
 try{
  const r=await fetch('/api/nearby',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({lat:c.lat,lon:c.lon,identification:i,radiusKm:radius,mode:'likely'}),signal:ctl.signal});
  const d=await r.json().catch(()=>({}));return r.ok&&Array.isArray(d.stores)?d:null;
 }catch{return null}finally{clearTimeout(timer)}
}
async function ensureNearby(){
 const s=state();if(nearbyBusy||!hasProduct()||!coords()||(Array.isArray(s.stores)&&s.stores.length))return;
 const key=nearbySearchKey();if(!key||key===nearbyKey)return;nearbyKey=key;nearbyBusy=true;
 const smartStatus=$('#fxOpenNowStatus');if(smartStatus)smartStatus.textContent='Finding relevant nearby retailers…';
 const quick=$('#fxCheckStoresQuickBody');if(quick)quick.innerHTML='<p class="fx-muted">FindIt is locating relevant nearby retailers…</p>';
 try{
  let radius=Math.max(10,Math.min(25,number(s.radius)||10)),d=await fetchLikely(radius);
  if((!d?.stores?.length)&&radius<25){radius=25;d=await fetchLikely(radius)}
  if(d?.stores?.length){
   s.stores=d.stores;
   if(s.diagnostics){s.diagnostics.nearbyStoreCount=s.stores.length;s.diagnostics.nearbyRadiusKm=radius;s.diagnostics.nearbyReliable=d.reliable!==false}
   renderFallbackNearby(s.stores);
   try{document.dispatchEvent(new CustomEvent('findit:nearby-updated',{detail:{stores:s.stores,source:'user-first-fallback'}}));document.dispatchEvent(new CustomEvent('findit:dashboard-sync'))}catch{}
   window.finditSmartChoiceRefresh?.();window.finditShoppingStoreAccessRefresh?.();window.finditRefreshStoreHours?.();
  }else{
   const host=$('#nearbyStores');if(host&&!host.textContent.trim())host.innerHTML='<div class="empty-state">No relevant nearby retailers were found within 25 km. Online options are still shown above.</div>';
   try{document.dispatchEvent(new CustomEvent('findit:dashboard-sync'))}catch{}
  }
 }finally{nearbyBusy=false}
}

function decodeTextNodes(root){
 if(!root)return;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode())){if(/&(?:quot|amp|apos|#39|#x27|nbsp);/i.test(n.nodeValue||''))n.nodeValue=decode(n.nodeValue)}
}
function poorPro(v){
 const x=clean(decode(v));if(!x||x.length<16)return true;
 if(/offers low top,? mid top,? and high top/i.test(x))return true;
 if(/^(available|comes|offered) in (many|multiple|different) (styles|colours|colors|versions|variants)/i.test(x))return true;
 if(/^(men|women|kids|unisex)\b/i.test(x)&&x.length<70)return true;
 // Product/variant names are evidence of identity, not a user benefit. Keep only a sentence that
 // actually explains a meaningful performance/use advantage.
 if(/^nike air force 1(?:\s|$)/i.test(x)&&!/(offers?|provides?|features?|uses?|has|includes?|helps?|supports?|improves?|gives?|designed|made|cushion|comfort|durab|traction|support)/i.test(x))return true;
 return false;
}
function improveProductInfo(){
 const modal=$('#fxStableModal:not(.hidden)');if(!modal)return;decodeTextNodes(modal);
 const body=$('#fxStableBody',modal);if(!body)return;
 const hs=$$('h4,h3',body);
 for(const h of hs){
  const title=norm(h.textContent);
  if(title==='pros'){
   const ul=h.nextElementSibling?.matches('ul')?h.nextElementSibling:null;if(!ul)continue;
   $$('li',ul).forEach(li=>{if(poorPro(li.textContent))li.remove()});
   if(!ul.querySelector('li')){const p=document.createElement('p');p.className='fx-user-note';p.textContent='FindIt is still verifying meaningful strengths for this exact product. It will not show product names or style variants as “pros”.';ul.replaceWith(p)}
  }
  if(/cons considerations/.test(title)){
   const next=h.nextElementSibling;if(next&&!next.matches('ul')&&/no trustworthy product-specific downsides|no well-supported product-specific drawbacks/i.test(next.textContent||''))next.textContent='No consistent product-specific drawback was verified in the sources checked.';
  }
 }
 const facts=$$('.fx-fact b',body);facts.forEach(x=>{if(/^co\b/i.test(clean(x.textContent)))x.textContent=x.textContent.replace(/^Co\b/i,'Online retailer')});
}
function improveCommerceModal(){const m=$('#fxCommerceSafeModal:not([hidden])');if(!m)return;decodeTextNodes(m);$$('.fx-commerce-row b',m).forEach(b=>{if(badRetailer(b.textContent))b.textContent='Online retailer'});}

function polishShoppingPlan(){
 const body=$('#fxShoppingListBody');if(!body)return;
 const list=(()=>{try{return JSON.parse(localStorage.getItem('findit.shoppingList.v2')||'[]')}catch{return[]}})();
 if(!Array.isArray(list)||!list.length)return;
 let physical=0,online=0;
 for(const item of list){for(const o of Array.isArray(item?.offers)?item.offers:[]){const lat=number(o?.lat),lon=number(o?.lon);if(lat!=null&&lon!=null)physical++;else online++}}
 const plan=$('.fx-plan',body);if(!plan)return;
 let note=$('.fx-plan-scope-note',plan);
 if(!physical&&online){
  if(!note){note=document.createElement('div');note.className='fx-plan-scope-note';plan.insertBefore(note,plan.children[1]||null)}
  note.textContent='Online-only plan: no physical branch coordinates are verified for these offers, so FindIt will not pretend this is a driving trip.';
  $$('[data-plan-mode="shortest"]',plan).forEach(b=>b.style.display='none');
  $$('p',plan).forEach(p=>{if(/^\s*\d+\s+store\b/i.test(p.textContent||''))p.innerHTML=p.innerHTML.replace(/(\d+)\s+store(s?)/i,'$1 online retailer$2')});
 }else if(note)note.remove();
}

function styles(){if($('#fxUserFirstPolishStyles'))return;const st=document.createElement('style');st.id='fxUserFirstPolishStyles';st.textContent=`.fx-plan-scope-note{margin:10px 0 12px;padding:10px 12px;border:1px solid rgba(116,231,255,.18);border-radius:12px;background:rgba(116,231,255,.06);font-size:12px;line-height:1.45;color:#bcd7e5}.fx-user-note{color:#9fb4cb;line-height:1.5}.fx-smart-card strong{word-break:normal!important;overflow-wrap:break-word!important}`;document.head.appendChild(st)}
function polish(){styles();repairOffers();improveProductInfo();improveCommerceModal();polishShoppingPlan()}
function settle(){polish();setTimeout(polish,60);setTimeout(polish,220);setTimeout(polish,700);setTimeout(watchTargets,40)}
function watchTargets(){
 for(const el of [$('#fxCommerceSafeModal'),...$$('#fxStableModal'),$('#fxShoppingAssistant')].filter(Boolean)){
  if(el.dataset.finditUserFirstWatch==='1')continue;el.dataset.finditUserFirstWatch='1';
  const o=new MutationObserver(()=>setTimeout(polish,10));o.observe(el,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});
 }
}
for(const ev of ['findit:results-rendered','findit:nearby-updated','findit:dashboard-sync'])document.addEventListener(ev,()=>{settle();if(ev==='findit:results-rendered'){nearbyKey='';setTimeout(ensureNearby,900);setTimeout(ensureNearby,2200)}});
window.addEventListener('click',e=>{if(e.target?.closest?.('[data-fx="compare"],[data-fxnav="compare"],[data-fx="product"],#fxShoppingAssistant'))setTimeout(settle,30)},true);
window.finditUserFirstPolish=polish;window.finditEnsureNearbyRetailers=ensureNearby;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{settle();watchTargets();setTimeout(ensureNearby,1200);setTimeout(watchTargets,900)},{once:true});else{settle();watchTargets();setTimeout(ensureNearby,1200);setTimeout(watchTargets,900)}
})();
