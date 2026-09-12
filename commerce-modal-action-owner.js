/* FindIt commerce modal action owner.
   Prevents a slower Compare/Stock refresh from replacing a newer tool or reopening a modal the user closed.
   Only treats a modal as commerce when its actual modal title is Compare Prices or Live Stock.
   Performance rule: never observe the whole document tree for modal changes. */
(()=>{
  'use strict';
  if(window.__finditCommerceModalActionOwner)return;
  window.__finditCommerceModalActionOwner=true;

  let desired=null;
  let lastGoodHtml='';
  let restoring=false;
  let bodyObserver=null;
  let modalObserver=null;
  let attachedBody=null;
  let attachedModal=null;

  const actionOf=t=>{
    const el=t?.closest?.('#finditExactShell [data-fx],#finditExactShell [data-fxnav],#finditExactShell [data-stable-action]');
    if(!el)return null;
    let a=el.dataset.fx||el.dataset.fxnav||el.dataset.stableAction||'';
    if(a==='nearby'&&/\bLive Stock\b/i.test(el.textContent||''))a='stock';
    return a;
  };

  function modalTitle(html=''){
    try{
      const d=document.createElement('div');
      d.innerHTML=html;
      return String(d.querySelector('.fx-stable-title,h1,h2,h3')?.textContent||'').replace(/\s+/g,' ').trim();
    }catch{return''}
  }
  const matches=(html,kind)=>{
    const title=modalTitle(html);
    return kind==='stock'?/^Live Stock\b/i.test(title):/^Compare Prices\b/i.test(title);
  };
  const commerceKind=html=>matches(html,'stock')?'stock':matches(html,'compare')?'compare':null;

  function inspect(){
    if(restoring)return;
    const modal=document.querySelector('#fxStableModal');
    const body=document.querySelector('#fxStableBody');
    if(!modal||!body||modal.classList.contains('hidden'))return;
    const html=body.innerHTML||'';
    const kind=commerceKind(html);

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
  }

  function attachTargetedObservers(){
    const modal=document.querySelector('#fxStableModal');
    const body=document.querySelector('#fxStableBody');
    if(!modal||!body)return false;
    if(attachedModal===modal&&attachedBody===body)return true;

    bodyObserver?.disconnect();
    modalObserver?.disconnect();
    attachedModal=modal;
    attachedBody=body;

    bodyObserver=new MutationObserver(inspect);
    bodyObserver.observe(body,{childList:true,subtree:true,characterData:true});

    modalObserver=new MutationObserver(inspect);
    modalObserver.observe(modal,{attributes:true,attributeFilter:['class','aria-hidden']});
    inspect();
    return true;
  }

  function scheduleAttach(){
    if(attachTargetedObservers())return;
    setTimeout(attachTargetedObservers,50);
    setTimeout(attachTargetedObservers,250);
    setTimeout(attachTargetedObservers,1000);
  }

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
    scheduleAttach();
  },true);

  window.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      desired=null;
      lastGoodHtml='';
    }
  },true);

  document.addEventListener('findit:dashboard-sync',scheduleAttach);
  document.addEventListener('findit:results-rendered',scheduleAttach);
  scheduleAttach();
})();
