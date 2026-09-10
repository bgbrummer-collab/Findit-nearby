/* FindIt commerce modal action owner.
   Prevents a slower Compare/Stock refresh from replacing a newer tool the user opened. */
(()=>{
  'use strict';
  if(window.__finditCommerceModalActionOwner)return;
  window.__finditCommerceModalActionOwner=true;

  let desired=null;
  let lastGoodHtml='';
  let restoring=false;

  const actionOf=t=>{
    const el=t?.closest?.('#finditExactShell [data-fx],#finditExactShell [data-fxnav],#finditExactShell [data-stable-action]');
    if(!el)return null;
    let a=el.dataset.fx||el.dataset.fxnav||el.dataset.stableAction||'';
    if(a==='nearby'&&/\bLive Stock\b/i.test(el.textContent||''))a='stock';
    return a;
  };

  const matches=(html,kind)=>kind==='stock'?/Live Stock|stock evidence|online availability/i.test(html):/Compare Prices|verified\/current pricing|in-store branch prices/i.test(html);

  window.addEventListener('click',e=>{
    if(e.target?.closest?.('#fxStableModal .fx-stable-close')){
      desired=null;lastGoodHtml='';return;
    }
    const a=actionOf(e.target);
    if(!a)return;
    if(a==='compare'||a==='stock'){
      desired=a;
      lastGoodHtml='';
    }else{
      desired=null;
      lastGoodHtml='';
    }
  },true);

  const observer=new MutationObserver(()=>{
    if(restoring||!desired)return;
    const modal=document.querySelector('#fxStableModal');
    const body=document.querySelector('#fxStableBody');
    if(!modal||!body||modal.classList.contains('hidden'))return;
    const html=body.innerHTML||'';
    if(matches(html,desired)){
      lastGoodHtml=html;
      return;
    }
    if(lastGoodHtml){
      restoring=true;
      body.innerHTML=lastGoodHtml;
      queueMicrotask(()=>{restoring=false});
    }
  });
  observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
})();
