(()=>{
 const KEY='findit_premium_beta';
 async function startPremiumCheckout(e){
  if(localStorage.getItem(KEY)==='1')return;
  e?.preventDefault?.();e?.stopImmediatePropagation?.();
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
  if(b&&localStorage.getItem(KEY)!=='1')startPremiumCheckout(e);
 },true);

 const load=(src,timeout=3500)=>new Promise(resolve=>{
  const s=document.createElement('script');
  let done=false;
  const finish=()=>{if(done)return;done=true;clearTimeout(t);resolve()};
  const t=setTimeout(()=>{try{s.remove()}catch{}finish()},timeout);
  s.src=src;s.async=true;s.onload=finish;s.onerror=finish;document.body.appendChild(s);
 });
 const patches=[
  '/premium-upgrades.js','/qa-hardening.js','/qa-menu-routes.js','/qa-final-polish.js',
  '/school-uniform-fix.js','/final-release-fixes.js','/release-polish.js','/exact-retailer-fix.js',
  '/official-brand-client.js','/feature-suggestions.js','/premium-test-controls.js',
  '/premium-checkout-fix.js','/v10-overlap-fix.js'
 ];
 async function bootPatches(){for(const src of patches)await load(src)}
 const schedule=()=>setTimeout(bootPatches,700);
 if(document.readyState==='complete')schedule();else window.addEventListener('load',schedule,{once:true});
})();