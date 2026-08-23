
/* FINDIT GLOBAL COUNTRY + CURRENCY DISPLAY
   Retailer-feed currency remains the source of truth.
   Converted values are clearly labelled estimates. */
const FINDIT_CURRENCY_BY_COUNTRY={
  ZA:"ZAR",US:"USD",GB:"GBP",IE:"EUR",DE:"EUR",FR:"EUR",ES:"EUR",IT:"EUR",
  NL:"EUR",BE:"EUR",PT:"EUR",AT:"EUR",FI:"EUR",GR:"EUR",LU:"EUR",
  AU:"AUD",NZ:"NZD",CA:"CAD",CH:"CHF",JP:"JPY",IN:"INR",AE:"AED"
};
let finditUserCountry=localStorage.getItem("findit_country")||null;
let finditUserCurrency=localStorage.getItem("findit_currency")||null;
let finditFx={ZAR:1};

async function finditDetectCountry(){
  // Prefer browser locale. No precise location is sent anywhere.
  if(!finditUserCountry){
    const loc=(navigator.languages?.[0]||navigator.language||"en-ZA");
    const m=loc.match(/[-_]([A-Z]{2})$/i);
    finditUserCountry=(m?.[1]||"ZA").toUpperCase();
  }
  finditUserCurrency=FINDIT_CURRENCY_BY_COUNTRY[finditUserCountry]||"USD";
  localStorage.setItem("findit_country",finditUserCountry);
  localStorage.setItem("findit_currency",finditUserCurrency);
  try{
    const r=await fetch(`/api/fx?base=ZAR&symbols=${encodeURIComponent(finditUserCurrency)}`);
    const d=await r.json();
    if(r.ok&&d.rate) finditFx[finditUserCurrency]=Number(d.rate);
  }catch(e){console.warn("Currency conversion unavailable",e)}
}
function finditFormatFeedPrice(amount,currency="ZAR"){
  if(amount==null||!Number.isFinite(Number(amount)))return "Price unavailable";
  try{return new Intl.NumberFormat(undefined,{style:"currency",currency}).format(Number(amount))}
  catch{return `${currency} ${Number(amount).toFixed(2)}`}
}
function finditFormatLocalEstimate(amount,sourceCurrency="ZAR"){
  if(amount==null||sourceCurrency===finditUserCurrency)return null;
  // Current first feed is ZAR. Other source currencies stay unconverted unless a rate exists.
  if(sourceCurrency!=="ZAR"||!finditFx[finditUserCurrency])return null;
  const n=Number(amount)*finditFx[finditUserCurrency];
  try{return `≈ ${new Intl.NumberFormat(undefined,{style:"currency",currency:finditUserCurrency}).format(n)}`}
  catch{return `≈ ${finditUserCurrency} ${n.toFixed(2)}`}
}
document.addEventListener("DOMContentLoaded",finditDetectCountry);


/* =========================================================
   FINDIT PREMIUM — PAYSTACK TEST MODE
   Safe override: existing search, map and directions logic
   below is left unchanged.
========================================================= */
async function finditStartPremiumPayment(){
  const email=window.prompt("Enter the email to use for FindIt Premium:");
  if(!email)return;
  try{
    const r=await fetch("/api/paystack-init",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});
    const d=await r.json();
    if(!r.ok||!d.authorization_url){alert(d.error||"Could not start payment.");return}
    sessionStorage.setItem("findit_pending_paystack_reference",d.reference||"");
    window.location.assign(d.authorization_url);
  }catch(e){console.error(e);alert("Payment could not start. Please try again.")}
}
async function finditFinishPremiumPayment(){
  const p=new URLSearchParams(location.search);
  if(p.get("premium_payment")!=="return")return;
  const ref=p.get("reference")||p.get("trxref")||sessionStorage.getItem("findit_pending_paystack_reference");
  if(!ref){alert("Payment reference missing.");return}
  try{
    const r=await fetch(`/api/paystack-verify?reference=${encodeURIComponent(ref)}`);
    const d=await r.json();
    if(!r.ok||!d.paid){alert("The test payment was not verified. Premium was not unlocked.");return}
    premiumState.active=true;
    localStorage.setItem("findit_premium_beta","1");
    localStorage.setItem("findit_premium_payment_reference",d.reference||ref);
    sessionStorage.removeItem("findit_pending_paystack_reference");
    if(typeof refreshPremiumUI==="function")refreshPremiumUI();
    if(typeof applyPremiumWorld==="function")applyPremiumWorld(true);
    if(typeof updatePremiumDashboard==="function")updatePremiumDashboard();
    if(typeof v10Refresh==="function")v10Refresh();
    const u=new URL(location.href);["premium_payment","reference","trxref"].forEach(k=>u.searchParams.delete(k));
    history.replaceState({},"",u.pathname+u.search+u.hash);
    alert("Test payment verified ✓ FindIt Premium is unlocked on this device.");
  }catch(e){console.error(e);alert("Payment verification could not be completed.")}
}
document.addEventListener("DOMContentLoaded",()=>{
  const b=document.getElementById("activatePremiumTester");
  if(b){
    b.textContent="Get Premium — R99";
    b.addEventListener("click",e=>{
      e.preventDefault();
    },true);
  }
  finditFinishPremiumPayment();
});


