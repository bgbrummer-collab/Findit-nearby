const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const photo=$("#photo"), cameraInput=$("#cameraInput"), preview=$("#preview"), emptyState=$("#emptyState");
const searchButton=$("#search"), locationButton=$("#location"), statusBox=$("#status");
const overlay=$("#loadingOverlay"), loadingTitle=$("#loadingTitle"), loadingText=$("#loadingText");
const API_BASE=window.FINDIT_API_BASE||"/api";

let coords=null,imageReady=false,searching=false,lastResult=null,currentStores=[],map=null,mapLarge=null;

function esc(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}
function normalise(v){return String(v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim()}
function safeUrl(v){if(!v)return null;let u=String(v).trim();if(!/^https?:\/\//i.test(u))u="https://"+u;try{const p=new URL(u);return["http:","https:"].includes(p.protocol)?p.href:null}catch{return null}}
function phoneHref(v){return String(v||"").replace(/[^\d+]/g,"")}
function showLoading(title,text){loadingTitle.textContent=title;loadingText.textContent=text;overlay.classList.remove("hidden")}
function hideLoading(){overlay.classList.add("hidden")}
function distanceKm(a,b,c,d){const R=6371,p=Math.PI/180,x=Math.sin((c-a)*p/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin((d-b)*p/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}

function acceptFile(file){
  if(!file)return;
  if(!file.type.startsWith("image/")){statusBox.textContent="Please choose an image file.";return}
  if(file.size>8_000_000){statusBox.textContent="Please use an image smaller than 8 MB.";return}

  const transfer=new DataTransfer();transfer.items.add(file);photo.files=transfer.files;
  preview.src=URL.createObjectURL(file);preview.style.display="block";emptyState.style.display="none";
  imageReady=true;lastResult=null;searchButton.disabled=false;statusBox.textContent="Photo ready. FindIt can identify it now.";
  $("#results").classList.add("hidden");
}

photo.addEventListener("change",()=>acceptFile(photo.files?.[0]));
cameraInput.addEventListener("change",()=>acceptFile(cameraInput.files?.[0]));
$("#heroUpload").addEventListener("click",()=>photo.click());
$("#heroCamera").addEventListener("click",()=>cameraInput.click());

[$("#heroDropzone"),$("#finderDropzone")].forEach(zone=>{
  zone.addEventListener("dragover",e=>{e.preventDefault();zone.classList.add("dragging")});
  zone.addEventListener("dragleave",()=>zone.classList.remove("dragging"));
  zone.addEventListener("drop",e=>{
    e.preventDefault();zone.classList.remove("dragging");
    acceptFile(e.dataTransfer?.files?.[0]);
    $("#finder").scrollIntoView({behavior:"smooth"});
  });
});

function getLocation(){
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation)return reject(new Error("Location is not supported by this browser."));
    navigator.geolocation.getCurrentPosition(
      p=>{coords={lat:p.coords.latitude,lon:p.coords.longitude};resolve(coords)},
      reject,{enableHighAccuracy:true,timeout:15000,maximumAge:300000}
    );
  });
}

async function ensureLocation(){
  if(coords)return coords;
  showLoading("Getting your location…","Your browser may ask for permission.");
  try{
    await getLocation();
    locationButton.textContent="✓ Location ready";
    statusBox.textContent="Location ready.";
    $("#locationLabel").textContent="your current location";
    return coords;
  }finally{hideLoading()}
}

locationButton.addEventListener("click",async()=>{
  locationButton.disabled=true;
  try{
    await ensureLocation();
    if(lastResult?.identification){
      showLoading("Finding nearby retailers…","Ranking the most relevant stores.");
      await renderNearby(lastResult.identification);
      statusBox.textContent="Nearby search complete.";
    }
  }catch(e){console.error(e);statusBox.textContent="Location permission was not available."}
  finally{hideLoading();locationButton.disabled=false}
});

$("#changeLocation").addEventListener("click",async()=>{
  coords=null;locationButton.textContent="⌖ Use my location";
  try{
    await ensureLocation();
    if(lastResult?.identification){
      showLoading("Updating nearby retailers…","Using your refreshed location.");
      await renderNearby(lastResult.identification);
    }
  }catch{statusBox.textContent="Could not update location."}
  finally{hideLoading()}
});

async function identifyItem(){
  const file=photo.files?.[0];if(!file)throw new Error("Choose a photo first.");
  const form=new FormData();form.append("image",file);
  const response=await fetch(`${API_BASE}/search`,{method:"POST",body:form});

  let data;try{data=await response.json()}catch{throw new Error("FindIt received an unreadable AI response.")}
  if(!response.ok||data.ok===false){
    const msg=data.details||data.error||"Image identification failed.";
    if(/quota|rate|429/i.test(msg))throw new Error("Gemini's free usage limit is temporarily reached. Try again later.");
    throw new Error(msg);
  }
  return data;
}

async function fetchNearby(){
  if(!coords)throw new Error("Location is required.");
  const response=await fetch(`${API_BASE}/nearby`,{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(coords)
  });
  let data;try{data=await response.json()}catch{throw new Error("Nearby-store service returned an unreadable response.")}
  if(!response.ok||data.ok!==true)throw new Error(data.error||"Nearby retailer service is temporarily unavailable.");
  return Array.isArray(data.elements)?data.elements:[];
}

function renderIdentification(data){
  const item=data.identification||{},confidence=Math.max(0,Math.min(100,Math.round(Number(item.confidence||0)*100)));
  lastResult=data;$("#results").classList.remove("hidden");$("#lowConfidence").classList.add("hidden");

  $("#resultImage").src=preview.src;$("#resultTitle").textContent=item.name||item.object||"Item identified";
  $("#resultSubtitle").textContent=item.summary||item.searchQuery||"";$("#matchText").textContent=`${confidence}% match`;
  $("#confidenceNumber").textContent=`${confidence}%`;$("#confidenceRing").style.setProperty("--score",`${confidence}%`);
  $("#confidenceLabel").textContent=confidence>=90?"Very High Match":confidence>=75?"Strong Match":confidence>=55?"Possible Match":"Low Confidence";

  $("#productTags").innerHTML=[item.brand,item.model,item.category].filter(Boolean).map(t=>`<span>${esc(t)}</span>`).join("");
  const visibleText=Array.isArray(item.visibleText)&&item.visibleText.length?item.visibleText.join(", "):"None detected";

  $("#detailsContent").innerHTML=`
    <div class="eyebrow">PRODUCT DETAILS</div>
    <h3>${esc(item.name||item.object||"Identified item")}</h3>
    <div class="details-grid">
      <div class="detail-box"><small>Object</small><b>${esc(item.object||"Unknown")}</b></div>
      <div class="detail-box"><small>Brand</small><b>${esc(item.brand||"Not detected")}</b></div>
      <div class="detail-box"><small>Model</small><b>${esc(item.model||"Not detected")}</b></div>
      <div class="detail-box"><small>Category</small><b>${esc(item.category||"Not detected")}</b></div>
      <div class="detail-box"><small>Colour</small><b>${esc(item.color||"Not detected")}</b></div>
      <div class="detail-box"><small>Visible text</small><b>${esc(visibleText)}</b></div>
      <div class="detail-box"><small>Search phrase</small><b>${esc(item.searchQuery||"Not available")}</b></div>
      <div class="detail-box"><small>Confidence</small><b>${confidence}%</b></div>
    </div>`;
  renderVerifiedOffers(data);
}

function renderVerifiedOffers(data){
  const offers=Array.isArray(data.offers)?data.offers:[],box=$("#verifiedOffers"),comparison=$("#comparisonContent");
  if(!offers.length){
    box.innerHTML="";
    comparison.innerHTML=`<div class="feature-icon">⇄</div><h3>Ready for real retailer prices.</h3><p>FindIt will only display prices and exact stock when a legitimate retailer catalogue or inventory connection supplies them.</p>`;
    return;
  }

  $("#verifiedNotice").textContent="✓ Verified retailer offers are available for this item.";

  const offerHtml=offers.map(offer=>{
    const store=offer.store||{};
    const price=offer.price==null?"Price unavailable":new Intl.NumberFormat("en-ZA",{style:"currency",currency:offer.currency||"ZAR"}).format(Number(offer.price));
    return `<article class="offer-card"><div><b>${esc(offer.name||lastResult?.identification?.name||"Product")}</b><div>${esc(store.name||offer.retailer||"Retailer")}</div><small class="offer-stock">${esc(offer.stock?.status||"Stock status unavailable")}</small></div><div class="offer-price">${esc(price)}</div></article>`;
  }).join("");
  box.innerHTML=`<div class="offer-grid">${offerHtml}</div>`;comparison.innerHTML=`<div class="offer-grid">${offerHtml}</div>`;
}

const KNOWN_PRODUCT_BRANDS=new Set([
  "adidas","nike","puma","reebok","converse","vans","new balance","under armour","asics","skechers","crocs","fila","salomon","hoka",
  "apple","samsung","huawei","xiaomi","sony","lg","bose","jbl","canon","nikon","lenovo","hp","dell","acer","asus","logitech","microsoft"
]);
const KNOWN_MULTIBRAND_RETAILERS=["totalsports","total sports","footgear","sportscene","sportsmans warehouse","sportsman warehouse","jd sports","studio 88","takealot","makro","incredible connection","game","woolworths","edgars","mr price sport"];
const KNOWN_DOMAINS=[
  ["totalsports","totalsports.co.za"],["total sports","totalsports.co.za"],["footgear","footgear.co.za"],["sportscene","sportscene.co.za"],
  ["sportsmans warehouse","sportsmanswarehouse.co.za"],["sportsman warehouse","sportsmanswarehouse.co.za"],["jd sports","jdsports.co.za"],
  ["studio 88","studio-88.co.za"],["nike","nike.com"],["adidas","adidas.co.za"],["puma","puma.com"],["skechers","skechers.co.za"],
  ["incredible connection","incredible.co.za"],["makro","makro.co.za"],["game","game.co.za"]
];

function categoryProfile(item){
  const t=normalise(`${item.object||""} ${item.name||""} ${item.category||""} ${item.searchQuery||""}`);
  if(/shoe|sneaker|footwear|trainer/.test(t))return{types:["shoes","clothes","department_store","sports"],words:["shoe","sneaker","footwear","sport"],strictSports:true};
  if(/microphone|headphone|earphone|speaker|audio|sound/.test(t))return{types:["electronics","music","hifi","computer"],words:["audio","music","sound","electronics"],strictSports:false};
  if(/phone|smartphone|tablet/.test(t))return{types:["mobile_phone","electronics","computer"],words:["mobile","phone","electronics"],strictSports:false};
  if(/computer|laptop|monitor|keyboard|mouse/.test(t))return{types:["computer","electronics"],words:["computer","technology","electronics"],strictSports:false};
  if(/camera|lens|photography/.test(t))return{types:["camera","electronics"],words:["camera","photography"],strictSports:false};
  if(/shirt|sweater|hoodie|jacket|dress|clothing|fashion/.test(t))return{types:["clothes","fashion","department_store"],words:["clothes","fashion","clothing"],strictSports:false};
  if(/flower|plant|bouquet/.test(t))return{types:["florist","garden_centre"],words:["flower","florist","plant","garden"],strictSports:false};
  if(/chair|table|desk|sofa|couch|furniture/.test(t))return{types:["furniture","houseware","interior_decoration"],words:["furniture","home","interior"],strictSports:false};
  if(/book|novel|textbook/.test(t))return{types:["books","stationery"],words:["book","books"],strictSports:false};
  if(/pen|pencil|stationery|notebook/.test(t))return{types:["stationery","variety_store"],words:["stationery","office","school"],strictSports:false};
  if(/tool|drill|hammer|hardware|screwdriver/.test(t))return{types:["hardware","doityourself","trade"],words:["hardware","tool","tools"],strictSports:false};
  if(/toy|lego|game|console/.test(t))return{types:["toys","games","video_games","variety_store"],words:["toy","game","games"],strictSports:false};
  return{types:[],words:normalise(item.category||item.object||"").split(" ").filter(w=>w.length>=4),strictSports:false};
}

function extractStore(place){
  const lat=place.lat??place.center?.lat,lon=place.lon??place.center?.lon;if(lat==null||lon==null)return null;
  const tags=place.tags||{},name=tags.name||tags.brand||"Unnamed retailer";
  return{
    name,lat,lon,type:tags.shop||tags.amenity||"retail",website:safeUrl(tags["contact:website"]||tags.website),
    phone:tags["contact:phone"]||tags.phone||tags["contact:mobile"]||tags.mobile||null,opening:tags.opening_hours||null,
    address:[tags["addr:housenumber"],tags["addr:street"],tags["addr:suburb"],tags["addr:city"]].filter(Boolean).join(", "),tags
  };
}

function findKnownMaker(text){
  const n=normalise(text);
  for(const brand of KNOWN_PRODUCT_BRANDS){
    if(n===brand||n.startsWith(brand+" ")||n.endsWith(" "+brand)||n.includes(" "+brand+" "))return brand;
  }
  return null;
}
function isMultiBrandRetailer(store){const n=normalise(store.name);return KNOWN_MULTIBRAND_RETAILERS.some(r=>n.includes(r))}
function isCompetingSingleBrandStore(store,item){
  const itemBrand=normalise(item.brand);if(!itemBrand||isMultiBrandRetailer(store))return false;
  const storeBrand=findKnownMaker(store.tags.brand||store.tags.name||store.name);return !!storeBrand&&storeBrand!==itemBrand;
}
function retailerScore(store,item,profile){
  const name=normalise(store.name),type=normalise(store.type),blob=normalise([store.name,store.type,store.tags.brand,store.tags.operator,store.tags.description].filter(Boolean).join(" "));
  const itemBrand=normalise(item.brand);let score=0;
  if(isCompetingSingleBrandStore(store,item))return-9999;
  if(itemBrand&&(name.includes(itemBrand)||normalise(store.tags.brand)===itemBrand))score+=220;
  if(isMultiBrandRetailer(store))score+=45;
  if(profile.types.includes(type))score+=70;
  for(const word of profile.words)if(word&&blob.includes(normalise(word)))score+=12;

  if(profile.strictSports&&type==="sports"){
    const shoeEvidence=/shoe|sneaker|footwear/.test(blob),brandEvidence=itemBrand&&blob.includes(itemBrand);
    if(!isMultiBrandRetailer(store)&&!shoeEvidence&&!brandEvidence)score-=80;
  }
  return score;
}

function faviconForStore(store){
  let domain=null;
  if(store.website){try{domain=new URL(store.website).hostname.replace(/^www\./,"")}catch{}}
  if(!domain){const n=normalise(store.name),known=KNOWN_DOMAINS.find(([key])=>n.includes(key));if(known)domain=known[1]}
  return domain?`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`:null;
}
function retailerSearchUrl(store,item){
  if(!item.searchQuery||!store.website)return null;
  try{
    const domain=new URL(store.website).hostname.replace(/^www\./,"");
    return`https://www.google.com/search?q=${encodeURIComponent(`site:${domain} ${item.searchQuery}`)}`;
  }catch{return null}
}

async function renderNearby(item){
  if(!coords){$("#stores").innerHTML=`<div class="empty-card">Press <b>Use my location</b> to see nearby retailers.</div>`;return}
  const raw=await fetchNearby(),profile=categoryProfile(item);
  let stores=raw.map(extractStore).filter(Boolean).map(store=>({...store,score:retailerScore(store,item,profile),distance:distanceKm(coords.lat,coords.lon,store.lat,store.lon)}))
    .filter(store=>store.score>=30).sort((a,b)=>b.score-a.score||a.distance-b.distance);

  const seen=new Set();
  stores=stores.filter(store=>{const key=`${normalise(store.name)}|${store.lat.toFixed(5)}|${store.lon.toFixed(5)}`;if(seen.has(key))return false;seen.add(key);return true}).slice(0,12);
  currentStores=stores;$("#nearbyCount").textContent=stores.length?`(${stores.length})`:"";

  if(!stores.length){$("#stores").innerHTML=`<div class="empty-card">FindIt reached the map service, but no strong retailer matches were found nearby.</div>`;updateMaps([]);return}

  $("#stores").innerHTML=stores.map((store,index)=>{
    const directions=`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${store.lat},${store.lon}`)}`;
    const logo=faviconForStore(store),searchUrl=retailerSearchUrl(store,item);
    const fallback=esc(store.name.charAt(0).toUpperCase());
    const logoHtml=logo?`<img src="${esc(logo)}" alt="" onerror="this.parentElement.textContent='${fallback}'">`:fallback;
    const relevance=store.score>=180?"Best brand match":store.score>=90?"Strong retailer match":"Relevant retailer";

    return`<article class="store-card">
      <div class="store-logo">${logoHtml}</div>
      <div>
        <div class="store-title"><span class="rank-pill">${index+1}</span>${esc(store.name)}<span class="relevance-chip">${esc(relevance)}</span></div>
        <div class="store-sub">${esc(store.address||store.type)}<br>${store.distance.toFixed(1)} km away${store.opening?` • ${esc(store.opening)}`:""}</div>
        <div class="store-actions">
          ${store.phone?`<a href="tel:${esc(phoneHref(store.phone))}">☎ Call</a>`:""}
          ${store.website?`<a href="${esc(store.website)}" target="_blank" rel="noopener noreferrer">▣ Website</a>`:""}
          ${searchUrl?`<a href="${esc(searchUrl)}" target="_blank" rel="noopener noreferrer">⌕ Search retailer</a>`:""}
          <a href="${esc(directions)}" target="_blank" rel="noopener noreferrer">⌖ Directions</a>
        </div>
      </div>
      <div class="store-side"><div class="store-distance">${store.distance.toFixed(1)} km</div><div class="store-stock">Exact stock not verified</div></div>
    </article>`;
  }).join("");
  updateMaps(stores);
}

function createMap(id){
  if(typeof L==="undefined"||!document.getElementById(id))return null;
  const initial=coords?[coords.lat,coords.lon]:[-30.5595,22.9375],m=L.map(id).setView(initial,coords?12:5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"&copy; OpenStreetMap contributors"}).addTo(m);return m;
}
function updateMaps(stores){
  if(!coords||typeof L==="undefined")return;if(!map)map=createMap("map");if(!mapLarge)mapLarge=createMap("mapLarge");
  for(const m of[map,mapLarge]){
    if(!m)continue;
    m.eachLayer(layer=>{if(layer instanceof L.Marker||layer instanceof L.CircleMarker)m.removeLayer(layer)});
    L.circleMarker([coords.lat,coords.lon],{radius:8,color:"#3777ff",fillColor:"#3777ff",fillOpacity:1}).addTo(m).bindPopup("You are here");
    stores.forEach((store,index)=>L.marker([store.lat,store.lon]).addTo(m).bindPopup(`<b>${index+1}. ${esc(store.name)}</b><br>${store.distance.toFixed(1)} km away`));
    const points=[[coords.lat,coords.lon],...stores.map(store=>[store.lat,store.lon])];
    stores.length?m.fitBounds(points,{padding:[30,30],maxZoom:14}):m.setView([coords.lat,coords.lon],13);
    setTimeout(()=>m.invalidateSize(),120);
  }
}

function renderLowConfidence(data){
  const item=data.identification||{};lastResult=null;
  $("#results").classList.remove("hidden");$("#lowConfidence").classList.remove("hidden");$("#resultImage").src=preview.src;
  $("#resultTitle").textContent=item.name||item.object||"FindIt isn't confident enough";$("#resultSubtitle").textContent=data.message||"Try another photo.";
  $("#matchText").textContent="Low confidence";$("#productTags").innerHTML="";$("#stores").innerHTML="";
}

searchButton.addEventListener("click",async()=>{
  if(!imageReady||searching)return;searching=true;searchButton.disabled=true;
  try{
    showLoading("Identifying your item…","Looking for the object, brand, model and visible text.");
    const data=await identifyItem(),confidence=Number(data.identification?.confidence||0);hideLoading();

    if(confidence<.55){renderLowConfidence(data);$("#results").scrollIntoView({behavior:"smooth"});statusBox.textContent="Try another photo.";return}
    renderIdentification(data);

    if(coords){showLoading("Finding nearby retailers…","Removing weak and competing-brand results.");await renderNearby(data.identification)}
    else $("#stores").innerHTML=`<div class="empty-card">Item identified. Press <b>Use my location</b> to load nearby retailers.</div>`;

    saveRecent(data.identification);$("#results").scrollIntoView({behavior:"smooth"});statusBox.textContent="Search complete.";
  }catch(e){console.error(e);statusBox.textContent=`FindIt could not complete the search: ${e.message}`}
  finally{hideLoading();searching=false;searchButton.disabled=!imageReady}
});
$("#retry").addEventListener("click",()=>photo.click());

$$(".result-tab").forEach(button=>button.addEventListener("click",()=>{
  $$(".result-tab").forEach(b=>b.classList.remove("active"));$$(".result-panel").forEach(p=>p.classList.remove("active"));
  button.classList.add("active");$(`#panel-${button.dataset.tab}`).classList.add("active");
  if(button.dataset.tab==="map"&&mapLarge)setTimeout(()=>mapLarge.invalidateSize(),120);
}));

