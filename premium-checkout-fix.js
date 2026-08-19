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
 function sync(){inject();const pc=$('#premiumModal .premium-plan-card.premium');const btn=$('#activatePremiumTester');if(!pc||!btn)return;
  btn.textContent=active()?'Premium active ✓':'Upgrade to Premium — R99/month';
  btn.dataset.checkoutFix='1';
  let c=$('#finditTestingControls');if(!c){c=document.createElement('div');c.id='finditTestingControls';pc.appendChild(c)}
  c.innerHTML=active()?'<button id="finditSwitchFree">Switch to Free (testing)</button><button id="finditManagePremium">Manage Premium</button>':'<button id="finditStartCheckout" class="primary">Test R99/month checkout</button>';
  $('#finditSwitchFree')?.addEventListener('click',e=>{e.preventDefault();localStorage.removeItem(KEY);localStorage.removeItem('findit_premium_payment_reference');location.reload()});
  $('#finditManagePremium')?.addEventListener('click',async e=>{e.preventDefault();const ref=localStorage.getItem('findit_premium_payment_reference');if(!ref)return alert('No Paystack subscription reference is stored on this device yet.');try{const r=await fetch('/api/paystack-manage',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({reference:ref,mode:'link'})});const d=await r.json();if(!r.ok)throw Error(d.error||'Could not open subscription management.');if(d.manage_url)location.assign(d.manage_url);else alert(d.message||'No paid subscription to manage yet.')}catch(err){alert(err.message||'Could not open subscription management.')}});
  $('#finditStartCheckout')?.addEventListener('click',startCheckout);
 }
 async function startCheckout(e){e?.preventDefault?.();const email=prompt('Enter the email to use for FindIt Premium:');if(!email)return;try{const r=await fetch('/api/paystack-init',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email})});const d=await r.json();if(!r.ok||!d.authorization_url)throw Error(d.error||'Could not start Paystack checkout.');sessionStorage.setItem('findit_pending_paystack_reference',d.reference||'');location.assign(d.authorization_url)}catch(err){alert(err.message||'Could not start Paystack checkout.')}}
 document.addEventListener('click',e=>{const b=e.target.closest?.('#activatePremiumTester');if(!b)return;e.preventDefault();e.stopImmediatePropagation();if(active())return;startCheckout(e)},true);
 function init(){sync();new MutationObserver(sync).observe(document.body,{childList:true,subtree:true});setTimeout(sync,500);setTimeout(sync,1500)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();