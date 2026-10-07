/* FindIt full reference dashboard shell. Existing app remains underneath as the logic engine. */
(()=>{
'use strict';
if(window.__finditExactDashboard)return;window.__finditExactDashboard=true;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const originalMain=()=>$('#home');
function state(){try{return window.finditState||window.state||null}catch{return null}}
function result(){try{return state()?.result?.identification||{}}catch{return{}}}
function stores(){try{return Array.isArray(state()?.stores)?state().stores:[]}catch{return[]}}
function premiumActive(){try{return localStorage.getItem('findit_premium_beta')==='1'||localStorage.getItem('finditPremium')==='1'||localStorage.getItem('finditPremium')==='true'||window.premiumState?.active===true||document.body.classList.contains('premium-active')}catch{return false}}
function productName(){const t=$('#resultName')?.textContent?.trim();const i=result();return t&&t!=='Item'?t:(i.name||i.model||i.object||'No item selected')}
function productDesc(){return $('#resultDescription')?.textContent?.trim()||result().summary||'Upload a photo to identify an item and compare nearby retailers.'}
function productPreview(){const p=$('#preview');return p?.src&&p.src!==location.href?p.src:''}
function confidence(){const t=$('#confidenceValue')?.textContent?.trim();if(t&&t!=='—')return t;const n=Number(result().confidence);return Number.isFinite(n)?`${Math.round(n*100)}%`:'—'}
function storeRows(){const near=stores().slice(0,5).map(x=>({name:x.name||'Retailer',distance:Number.isFinite(Number(x.distanceKm))?`${Number(x.distanceKm).toFixed(1)} km`:'',address:x.address||'',price:(x.branchPriceVerified&&Number(x.price)>0)?`R ${Number(x.price).toLocaleString('en-ZA',{maximumFractionDigits:2})}`:'',stock:x.branchStockVerified?'Branch stock verified':'Branch stock not verified',exact:x.exactProductMatch===true,url:x.product_url||x.url||''}));
 const offers=(Array.isArray(state()?.offers)?state().offers:[]).filter(o=>(o?.verified===true||o?.sourcePageVerified===true||o?.priceComparisonVerified===true)&&o?.exactProductMatch===true).map(o=>({name:o?.retailer?.name||o?.retailer||'Retailer',distance:'Online',address:'Verified exact-product retailer listing',price:Number(o.price)>0?`R ${Number(o.price).toLocaleString('en-ZA',{maximumFractionDigits:2})}`:'',stock:o.availability==='in_stock'?'Online stock verified':o.availability==='out_of_stock'?'Online out of stock':'Stock not verified',exact:true,url:o.product_url||o.url||''}));
 const seen=new Set(),rows=[];for(const x of [...near,...offers]){const k=String(x.name).toLowerCase();if(!k||seen.has(k))continue;seen.add(k);rows.push(x);if(rows.length>=5)break}return rows}
let previewUrl='';
function resetForNewPhoto(st){
 if(!st)return;
 st.result=null;st.stores=[];st.offers=[];
 try{window.productIntelligence=null}catch{}
 const results=$('#results');if(results)results.classList.add('hidden');
 const resultName=$('#resultName');if(resultName)resultName.textContent='Item';
 const resultDescription=$('#resultDescription');if(resultDescription)resultDescription.textContent='';
 const resultMeta=$('#resultMeta');if(resultMeta)resultMeta.innerHTML='';
 const resultNote=$('#resultNote');if(resultNote)resultNote.innerHTML='';
 const confidence=$('#confidenceValue');if(confidence)confidence.textContent='—';
 const nearby=$('#nearbyStores');if(nearby)nearby.innerHTML='';
 if($('#fxProductName'))$('#fxProductName').textContent='No item selected';
 if($('#fxProductMeta'))$('#fxProductMeta').textContent='';
 if($('#fxProductDesc'))$('#fxProductDesc').textContent='New photo selected. Ready to identify.';
 if($('#fxConfidence'))$('#fxConfidence').textContent='— Match';
 if($('#fxExactBadge'))$('#fxExactBadge').textContent='Waiting for result';
 if($('#fxBestPrice'))$('#fxBestPrice').textContent='Not verified yet';
 if($('#fxStoreList'))$('#fxStoreList').innerHTML='<div class="fx-empty">Use your location and identify this photo to see nearby stores.</div>';
 if($('#fxTopStores'))$('#fxTopStores').innerHTML='<div class="fx-empty">Nearby stores will appear here after a search.</div>';
}
function applySelectedFile(file){
 if(!file)return;
 const st=state();
 resetForNewPhoto(st);
 if(st)st.file=file;
 const p=$('#preview');
 if(p){try{if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=URL.createObjectURL(file);p.src=previewUrl;p.classList.remove('hidden')}catch{}}
 const ph=$('#uploadPlaceholder');if(ph)ph.classList.add('hidden');
 const box=$('#fxProductImage');if(box&&p?.src)box.innerHTML=`<img src="${esc(p.src)}" alt="Selected product">`;
 const search=$('#search');if(search)search.disabled=false;
 const fx=$('#fxSearchNow');if(fx)fx.disabled=false;
 // Mirror camera selections into the legacy photo input because the native search pipeline reads #photo.
 // Do not rewrite #photo when #photo itself fired the change event; doing so can race the native handler on mobile.
 try{if(file&&p&&document.activeElement!==p&&p.files?.[0]!==file){const dt=new DataTransfer();dt.items.add(file);p.files=dt.files}}catch{}
 const status=st?.coords?'New image and location ready. Identify it now.':'New image ready. Identify it now.';
 if($('#status'))$('#status').textContent=status;if($('#fxStatus'))$('#fxStatus').textContent=status;
 // Keep the selected file on the native input until identification finishes.
 // The picker is already cleared immediately before opening, so the same file can still be selected again later.
 try{document.dispatchEvent(new CustomEvent('findit:new-photo-selected',{detail:{name:file.name,type:file.type,size:file.size}}))}catch{}
}
function wireUploads(){
 const photo=$('#photo'),camera=$('#cameraPhoto');

 if(photo&&!photo.dataset.fxBridge){photo.dataset.fxBridge='1';photo.addEventListener('change',e=>applySelectedFile(e.target.files?.[0]))}
 if(camera&&!camera.dataset.fxBridge){camera.dataset.fxBridge='1';camera.addEventListener('change',e=>applySelectedFile(e.target.files?.[0]))}
 const drop=$('#finditExactShell .fx-drop');if(drop&&!drop.dataset.fxDropBridge){drop.dataset.fxDropBridge='1';['dragenter','dragover'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault()}));drop.addEventListener('drop',e=>{e.preventDefault();applySelectedFile(e.dataTransfer?.files?.[0])})}
}
function useLocationDirect(btn){
 if(!navigator.geolocation){if($('#fxStatus'))$('#fxStatus').textContent='Location is not supported in this browser.';return}
 const old=btn?.textContent||'⌖ Use my location';if(btn){btn.disabled=true;btn.textContent='⌖ Getting location…'}
 if($('#fxStatus'))$('#fxStatus').textContent='Getting your location…';
 navigator.geolocation.getCurrentPosition(pos=>{
  const st=state();if(st)st.coords={lat:pos.coords.latitude,lon:pos.coords.longitude};
  if(btn){btn.disabled=false;btn.textContent='✓ Location ready'}
  const native=$('#location');if(native)native.textContent='✓ Location ready';
  const text=st?.file?'Image and location ready. Identify it now.':'Location ready. Upload an image.';
  if($('#status'))$('#status').textContent=text;if($('#fxStatus'))$('#fxStatus').textContent=text;
  try{document.dispatchEvent(new CustomEvent('findit:location-ready',{detail:st?.coords}))}catch{}
 },err=>{
  if(btn){btn.disabled=false;btn.textContent=old}
  const text=err?.code===1?'Location permission was denied. Allow location for FindIt, then try again.':'Could not get your location. Please try again.';
  if($('#status'))$('#status').textContent=text;if($('#fxStatus'))$('#fxStatus').textContent=text;
 },{enableHighAccuracy:false,timeout:12000,maximumAge:300000});
}
function createShell(){
 try{if('scrollRestoration' in history)history.scrollRestoration='manual'}catch{}
 try{window.scrollTo(0,0);requestAnimationFrame(()=>window.scrollTo(0,0));setTimeout(()=>window.scrollTo(0,0),60)}catch{}
 const wrap=document.createElement('div');wrap.id='finditExactShell';wrap.innerHTML=`
 <aside class="fx-side">
  <div class="fx-brand"><span class="fx-logo">F</span><div><b>Find<span>It</span></b><small>Find it. Compare it. Get it.</small></div></div>
  <nav class="fx-nav"><button class="active" data-fxnav="home">⌂ <span>Home</span></button><button data-fxnav="search">⌕ <span>Search</span></button><button data-fxnav="nearby">⌖ <span>Nearby</span></button><button data-fxnav="compare">⇄ <span>Compare</span></button><button data-fxnav="deals">◇ <span>Deals</span></button><button data-fxnav="saved">♡ <span>Saved</span></button><button data-fxnav="history">◷ <span>History</span></button><button data-fxnav="alerts">♧ <span>Alerts</span></button><button data-fxnav="feedback">▣ <span>Feedback</span></button></nav>
  <div class="fx-premium"><div class="fx-rocket">🚀</div><h3 id="fxPremiumTitle">Go Premium</h3><p id="fxPremiumCopy">Unlock exact matches, price alerts, stock checks & more.</p><button id="fxPremiumSideButton" data-fx="premium">Upgrade Now</button></div>
  <div class="fx-recent-side"><div><b>Recent Searches</b><button data-fxnav="history">View all</button></div><div id="fxRecentSide" class="fx-mini-list"><span>No recent searches yet.</span></div></div>
 </aside>
 <main class="fx-main"><header class="fx-topbar"><div class="fx-global-search">⌕ <span>Search or upload an image to find anything...</span></div><div class="fx-top-location">⌖ <span>Nearby</span></div><button data-fx="settings">⚙</button><button data-fx="alerts">♧</button><button data-fx="premium" class="fx-avatar">F</button></header>
  <section class="fx-hero"><div class="fx-hero-tools"><button data-fx="alerts" aria-label="Alerts">♧</button><button data-fx="premium" class="fx-avatar" aria-label="Profile">F</button></div><div class="fx-hero-copy"><div class="fx-ai-kicker">✦ AI powered product search</div><h1>Find <span>anything</span><br>nearby.</h1><p>Take a photo, upload an image, or search by text and we’ll find where to buy it near you.</p></div><div class="fx-search-card"><div class="fx-search-tabs"><button type="button" class="active fx-upload-label" data-upload-picker="photo">▣ Upload Photo</button><button data-fx="assistant">⌕ Search Product</button><button data-upload-picker="cameraPhoto">▥ Scan / Camera</button></div><button type="button" class="fx-drop" data-upload-picker="photo"><div class="fx-drop-icon">▧</div><div><b>Drag & drop an image here</b><span>or click to <em>browse</em></span></div></button><div class="fx-search-foot"><button data-location-direct="1">⌖ Use my location</button><button id="fxSearchNow" data-fx="search" disabled>✦ Identify & Find</button><span id="fxStatus">Waiting for an image.</span></div></div></section>
  <section class="fx-feature-row"><article data-fx="product"><i>✓</i><div><b>Exact match</b><span>See the identified product and only supported identity details.</span></div></article><article data-fx="compare"><i>R</i><div><b>Real prices</b><span>Compare retailer prices only when FindIt can verify them.</span></div></article><article data-fx="nearby"><i>⌖</i><div><b>Nearby stores</b><span>See relevant stores around your selected location.</span></div></article><article data-fx="nearby"><i>▣</i><div><b>Live stock</b><span>Branch stock appears only when retailer evidence confirms it.</span></div></article><article data-fx="compare"><i>⇄</i><div><b>Compare</b><span>Compare verified offers without invented prices or availability.</span></div></article></section>
  <section class="fx-result-strip"><div><small>Results for your image</small><b id="fxResultStripName">Upload an image to start</b><span id="fxResultStripMeta">FindIt will show verified product and retailer information here.</span></div><div><button data-fx="saved">♡ Save</button><button data-fx="compare">⇄ Compare</button></div></section><section class="fx-nearby-card" id="fxNearbySection"><div class="fx-section-head"><h2>Nearby Stores</h2><div><button data-fx="map">☷ Filter</button><button data-fx="nearby">View all</button></div></div><div class="fx-nearby-body"><div class="fx-map-art"><div class="fx-map-grid"></div><span class="p p1">●</span><span class="p p2">●</span><span class="p p3">●</span><span class="p p4">●</span><span class="p p5">●</span><span class="me">●</span></div><div id="fxStoreList" class="fx-store-list"><div class="fx-empty">Use your location and search for an item to see nearby stores.</div></div></div></section>
  <section class="fx-bottom-row"><article data-fx="deals"><i>◇</i><div><b>Deals Near You</b><span>See verified retailer offers when available.</span></div><button data-fx="deals">View Deals →</button></article><article data-fx="saved"><i>♡</i><div><b>Saved Items</b><span>Open the Finds you saved on this device.</span></div><button data-fx="saved">View Saved →</button></article><article data-fx="pricehistory"><i>↗</i><div><b>Price History</b><span>See verified price observations when available.</span></div><button data-fx="pricehistory">View History →</button></article><article data-fx="alerts"><i>♧</i><div><b>Notifications</b><span>Open supported price and stock alerts.</span></div><button data-fx="alerts">View Alerts →</button></article><article class="premium" data-fx="premium"><i>♛</i><div><b id="fxPremiumBottomTitle">FindIt Premium</b><span id="fxPremiumBottomCopy">Get more range, saved tools and Premium controls.</span></div><button id="fxPremiumBottomButton" data-fx="premium">Upgrade Now →</button></article></section>
 </main>
 <aside class="fx-right"><section class="fx-product-card"><div id="fxProductImage" class="fx-product-image"><span>▧</span></div><div class="fx-product-copy"><div id="fxExactBadge" class="fx-result-badge">Waiting for result</div><h2 id="fxProductName">No item selected</h2><p id="fxProductMeta"></p><p id="fxProductDesc">Upload a photo to identify an item.</p><div class="fx-match"><span id="fxConfidence">— Match</span></div><div class="fx-price-box"><small>Best verified price</small><strong id="fxBestPrice">Not verified yet</strong><span>FindIt won’t guess a price.</span></div><div class="fx-product-actions"><button data-fx="product">ⓘ<span>Product Info</span></button><button data-fx="compare">⇄<span>Compare Prices</span></button><button data-fx="nearby">⌖<span>Nearby Stores</span></button><button data-fx="assistant">✦<span>Ask FindIt</span></button></div></div></section><section class="fx-topstores"><div class="fx-section-head"><h2>Top Stores</h2><button data-fx="nearby">View all</button></div><div id="fxTopStores" class="fx-top-list"><div class="fx-empty">Nearby stores will appear here after a search.</div></div></section></aside>`;
 document.body.insertBefore(wrap,document.body.firstChild);const nativePhoto=$('#photo');if(nativePhoto){nativePhoto.dataset.uploadPicker='photo';nativePhoto.setAttribute('aria-label','Upload product photo')}originalMain()?.classList.add('fx-engine');$('.topbar')?.classList.add('fx-engine');$('.mobile-nav')?.classList.add('fx-engine');$('footer')?.classList.add('fx-engine');
 wrap.addEventListener('click',e=>{const loc=e.target.closest?.('[data-location-direct]');if(loc){e.preventDefault();e.stopImmediatePropagation();useLocationDirect(loc);return}const b=e.target.closest?.('[data-upload-picker]');if(!b)return;const input=$('#'+b.dataset.uploadPicker);if(!input)return;e.preventDefault();e.stopImmediatePropagation();input.value='';input.click()},true);
 wireUploads();syncAll();
}
function syncPremium(){const on=premiumActive();const sideTitle=$('#fxPremiumTitle'),sideCopy=$('#fxPremiumCopy'),sideButton=$('#fxPremiumSideButton'),bottomTitle=$('#fxPremiumBottomTitle'),bottomCopy=$('#fxPremiumBottomCopy'),bottomButton=$('#fxPremiumBottomButton');if(sideTitle)sideTitle.textContent=on?'Premium Active':'Go Premium';if(sideCopy)sideCopy.textContent=on?'Your Premium tools are active on this device.':'Unlock exact matches, price alerts, stock checks & more.';if(sideButton)sideButton.textContent=on?'Premium Tools':'Upgrade Now';if(bottomTitle)bottomTitle.textContent=on?'FindIt Premium Active':'FindIt Premium';if(bottomCopy)bottomCopy.textContent=on?'Your extended FindIt tools are unlocked.':'Get more range, saved tools and Premium controls.';if(bottomButton)bottomButton.textContent=on?'Open Premium →':'Upgrade Now →';const avatar=$('.fx-avatar');if(avatar)avatar.textContent=on?'P':'F'}
function syncProduct(){const i=result(),img=productPreview(),box=$('#fxProductImage');if(box)box.innerHTML=img?`<img src="${esc(img)}" alt="Selected product">`:'<span>▧</span>';if($('#fxProductName'))$('#fxProductName').textContent=productName();if($('#fxResultStripName'))$('#fxResultStripName').textContent=productName();if($('#fxResultStripMeta'))$('#fxResultStripMeta').textContent=productDesc();if($('#fxProductDesc'))$('#fxProductDesc').textContent=productDesc();if($('#fxProductMeta'))$('#fxProductMeta').textContent=[i.brand,i.model,i.category||i.retailCategory].filter(Boolean).join(' · ');if($('#fxConfidence'))$('#fxConfidence').textContent=`${confidence()} Match`;if($('#fxExactBadge'))$('#fxExactBadge').textContent=i.exactIdentityVerified===true?'Exact identity verified':(Object.keys(i).length?'AI identified':'Waiting for result');let best='';try{const os=(state()?.offers||[]).filter(o=>(o?.verified===true||o?.sourcePageVerified===true)&&Number(o.price)>0).sort((a,b)=>Number(a.price)-Number(b.price));if(os.length)best=`R ${Number(os[0].price).toLocaleString('en-ZA',{maximumFractionDigits:2})}`}catch{}if($('#fxBestPrice'))$('#fxBestPrice').textContent=best||'Not verified yet';const os=(Array.isArray(state()?.offers)?state().offers:[]).filter(o=>(o?.verified===true||o?.sourcePageVerified===true||o?.priceComparisonVerified===true)&&o?.exactProductMatch===true);const meta=os.filter(o=>Number(o.price)>0).map(o=>`${o?.retailer?.name||o?.retailer||'Retailer'}: R ${Number(o.price).toLocaleString('en-ZA',{maximumFractionDigits:2})}${o.availability==='in_stock'?' · online in stock':o.availability==='out_of_stock'?' · online out of stock':''}`).slice(0,3).join(' • ');if(meta&&$('#fxResultStripMeta'))$('#fxResultStripMeta').textContent=meta}
function syncStores(){const rows=storeRows(),list=$('#fxStoreList'),top=$('#fxTopStores');if(list)list.innerHTML=rows.length?rows.map(s=>`<button class="fx-store" data-fx="nearby"><span class="fx-store-logo">${esc((s.name||'?').slice(0,2).toUpperCase())}</span><span><b>${esc(s.name)}</b><small>${esc([s.distance,s.address].filter(Boolean).join(' • '))}</small><em class="${/verified/i.test(s.stock)?'ok':''}">${esc(s.stock)}</em></span><strong>${esc(s.price||'—')} ›</strong></button>`).join(''):'<div class="fx-empty">Use your location and search for an item to see nearby stores.</div>';if(top)top.innerHTML=rows.length?rows.map(s=>`<button data-fx="nearby"><span class="fx-store-logo">${esc((s.name||'?').slice(0,2).toUpperCase())}</span><b>${esc(s.name)}</b><span class="fx-star">${s.exact?'Exact match':(/verified/i.test(s.stock)?'Stock verified':'Nearby')}</span><small>${esc(s.distance||'')}</small></button>`).join(''):'<div class="fx-empty">Nearby stores will appear here after a search.</div>'}
function suppressPostIdentifyJourney(){
 const hide=()=>{
  ['#finditJourneyV5','#finditJourney','#journeyOverlay','#journeyScreen','.journey-overlay','.journey-screen'].forEach(sel=>$$(sel).forEach(el=>{el.classList.add('hidden');el.hidden=true;el.style.setProperty('display','none','important');el.setAttribute('aria-hidden','true')}));
  document.body.classList.remove('findit-v5-open','findit-journey-open','findit-journey-v5-open','journey-open','fj-open','modal-open');
  document.documentElement.classList.remove('findit-v5-open','findit-journey-open','findit-journey-v5-open','journey-open','fj-open','modal-open');
  const shell=$('#finditExactShell');if(shell){shell.hidden=false;shell.style.removeProperty('display')}
 };
 hide();[50,250,700,1500,3000].forEach(ms=>setTimeout(hide,ms));
}
function syncAll(resultOverride){const st=state();if(resultOverride&&st)st.result=resultOverride;const s=$('#status')?.textContent?.trim()||'Waiting for an image.';if($('#fxStatus'))$('#fxStatus').textContent=s;const src=$('#search'),dst=$('#fxSearchNow');if(dst)dst.disabled=st?.file?false:!!src?.disabled;syncPremium();syncProduct();syncStores()}
function init(){document.body.classList.add('findit-exact-dashboard');createShell();setTimeout(()=>{wireUploads();syncAll()},500);document.addEventListener('findit:results-rendered',e=>{syncAll(e.detail?.result);suppressPostIdentifyJourney()});document.addEventListener('findit:nearby-updated',()=>syncAll());window.addEventListener('storage',syncPremium)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

/* Use one stable dashboard interaction runtime only. */
(()=>{
 const load=()=>setTimeout(()=>{
  if(window.__finditDashboardRuntimeLoader)return;
  window.__finditDashboardRuntimeLoader=true;
  const s=document.createElement('script');s.src='/dashboard-runtime-stable.js?v=20260831-controls3';s.async=true;document.head.appendChild(s);
 },0);
 if(document.readyState==='complete')load();else window.addEventListener('load',load,{once:true});
})();