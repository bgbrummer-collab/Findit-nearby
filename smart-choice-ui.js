/* FindIt Smart Choice + Open Now — truthful decision help from current verified data. */
(()=>{
'use strict';
if(window.__finditSmartChoiceUi)return;window.__finditSmartChoiceUi=true;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const num=v=>Number.isFinite(Number(v))?Number(v):null;
const positive=v=>num(v)!==null&&num(v)>0;
const state=()=>window.finditState||window.state||{};
let openOnly=false;

function money(v,c='ZAR'){
 if(!positive(v))return 'Price not published';
 try{return new Intl.NumberFormat('en-ZA',{style:'currency',currency:c||'ZAR'}).format(Number(v))}catch{return`${c||'ZAR'} ${Number(v).toFixed(2)}`}
}
function retailerName(o){return String(o?.retailer?.name||o?.retailer||o?.store||o?.seller||'').trim()}
function currentOffers(){
 const s=state();
 const rows=[...(Array.isArray(s.offers)?s.offers:[]),...(Array.isArray(window.productIntelligence?.offers)?window.productIntelligence.offers:[])];
 const out=[];
 for(const o of rows){
   if(!o)continue;
   if(o.exactProductMatch===false)continue;
   const verified=o.sourcePageVerified===true||o.priceComparisonVerified===true||o.verified===true||o.searchGroundedVerified===true||o.exactProductMatch===true;
   if(!verified)continue;
   out.push(o);
 }
 return out;
}
function openingText(s){return String(s?.openingHours||s?.opening_hours||s?.hours||s?.openingHoursText||s?.opening_hours_text||'').trim()}
function knownOpenState(s,when=new Date()){
 if(s?.openNow===true||s?.isOpen===true)return true;
 if(s?.openNow===false||s?.isOpen===false)return false;
 const raw=openingText(s);if(!raw)return null;
 const text=raw.trim();if(/^(24\s*\/\s*7|24 hours)$/i.test(text))return true;
 // Conservative support for common OpenStreetMap opening_hours forms, e.g. Mo-Fr 08:00-17:00; Sa 09:00-13:00.
 const days=['Su','Mo','Tu','We','Th','Fr','Sa'],today=days[when.getDay()],mins=when.getHours()*60+when.getMinutes();
 const dayIndex=d=>days.indexOf(d);
 const dayApplies=spec=>{
   spec=spec.trim();if(!spec)return false;
   for(const part of spec.split(',')){
     const p=part.trim();
     if(p.includes('-')){const [a,b]=p.split('-').map(x=>x.trim());const ai=dayIndex(a),bi=dayIndex(b),ti=dayIndex(today);if(ai>=0&&bi>=0&&((ai<=bi&&ti>=ai&&ti<=bi)||(ai>bi&&(ti>=ai||ti<=bi))))return true}
     else if(p===today)return true;
   }
   return false;
 };
 let sawToday=false;
 for(const rule of text.split(';')){
   const m=rule.trim().match(/^([A-Za-z,-]+)\s+(.+)$/);if(!m||!dayApplies(m[1]))continue;sawToday=true;
   if(/\boff\b|closed/i.test(m[2]))return false;
   for(const range of m[2].split(',')){
     const tm=range.trim().match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);if(!tm)continue;
     const a=Number(tm[1])*60+Number(tm[2]),b=Number(tm[3])*60+Number(tm[4]);
     if(a<=b?mins>=a&&mins<b:mins>=a||mins<b)return true;
   }
 }
 return sawToday?false:null;
}
function matchStoreForOffer(o,stores){const n=norm(retailerName(o));if(!n)return null;return stores.find(s=>{const sn=norm(s.name);return sn===n||sn.startsWith(n+' ')||n.startsWith(sn+' ')})||null}
function scoreChoices(){
 const s=state(),stores=Array.isArray(s.stores)?s.stores:[],offers=currentOffers();
 const priced=offers.filter(o=>positive(o.price));
 const prices=priced.map(o=>Number(o.price)),minP=prices.length?Math.min(...prices):null,maxP=prices.length?Math.max(...prices):null;
 const distances=stores.map(x=>num(x.distanceKm)).filter(x=>x!=null),maxD=distances.length?Math.max(...distances):null;
 const candidates=[];
 for(const o of offers){
   const store=matchStoreForOffer(o,stores),p=positive(o.price)?Number(o.price):null,d=store?num(store.distanceKm):num(o.distanceKm),avail=String(o.availability||o.stock?.status||'').toLowerCase();
   const priceScore=p!=null?(maxP===minP?1:1-(p-minP)/(maxP-minP)):0.25;
   const distanceScore=d!=null&&maxD>0?1-Math.min(1,d/maxD):0.35;
   const stockScore=/in[_ ]?stock|available/.test(avail)?1:/out[_ ]?of[_ ]?stock|sold out/.test(avail)?0:0.45;
   const reliability=(o.sourcePageVerified===true||o.priceComparisonVerified===true||o.verified===true)?1:0.7;
   const open=store?knownOpenState(store):null,openScore=open===true?1:open===false?0:0.5;
   const total=priceScore*.34+distanceScore*.27+stockScore*.18+reliability*.14+openScore*.07;
   candidates.push({offer:o,store,price:p,distance:d,total,open});
 }
 candidates.sort((a,b)=>b.total-a.total);
 const cheapest=candidates.filter(x=>x.price!=null).sort((a,b)=>a.price-b.price||((a.distance??1e9)-(b.distance??1e9)))[0]||null;
 const closestStore=[...stores].filter(x=>num(x.distanceKm)!=null).sort((a,b)=>Number(a.distanceKm)-Number(b.distanceKm))[0]||null;
 return{best:candidates[0]||null,cheapest,closestStore,stores,offers};
}
function confidenceLabel(){const c=num(state()?.result?.identification?.confidence);if(c==null)return'Confidence not supplied';const p=Math.round(Math.max(0,Math.min(1,c))*100);return p>=85?`High confidence · ${p}%`:p>=65?`Likely match · ${p}%`:`Check match · ${p}%`}
function choiceCard(label,title,meta,klass='') {return`<article class="fx-smart-card ${klass}"><span>${esc(label)}</span><strong>${esc(title)}</strong><small>${esc(meta)}</small></article>`}
function inject(){
 const shell=$('#finditExactShell');if(!shell)return false;
 let box=$('#fxSmartChoice');
 if(!box){
   box=document.createElement('section');box.id='fxSmartChoice';box.className='fx-smart-choice';
   const anchor=shell.querySelector('.fx-feature-row')||shell.querySelector('.fx-search-card');
   if(anchor?.parentNode)anchor.parentNode.insertBefore(box,anchor.nextSibling);else shell.prepend(box);
 }
 render();return true;
}
function render(){
 const box=$('#fxSmartChoice');if(!box)return;
 const {best,cheapest,closestStore,stores}=scoreChoices();
 const bestName=best?(retailerName(best.offer)||best.store?.name||'Verified retailer'):(closestStore?.name||'Run a Find to get a recommendation');
 const bestMeta=best?[best.price!=null?money(best.price,best.offer.currency||'ZAR'):null,best.distance!=null?`${best.distance.toFixed(1)} km away`:null,best.open===true?'Open now':best.open===false?'Closed now':null].filter(Boolean).join(' · '):(closestStore?`${Number(closestStore.distanceKm).toFixed(1)} km away · price/stock not verified`:'Smart Choice uses price, distance, stock confidence and retailer evidence.');
 const cheapName=cheapest?(retailerName(cheapest.offer)||'Verified retailer'):'No verified price yet';
 const cheapMeta=cheapest?`${money(cheapest.price,cheapest.offer.currency||'ZAR')}${cheapest.distance!=null?` · ${cheapest.distance.toFixed(1)} km`:''}`:'FindIt will not guess a missing price.';
 const closestMeta=closestStore?`${Number(closestStore.distanceKm).toFixed(1)} km away${knownOpenState(closestStore)===true?' · Open now':knownOpenState(closestStore)===false?' · Closed now':''}`:'Location results have not loaded yet.';
 const knownHours=stores.filter(s=>knownOpenState(s)!==null),openCount=knownHours.filter(s=>knownOpenState(s)===true).length;
 box.innerHTML=`<div class="fx-smart-head"><div><span class="fx-smart-kicker">FindIt Smart Choice</span><h2>Best options from this Find</h2><p>Ranked from verified/current evidence. Missing prices, stock or opening hours are never guessed.</p></div><div class="fx-match-confidence">${esc(confidenceLabel())}</div></div><div class="fx-smart-grid">${choiceCard('BEST OVERALL',bestName,bestMeta,'best')}${choiceCard('CHEAPEST',cheapName,cheapMeta)}${choiceCard('CLOSEST',closestStore?.name||'No nearby store yet',closestMeta)}</div><div class="fx-open-row"><button type="button" id="fxOpenNowToggle" class="${openOnly?'active':''}" aria-pressed="${openOnly?'true':'false'}">${openOnly?'✓ ':''}Open Now</button><span id="fxOpenNowStatus">${knownHours.length?`${openCount} of ${knownHours.length} stores with published hours are open now.`:'Opening hours are not published for these nearby results yet.'}</span></div>`;
 $('#fxOpenNowToggle')?.addEventListener('click',()=>{openOnly=!openOnly;applyOpenFilter();render()});
 applyOpenFilter();
}
function applyOpenFilter(){
 const stores=Array.isArray(state().stores)?state().stores:[],cards=$$('#nearbyStores [data-store],#finditExactShell [data-store]');
 if(!openOnly){cards.forEach(c=>c.classList.remove('fx-open-filter-hidden'));return}
 const known=stores.filter(s=>knownOpenState(s)!==null);
 // If the source has no hours, do not hide everything and pretend the filter found zero stores.
 if(!known.length){cards.forEach(c=>c.classList.remove('fx-open-filter-hidden'));return}
 cards.forEach(c=>{const i=Number(c.dataset.store);c.classList.toggle('fx-open-filter-hidden',knownOpenState(stores[i])!==true)});
 $('#listViewBtn')?.click();
}
function addStyles(){if($('#fxSmartChoiceStyles'))return;const st=document.createElement('style');st.id='fxSmartChoiceStyles';st.textContent=`
#fxSmartChoice.fx-smart-choice{margin:18px 0;padding:20px;border:1px solid rgba(90,210,255,.2);border-radius:22px;background:linear-gradient(135deg,rgba(12,31,49,.96),rgba(8,20,34,.96));box-shadow:0 16px 38px rgba(0,0,0,.18)}
.fx-smart-head{display:flex;gap:18px;align-items:flex-start;justify-content:space-between}.fx-smart-kicker{font-size:12px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;color:#74e7ff}.fx-smart-head h2{margin:5px 0 6px;font-size:22px}.fx-smart-head p{margin:0;max-width:700px;opacity:.78}.fx-match-confidence{white-space:nowrap;padding:8px 11px;border-radius:999px;background:rgba(116,231,255,.11);font-size:12px;font-weight:700}.fx-smart-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:16px}.fx-smart-card{padding:15px;border:1px solid rgba(255,255,255,.09);border-radius:16px;background:rgba(255,255,255,.035);min-width:0}.fx-smart-card.best{border-color:rgba(116,231,255,.32);background:rgba(116,231,255,.065)}.fx-smart-card span{display:block;font-size:10px;font-weight:900;letter-spacing:.11em;opacity:.64}.fx-smart-card strong{display:block;margin:5px 0;font-size:17px;overflow-wrap:anywhere}.fx-smart-card small{display:block;line-height:1.35;opacity:.75}.fx-open-row{display:flex;align-items:center;gap:12px;margin-top:15px}.fx-open-row button{border:1px solid rgba(116,231,255,.36);border-radius:999px;padding:9px 14px;background:transparent;color:inherit;font-weight:800;cursor:pointer}.fx-open-row button.active{background:#74e7ff;color:#062130}.fx-open-row span{font-size:12px;opacity:.76}.fx-open-filter-hidden{display:none!important}@media(max-width:760px){.fx-smart-head{display:block}.fx-match-confidence{display:inline-block;margin-top:10px}.fx-smart-grid{grid-template-columns:1fr}.fx-open-row{align-items:flex-start;flex-direction:column}}
`;document.head.appendChild(st)}
function refresh(){addStyles();inject()}
window.finditSmartChoiceRefresh=refresh;
window.finditOpenNowState=knownOpenState;
document.addEventListener('findit:results-rendered',()=>{refresh();setTimeout(refresh,500);setTimeout(refresh,1600)});
document.addEventListener('findit:nearby-updated',refresh);
document.addEventListener('findit:dashboard-sync',refresh);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
setTimeout(refresh,350);setTimeout(refresh,1200);
})();
