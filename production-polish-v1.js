(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const PREMIUM_KEY='findit_premium_beta';
function addStyles(){
 if($('#finditProductionPolishStyles'))return;
 const s=document.createElement('style');s.id='finditProductionPolishStyles';s.textContent=`
 :root{--fi-card:#0f182b;--fi-card2:#121f36;--fi-border:#ffffff18;--fi-purple:#8f7cff;--fi-cyan:#27d4f2;--fi-good:#53e1a9}
 body{background-attachment:fixed}
 .topbar{box-shadow:0 8px 30px #0003}
 .desktop-nav a,.drawer-nav a,.drawer-nav button,.mobile-nav a,.mobile-nav button{transition:background .18s ease,border-color .18s ease,transform .18s ease,color .18s ease}
 .desktop-nav a:hover{color:#fff}
 .drawer-nav a:hover,.drawer-nav button:hover{border-color:#8f7cff55;background:#151f36}
 .search-card,.results-shell,.premium-home,.v10-command{box-shadow:0 20px 70px #0005}
 .btn,.premium-command,.v10-launch button,.v10-tools button{min-height:44px}
 .btn:focus-visible,button:focus-visible,a:focus-visible,select:focus-visible,input:focus-visible,textarea:focus-visible{outline:2px solid var(--fi-cyan);outline-offset:2px}
 .results-shell{overflow:hidden}
 .result-header h2{overflow-wrap:anywhere}
 .analysis-card,.store-card,.offer-card,.pi-offer,.premium-command,.v10-row{box-shadow:inset 0 1px 0 #ffffff08}
 .store-card,.offer-card,.pi-offer{transition:transform .16s ease,border-color .16s ease,background .16s ease}
 .store-card:hover,.offer-card:hover,.pi-offer:hover{transform:translateY(-1px);border-color:#8f7cff55}
 .fi-verified-pill{display:inline-flex;align-items:center;gap:5px;padding:4px 7px;border-radius:999px;background:#53e1a916;border:1px solid #53e1a938;color:#8af0c8;font-size:8px;font-weight:900;letter-spacing:.35px;margin-top:6px}
 .fi-unverified-search{display:none!important}
 .fi-empty-exact{padding:18px;border:1px dashed #ffffff24;border-radius:15px;background:#ffffff05;color:#9ba8bc;line-height:1.65}
 .fi-empty-exact strong{display:block;color:#fff;font-size:14px;margin-bottom:5px}
 .fi-empty-exact small{display:block;color:#7e8da4;margin-top:6px}
 .premium-tool-card,.premium-card,.modal-card{max-height:min(88vh,900px);overflow:auto;overscroll-behavior:contain}
 .assistant-panel{max-height:min(80vh,720px)}
 footer{padding-bottom:max(24px,env(safe-area-inset-bottom))}
 @media(max-width:800px){
  .shell{width:min(100% - 18px,1120px)}
  .topbar{height:62px;padding-inline:10px}.desktop-nav{display:none}
  .hero{padding-top:46px;min-height:auto;gap:24px}.hero h1{letter-spacing:-2px}
  .search-card,.examples-section,.feedback-section,.recent-section,.challenge-banner,.results-shell{padding:18px;border-radius:19px}
  .section-title-row{gap:10px}.section-title-row h2,.section-heading{font-size:26px}
  .finder-grid{grid-template-columns:1fr}.finder-actions{display:grid;grid-template-columns:1fr 1fr}.finder-actions #search,.finder-actions .status{grid-column:1/-1}
  .dropzone{min-height:260px}.analysis-grid{grid-template-columns:1fr 1fr}.nearby-layout{grid-template-columns:1fr}.map-wrap,.map-wrap #map{min-height:330px}
  .result-header{display:block}.result-actions{margin-top:10px;flex-wrap:wrap}
  .free-action-grid{grid-template-columns:1fr}
  .offer-card{grid-template-columns:68px 1fr}.offer-card img{width:68px;height:68px}.offer-card>:last-child{grid-column:2}
  .premium-card,.premium-tool-card,.modal-card{width:calc(100vw - 18px)!important;max-width:none!important;padding:18px!important;border-radius:18px!important}
  .mobile-nav{padding-bottom:env(safe-area-inset-bottom)}
 }
 @media(max-width:480px){
  .finder-actions{grid-template-columns:1fr}.finder-actions #search,.finder-actions .status{grid-column:auto}
  .analysis-grid{grid-template-columns:1fr}
  .hero-actions .btn{width:100%}
 }
 `;document.head.appendChild(s);
}
function removeDuplicateIds(){
 const seen=new Set();$$('[id]').forEach(el=>{if(!el.id)return;if(seen.has(el.id)){if(el.id==='premiumStatusBadge')el.remove();else el.removeAttribute('id')}else seen.add(el.id)});
}
function improvePremiumCopy(){
 const status=$('#premiumStatusBadge');if(status)status.textContent='★ Premium';
 $$('.premium-kicker').forEach(x=>{x.textContent=x.textContent.replace(/\s*BETA\b/ig,'').trim()});
 $$('#premiumModal .premium-plan-card.premium > span').forEach(x=>x.textContent='PREMIUM');
 const heading=$('#premiumModal .premium-card > h2');if(heading)heading.textContent='Find more. Verify more. Search smarter.';
 const intro=$('#premiumModal .premium-card > p');if(intro)intro.textContent='Premium adds deeper product verification, wider search, saved tools and product tracking. RealPay checkout is used when payment setup is available.';
 const list=$('#premiumModal .premium-plan-card.premium ul');if(list)list.innerHTML=[
  'Up to 25 km search radius','Saved items & collections','Exact product retailer verification','Price & stock watchlist','Favourite stores','Compare stores','Smart filters','History+','Manual & exact-match search','AI retailer search','Premium workspace'
 ].map(x=>`<li>${x}</li>`).join('');
 const note=$('#premiumModal .premium-plan-card.premium small');if(note)note.textContent='Premium access stays on this device while checkout is being finalized.';
 $$('.premium-coming,[data-pw="alerts"]').forEach(b=>{b.disabled=false;b.classList.remove('coming','premium-coming');const label=$('b',b),small=$('small',b);if(label)label.textContent='Price & Stock Watchlist';if(small)small.textContent='Track verified changes';});
}
function verifiedUrl(v){try{const u=new URL(v,location.href);return /^https?:$/.test(u.protocol)}catch{return false}}
function cleanRetailerCards(){
 const pi=(typeof productIntelligence!=='undefined'&&productIntelligence)||null;
 const verifiedNames=new Set((pi?.offers||[]).filter(o=>o?.verified&&verifiedUrl(o.product_url)).map(o=>String(o.retailer?.name||'').toLowerCase()).filter(Boolean));
 $$('.pi-offer').forEach(card=>{if(/verified listing|verified retailer|retailer product page/i.test(card.textContent||'')){if(!$('.fi-verified-pill',card)){const p=document.createElement('span');p.className='fi-verified-pill';p.textContent='✓ Verified exact listing';const host=$('.pi-meta',card)||card;p.dataset.findit='verified';host.appendChild(p)}}});
 $$('a[target="_blank"]').forEach(a=>{a.rel='noopener noreferrer'});
 const webCards=$$('[data-web-retailer],.web-retailer-card,.retailer-check-card');
 webCards.forEach(card=>{const name=(card.dataset.webRetailer||$('strong,b,h4',card)?.textContent||'').trim().toLowerCase();if(verifiedNames.size&&name&&!verifiedNames.has(name))card.classList.add('fi-unverified-search')});
}
function improveEmptyStates(){
 const panel=$('#productIntelligenceResults');if(!panel)return;
 const txt=(panel.textContent||'').trim();
 if(/No verified product price or stock data yet|No trustworthy exact-product listing|no retailer offers|temporarily unavailable/i.test(txt)){
  const q=(typeof state!=='undefined'&&(state.result?.identification?.searchQuery||state.result?.identification?.name||state.result?.identification?.object))||'';
  panel.innerHTML=`<div class="fi-empty-exact"><strong>No verified exact seller found yet.</strong>FindIt checked for trustworthy product evidence and did not fill this section with random retailer suggestions.${q?`<small>Exact query: ${String(q).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</small>`:''}</div>`;
 }
}
function wirePriceWatchlist(){
 document.addEventListener('click',e=>{const hit=e.target.closest?.('[data-pw="alerts"],.premium-coming');if(!hit)return;e.preventDefault();e.stopImmediatePropagation();try{if(typeof window.finditOpenAlertsWatchlist==='function')return window.finditOpenAlertsWatchlist();if(typeof v10Watchlist==='function')return v10Watchlist();}catch{}},true);
}
function hardenButtons(){
 $$('button').forEach(b=>{if(!b.getAttribute('type')&&!b.closest('form'))b.type='button'});
 const menu=$('#menuBtn');if(menu){menu.setAttribute('aria-controls','drawer');menu.setAttribute('aria-expanded',$('#drawer')?.classList.contains('open')?'true':'false')}
}
function sync(){addStyles();removeDuplicateIds();improvePremiumCopy();cleanRetailerCards();improveEmptyStates();hardenButtons()}
function init(){sync();wirePriceWatchlist();const root=$('#results')||document.body;new MutationObserver(()=>{clearTimeout(window.__fiPolishT);window.__fiPolishT=setTimeout(sync,60)}).observe(root,{childList:true,subtree:true});document.addEventListener('findit:results-rendered',sync);window.addEventListener('pageshow',sync);setTimeout(sync,700);setTimeout(sync,1800)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();