(()=>{
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const root=$('#app');if(!root)return;
function state(){return window.__finditState||null}
function result(){return state()?.result?.identification||{}}
function stores(){return state()?.stores||[]}
function productPreview(){const p=$('#preview');return p?.src&&p.src!==location.href?p.src:''}
function confidence(){const t=$('#confidenceValue')?.textContent?.trim();if(t&&t!=='—')return t;const n=Number(result().confidence);return Number.isFinite(n)?`${Math.round(n*100)}%`:'—'}
function storeRows(){return stores().slice(0,5).map(x=>({name:x.name||'Retailer',distance:Number.isFinite(Number(x.distanceKm))?`${Number(x.distanceKm).toFixed(1)} km`:'',address:x.address||'',price:(x.branchPriceVerified&&Number.isFinite(Number(x.price)))?`R ${Math.round(Number(x.price)).toLocaleString('en-ZA')}`:'',stock:x.branchStockVerified||x.stockVerified?'Branch stock verified':'Stock not verified',exact:x.exactProductMatch===true}))}
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
 const status=st?.coords?'New image and location ready. Identify it now.':'New image ready. Identify it now.';
 if($('#status'))$('#status').textContent=status;if($('#fxStatus'))$('#fxStatus').textContent=status;
 for(const input of [$('#photo'),$('#cameraPhoto')]){if(input&&input!==document.activeElement){try{input.value=''}catch{}}}
 try{document.dispatchEvent(new CustomEvent('findit:new-photo-selected',{detail:{name:file.name,type:file.type,size:file.size}}))}catch{}
}
function wireUploads(){
 const photo=$('#photo'),camera=$('#cameraPhoto');
 if(photo&&!photo.__fxRepeat){photo.__fxRepeat=true;photo.addEventListener('click',()=>{try{photo.value=''}catch{}},true);photo.addEventListener('change',e=>{const f=e.target.files?.[0];if(f)setTimeout(()=>applySelectedFile(f),0)})}
 if(camera&&!camera.__fxRepeat){camera.__fxRepeat=true;camera.addEventListener('click',()=>{try{camera.value=''}catch{}},true);camera.addEventListener('change',e=>{const f=e.target.files?.[0];if(f)setTimeout(()=>applySelectedFile(f),0)})}
 const drop=$('#dropzone');if(drop&&!drop.__fxRepeat){drop.__fxRepeat=true;drop.addEventListener('drop',e=>{const f=e.dataTransfer?.files?.[0];if(f)setTimeout(()=>applySelectedFile(f),0)},true)}
}
function useLocationDirect(btn){
 const st=state();if(!st)return;
 if(!navigator.geolocation){if($('#fxStatus'))$('#fxStatus').textContent='Location is not supported on this device.';return}
 if(btn){btn.disabled=true;btn.textContent='Locating…'}
 navigator.geolocation.getCurrentPosition(pos=>{
  st.coords={lat:pos.coords.latitude,lon:pos.coords.longitude};
  const source=$('#useLocation');if(source)source.textContent='✓ Location ready';
  if(btn){btn.disabled=false;btn.textContent='✓ Location ready'}
  if($('#fxStatus'))$('#fxStatus').textContent='Location ready. Choose a photo and identify it.';
  try{document.dispatchEvent(new CustomEvent('findit:location-ready',{detail:st.coords}))}catch{}
 },err=>{
  if(btn){btn.disabled=false;btn.textContent='Use my location'}
  if($('#fxStatus'))$('#fxStatus').textContent=err?.code===1?'Location permission was denied. Allow location in your browser and try again.':'Could not get your location. Try again.';
 },{enableHighAccuracy:false,timeout:12000,maximumAge:300000});
}
function createShell(){
 try{if('scrollRestoration' in history)history.scrollRestoration='manual'}catch{}
 try{window.scrollTo(0,0);requestAnimationFrame(()=>window.scrollTo(0,0));setTimeout(()=>window.scrollTo(0,0),60)}catch{}
 const wrap=document.createElement('div');wrap.id='finditExactShell';wrap.innerHTML=`
 <aside class="fx-side">
  <div class="fx-brand"><span class="fx-logo">F</span><div><b>Find<span>It</span></b><small>Find it. Compare it. Get it.</small></div></div>
  <nav class="fx-nav"><button class="active" data-scroll="fxHero">⌂ Home</button><button data-scroll="fxSearchCard">⌕ Identify</button><button data-scroll="fxNearby">◎ Nearby Stores</button><button data-scroll="fxProduct">▣ Product Info</button><button data-scroll="fxPrice">♧ Price Comparison</button><button data-scroll="fxRecent">↻ Recent Searches</button><button data-scroll="fxSettings">⚙ Settings</button></nav>
  <div class="fx-premium"><b>★ FindIt Premium</b><span>Unlock smarter matching & alerts.</span><button id="fxUpgrade">Upgrade</button></div>
  <div class="fx-recent-side"><strong>Recent Searches</strong><div id="fxRecent"></div></div>
 </aside>
 <main class="fx-main">
  <section class="fx-hero" id="fxHero"><div class="fx-hero-bg"></div><div class="fx-hero-tools"><button id="fxTheme">☾</button><button id="fxSettings">⚙</button></div><div class="fx-hero-copy"><span class="fx-kicker">AI-powered local shopping</span><h1>Find it.<br>Compare it.<br><em>Get it.</em></h1><p>Upload a photo. Find nearby stores that sell it. Compare prices. Save time.</p></div>
   <div class="fx-search-card" id="fxSearchCard"><div class="fx-search-tabs"><button class="active" id="fxUploadTab">▧ Upload Image</button><button id="fxCameraTab">▣ Take Photo</button><button id="fxTextTab">⌕ Search by Text</button></div><div class="fx-drop" id="fxDrop"><b>Drag & drop an image here</b><span>or</span><button id="fxChoose">Choose Image</button><small>JPG, PNG, WEBP · Max 10MB</small></div><div class="fx-search-foot"><button id="fxLocation">◎ Use my location</button><button class="primary" id="fxSearchNow">Identify Item →</button><span id="fxStatus">Waiting for an image.</span></div></div>
  </section>
  <section class="fx-feature-row"><article data-scroll="fxProduct"><i>▣</i><div><b>AI Product Identification</b><span>Recognizes products from photos</span></div></article><article data-scroll="fxNearby"><i>⌾</i><div><b>Nearby Store Finder</b><span>Shows stores closest to you</span></div></article><article data-scroll="fxPrice"><i>♧</i><div><b>Price Comparison</b><span>Compare verified offers</span></div></article><article><i>✓</i><div><b>Stock Availability</b><span>Only when a source verifies it</span></div></article><article><i>↗</i><div><b>Fast & Private</b><span>No account required</span></div></article></section>
  <section class="fx-nearby-card" id="fxNearby"><div class="fx-section-head"><div><span>NEAR YOU</span><h2>Nearby Stores</h2></div><button id="fxViewAll">View all stores →</button></div><div class="fx-nearby-body"><div class="fx-map-art"><div class="fx-map-lines"></div><div class="fx-pin p1">1</div><div class="fx-pin p2">2</div><div class="fx-pin p3">3</div><div class="fx-map-you">YOU</div></div><div class="fx-store-list" id="fxStoreList"><div class="fx-empty">Use your location and identify a photo to see nearby stores.</div></div></div></section>
  <section class="fx-bottom-row"><article data-scroll="fxProduct"><i>▣</i><div><b>Product Information</b><span>See brand, model and confidence</span></div></article><article data-scroll="fxPrice"><i>♧</i><div><b>Compare Prices</b><span>See verified offers when available</span></div></article><article><i>★</i><div><b>Price Alerts</b><span>Premium feature</span></div></article><article class="premium"><i>✦</i><div><b>FindIt Premium</b><span>Unlock smarter tools</span></div><button id="fxPremiumBottom">Upgrade →</button></article></section>
 </main>
 <aside class="fx-right">
  <section class="fx-product-card" id="fxProduct"><div class="fx-card-head"><b>Identified Product</b><span id="fxConfidence">— Match</span></div><div class="fx-product-image" id="fxProductImage"><span>Upload a photo to begin</span></div><div class="fx-product-copy"><h3 id="fxProductName">No item selected</h3><b id="fxProductMeta"></b><p id="fxProductDesc">FindIt will show the identified item here after a successful search.</p><div class="fx-chip" id="fxExactBadge">Waiting for result</div></div><div class="fx-price" id="fxPrice"><span>Best verified price</span><b id="fxBestPrice">Not verified yet</b></div><div class="fx-product-actions"><button id="fxCompare">♧<span>Compare</span></button><button id="fxMap">◎<span>Map</span></button><button id="fxSave">♡<span>Save</span></button><button id="fxShare">↗<span>Share</span></button></div></section>
  <section class="fx-topstores"><div class="fx-card-head"><b>Top Nearby Stores</b><button id="fxAllStores">View all</button></div><div id="fxTopStores"><div class="fx-empty">Nearby stores will appear here after a search.</div></div></section>
 </aside>`;
 document.body.insertBefore(wrap,root);root.classList.add('fx-source-hidden');
 bind();syncPremium();syncProduct();syncStores();
}
function bind(){
 const click=id=>$(id)?.click();
 $('#fxChoose').onclick=()=>click('#photo');$('#fxCameraTab').onclick=()=>click('#cameraPhoto');$('#fxUploadTab').onclick=()=>click('#photo');$('#fxSearchNow').onclick=()=>click('#search');
 $('#fxLocation').onclick=e=>useLocationDirect(e.currentTarget);$('#fxTextTab').onclick=()=>click('#textSearchBtn');$('#fxTheme').onclick=()=>click('#themeToggle');$('#fxSettings').onclick=()=>click('#settingsBtn');
 $('#fxUpgrade').onclick=()=>click('#premiumBtn');$('#fxPremiumBottom').onclick=()=>click('#premiumBtn');$('#fxCompare').onclick=()=>click('#compareBtn');$('#fxMap').onclick=()=>$('#fxNearby')?.scrollIntoView({behavior:'smooth'});$('#fxSave').onclick=()=>click('#saveBtn');$('#fxShare').onclick=()=>click('#shareBtn');$('#fxViewAll').onclick=()=>click('#viewAllStoresBtn');$('#fxAllStores').onclick=()=>click('#viewAllStoresBtn');
 $('#fxDrop').ondragover=e=>{e.preventDefault();e.currentTarget.classList.add('over')};$('#fxDrop').ondragleave=e=>e.currentTarget.classList.remove('over');$('#fxDrop').ondrop=e=>{e.preventDefault();e.currentTarget.classList.remove('over');const f=e.dataTransfer.files?.[0];if(f)applySelectedFile(f)};
 document.querySelectorAll('[data-scroll]').forEach(x=>x.onclick=()=>$('#'+x.dataset.scroll)?.scrollIntoView({behavior:'smooth'}));
 wireUploads();
}
function syncPremium(){const on=document.body.classList.contains('premium-active');$('#fxUpgrade')?.classList.toggle('active',on);if($('#fxUpgrade'))$('#fxUpgrade').textContent=on?'Premium active':'Upgrade'}
function syncProduct(){const i=result(),name=i.name||i.object||'';$('#fxProductName').textContent=name||'No item selected';$('#fxProductMeta').textContent=[i.brand,i.model].filter(Boolean).join(' · ');$('#fxProductDesc').textContent=i.description||i.visualDescription||(name?'Identified from your uploaded photo.':'FindIt will show the identified item here after a successful search.');$('#fxConfidence').textContent=`${confidence()} Match`;$('#fxExactBadge').textContent=i.exactProductMatch?'✓ Exact product identified':name?'Product identified':'Waiting for result';const src=productPreview();if(src)$('#fxProductImage').innerHTML=`<img src="${esc(src)}" alt="${esc(name||'Uploaded product')}">`;const offer=state()?.offers?.find(x=>x.priceVerified&&Number.isFinite(Number(x.price)));$('#fxBestPrice').textContent=offer?`R ${Math.round(Number(offer.price)).toLocaleString('en-ZA')}`:'Not verified yet'}
function syncStores(){const rows=storeRows();const html=rows.length?rows.map((x,i)=>`<article class="fx-store"><div class="fx-store-num">${i+1}</div><div><b>${esc(x.name)}</b><span>${esc(x.address||x.stock)}</span><small>${esc(x.distance)}</small></div><div><strong>${esc(x.price||'Price not verified')}</strong><button data-dir="${i}">Directions</button></div></article>`).join(''):'<div class="fx-empty">Use your location and identify a photo to see nearby stores.</div>';$('#fxStoreList').innerHTML=html;$('#fxTopStores').innerHTML=rows.length?rows.slice(0,3).map((x,i)=>`<article><span class="dot"></span><div><b>${esc(x.name)}</b><small>${esc(x.distance||x.stock)}</small></div><button data-dir="${i}">›</button></article>`).join(''):'<div class="fx-empty">Nearby stores will appear here after a search.</div>';document.querySelectorAll('[data-dir]').forEach(b=>b.onclick=()=>{const src=document.querySelectorAll('#nearbyStores .store-card')[Number(b.dataset.dir)]?.querySelector('[data-action="directions"]');src?.click()})}
function suppressPostIdentifyJourney(){
 const results=$('#results');if(results){results.classList.add('hidden');results.style.display='none'}
 try{window.scrollTo({top:0,left:0,behavior:'auto'})}catch{}
 setTimeout(()=>{if(results){results.classList.add('hidden');results.style.display='none'}try{window.scrollTo(0,0)}catch{}},0)
}
function syncAll(resultOverride){const st=state();if(resultOverride&&st)st.result=resultOverride;const s=$('#status')?.textContent?.trim()||'Waiting for an image.';if($('#fxStatus'))$('#fxStatus').textContent=s;const src=$('#search'),dst=$('#fxSearchNow');if(dst)dst.disabled=st?.file?false:!!src?.disabled;syncPremium();syncProduct();syncStores()}
function init(){document.body.classList.add('findit-exact-dashboard');createShell();setTimeout(()=>{wireUploads();syncAll()},500);document.addEventListener('findit:results-rendered',e=>{syncAll(e.detail?.result);suppressPostIdentifyJourney()});document.addEventListener('findit:nearby-updated',syncAll);window.addEventListener('storage',syncPremium)}
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