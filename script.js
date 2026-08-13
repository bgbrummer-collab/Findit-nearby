const $=(s)=>document.querySelector(s);

let finditDiagnostics={
  item:null,
  searchQuery:null,
  retailCategory:null,
  likelyStoreTypes:[],
  recognitionConfidence:null,
  exactProductMatch:false,
  exactOfferCount:0,
  nearbyStoreCount:0,
  closestStoreDistanceKm:null,
  nearbyRadiusKm:null,
  nearbyRetailGroup:null,
  nearbyReliable:null,
  lastError:null,
  lastSearchCompletedAt:null
};

const freeActions=$("#freeActions"),searchOnline=$("#searchOnline"),searchNearbyFree=$("#searchNearbyFree"),copyQuery=$("#copyQuery"),shareFind=$("#shareFind"),onlineQueryText=$("#onlineQueryText");
const photo=$("#photo"),cameraPhoto=$("#cameraPhoto"),choosePhoto=$("#choosePhoto"),takePhoto=$("#takePhoto"),preview=$("#preview"),uploadPlaceholder=$("#uploadPlaceholder"),searchBtn=$("#search"),locationBtn=$("#location"),status=$("#status"),results=$("#results"),resultTitle=$("#resultTitle"),summary=$("#summary"),analysis=$("#analysis"),warning=$("#warning"),offersEl=$("#offers"),noOffers=$("#noOffers"),nearbyBlock=$("#nearbyBlock"),nearbyStores=$("#nearbyStores"),saveFind=$("#saveFind"),savedList=$("#savedList");
let selectedFile=null,coords=null,latestResult=null,currentOffers=[],currentSort="best";

choosePhoto.addEventListener("click",()=>photo.click());
takePhoto.addEventListener("click",()=>cameraPhoto.click());
photo.addEventListener("change",()=>onFileSelected(photo.files?.[0]));
cameraPhoto.addEventListener("change",()=>onFileSelected(cameraPhoto.files?.[0]));

function onFileSelected(file){
  if(!file)return;
  if(!file.type.startsWith("image/"))return setStatus("Please choose an image file.",true);
  if(file.size>8*1024*1024)return setStatus("Please use an image smaller than 8 MB.",true);
  selectedFile=file;
  preview.src=URL.createObjectURL(file);
  preview.classList.remove("hidden");
  uploadPlaceholder.classList.add("hidden");
  searchBtn.disabled=false;
  setStatus("Photo ready. FindIt will identify the actual item with Gemini.");
}

locationBtn.addEventListener("click",async()=>{
  try{
    coords=await getLocation();
    locationBtn.textContent="✓ Location ready";
    setStatus("Location ready. Nearby results can now be ranked by distance.");
  }catch{
    setStatus("Location permission was not granted. Image identification can still work.",true);
  }
});

function getLocation(){
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation)return reject(new Error("Geolocation unavailable"));
    navigator.geolocation.getCurrentPosition(
      p=>resolve({lat:p.coords.latitude,lon:p.coords.longitude}),
      reject,
      {enableHighAccuracy:true,timeout:15000,maximumAge:300000}
    );
  });
}