let productIntelligence=null;
async function loadProductIntelligence(i){
  const panel=document.getElementById("productIntelligencePanel"),el=document.getElementById("productIntelligenceResults");if(!panel||!el)return;
  try{
    const r=await fetch("/api/product-intelligence",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({query:i.searchQuery||i.name||i.object||"",name:i.name||i.object||"",brand:i.brand||"",model:i.model||""})});
    const d=await r.json();productIntelligence=d;panel.classList.remove("hidden");
    if(!r.ok||!d.matched){el.innerHTML='<div class="empty-state">No verified product price or stock data yet. FindIt will still show nearby retailers.</div>';return}
    if(!(d.offers||[]).length){el.innerHTML=`<div class="empty-state">Matched ${esc(d.bestProduct?.name||"the product")}, but no retailer offers are stored yet.</div>`;return}
    el.innerHTML=d.offers.map(o=>{const retailer=o.retailer?.name||"Retailer";const price=finditFormatFeedPrice(o.price,o.currency||"ZAR");const localEstimate=finditFormatLocalEstimate(o.price,o.currency||"ZAR");const stock=o.availability||"Availability not supplied";const stockLabel=stock==="in_stock"?"In stock online/general":stock==="out_of_stock"?"Out of stock":stock==="preorder"?"Pre-order":stock==="backorder"?"Back-order":stock;const saving=(o.original_price!=null&&o.price!=null&&Number(o.original_price)>Number(o.price))?Number(o.original_price)-Number(o.price):null;return `<article class="pi-offer ${o.verified?"verified":""}"><div><h4>${esc(o.product_name||d.bestProduct?.name||"Product")}</h4><p>${esc(retailer)}</p><div class="pi-meta"><span>${o.verified?"✓ Verified listing":"Catalog listing"}</span><span>${esc(stockLabel)}</span>${saving?`<span>Save ${new Intl.NumberFormat("en-ZA",{style:"currency",currency:o.currency||"ZAR"}).format(saving)}</span>`:""}${o.source?`<span>${esc(o.source)}</span>`:""}</div><div class="pi-actions">${validUrl(o.product_url)?`<a href="${esc(o.product_url)}" target="_blank" rel="noopener noreferrer">View product</a>`:""}</div></div><div class="pi-price">${esc(price)}${localEstimate?`<small class="pi-local-estimate">${esc(localEstimate)} estimated</small>`:""}</div>${o.original_price!=null&&Number(o.original_price)>Number(o.price||0)?`<div class="pi-old-price">${new Intl.NumberFormat("en-ZA",{style:"currency",currency:o.currency||"ZAR"}).format(Number(o.original_price))}</div>`:""}</article>`}).join("");
  }catch{panel.classList.remove("hidden");el.innerHTML='<div class="empty-state">Product price data is temporarily unavailable.</div>'}
}
function assistantContext(){const i=state.result?.identification||{};return {identification:{name:i.name||i.object||null,brand:i.brand||null,model:i.model||null,category:i.retailCategory||i.category||null,confidence:i.confidence||null,searchQuery:i.searchQuery||null},nearbyStores:(state.stores||[]).slice(0,8).map(s=>({name:s.name,distanceKm:s.distanceKm,type:s.type,address:s.address})),productIntelligence:productIntelligence?{matched:productIntelligence.matched,bestProduct:productIntelligence.bestProduct,offers:(productIntelligence.offers||[]).slice(0,8).map(o=>({productName:o.product_name,price:o.price,currency:o.currency,availability:o.availability,verified:o.verified,retailer:o.retailer?.name}))}:null,premium:premiumState.active,radiusKm:state.radius}}
function openAssistant(){document.getElementById("assistantPanel")?.classList.remove("hidden");setTimeout(()=>document.getElementById("assistantInput")?.focus(),50)}
function closeAssistant(){document.getElementById("assistantPanel")?.classList.add("hidden")}
function addAssistantMessage(text,type="bot"){const el=document.getElementById("assistantMessages");const d=document.createElement("div");d.className=`assistant-msg ${type}`;d.textContent=text;el.appendChild(d);el.scrollTop=el.scrollHeight;return d}
async function askAssistant(text){const q=String(text||"").trim();if(!q)return;addAssistantMessage(q,"user");const wait=addAssistantMessage("Thinking…","bot");try{const r=await fetch("/api/assistant",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({message:q,context:assistantContext()})});const d=await r.json();wait.remove();if(!r.ok)throw Error();addAssistantMessage(d.answer||"I couldn't answer that.","bot")}catch{wait.remove();addAssistantMessage("FindIt Assistant is temporarily unavailable. Please try again.","bot error")}}
document.addEventListener("DOMContentLoaded",()=>{document.getElementById("assistantFab")?.addEventListener("click",openAssistant);document.getElementById("closeAssistant")?.addEventListener("click",closeAssistant);document.getElementById("assistantForm")?.addEventListener("submit",e=>{e.preventDefault();const x=document.getElementById("assistantInput");const q=x.value;x.value="";askAssistant(q)});document.querySelectorAll("[data-assistant-quick]").forEach(b=>b.onclick=()=>askAssistant(b.dataset.assistantQuick))});


