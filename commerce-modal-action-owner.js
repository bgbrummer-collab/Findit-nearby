/* FindIt commerce modal action owner.
   Prevents a slower Compare/Stock refresh from replacing a newer tool or reopening a modal the user closed. */
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
  const commerceKind=html=>matches(html,'stock')?'stock':matches(html,'compare')?'compare':null;

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

  window.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      desired=null;
      lastGoodHtml='';
    }
  },true);

  const observer=new MutationObserver(()=>{
    if(restoring)return;
    const modal=document.querySelector('#fxStableModal');
    const body=document.querySelector('#fxStableBody');
    if(!modal||!body||modal.classList.contains('hidden'))return;
    const html=body.innerHTML||'';
    const kind=commerceKind(html);

    // A completed async commerce refresh must never reopen a modal after the
    // user closed it or moved on to another tool.
    if(!desired){
      if(kind){
        restoring=true;
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden','true');
        queueMicrotask(()=>{restoring=false});
      }
      return;
    }

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
  observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','aria-hidden']});
})();
