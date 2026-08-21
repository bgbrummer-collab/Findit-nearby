(()=>{
'use strict';
const KEY='findit_premium_preferences_v2';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const read=()=>{try{return {resultView:'rich',showSources:true,verifiedFirst:true,defaultSort:'best',autoOpenDetails:true,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {resultView:'rich',showSources:true,verifiedFirst:true,defaultSort:'best',autoOpenDetails:true}}};
const num=t=>{const m=String(t||'').replace(/\s/g,'').match(/(?:R|ZAR)?([\d,.]+)/i);return m?Number(m[1].replace(/,/g,'')):Infinity};
const dist=t=>{const m=String(t||'').match(/([\d.]+)\s*km/i);return m?Number(m[1]):Infinity};
function rememberOrder(nodes){nodes.forEach((el,i)=>{if(!el.dataset.finditOriginalOrder)el.dataset.finditOriginalOrder=String(i)})}
function sortOffers(mode){
 const root=$('#productIntelligenceResults');if(!root)return;
 const cards=$$('.pi-offer',root);if(cards.length<2)return;rememberOrder(cards);
 const sorted=[...cards].sort((a,b)=>{
  if(mode==='price')return num(a.querySelector('.pi-price')?.textContent)-num(b.querySelector('.pi-price')?.textContent);
  if(mode==='best')return Number(b.classList.contains('verified'))-Number(a.classList.contains('verified'))||Number(a.dataset.finditOriginalOrder)-Number(b.dataset.finditOriginalOrder);
  return Number(a.dataset.finditOriginalOrder)-Number(b.dataset.finditOriginalOrder);
 });
 sorted.forEach(x=>root.appendChild(x));
}
function findStoreCards(){
 const selectors=['#storeList > article','#storesList > article','#storeResults > article','.store-list > article','.nearby-list > article','.retailer-list > article','#nearbyPanel .store-card','#nearbyPanel .result-card'];
 for(const s of selectors){const n=$$(s);if(n.length)return n}
 return [];
}
function sortStores(mode){
 const cards=findStoreCards();if(cards.length<2)return;rememberOrder(cards);const root=cards[0].parentElement;if(!root)return;
 const sorted=[...cards].sort((a,b)=>mode==='distance'?dist(a.textContent)-dist(b.textContent):Number(a.dataset.finditOriginalOrder)-Number(b.dataset.finditOriginalOrder));
 sorted.forEach(x=>root.appendChild(x));
}
function applySort(){const p=read();sortOffers(p.defaultSort);sortStores(p.defaultSort==='distance'?'distance':'best');
 try{if(typeof window.applyPremiumStoreSort==='function'){window.applyPremiumStoreSort(p.defaultSort==='distance'?'closest':'original')}}catch{}
}
function applyAll(){const p=read();document.body.classList.toggle('premium-compact',p.resultView==='compact');document.body.classList.toggle('premium-hide-sources',!p.showSources);sortOffers(p.defaultSort);sortStores(p.defaultSort==='distance'?'distance':'best')}
let lastAuto='';
function autoOpen(force=false){
 const p=read();if(!p.autoOpenDetails)return;const panel=$('#productIntelligencePanel');const results=$('#results');if(!panel||panel.classList.contains('hidden')||results?.classList.contains('hidden'))return;
 const sig=(document.querySelector('.result-header h2')?.textContent||'')+'|'+(panel.textContent||'').slice(0,120);if(!force&&sig===lastAuto)return;lastAuto=sig;
 setTimeout(()=>panel.scrollIntoView({behavior:'smooth',block:'start'}),180);
}
function syncControls(){const p=read();if($('#ps2Sort'))$('#ps2Sort').value=p.defaultSort;if($('#ps2Details'))$('#ps2Details').checked=!!p.autoOpenDetails}
function bind(){
 document.addEventListener('change',e=>{
  const t=e.target;if(t?.id==='ps2Sort'){const p=read();p.defaultSort=t.value;localStorage.setItem(KEY,JSON.stringify(p));applySort()}
  if(t?.id==='ps2Details'){const p=read();p.autoOpenDetails=t.checked;localStorage.setItem(KEY,JSON.stringify(p));if(t.checked)autoOpen(true)}
 },true);
 document.addEventListener('findit:results-rendered',()=>{applyAll();autoOpen(true)});
 document.addEventListener('click',e=>{if(e.target.closest('#search,#widenSearch,[data-premium-radius]'))setTimeout(()=>{applyAll();autoOpen(true)},900)},true);
 const mo=new MutationObserver(()=>{applyAll();syncControls();autoOpen(false)});mo.observe(document.body,{childList:true,subtree:true});
 setTimeout(()=>{applyAll();syncControls()},300);setTimeout(()=>{applyAll();syncControls()},1200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();