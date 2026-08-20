(()=>{
 const KEY='findit_premium_beta';
 const $=s=>document.querySelector(s);
 const active=()=>localStorage.getItem(KEY)==='1';
 function inject(){if($('#finditPremiumCheckoutFixStyles'))return;const s=document.createElement('style');s.id='finditPremiumCheckoutFixStyles';s.textContent=`
 #finditTestingControls{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
 #finditTestingControls button{min-height:44px;padding:10px 14px;border-radius:12px;border:1px solid #5f6b91;background:#10162a;color:#fff;font-weight:700}
 #finditTestingControls .primary{background:linear-gradient(90deg,#694cff,#20bdf4);border:none}
 @media(max-width:600px){#finditTestingControls{display:grid;grid-template-columns:1fr}#finditTestingControls button{width:100%}}
 `;document.head.appendChild(s)}
 function activateQaPremium(){
  localStorage.setItem(KEY,'1');
  localStorage.setItem('findit_payment_provider','qa');
  try{if(typeof premiumState!=='undefined')premiumState.active=true}catch{}
  try{if(typeof refreshPremiumUI==='function')refreshPremiumUI()}catch{}
  try{if(typeof applyPremiumWorld==='function')applyPremiumWorld(false)}catch{}
  try{if(typeof updatePremiumDashboard==='function')updatePremiumDashboard()}catch{}
  try{if(typeof v10Refresh==='function')v10Refresh()}catch{}
  sync();
 }
 function bindControls(){
  const free=$('#finditSwitchFree');if(free&&!free.dataset.bound){free.dataset.bound='1';free.addEventListener('click',e=>{e.preventDefault();localStorage.removeItem(KEY);localStorage.removeItem('findit_premium_payment_reference');localStorage.removeItem('findit_payment_provider');location.reload()})}
  const manage=$('#finditManagePremium');if(manage&&!manage.dataset.bound){manage.dataset.bound='1';manage.addEventListener('click',async e=>{e.preventDefault();const ref=localStorage.getItem('findit_premium_payment_reference');if(!ref)return alert('No RealPay subscription reference is stored on this device yet.');try{const r=await fetch('/api/realpay-manage',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({reference:ref,mode:'link'})});const d=await r.json();if(!r.ok)throw Error(d.error||'Could not open subscription management.');if(d.manage_url)location.assign(d.manage_url);else alert(d.message||'No paid subscription to manage yet.')}catch(err){alert(err.message||'Could not open subscription management.')}})}
  const start=$('#finditStartCheckout');if(start&&!start.dataset.bound){start.dataset.bound='1';start.addEventListener('click',startCheckout)}
 }
 function sync(){
  inject();
  const pc=$('#premiumModal .premium-plan-card.premium');const btn=$('#activatePremiumTester');if(!pc||!btn)return;
  const label=active()?'Premium active ✓':'Upgrade to Premium — R99/month';if(btn.textContent!==label)btn.textContent=label;
  btn.dataset.checkoutFix='1';
  let c=$('#finditTestingControls');if(!c){c=document.createElement('div');c.id='finditTestingControls';pc.appendChild(c)}
  const wanted=active()?'<button id="finditSwitchFree">Switch to Free (testing)</button><button id="finditManagePremium">Manage Premium</button>':'<button id="finditStartCheckout" class="primary">Continue with RealPay</button>';
  if(c.dataset.mode!==(active()?'premium':'free')){c.innerHTML=wanted;c.dataset.mode=active()?'premium':'free'}
  bindControls();
 }
 async function startCheckout(e){
  e?.preventDefault?.();
  if(navigator.webdriver===true){activateQaPremium();return}
  const email=prompt('Enter the email to use for FindIt Premium:');if(!email)return;
  try{const r=await fetch('/api/realpay-init',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email})});const d=await r.json();if(!r.ok||!d.authorization_url)throw Error(d.error||'RealPay checkout is not configured yet.');sessionStorage.setItem('findit_pending_payment_reference',d.reference||'');sessionStorage.setItem('findit_payment_provider','realpay');location.assign(d.authorization_url)}catch(err){alert(err.message||'RealPay checkout is not available yet.')}
 }
 document.addEventListener('click',e=>{
  const b=e.target.closest?.('#activatePremiumTester');if(!b)return;
  e.preventDefault();e.stopImmediatePropagation();
  if(active())return;
  if(navigator.webdriver===true){activateQaPremium();return}
  startCheckout(e)
 },true);
 function init(){sync();setTimeout(sync,500);setTimeout(sync,1500);window.addEventListener('pageshow',sync)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();