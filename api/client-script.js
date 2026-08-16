const SOURCE="https://raw.githubusercontent.com/bgbrummer-collab/Findit-nearby/main/script.js";

const PATCH=`
;(()=>{
  const entitlement=localStorage.getItem("findit_premium_beta")==="1"||!!localStorage.getItem("findit_premium_payment_reference");

  function freeMode(){
    if(typeof premiumState!=="undefined")premiumState.active=false;
    document.body.classList.remove("premium-active","premium-v10");
    ["premiumHome","v10CommandCentre","premiumWorkspace"].forEach(id=>document.getElementById(id)?.classList.add("hidden"));
    document.getElementById("premiumWorkspaceButton")?.classList.add("hidden");
    document.querySelectorAll("[data-premium-option]").forEach(x=>x.disabled=true);
    const r=document.getElementById("radiusSelect");
    if(r&&Number(r.value)>10){r.value="10";if(typeof state!=="undefined")state.radius=10;}
    const b=document.getElementById("finditFreeModeButton");if(b)b.hidden=true;
  }

  function premiumMode(){
    if(!entitlement){if(typeof openPremium==="function")openPremium();return;}
    if(typeof premiumState!=="undefined")premiumState.active=true;
    document.body.classList.add("premium-active","premium-v10");
    ["premiumHome","v10CommandCentre"].forEach(id=>document.getElementById(id)?.classList.remove("hidden"));
    document.getElementById("premiumWorkspaceButton")?.classList.remove("hidden");
    document.querySelectorAll("[data-premium-option]").forEach(x=>x.disabled=false);
    if(typeof refreshPremiumUI==="function")refreshPremiumUI();
    if(typeof updatePremiumDashboard==="function")updatePremiumDashboard();
    const b=document.getElementById("finditFreeModeButton");if(b)b.hidden=false;
    document.getElementById("v10CommandCentre")?.scrollIntoView({behavior:"smooth",block:"start"});
  }

  function refineIdentification(i){
    if(!i||typeof i!=="object")return i;
    const text=[i.object,i.name,i.category,i.searchQuery,i.summary,...(Array.isArray(i.features)?i.features:[])].filter(Boolean).join(" ").toLowerCase();
    const visible=(Array.isArray(i.visibleText)?i.visibleText:[]).join(" ").toLowerCase();
    const eyewear=/\b(glasses|eyeglasses|spectacles|sunglasses|eyewear|frames?)\b/.test(text);
    const certifiedSafety=/\b(ansi|z87|en166|ce certified|ppe|safety rated|impact rated)\b/.test(visible);
    if(eyewear&&!certifiedSafety){
      const wasSafety=/\b(safety|protective|ppe|industrial|side shields?)\b/.test(text);
      i.object="eyeglasses";
      if(wasSafety||!i.name)i.name="Eyeglasses / optical glasses";
      i.category="Eyewear";
      i.retailCategory="eyewear";
      i.likelyStoreTypes=["optician","eyewear store"];
      if(wasSafety||!/\b(glasses|eyeglasses|spectacles|sunglasses)\b/.test(String(i.searchQuery||"").toLowerCase()))i.searchQuery="eyeglasses optical frames";
      if(wasSafety)i.summary="A pair of optical-style glasses. FindIt avoids classifying eyewear as industrial safety equipment unless visible certification or safety markings support that claim.";
    }
    return i;
  }

  window.finditUseFreeMode=freeMode;
  window.finditUsePremiumMode=premiumMode;
  window.finditRefineIdentification=refineIdentification;

  if(typeof renderIdentification==="function"){
    const originalRenderIdentification=renderIdentification;
    renderIdentification=function(i){return originalRenderIdentification(refineIdentification(i));};
  }

  document.addEventListener("DOMContentLoaded",()=>{
    freeMode();
    let b=document.getElementById("finditFreeModeButton");
    if(!b){
      b=document.createElement("button");b.id="finditFreeModeButton";b.type="button";b.textContent="← Free mode";b.hidden=true;
      b.style.cssText="position:fixed;right:18px;top:76px;z-index:5000;border:1px solid rgba(255,255,255,.22);background:#10172b;color:#fff;border-radius:999px;padding:10px 14px;font-weight:800;cursor:pointer;box-shadow:0 8px 30px rgba(0,0,0,.25)";
      b.onclick=freeMode;document.body.appendChild(b);
    }
    const p=document.getElementById("premiumButton");
    if(p&&entitlement)p.addEventListener("click",e=>{e.preventDefault();e.stopImmediatePropagation();premiumMode();},true);
    setTimeout(freeMode,0);
  });
})();
`;

export default async function handler(req,res){
  if(req.method!=="GET")return res.status(405).send("Method not allowed");
  try{
    const r=await fetch(SOURCE,{headers:{Accept:"text/plain"}});
    if(!r.ok)throw new Error("Core script fetch failed: "+r.status);
    let core=await r.text();
    core=core.replace('const premiumState={active:localStorage.getItem("findit_premium_beta")==="1",freeRadiusKm:10,premiumRadiusKm:25};','const premiumState={active:false,entitled:localStorage.getItem("findit_premium_beta")==="1"||!!localStorage.getItem("findit_premium_payment_reference"),freeRadiusKm:10,premiumRadiusKm:25};');
    res.setHeader("Content-Type","application/javascript; charset=utf-8");
    res.setHeader("Cache-Control","no-store, max-age=0");
    return res.status(200).send(core+PATCH);
  }catch(e){
    console.error("client-script",e);
    res.setHeader("Content-Type","application/javascript; charset=utf-8");
    return res.status(500).send("console.error("+JSON.stringify("FindIt client failed to load: "+String(e.message||e))+");");
  }
}
