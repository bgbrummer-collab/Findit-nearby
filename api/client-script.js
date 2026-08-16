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

  window.finditUseFreeMode=freeMode;
  window.finditUsePremiumMode=premiumMode;

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
