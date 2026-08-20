(()=>{
  const KEY='findit_premium_beta';
  const $=s=>document.querySelector(s);
  function isPremium(){return localStorage.getItem(KEY)==='1'}
  function sync(){
    const b=$('#activatePremiumTester');
    if(b)b.textContent=isPremium()?'Return to Free for testing':'Continue with RealPay — R99/month';
    let x=$('#finditTestFreeBtn');
    if(isPremium()){
      if(!x){x=document.createElement('button');x.id='finditTestFreeBtn';x.type='button';x.textContent='Return to Free for testing';x.style.marginTop='10px';const card=$('#premiumModal .premium-plan-card.premium');card?.appendChild(x)}
    }else x?.remove();
  }
  function returnFree(){
    localStorage.removeItem(KEY);
    localStorage.removeItem('findit_premium_payment_reference');
    localStorage.removeItem('findit_payment_provider');
    try{if(typeof premiumState!=='undefined')premiumState.active=false}catch{}
    document.body.classList.remove('premium-active','premium-v10');
    $('#premiumHome')?.classList.add('hidden');$('#v10CommandCentre')?.classList.add('hidden');$('#premiumStatusBadge')?.classList.add('hidden');$('#premiumWorkspaceButton')?.classList.add('hidden');
    const nav=$('#premiumDrawerNav');if(nav)nav.style.display='none';sync();$('#premiumModal')?.classList.add('hidden');window.scrollTo({top:0,behavior:'smooth'});
  }
  async function checkout(){
    const email=window.prompt('Enter the email to use for FindIt Premium:');if(!email)return;
    const r=await fetch('/api/realpay-init',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email})});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||!d.authorization_url){alert(d.error||'RealPay checkout is not configured yet.');return}
    if(d.reference)sessionStorage.setItem('findit_pending_payment_reference',d.reference);
    sessionStorage.setItem('findit_payment_provider','realpay');location.assign(d.authorization_url);
  }
  document.addEventListener('click',e=>{
    const free=e.target.closest?.('#finditTestFreeBtn');if(free){e.preventDefault();e.stopImmediatePropagation();returnFree();return}
    const b=e.target.closest?.('#activatePremiumTester');if(!b)return;e.preventDefault();e.stopImmediatePropagation();if(isPremium())returnFree();else checkout();
  },true);
  function init(){sync();setTimeout(sync,500);setTimeout(sync,1500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();window.addEventListener('pageshow',sync);
})();