searchBtn.addEventListener("click",async()=>{
  if(!selectedFile)return;
  resetResults();
  searchBtn.disabled=true;
  setStatus("Analysing object, brand, model and visible text…");
  try{
    const form=new FormData();
    form.append("image",selectedFile);
    if(coords){form.append("lat",String(coords.lat));form.append("lon",String(coords.lon))}
    const response=await fetch("api/search",{method:"POST",body:form});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data?.message||data?.error||`Search failed (${response.status})`);

    latestResult=data;
    renderIdentification(data.identification||{});
    {
      const di=data.identification||{};
      finditDiagnostics.item=di.name||di.object||null;
      finditDiagnostics.searchQuery=di.searchQuery||null;
      finditDiagnostics.retailCategory=di.retailCategory||di.category||null;
      finditDiagnostics.likelyStoreTypes=Array.isArray(di.likelyStoreTypes)?di.likelyStoreTypes:[];
      finditDiagnostics.recognitionConfidence=Number.isFinite(Number(di.confidence))?Number(di.confidence):null;
      finditDiagnostics.lastError=null;
    }
    renderFreeActions(data.identification||{});
    if(coords) loadNearbyStores(data.identification||{});
    currentOffers=Array.isArray(data.offers)?data.offers:[];
    finditDiagnostics.exactOfferCount=currentOffers.length;
    finditDiagnostics.exactProductMatch=currentOffers.length>0;
    renderOffers();

    const confidence=Number(data.identification?.confidence||0);
    if(data.blocked)showWarning(data.message||"FindIt cannot search for this item.",true);
    else if(confidence<0.55)showWarning("FindIt is not confident enough to guess. Try a clearer photo showing the whole item, brand or model text.");
    else if(!currentOffers.length)showWarning(data.message||"Item identified, but no verified retailer feed has a matching offer yet.");

    if(coords&&!data.blocked&&confidence>=0.55)await loadNearby(data.identification||{});

    results.classList.remove("hidden");
    results.scrollIntoView({behavior:"smooth"});
    setStatus(currentOffers.length?"Search complete — verified offers found.":"Search complete — item identified; verified retailer data is still needed for real offers.");
  }catch(error){
    console.error(error);
    results.classList.remove("hidden");
    showWarning(`Search error: ${error.message}`,true);
    setStatus("Search failed. Check the message below.",true);
    results.scrollIntoView({behavior:"smooth"});
  }finally{searchBtn.disabled=!selectedFile}
});

function resetResults(){
  latestResult=null;currentOffers=[];offersEl.innerHTML="";analysis.innerHTML="";nearbyStores.innerHTML="";
  nearbyBlock.classList.add("hidden");noOffers.classList.add("hidden");warning.classList.add("hidden");warning.classList.remove("error");if(freeActions)freeActions.classList.add("hidden");
}

function renderIdentification(i){
  resultTitle.textContent=i.name||i.model||i.object||"Item identified";
  summary.textContent=i.summary||"Gemini analysed the uploaded image.";
  const confidence=clamp(Math.round(Number(i.confidence||0)*100),0,100);
  const visibleText=Array.isArray(i.visibleText)&&i.visibleText.length?i.visibleText.slice(0,6).join(" • "):"None detected";
  const features=Array.isArray(i.features)&&i.features.length?i.features.slice(0,6).join(" • "):"Not enough evidence";
  analysis.innerHTML=[
    infoCard("Object",safe(i.object,"Unknown")),
    infoCard("Brand",safe(i.brand)),
    infoCard("Model",safe(i.model)),
    infoCard("Category",safe(i.category,"Unknown")),
    infoCard("Visible text",visibleText),
    infoCard("Search query",safe(i.searchQuery,"Not generated")),
    infoCard("Visual clues",features),
    `<div class="analysis-card"><span>Confidence</span><strong>${confidence}%</strong><div class="confidence-bar"><i style="width:${confidence}%"></i></div></div>`
  ].join("");
}

function infoCard(label,value){return `<div class="analysis-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`}

function renderOffers(){
  const offers=[...currentOffers];
  if(currentSort==="price")offers.sort((a,b)=>valueOrInfinity(a.price)-valueOrInfinity(b.price));
  if(currentSort==="distance")offers.sort((a,b)=>valueOrInfinity(a.distanceKm)-valueOrInfinity(b.distanceKm));
  if(currentSort==="best")offers.sort((a,b)=>Number(b.match||0)-Number(a.match||0));
  if(!offers.length){offersEl.innerHTML="";noOffers.classList.remove("hidden");return}
  noOffers.classList.add("hidden");
  offersEl.innerHTML=offers.map(p=>{
    const distance=p.distanceKm!=null?` • ${Number(p.distanceKm).toFixed(1)} km`:"";
    const stock=p.stock?.status||"Stock status unavailable";
    const match=Math.round(Number(p.match||0)*100);
    const productLink=validHttpUrl(p.url)?`<a href="${escapeAttr(p.url)}" target="_blank" rel="noopener noreferrer">View product →</a>`:"";
    const mapsLink=p.store?.lat!=null&&p.store?.lon!=null?`<a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${p.store.lat},${p.store.lon}`)}" target="_blank" rel="noopener noreferrer">Directions →</a>`:"";
    return `<article class="offer-card"><img src="${escapeAttr(p.image||placeholderImage())}" alt="${escapeAttr(p.name||"Product")}"><div><h4>${escapeHtml(p.name||"Product")}</h4><p>${escapeHtml([p.brand,p.model,p.retailer].filter(Boolean).join(" • "))}</p><p class="good">🎯 ${match}% match • 📦 ${escapeHtml(stock)}</p><p>🏪 ${escapeHtml(p.store?.name||"Online / store not supplied")}${escapeHtml(distance)}</p><div class="offer-links">${productLink}${mapsLink}</div></div><div class="price">${formatMoney(p)}</div></article>`;
  }).join("");
}

