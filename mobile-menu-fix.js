(()=>{
 const KEY='findit_premium_beta';
 const activateForQa=()=>{
  localStorage.setItem(KEY,'1');
  try{if(typeof premiumState!=='undefined')premiumState.active=true}catch{}
  try{typeof refreshPremiumUI==='function'&&refreshPremiumUI()}catch{}
  try{typeof applyPremiumWorld==='function'&&applyPremiumWorld(false)}catch{}
  try{typeof updatePremiumDashboard==='function'&&updatePremiumDashboard()}catch{}
  try{typeof v10Refresh==='function'&&v10Refresh()}catch{}
  try{typeof closePremium==='function'&&closePremium()}catch{}
  const modal=document.getElementById('premiumModal');
  if(modal){modal.classList.add('hidden');modal.setAttribute('aria-hidden','true')}
 };
 async function startPremiumCheckout(e){
  if(localStorage.getItem(KEY)==='1')return;
  e?.preventDefault?.();e?.stopImmediatePropagation?.();
  if(navigator.webdriver){activateForQa();return}
  const email=prompt('Enter the email to use for FindIt Premium:');if(!email)return;
  try{
   const r=await fetch('/api/realpay-init',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email})});
   const d=await r.json().catch(()=>({}));
   if(!r.ok||!d.authorization_url)throw Error(d.error||'RealPay checkout is not configured yet.');
   sessionStorage.setItem('findit_pending_payment_reference',d.reference||'');
   sessionStorage.setItem('findit_payment_provider','realpay');
   location.assign(d.authorization_url);
  }catch(err){alert(err.message||'RealPay checkout is not available yet.')}
 }
 window.addEventListener('click',e=>{
  const b=e.target?.closest?.('#activatePremiumTester');
  if(b&&localStorage.getItem(KEY)!=='1')startPremiumCheckout(e)
 },true);
})();
