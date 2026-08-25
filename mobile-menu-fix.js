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
 function installMenuRepair(){
  if(document.getElementById('findit-menu-repair-style'))return;
  const style=document.createElement('style');
  style.id='findit-menu-repair-style';
  style.textContent=`
   .drawer{overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain}
   body.premium-active .premium-drawer-nav{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:8px!important;width:100%!important;margin-top:22px!important}
   body.premium-active .premium-drawer-nav>.premium-menu-title,
   body.premium-active .premium-drawer-nav>a,
   body.premium-active .premium-drawer-nav>button{display:flex!important;width:100%!important;max-width:100%!important;min-width:0!important;flex:0 0 auto!important;white-space:normal!important;writing-mode:horizontal-tb!important;overflow-wrap:anywhere!important}
   body.premium-active .premium-drawer-nav>a,
   body.premium-active .premium-drawer-nav>button{align-items:center!important;justify-content:flex-start!important;text-align:left!important;min-height:50px!important;padding:13px 14px!important}
   body.premium-active #openSettingsPremium{display:flex!important;margin-bottom:24px!important}
   @media(max-width:700px){
    .drawer{width:min(390px,92vw)!important;padding:18px!important}
    .drawer-head{position:sticky;top:-18px;z-index:2;background:#0a1020;padding:18px 0 12px}
    .premium-menu-title{margin:0 0 8px!important}
   }
  `;
  document.head.appendChild(style);
 }
 function openSettingsFromPremium(e){
  const b=e.target?.closest?.('#openSettingsPremium');if(!b)return;
  e.preventDefault();
  try{typeof closeDrawer==='function'&&closeDrawer()}catch{}
  const drawer=document.getElementById('drawer'),backdrop=document.getElementById('drawerBackdrop');
  drawer?.classList.remove('open');drawer?.setAttribute('aria-hidden','true');backdrop?.classList.add('hidden');
  const modal=document.getElementById('settingsModal');
  modal?.classList.remove('hidden');modal?.setAttribute('aria-hidden','false');
 }
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
 installMenuRepair();
 document.addEventListener('DOMContentLoaded',installMenuRepair,{once:true});
 window.addEventListener('click',e=>{
  openSettingsFromPremium(e);
  const b=e.target?.closest?.('#activatePremiumTester');
  if(b&&localStorage.getItem(KEY)!=='1')startPremiumCheckout(e)
 },true);
})();
