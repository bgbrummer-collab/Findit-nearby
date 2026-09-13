/* FindIt commerce modal action owner.
   Lightweight action bookkeeping only. Async commerce tools own their own stale-result guards.
   Important: never observe or rewrite the commerce modal DOM from here. */
(()=>{
  'use strict';
  if(window.__finditCommerceModalActionOwner)return;
  window.__finditCommerceModalActionOwner=true;

  let desired=null;
  let generation=0;

  const actionOf=t=>{
    const el=t?.closest?.('#finditExactShell [data-fx],#finditExactShell [data-fxnav],#finditExactShell [data-stable-action]');
    if(!el)return null;
    let a=el.dataset.fx||el.dataset.fxnav||el.dataset.stableAction||'';
    if(a==='nearby'&&/\bLive Stock\b/i.test(el.textContent||''))a='stock';
    return a;
  };

  function setDesired(kind){
    desired=kind||null;
    generation+=1;
    window.__finditCommerceDesiredAction=desired;
    window.__finditCommerceActionGeneration=generation;
    return generation;
  }

  window.finditCommerceActionState=()=>({desired,generation});
  window.finditCommerceActionIsCurrent=(kind,token)=>desired===kind&&generation===token;
  window.finditCommerceActionBegin=kind=>setDesired(kind);
  window.finditCommerceActionClear=()=>setDesired(null);

  window.addEventListener('click',e=>{
    if(e.target?.closest?.('#fxStableModal .fx-stable-close')){
      setDesired(null);
      return;
    }
    const a=actionOf(e.target);
    if(!a)return;
    if(a==='compare'||a==='stock')setDesired(a);
    else setDesired(null);
  },true);

  window.addEventListener('keydown',e=>{
    if(e.key==='Escape')setDesired(null);
  },true);
})();
