/*
FREE MVP ARCHITECTURE
1) Browser geolocation: free, built into modern browsers.
2) Gemini: optional image identification. Put a Gemini API key in a secure backend/serverless function.
3) OpenStreetMap + Overpass: nearby mapped businesses. Public endpoints have usage limits.
4) Leaflet: open-source map UI.

This browser-only demo uses a safe local fallback for image identification.
For a production launch, move the Gemini and Overpass calls to a backend/serverless function.
*/

const photo=document.getElementById("photo"),preview=document.getElementById("preview"),prompt=document.getElementById("prompt"),remove=document.getElementById("remove");
const locationBtn=document.getElementById("location"),find=document.getElementById("find"),status=document.getElementById("status"),chip=document.getElementById("locChip");
const results=document.getElementById("results"),resultPhoto=document.getElementById("resultPhoto"),places=document.getElementById("places");
let file=null,coords=null,map=null,markers=[];

photo.onchange=()=>{if(photo.files[0]){file=photo.files[0];preview.src=URL.createObjectURL(file);preview.style.display="block";prompt.style.display="none";remove.classList.remove("hidden");status.textContent=coords?"Ready to search.":"Photo ready — allow location access.";sync()}};
remove.onclick=e=>{e.preventDefault();e.stopPropagation();file=null;photo.value="";preview.src="";preview.style.display="none";prompt.style.display="block";remove.classList.add("hidden");status.textContent="Choose a photo and allow location access.";sync()};
locationBtn.onclick=()=>{if(!navigator.geolocation){status.textContent="Location is not supported by this browser.";return}locationBtn.textContent="Getting location…";navigator.geolocation.getCurrentPosition(p=>{coords={lat:p.coords.latitude,lon:p.coords.longitude};chip.textContent="📍 Location ready";locationBtn.textContent="✓ Location ready";status.textContent=file?"Ready to search.":"Location ready — now choose a photo.";sync()},()=>{chip.textContent="⚠️ Location blocked";locationBtn.textContent="Try again";status.textContent="Please allow location access in your browser settings."},{enableHighAccuracy:true,timeout:12000,maximumAge:300000})};
function sync(){find.disabled=!(file&&coords)}

find.onclick=async()=>{
 if(!file||!coords)return;
 results.classList.remove("hidden");resultPhoto.src=preview.src;
 document.getElementById("identified").textContent="Item from your photo";
 document.getElementById("identifiedDetail").textContent="AI identification is the next connected step.";
 status.textContent="Searching nearby mapped businesses…";
 initMap();
 try{
   const data=await nearbyPlaces(coords.lat,coords.lon);
   renderPlaces(data);
   status.textContent=`Found ${data.length} mapped places nearby.`;
 }catch(e){
   renderPlaces([]);
   status.textContent="The nearby-data service is busy. Try again in a moment.";
 }
 results.scrollIntoView({behavior:"smooth"});
};

async function nearbyPlaces(lat,lon){
 const q=`[out:json][timeout:15];(nwr["shop"](around:5000,${lat},${lon});nwr["amenity"="marketplace"](around:5000,${lat},${lon}););out center tags;`;
 const r=await fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:q});
 if(!r.ok)throw new Error("overpass");
 const j=await r.json();
 const arr=j.elements.map(x=>{
   const p=x.lat?{lat:x.lat,lon:x.lon}:{lat:x.center?.lat,lon:x.center?.lon};
   return {name:x.tags?.name||"Unnamed local shop",type:x.tags?.shop||x.tags?.amenity||"shop",...p};
 }).filter(x=>x.lat&&x.lon);
 return arr.map(x=>({...x,distance:distanceKm(lat,lon,x.lat,x.lon)})).sort((a,b)=>a.distance-b.distance).slice(0,15);
}
function distanceKm(a,b,c,d){const R=6371,rad=x=>x*Math.PI/180;const dLat=rad(c-a),dLon=rad(d-b);const h=Math.sin(dLat/2)**2+Math.cos(rad(a))*Math.cos(rad(c))*Math.sin(dLon/2)**2;return R*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h))}
function initMap(){if(map){map.setView([coords.lat,coords.lon],14);return}map=L.map("map").setView([coords.lat,coords.lon],14);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap contributors"}).addTo(map);L.marker([coords.lat,coords.lon]).addTo(map).bindPopup("You are here").openPopup()}
function renderPlaces(data){places.innerHTML=data.length?data.map((p,i)=>{const label=escapeHtml(p.name);if(map)L.marker([p.lat,p.lon]).addTo(map).bindPopup(label);return `<article class="place"><div><h3>${label}</h3><p class="meta">${escapeHtml(String(p.type))} • Mapped nearby place</p></div><div class="dist">${p.distance.toFixed(1)} km</div></article>`}).join(""):`<div class="place"><div><h3>No mapped shops found</h3><p class="meta">Try moving the map area or searching again later.</p></div></div>`}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
document.getElementById("again").onclick=()=>{results.classList.add("hidden");window.scrollTo({top:0,behavior:"smooth"})};