document.querySelectorAll(".sort-btn").forEach(button=>button.addEventListener("click",()=>{
  currentSort=button.dataset.sort||"best";
  document.querySelectorAll(".sort-btn").forEach(x=>x.classList.toggle("active",x===button));
  renderOffers();
}));

async function loadNearby(i){
  nearbyBlock.classList.remove("hidden");
  nearbyStores.innerHTML="<p class='muted'>Checking relevant nearby retailers…</p>";
  try{
    const response=await fetch("api/nearby",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lat:coords.lat,lon:coords.lon,category:i.category||"",object:i.object||"",brand:i.brand||""})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data?.message||"Nearby search failed");
    if(!data.enabled){nearbyStores.innerHTML=`<p class="muted">${escapeHtml(data.message||"Nearby-store API is not connected yet.")}</p>`;return}
    const stores=Array.isArray(data.stores)
      ? data.stores.filter(x=>Number(x.distanceKm)<=10)
      : [];

    finditDiagnostics.nearbyStoreCount=stores.length;
    finditDiagnostics.closestStoreDistanceKm=stores.length?Number(stores[0].distanceKm):null;
    finditDiagnostics.nearbyRadiusKm=Number.isFinite(Number(data.radiusKm))?Number(data.radiusKm):null;
    finditDiagnostics.nearbyRetailGroup=data.retailGroup||data.categoryGroup||null;
    finditDiagnostics.nearbyReliable=data.reliable!==false;
    finditDiagnostics.lastSearchCompletedAt=new Date().toISOString();
    if(!stores.length){nearbyStores.innerHTML="<p class='muted'>No relevant nearby businesses were returned.</p>";return}
    nearbyStores.innerHTML=stores.map(s=>`<article class="nearby-card"><strong>${escapeHtml(s.name||"Store")}</strong><p>${escapeHtml(s.address||"Address unavailable")}</p><p>${s.distanceKm!=null?`${Number(s.distanceKm).toFixed(1)} km away`:"Distance unavailable"}</p>${validHttpUrl(s.mapsUrl)?`<a href="${escapeAttr(s.mapsUrl)}" target="_blank" rel="noopener noreferrer">Open in Maps →</a>`:""}</article>`).join("");
  }catch(error){nearbyStores.innerHTML=`<p class="muted">Nearby search unavailable: ${escapeHtml(error.message)}</p>`}
}

