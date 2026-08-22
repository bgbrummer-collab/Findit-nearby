(()=>{
'use strict';
const KEY='findit_premium_preferences_v2';
const defaults={resultView:'rich',showSources:true,verifiedFirst:true,defaultSort:'best',autoOpenDetails:true};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const read=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return {...defaults,...(x&&typeof x==='object'?x:{})}}catch{return {...defaults}}};
const write=p=>localStorage.setItem(KEY,JSON.stringify(p));
const priceOf=el=>{const raw=el?.querySelector?.('.pi-price,.price')?.textContent||'';const m=raw.replace(/\s/g,'').match(/(?:R|ZAR|USD|EUR|GBP|AUD|CAD)?[^\d]*([\d,.]+)/i);return m?Number(m[1].replace(/,/g,'')):Infinity};
const verified=el=>el?.classList?.contains('verified')||/verified listing/i.test(el?.textContent||'')?1:0;
function ensureLayoutStyles(){
 if($('#finditPremiumLayoutStyles'))return;
 const s=document.createElement('style');s.id='finditPremiumLayoutStyles';s.textContent=`
/* RICH — intentionally spacious, larger and more detailed */
body.premium-rich .results-shell{padding:42px!important}
body.premium-rich .foundit-banner{padding:20px!important;margin-bottom:24px!important}
body.premium-rich .result-header h2{font-size:46px!important;line-height:1.02!important}
body.premium-rich .result-header p{font-size:13px!important;line-height:1.75!important;max-width:900px!important}
body.premium-rich .analysis-grid{gap:16px!important;margin:30px 0!important}
body.premium-rich .analysis-card{padding:22px!important;min-height:124px!important;border-radius:20px!important;background:linear-gradient(145deg,#17223a,#10182b)!important}
body.premium-rich .analysis-card span{font-size:10px!important;letter-spacing:1.4px!important}
body.premium-rich .analysis-card strong{font-size:15px!important;line-height:1.5!important}
body.premium-rich .result-section{margin-top:34px!important;padding-top:30px!important}
body.premium-rich .result-section h3{font-size:26px!important}
body.premium-rich .result-section p{font-size:12px!important}
body.premium-rich .store-list,body.premium-rich .offer-list{gap:16px!important}
body.premium-rich .store-card{padding:20px!important;border-radius:21px!important;background:linear-gradient(145deg,#142039,#10182b)!important}
body.premium-rich .store-main strong{font-size:16px!important}
body.premium-rich .store-main small{font-size:11px!important}
body.premium-rich .store-tags span{font-size:9px!important;padding:5px 8px!important}
body.premium-rich .store-distance{font-size:14px!important}
body.premium-rich .offer-card{padding:20px!important;gap:20px!important;border-radius:21px!important}
body.premium-rich .offer-card img{width:118px!important;height:118px!important}
body.premium-rich .offer-card h4{font-size:17px!important}
body.premium-rich .offer-card p{font-size:11px!important}
body.premium-rich .offer-card .price{font-size:22px!important}
body.premium-rich .product-intelligence-panel{padding:28px!important;border-radius:24px!important}
body.premium-rich .pi-offer{padding:24px!important;border-radius:21px!important;background:linear-gradient(145deg,#121f37,#0f1729)!important}
body.premium-rich .pi-offer h4{font-size:17px!important}
body.premium-rich .pi-offer p{font-size:11px!important}
body.premium-rich .pi-price{font-size:32px!important}
body.premium-rich .free-action-grid a,body.premium-rich .free-action-grid button{padding:18px!important;border-radius:16px!important}
body.premium-rich .free-action-grid strong{font-size:13px!important}
body.premium-rich .free-action-grid span{font-size:10px!important}
/* COMPACT — intentionally dense */
body.premium-compact .results-shell{padding:14px!important;border-radius:18px!important}
body.premium-compact .foundit-banner{padding:8px 10px!important;margin-bottom:8px!important}
body.premium-compact .foundit-banner>span{font-size:16px!important}
body.premium-compact .foundit-banner p{display:none!important}
body.premium-compact .foundit-banner strong{font-size:13px!important}
body.premium-compact .result-header h2{font-size:23px!important;margin:2px 0!important}
body.premium-compact .result-header p{font-size:8px!important;line-height:1.35!important;margin:3px 0!important}
body.premium-compact .analysis-grid{grid-template-columns:repeat(4,1fr)!important;gap:5px!important;margin:8px 0!important}
body.premium-compact .analysis-card{padding:7px 8px!important;min-height:0!important;border-radius:9px!important}
body.premium-compact .analysis-card span{font-size:6px!important;letter-spacing:.8px!important}
body.premium-compact .analysis-card strong{font-size:8px!important;margin-top:2px!important;line-height:1.2!important}
body.premium-compact .confidence-bar{height:3px!important;margin-top:4px!important}
body.premium-compact .quick-feedback{padding:4px 0!important;font-size:7px!important}
body.premium-compact .result-section{margin-top:8px!important;padding-top:8px!important}
body.premium-compact .result-section h3{font-size:14px!important;margin:1px 0!important}
body.premium-compact .result-section p{font-size:7px!important;line-height:1.3!important;margin:2px 0!important}
body.premium-compact .nearby-layout{gap:5px!important;margin-top:5px!important}
body.premium-compact .store-list,body.premium-compact .offer-list{gap:4px!important}
body.premium-compact .store-card{grid-template-columns:22px 1fr auto!important;gap:5px!important;padding:6px 7px!important;border-radius:9px!important}
body.premium-compact .store-rank{width:20px!important;height:20px!important;font-size:7px!important}
body.premium-compact .store-main strong{font-size:9px!important}
body.premium-compact .store-main small{font-size:6px!important;margin-top:1px!important}
body.premium-compact .store-tags{gap:2px!important;margin-top:3px!important}
body.premium-compact .store-tags span{font-size:5px!important;padding:2px 3px!important}
body.premium-compact .store-distance{font-size:8px!important}
body.premium-compact .store-actions{margin-top:3px!important;gap:2px!important}
body.premium-compact .store-actions a{font-size:6px!important;padding:3px 4px!important}
body.premium-compact .offer-card{grid-template-columns:44px 1fr auto!important;gap:5px!important;padding:5px!important;border-radius:9px!important}
body.premium-compact .offer-card img{width:44px!important;height:44px!important;border-radius:6px!important}
body.premium-compact .offer-card h4{font-size:9px!important}
body.premium-compact .offer-card p,body.premium-compact .offer-card a{font-size:6px!important;margin:2px 0!important}
body.premium-compact .offer-card .price{font-size:10px!important}
body.premium-compact .product-intelligence-panel{padding:9px!important;border-radius:12px!important;margin-top:7px!important}
body.premium-compact .pi-grid{gap:4px!important}
body.premium-compact .pi-offer{padding:7px!important;border-radius:9px!important;gap:6px!important}
body.premium-compact .pi-offer h4{font-size:9px!important;margin:1px 0!important}
body.premium-compact .pi-offer p{font-size:6px!important;margin:2px 0!important}
body.premium-compact .pi-meta{gap:2px!important;margin-top:3px!important}
body.premium-compact .pi-meta span{font-size:5px!important;padding:2px 4px!important}
body.premium-compact .pi-price{font-size:14px!important}
body.premium-compact .free-action-grid{gap:4px!important}
body.premium-compact .free-action-grid a,body.premium-compact .free-action-grid button{padding:6px!important;border-radius:8px!important}
body.premium-compact .free-action-grid strong{font-size:8px!important;margin-top:2px!important}
body.premium-compact .free-action-grid span{font-size:6px!important;margin-top:1px!important}
/* Watchlist / exact price tracker — remove giant empty space */
#v10UniversalModal.findit-watch-modal .premium-tool-card{width:min(1050px,94vw)!important;max-height:88vh!important;overflow:auto!important;padding:24px!important}
#v10UniversalModal.findit-watch-modal #v10ModalBody>h2{margin:4px 0 8px!important}
#v10UniversalModal.findit-watch-modal #v10ModalBody>.premium-tool-note{max-width:900px!important;margin-bottom:12px!important}
#v10UniversalModal.findit-watch-modal .v10-actions{display:flex!important;gap:8px!important;flex-wrap:wrap!important;margin:10px 0!important}
#v10UniversalModal.findit-watch-modal .v10-list{display:grid!important;gap:10px!important;margin-top:10px!important}
#v10UniversalModal.findit-watch-modal .v10-row{min-height:0!important;padding:14px!important;border-radius:14px!important;gap:12px!important;background:#0d1730!important}
#v10UniversalModal.findit-watch-modal .v10-row>div:first-child{min-width:0!important}
#v10UniversalModal.findit-watch-modal .v10-row b{font-size:15px!important}
#v10UniversalModal.findit-watch-modal .v10-row small{font-size:10px!important;line-height:1.45!important}
#v10UniversalModal.findit-watch-modal .findit-row-actions{align-self:start!important;display:flex!important;gap:6px!important;flex-wrap:wrap!important}
#v10UniversalModal.findit-watch-modal [data-watch-target2],#v10UniversalModal.findit-watch-modal [data-watch-target]{max-width:150px!important;height:38px!important;margin:4px 0!important}
body.premium-rich #v10UniversalModal.findit-watch-modal .premium-tool-card{padding:30px!important}
body.premium-rich #v10UniversalModal.findit-watch-modal #v10ModalBody>h2{font-size:38px!important}
body.premium-rich #v10UniversalModal.findit-watch-modal .premium-tool-note{font-size:13px!important;line-height:1.65!important}
body.premium-rich #v10UniversalModal.findit-watch-modal .v10-row{padding:18px!important;border:1px solid #7768ff33!important;background:linear-gradient(145deg,#101c36,#0c1428)!important}
body.premium-rich #v10UniversalModal.findit-watch-modal .v10-row b{font-size:17px!important}
body.premium-rich #v10UniversalModal.findit-watch-modal .v10-row small{font-size:11px!important}
body.premium-compact #v10UniversalModal.findit-watch-modal .premium-tool-card{width:min(900px,96vw)!important;padding:14px!important;max-height:90vh!important}
body.premium-compact #v10UniversalModal.findit-watch-modal #v10ModalBody>h2{font-size:24px!important;margin:2px 0 5px!important}
body.premium-compact #v10UniversalModal.findit-watch-modal .premium-home-kicker{font-size:7px!important}
body.premium-compact #v10UniversalModal.findit-watch-modal .premium-tool-note{font-size:8px!important;line-height:1.35!important;margin:4px 0 7px!important}
body.premium-compact #v10UniversalModal.findit-watch-modal .v10-actions{gap:5px!important;margin:6px 0!important}
body.premium-compact #v10UniversalModal.findit-watch-modal .v10-actions button{padding:7px 9px!important;font-size:8px!important}
body.premium-compact #v10UniversalModal.findit-watch-modal .v10-list{gap:5px!important;margin-top:6px!important}
body.premium-compact #v10UniversalModal.findit-watch-modal .v10-row{padding:8px!important;border-radius:9px!important;gap:7px!important}
body.premium-compact #v10UniversalModal.findit-watch-modal .v10-row b{font-size:10px!important}
body.premium-compact #v10UniversalModal.findit-watch-modal .v10-row small{font-size:7px!important;line-height:1.3!important}
body.premium-compact #v10UniversalModal.findit-watch-modal .findit-watch-source{font-size:6px!important;padding:3px 5px!important;margin-top:3px!important}
body.premium-compact #v10UniversalModal.findit-watch-modal .findit-row-actions button{padding:6px 8px!important;font-size:7px!important}
body.premium-compact #v10UniversalModal.findit-watch-modal [data-watch-target2],body.premium-compact #v10UniversalModal.findit-watch-modal [data-watch-target]{max-width:120px!important;height:30px!important;font-size:8px!important}
@media(max-width:700px){body.premium-compact .analysis-grid{grid-template-columns:repeat(2,1fr)!important}body.premium-compact .nearby-layout{grid-template-columns:1fr!important}body.premium-rich .analysis-grid{grid-template-columns:repeat(2,1fr)!important}#v10UniversalModal.findit-watch-modal .v10-row{grid-template-columns:1fr!important}#v10UniversalModal.findit-watch-modal .findit-row-actions{justify-content:flex-start!important}}
`;
 document.head.appendChild(s);
}
function decorateWatchModal(){
 const modal=$('#v10UniversalModal'),body=$('#v10ModalBody');if(!modal||!body)return;
 const title=body.querySelector('h2')?.textContent||'';
 const watch=/price\s*&\s*stock|price drops|stock alerts/i.test(title);
 modal.classList.toggle('findit-watch-modal',watch);
}
function applyPiSort(p){const root=$('#productIntelligenceResults');if(!root)return;const cards=[...root.querySelectorAll('.pi-offer')];if(cards.length<2)return;if(cards.some(x=>x.dataset.fiBase==null))cards.forEach((x,i)=>{if(x.dataset.fiBase==null)x.dataset.fiBase=String(i)});cards.sort((a,b)=>{if(p.defaultSort==='price')return priceOf(a)-priceOf(b)||Number(a.dataset.fiBase)-Number(b.dataset.fiBase);if(p.verifiedFirst)return verified(b)-verified(a)||Number(a.dataset.fiBase)-Number(b.dataset.fiBase);return Number(a.dataset.fiBase)-Number(b.dataset.fiBase)}).forEach(x=>root.appendChild(x))}
function applyNativeSort(p){const mode=p.defaultSort==='price'?'price':p.defaultSort==='distance'?'distance':'best';try{if(typeof state!=='undefined'){state.sort=mode;if(typeof renderOffers==='function')renderOffers()}}catch{}try{if(typeof applyPremiumStoreSort==='function')applyPremiumStoreSort(mode==='distance'?'closest':'original')}catch{}$$('.sort-btn').forEach(b=>b.classList.toggle('active',b.dataset.sort===mode));applyPiSort(p)}
function applyVisualPrefs(p=read()){ensureLayoutStyles();document.body.classList.toggle('premium-compact',p.resultView==='compact');document.body.classList.toggle('premium-rich',p.resultView==='rich');document.body.classList.toggle('premium-hide-sources',!p.showSources);decorateWatchModal()}
function applyAll(){const p=read();applyVisualPrefs(p);applyNativeSort(p)}
function syncControls(){const p=read();if($('#ps2ResultView'))$('#ps2ResultView').value=p.resultView;if($('#ps2Sources'))$('#ps2Sources').checked=!!p.showSources;if($('#ps2Verified'))$('#ps2Verified').checked=!!p.verifiedFirst;if($('#ps2Sort'))$('#ps2Sort').value=p.defaultSort;if($('#ps2Details'))$('#ps2Details').checked=!!p.autoOpenDetails}
let lastAutoKey='';
function maybeAutoOpen(force=false){const p=read();if(!p.autoOpenDetails)return;const panel=$('#productIntelligencePanel'),results=$('#results');if(!panel||panel.classList.contains('hidden')||!results||results.classList.contains('hidden'))return;const key=($('#resultTitle')?.textContent||'')+'|'+(panel.textContent||'').slice(0,100);if(!force&&key===lastAutoKey)return;lastAutoKey=key;setTimeout(()=>{try{panel.scrollIntoView({behavior:'smooth',block:'start'})}catch{}},180)}
function saveFromControl(t){const p=read();if(t.id==='ps2ResultView')p.resultView=t.value;if(t.id==='ps2Sources')p.showSources=!!t.checked;if(t.id==='ps2Verified')p.verifiedFirst=!!t.checked;if(t.id==='ps2Sort')p.defaultSort=t.value;if(t.id==='ps2Details')p.autoOpenDetails=!!t.checked;write(p);applyAll();syncControls();if(t.id==='ps2Details'&&t.checked)maybeAutoOpen(true)}
function refreshAfterSearch(){[600,1200,2200].forEach(ms=>setTimeout(()=>{applyAll();maybeAutoOpen(false)},ms))}
function bind(){ensureLayoutStyles();document.addEventListener('change',e=>{const id=e.target?.id||'';if(['ps2ResultView','ps2Sources','ps2Verified','ps2Sort','ps2Details'].includes(id))saveFromControl(e.target)},true);document.addEventListener('findit:results-rendered',()=>{applyAll();maybeAutoOpen(true)});document.addEventListener('click',e=>{if(e.target.closest?.('#search,#widenSearch,[data-premium-radius],[data-v10="watchlist"],#premiumWorkspaceButton'))setTimeout(()=>{applyAll();decorateWatchModal()},80)},true);const body=$('#v10ModalBody');if(body)new MutationObserver(()=>{decorateWatchModal();applyVisualPrefs(read())}).observe(body,{childList:true,subtree:true});setTimeout(()=>{applyAll();syncControls()},250);setTimeout(()=>{applyAll();syncControls();maybeAutoOpen(false)},1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();