/* =========================================================
   FINDIT PREMIUM V10 — FUNCTIONAL LOCAL POWER TOOLS
========================================================= */
const V10KEYS={collections:"findit_v10_collections",watch:"findit_v10_watchlist",stores:"findit_v10_favourite_stores"};
function v10Read(k,f=[]){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch{return f}}
function v10Write(k,v){localStorage.setItem(k,JSON.stringify(v));v10Refresh()}
function v10Current(){const i=state.result?.identification||{};return {name:i.name||i.object||"Current Find",query:i.searchQuery||i.name||i.object||"",category:i.retailCategory||i.category||"",savedAt:new Date().toISOString()}}
function v10Open(title,body){document.getElementById("v10ModalBody").innerHTML=`<p class="premium-home-kicker">★ PREMIUM V10</p><h2>${esc(title)}</h2>${body}`;document.getElementById("v10UniversalModal")?.classList.remove("hidden")}
function v10Close(){document.getElementById("v10UniversalModal")?.classList.add("hidden")}
function v10Refresh(){if(!premiumState.active)return;document.body.classList.add("premium-v10");document.getElementById("v10CommandCentre")?.classList.remove("hidden")}
function v10Collections(){
 let cols=v10Read(V10KEYS.collections,[{name:"Want to Buy",items:[]}]);
 v10Open("Collections",`<input id="v10CollectionName" class="v10-input" placeholder="New collection name"><div class="v10-actions"><button id="v10AddCollection">+ Create collection</button></div><div class="v10-list" style="margin-top:15px">${cols.map((c,i)=>`<div class="v10-row"><div><b>${esc(c.name)}</b><br><small>${c.items.length} items</small></div><button data-col-add="${i}">Add current Find</button></div>`).join("")}</div>`);
 document.getElementById("v10AddCollection").onclick=()=>{const n=document.getElementById("v10CollectionName").value.trim();if(!n)return;cols.push({name:n,items:[]});v10Write(V10KEYS.collections,cols);v10Collections()};
 document.querySelectorAll("[data-col-add]").forEach(b=>b.onclick=()=>{const x=v10Current();if(!x.query)return;cols[+b.dataset.colAdd].items.unshift(x);v10Write(V10KEYS.collections,cols);v10Collections()});
}
function v10Watchlist(){
 let a=v10Read(V10KEYS.watch);const cur=v10Current();
 v10Open("Watchlist",`<p class="premium-tool-note">Keep products you want to revisit. Automatic price/stock monitoring is not enabled yet.</p><div class="v10-actions"><button id="v10WatchCurrent">+ Add current Find</button></div><div class="v10-list" style="margin-top:15px">${a.length?a.map((x,i)=>`<div class="v10-row"><div><b>${esc(x.name)}</b><br><small>${esc(x.category||"FindIt item")}</small></div><button data-watch-remove="${i}">Remove</button></div>`).join(""):"<p>No watched items yet.</p>"}</div>`);
 document.getElementById("v10WatchCurrent").onclick=()=>{if(cur.query&&!a.some(x=>x.query===cur.query)){a.unshift(cur);v10Write(V10KEYS.watch,a)}v10Watchlist()};
 document.querySelectorAll("[data-watch-remove]").forEach(b=>b.onclick=()=>{a.splice(+b.dataset.watchRemove,1);v10Write(V10KEYS.watch,a);v10Watchlist()});
}
function v10FavouriteStores(){
 let a=v10Read(V10KEYS.stores);
 v10Open("Favourite Stores",`<p class="premium-tool-note">Save retailers from your current nearby results.</p><div class="v10-list">${state.stores.map((s,i)=>`<div class="v10-row"><div><b>${esc(s.name)}</b><br><small>${Number(s.distanceKm).toFixed(1)} km</small></div><button data-fav-store="${i}">${a.some(x=>x.name===s.name)?"Saved ✓":"Save store"}</button></div>`).join("")||"<p>Run a nearby search first.</p>"}</div>${a.length?`<h3 style="margin-top:20px">Saved retailers</h3><div class="v10-list">${a.map(x=>`<div class="v10-row"><div><b>${esc(x.name)}</b><br><small>${esc(x.address||"Retailer")}</small></div></div>`).join("")}</div>`:""}`);
 document.querySelectorAll("[data-fav-store]").forEach(b=>b.onclick=()=>{const s=state.stores[+b.dataset.favStore];if(s&&!a.some(x=>x.name===s.name)){a.unshift({name:s.name,address:s.address||"",lat:s.lat,lon:s.lon});v10Write(V10KEYS.stores,a)}v10FavouriteStores()});
}
function v10Stats(){
 let recent=[];try{recent=JSON.parse(localStorage.getItem("finditRecent")||"[]")}catch{}
 const saved=getPremiumSaved(),watch=v10Read(V10KEYS.watch),fav=v10Read(V10KEYS.stores);
 v10Open("My FindIt Stats",`<div class="v10-stat-grid"><article><b>${recent.length}</b><small>Recent finds</small></article><article><b>${saved.length}</b><small>Saved items</small></article><article><b>${watch.length}</b><small>Watchlist</small></article><article><b>${fav.length}</b><small>Favourite stores</small></article></div><p class="premium-tool-note" style="margin-top:15px">These personal stats are stored on this device during Beta.</p>`);
}
function v10History(){
 let a=[];try{a=JSON.parse(localStorage.getItem("finditRecent")||"[]")}catch{}
 v10Open("History+",`<input id="v10HistorySearch" class="v10-input" placeholder="Search your recent finds"><div id="v10HistoryRows" class="v10-list"></div>`);
 const draw=()=>{const q=document.getElementById("v10HistorySearch").value.toLowerCase();document.getElementById("v10HistoryRows").innerHTML=a.filter(x=>(x.name+" "+x.query).toLowerCase().includes(q)).slice(0,50).map(x=>`<div class="v10-row"><div><b>${esc(x.name)}</b><br><small>${esc(x.query||"")}</small></div><a href="https://www.google.com/search?q=${encodeURIComponent(x.query||x.name)}" target="_blank">Search again</a></div>`).join("")||"<p>No matching history.</p>"};draw();document.getElementById("v10HistorySearch").oninput=draw;
}
function v10Share(){
 const x=v10Current();if(!x.query){v10Open("Share Find","<p>Run a FindIt search first.</p>");return}
 const text=`FindIt found: ${x.name}${x.category?` (${x.category})`:""}`;
 if(navigator.share){navigator.share({title:"FindIt Find",text}).catch(()=>{})}else{navigator.clipboard?.writeText(text);v10Open("Share Find",`<p>Copied this Find to your clipboard:</p><div class="v10-row"><b>${esc(text)}</b></div>`)}
}
function v10Manual(){
 v10Open("Manual Search",`<p class="premium-tool-note">Already know the item name? Search it directly.</p><input id="v10ManualQuery" class="v10-input" placeholder="e.g. Nike Air Force 1 Low"><div class="v10-actions"><button id="v10ManualGo">Search item</button></div>`);
 document.getElementById("v10ManualGo").onclick=()=>{const q=document.getElementById("v10ManualQuery").value.trim();if(q)window.open(`https://www.google.com/search?q=${encodeURIComponent(q+" buy near me")}`,"_blank")};
}
function v10Exact(){
 const x=v10Current();if(!x.query){v10Open("Exact Match","<p>Identify an item first so FindIt has an exact product query.</p>");return}
 window.open(`https://www.google.com/search?q=${encodeURIComponent('"'+x.query+'" buy')}`,"_blank");
}
function v10Assistant(){
 const x=v10Current();if(!x.query){v10Open("AI Search","<p>Identify an item first. Then Premium can build a focused retailer search from the result.</p>");return}
 const q=[x.query,x.category,"retailer near me"].filter(Boolean).join(" ");
 v10Open("AI Search",`<p>Premium built this focused search from your current Find:</p><div class="v10-row"><b>${esc(q)}</b></div><div class="v10-actions" style="margin-top:12px"><button id="v10AssistantGo">Search retailers</button></div>`);
 document.getElementById("v10AssistantGo").onclick=()=>window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`,"_blank");
}
function v10Handle(a){
 if(a==="scan")document.getElementById("finder")?.scrollIntoView({behavior:"smooth"});
 if(a==="manual")v10Manual();if(a==="exact")v10Exact();if(a==="assistant")v10Assistant();
 if(a==="collections")v10Collections();if(a==="watchlist")v10Watchlist();if(a==="favourites")v10FavouriteStores();if(a==="stats")v10Stats();if(a==="share")v10Share();if(a==="history")v10History();
}
document.addEventListener("DOMContentLoaded",()=>{v10Refresh();document.querySelectorAll("[data-v10]").forEach(b=>b.onclick=()=>v10Handle(b.dataset.v10));document.getElementById("v10CloseModal")?.addEventListener("click",v10Close)});


/* =========================================================
   PREMIUM V2 FUNCTIONAL TOOLS
========================================================= */
let premiumStoreSort="original";
let premiumCompareSelection=new Set();

function getPremiumSaved(){
  let a=[],b=[];
  try{a=JSON.parse(localStorage.getItem("finditSaved")||"[]")}catch{}
  try{b=JSON.parse(localStorage.getItem("findit_favourites")||"[]")}catch{}
  const merged=[...a,...b].map(x=>({name:x.name||x.item||"Saved item",query:x.query||"",savedAt:x.savedAt||x.createdAt||""}));
  const seen=new Set();
  return merged.filter(x=>{const k=(x.name+"|"+x.query).toLowerCase();if(seen.has(k))return false;seen.add(k);return true}).slice(0,50);
}
function premiumHistoryLimit(){return premiumState.active?50:12}
function updatePremiumDashboard(){
  if(!premiumState.active)return;
  document.getElementById("premiumHome")?.classList.remove("hidden");
  const saved=getPremiumSaved();
  let recent=[];try{recent=JSON.parse(localStorage.getItem("finditRecent")||"[]")}catch{}
  const set=(id,val)=>{const el=document.getElementById(id);if(el)el.textContent=val};
  set("premiumSavedCount",saved.length+" saved");
  set("premiumFavouriteCount",saved.length);
  set("premiumHistoryCount",recent.length);
  set("premiumRadiusDisplay",state.radius+" km");
  set("premiumStoreCount",state.stores.length);
  document.querySelectorAll("[data-premium-radius]").forEach(b=>b.classList.toggle("active",Number(b.dataset.premiumRadius)===Number(state.radius)));
  document.querySelectorAll("[data-store-sort]").forEach(b=>b.classList.toggle("active",b.dataset.storeSort===premiumStoreSort));
}
function openTool(name){
  if(!premiumState.active){openPremium();return}
  if(name==="saved"){renderPremiumSaved();document.getElementById("premiumSavedModal")?.classList.remove("hidden")}
  if(name==="compare"){renderPremiumCompare();document.getElementById("premiumCompareModal")?.classList.remove("hidden")}
  if(name==="filters")document.getElementById("premiumFiltersModal")?.classList.remove("hidden");
}
function closeTool(name){
  const ids={saved:"premiumSavedModal",compare:"premiumCompareModal",filters:"premiumFiltersModal"};
  document.getElementById(ids[name])?.classList.add("hidden");
}
function renderPremiumSaved(){
  const el=document.getElementById("premiumSavedList");if(!el)return;
  const list=getPremiumSaved();
  if(!list.length){el.innerHTML='<p class="muted">No saved items yet. Use the ♡ Save button after a FindIt search.</p>';return}
  el.innerHTML=list.map((x,i)=>`<div class="premium-saved-row"><div><b>${esc(x.name)}</b><small>${esc(x.query||"Saved Find")}</small></div><button data-premium-saved-search="${i}">Search again</button></div>`).join("");
  document.querySelectorAll("[data-premium-saved-search]").forEach(b=>b.onclick=()=>{const x=list[Number(b.dataset.premiumSavedSearch)];if(x?.query)window.open(`https://www.google.com/search?q=${encodeURIComponent(x.query)}`,"_blank")});
}
function sortedPremiumStores(){
  const a=[...state.stores];
  if(premiumStoreSort==="closest")a.sort((x,y)=>Number(x.distanceKm)-Number(y.distanceKm));
  if(premiumStoreSort==="name")a.sort((x,y)=>String(x.name).localeCompare(String(y.name)));
  return a;
}
function applyPremiumStoreSort(mode){
  premiumStoreSort=mode;
  state.stores=sortedPremiumStores();
  renderStores();updateMap();updatePremiumDashboard();
}
function renderPremiumCompare(){
  const el=document.getElementById("premiumCompareList");if(!el)return;
  const base=sortedPremiumStores();
  const selected=base.filter((_,i)=>premiumCompareSelection.has(i));
  const list=(selected.length?selected:base).slice(0,4);
  if(!list.length){el.innerHTML='<p class="muted">Run a FindIt search first. Nearby stores from that search will appear here.</p>';return}
  el.innerHTML=list.map((s,i)=>{
    const dir=`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${s.lat},${s.lon}`)}`;
    return `<article class="compare-card ${i===0?"best":""}"><small>${i===0?"Closest in this comparison":"Retailer"}</small><h3>${esc(s.name)}</h3><div class="compare-distance">${Number(s.distanceKm).toFixed(1)} km</div><small>${esc(s.address||s.type||"Consumer retailer")}</small><br><small>Exact stock not verified</small><br><a href="${dir}" target="_blank" rel="noopener noreferrer">Directions →</a></article>`
  }).join("");
}
function premiumRadius(v){
  if(!premiumState.active){openPremium();return}
  setRadius(Math.min(25,Math.max(3,Number(v))));
  updatePremiumDashboard();
  const i=state.result?.identification;
  if(i&&state.coords)loadNearby(i,state.radius);
}
function premiumAction(action){
  if(action==="find")document.getElementById("finder")?.scrollIntoView({behavior:"smooth",block:"start"});
  if(action==="saved")openTool("saved");
  if(action==="compare")openTool("compare");
  if(action==="map"){document.getElementById("nearbyPanel")?.scrollIntoView({behavior:"smooth",block:"start"});setTimeout(()=>document.getElementById("mapViewBtn")?.click(),450)}
}
document.addEventListener("DOMContentLoaded",()=>{
  updatePremiumDashboard();
  document.querySelectorAll("[data-premium-action]").forEach(b=>b.onclick=()=>premiumAction(b.dataset.premiumAction));
  document.querySelectorAll("[data-premium-radius]").forEach(b=>b.onclick=()=>premiumRadius(b.dataset.premiumRadius));
  document.querySelectorAll("[data-store-sort]").forEach(b=>b.onclick=()=>{applyPremiumStoreSort(b.dataset.storeSort);closeTool("filters")});
  document.querySelectorAll("[data-close-tool]").forEach(b=>b.onclick=()=>closeTool(b.dataset.closeTool));
  document.getElementById("premiumSavedMenu")?.addEventListener("click",()=>{closeDrawer();openTool("saved")});
  document.getElementById("premiumCompareMenu")?.addEventListener("click",()=>{closeDrawer();openTool("compare")});
  document.getElementById("premiumFiltersMenu")?.addEventListener("click",()=>{closeDrawer();openTool("filters")});
  document.getElementById("premiumRadiusMenu")?.addEventListener("click",()=>{closeDrawer();document.getElementById("premiumHome")?.scrollIntoView({behavior:"smooth"})});
  document.getElementById("premiumHistoryMenu")?.addEventListener("click",()=>{closeDrawer();document.getElementById("recent")?.scrollIntoView({behavior:"smooth"})});
  document.getElementById("premiumChallengeMenu")?.addEventListener("click",()=>{closeDrawer();document.getElementById("challengeBtn")?.click()});
  document.getElementById("openSettingsPremium")?.addEventListener("click",()=>{closeDrawer();document.getElementById("openSettings")?.click()});
});


function applyPremiumWorld(showWow=false){
  document.body.classList.toggle("premium-active",premiumState.active);document.getElementById("premiumHome")?.classList.toggle("hidden",!premiumState.active);
  document.getElementById("premiumWorkspaceButton")?.classList.toggle("hidden",!premiumState.active);
  if(showWow){
    const w=document.getElementById("premiumWow");
    if(w){w.classList.remove("hidden");w.setAttribute("aria-hidden","false");setTimeout(()=>w.classList.add("hidden"),3400)}
  }
}
function openPremiumWorkspace(){if(!premiumState.active){openPremium();return}document.getElementById("premiumWorkspace")?.classList.remove("hidden")}
function closePremiumWorkspace(){document.getElementById("premiumWorkspace")?.classList.add("hidden")}
document.addEventListener("DOMContentLoaded",()=>{
  applyPremiumWorld(false);
  document.getElementById("premiumWorkspaceButton")?.addEventListener("click",openPremiumWorkspace);
  document.getElementById("closePremiumWorkspace")?.addEventListener("click",closePremiumWorkspace);
  document.querySelectorAll("[data-pw]").forEach(b=>b.addEventListener("click",()=>{
    const x=b.dataset.pw;if(x==="alerts")return;
    closePremiumWorkspace();
    if(x==="find")document.querySelector("#upload,#dropzone,input[type=file]")?.scrollIntoView({behavior:"smooth",block:"center"});
    if(x==="map")document.querySelector("#map,#mapLarge")?.scrollIntoView({behavior:"smooth",block:"center"});
    if(x==="history")document.querySelector("#recentButton,#openRecent")?.click();
    if(x==="challenge")document.querySelector("#challengeButton,[data-challenge]")?.click();
    if(x==="saved"){const a=JSON.parse(localStorage.getItem("findit_favourites")||"[]");alert(a.length?a.map(v=>"★ "+v.item).join("\\n"):"No saved items yet. Save a Find when you find something you like.");}
    if(x==="radius")alert("Premium search radius: up to 25 km.");
    if(x==="filters")alert("Premium filters are ready for closest and best-match sorting. More filters will be added as verified retailer data grows.");
    if(x==="compare")alert("Compare Stores uses your current nearby results. Full price comparison will unlock as verified retailer price data becomes available.");
  }));
});


const premiumState={active:localStorage.getItem("findit_premium_beta")==="1",freeRadiusKm:10,premiumRadiusKm:25};
function refreshPremiumUI(){document.getElementById("premiumStatusBadge")?.classList.toggle("hidden",!premiumState.active);const b=document.getElementById("activatePremiumTester");if(b)b.textContent=premiumState.active?"Premium Beta active ✓":"Activate Premium Beta on this device"}
function openPremium(){const m=document.getElementById("premiumModal");m?.classList.remove("hidden");m?.setAttribute("aria-hidden","false")}
function closePremium(){const m=document.getElementById("premiumModal");m?.classList.add("hidden");m?.setAttribute("aria-hidden","true")}
document.addEventListener("DOMContentLoaded",()=>{refreshPremiumUI();document.getElementById("premiumButton")?.addEventListener("click",openPremium);document.getElementById("closePremium")?.addEventListener("click",closePremium);document.getElementById("premiumModal")?.addEventListener("click",e=>{if(e.target.id==="premiumModal")closePremium()});document.getElementById("activatePremiumTester")?.addEventListener("click",()=>{premiumState.active=true;localStorage.setItem("findit_premium_beta","1");refreshPremiumUI();closePremium();applyPremiumWorld(true);updatePremiumDashboard();v10Refresh();setTimeout(()=>document.getElementById("premiumHome")?.scrollIntoView({behavior:"smooth"}),3300)})});
function recordNearbyAnalyticsFromResponse(d,i){const stores=Array.isArray(d?.stores)?d.stores:[];trackFindIt("nearby_complete",{success:stores.length>0,item:i?.name||i?.object||null,retailCategory:d?.retailGroup||i?.retailCategory||i?.category||null,nearbyStoreCount:stores.length,closestStoreDistanceKm:stores.length?Number(stores[0]?.distanceKm):null,radiusKm:Number.isFinite(Number(d?.radiusKm))?Number(d.radiusKm):null})}
function trackFindIt(eventType,extra={}){const i=state.result?.identification||{};return fetch('/api/analytics',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({eventType,item:i.name||i.object||null,retailCategory:i.retailCategory||i.retail_category||i.category||null,confidence:Number(i.confidence||0)||null,exactOfferCount:state.offers?.length??null,nearbyStoreCount:state.stores?.length??null,closestStoreDistanceKm:state.stores?.[0]?.distanceKm??null,radiusKm:state.radius??null,...extra})}).catch(()=>null)}
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state={file:null,coords:null,result:null,offers:[],stores:[],sort:"best",radius:Number(localStorage.getItem("finditRadius")||10),map:null,markers:[],diagnostics:{item:null,searchQuery:null,retailCategory:null,likelyStoreTypes:[],recognitionConfidence:null,exactProductMatch:false,exactOfferCount:0,nearbyStoreCount:0,closestStoreDistanceKm:null,nearbyRadiusKm:null,nearbyRetailGroup:null,nearbyReliable:null,lastError:null,lastSearchCompletedAt:null}};
/* CURRENT UI LEGACY DOM GUARD — prevents obsolete result handlers from crashing the app. */
const __finditLegacyIds=[
  ["resultTitle","h2"],["summary","p"],["analysis","div"],["warning","div"],["offers","div"],["noOffers","div"],["nothingFound","div"],
  ["listViewBtn","button"],["mapWrap","div"],["searchOnline","a"],["onlineQueryText","span"],["searchNearbyFree","a"],["copyQuery","button"],
  ["similarSearch","a"],["retry","button"],["changeItem","button"],["correctSearch","button"],["recentList","div"],["clearRecent","button"],
  ["feedbackTopic","select"],["includeTechnical","input"],["sendFeedback","button"],["copyFeedback","button"],["thumbUp","button"],["thumbDown","button"]
];
for(const [id,tag] of __finditLegacyIds){if(!document.getElementById(id)){const e=document.createElement(tag);e.id=id;e.className="hidden legacy-compat-node";if(id==="nothingFound")e.innerHTML="<p></p>";if(id==="includeTechnical")e.type="checkbox";document.body.appendChild(e)}}
const photo=$("#photo"),cameraPhoto=$("#cameraPhoto"),preview=$("#preview"),placeholder=$("#uploadPlaceholder"),dropzone=$("#dropzone"),searchBtn=$("#search"),status=$("#status"),locationBtn=$("#location"),results=$("#results"),analysis=$("#analysis"),warning=$("#warning"),nearbyStores=$("#nearbyStores"),offersEl=$("#offers"),noOffers=$("#noOffers"),nothingFound=$("#nothingFound"),freeActions=$("#freeActions");

function esc(v=""){return String(v).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]))} function safe(v,f="Not detected"){return v==null||v===""?f:String(v)} function clamp(v,a,b){return Math.max(a,Math.min(b,v))} function validUrl(v){try{const u=new URL(v);return /^https?:$/.test(u.protocol)}catch{return false}} function setStatus(t,err=false){status.textContent=t;status.style.color=err?"#ff9da7":""}

const drawer=$("#drawer"),backdrop=$("#drawerBackdrop");function openDrawer(){drawer.classList.add("open");drawer.setAttribute("aria-hidden","false");backdrop.classList.remove("hidden")}function closeDrawer(){drawer.classList.remove("open");drawer.setAttribute("aria-hidden","true");backdrop.classList.add("hidden")}
$("#menuBtn").onclick=openDrawer;$("#mobileMore").onclick=openDrawer;$("#closeMenu").onclick=closeDrawer;backdrop.onclick=closeDrawer;$$('.drawer-nav a').forEach(a=>a.onclick=closeDrawer);

const modals=$$(".modal");function openModal(el){el.classList.remove("hidden")}function closeModals(){modals.forEach(m=>m.classList.add("hidden"))}$$('[data-close-modal]').forEach(b=>b.onclick=closeModals);modals.forEach(m=>m.onclick=e=>{if(e.target===m)closeModals()});
$("#openSettings").onclick=()=>{closeDrawer();openModal($("#settingsModal"))};

const challenges=["Find something you don't know the name of 👀","Find the weirdest object in your room 😂","Find something smaller than your hand 🤏","Find something with a logo you can't identify 🕵️","Find an unusual tool 🔧","Find something older than you 🕰️","Find a product you've always wondered about ✨"];
function challenge(){openModal($("#challengeModal"));$("#challengeText").textContent=challenges[Math.floor(Math.random()*challenges.length)]}$("#challengeBtn").onclick=challenge;$("#challengeBtn2").onclick=challenge;$("#newChallenge").onclick=()=>$("#challengeText").textContent=challenges[Math.floor(Math.random()*challenges.length)];

const exampleSets=[[['👟','Sneakers'],['🥤','Energy drink'],['🎧','Headphones'],['🌱','Plant'],['👓','Glasses'],['⌚','Watch']],[['🎮','Controller'],['🔧','Tool'],['💄','Makeup'],['🎒','Backpack'],['🔌','Charger'],['☕','Hot chocolate']],[['🦻','Hearing aid'],['🚗','Car part'],['🧸','Toy'],['🖱️','Mouse'],['👕','Clothing'],['🔬','Microscope']],[['🎸','Guitar'],['🐶','Pet product'],['💡','Ceiling light'],['🧵','Yarn'],['🚲','Bike part'],['🪴','Bonsai']]];let exampleIndex=0,exampleTimer;
function renderExamples(animate=true){const grid=$("#exampleGrid"),set=exampleSets[exampleIndex%exampleSets.length];if(animate&&grid.children.length){grid.classList.add("transitioning");[...grid.children].forEach((c,i)=>setTimeout(()=>c.classList.add("out"),i*75));setTimeout(()=>{paint();grid.classList.remove("transitioning");restartExampleProgress()},650)}else{paint();restartExampleProgress();}function paint(){grid.innerHTML=set.map(([e,n],i)=>`<button class="example-card in" style="animation-delay:${i*70}ms" data-example="${esc(n)}"><span class="example-emoji">${e}</span><strong>${esc(n)}</strong><small>Try something like this</small></button>`).join("");$$('[data-example]').forEach(b=>b.onclick=()=>{document.querySelector('#finder').scrollIntoView({behavior:'smooth'});setStatus(`Try uploading a photo of ${b.dataset.example.toLowerCase()}.`)})}}function restartExampleProgress(){const p=$("#exampleProgress");if(!p)return;p.style.animation="none";void p.offsetWidth;p.style.animation="exampleCountdown 5s linear infinite"}function nextExamples(){exampleIndex=(exampleIndex+1)%exampleSets.length;renderExamples(true)}renderExamples(false);exampleTimer=setInterval(nextExamples,5000);$("#shuffleExamples").onclick=()=>{clearInterval(exampleTimer);nextExamples();exampleTimer=setInterval(nextExamples,5000)};

const observer=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add("visible")}),{threshold:.08});$$('.reveal').forEach(x=>observer.observe(x));

$("#choosePhoto").onclick=()=>photo.click();$("#takePhoto").onclick=()=>cameraPhoto.click();photo.onchange=()=>selectFile(photo.files?.[0]);cameraPhoto.onchange=()=>selectFile(cameraPhoto.files?.[0]);['dragenter','dragover'].forEach(ev=>dropzone.addEventListener(ev,e=>{e.preventDefault();dropzone.classList.add('dragging')}));['dragleave','drop'].forEach(ev=>dropzone.addEventListener(ev,e=>{e.preventDefault();dropzone.classList.remove('dragging')}));dropzone.addEventListener('drop',e=>selectFile(e.dataTransfer?.files?.[0]));
function selectFile(file){if(!file)return;if(!file.type.startsWith('image/'))return setStatus('Please choose an image file.',true);if(file.size>8*1024*1024)return setStatus('Please use an image smaller than 8 MB.',true);state.file=file;preview.src=URL.createObjectURL(file);preview.classList.remove('hidden');placeholder.classList.add('hidden');searchBtn.disabled=false;setStatus('Photo ready. Add location for nearby retailer results.')}
function getLocation(){return new Promise((resolve,reject)=>{if(!navigator.geolocation)return reject(Error('Location unavailable'));navigator.geolocation.getCurrentPosition(p=>resolve({lat:p.coords.latitude,lon:p.coords.longitude}),reject,{enableHighAccuracy:true,timeout:15000,maximumAge:120000})})}
locationBtn.onclick=async()=>{try{state.coords=await getLocation();locationBtn.textContent='✓ Location ready';setStatus('Location ready. Nearby search will use your selected radius.')}catch{setStatus('Location permission was not granted. Identification still works.',true)}};

const radiusSelect=$("#radiusSelect"),settingsRadius=$("#settingsRadius");radiusSelect.value=String(state.radius);settingsRadius.value=String(state.radius);function setRadius(v){let next=Number(v);if(!premiumState.active&&next>10){openPremium();next=10}if(premiumState.active)next=Math.min(25,next);state.radius=next;localStorage.setItem("finditRadius",String(state.radius));radiusSelect.value=String(state.radius);settingsRadius.value=String(state.radius);updatePremiumDashboard?.()}radiusSelect.onchange=e=>setRadius(e.target.value);settingsRadius.onchange=e=>setRadius(e.target.value);
const animationsToggle=$("#animationsToggle");animationsToggle.checked=localStorage.getItem('finditAnimations')!=='off';document.body.classList.toggle('no-animations',!animationsToggle.checked);animationsToggle.onchange=()=>{localStorage.setItem('finditAnimations',animationsToggle.checked?'on':'off');document.body.classList.toggle('no-animations',!animationsToggle.checked)};

const stages=[['Looking at your image…','Checking shapes, text and visible branding.',20],['Identifying the item…','Finding object, brand, model and specialist category.',45],['Understanding where it is sold…','Choosing consumer-facing retailer types.',65],['Searching nearby…','Checking the closest relevant retailers.',82],['Almost there…','Ranking the most useful results.',94]];let stageTimer;
function showSearchOverlay(){const o=$("#searchOverlay");$("#searchOverlayImage").src=preview.src;o.classList.remove('hidden');dropzone.classList.add('scanning');let i=0;const paint=()=>{const [a,b,p]=stages[Math.min(i,stages.length-1)];$("#searchStage").textContent=a;$("#searchStageSub").textContent=b;$("#searchProgress").style.width=p+'%';i++};paint();stageTimer=setInterval(paint,900)}function hideSearchOverlay(){clearInterval(stageTimer);$("#searchProgress").style.width='100%';setTimeout(()=>$("#searchOverlay").classList.add('hidden'),180);dropzone.classList.remove('scanning')}

searchBtn.onclick=async()=>{if(!state.file)return;resetResults();searchBtn.disabled=true;showSearchOverlay();try{if(!state.coords){try{state.coords=await getLocation();locationBtn.textContent='✓ Location ready'}catch{}}const fd=new FormData();fd.append('image',state.file);if(state.coords){fd.append('lat',state.coords.lat);fd.append('lon',state.coords.lon)}const r=await fetch('/api/search',{method:'POST',body:fd});const data=await r.json().catch(()=>({}));if(!r.ok)throw Error(data.message||data.error||`Search failed (${r.status})`);state.result=data;renderIdentification(data.identification||{});loadProductIntelligence(data.identification||{});state.offers=Array.isArray(data.offers)?data.offers:[];state.diagnostics.exactOfferCount=state.offers.length;state.diagnostics.exactProductMatch=state.offers.length>0;renderOffers();renderFreeActions(data.identification||{});const conf=Number(data.identification?.confidence||0);if(data.blocked)showWarning(data.message||'This item cannot be searched.',true);else if(conf<.55)showWarning('FindIt is not confident enough to guess. Try a clearer photo.');if(state.coords&&conf>=.55&&!data.blocked)await loadNearby(data.identification||{},state.radius);else showNothing('Allow location to see nearby retailers.');saveRecent(data.identification||{});trackFindIt('search_complete',{success:true});results.classList.remove('hidden');results.scrollIntoView({behavior:'smooth'});setStatus('Search complete.')}catch(e){state.diagnostics.lastError=String(e.message||e).slice(0,240);results.classList.remove('hidden');showWarning(`Search error: ${e.message}`,true);trackFindIt('search_failed',{success:false});setStatus('Search failed. Check the message below.',true)}finally{hideSearchOverlay();searchBtn.disabled=!state.file}};

function resetResults(){state.offers=[];state.stores=[];offersEl.innerHTML='';nearbyStores.innerHTML='';analysis.innerHTML='';warning.classList.add('hidden');noOffers.classList.add('hidden');nothingFound.classList.add('hidden');freeActions.classList.add('hidden')}
function infoCard(l,v){return `<div class="analysis-card"><span>${esc(l)}</span><strong>${esc(String(v))}</strong></div>`}
function renderIdentification(i){$("#resultTitle").textContent=i.name||i.model||i.object||'Item identified';$("#summary").textContent=i.summary||'FindIt analysed the uploaded image.';const c=clamp(Math.round(Number(i.confidence||0)*100),0,100),text=Array.isArray(i.visibleText)&&i.visibleText.length?i.visibleText.slice(0,5).join(' • '):'None detected',stores=Array.isArray(i.likelyStoreTypes)&&i.likelyStoreTypes.length?i.likelyStoreTypes.join(' • '):safe(i.retailCategory,'General retail');analysis.innerHTML=[infoCard('Object',safe(i.object,'Unknown')),infoCard('Brand',safe(i.brand)),infoCard('Model',safe(i.model)),infoCard('Category',safe(i.category,'Unknown')),infoCard('Visible text',text),infoCard('Search query',safe(i.searchQuery,'Not generated')),infoCard('Retail channel',stores),`<div class="analysis-card"><span>Confidence</span><strong>${c}%</strong><div class="confidence-bar"><i style="width:${c}%"></i></div></div>`].join('');Object.assign(state.diagnostics,{item:i.name||i.object||null,searchQuery:i.searchQuery||null,retailCategory:i.retailCategory||i.category||null,likelyStoreTypes:Array.isArray(i.likelyStoreTypes)?i.likelyStoreTypes:[],recognitionConfidence:Number.isFinite(Number(i.confidence))?Number(i.confidence):null,lastError:null})}
function showWarning(m,err=false){warning.textContent=m;warning.classList.remove('hidden');warning.classList.toggle('error',err)}
function renderOffers(){const list=[...state.offers];if(state.sort==='price')list.sort((a,b)=>(Number(a.price)||Infinity)-(Number(b.price)||Infinity));if(state.sort==='distance')list.sort((a,b)=>(Number(a.distanceKm)||Infinity)-(Number(b.distanceKm)||Infinity));if(state.sort==='best')list.sort((a,b)=>Number(b.match||0)-Number(a.match||0));if(!list.length){noOffers.classList.remove('hidden');return}noOffers.classList.add('hidden');offersEl.innerHTML=list.map(p=>`<article class="offer-card"><img src="${esc(p.image||placeholderImage())}" alt=""><div><h4>${esc(p.name||'Product')}</h4><p>${esc([p.brand,p.model,p.retailer].filter(Boolean).join(' • '))}</p><p>🎯 ${Math.round(Number(p.match||0)*100)}% match • 📦 ${esc(p.stock?.status||'Stock not verified')}</p>${validUrl(p.url)?`<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">View product →</a>`:''}</div><div class="price">${money(p)}</div></article>`).join('')}
$$('.sort-btn').forEach(b=>b.onclick=()=>{state.sort=b.dataset.sort;$$('.sort-btn').forEach(x=>x.classList.toggle('active',x===b));renderOffers()});
function money(p){if(p.price==null)return 'Price unavailable';try{return new Intl.NumberFormat('en-ZA',{style:'currency',currency:p.currency||'ZAR'}).format(Number(p.price))}catch{return `${p.currency||'ZAR'} ${p.price}`}}function placeholderImage(){return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23eef1f5'/%3E%3C/svg%3E"}

async function loadNearby(i,radius){nearbyStores.innerHTML='<div class="empty-state">Finding the closest consumer-facing retailers…</div>';try{const r=await fetch('/api/nearby',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({lat:state.coords.lat,lon:state.coords.lon,identification:i,radiusKm:radius})});const d=await r.json();recordNearbyAnalyticsFromResponse(d,i);if(!r.ok||!d.ok)throw Error(d.error||'Nearby search failed');state.stores=Array.isArray(d.stores)?d.stores:[];Object.assign(state.diagnostics,{nearbyStoreCount:state.stores.length,closestStoreDistanceKm:state.stores[0]?.distanceKm??null,nearbyRadiusKm:d.radiusKm??null,nearbyRetailGroup:d.retailGroup??null,nearbyReliable:d.reliable!==false,lastSearchCompletedAt:new Date().toISOString()});renderStores();updateMap();if(!state.stores.length)showNothing(d.message||'No reliable nearby consumer retailers found.');else nothingFound.classList.add('hidden')}catch(e){state.diagnostics.lastError=String(e.message||e).slice(0,240);state.diagnostics.nearbyReliable=false;state.diagnostics.lastSearchCompletedAt=new Date().toISOString();trackFindIt('nearby_failed',{success:false});nearbyStores.innerHTML='<div class="empty-state">Nearby retailer search is temporarily unavailable.</div>';showNothing('Nearby retailer search could not return useful results.') }}
function renderStores(){if(!state.stores.length){nearbyStores.innerHTML='';updatePremiumDashboard?.();return}if(premiumState.active&&premiumStoreSort!=="original")state.stores=sortedPremiumStores();nearbyStores.innerHTML=state.stores.map((s,i)=>{const directions=`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${s.lat},${s.lon}`)}`;return `<article class="store-card" data-store="${i}"><span class="store-rank">${i+1}</span><div class="store-main"><strong>${esc(s.name)}</strong><small>${esc(s.address||s.type||'Retailer')}</small><div class="store-tags"><span>${esc(s.type||'retail')}</span><span>Consumer retailer</span><span>Stock not verified</span></div>${premiumState.active?`<label class="premium-compare-check"><input type="checkbox" data-compare-store="${i}" ${premiumCompareSelection.has(i)?"checked":""}> Compare</label>`:""}</div><div class="store-side"><div class="store-distance">${Number(s.distanceKm).toFixed(1)} km</div><div class="store-actions">${s.phone?`<a href="tel:${esc(s.phone)}">Call</a>`:''}${validUrl(s.website)?`<a href="${esc(s.website)}" target="_blank" rel="noopener noreferrer">Website</a>`:''}<a href="${directions}" target="_blank" rel="noopener noreferrer">Directions</a></div></div></article>`}).join('');$$('[data-store]').forEach(card=>card.onclick=e=>{if(e.target.closest('a'))return;selectStore(Number(card.dataset.store))})};$$('[data-compare-store]').forEach(c=>c.onchange=e=>{e.stopPropagation();const i=Number(c.dataset.compareStore);if(c.checked)premiumCompareSelection.add(i);else premiumCompareSelection.delete(i);updatePremiumDashboard()});updatePremiumDashboard()
function ensureMap(){if(state.map||typeof L==='undefined')return;state.map=L.map('map').setView(state.coords?[state.coords.lat,state.coords.lon]:[-30.5595,22.9375],state.coords?13:5);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(state.map)}
function updateMap(){ensureMap();if(!state.map||!state.coords)return;state.markers.forEach(m=>m.remove());state.markers=[];const me=L.circleMarker([state.coords.lat,state.coords.lon],{radius:8,color:'#27d4f2',fillColor:'#27d4f2',fillOpacity:1}).addTo(state.map).bindPopup('You are here');state.markers.push(me);state.stores.forEach((s,i)=>{const m=L.marker([s.lat,s.lon]).addTo(state.map).bindPopup(`<b>${i+1}. ${esc(s.name)}</b><br>${Number(s.distanceKm).toFixed(1)} km away`);m.on('click',()=>selectStore(i,false));state.markers.push(m)});if(state.stores.length){state.map.fitBounds([[state.coords.lat,state.coords.lon],...state.stores.map(s=>[s.lat,s.lon])],{padding:[30,30],maxZoom:14})}else state.map.setView([state.coords.lat,state.coords.lon],13);setTimeout(()=>state.map.invalidateSize(),150)}
function selectStore(i,openPopup=true){$$('[data-store]').forEach((c,n)=>c.classList.toggle('active',n===i));const card=$(`[data-store="${i}"]`);card?.scrollIntoView({behavior:'smooth',block:'nearest'});const marker=state.markers[i+1];if(marker&&state.map){state.map.panTo(marker.getLatLng());if(openPopup)marker.openPopup()}}
$("#listViewBtn").onclick=()=>{$("#listViewBtn").classList.add('active');$("#mapViewBtn").classList.remove('active');$("#mapWrap").classList.remove('show');nearbyStores.classList.remove('hide')};$("#mapViewBtn").onclick=()=>{$("#mapViewBtn").classList.add('active');$("#listViewBtn").classList.remove('active');$("#mapWrap").classList.add('show');nearbyStores.classList.add('hide');ensureMap();setTimeout(()=>state.map?.invalidateSize(),120)};

