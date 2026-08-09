import { pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";
const $=s=>document.querySelector(s);
const photo=$("#photo"),preview=$("#preview"),empty=$("#empty"),searchBtn=$("#search"),loc=$("#location"),status=$("#status");
let coords=null,model=null,ready=false;
const candidates=[
["a microphone",["microphone","audio","music"]],
["a headset",["headphones","audio","electronics"]],
["a pair of headphones",["headphones","audio","electronics"]],
["a sweater",["clothing","fashion"]],
["a ceiling light",["lighting","hardware","home"]],
["a pair of shoes",["shoes","footwear","sports"]],
["a chair",["furniture","home"]],
["a pencil case",["stationery","school"]],
["a smartphone",["mobile phone","electronics"]],
["a backpack",["bags","luggage","school"]],
["a book",["books","stationery"]],
["a kitchen appliance",["appliances","home"]],
["a tool",["hardware","tools"]],
["a toy",["toys"]],
["sports equipment",["sports"]],
["a camera",["cameras","electronics"]],
["a computer",["computers","electronics"]],
["a speaker",["audio","electronics"]],
["a flower",["flowers","plants","garden"]]
];
const labels=candidates.map(x=>x[0]);
const apiBase=window.FINDIT_API_BASE||"/api";
photo.onchange=()=>{if(!photo.files[0])return;ready=true;preview.src=URL.createObjectURL(photo.files[0]);preview.style.display="block";empty.style.display="none";searchBtn.disabled=false;status.textContent="Photo ready. A clear full-item photo works best."};
async function getLocation(){return new Promise((resolve,reject)=>{if(!navigator.geolocation)return reject();navigator.geolocation.getCurrentPosition(p=>{coords={lat:p.coords.latitude,lon:p.coords.longitude};loc.textContent="✓ Location ready";resolve(coords)},reject,{enableHighAccuracy:true,timeout:15000,maximumAge:300000})})}
loc.onclick=async()=>{try{await getLocation();status.textContent=ready?"Ready — identify the item.":"Location ready."}catch{status.textContent="Location permission unavailable. Search can still run without nearby filtering."}};
async function getModel(){if(model)return model;status.textContent="Loading visual AI…";model=await pipeline("zero-shot-image-classification","Xenova/clip-vit-base-patch32");return model}
async function identify(){
 const m=await getModel();
 const results=await m(preview.src,labels,{topk:labels.length});
 return results;
}
function categoryFor(label){return candidates.find(x=>x[0]===label)?.[1]||[]}
function confidenceGate(results){
 const top=results[0],second=results[1];
 const gap=(top?.score||0)-(second?.score||0);
 const confident=(top?.score||0)>=0.42 && gap>=0.08;
 return {top,second,gap,confident};
}
async function backendSearch(intent){
 const fd=new FormData();fd.append("image",photo.files[0]);fd.append("intent",intent.label);
 fd.append("confidence",intent.score);fd.append("category",JSON.stringify(intent.categories));
 if(coords){fd.append("lat",coords.lat);fd.append("lon",coords.lon)}
 try{const r=await fetch(apiBase+"/search",{method:"POST",body:fd});if(!r.ok)throw Error();return await r.json()}catch{return null}
}
function money(p){return p.price!=null?new Intl.NumberFormat("en-ZA",{style:"currency",currency:p.currency||"ZAR"}).format(p.price):"Price unavailable"}
function showConfidence(c){
 $("#confidence").innerHTML=`<div class="confidence"><strong>AI confidence: ${(c.top.score*100).toFixed(0)}%</strong> — ${c.top.label}<div class="bar"><i style="width:${Math.min(100,c.top.score*100)}%"></i></div></div>`;
}
function renderVerified(data,intent){
 const list=$("#productList"),banner=$("#liveBanner");
 if(data?.live && Array.isArray(data.products) && data.products.length){
  banner.textContent="✓ Verified product data returned from a connected catalogue.";
  list.innerHTML=data.products.map(p=>`<article class="product"><img src="${p.image||""}" alt="${p.name}"><div><h3>${p.name}</h3><p class="retailer">${p.brand?p.brand+" • ":""}${p.retailer}</p><p class="match">🎯 Match: ${Math.round((p.match||0)*100)}%</p><p>🏪 ${p.store?.name||"Store unavailable"}${p.distanceKm!=null?" • 📍 "+p.distanceKm.toFixed(1)+" km":""}</p><p class="stock">📦 ${p.stock?.status||"Stock status unavailable"}</p>${p.url?`<a class="link" target="_blank" rel="noopener" href="${p.url}">View product →</a>`:""}</div><div><div class="price">${money(p)}</div></div></article>`).join("");
  return true;
 }
 banner.textContent="No verified retailer result is available for this item.";
 list.innerHTML="";
 return false;
}
async function nearby(intent){
 if(!coords){$("#shops").innerHTML="<p>Allow location to see relevant nearby businesses.</p>";return}
 const tags=intent.categories;
 if(!tags.length){$("#shops").innerHTML="";return}
 const q=`[out:json][timeout:20];(${tags.map(t=>`nwr(around:10000,${coords.lat},${coords.lon})[shop];`).join("")});out center tags;`;
 try{
  const r=await fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:q});const j=await r.json();
  const arr=(j.elements||[]).map(x=>{const lat=x.lat??x.center?.lat,lon=x.lon??x.center?.lon,t=x.tags||{};if(!lat||!lon)return null;const shop=(t.shop||"").toLowerCase();const name=(t.name||"").toLowerCase();const relevant=tags.some(q=>shop.includes(q)||name.includes(q));return relevant?{name:t.name||"Unnamed business",type:t.shop||"retail",d:distance(coords.lat,coords.lon,lat,lon)}:null}).filter(Boolean).sort((a,b)=>a.d-b.d).slice(0,10);
  $("#shops").innerHTML=arr.map(x=>`<div class="shop"><span><b>${x.name}</b><br><small>${x.type}</small></span><small>${x.d.toFixed(1)} km</small></div>`).join("")||"<p>No relevant mapped businesses found.</p>";
 }catch{$("#shops").innerHTML="<p>Nearby search is temporarily unavailable.</p>"}
}
function distance(a,b,c,d){const R=6371,p=Math.PI/180,x=Math.sin((c-a)*p/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin((d-b)*p/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
async function noMatch(intent,reason){
 $("#results").classList.remove("hidden");$("#resultTitle").textContent="We won't guess";$("#summary").textContent=reason;
 $("#confidence").innerHTML="";$("#liveBanner").textContent="";
 $("#productList").innerHTML="";$("#noMatch").classList.remove("hidden");$("#fallback").classList.add("hidden");
}
searchBtn.onclick=async()=>{
 searchBtn.disabled=true;
 $("#noMatch").classList.add("hidden");
 try{
  const results=await identify();
  const gate=confidenceGate(results);
  showConfidence(gate);
  if(!gate.confident){
   await noMatch(gate.top,"The image is too ambiguous to safely identify. No unrelated store results will be shown.");
  }else{
   const intent={label:gate.top.label,score:gate.top.score,categories:categoryFor(gate.top.label)};
   status.textContent=`Detected: ${intent.label}. Checking relevant product data…`;
   $("#results").classList.remove("hidden");$("#resultTitle").textContent=intent.label;$("#summary").textContent="Searching only for this detected item/category.";
   const data=await backendSearch(intent);
   const verified=renderVerified(data,intent);
   if(!verified){
    $("#fallback").classList.remove("hidden");
    await nearby(intent);
   }else $("#fallback").classList.add("hidden");
  }
  $("#results").scrollIntoView({behavior:"smooth"});
  status.textContent="Search complete.";
 }catch(e){console.error(e);status.textContent="Visual AI could not load. Check your connection."}
 finally{searchBtn.disabled=!ready}
};
$("#retry").onclick=()=>photo.click();