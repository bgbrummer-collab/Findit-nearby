/* FindIt local-market commerce policy.
   Keeps international evidence available as a fallback, but for a South African user it prioritises exact South African listings,
   prevents foreign currencies from becoming the headline price, and keeps nearby branch wording truthful. */
(()=>{
'use strict';
if(window.__finditLocalMarketCommerceFix)return;window.__finditLocalMarketCommerceFix=true;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const state=()=>{try{return window.finditState||window.state||{}}catch{return{}}};
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const norm=v=>clean(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const positive=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))&&Number(v)>0;
const knownStock=v=>/^(in_stock|out_of_stock|preorder|backorder)$/i.test(clean(v));
const seller=o=>clean(o?.retailer?.name||o?.retailer||o?.store||o?.seller||'Retailer');
const url=o=>clean(o?.product_url||o?.url);
const localRetailers=new Set(['clicks','dischem','takealot','woolworths','makro','game','checkers','shoprite','pick n pay','pnp','incredible connection','hifi corp','builders','cash crusaders','sportsmans warehouse','sportscene','totalsports','cape union mart','exclusive books','pna','baby city','absolute pets','pet heaven','orms','outdoorphoto','marshall music','bothners','toms','music connection','distrinode']);
function retailerKey(v){let n=norm(v).replace(/\bdis chem\b/g,'dischem').replace(/\bpick n pay\b/g,'pick n pay').replace(/\bpnp\b/g,'pick n pay').replace(/\bhifi corp\b/g,'hifi corp');return n}
function isLocalRetailerName(v){const k=retailerKey(v);if(localRetailers.has(k))return true;for(const x of localRetailers)if(k===x||k.startsWith(`${x} `)||x.startsWith(`${k} `))return true;return false}
function isLocalOffer(o){const c=clean(o?.currency).toUpperCase();let h='';try{h=new URL(url(o)).hostname.replace(/^www\./,'').toLowerCase()}catch{}return c==='ZAR'||h.endsWith('.co.za')||h.endsWith('.za.com')||o?.localSouthAfrica===true||isLocalRetailerName(seller(o))}
function exactEnough(o){return !!(o&&(o.exactProductMatch===true||o.sourcePageVerified===true)&&(o.verified===true||o.sourcePageVerified===true||o.searchGroundedVerified===true))}
function coords(){const s=state(),c=s.coords||{};return{lat:Number(c.lat??s.lat??s.latitude),lon:Number(c.lon??c.lng??s.lon??s.lng??s.longitude)}}
function inSouthAfrica(){const c=coords();if(Number.isFinite(c.lat)&&Number.isFinite(c.lon)&&c.lat>=-35.5&&c.lat<=-22&&c.lon>=16&&c.lon<=33.5)return true;const stores=Array.isArray(state()?.stores)?state().stores:[];return stores.some(x=>/south africa|gauteng|pretoria|tshwane|johannesburg|cape town|durban/i.test(clean(`${x?.address||''} ${x?.city||''} ${x?.province||''}`)))}
function rawOffers(){const a=[];if(Array.isArray(state()?.offers))a.push(...state().offers);if(Array.isArray(window.productIntelligence?.offers))a.push(...window.productIntelligence.offers);const seen=new Set(),out=[];for(const o of a){if(!o)continue;const k=`${retailerKey(seller(o))}|${url(o).toLowerCase()}`;if(!k||seen.has(k))continue;seen.add(k);out.push(o)}return out}
function preferredOffers(){const all=rawOffers().filter(exactEnough);if(!inSouthAfrica())return all;const local=all.filter(isLocalOffer);return local.length?local:all}
function publishPreferred(){if(!inSouthAfrica())return;const preferred=preferredOffers();if(!preferred.length)return;const all=rawOffers();window.__finditInternationalOfferFallback=all.filter(o=>!preferred.includes(o));try{state().offers=preferred}catch{}try{if(window.finditState)window.finditState.offers=preferred}catch{}try{if(window.state&&window.state!==window.finditState)window.state.offers=preferred}catch{}try{window.productIntelligence={...(window.productIntelligence||{}),offers:preferred,marketPreference:'ZA'}}catch{}}
function money(o){if(!positive(o?.price))return'';try{return new Intl.NumberFormat('en-ZA',{style:'currency',currency:o.currency||'ZAR'}).format(Number(o.price))}catch{return`${o.currency||'ZAR'} ${Number(o.price).toFixed(2)}`}}
function stockText(o){const x=clean(o?.availability).toLowerCase();if(x==='in_stock')return'In stock online';if(x==='out_of_stock')return'Out of stock online';if(x==='preorder')return'Pre-order online';if(x==='backorder')return'Back-order online';return'Online stock not published'}
function offerMap(){const m=new Map();for(const o of preferredOffers()){const k=retailerKey(seller(o));if(!k)continue;const old=m.get(k);const score=x=>(x?.sourcePageVerified===true?100:0)+(positive(x?.price)?20:0)+(knownStock(x?.availability)?10:0);if(!old||score(o)>score(old))m.set(k,o)}return m}
function findOfferForName(name,map){const k=retailerKey(name);if(map.has(k))return map.get(k);for(const [rk,o] of map)if(k===rk||k.includes(rk)||rk.includes(k))return o;return null}
function syncBestPrice(){if(!inSouthAfrica())return;const local=preferredOffers().filter(isLocalOffer),priced=local.filter(o=>positive(o.price)).sort((a,b)=>Number(a.price)-Number(b.price)),el=$('#fxBestPrice');if(!el)return;if(priced.length){const t=money(priced[0]);if(t&&el.textContent!==t)el.textContent=t}else if(local.length&&!/Not verified locally yet/i.test(el.textContent||''))el.textContent='Not verified locally yet'}
function syncNearby(){if(!inSouthAfrica())return;const map=offerMap(),list=$('#fxStoreList');if(list){const rows=$$('.fx-store',list);for(const row of rows){const name=$('b',row)?.textContent||'',em=$('em',row),right=$('strong',row),o=findOfferForName(name,map);if(!em)continue;if(o){const bits=['Exact product online',stockText(o),'Branch stock not published'];em.textContent=bits.join(' • ');em.classList.toggle('ok',clean(o.availability).toLowerCase()==='in_stock');const p=money(o);if(right&&p)right.textContent=`${p} ›`;row.dataset.finditExactOnline='1'}else{em.textContent='Relevant nearby retailer • exact item not confirmed';em.classList.remove('ok');delete row.dataset.finditExactOnline}}
  const ordered=[...rows].sort((a,b)=>(b.dataset.finditExactOnline==='1')-(a.dataset.finditExactOnline==='1')||Number(a.dataset.distanceKm||0)-Number(b.dataset.distanceKm||0));ordered.forEach(r=>list.appendChild(r))}
 const top=$('#fxTopStores');if(top){for(const row of $$(':scope > button',top)){const name=$('b',row)?.textContent||'',badge=$('.fx-star',row),o=findOfferForName(name,map);if(!badge)continue;badge.textContent=o?(clean(o.availability).toLowerCase()==='in_stock'?'Exact online • In stock':'Exact product online'):'Nearby'}}
}
function polishResearch(){const box=$('#fxStableResearch');if(!box)return;for(const n of $$('small',box)){let t=n.textContent||'';t=t.replace(/professional-grade\s+hair care treatment/ig,'hair conditioner').replace(/well-regarded,?\s*/ig,'').replace(/salon-quality\s*/ig,'').replace(/offers accessible pricing/ig,'can be compared using the verified local price and availability shown below');if(t!==n.textContent)n.textContent=t}}
function polishModal(){const body=$('#fxStableBody');if(!body||!inSouthAfrica())return;const title=$('.fx-stable-title',body)?.textContent||'';if(/Compare Prices|Live Stock/i.test(title)){
  const productRows=$$('.fx-stable-row',body).filter(r=>$('a[href]',r));const localRows=productRows.filter(r=>{const b=$('b',r)?.textContent||'';return isLocalRetailerName(b)||/\bR\s?\d|ZAR|\.co\.za\b/i.test(r.textContent||'')});if(localRows.length){for(const r of productRows)if(!localRows.includes(r))r.style.display='none';const status=$('#fxPriceStatus,#fxStockStatus',body);if(status&&/Refreshing/i.test(status.textContent||''))status.textContent='Showing verified South African results while checking for updates…';const sub=$('.fx-stable-sub',body);if(sub&&!/South African retailers/i.test(sub.textContent||''))sub.textContent='South African exact-product retailers are shown first. International listings are used only when no local exact listing is available.'}
 }
 polishResearch();
}
function sync(){publishPreferred();syncBestPrice();syncNearby();polishModal();polishResearch()}
let timer=0;function queue(){clearTimeout(timer);timer=setTimeout(sync,40)}
['findit:results-rendered','findit:dashboard-sync','findit:stores-updated','findit:nearby-updated'].forEach(n=>document.addEventListener(n,queue));
window.addEventListener('load',()=>{setTimeout(sync,0);setTimeout(sync,700);setTimeout(sync,2200)});
window.addEventListener('click',e=>{if(e.target?.closest?.('#finditExactShell [data-fx],#fxRefreshPrices,#fxRefreshStock')){setTimeout(sync,80);setTimeout(sync,900);setTimeout(sync,2600)}},true);
const mo=new MutationObserver(()=>queue());mo.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
})();