function retailerQuery(i){const t=[i.retailCategory,...(i.likelyStoreTypes||[]),i.object,i.category,i.searchQuery].filter(Boolean).join(' ').toLowerCase();const routes=[['supermarket',/hot chocolate|cocoa|energy drink|beverage|food|drink|grocery|tissue|household|coffee|tea|chocolate/],['hearing aid store',/hearing aid|audiology/],['optician',/glasses|eyewear|contact lens/],['medical supply store',/wheelchair|crutch|medical supply|orthopaedic/],['shoe store',/shoe|sneaker|footwear/],['clothing store',/clothing|shirt|dress|fashion/],['electronics store',/electronics|headphone|speaker|phone|computer|camera/],['music store',/microphone|guitar|music|turntable/],['hardware store',/hardware|tool|drill|plumbing|electrical/],['stationery store',/pencil|stationery|notebook/],['pharmacy',/medicine|pharmacy|skincare/],['pet store',/pet|dog food|cat food/],['garden centre',/plant|flower|garden/],['auto parts store',/car part|tyre|battery|automotive/],['toy store',/toy|lego|puzzle/],['sports store',/sports|rugby|football|fitness/]];for(const [q,re] of routes)if(re.test(t))return q;return 'department store'}
function renderFreeActions(i){const q=String(i.searchQuery||i.name||i.object||'').trim();if(!q||Number(i.confidence||0)<.55)return;freeActions.classList.remove('hidden');$("#searchOnline").href=`https://www.google.com/search?q=${encodeURIComponent(q)}`;$("#onlineQueryText").textContent=q;const rq=retailerQuery(i);const mp=new URLSearchParams({api:'1',query:state.coords?`${rq} near ${state.coords.lat},${state.coords.lon}`:rq});$("#searchNearbyFree").href=`https://www.google.com/maps/search/?${mp.toString()}`;$("#copyQuery").onclick=async()=>{try{await navigator.clipboard.writeText(q);setStatus('✓ Product name copied.')}catch{setStatus('Copy unavailable.',true)}};$("#shareFind").onclick=async()=>{const text=`FindIt identified: ${i.name||i.object||q}. Search: ${q}`;try{if(navigator.share)await navigator.share({title:'FindIt Nearby',text,url:location.href});else{await navigator.clipboard.writeText(text);setStatus('✓ Find copied to share.')}}catch(e){if(e.name!=='AbortError')setStatus('Sharing unavailable.',true)}};$("#similarSearch").href=`https://www.google.com/search?q=${encodeURIComponent(q+' similar products')}`}
function showNothing(msg){nothingFound.classList.remove('hidden');nothingFound.querySelector('p').textContent=msg}$("#widenSearch").onclick=async()=>{if(!state.coords||!state.result?.identification)return;setRadius(20);await loadNearby(state.result.identification,20)};$("#retry").onclick=()=>photo.click();$("#changeItem").onclick=()=>photo.click();$("#correctSearch").onclick=()=>{const q=prompt('What should FindIt search for instead?',state.result?.identification?.searchQuery||'');if(q)window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`,'_blank')};

function getRecent(){try{return JSON.parse(localStorage.getItem('finditRecent')||'[]')}catch{return[]}}function saveRecent(i){const x={id:Date.now(),name:i.name||i.object||'Item',brand:i.brand||'',query:i.searchQuery||'',date:new Date().toISOString()};const arr=[x,...getRecent().filter(v=>v.query!==x.query)].slice(0,premiumHistoryLimit());localStorage.setItem('finditRecent',JSON.stringify(arr));renderRecent()}function renderRecent(){const arr=getRecent(),el=$("#recentList");if(!arr.length){el.innerHTML='<p class="muted">Nothing here yet.</p>';return}el.innerHTML=arr.map(x=>`<article class="recent-card"><strong>${esc(x.name)}</strong><small>${esc([x.brand,x.query].filter(Boolean).join(' • '))}</small><button data-recent="${esc(x.query)}">Search online →</button></article>`).join('');$$('[data-recent]').forEach(b=>b.onclick=()=>window.open(`https://www.google.com/search?q=${encodeURIComponent(b.dataset.recent)}`,'_blank'))}function clearRecent(){localStorage.removeItem('finditRecent');renderRecent()}$("#clearRecent").onclick=clearRecent;$("#clearHistorySetting").onclick=clearRecent;$("#openRecent").onclick=()=>{closeDrawer();$("#recent").scrollIntoView({behavior:'smooth'})};renderRecent();
function getSaved(){try{return JSON.parse(localStorage.getItem('finditSaved')||'[]')}catch{return[]}}$("#saveFind").onclick=()=>{const i=state.result?.identification;if(!i)return;const arr=[{name:i.name||i.object||'Item',query:i.searchQuery||'',savedAt:new Date().toISOString()},...getSaved()].slice(0,30);localStorage.setItem('finditSaved',JSON.stringify(arr));updatePremiumDashboard?.();$("#saveFind").textContent='✓ Saved';setTimeout(()=>$("#saveFind").textContent='♡ Save',1200)};

const feedbackRating=$("#feedbackRating"),feedbackMessage=$("#feedbackMessage"),feedbackTopic=$("#feedbackTopic"),includeTechnical=$("#includeTechnical"),feedbackStatus=$("#feedbackStatus");function setRating(n){feedbackRating.value=String(n);$$('.star-btn').forEach(b=>b.classList.toggle('active',Number(b.dataset.rating)<=n))}$$('.star-btn').forEach(b=>b.onclick=()=>setRating(Number(b.dataset.rating)));
function feedbackPayload(){return{rating:Number(feedbackRating.value||0),topic:feedbackTopic.value||'general',message:feedbackMessage.value.trim(),technical:includeTechnical.checked?{page:location.pathname,viewport:`${innerWidth}x${innerHeight}`,platform:navigator.platform||'unknown',language:navigator.language||'unknown',online:navigator.onLine,hasLocation:Boolean(state.coords),...state.diagnostics}:null,createdAt:new Date().toISOString()}}
$("#feedbackForm").onsubmit=async e=>{e.preventDefault();const p=feedbackPayload();if(!p.rating)return feedbackStatus.textContent='Choose a star rating first.';if(p.message.length<3)return feedbackStatus.textContent='Please write a little more detail.';$("#sendFeedback").disabled=true;feedbackStatus.textContent='Sending feedback…';try{const r=await fetch('/api/feedback',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(p)}),d=await r.json();if(!r.ok)throw Error(d.error||'Could not send');feedbackStatus.textContent=d.delivered?'✓ Thank you — your feedback was saved.':'Central storage is not connected yet.';feedbackMessage.value='';setRating(0)}catch{feedbackStatus.textContent='Feedback could not be sent right now.'}finally{$("#sendFeedback").disabled=false}};$("#copyFeedback").onclick=async()=>{const p=feedbackPayload();try{await navigator.clipboard.writeText(`FindIt rating: ${p.rating}/5\nTopic: ${p.topic}\n\n${p.message}`);feedbackStatus.textContent='✓ Feedback copied.'}catch{feedbackStatus.textContent='Copy unavailable.'}};
$("#thumbUp").onclick=()=>{trackFindIt("feedback_up",{success:true});feedbackTopic.value='general';setRating(5);feedbackMessage.value='FindIt got this search right.';$("#feedback").scrollIntoView({behavior:'smooth'})};$("#thumbDown").onclick=()=>{trackFindIt("feedback_down",{success:false});feedbackTopic.value='nearby';setRating(2);feedbackMessage.value='FindIt did not get this search fully right. ';$("#feedback").scrollIntoView({behavior:'smooth'});feedbackMessage.focus()};

