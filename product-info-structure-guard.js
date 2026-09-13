/* FindIt Product Information structure guard.
   Keeps What it does / Pros / Cons visible while exact-product research is still loading,
   without inventing product-specific facts. */
(()=>{
  'use strict';
  if(window.__finditProductInfoStructureGuard)return;
  window.__finditProductInfoStructureGuard=true;

  const text=v=>String(v||'').replace(/\s+/g,' ').trim();
  const state=()=>{try{return window.finditState||window.state||{}}catch{return{}}};
  const id=()=>state()?.result?.identification||{};
  let bodyObserver=null;
  let attachedBody=null;
  let queued=false;

  function genericPurpose(i){
    const t=text([i.object,i.name,i.category,i.retailCategory].join(' ')).toLowerCase();
    if(/conditioner/.test(t))return'A hair conditioner is used after cleansing to add moisture and slip, helping hair detangle and feel more manageable.';
    if(/shampoo/.test(t))return'A shampoo cleans the hair and scalp by removing oil, sweat and product buildup.';
    if(/microphone|\bmic\b/.test(t))return'A microphone converts sound into an audio signal for recording, calls, streaming or other audio uses.';
    if(/shoe|sneaker|footwear/.test(t))return'Footwear protects and supports the feet for everyday wear or the activity it was designed for.';
    if(/toilet paper|toilet tissue/.test(t))return'A disposable paper hygiene product intended for bathroom use.';
    if(/glasses|eyewear|spectacle/.test(t))return'Eyewear is worn for vision correction, protection or style depending on the lenses and frame.';
    return text(i.object||i.category)?`A ${text(i.object||i.category)} identified from the uploaded image.`:'Purpose is being verified from exact-product sources.';
  }

  function productInfoOpen(){
    const modal=document.querySelector('#fxStableModal');
    const body=document.querySelector('#fxStableBody');
    return !!(modal&&body&&!modal.classList.contains('hidden')&&!modal.hasAttribute('inert')&&/Product Information/i.test(body.innerText||''));
  }

  function ensureStructure(){
    if(!productInfoOpen())return;
    const body=document.querySelector('#fxStableBody');
    if(!body)return;
    let box=body.querySelector('#fxStableResearch');
    if(!box){box=document.createElement('div');box.id='fxStableResearch';box.className='fx-stable-row';box.style.marginTop='12px';body.appendChild(box)}
    const current=box.innerText||'';
    const missing=[];
    if(!/What it does/i.test(current))missing.push(`<div data-fx-structure="what"><b>What it does</b><small>${genericPurpose(id())}</small></div>`);
    if(!/\bPros\b/i.test(current))missing.push('<div data-fx-structure="pros"><h4>Pros</h4><small>Product-specific advantages are being verified from trustworthy sources.</small></div>');
    if(!/Cons|considerations/i.test(current))missing.push('<div data-fx-structure="cons"><h4>Cons / considerations</h4><small>No trustworthy product-specific downsides have been verified yet. Exact suitability can depend on the specific model or variant.</small></div>');
    if(!missing.length)return;
    let guard=box.querySelector('[data-fx-product-structure-guard]');
    if(!guard){guard=document.createElement('div');guard.dataset.fxProductStructureGuard='1';box.appendChild(guard)}
    const next=missing.join('');
    if(guard.innerHTML!==next)guard.innerHTML=next;
  }

  const schedule=()=>{
    if(queued||!productInfoOpen())return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;ensureStructure()});
  };

  function attach(){
    const body=document.querySelector('#fxStableBody');
    if(!body)return false;
    if(attachedBody===body)return true;
    bodyObserver?.disconnect();
    attachedBody=body;
    bodyObserver=new MutationObserver(schedule);
    bodyObserver.observe(body,{childList:true,subtree:true,characterData:true});
    return true;
  }

  function scheduleAttach(){if(attach())return;setTimeout(attach,50);setTimeout(attach,250);setTimeout(attach,1000)}

  window.addEventListener('click',e=>{
    if(e.target?.closest?.('#finditExactShell [data-fx="product"],#finditExactShell [data-stable-action="product"]')){
      scheduleAttach();setTimeout(ensureStructure,0);setTimeout(ensureStructure,60);setTimeout(ensureStructure,250);
    }
  },true);
  document.addEventListener('findit:dashboard-sync',scheduleAttach);
  document.addEventListener('findit:results-rendered',scheduleAttach);
  scheduleAttach();
})();
