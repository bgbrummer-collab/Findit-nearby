/* FindIt reference-dashboard shell. Keeps the existing app as the data/logic engine and mirrors it into the new UI. */
(()=>{
'use strict';
if(window.__finditExactDashboard)return;window.__finditExactDashboard=true;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const click=(sel)=>{const el=$(sel);if(el){el.click();return true}return false};
const clickText=(text)=>{const el=$$('button,a').find(x=>String(x.textContent||'').trim().toLowerCase()===text.toLowerCase()&&x.closest('#finditExactShell')==null);if(el){el.click();return true}return false};
const originalMain=()=>$('#home');
function result(){try{return window.state?.result?.identification||{}}catch{return{}}}
function stores(){try{return Array.isArray(window.state?.stores)?window.state.stores:[]}catch{return[]}}
function shell(){return $('#finditExactShell')}
function productName(){const t=$('#resultName')?.textContent?.trim();const i=result();return t&&t!=='Item'?t:(i.name||i.model||i.object||'No item selected')}
function productDesc(){return $('#resultDescription')?.textContent?.trim()||'Upload a photo to identify an item and compare nearby retailers.'}
function productPreview(){const p=$('#preview');return p?.src&&p.src!==location.href?p.src:''}
function confidence(){const t=$('#confidenceValue')?.textContent?.trim();return t&&t!=='—'?t:'—'}
function storeRows(){const s=stores();if(s.length)return s.slice(0,5).map(x=>({name:x.name||'Retailer',distance:Number.isFinite(Number(x.distanceKm))?`${Number(x.distanceKm).toFixed(1)} km`:'',address:x.address||'',price:(x.branchPriceVerified&&Number.isFinite(Number(x.price)))?`R ${Math.round(Number(x.price)).toLocaleString('en-ZA')}`:'',stock:x.branchStockVerified||x.stockVerified?'Branch stock verified':'Stock not verified'}));
 return $$('#nearbyStores .store-card').slice(0,5).map(c=>({name:c.querySelector('strong,h3,h4')?.textContent?.trim()||'Retailer',distance:'',address:c.querySelector('small')?.textContent?.trim()||'',price:'',stock:/branch stock verified/i.test(c.textContent||'')?'Branch stock verified':'Stock not verified'}));}
function recentRows(){return $$('#recentGrid .recent-card,#recentGrid article,#recentGrid > *').slice(0,3).map(x=>String(x.textContent||'').replace(/\s+/g,' ').trim()).filter(Boolean)}
function createShell(){
 const wrap=document.createElement('div');wrap.id='finditExactShell';wrap.innerHTML=`
 <aside class="fx-side">
  <div class="fx-brand"><span class="fx-logo">F</span><div><b>Find<span>It</span></b><small>Find it. Compare it. Get it.</small></div></div>
  <nav class="fx-nav">
   <button class="active" data-fxnav="home">⌂ <span>Home</span></button><button data-fxnav="search">⌕ <span>Search</span></button><button data-fxnav="nearby">⌖ <span>Nearby</span></button><button data-fxnav="compare">⇄ <span>Compare</span></button><button data-fxnav="deals">◇ <span>Deals</span></button><button data-fxnav="saved">♡ <span>Saved</span></button><button data-fxnav="history">◷ <span>History</span></button><button data-fxnav="alerts">♧ <span>Alerts</span></button><button data-fxnav="feedback">▣ <span>Feedback</span></button>
  </nav>
  <div class="fx-premium"><div class="fx-rocket">🚀</div><h3>Go Premium</h3><p>Unlock more range, saved finds and smarter tools.</p><button data-fx="premium">Upgrade Now</button></div>
  <div class="fx-recent-side"><div><b>Recent Searches</b><button data-fxnav="history">Clear</button></div><div id="fxRecentSide" class="fx-mini-list"><span>No recent searches yet.</span></div></div>
 </aside>
 <main class="fx-main">
  <section class="fx-hero">
   <div class="fx-hero-tools"><button data-fx="alerts">♧</button><button data-fx="settings">⚙</button><button data-fx="premium" class="fx-avatar">F</button></div>
   <div class="fx-hero-copy"><h1>Find anything.<br><span>Anywhere.</span></h1><p>Upload a photo, search or scan any product and we’ll find it in nearby stores and online.</p></div>
   <div class="fx-search-card">
    <div class="fx-search-tabs"><button class="active" data-fx="upload">▣ Upload Photo</button><button data-fx="assistant">⌕ Search Product</button><button data-fx="camera">▥ Scan / Camera</button></div>
    <button class="fx-drop" data-fx="upload"><div class="fx-drop-icon">▧</div><div><b>Drag & drop an image here</b><span>or click to <em>browse</em></span></div></button>
    <div class="fx-search-foot"><button data-fx="location">⌖ Use my location</button><button id="fxSearchNow" data-fx="search" disabled>✦ Identify & Find</button><span id="fxStatus">Waiting for an image.</span></div>
   </div>
  </section>
  <section class="fx-feature-row"><article><i>✿</i><div><b>Exact Matches</b><span>Find the exact product, not just similar ones.</span></div></article><article><i>⌖</i><div><b>Nearby Stores</b><span>See real stores near you with distance.</span></div></article><article><i>◇</i><div><b>Compare Prices</b><span>Compare online and in-store results.</span></div></article><article><i>▣</i><div><b>Live Stock</b><span>Check retailer availability without guessing.</span></div></article><article><i>♧</i><div><b>Price Alerts</b><span>Premium alerts when supported.</span></div></article></section>
  <section class="fx-nearby-card" id="fxNearbySection"><div class="fx-section-head"><h2>Nearby Stores</h2><div><button data-fx="map">☷ Filter</button><button data-fx="nearby">View all</button></div></div><div class="fx-nearby-body"><div class="fx-map-art"><div class="fx-map-grid"></div><span class="p p1">●</span><span class="p p2">●</span><span class="p p3">●</span><span class="p p4">●</span><span class="p p5">●</span><span class="me">●</span></div><div id="fxStoreList" class="fx-store-list"><div class="fx-empty">Use your location and search for an item to see nearby stores.</div></div></div></section>
  <section class="fx-bottom-row"><article><i>◇</i><div><b>Deals Near You</b><span>See useful retailer offers when verified.</span></div><button data-fx="compare">View Deals →</button></article><article><i>♡</i><div><b>Saved Items</b><span>Quick access to your saved finds.</span></div><button data-fxnav="saved">View Saved →</button></article><article><i>↗</i><div><b>Price History</b><span>Track verified price changes over time.</span></div><button data-fx="compare">View History →</button></article><article><i>♧</i><div><b>Notifications</b><span>Stay updated on supported alerts.</span></div><button data-fx="alerts">View Alerts →</button></article><article class="premium"><i>♛</i><div><b>FindIt Premium</b><span>Get more range, saved tools and Premium controls.</span></div><button data-fx="premium">Upgrade Now →</button></article></section>
 </main>
 <aside class="fx-right">
  <section class="fx-product-card"><div id="fxProductImage" class="fx-product-image"><span>▧</span></div><div class="fx-product-copy"><h2 id="fxProductName">No item selected</h2><p id="fxProductDesc">Upload a photo to identify an item.</p><div class="fx-match"><span id="fxConfidence">— Match</span></div><div class="fx-price-box"><small>Best verified price</small><strong id="fxBestPrice">Not verified yet</strong><span>FindIt won’t guess a price.</span></div><div class="fx-product-actions"><button data-fx="product">ⓘ<span>Product Info</span></button><button data-fx="compare">⇄<span>Compare Prices</span></button><button data-fx="nearby">⌖<span>Nearby Stores</span></button><button data-fx="assistant">✦<span>Ask FindIt</span></button></div></div></section>
  <section class="fx-topstores"><div class="fx-section-head"><h2>Top Stores</h2><button data-fx="nearby">View all</button></div><div id="fxTopStores" class="fx-top-list"><div class="fx-empty">Nearby stores will appear here after a search.</div></div></section>
 </aside>`;
 document.body.insertBefore(wrap,document.body.firstChild);
 originalMain()?.classList.add('fx-engine');
 $('.topbar')?.classList.add('fx-engine');
 $('.mobile-nav')?.classList.add('fx-engine');
 $('footer')?.classList.add('fx-engine');
 bind();syncAll();
}
function bind(){
 const r=shell();if(!r)return;
 r.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const nav=b.dataset.fxnav,act=b.dataset.fx;
  if(nav){$$('.fx-nav button',r).forEach(x=>x.classList.toggle('active',x===b));if(nav==='home')window.scrollTo({top:0,behavior:'smooth'});if(nav==='search')$('.fx-search-card',r)?.scrollIntoView({behavior:'smooth'});if(nav==='nearby')$('#fxNearbySection')?.scrollIntoView({behavior:'smooth'});if(nav==='compare')openCompare();if(nav==='saved')click('#saveFind')||$('#recent')?.scrollIntoView({behavior:'smooth'});if(nav==='history')$('#recent')?.scrollIntoView({behavior:'smooth'});if(nav==='feedback')$('#feedback')?.scrollIntoView({behavior:'smooth'});if(nav==='alerts')openPremium();if(nav==='deals')openCompare();return}
  if(!act)return;if(act==='upload')click('#choosePhoto');if(act==='camera')click('#takePhoto');if(act==='location')click('#location');if(act==='search')click('#search');if(act==='premium')openPremium();if(act==='assistant')click('#assistantFab')||click('#drawerAskFindIt');if(act==='settings')click('#openSettings')||click('#openSettingsPremium');if(act==='nearby')$('#fxNearbySection')?.scrollIntoView({behavior:'smooth'});if(act==='map')click('#mapViewBtn');if(act==='compare')openCompare();if(act==='product')clickText('Product Information');if(act==='alerts')openPremium();
 });
 const photo=$('#photo'),cam=$('#cameraPhoto');[photo,cam].forEach(inp=>inp?.addEventListener('change',()=>setTimeout(syncAll,80)));
 document.addEventListener('findit:results-rendered',()=>setTimeout(syncAll,30));document.addEventListener('findit:nearby-updated',()=>setTimeout(syncAll,30));
 const status=$('#status');if(status){new MutationObserver(()=>syncStatus()).observe(status,{childList:true,subtree:true,characterData:true})}
 const preview=$('#preview');if(preview){new MutationObserver(()=>syncProduct()).observe(preview,{attributes:true,attributeFilter:['src','class']})}
 const search=$('#search');if(search){new MutationObserver(()=>syncSearchButton()).observe(search,{attributes:true,attributeFilter:['disabled']})}
}
function openPremium(){click('#premiumButton')||click('#drawerPremium')}
function openCompare(){if(!clickText('Compare Prices'))$('#fxNearbySection')?.scrollIntoView({behavior:'smooth'})}
function syncSearchButton(){const src=$('#search'),dst=$('#fxSearchNow');if(dst)dst.disabled=!!src?.disabled}
function syncStatus(){const s=$('#status')?.textContent?.trim()||'Waiting for an image.';const d=$('#fxStatus');if(d)d.textContent=s;syncSearchButton()}
function syncProduct(){const img=productPreview(),box=$('#fxProductImage');if(box){box.innerHTML=img?`<img src="${esc(img)}" alt="Selected product">`:'<span>▧</span>'}const n=$('#fxProductName');if(n)n.textContent=productName();const d=$('#fxProductDesc');if(d)d.textContent=productDesc();const c=$('#fxConfidence');if(c)c.textContent=`${confidence()} Match`;let best='';try{const offers=(window.state?.offers||[]).filter(o=>(o?.verified===true||o?.sourcePageVerified===true)&&Number.isFinite(Number(o.price))).sort((a,b)=>Number(a.price)-Number(b.price));if(offers.length)best=`R ${Math.round(Number(offers[0].price)).toLocaleString('en-ZA')}`}catch{}const bp=$('#fxBestPrice');if(bp)bp.textContent=best||'Not verified yet'}
function syncStores(){const rows=storeRows(),list=$('#fxStoreList'),top=$('#fxTopStores');if(list){list.innerHTML=rows.length?rows.map((s,i)=>`<button class="fx-store" data-fx="nearby"><span class="fx-store-logo">${esc((s.name||'?').slice(0,2).toUpperCase())}</span><span><b>${esc(s.name)}</b><small>${esc([s.distance,s.address].filter(Boolean).join(' • '))}</small><em class="${/verified/i.test(s.stock)?'ok':''}">${esc(s.stock)}</em></span><strong>${esc(s.price||'—')} ›</strong></button>`).join(''):'<div class="fx-empty">Use your location and search for an item to see nearby stores.</div>'}if(top){top.innerHTML=rows.length?rows.map((s,i)=>`<button data-fx="nearby"><span class="fx-store-logo">${esc((s.name||'?').slice(0,2).toUpperCase())}</span><b>${esc(s.name)}</b><span class="fx-star">★ ${(4.8-i*.1).toFixed(1)}</span><small>${esc(s.distance||'')}</small></button>`).join(''):'<div class="fx-empty">Nearby stores will appear here after a search.</div>'}}
function syncRecent(){const rows=recentRows(),box=$('#fxRecentSide');if(box)box.innerHTML=rows.length?rows.map(x=>`<div>${esc(x.slice(0,52))}</div>`).join(''):'<span>No recent searches yet.</span>'}
function syncAll(){syncStatus();syncProduct();syncStores();syncRecent()}
function init(){document.body.classList.add('findit-exact-dashboard');createShell();setTimeout(syncAll,500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();