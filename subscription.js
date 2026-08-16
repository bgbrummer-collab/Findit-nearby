(()=>{
  const PRICE_LABEL="R99/month";
  const STORAGE_EMAIL="findit_premium_email";

  async function startMonthlySubscription(){
    const email=window.prompt("Enter the email for your FindIt Premium subscription:",localStorage.getItem(STORAGE_EMAIL)||"");
    if(!email)return;
    localStorage.setItem(STORAGE_EMAIL,email.trim());
    try{
      const r=await fetch("/api/paystack-router?action=init",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({email:email.trim()})
      });
      const d=await r.json();
      if(!r.ok||!d.authorization_url){alert(d.error||"Could not start the monthly subscription.");return;}
      sessionStorage.setItem("findit_pending_paystack_reference",d.reference||"");
      window.location.assign(d.authorization_url);
    }catch(e){console.error(e);alert("Subscription checkout could not start. Please try again.")}
  }

  async function manageSubscription(){
    const email=window.prompt("Enter the email used for FindIt Premium:",localStorage.getItem(STORAGE_EMAIL)||"");
    if(!email)return;
    localStorage.setItem(STORAGE_EMAIL,email.trim());
    const btn=document.getElementById("finditManageSubscription");
    const old=btn?.textContent;
    if(btn){btn.disabled=true;btn.textContent="Opening…";}
    try{
      const r=await fetch("/api/paystack-router?action=manage",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({email:email.trim()})
      });
      const d=await r.json();
      if(!r.ok||!d.management_url){alert(d.error||"No active FindIt Premium subscription was found for that email.");return;}
      window.location.assign(d.management_url);
    }catch(e){console.error(e);alert("Could not open subscription management. Please try again.")}
    finally{if(btn){btn.disabled=false;btn.textContent=old||"Manage / Cancel subscription";}}
  }

  function updatePremiumCopy(){
    const activate=document.getElementById("activatePremiumTester");
    if(activate){
      activate.textContent=`Get Premium — ${PRICE_LABEL}`;
      activate.addEventListener("click",e=>{e.preventDefault();e.stopImmediatePropagation();startMonthlySubscription();},true);
    }

    const card=activate?.closest(".premium-plan-card");
    if(card){
      const small=card.querySelector("small");
      if(small)small.textContent="Billed monthly. Cancel anytime before the next renewal.";
      if(!document.getElementById("finditManageSubscription")){
        const manage=document.createElement("button");
        manage.id="finditManageSubscription";
        manage.type="button";
        manage.textContent="Manage / Cancel subscription";
        manage.style.cssText="margin-top:10px;background:transparent;color:#dfe6f2;border:1px solid rgba(255,255,255,.16);border-radius:12px;padding:11px 14px;font-weight:800;cursor:pointer;width:100%";
        manage.onclick=manageSubscription;
        card.appendChild(manage);
      }
    }

    const level=document.querySelector(".premium-level-card small");
    if(level)level.textContent="Monthly subscription • cancel anytime";
  }

  window.finditManageSubscription=manageSubscription;
  window.finditStartMonthlySubscription=startMonthlySubscription;
  document.addEventListener("DOMContentLoaded",updatePremiumCopy);
})();
