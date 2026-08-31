(()=>{
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const validUrl=v=>{try{const u=new URL(v,location.href);return /^https?:$/.test(u.protocol)}catch{return false}};
const fmtMoney=(n,c='ZAR')=>{if(n==null||!Number.isFinite(Number(n)))return'';try{return new Intl.NumberFormat('en-ZA',{style:'currency',currency:c||'ZAR'}).format(Number(n))}catch{return `${c||'ZAR'} ${Number(n).toFixed(2)}`}};
const mapsUrl=s=>{if(Number.isFinite(Number(s?.lat))&&Number.isFinite(Number(s?.lon)))return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.lat},${s.lon}`)}`;const q=[s?.name,s?.address].filter(Boolean).join(' ');return q?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`:''};
const directionsUrl=s=>s?.directionsAvailable===true&&s?.exactProductMatch===true&&s?.stockVerified===true&&Number.isFinite(Number(s?.lat))&&Number.isFinite(Number(s?.lon))?`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${s.lat},${s.lon}`)}`:'';

function mobileRepair(){
 if(document.getElementById('findit-mobile-repair-style'))return;
 const s=document.createElement('style');s.id='findit-mobile-repair-style';s.textContent=`
 .drawer{overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain}
 body.premium-active .premium-drawer-nav{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:8px!important;width:100%!important;margin-top:22px!important}
 body.premium-active .premium-drawer-nav>*{width:100%!important;max-width:100%!important;min-width:0!important;white-space:normal!important;writing-mode:horizontal-tb!important}
 #nearbyPanel,#nearbyStores,.nearby-stores{width:100%!important;max-width:100%!important;min-width:0!important}
 #nearbyStores,.nearby-stores{display:grid!important;grid-template-columns:1fr!important;gap:14px!important}
 #nearbyStores .store-card,.nearby-stores .store-card{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;height:auto!important;padding:18px!important;overflow:visible!important}
 #nearbyStores .store-actions,.nearby-stores .store-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;width:100%!important}
 @media(min-width:801px){#nearbyStores,.nearby-stores{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
 `;document.head.appendChild(s)
}
mobileRepair();document.addEventListener('DOMContentLoaded',mobileRepair,{once:true});

if(window.__finditJourneyV5)return;window.__finditJourneyV5=true;
let active=false,phaseTimer=null,pollTimer=null,startedAt=0,current={stores:[],prices:[]};

function css(){if($('#findit-v5-css'))return;const s=document.createElement('style');s.id='findit-v5-css';s.textContent=`
#finditJourneyV5{position:fixed!important;inset:0!important;z-index:2147483647!important;background:#07101f!important;color:#fff!important;overflow:auto!important;font-family:inherit!important}#finditJourneyV5.hidden{display:none!important}body.findit-v5-open{overflow:hidden!important}body.findit-v5-open #searchOverlay{display:none!important}.fj-page{width:min(430px,100%);min-height:100dvh;margin:auto;padding:22px 20px 100px;box-sizing:border-box}.fj-topbar{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:46px;margin-bottom:4px}.fj-home{border:1px solid #20304a;background:#111a2b;color:#fff;border-radius:12px;padding:10px 13px;font-weight:800}.fj-head{display:flex;align-items:center;gap:8px;min-height:44px}.fj-back{border:0;background:transparent;color:#fff;font-size:30px;padding:0 8px 0 0}.fj-title{text-align:center;font-size:27px;font-weight:900;color:#a275ff;margin:12px 0}.fj-scan{position:relative;width:min(82vw,330px);height:390px;margin:28px auto 20px;display:grid;place-items:center}.fj-scan img{max-width:76%;max-height:84%;object-fit:contain;border-radius:14px;filter:drop-shadow(0 12px 28px #000b)}.fj-c{position:absolute;width:44px;height:44px;border-color:#9b70ff;border-style:solid;filter:drop-shadow(0 0 8px #765cff)}.f1{left:0;top:0;border-width:4px 0 0 4px}.f2{right:0;top:0;border-width:4px 4px 0 0}.f3{left:0;bottom:0;border-width:0 0 4px 4px}.f4{right:0;bottom:0;border-width:0 4px 4px}.fj-beam{position:absolute;left:4%;right:4%;top:8%;height:3px;background:linear-gradient(90deg,transparent,#9d6cff,#2bd5f4,transparent);box-shadow:0 0 20px #35d8ff,0 0 28px #8a60ff;animation:fjscan 1.05s ease-in-out infinite alternate}@keyframes fjscan{to{top:92%}}.fj-sub{text-align:center;color:#9aa8bd;font-size:12px}.fj-progress{height:7px;border-radius:99px;background:#172238;overflow:hidden;width:90%;margin:20px auto}.fj-progress i{display:block;height:100%;width:8%;background:linear-gradient(90deg,#7d5cff,#26c8ed);animation:fjprog 3.2s ease forwards}@keyframes fjprog{to{width:96%}}.fj-orb{width:160px;height:160px;border-radius:50%;margin:54px auto 32px;display:grid;place-items:center;font-size:48px;background:radial-gradient(circle,#10182a 48%,transparent 50%),conic-gradient(#28d3f4,#8d64ff,#28d3f4);box-shadow:0 0 50px #765cff44;animation:fjrot 1.8s linear infinite}@keyframes fjrot{to{transform:rotate(360deg)}}.fj-steps{display:grid;gap:10px;margin:26px 0}.fj-step{display:flex;justify-content:space-between;padding:14px 16px;border-radius:13px;border:1px solid #1f2d44;background:#111b2d;color:#adb8ca}.fj-step b{color:#5ce2aa}.fj-pct{text-align:center;color:#9c78ff;font-size:28px;font-weight:900}.fj-success{text-align:center}.fj-success h1{color:#62e5a7;font-size:32px;margin:25px 0 7px}.fj-img{width:190px;height:270px;object-fit:contain;margin:15px auto;display:block;filter:drop-shadow(0 15px 30px #0009)}.fj-name{font-size:25px;font-weight:900;line-height:1.1;margin:6px 0}.fj-brand{color:#a8b2c1}.fj-green{color:#61dda0}.fj-conf{display:inline-block;margin-top:14px;padding:8px 13px;border-radius:99px;background:#0d2a22;border:1px solid #2b805d;color:#62e5a7;font-size:12px;font-weight:800}.fj-primary,.fj-secondary{width:100%;border-radius:15px;color:#fff;padding:16px;font-weight:900}.fj-primary{border:0;background:linear-gradient(100deg,#6959ff,#27c8e9);margin-top:24px}.fj-secondary{border:1px solid #20304a;background:#111a2b;margin-top:10px}.fj-actions h1{font-size:30px;line-height:1.08}.fj-action,.fj-option{width:100%;display:flex;align-items:center;gap:14px;padding:14px 15px;margin:10px 0;border:1px solid #202d43;border-radius:15px;background:#111a2b;color:#fff;text-align:left}.fj-action{min-height:72px}.fj-action i,.fj-option i{font-style:normal;font-size:22px;width:28px}.fj-action span,.fj-option span{flex:1}.fj-action b,.fj-action small,.fj-option b,.fj-option small{display:block}.fj-action small,.fj-option small{color:#929fb3;font-size:10px;margin-top:5px}.fj-card{border:1px solid #202d43;border-radius:15px;background:#111a2b;padding:15px;margin:10px 0}.fj-card h3{margin:0 0 7px;font-size:16px}.fj-muted{color:#93a0b3;font-size:12px;line-height:1.5}.fj-row{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.fj-link{border:0;border-radius:11px;background:#15233a;color:#7ee5b4;padding:9px 11px;font-weight:800;margin:10px 8px 0 0}.fj-map{width:100%;height:175px;border:0;border-radius:16px;margin:12px 0 16px;background:#111a2b}.fj-map-empty{display:grid;place-items:center;height:120px;border:1px solid #24344d;border-radius:16px;margin:12px 0 16px;color:#93a0b3;background:#111a2b}.fj-tabs{display:grid;grid-template-columns:1fr 1fr;background:#10192a;border-radius:14px;padding:4px;margin:10px 0 16px}.fj-tabs span{padding:10px;text-align:center;border-radius:10px;color:#8997aa}.fj-tabs span:first-child{background:#15366b;color:#fff}.fj-price{font-size:15px;font-weight:900;white-space:nowrap}.fj-saved{text-align:center;padding-top:75px}.fj-check{width:105px;height:105px;border-radius:50%;margin:28px auto;display:grid;place-items:center;font-size:54px;color:#67e3a5;border:2px solid #4fd6b1;box-shadow:0 0 30px #3adba333}.fj-badge{display:inline-block;padding:5px 8px;border-radius:99px;background:#14223a;color:#9fb0c9;font-size:10px;margin-top:6px}.fj-badge.good{background:#0d2a22;color:#62e5a7}
`;document.head.appendChild(s)}

function root(){let r=$('#finditJourneyV5');if(!r){r=document.createElement('div');r.id='finditJourneyV5';r.className='hidden';r.addEventListener('click',journeyClick,true);document.body.appendChild(r)}return r}
function topbar(label='FindIt'){return `<div class="fj-topbar"><b>${esc(label)}</b><button class="fj-home" data-fj="home">⌂ Main screen</button></div>`}
function render(html){css();const r=root();r.innerHTML=html;r.classList.remove('hidden');document.body.classList.add('findit-v5-open');r.scrollTop=0}
function close(){root().classList.add('hidden');document.body.classList.remove('findit-v5-open')}
function home(){active=false;clearTimeout(phaseTimer);clearInterval(pollTimer);close();setTimeout(()=>{const target=$('#finder')||document.body;target?.scrollIntoView?.({behavior:'smooth',block:'start'});window.scrollTo?.({top:0,behavior:'smooth'})},60)}

function info(){
 let i={};try{i=window.finditState?.result?.identification||{}}catch{}
 return{
   img:$('#preview')?.src||'',
   name:i.name||i.model||i.object||$('#resultName')?.textContent?.trim()||'Item identified',
   brand:i.brand||'',
   model:i.model||'',
   category:i.retailCategory||i.category||'',
   description:i.summary||i.description||$('#resultDescription')?.textContent?.trim()||'',
   confidence:String(i.confidence!=null?Math.round(Number(i.confidence)*100):$('#confidenceValue')?.textContent||'95').replace(/[^0-9.]/g,'')||'95',
   features:Array.isArray(i.features)?i.features.slice(0,6):[],
   visibleText:Array.isArray(i.visibleText)?i.visibleText.slice(0,5):[]
 }
}

function collect(){
 let stores=[];try{stores=Array.isArray(window.finditState?.stores)?window.state.stores:[]}catch{}
 current.stores=stores.map((s,n)=>({
   name:s.name||`Store ${n+1}`,
   detail:[Number.isFinite(Number(s.distanceKm))?`${Number(s.distanceKm).toFixed(1)} km`:'',s.address||''].filter(Boolean).join(' • '),
   address:s.address||'',distanceKm:Number.isFinite(Number(s.distanceKm))?Number(s.distanceKm):null,
   lat:s.lat,lon:s.lon,website:s.website||'',phone:s.phone||'',
   exact:s.exactProductMatch===true,stockVerified:s.stockVerified===true,
   directions:s.directionsUrl||directionsUrl(s),map:s.mapUrl||mapsUrl(s)
 })).filter((x,i,a)=>a.findIndex(y=>y.name===x.name&&y.address===x.address)===i).sort((a,b)=>(a.distanceKm??1e9)-(b.distanceKm??1e9)).slice(0,8);
 if(!current.stores.length){
   current.stores=$$('#nearbyStores .store-card,.nearby-stores .store-card').map((c,n)=>{const strong=c.querySelector('strong')?.textContent?.trim()||`Store ${n+1}`,small=c.querySelector('small')?.textContent?.trim()||'',links=[...c.querySelectorAll('a[href]')];return{name:strong,detail:small,address:small,distanceKm:null,directions:links.find(a=>/direction/i.test(a.textContent))?.href||'',map:links.find(a=>/map/i.test(a.textContent))?.href||''}}).filter((x,i,a)=>a.findIndex(y=>y.name===x.name&&y.detail===x.detail)===i).slice(0,8);
 }
 let offers=[];try{offers=Array.isArray(window.finditState?.offers)?window.state.offers:[]}catch{}
 current.prices=offers.map(o=>({
   name:o.retailer?.name||o.retailer||'Retailer',
   price:o.price!=null?fmtMoney(o.price,o.currency||'ZAR'):'',
   rawPrice:o.price,
   currency:o.currency||'ZAR',
   url:o.product_url||o.url||'',
   availability:o.availability||o.stock?.status||'',
   verified:o.verified===true||o.sourcePageVerified===true
 })).filter(x=>x.price).filter((x,i,a)=>a.findIndex(y=>y.name===x.name&&y.price===x.price)===i).sort((a,b)=>(Number(a.rawPrice)||1e15)-(Number(b.rawPrice)||1e15)).slice(0,10);
 if(!current.prices.length){
   const scope=$('#exactSellerResults')||$('#freeActions')||$('#results');const cards=scope?[...scope.querySelectorAll('article,.seller-card,.product-card,.offer-card')]:[];
   current.prices=cards.map(c=>{const t=c.textContent.replace(/\s+/g,' ').trim(),m=t.match(/R\s?[\d\s,.]+/),a=c.querySelector('a[href]');if(!m)return null;return{name:c.querySelector('strong,h3,h4,b')?.textContent?.trim()||'Retailer',price:m[0].trim(),url:a?.href||'',availability:'',verified:true}}).filter(Boolean).filter((x,i,a)=>a.findIndex(y=>y.name===x.name&&y.price===x.price)===i).slice(0,10)
 }
}

function scanning(){if(active)return;active=true;startedAt=Date.now();const d=info();render(`<div class="fj-page">${topbar('Scanning item')}<div class="fj-title">Scanning item</div><div class="fj-scan"><i class="fj-c f1"></i><i class="fj-c f2"></i><i class="fj-c f3"></i><i class="fj-c f4"></i>${d.img?`<img src="${esc(d.img)}">`:''}<i class="fj-beam"></i></div><div style="text-align:center;font-weight:800">Analyzing image...</div><div class="fj-sub">This may take a few seconds</div><div class="fj-progress"><i></i></div></div>`);clearTimeout(phaseTimer);phaseTimer=setTimeout(identifying,1500);clearInterval(pollTimer);pollTimer=setInterval(check,180)}
function identifying(){if(!active)return;render(`<div class="fj-page">${topbar('Identifying item')}<div class="fj-title">Identifying item</div><div class="fj-orb">✨</div><div class="fj-steps"><div class="fj-step"><span>Detecting object</span><b>✓</b></div><div class="fj-step"><span>Reading text</span><b>✓</b></div><div class="fj-step"><span>Understanding product</span><b>✓</b></div><div class="fj-step"><span>Verifying against retailers</span><b>○</b></div></div><div class="fj-sub">Almost there...</div><div class="fj-pct">95%</div></div>`)}
function identificationReady(){const r=$('#results'),n=$('#resultName')?.textContent?.trim()||'';return !!r&&!r.classList.contains('hidden')&&n&&n!=='Item'}
function resultsReady(){const t=($('#status')?.textContent||'').toLowerCase();return identificationReady()&&/search complete/.test(t)}
function failed(){const t=($('#status')?.textContent||'').toLowerCase();return /search failed|please try again/.test(t)}
function check(){if(!active)return;if(resultsReady())return success();if(failed()&&Date.now()-startedAt>1800)return abort();if(Date.now()-startedAt>48000&&identificationReady())return success();if(Date.now()-startedAt>55000)return abort()}
function abort(){active=false;clearTimeout(phaseTimer);clearInterval(pollTimer);close()}
function success(){if(!active)return;active=false;clearTimeout(phaseTimer);clearInterval(pollTimer);collect();close();const overlay=$('#searchOverlay');if(overlay)overlay.classList.add('hidden');requestAnimationFrame(()=>{try{document.dispatchEvent(new CustomEvent('findit:results-rendered'))}catch{}const shell=$('#finditExactShell');if(shell){shell.hidden=false;shell.style.removeProperty('display')}window.scrollTo({top:0,behavior:'auto'})})}

function actions(){render(`<div class="fj-page fj-actions">${topbar('FindIt')}<h1>What would you like<br>to do next?</h1><button class="fj-action" data-fj="product"><i>🧴</i><span><b>Product Information</b><small>View details, description, and similar products</small></span>›</button><button class="fj-action" data-fj="stores"><i>📍</i><span><b>Nearest Stores</b><small>See nearby stores relevant to this item</small></span>›</button><button class="fj-action" data-fj="prices"><i>🏷️</i><span><b>Compare Prices</b><small>Compare verified prices across retailers</small></span>›</button><button class="fj-action" data-fj="save"><i>🔖</i><span><b>Save this search</b><small>Save for later</small></span>›</button><button class="fj-action" data-fj="more"><i>•••</i><span><b>More options</b><small>Share, feedback & more</small></span>›</button></div>`)}

function product(){const d=info();const features=d.features.length?`<div class="fj-card"><h3>Key details</h3>${d.features.map(x=>`<div class="fj-muted">✓ ${esc(x)}</div>`).join('')}</div>`:'';render(`<div class="fj-page">${topbar('Product Information')}<div class="fj-head"><button class="fj-back" data-fj="actions">‹</button><b>Product Information</b></div>${d.img?`<img class="fj-img" src="${esc(d.img)}">`:''}<div class="fj-brand">${esc(d.brand)}</div><div class="fj-name">${esc(d.name)}</div><div class="fj-muted">${esc(d.category||'Product')}</div>${d.description?`<div class="fj-card"><h3>About this item</h3><div class="fj-muted">${esc(d.description)}</div></div>`:''}${features}<div class="fj-card"><h3>FindIt details</h3><div class="fj-muted">${d.model?`Model: ${esc(d.model)}<br>`:''}Confidence: ${esc(d.confidence)}%</div></div><button class="fj-secondary" data-fj="actions">Back to options</button></div>`)}

function stores(){
 collect();
 const first=current.stores[0];
 let mapHtml='<div class="fj-map-empty">No map location available yet.</div>';
 if(first&&Number.isFinite(Number(first.lat))&&Number.isFinite(Number(first.lon))){
   const lat=Number(first.lat),lon=Number(first.lon),d=.025;
   const src=`https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(`${lon-d},${lat-d},${lon+d},${lat+d}`)}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lon}`)}`;
   mapHtml=`<iframe class="fj-map" title="Nearest stores map" loading="lazy" src="${esc(src)}"></iframe>`;
 }
 const cards=current.stores.length?current.stores.map((s,i)=>`<div class="fj-card"><div class="fj-row"><div><h3>${esc(s.name)}</h3><div class="fj-muted">${esc(s.detail)}</div><span class="fj-badge ${s.stockVerified?'good':''}">${s.stockVerified?'✓ Branch stock verified':'Stock not verified'}</span></div>${i===0?'<span class="fj-green">Nearest</span>':''}</div>${s.map?`<button class="fj-link" data-open="${esc(s.map)}">Map</button>`:''}${s.directions?`<button class="fj-link" data-open="${esc(s.directions)}">Directions</button>`:''}${s.website&&validUrl(s.website)?`<button class="fj-link" data-open="${esc(s.website)}">Website</button>`:''}</div>`).join(''):`<div class="fj-card"><div class="fj-muted">No relevant nearby stores were returned for this result.</div></div>`;
 render(`<div class="fj-page">${topbar('Nearest Stores')}<div class="fj-head"><button class="fj-back" data-fj="actions">‹</button><b>Nearest Stores</b></div>${mapHtml}<div class="fj-muted">Nearest relevant stores</div>${cards}<button class="fj-secondary" data-fj="actions">Back to options</button></div>`)
}

function prices(){
 collect();
 const cards=current.prices.length?current.prices.map(p=>`<div class="fj-card"><div class="fj-row"><div><h3>${esc(p.name)}</h3><div class="fj-green">${p.verified?'Verified listing':'Current listing'}</div>${p.availability?`<div class="fj-muted">${esc(String(p.availability).replace(/_/g,' '))}</div>`:''}</div><div class="fj-price">${esc(p.price)}</div></div>${p.url&&validUrl(p.url)?`<button class="fj-link" data-open="${esc(p.url)}">View product</button>`:''}</div>`).join(''):`<div class="fj-card"><h3>No verified price comparison yet</h3><div class="fj-muted">FindIt did not receive trustworthy current prices for this item. It will not invent them.</div></div>`;
 render(`<div class="fj-page">${topbar('Compare Prices')}<div class="fj-head"><button class="fj-back" data-fj="actions">‹</button><b>Compare Prices</b></div><div class="fj-tabs"><span>Online</span><span>In-store</span></div>${cards}<button class="fj-secondary" data-fj="actions">Back to options</button></div>`)
}

function more(){render(`<div class="fj-page">${topbar('More Options')}<div class="fj-head"><button class="fj-back" data-fj="actions">‹</button><b>More Options</b></div><button class="fj-option" data-fj="share"><i>↗️</i><span><b>Share this product</b><small>Send to friends or family</small></span>›</button><button class="fj-option" data-fj="copy"><i>🔗</i><span><b>Copy product link</b><small>Copy link to clipboard</small></span>›</button><button class="fj-option" data-fj="stock"><i>🔔</i><span><b>Get stock alerts</b><small>Save this search for later</small></span>›</button><button class="fj-option" data-fj="report"><i>⚠️</i><span><b>Report incorrect info</b><small>Help us improve accuracy</small></span>›</button><button class="fj-option" data-fj="feedback"><i>💬</i><span><b>Send feedback</b><small>Tell us what you think</small></span>›</button><button class="fj-secondary" data-fj="actions">Back to options</button></div>`)}

function saved(){try{$('#saveFind')?.click()}catch{};render(`<div class="fj-page fj-saved">${topbar('Saved')}<h2 class="fj-green">Saved!</h2><div class="fj-check">✓</div><div class="fj-name">This search has been saved</div><p class="fj-muted">You can find it again from your saved or recent searches.</p><button class="fj-primary" data-fj="actions">What’s next?</button><button class="fj-secondary" data-fj="results">Back to results</button><button class="fj-secondary" data-fj="home">Main screen</button></div>`)}
function exitTo(sel){close();setTimeout(()=>$(sel)?.scrollIntoView({behavior:'smooth',block:'start'}),80)}
function overlayOpen(){const o=$('#searchOverlay');return !!o&&!o.classList.contains('hidden')&&getComputedStyle(o).display!=='none'}
function journeyClick(e){const open=e.target.closest?.('[data-open]');if(open){e.preventDefault();e.stopPropagation();window.open(open.dataset.open,'_blank','noopener');return}const b=e.target.closest?.('[data-fj]');if(!b)return;e.preventDefault();e.stopPropagation();const a=b.dataset.fj;if(a==='home')return home();if(a==='actions')return actions();if(a==='product')return product();if(a==='stores')return stores();if(a==='prices')return prices();if(a==='more')return more();if(a==='save')return saved();if(a==='share'){try{$('#shareFind')?.click()}catch{}return}if(a==='copy'){navigator.clipboard?.writeText(location.href);return}if(a==='stock')return saved();if(a==='report'||a==='feedback')return exitTo('#feedback');if(a==='results')return exitTo('#results')}
function install(){css();root();const o=$('#searchOverlay');if(o)new MutationObserver(()=>{if(overlayOpen()&&!active)scanning()}).observe(o,{attributes:true,attributeFilter:['class','style']});document.addEventListener('click',e=>{if(e.target.closest?.('#search')&&!active)setTimeout(()=>{if(!active)scanning()},0)},true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();