saveFind.addEventListener("click",()=>{
  if(!latestResult?.identification)return;
  const i=latestResult.identification;
  const item={id:(crypto.randomUUID?crypto.randomUUID():String(Date.now())),name:i.name||i.object||"Saved item",brand:i.brand||"",model:i.model||"",query:i.searchQuery||"",savedAt:new Date().toISOString()};
  const saved=getSaved();saved.unshift(item);
  localStorage.setItem("finditSaved",JSON.stringify(saved.slice(0,30)));
  

async function loadNearbyStores(i){
  if(!coords||!nearbyBlock)return;

  nearbyBlock.classList.remove("hidden");
  nearbyBlock.innerHTML='<p class="muted">Finding the closest relevant stores…</p>';

  try{
    const r=await fetch("/api/nearby",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({lat:coords.lat,lon:coords.lon,identification:i})
    });
    const data=await r.json();
    if(!r.ok||!data.ok)throw new Error(data.error||"Nearby search failed");

    const stores=Array.isArray(data.stores)
      ? data.stores.filter(x=>Number(x.distanceKm)<=10)
      : [];
    if(!stores.length || data.reliable===false){
      nearbyBlock.innerHTML=
        '<p class="muted">No reliable nearby mapped stores were found within 10 km. Use the free Maps search below instead of showing misleading far-away stores.</p>';
      return;
    }

    nearbyBlock.innerHTML=`
      <div class="nearby-heading">
        <div>
          <p class="eyebrow">NEARBY RETAILERS</p>
          <h3>Closest relevant stores</h3>
        </div>
        <span class="radius-note">searched up to ${Number(data.radiusKm||10)} km</span>
      </div>
      <div class="nearby-list">
        ${stores.map((x,index)=>`
          <a class="nearby-store" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${x.name} ${x.lat},${x.lon}`)}" target="_blank" rel="noopener noreferrer">
            <span class="nearby-rank">${index+1}</span>
            <span class="nearby-main">
              <strong>${escapeHtml(x.name)}</strong>
              <small>${escapeHtml(x.type||"retail")}${x.address?` • ${escapeHtml(x.address)}`:""}</small>
            </span>
            <span class="nearby-distance">${Number(x.distanceKm).toFixed(1)} km</span>
          </a>`).join("")}
      </div>
      <p class="nearby-disclaimer">${escapeHtml(data.disclaimer||"Nearby retailer type only; exact-item stock is not verified.")}</p>`;
  }catch(error){
    finditDiagnostics.lastError=String(error?.message||error||"Nearby search failed").slice(0,240);
    finditDiagnostics.nearbyReliable=false;
    finditDiagnostics.lastSearchCompletedAt=new Date().toISOString();
    nearbyBlock.innerHTML='<p class="muted">Nearby mapped-store search is temporarily unavailable. Use the free Maps search below.</p>';
  }
}

function escapeHtml(value){
  return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
}

function renderFreeActions(i){
  if(!freeActions)return;

  const confidence=Number(i?.confidence||0);
  const query=String(i?.searchQuery||i?.name||i?.object||"").trim();

  if(!query||confidence<0.55){
    freeActions.classList.add("hidden");
    return;
  }

  if(searchOnline){
    searchOnline.href=`https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }

  if(onlineQueryText){
    onlineQueryText.textContent=query;
  }

  if(searchNearbyFree){
    const nearbyQuery=[i.brand,i.object||i.category,"store"].filter(Boolean).join(" ").trim()||`${query} store`;
    const params=new URLSearchParams({api:"1",query:nearbyQuery});
    searchNearbyFree.href=`https://www.google.com/maps/search/?${params.toString()}`;
  }

  if(copyQuery){
    copyQuery.onclick=async()=>{
      try{
        await navigator.clipboard.writeText(query);
        const strong=copyQuery.querySelector("strong");
        const old=strong.textContent;
        strong.textContent="✓ Copied";
        setTimeout(()=>strong.textContent=old,1300);
      }catch{
        setStatus(`Copy unavailable. Search query: ${query}`,true);
      }
    };
  }

  if(shareFind){
    shareFind.onclick=async()=>{
      const shareText=`FindIt identified: ${i.name||i.object||query}${i.brand?` — ${i.brand}`:""}${i.model?` ${i.model}`:""}. Search: ${query}`;
      try{
        if(navigator.share){
          await navigator.share({title:"FindIt Nearby",text:shareText,url:location.href});
        }else{
          await navigator.clipboard.writeText(shareText);
          const strong=shareFind.querySelector("strong");
          const old=strong.textContent;
          strong.textContent="✓ Copied to share";
          setTimeout(()=>strong.textContent=old,1300);
        }
      }catch(error){
        if(error?.name!=="AbortError"){
          setStatus("Sharing was unavailable on this device.",true);
        }
      }
    };
  }

  freeActions.classList.remove("hidden");
}

renderSaved();
  saveFind.textContent="✓ Saved";
  setTimeout(()=>saveFind.textContent="♡ Save find",1400);
});

