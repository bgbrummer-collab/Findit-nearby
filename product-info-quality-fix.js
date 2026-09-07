/* FindIt Product Information quality guard.
   Every product shows Pros and Cons/considerations. Never fills missing evidence with invented facts,
   and blocks obvious product-type mixups such as a headset receiving mouse research. */
(()=>{
'use strict';
if(window.__finditProductInfoQualityFix)return;window.__finditProductInfoQualityFix=true;
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const identity=()=>{try{return window.finditState?.result?.identification||window.state?.result?.identification||{}}catch{return{}}};
const classes=[
 ['mouse',/\b(mouse|mice)\b/i],['headset',/\b(headset|headphones?|earphones?)\b/i],['microphone',/\b(microphone|\bmic\b)\b/i],
 ['footwear',/\b(shoe|shoes|sneaker|sneakers|trainer|trainers|footwear)\b/i],['toilet-paper',/\b(toilet paper|bath tissue|toilet tissue)\b/i],
 ['hair-care',/\b(conditioner|shampoo|hair care|curl cream|styling cream)\b/i],['eyewear',/\b(glasses|eyeglasses|spectacles|eyewear|sunglasses)\b/i]
];
function typeOf(text=''){for(const [k,re] of classes)if(re.test(String(text)))return k;return''}
function conflicting(i,text){const wanted=typeOf([i.searchQuery,i.name,i.object,i.model,i.category,i.retailCategory].filter(Boolean).join(' '));const got=typeOf(text);return !!(wanted&&got&&wanted!==got)}
function sectionHTML(title,msg){return`<h4>${esc(title)}</h4><ul><li>${esc(msg)}</li></ul>`}
function repair(box){
 if(!box||box.dataset.qualityRepairing==='1')return;
 const i=identity(),text=box.textContent||'';
 if(!/What it does|Research not available|Research service/i.test(text))return;
 box.dataset.qualityRepairing='1';
 try{
  const body=box.firstElementChild||box;
  if(conflicting(i,text)){
   const label=i.searchQuery||i.name||i.object||'this product';
   body.innerHTML=`<b>What it does</b><small>FindIt identified this as ${esc(label)}, but the available web research conflicted with that product type, so the conflicting description was removed.</small>${sectionHTML('Pros','No trustworthy product-specific pros have been verified yet.')}${sectionHTML('Cons / considerations','No trustworthy product-specific cons or considerations have been verified yet.')}`;
   try{localStorage.removeItem('finditProductResearchCacheV1')}catch{}
   return;
  }
  const html=body.innerHTML||'';
  if(!/<h4[^>]*>\s*Pros\s*<\/h4>/i.test(html))body.insertAdjacentHTML('beforeend',sectionHTML('Pros','No trustworthy product-specific pros have been verified yet.'));
  if(!/<h4[^>]*>\s*(Cons|Cons \/ considerations|Considerations)/i.test(html))body.insertAdjacentHTML('beforeend',sectionHTML('Cons / considerations','No trustworthy product-specific cons or considerations have been verified yet.'));
 }finally{box.dataset.qualityRepairing='0'}
}
function scan(){const box=$('#fxStableResearch');if(box)repair(box)}
new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
document.addEventListener('findit:dashboard-sync',()=>setTimeout(scan,0));document.addEventListener('findit:results-rendered',()=>setTimeout(scan,0));
setTimeout(scan,0);setTimeout(scan,600);setTimeout(scan,1600);
})();
