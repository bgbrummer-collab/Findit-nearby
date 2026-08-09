import { pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";
const $=s=>document.querySelector(s);
const photo=$("#photo"),preview=$("#preview"),empty=$("#empty"),searchBtn=$("#search"),loc=$("#location"),status=$("#status");
let coords=null,model=null,ready=false;
const labels=["a microphone","a headset","a pair of headphones","a sweater","a ceiling light","a pair of shoes","a chair","a pencil case","a smartphone","a backpack","a book","a kitchen appliance","a tool","a toy","sports equipment","a camera","a computer","a speaker"];
const apiBase=window.FINDIT_API_BASE||"/api";

photo.onchange=()=>{
  if(!photo.files[0]) return;
  ready=true;
  preview.src=URL.createObjectURL(photo.files[0]);
  preview.style.display="block";
  empty.style.display="none";
  searchBtn.disabled=false;
  status.textContent="Photo ready. Brand, visible text and model clues can improve an exact match.";
};

async function getLocation(){
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation) return reject();
    navigator.geolocation.getCurrentPosition(
      p=>{coords={lat:p.coords.latitude,lon:p.coords.longitude};loc.textContent="✓ Location ready";resolve(coords)},
      reject,{enableHighAccuracy:true,timeout:15000,maximumAge:300000}
    );
  });
}
loc.onclick=async()=>{
  try{await getLocation();status.textContent=ready?"Ready — find the product.":"Location ready."}
  catch{status.textContent="Location permission unavailable. Search can still run without nearby filtering."}
};

async function getModel(){
  if(model) return model;
  status.textContent="Loading visual AI…";
  model=await pipeline("zero-shot-image-classification","Xenova/clip-vit-base-patch32");
  return model;
}
async function identify(){
  const m=await getModel();
  return (await m(preview.src,labels,{topk:5}))[0];
}
async function backendSearch(intent){
  const fd=new FormData();
  fd.append("image",photo.files[0]);
  fd.append("intent",intent.label);
  if(coords){fd.append("lat",coords.lat);fd.append("lon",coords.lon)}
  try{
    const r=await fetch(apiBase+"/search",{method:"POST",body:fd});
    if(!r.ok) throw Error();
    return await r.json();
  }catch{return null}
}
function money(p){
  return p.price!=null
    ?new Intl.NumberFormat("en-ZA",{style:"currency",currency:p.currency||"ZAR"}).format(p.price)
    :"Price unavailable";
}
function render(data,intent){
  $("#results").classList.remove("hidden");
  $("#summary").textContent=`Detected object: ${intent.label}. Verified results use catalogue data; similar results are labelled clearly.`;
  const banner=$("#liveBanner"),list=$("#productList"),fallback=$("#fallback");
  if(data?.live){
    banner.textContent="✓ Verified product data returned from a connected catalogue.";
    list.innerHTML=data.products.map(p=>`
      <article class="product">
        <img src="${p.image||""}" alt="${p.name}">
        <div>
          <h3>${p.name}</h3>
          <p class="retailer">${p.brand?p.brand+" • ":""}${p.retailer}</p>
          <p class="match">🎯 Visual match: ${Math.round((p.match||0)*100)}%</p>
          <p>🏪 ${p.store?.name||"Store unavailable"}${p.distanceKm!=null?" • 📍 "+p.distanceKm.toFixed(1)+" km":""}</p>
          <p class="stock">📦 ${p.stock?.status||"Stock status unavailable"}</p>
          ${p.store?.lat&&p.store?.lon?`<a class="link maplink" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${p.store.lat},${p.store.lon}">Directions →</a>`:""}
          ${p.url?`<a class="link" target="_blank" rel="noopener" href="${p.url}">View product →</a>`:""}
        </div>
        <div><div class="price">${money(p)}</div></div>
      </article>`).join("");
    fallback.classList.add("hidden");
  }else{
    banner.textContent="No verified exact-product result is available. FindIt will not invent a store, price or stock.";
    list.innerHTML="";
    fallback.classList.remove("hidden");
    loadNearby(intent);
  }
}
async function loadNearby(intent){
  if(!coords){$("#shops").innerHTML="<p>Allow location to see relevant nearby businesses.</p>";return}
  const tags=intent.label.includes("microphone")?["electronics","music"]:
    intent.label.includes("headphone")?["electronics"]:
    intent.label.includes("shoes")?["shoes","sports"]:
    intent.label.includes("sweater")?["clothes","fashion"]:
    intent.label.includes("light")?["lighting","hardware"]:
    ["department_store","electronics"];
  const q=`[out:json][timeout:20];(${tags.map(t=>`nwr(around:10000,${coords.lat},${coords.lon})[shop=${t}];`).join("")});out center tags;`;
  try{
    const r=await fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:q});
    const j=await r.json();
    const arr=(j.elements||[]).map(x=>{
      const lat=x.lat??x.center?.lat,lon=x.lon??x.center?.lon,t=x.tags||{};
      if(!lat||!lon)return null;
      return{name:t.name||"Unnamed business",type:t.shop||"retail",d:distance(coords.lat,coords.lon,lat,lon)};
    }).filter(Boolean).sort((a,b)=>a.d-b.d).slice(0,10);
    $("#shops").innerHTML=arr.map(x=>`<div class="shop"><span><b>${x.name}</b><br><small>${x.type}</small></span><small>${x.d.toFixed(1)} km</small></div>`).join("")||"<p>No mapped nearby businesses found.</p>";
  }catch{$("#shops").innerHTML="<p>Nearby search is temporarily unavailable.</p>"}
}
function distance(a,b,c,d){
  const R=6371,p=Math.PI/180;
  const x=Math.sin((c-a)*p/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin((d-b)*p/2)**2;
  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
searchBtn.onclick=async()=>{
  searchBtn.disabled=true;
  try{
    const intent=await identify();
    status.textContent=`Detected: ${intent.label}. Checking verified product data…`;
    render(await backendSearch(intent),intent);
    status.textContent="Search complete.";
    $("#results").scrollIntoView({behavior:"smooth"});
  }catch(e){
    console.error(e);
    status.textContent="Visual AI could not load. Check your connection.";
  }finally{searchBtn.disabled=!ready}
};