function getSaved(){try{return JSON.parse(localStorage.getItem("finditSaved")||"[]")}catch{return[]}}
function renderSaved(){
  const saved=getSaved();
  if(!saved.length){savedList.innerHTML="<p class='muted'>Nothing saved yet.</p>";return}
  savedList.innerHTML=saved.map(x=>`<div class="saved-card"><div><strong>${escapeHtml(x.name)}</strong><br><small>${escapeHtml([x.brand,x.model].filter(Boolean).join(" • ")||x.query)}</small></div><button class="sort-btn" data-remove="${escapeAttr(x.id)}" type="button">Remove</button></div>`).join("");
  savedList.querySelectorAll("[data-remove]").forEach(b=>b.addEventListener("click",()=>{localStorage.setItem("finditSaved",JSON.stringify(getSaved().filter(x=>x.id!==b.dataset.remove)));renderSaved()}));
}

function showWarning(message,isError=false){warning.textContent=message;warning.classList.remove("hidden");warning.classList.toggle("error",isError)}
function setStatus(message,isError=false){status.textContent=message;status.style.color=isError?"#ff9ba5":""}
function safe(v,fallback="Not detected"){return v==null||v===""?fallback:String(v)}
function valueOrInfinity(v){const n=Number(v);return Number.isFinite(n)?n:Infinity}
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function formatMoney(p){if(p.price==null)return"Price unavailable";try{return new Intl.NumberFormat("en-ZA",{style:"currency",currency:p.currency||"ZAR"}).format(Number(p.price))}catch{return`${p.currency||"ZAR"} ${p.price}`}}
function validHttpUrl(value){try{const u=new URL(value);return u.protocol==="http:"||u.protocol==="https:"}catch{return false}}
function escapeHtml(value=""){return String(value).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]))}
function escapeAttr(value=""){return escapeHtml(value)}
function placeholderImage(){return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23eef1f5'/%3E%3C/svg%3E"}


async function loadNearbyStores(i){
  if(!coords||!nearbyBlock)return;

  nearbyBlock.classList.remove("hidden");
  nearbyBlock.innerHTML='<p class="muted">Finding the closest relevant stores…</p>';

  try{
    const r=await fetch("/api/nearby",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({lat:coords.lat,lon:coords.lon,identification:i})
    });
    const data=await r.json();
    if(!r.ok||!data.ok)throw new Error(data.error||"Nearby search failed");

    const stores=Array.isArray(data.stores)
      ? data.stores.filter(x=>Number(x.distanceKm)<=10)
      : [];
    if(!stores.length || data.reliable===false){
      nearbyBlock.innerHTML=
        '<p class="muted">No reliable nearby mapped stores were found within 10 km. Use the free Maps search below instead of showing misleading far-away stores.</p>';
      return;
    }

    nearbyBlock.innerHTML=`
      <div class="nearby-heading">
        <div>
          <p class="eyebrow">NEARBY RETAILERS</p>
          <h3>Closest relevant stores</h3>
        </div>
        <span class="radius-note">searched up to ${Number(data.radiusKm||10)} km</span>
      </div>
      <div class="nearby-list">
        ${stores.map((x,index)=>`
          <a class="nearby-store" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${x.name} ${x.lat},${x.lon}`)}" target="_blank" rel="noopener noreferrer">
            <span class="nearby-rank">${index+1}</span>
            <span class="nearby-main">
              <strong>${escapeHtml(x.name)}</strong>
              <small>${escapeHtml(x.type||"retail")}${x.address?` • ${escapeHtml(x.address)}`:""}</small>
            </span>
            <span class="nearby-distance">${Number(x.distanceKm).toFixed(1)} km</span>
          </a>`).join("")}
      </div>
      <p class="nearby-disclaimer">${escapeHtml(data.disclaimer||"Nearby retailer type only; exact-item stock is not verified.")}</p>`;
  }catch(error){
    finditDiagnostics.lastError=String(error?.message||error||"Nearby search failed").slice(0,240);
    finditDiagnostics.nearbyReliable=false;
    finditDiagnostics.lastSearchCompletedAt=new Date().toISOString();
    nearbyBlock.innerHTML='<p class="muted">Nearby mapped-store search is temporarily unavailable. Use the free Maps search below.</p>';
  }
}

function escapeHtml(value){
  return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
}

function renderFreeActions(i){
  if(!freeActions)return;

  const confidence=Number(i?.confidence||0);
  const query=String(i?.searchQuery||i?.name||i?.object||"").trim();

  if(!query||confidence<0.55){
    freeActions.classList.add("hidden");
    return;
  }

  if(searchOnline){
    searchOnline.href=`https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }

  if(onlineQueryText){
    onlineQueryText.textContent=query;
  }

  if(searchNearbyFree){
    const nearbyQuery=[i.brand,i.object||i.category,"store"].filter(Boolean).join(" ").trim()||`${query} store`;
    const params=new URLSearchParams({api:"1",query:nearbyQuery});
    searchNearbyFree.href=`https://www.google.com/maps/search/?${params.toString()}`;
  }

  if(copyQuery){
    copyQuery.onclick=async()=>{
      try{
        await navigator.clipboard.writeText(query);
        const strong=copyQuery.querySelector("strong");
        const old=strong.textContent;
        strong.textContent="✓ Copied";
        setTimeout(()=>strong.textContent=old,1300);
      }catch{
        setStatus(`Copy unavailable. Search query: ${query}`,true);
      }
    };
  }

  if(shareFind){
    shareFind.onclick=async()=>{
      const shareText=`FindIt identified: ${i.name||i.object||query}${i.brand?` — ${i.brand}`:""}${i.model?` ${i.model}`:""}. Search: ${query}`;
      try{
        if(navigator.share){
          await navigator.share({title:"FindIt Nearby",text:shareText,url:location.href});
        }else{
          await navigator.clipboard.writeText(shareText);
          const strong=shareFind.querySelector("strong");
          const old=strong.textContent;
          strong.textContent="✓ Copied to share";
          setTimeout(()=>strong.textContent=old,1300);
        }
      }catch(error){
        if(error?.name!=="AbortError"){
          setStatus("Sharing was unavailable on this device.",true);
        }
      }
    };
  }

  freeActions.classList.remove("hidden");
}