const RECENT_KEY="findit_recent_searches";
function recentSearches(){try{return JSON.parse(localStorage.getItem(RECENT_KEY)||"[]")}catch{return[]}}
function saveRecent(item){
  const list=recentSearches(),entry={name:item.name||item.object||"Item",brand:item.brand||"",model:item.model||"",category:item.category||"",searchQuery:item.searchQuery||"",time:Date.now()};
  const filtered=list.filter(x=>normalise(x.searchQuery||x.name)!==normalise(entry.searchQuery||entry.name));filtered.unshift(entry);
  localStorage.setItem(RECENT_KEY,JSON.stringify(filtered.slice(0,10)));
}
function renderRecent(){
  const list=recentSearches();
  $("#recentList").innerHTML=list.length?list.map(item=>`<div class="recent-item"><b>${esc(item.name)}</b><small>${esc([item.brand,item.model,item.category].filter(Boolean).join(" • "))}</small></div>`).join(""):`<div class="empty-card">No recent searches yet.</div>`;
}
function saveCurrentSearch(){if(!lastResult?.identification){statusBox.textContent="Run a search first.";return}saveRecent(lastResult.identification);statusBox.textContent="Search saved on this device."}
$("#saveSearch").addEventListener("click",saveCurrentSearch);$("#saveSearchBottom").addEventListener("click",saveCurrentSearch);
$("#recentButton").addEventListener("click",()=>{renderRecent();$("#recentModal").classList.remove("hidden")});
$("#closeRecent").addEventListener("click",()=>$("#recentModal").classList.add("hidden"));
$("#recentModal").addEventListener("click",e=>{if(e.target.id==="recentModal")$("#recentModal").classList.add("hidden")});

$("#shareResult").addEventListener("click",async()=>{
  if(!lastResult?.identification)return;
  const item=lastResult.identification,text=`FindIt Nearby identified: ${item.name||item.object}`;
  try{
    if(navigator.share)await navigator.share({title:"FindIt Nearby",text,url:location.href});
    else{await navigator.clipboard.writeText(location.href);statusBox.textContent="Link copied."}
  }catch{}
});