window.addEventListener('resize',()=>state.map?.invalidateSize());

/* Mobile drawer shortcuts + visibility fallback */
document.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("drawerAskFindIt")?.addEventListener("click",()=>{
    if(typeof closeDrawer==="function")closeDrawer();
    if(typeof openAssistant==="function")openAssistant();
  });
  document.getElementById("drawerPremium")?.addEventListener("click",()=>{
    if(typeof closeDrawer==="function")closeDrawer();
    if(typeof openPremium==="function")openPremium();
  });
  if(window.matchMedia("(max-width:600px)").matches){
    document.querySelectorAll(".reveal").forEach(el=>el.classList.add("visible"));
  }
});

/* Mobile drawer shortcuts + visibility fallback V2 */
document.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("drawerAskFindIt")?.addEventListener("click",()=>{
    if(typeof closeDrawer==="function")closeDrawer();
    if(typeof openAssistant==="function")openAssistant();
  });
  document.getElementById("drawerPremium")?.addEventListener("click",()=>{
    if(typeof closeDrawer==="function")closeDrawer();
    if(typeof openPremium==="function")openPremium();
  });
  if(window.matchMedia("(max-width:600px)").matches){
    document.querySelectorAll(".reveal").forEach(el=>el.classList.add("visible"));
  }
});
