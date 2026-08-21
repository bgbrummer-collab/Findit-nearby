(()=>{
'use strict';
const KEY='findit_premium_preferences_v2';
const $=s=>document.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const defaults={resultView:'rich',showSources:true,verifiedFirst:true,defaultSort:'best',autoOpenDetails:true};
const read=()=>{try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {...defaults}}};
const write=p=>localStorage.setItem(KEY,JSON.stringify(p));
const priceOf=el=>{const raw=el.querySelector('.pi-price,.price')?.textContent||'';const m=raw.replace(/\s/g,'').match(/(?:R|ZAR|USD|EUR|GBP|AUD|CAD)?[^\d]*([\d,.]+)/i);return m?Number(m[1].replace(/,/g,'')):Infinity};
const distanceOf=el=>{const m=String(el.textContent||'').match(/([\d.]+)\s*km/i);return m?Number(m[1]):Infinity};
const scoreOf=el=>{const m=String(el.textContent||'').match(/(\d{1,3})%\s*match/i);return m?Number(m[1]):0};
function remember(nodes){nodes.forEach((el,i)=>{if(el.dataset.finditOriginalOrder==null)el.dataset.finditOriginalOrder=String(i)})}
function original(a,b){return Number(a.dataset.finditOriginalOrder||0)-Number(b.dataset.finditOriginalOrder||0)}
function verified(el){return el.classList.contains('verified')||/verified listing/i.test(el.textContent||'')?1:0}
function reorder(root,cards,cmp){if(!root||cards.length<2)return;remember(cards);[...cards].sort(cmp).forEach(x=>root.appendChild(x))}
function sortProductIntelligence(p){const root=$('#productIntelligenceResults');if(!root)return;const cards=$$('.pi-offer',root);reorder(root,cards,(a,b)=>{if(p.defaultSort==='price')return priceOf(a)-priceOf(b)||original(a,b);if(p.verifiedFirst)return verified(b)-verified(a)||original(a,b);return original(a,b)})}
function sortOffers(p){const root=$('#offers');if(!root)return;const cards=$$('.offer-card',root);reorder(root,cards,(a,b)=>{if(p.defaultSort==='price')return priceOf(a)-priceOf(b)||original(a,b);if(p.defaultSort==='distance')return distanceOf(a)-distanceOf(b)||original(a,b);if(p.defaultSort==='best')return scoreOf(b)-scoreOf(a)||original(a,b);return original(a,b)})}
function sortStores(p){const root=$('#nearbyStores');if(!root)return;const cards=$(':scope > article',root);reorder(root,cards,(a,b)=>p.defaultSort==='distance'?distanceOf(a)-distanceOf(b)||original(a,b):original(a,b))}
function syncNativeSort(p){try{if(typeof state!=='undefined')state.sort=p.defaultSort==='price'?'price':p.defaultSort==='distance'?'distance':'best'}catch{}$$('.sort-btn').forEach(b=>b.classList.toggle('active',b.dataset.sort===(p.defaultSort==='price'?'price':p.defaultSort==='distance'?'distance':'best')))}
function applyAll(){const p=read();document.body.classList.toggle('premium-compact',p.resultView==='compact');document.body.classList.toggle('premium-hide-sources',!p.showSources);syncNativeSort(p);sortProductIntelligence(p);sortOffers(p);sortStores(p)}
let lastAuto='';
function autoOpen(force=false){const p=read();if(!p.autoOpenDetails)return;const panel=$('#productIntelligencePanel'),results=$('#results');if(!panel||panel.classList.contains('hidden')||results?.classList.contains('hidden'))return;const sig=($('#resultTitle')?.textContent||'')+'|'+(panel.textContent||'').slice(0,140);if(!force&&sig===lastAuto)return;lastAuto=sig;setTimeout(()=>panel.scrollIntoView({behavior:'smooth',block:'start'}),220)}
function syncControls(){const p=read();if($('#ps2ResultView'))$('#ps2ResultView').value=p.resultView;if($('#ps2Sources'))$('#ps2Sources').checked=!!p.showSources;if($('#ps2Verified'))$('#ps2Verified').checked=!!p.verifiedFirst;if($('#ps2Sort'))$('#ps2Sort').value=p.defaultSort;if($('#ps2Details'))$('#ps2Details').checked=!!p.autoOpenDetails}
function saveControl(t){const p=read();if(t.id==='ps2ResultView')p.resultView=t.value;if(t.id==='ps2Sources')p.showSources=t.checked;if(t.id==='ps2Verified')p.verifiedFirst=t.checked;if(t.id==='ps2Sort')p.defaultSort=t.value;if(t.id==='ps2Details')p.autoOpenDetails=t.checked;write(p);applyAll();syncControls();if(t.id==='ps2Details'&&t.checked)autoOpen(true)}
function bind(){
 document.addEventListener('change',e=>{if(/^ps2(ResultView|Sources|Verified|Sort|Details)$/.test(e.target?.id||''))saveControl(e.target)},true);
 document.addEventListener('findit:results-rendered',()=>{applyAll();autoOpen(true)});
 document.addEventListener('click',e=>{if(e.target.closest('#search,#widenSearch,[data-premium-radius]'))setTimeout(()=>{applyAll();autoOpen(true)},950)},true);
 const roots=['#productIntelligenceResults','#offers','#nearbyStores','#results'].map($).filter(Boolean);roots.forEach(root=>new MutationObserver(()=>{applyAll();autoOpen(false)}).observe(root,{childList:true,subtree:true}));
 setTimeout(()=>{applyAll();syncControls()},250);setTimeout(()=>{applyAll();syncControls()},1200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();