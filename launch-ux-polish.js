/* FindIt launch UX polish: truthful states, cleaner dashboard, no fake certainty. */
(()=>{'use strict';
if(window.__finditLaunchUxPolish)return;window.__finditLaunchUxPolish=true;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const state=()=>window.finditState||window.state||{};
const id=()=>state()?.result?.identification||{};
const offers=()=>{const a=[];if(Array.isArray(state().offers))a.push(...state().offers);if(Array.isArray(window.productIntelligence?.offers))a.push(...window.productIntelligence.offers);return a};
const verifiedOffers=()=>offers().filter(o=>o&&(o.exactProductMatch===true)&&(o.sourcePageVerified===true||o.priceComparisonVerified===true||o.verified===true));
const hasIdentity=()=>Boolean(id().name||id().object||id().model||id().searchQuery);
const hasPhoto=()=>Boolean(state().file||$('#preview')?.src&& !$('#preview')?.classList.contains('hidden'));
function text(el,v){if(el&&el.textContent!==v)el.textContent=v}
function truthfulProductState(){
 const identified=hasIdentity(),photo=hasPhoto();
 if(identified)return; // Existing verified-result renderer owns populated identity/price states.
 const badge=$('#fxExactBadge'),conf=$('#fxConfidence'),desc=$('#fxProductDesc'),price=$('#fxBestPrice');
 text(badge,photo?'Photo ready — product details needed':'Ready for a product');
 text(conf,'— Match');
 if(desc)text(desc,photo?'Automatic photo identification is unavailable right now. Use Search Product or a barcode to continue without guessing.':'Upload a photo, search by product name, or scan a barcode to start.');
 text(price,'Not verified yet');
}
function truthfulSmartChoice(){
 const box=$('#fxSmartChoice');if(!box)return;
 const verified=verifiedOffers(),stores=Array.isArray(state().stores)?state().stores:[];
 if(verified.length)return;
 const cards=$$('.fx-smart-card',box);
 cards.forEach(card=>{
   const label=card.querySelector('span')?.textContent||'';
   if(/BEST OVERALL/i.test(label)){text(card.querySelector('strong'),'Need verified retailer evidence');text(card.querySelector('small'),'FindIt will rank a best option only after an exact retailer result is verified.')}
   if(/CHEAPEST/i.test(label)){text(card.querySelector('strong'),'No verified price yet');text(card.querySelector('small'),'Missing prices are never guessed.')}
   if(/CLOSEST/i.test(label)&&!stores.length){text(card.querySelector('strong'),'No relevant nearby store yet');text(card.querySelector('small'),'Use location after selecting a product to find relevant retailers.')}
 });
}
function truthfulHours(){
 $$('#finditExactShell button,#finditExactShell [role="button"]').forEach(b=>{
   if(/^open now$/i.test((b.textContent||'').trim())&&!/published hours|verified/i.test(b.parentElement?.textContent||'')){b.disabled=true;b.title='Available when published opening hours are known'}
 });
}
function mapTruth(){
 const art=$('#finditExactShell .fx-map-art');if(!art)return;
 const stores=Array.isArray(state().stores)?state().stores.filter(s=>Number.isFinite(Number(s.lat??s.latitude))&&Number.isFinite(Number(s.lon??s.longitude))):[];
 $$('.p',art).forEach(p=>p.style.display=stores.length?'':'none');
 if(!stores.length){art.dataset.empty='1';if(!art.querySelector('.fx-map-empty')){const n=document.createElement('div');n.className='fx-map-empty';n.textContent='Real store pins appear after relevant nearby results are found.';art.appendChild(n)}}else{art.dataset.empty='0';art.querySelector('.fx-map-empty')?.remove()}
}
function premiumTruth(){
 const copy=$('#fxPremiumCopy');if(copy)text(copy,'Unlock wider search, saved finds, comparisons & more.');
 const title=$('#fxPremiumTitle');if(title&&document.body.classList.contains('premium-active'))text(title,'Premium Active');
 $$('.premium-plan-card li').forEach(li=>{if(/AI identification/i.test(li.textContent||''))text(li,'Product search & retailer discovery')});
}
function staleCopy(){
 const hero=$('.hero-text');if(hero&&/Show FindIt a photo/i.test(hero.textContent||''))text(hero,'Upload a photo, search by product name or scan a barcode. FindIt helps you discover relevant retailers without inventing missing product, price or stock details.');
 const eye=$('.hero .eyebrow');if(eye)text(eye,'SEARCH → VERIFY → FIND NEARBY');
}
function styles(){
 if($('#finditLaunchUxStyles'))return;const s=document.createElement('style');s.id='finditLaunchUxStyles';s.textContent=`
 .fx-map-art[data-empty="1"] .me{opacity:.45}.fx-map-empty{position:absolute;inset:50% auto auto 50%;transform:translate(-50%,-50%);width:min(78%,340px);padding:12px 14px;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(5,12,22,.82);font-size:12px;line-height:1.45;text-align:center;color:rgba(255,255,255,.72)}
 #finditExactShell button:disabled{cursor:not-allowed;opacity:.55}
 @media(max-width:760px){#finditExactShell .fx-search-tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px}#finditExactShell .fx-search-tabs button:first-child{grid-column:1/-1}.fx-smart-head{flex-direction:column}.fx-match-confidence{white-space:normal}}
 `;document.head.appendChild(s)
}
function sync(){styles();staleCopy();premiumTruth();truthfulProductState();truthfulSmartChoice();truthfulHours();mapTruth()}
['findit:results-rendered','findit:nearby-updated','findit:dashboard-sync','findit:new-photo-selected'].forEach(e=>document.addEventListener(e,()=>setTimeout(sync,40)));
new MutationObserver(()=>sync()).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',sync);setTimeout(sync,250);setTimeout(sync,1000);
})();