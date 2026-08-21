(()=>{
'use strict';
const KEY='findit_premium_preferences_v2';
const defaults={resultView:'rich',showSources:true,verifiedFirst:true,defaultSort:'best',autoOpenDetails:true};
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const read=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return {...defaults,...(x&&typeof x==='object'?x:{})}}catch{return {...defaults}}};
const write=p=>localStorage.setItem(KEY,JSON.stringify(p));
const priceOf=el=>{const raw=el?.querySelector?.('.pi-price,.price')?.textContent||'';const m=raw.replace(/\s/g,'').match(/(?:R|ZAR|USD|EUR|GBP|AUD|CAD)?[^\d]*([\d,.]+)/i);return m?Number(m[1].replace(/,/g,'')):Infinity};
const verified=el=>el?.classList?.contains('verified')||/verified listing/i.test(el?.textContent||'')?1:0;
function applyPiSort(p){
 const root=$('#productIntelligenceResults');if(!root)return;
 const cards=[...root.querySelectorAll('.pi-offer')];if(cards.length<2)return;
 if(cards.some(x=>x.dataset.fiBase==null))cards.forEach((x,i)=>{if(x.dataset.fiBase==null)x.dataset.fiBase=String(i)});
 cards.sort((a,b)=>{
   if(p.defaultSort==='price')return priceOf(a)-priceOf(b)||Number(a.dataset.fiBase)-Number(b.dataset.fiBase);
   if(p.verifiedFirst)return verified(b)-verified(a)||Number(a.dataset.fiBase)-Number(b.dataset.fiBase);
   return Number(a.dataset.fiBase)-Number(b.dataset.fiBase);
 }).forEach(x=>root.appendChild(x));
}
function applyNativeSort(p){
 const mode=p.defaultSort==='price'?'price':p.defaultSort==='distance'?'distance':'best';
 try{if(typeof state!=='undefined'){state.sort=mode;if(typeof renderOffers==='function')renderOffers()}}catch{}
 try{if(typeof applyPremiumStoreSort==='function')applyPremiumStoreSort(mode==='distance'?'closest':'original')}catch{}
 $$('.sort-btn').forEach(b=>b.classList.toggle('active',b.dataset.sort===mode));
 applyPiSort(p);
}
function applyVisualPrefs(p=read()){
 document.body.classList.toggle('premium-compact',p.resultView==='compact');
 document.body.classList.toggle('premium-hide-sources',!p.showSources);
}
function applyAll(){const p=read();applyVisualPrefs(p);applyNativeSort(p)}
function syncControls(){
 const p=read();
 if($('#ps2ResultView'))$('#ps2ResultView').value=p.resultView;
 if($('#ps2Sources'))$('#ps2Sources').checked=!!p.showSources;
 if($('#ps2Verified'))$('#ps2Verified').checked=!!p.verifiedFirst;
 if($('#ps2Sort'))$('#ps2Sort').value=p.defaultSort;
 if($('#ps2Details'))$('#ps2Details').checked=!!p.autoOpenDetails;
}
let lastAutoKey='';
function maybeAutoOpen(force=false){
 const p=read();if(!p.autoOpenDetails)return;
 const panel=$('#productIntelligencePanel'),results=$('#results');
 if(!panel||panel.classList.contains('hidden')||!results||results.classList.contains('hidden'))return;
 const key=($('#resultTitle')?.textContent||'')+'|'+(panel.textContent||'').slice(0,100);
 if(!force&&key===lastAutoKey)return;lastAutoKey=key;
 setTimeout(()=>{try{panel.scrollIntoView({behavior:'smooth',block:'start'})}catch{}},180);
}
function saveFromControl(t){
 const p=read();
 if(t.id==='ps2ResultView')p.resultView=t.value;
 if(t.id==='ps2Sources')p.showSources=!!t.checked;
 if(t.id==='ps2Verified')p.verifiedFirst=!!t.checked;
 if(t.id==='ps2Sort')p.defaultSort=t.value;
 if(t.id==='ps2Details')p.autoOpenDetails=!!t.checked;
 write(p);applyAll();syncControls();if(t.id==='ps2Details'&&t.checked)maybeAutoOpen(true);
}
function refreshAfterSearch(){[800,1600,3000].forEach(ms=>setTimeout(()=>{applyAll();maybeAutoOpen(false)},ms))}
function bind(){
 document.addEventListener('change',e=>{const id=e.target?.id||'';if(['ps2ResultView','ps2Sources','ps2Verified','ps2Sort','ps2Details'].includes(id))saveFromControl(e.target)},true);
 document.addEventListener('findit:results-rendered',()=>{applyAll();maybeAutoOpen(true)});
 document.addEventListener('click',e=>{if(e.target.closest?.('#search,#widenSearch,[data-premium-radius]'))refreshAfterSearch()},true);
 setTimeout(()=>{applyAll();syncControls()},300);
 setTimeout(()=>{applyAll();syncControls();maybeAutoOpen(false)},1400);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();