renderSaved();


const feedbackForm=$("#feedbackForm"),feedbackRating=$("#feedbackRating"),feedbackTopic=$("#feedbackTopic"),feedbackMessage=$("#feedbackMessage"),includeTechnical=$("#includeTechnical"),feedbackStatus=$("#feedbackStatus"),copyFeedback=$("#copyFeedback");
const starButtons=[...document.querySelectorAll(".star-btn")];
function setRating(v){const n=Number(v);feedbackRating.value=String(n);starButtons.forEach(b=>b.classList.toggle("active",Number(b.dataset.rating)<=n))}
starButtons.forEach(b=>b.addEventListener("click",()=>setRating(b.dataset.rating)));

function feedbackPayload(){
  return {
    rating:Number(feedbackRating?.value||0),
    topic:feedbackTopic?.value||"general",
    message:String(feedbackMessage?.value||"").trim(),
    technical:includeTechnical?.checked?{
      viewport:`${innerWidth}x${innerHeight}`,
      language:navigator.language||"unknown",
      online:navigator.onLine,
      lastIdentification:latestResult?.identification||null
    }:null,
    createdAt:new Date().toISOString()
  };
}
function feedbackText(p){return `FindIt rating: ${p.rating||"Not rated"}/5\nTopic: ${p.topic}\n\n${p.message}`}

copyFeedback?.addEventListener("click",async()=>{
  const p=feedbackPayload();
  if(!p.message){feedbackStatus.textContent="Write a message first.";return}
  try{await navigator.clipboard.writeText(feedbackText(p));feedbackStatus.textContent="✓ Feedback copied."}
  catch{feedbackStatus.textContent="Copy unavailable on this device."}
});

feedbackForm?.addEventListener("submit",async e=>{
  e.preventDefault();
  const p=feedbackPayload();
  if(!p.rating){feedbackStatus.textContent="Choose a star rating first.";return}
  if(p.message.length<3){feedbackStatus.textContent="Please write a little more detail.";return}
  feedbackStatus.textContent="Sending feedback…";
  try{
    const r=await fetch("/api/feedback",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(p)});
    const d=await r.json();
    if(!r.ok)throw new Error(d.error||"Could not send");
    feedbackStatus.textContent=d.delivered?"✓ Thank you — your feedback was saved.":"✓ Feedback saved on this device. Central storage is not connected yet.";
    if(!d.delivered){
      const q=JSON.parse(localStorage.getItem("finditFeedbackQueue")||"[]");q.push(p);localStorage.setItem("finditFeedbackQueue",JSON.stringify(q.slice(-30)));
    }
    feedbackMessage.value="";setRating(0);
  }catch{
    const q=JSON.parse(localStorage.getItem("finditFeedbackQueue")||"[]");q.push(p);localStorage.setItem("finditFeedbackQueue",JSON.stringify(q.slice(-30)));
    feedbackStatus.textContent="Could not reach the server, so feedback was saved on this device.";
  }
});


