const SOURCE="https://raw.githubusercontent.com/bgbrummer-collab/Findit-nearby/main/script.js";

const PATCH=String.raw`

/* =========================================================
   FINDIT SAFE MODE + CATALOGUE BRIDGE
   Appended at runtime so the public site can keep the stable
   core while enforcing exact-product truth and Free/Premium mode.
========================================================= */
(function(){
  const entitlement = localStorage.getItem("findit_premium_beta")==="1" || !!localStorage.getItem("findit_premium_payment_reference");
  if(typeof premiumState!=="undefined"){
    premiumState.entitled=entitlement;
    // Always enter FindIt in Free mode. Premium is an opt-in workspace.
    premiumState.active=false;
  }

  function hidePremiumOnlyUI(){
    document.body.classList.remove("premium-active","premium-v10");
    document.getElementById("premiumHome")?.classList.add("hidden");
    document.getElementById("v10CommandCentre")?.classList.add("hidden");
    document.getElementById("premiumWorkspace")?.classList.add("hidden");
    document.getElementById("premiumWorkspaceButton")?.classList.add("hidden");
    document.querySelectorAll("[data-premium-option]").forEach(o=>o.disabled=true);
    const r=document.getElementById("radiusSelect");
    if(r && Number(r.value)>10){r.value="10";if(typeof state!=="undefined")state.radius=10;}
  }

  function showPremiumMode(){
    if(typeof premiumState==="undefined")return;
    premiumState.active=true;
    document.body.classList.add("premium-active","premium-v10");
    document.getElementById("premiumHome")?.classList.remove("hidden");
    document.getElementById("v10CommandCentre")?.classList.remove("hidden");
    document.getElementById("premiumWorkspaceButton")?.classList.remove("hidden");
    document.querySelectorAll("[data-premium-option]").forEach(o=>o.disabled=false);
    if(typeof refreshPremiumUI==="function")refreshPremiumUI();
    if(typeof applyPremiumWorld==="function")applyPremiumWorld(false);
    if(typeof updatePremiumDashboard==="function")updatePremiumDashboard();
    if(typeof v10Refresh==="function")v10Refresh();
    const b=document.getElementById("finditFreeModeButton");if(b)b.hidden=false;
  }

  function showFreeMode(){
    if(typeof premiumState!=="undefined")premiumState.active=false;
    hidePremiumOnlyUI();
    if(typeof refreshPremiumUI==="function")refreshPremiumUI();
    const b=document.getElementById("finditFreeModeButton");if(b)b.hidden=true;
    document.getElementById("home")?.scrollIntoView({behavior:"smooth",block:"start"});
  }

  window.finditUsePremiumMode=showPremiumMode;
  window.finditUseFreeMode=showFreeMode;

  // Replace catalogue renderer so imported Supabase offers also populate
  // the main exact-product result cards, not only the Product Intelligence panel.
  if(typeof loadProductIntelligence==="function"){
    loadProductIntelligence=async function(i){
      const panel=document.getElementById("productIntelligencePanel");
      const el=document.getElementById("productIntelligenceResults");
      if(!panel||!el)return;
      try{
        const r=await fetch("/api/product-intelligence",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({query:i.searchQuery||i.name||i.object||"",name:i.name||i.object||"",brand:i.brand||"",model:i.model||""})});
        const d=await r.json();
        productIntelligence=d;
        panel.classList.remove("hidden");
        if(!r.ok||!d.matched){
          el.innerHTML='<div class="empty-state">No verified catalogue match yet. FindIt will not invent a price, stock level or exact store.</div>';
          return;
        }
        const offers=Array.isArray(d.offers)?d.offers:[];
        if(!offers.length){
          el.innerHTML='<div class="empty-state">A catalogue product matched, but no current retailer offer is stored.</div>';
          return;
        }
        if(typeof state!=="undefined"){
          state.offers=offers.map(o=>({
            id:o.id,
            name:o.product_name||o.matchedProduct?.name||d.bestProduct?.name||"Product",
            brand:o.matchedProduct?.brand||d.bestProduct?.brand||null,
            model:o.matchedProduct?.model||d.bestProduct?.model||null,
            image:o.image_url||o.matchedProduct?.image_url||d.bestProduct?.image_url||null,
            url:o.product_url||null,
            retailer:o.retailer?.name||"Retailer",
            price:o.price,
            currency:o.currency||"ZAR",
            match:Number(o.matchScore||d.bestProduct?.matchScore||0),
            stock:{status:o.availability==="in_stock"?"In stock online/general":o.availability||"Stock not verified"},
            store:null,
            distanceKm:null
          }));
          state.diagnostics.exactOfferCount=state.offers.length;
          state.diagnostics.exactProductMatch=state.offers.length>0;
          if(typeof renderOffers==="function")renderOffers();
        }
        el.innerHTML=offers.map(o=>{
          const retailer=o.retailer?.name||"Retailer";
          const price=finditFormatFeedPrice(o.price,o.currency||"ZAR");
          const localEstimate=finditFormatLocalEstimate(o.price,o.currency||"ZAR");
          const stock=o.availability==="in_stock"?"In stock online/general":o.availability==="out_of_stock"?"Out of stock":o.availability||"Availability not supplied";
          return '<article class="pi-offer '+(o.verified?'verified':'')+'"><div><h4>'+esc(o.product_name||d.bestProduct?.name||"Product")+'</h4><p>'+esc(retailer)+'</p><div class="pi-meta"><span>'+(o.verified?'✓ Verified listing':'Catalog listing')+'</span><span>'+esc(stock)+'</span><span>Exact branch stock not supplied</span></div><div class="pi-actions">'+(validUrl(o.product_url)?'<a href="'+esc(o.product_url)+'" target="_blank" rel="noopener noreferrer">View product</a>':'')+'</div></div><div class="pi-price">'+esc(price)+(localEstimate?'<small class="pi-local-estimate">'+esc(localEstimate)+' estimated</small>':'')+'</div></article>';
        }).join("");
      }catch(e){
        console.error("catalogue bridge",e);
        panel.classList.remove("hidden");
        el.innerHTML='<div class="empty-state">Product price data is temporarily unavailable.</div>';
      }
    };
  }

  document.addEventListener("DOMContentLoaded",()=>{
    hidePremiumOnlyUI();

    // Visible one-click way back to Free mode whenever Premium is open.
    let free=document.getElementById("finditFreeModeButton");
    if(!free){
      free=document.createElement("button");
      free.id="finditFreeModeButton";
      free.type="button";
      free.textContent="← Free mode";
      free.hidden=true;
      free.setAttribute("aria-label","Switch back to FindIt Free mode");
      free.style.cssText="position:fixed;right:18px;top:76px;z-index:1200;border:1px solid rgba(255,255,255,.22);background:#10172b;color:#fff;border-radius:999px;padding:10px 14px;font-weight:800;cursor:pointer;box-shadow:0 8px 30px rgba(0,0,0,.25)";
      free.addEventListener("click",showFreeMode);
      document.body.appendChild(free);
    }

    // If the device already owns Premium, the Premium button opens the
    // workspace instead of asking the user to pay again.
    const premiumButton=document.getElementById("premiumButton");
    if(premiumButton && entitlement){
      premiumButton.addEventListener("click",e=>{
        e.preventDefault();
        e.stopImmediatePropagation();
        showPremiumMode();
        document.getElementById("v10CommandCentre")?.scrollIntoView({behavior:"smooth",block:"start"});
      },true);
    }

    // Payment verification can complete asynchronously after DOMContentLoaded.
    // Reflect Premium mode when that happens, but normal visits still start Free.
    const observer=new MutationObserver(()=>{
      if(typeof premiumState!=="undefined" && premiumState.active){
        const b=document.getElementById("finditFreeModeButton");if(b)b.hidden=false;
      }
    });
    observer.observe(document.body,{attributes:true,attributeFilter:["class"]});
  });
})();
`;

export default async function handler(req,res){
  if(req.method!=="GET") return res.status(405).send("Method not allowed");
  try{
    const r=await fetch(SOURCE,{headers:{Accept:"text/plain"}});
    if(!r.ok) throw new Error(`Core script fetch failed: ${r.status}`);
    const core=await r.text();
    res.setHeader("Content-Type","application/javascript; charset=utf-8");
    res.setHeader("Cache-Control","public, max-age=0, s-maxage=120, stale-while-revalidate=600");
    return res.status(200).send(core+PATCH);
  }catch(e){
    console.error("client-script",e);
    res.setHeader("Content-Type","application/javascript; charset=utf-8");
    return res.status(500).send(`console.error(${JSON.stringify("FindIt client failed to load: "+String(e.message||e))});`);
  }
}
