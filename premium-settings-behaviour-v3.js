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
function ensureLayoutStyles(){
 if($('#finditPremiumLayoutStyles'))return;
 const s=document.createElement('style');s.id='finditPremiumLayoutStyles';s.textContent=`
body.premium-active:not(.premium-compact) .results-shell{padding:38px!important}
body.premium-active:not(.premium-compact) .result-header h2{font-size:42px!important}
body.premium-active:not(.premium-compact) .analysis-grid{gap:14px!important;margin:26px 0!important}
body.premium-active:not(.premium-compact) .analysis-card{padding:20px!important;min-height:112px!important;border-radius:18px!important}
body.premium-active:not(.premium-compact) .analysis-card span{font-size:9px!important}
body.premium-active:not(.premium-compact) .analysis-card strong{font-size:14px!important;line-height:1.45!important}
body.premium-active:not(.premium-compact) .result-section{margin-top:30px!important;padding-top:28px!important}
body.premium-active:not(.premium-compact) .result-section h3{font-size:24px!important}
body.premium-active:not(.premium-compact) .result-section p{font-size:12px!important}
body.premium-active:not(.premium-compact) .store-list,body.premium-active:not(.premium-compact) .offer-list{gap:14px!important}
body.premium-active:not(.premium-compact) .store-card{padding:18px!important;border-radius:19px!important}
body.premium-active:not(.premium-compact) .store-main strong{font-size:15px!important}
body.premium-active:not(.premium-compact) .store-main small{font-size:10px!important}
body.premium-active:not(.premium-compact) .offer-card{padding:18px!important;gap:18px!important;border-radius:19px!important}
body.premium-active:not(.premium-compact) .offer-card img{width:110px!important;height:110px!important}
body.premium-active:not(.premium-compact) .pi-offer{padding:22px!important;border-radius:20px!important}
body.premium-active:not(.premium-compact) .pi-price{font-size:30px!important}
body.premium-compact .results-shell{padding:18px!important}
body.premium-compact .foundit-banner{padding:10px 12px!important;margin-bottom:10px!important}
body.premium-compact .foundit-banner>span{font-size:18px!important}
body.premium-compact .foundit-banner strong{font-size:14px!important}
body.premium-compact .result-header h2{font-size:25px!important;margin:3px 0!important}
body.premium-compact .result-header p{font-size:9px!important;line-height:1.45!important;margin:4px 0!important}
body.premium-compact .analysis-grid{grid-template-columns:repeat(4,1fr)!important;gap:6px!important;margin:10px 0!important}
body.premium-compact .analysis-card{padding:8px 10px!important;min-height:0!important;border-radius:10px!important}
body.premium-compact .analysis-card span{font-size:7px!important}
body.premium-compact .analysis-card strong{font-size:9px!important;margin-top:3px!important;line-height:1.25!important}
body.premium-compact .confidence-bar{height:4px!important;margin-top:5px!important}
body.premium-compact .quick-feedback{padding:5px 0!important;font-size:8px!important}
body.premium-compact .result-section{margin-top:10px!important;padding-top:10px!important}
body.premium-compact .result-section h3{font-size:16px!important;margin:2px 0!important}
body.premium-compact .result-section p{font-size:8px!important;line-height:1.4!important;margin:3px 0!important}
body.premium-compact .nearby-layout{gap:7px!important;margin-top:7px!important}
body.premium-compact .store-list,body.premium-compact .offer-list{gap:5px!important}
body.premium-compact .store-card{grid-template-columns:25px 1fr auto!important;gap:7px!important;padding:8px 9px!important;border-radius:10px!important}
body.premium-compact .store-rank{width:23px!important;height:23px!important;font-size:8px!important}
body.premium-compact .store-main strong{font-size:10px!important}
body.premium-compact .store-main small{font-size:7px!important;margin-top:2px!important}
body.premium-compact .store-tags{gap:3px!important;margin-top:4px!important}
body.premium-compact .store-tags span{font-size:6px!important;padding:3px 4px!important}
body.premium-compact .store-distance{font-size:9px!important}
body.premium-compact .store-actions{margin-top:4px!important;gap:3px!important}
body.premium-compact .store-actions a{font-size:7px!important;padding:4px 5px!important}
body.premium-compact .offer-card{grid-template-columns:52px 1fr auto!important;gap:7px!important;padding:7px!important;border-radius:10px!important}
body.premium-compact .offer-card img{width:52px!important;height:52px!important;border-radius:7px!important}
body.premium-compact .offer-card h4{font-size:10px!important}
body.premium-compact .offer-card p,body.premium-compact .offer-card a{font-size:7px!important;margin:3px 0!important}
body.premium-compact .offer-card .price{font-size:11px!important}
body.premium-compact .product-intelligence-panel{padding:12px!important;border-radius:15px!important;margin-top:10px!important}
body.premium-compact .pi-grid{gap:6px!important}
body.premium-compact .pi-offer{padding:9px!important;border-radius:11px!important;gap:8px!important}
body.premium-compact .pi-offer h4{font-size:11px!important;margin:2px 0!important}
body.premium-compact .pi-offer p{font-size:8px!important;margin:3px 0!important}
body.premium-compact .pi-meta{gap:3px!important;margin-top:4px!important}
body.premium-compact .pi-meta span{font-size:7px!important;padding:3px 5px!important}
body.premium-compact .pi-price{font-size:17px!important}
body.premium-compact .free-action-grid{gap:5px!important}
body.premium-compact .free-action-grid a,body.premium-compact .free-action-grid button{padding:8px!important;border-radius:9px!important}
body.premium-compact .free-action-grid strong{font-size:9px!important;margin-top:3px!important}
body.premium-compact .free-action-grid span{font-size:7px!important;margin-top:2px!important}
@media(max-width:700px){body.premium-compact .analysis-grid{grid-template-columns:repeat(2,1fr)!important}body.premium-compact .nearby-layout{grid-template-columns:1fr!important}body.premium-active:not(.premium-compact) .analysis-grid{grid-template-columns:repeat(2,1fr)!important}}
`;
 document.head.appendChild(s);
}
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
 ensureLayoutStyles();
 document.body.classList.toggle('premium-compact',p.resultView==='compact');
 document.body.classList.toggle('premium-rich',p.resultView==='rich');
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
 ensureLayoutStyles();
 document.addEventListener('change',e=>{const id=e.target?.id||'';if(['ps2ResultView','ps2Sources','ps2Verified','ps2Sort','ps2Details'].includes(id))saveFromControl(e.target)},true);
 document.addEventListener('findit:results-rendered',()=>{applyAll();maybeAutoOpen(true)});
 document.addEventListener('click',e=>{if(e.target.closest?.('#search,#widenSearch,[data-premium-radius]'))refreshAfterSearch()},true);
 setTimeout(()=>{applyAll();syncControls()},300);
 setTimeout(()=>{applyAll();syncControls();maybeAutoOpen(false)},1400);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();