function specialistNearbyQuery(i){
  const text=[i?.object,i?.name,i?.category,i?.searchQuery,i?.retailCategory,...(i?.likelyStoreTypes||[])].filter(Boolean).join(" ").toLowerCase();
  const routes=[
    ["hearing aid store",/hearing aid|audiology|hearing aid battery/],
    ["optician",/eyeglass|glasses|spectacle|contact lens|eyewear/],
    ["medical supply store",/wheelchair|crutch|walking frame|stethoscope|blood pressure|orthopaedic|medical supply/],
    ["supermarket",/energy drink|beverage|monster|red bull|tissue|toilet paper|grocery|snack|food|drink|cleaning|household/],
    ["shoe store",/shoe|sneaker|footwear|boot|sandal/],
    ["clothing store",/shirt|sweater|hoodie|jacket|dress|clothing|fashion|apparel|uniform/],
    ["workwear store",/ppe|safety boot|hard hat|workwear/],
    ["sports store",/sports|football|rugby|cricket|tennis|fitness|gym/],
    ["bicycle store",/bicycle|cycling|bike part/],
    ["outdoor store",/camping|fishing|binocular|outdoor|tent/],
    ["music store",/microphone|guitar|piano|music|audio interface|mixer|vinyl|turntable/],
    ["office supply store",/printer ink|toner|label printer|barcode scanner|office supply|filing cabinet/],
    ["security store",/security camera|alarm|cctv|smart home sensor/],
    ["electrical supply store",/electrical component|ups|surge protector|inverter|solar panel/],
    ["plumbing supply store",/plumbing|pipe fitting|valve/],
    ["industrial supply store",/welding|industrial|generator|packaging supply/],
    ["electronics store",/electronics|headphone|speaker|phone|camera|computer|laptop|tv|charger|router|projector|drone|3d printer/],
    ["hardware store",/hardware|tool|drill|hammer|paint|lock|door hardware/],
    ["home goods store",/homeware|furniture|appliance|cookware|bedding|curtain|mattress|vacuum|coffee machine/],
    ["stationery store",/pencil|pen|stationery|notebook|school/],
    ["book store",/book|novel|textbook|magazine/],
    ["craft store",/craft|knitting|yarn|sewing|haberdashery|fabric/],
    ["art supply store",/art supply|canvas|paint brush|easel/],
    ["hobby store",/rc car|model kit|trading card|collectible|hobby|cosplay/],
    ["toy store",/toy|lego|doll|puzzle|board game/],
    ["pharmacy",/medicine|medication|pharmacy|first aid/],
    ["beauty store",/perfume|makeup|cosmetic|skincare|hair clipper|salon tool/],
    ["pet store",/dog food|cat food|pet|aquarium|bird supply/],
    ["farm supply store",/horse tack|animal feed|farm tool|agrarian/],
    ["garden centre",/flower|plant|garden|seed|bonsai|hydroponic|fertilizer|compost|irrigation/],
    ["motorcycle store",/motorcycle|motorbike/],
    ["auto parts store",/car battery|car part|tyre|tire|automotive|motor oil|car audio|detailing/],
    ["jewellery store",/ring|necklace|bracelet|earring|watch|jewelry|jewellery/],
    ["baby store",/baby|stroller|pram|maternity/],
    ["party supply store",/party supply|costume|balloon/],
    ["gift shop",/gift|souvenir|religious item|candle|decor/],
    ["luggage store",/luggage|suitcase|handbag|wallet/],
    ["scientific supply store",/microscope|telescope|laboratory|lab glassware/],
    ["pool supply store",/pool supply|pool chemical/]
  ];
  for(const [q,re] of routes) if(re.test(text)) return q;
  return "department store";
}
