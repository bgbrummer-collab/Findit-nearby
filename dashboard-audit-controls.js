/* FindIt dashboard audit controls — user-first single-owner dashboard actions. */
(()=>{
'use strict';
if(window.__finditDashboardAuditControls)return;window.__finditDashboardAuditControls=true;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const st=()=>{try{return window.finditState||window.state||{}}catch{return{}}};
const positive=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))&&Number(v)>0;
const retailer=o=>String(o?.retailer?.name||o?.retailer||o?.store||o?.seller||'Retailer').trim();
const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const validUrl=v=>{try{return /^https?:$/.test(new URL(v).protocol)}catch{return false}};
const money=(n,c='ZAR')=>{if(!positive(n))return'Price not published';try{return new Intl.NumberFormat('en-ZA',{style:'currency',currency:c||'ZAR'}).format(Number(n))}catch{return`${c||'ZAR'} ${Number(n).toFixed(2)}`}};
const knownStock=v=>/^(in_stock|out_of_stock|preorder|backorder)$/i.test(String(v||''));
const stock=v=>({in_stock:'In stock online',out_of_stock:'Out of stock online',preorder:'Pre-order online',backorder:'Back-order online'}[String(v||'').toLowerCase()]||'Online stock not published');
function modal(title,html){let m=$('#fxStableModal');if(!m){m=document.createElement('div');m.id='fxStableModal';m.className='fx-stable-modal hidden';m.innerHTML='<div class="fx-stable-card"><button type="button" class="fx-stable-close" aria-label="Close">×</button><div id="fxStableBody"></div></div>';document.body.appendChild(m);m.addEventListener('click',e=>{if(e.target===m||e.target.closest('.fx-stable-close')){m.classList.add('hidden');m.setAttribute('aria-hidden','true')}})}let b=$('#fxStableBody');if(!b)return;b.innerHTML=`<h2 class="fx-stable-title">${esc(title)}</h2>${html}`;m.classList.remove('hidden');m.setAttribute('aria-hidden','false')}
function setActive(name){$$('#finditExactShell [data-fxnav]').forEach(x=>x.classList.toggle('active',x.dataset.fxnav===name))}
function home(){setActive('home');window.scrollTo({top:0,behavior:'smooth'})}
function search(){setActive('search');const x=$('#finditExactShell .fx-search-card')||$('#finder');x?.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>$('#choosePhoto')?.focus(),350)}
function nearby(){setActive('nearby');const x=$('#fxNearbySection')||$('#nearbyPanel');x?.scrollIntoView({behavior:'smooth',block:'start'})}
function currentOffers(){
 const raw=[...(Array.isArray(st()?.offers)?st().offers:[]),...(Array.isArray(window.productIntelligence?.offers)?window.productIntelligence.offers:[])];
 const best=new Map();
 for(const o of raw){
   if(!o||o.exactProductMatch===false)continue;
   if(!(o.sourcePageVerified===true||o.priceComparisonVerified===true||o.verified===true||o.searchGroundedVerified===true))continue;
   const k=norm(retailer(o));if(!k)continue;
   const old=best.get(k);
   const score=x=>(x?.sourcePageVerified===true?1000:0)+(x?.priceComparisonVerified===true?500:0)+(positive(x?.price)?200:0)+(knownStock(x?.availability)?120:0)+(x?.exactProductMatch===true?100:0);
   if(!old||score(o)>score(old)||(score(o)===score(old)&&positive(o.price)&&(!positive(old.price)||Number(o.price)<Number(old.price))))best.set(k,o);
 }
 return [...best.values()].sort((a,b)=>{const ap=positive(a.price),bp=positive(b.price);if(ap!==bp)return bp-ap;if(ap&&bp)return Number(a.price)-Number(b.price);return retailer(a).localeCompare(retailer(b))});
}
function offerRow(o,showPrice=true){const url=o.product_url||o.url;return`<div class="fx-stable-row"><div><b>${esc(retailer(o))}</b><small>${esc(o.product_name||st()?.result?.identification?.name||'Exact product')} · ${esc(stock(o.availability))}</small></div><div>${showPrice?`<b>${esc(money(o.price,o.currency||'ZAR'))}</b>`:''}${validUrl(url)?`<br><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">View product</a>`:''}</div></div>`}
function sortedStores(){return[...(Array.isArray(st()?.stores)?st().stores:[])].sort((a,b)=>Number(a.distanceKm??1e9)-Number(b.distanceKm??1e9))}
function compareHtml(){
 const offers=currentOffers(),priced=offers.filter(o=>positive(o.price)),unpriced=offers.filter(o=>!positive(o.price)),stores=sortedStores();
 return`<p class="fx-stable-sub">Verified exact-product results from your current Find. FindIt does not guess missing prices or branch stock.</p><div id="fxPriceStatus" class="fx-tool-status">${priced.length?`${priced.length} retailer${priced.length===1?'':'s'} with a verified/current price.`:'No trustworthy current price has been verified yet.'}</div><h3>Current online prices</h3><div id="fxOnlinePrices" class="fx-stable-list">${priced.length?priced.map(o=>offerRow(o,true)).join(''):'<div class="fx-stable-row"><div>No trustworthy current online price has been verified yet.</div></div>'}</div>${unpriced.length?`<h3>Exact listings without a published price</h3><div class="fx-stable-list">${unpriced.map(o=>offerRow(o,true)).join('')}</div>`:''}<h3>Nearby retailers</h3><div class="fx-stable-list">${stores.length?stores.slice(0,10).map(s=>`<div class="fx-stable-row"><div><b>${esc(s.name||'Store')}</b><small>${Number.isFinite(Number(s.distanceKm))?`${Number(s.distanceKm).toFixed(1)} km · `:''}${esc(s.address||'')} · Branch stock unknown unless this exact branch publishes inventory</small></div></div>`).join(''):'<div class="fx-stable-row"><div>No nearby retailer locations are available yet.</div></div>'}</div>`;
}
function stockHtml(){
 const offers=currentOffers(),known=offers.filter(o=>knownStock(o.availability)),unknown=offers.filter(o=>!knownStock(o.availability)),stores=sortedStores(),verifiedBranches=stores.filter(s=>s.branchStockVerified===true||s.stockVerified===true);
 return`<p class="fx-stable-sub">Online availability and physical-branch inventory are separate. FindIt only calls stock verified when the retailer publishes that evidence.</p><div id="fxStockStatus" class="fx-tool-status">${known.length?'Verified online stock evidence loaded.':'No retailer currently publishes a trustworthy online stock signal for this exact product.'}</div><h3>Verified online availability</h3><div id="fxStockRows" class="fx-stable-list">${known.length?known.map(o=>offerRow(o,false)).join(''):'<div class="fx-stable-row"><div>No verified online stock signal yet.</div></div>'}</div>${unknown.length?`<h3>Exact listings — stock not published</h3><div class="fx-stable-list">${unknown.map(o=>offerRow(o,false)).join('')}</div>`:''}<h3>Nearby branch stock</h3><div class="fx-stable-list">${verifiedBranches.length?verifiedBranches.map(s=>`<div class="fx-stable-row"><div><b>${esc(s.name||'Store')}</b><small>${s.inStock===false?'Verified out of stock at this branch':'Verified in stock at this branch'}${Number.isFinite(Number(s.distanceKm))?` · ${Number(s.distanceKm).toFixed(1)} km`:''}</small></div></div>`).join(''):'<div class="fx-stable-row"><div>No nearby branch has published branch-specific inventory. FindIt will not guess it.</div></div>'}</div>`;
}
function compare(){setActive('compare');modal('Compare Prices',compareHtml())}
function liveStock(){modal('Live Stock',stockHtml())}
function history(){setActive('history');let rows=[];for(const k of ['finditRecent','findit_recent','finditHistory']){try{const a=JSON.parse(localStorage.getItem(k)||'[]');if(Array.isArray(a)&&a.length){rows=a;break}}catch{}}modal('Recent Searches',rows.length?`<div class="fx-stable-list">${rows.slice(0,30).map(x=>`<div class="fx-stable-row"><div><b>${esc(x.name||x.query||x.searchQuery||x.object||'Find')}</b><small>${esc(x.category||x.retailCategory||x.savedAt||x.date||'')}</small></div></div>`).join('')}</div>`:'<p class="fx-stable-sub">No recent searches are saved on this device yet.</p>')}
function saved(){setActive('saved');let rows=[];for(const k of ['finditSaved','findit_saved','finditPremiumSaved','findit_v10_collections']){try{const a=JSON.parse(localStorage.getItem(k)||'[]');if(Array.isArray(a)&&a.length){rows=a;break}if(k==='findit_v10_collections'&&Array.isArray(a)){rows=a.flatMap(c=>Array.isArray(c.items)?c.items:[])}}catch{}}modal('Saved Items',rows.length?`<div class="fx-stable-list">${rows.slice(0,40).map(x=>`<div class="fx-stable-row"><div><b>${esc(x.name||x.query||x.searchQuery||x.object||'Saved Find')}</b><small>${esc(x.category||x.retailCategory||x.savedAt||'')}</small></div></div>`).join('')}</div>`:'<p class="fx-stable-sub">You have no saved Finds on this device yet.</p>')}
function alerts(){setActive('alerts');let rows=[];try{rows=JSON.parse(localStorage.getItem('findit_v10_watchlist')||'[]')}catch{}modal('Price & Stock Alerts',rows.length?`<p class="fx-stable-sub">Your watchlist is ready. FindIt only shows verified price or stock changes when monitoring data is available.</p><div class="fx-stable-list">${rows.map(x=>`<div class="fx-stable-row"><div><b>${esc(x.name||x.query||'Watched item')}</b><small>${esc(x.category||'')}</small></div></div>`).join('')}</div>`:'<p class="fx-stable-sub">No watched items yet. Add a product to your watchlist from Premium Tools first.</p>')}
function feedback(){setActive('feedback');const x=$('#feedback');if(x){x.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>$('#feedbackMessage')?.focus(),450)}else modal('Feedback','<p class="fx-stable-sub">Feedback is temporarily unavailable.</p>')}
function deals(){setActive('deals');modal('Deals',compareHtml())}
function route(a){if(a==='home')home();else if(a==='search')search();else if(a==='nearby')nearby();else if(a==='compare')compare();else if(a==='stock')liveStock();else if(a==='deals')deals();else if(a==='saved')saved();else if(a==='history')history();else if(a==='alerts')alerts();else if(a==='feedback')feedback();else return false;return true}
window.addEventListener('click',e=>{const el=e.target?.closest?.('#finditExactShell [data-fxnav],#finditExactShell [data-fx="stock"],#finditExactShell [data-fx="alerts"],#finditExactShell [data-fx="saved"],#finditExactShell [data-fx="history"],#finditExactShell [data-fx="feedback"],#finditExactShell [data-fx="deals"]');if(!el)return;let a=el.dataset.fxnav||el.dataset.fx;if(a==='nearby'&&/\bLive Stock\b/i.test(el.textContent||''))a='stock';if(!route(a))return;e.preventDefault();e.stopImmediatePropagation()},true);
window.finditDashboardAuditAction=route;
})();
