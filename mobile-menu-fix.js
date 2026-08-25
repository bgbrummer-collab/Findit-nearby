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
 function installResultsRepair(){
  if(document.getElementById('findit-results-repair-style'))return;
  const style=document.createElement('style');
  style.id='findit-results-repair-style';
  style.textContent=`
   #nearbyPanel,#nearbyStores,.nearby-stores{width:100%!important;max-width:100%!important;min-width:0!important}
   #nearbyStores,.nearby-stores{display:grid!important;grid-template-columns:1fr!important;gap:14px!important}
   #nearbyStores .store-card,.nearby-stores .store-card{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;height:auto!important;min-height:0!important;padding:22px!important;overflow:visible!important}
   #nearbyStores .store-main,.nearby-stores .store-main{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;text-align:left!important;writing-mode:horizontal-tb!important;white-space:normal!important}
   #nearbyStores .store-main>strong,.nearby-stores .store-main>strong{display:block!important;width:auto!important;font-size:20px!important;line-height:1.25!important;margin:0 0 8px!important;white-space:normal!important;overflow-wrap:break-word!important;word-break:normal!important}
   #nearbyStores .store-main>small,.nearby-stores .store-main>small{display:block!important;width:100%!important;max-width:850px!important;font-size:14px!important;line-height:1.55!important;margin:0!important;white-space:normal!important;overflow-wrap:break-word!important;word-break:normal!important}
   #nearbyStores .store-tags,.nearby-stores .store-tags{display:flex!important;flex-wrap:wrap!important;gap:8px!important;margin:16px 0!important;width:100%!important}
   #nearbyStores .store-tags span,.nearby-stores .store-tags span{display:inline-flex!important;width:auto!important;max-width:100%!important;font-size:12px!important;line-height:1.3!important;padding:8px 12px!important;white-space:normal!important;writing-mode:horizontal-tb!important}
   #nearbyStores .result-note,.nearby-stores .result-note{margin:14px 0!important;font-size:14px!important;line-height:1.5!important;white-space:normal!important}
   #nearbyStores .store-actions,.nearby-stores .store-actions{display:flex!important;flex-wrap:wrap!important;justify-content:flex-start!important;align-items:center!important;gap:10px!important;width:100%!important;margin-top:14px!important}
   #nearbyStores .store-actions a,.nearby-stores .store-actions a{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:auto!important;min-width:110px!important;max-width:100%!important;min-height:42px!important;padding:10px 14px!important;font-size:12px!important;line-height:1.2!important;white-space:normal!important;writing-mode:horizontal-tb!important;text-align:center!important;word-break:normal!important;overflow-wrap:normal!important}
   #nearbyStores .store-trust-note,.nearby-stores .store-trust-note{display:block!important;width:100%!important;max-width:850px!important;margin-top:14px!important;font-size:13px!important;line-height:1.5!important;white-space:normal!important;writing-mode:horizontal-tb!important;word-break:normal!important;overflow-wrap:break-word!important}
   @media(min-width:801px){
    #nearbyStores,.nearby-stores{grid-template-columns:repeat(2,minmax(0,1fr))!important;align-items:start!important}
    #nearbyStores .store-card,.nearby-stores .store-card{align-self:start!important}
   }
   @media(max-width:800px){
    #nearbyStores .store-card,.nearby-stores .store-card{padding:18px!important}
    #nearbyStores .store-main>strong,.nearby-stores .store-main>strong{font-size:18px!important}
    #nearbyStores .store-main>small,.nearby-stores .store-main>small{font-size:13px!important}
    #nearbyStores .store-actions,.nearby-stores .store-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important}
    #nearbyStores .store-actions a,.nearby-stores .store-actions a{width:100%!important;min-width:0!important}
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
 installResultsRepair();
 document.addEventListener('DOMContentLoaded',()=>{installMenuRepair();installResultsRepair()},{once:true});
 window.addEventListener('click',e=>{
  openSettingsFromPremium(e);
  const b=e.target?.closest?.('#activatePremiumTester');
  if(b&&localStorage.getItem(KEY)!=='1')startPremiumCheckout(e)
 },true);
})();
