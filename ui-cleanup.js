/* FindIt critical UI cleanup + isolated commerce actions.
   Compare Prices and Live Stock are owned here before legacy/deferred dashboard runtimes. */
(()=>{
  'use strict';
  if(window.__finditUiCleanupV3)return;window.__finditUiCleanupV3=true;
  const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
  const remove=el=>{if(el?.parentNode)el.parentNode.removeChild(el)};
  const norm=v=>String(v??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const positive=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))&&Number(v)>0;
  const money=(n,c='ZAR')=>{if(!positive(n))return'Price not published';try{return new Intl.NumberFormat('en-ZA',{style:'currency',currency:c||'ZAR'}).format(Number(n))}catch{return`${c||'ZAR'} ${Number(n).toFixed(2)}`}};
  const knownStock=v=>/^(in_stock|out_of_stock|preorder|backorder)$/i.test(String(v||''));
  const stock=v=>({in_stock:'In stock online',out_of_stock:'Out of stock online',preorder:'Pre-order online',backorder:'Back-order online'}[String(v||'').toLowerCase()]||'Online stock not published');
  const retailer=o=>String(o?.retailer?.name||o?.retailer||o?.store||o?.seller||'Retailer').trim();
  const state=()=>{try{return window.finditState||window.state||{}}catch{return{}}};
  const premiumActive=()=>localStorage.getItem('findit_premium_beta')==='1';
  const validUrl=v=>{try{return /^https?:$/.test(new URL(v).protocol)}catch{return false}};

  function closeSafeModal(){const m=q('#fxCommerceSafeModal');if(m){m.hidden=true;m.setAttribute('aria-hidden','true')}}
  function showPremiumGate(){
    closeSafeModal();
    const m=q('#premiumModal');if(!m)return;
    m.classList.remove('hidden');m.setAttribute('aria-hidden','false');
  }
  function currentOffers(){
    const s=state(),raw=[...(Array.isArray(s?.offers)?s.offers:[]),...(Array.isArray(window.productIntelligence?.offers)?window.productIntelligence.offers:[])],best=new Map();
    for(const o of raw){
      if(!o||o.exactProductMatch===false)continue;
      if(!(o.sourcePageVerified===true||o.priceComparisonVerified===true||o.verified===true||o.searchGroundedVerified===true))continue;
      const k=norm(retailer(o));if(!k)continue;
      const score=x=>(x?.sourcePageVerified===true?1000:0)+(x?.priceComparisonVerified===true?500:0)+(positive(x?.price)?200:0)+(knownStock(x?.availability)?120:0)+(x?.exactProductMatch===true?100:0);
      const old=best.get(k);
      if(!old||score(o)>score(old)||(score(o)===score(old)&&positive(o.price)&&(!positive(old.price)||Number(o.price)<Number(old.price))))best.set(k,o);
    }
    return[...best.values()].sort((a,b)=>{const ap=positive(a.price),bp=positive(b.price);if(ap!==bp)return bp-ap;if(ap&&bp)return Number(a.price)-Number(b.price);return retailer(a).localeCompare(retailer(b))});
  }
  function stores(){return[...(Array.isArray(state()?.stores)?state().stores:[])].sort((a,b)=>Number(a.distanceKm??1e9)-Number(b.distanceKm??1e9))}
  function offerRow(o,showPrice=true){
    const url=o.product_url||o.url;
    return`<div class="fx-commerce-row"><div><b>${esc(retailer(o))}</b><small>${esc(o.product_name||state()?.result?.identification?.name||'Exact product')} · ${esc(stock(o.availability))}</small></div><div>${showPrice?`<b>${esc(money(o.price,o.currency||'ZAR'))}</b>`:''}${validUrl(url)?`<br><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">View product</a>`:''}</div></div>`;
  }
  function safeModal(title,html){
    let m=q('#fxCommerceSafeModal');
    if(!m){
      m=document.createElement('div');m.id='fxCommerceSafeModal';m.className='fx-commerce-safe-modal';m.hidden=true;m.setAttribute('aria-hidden','true');
      m.innerHTML='<div class="fx-commerce-safe-card" role="dialog" aria-modal="true"><button type="button" class="fx-commerce-safe-close" aria-label="Close">×</button><div id="fxCommerceSafeBody"></div></div>';
      document.body.appendChild(m);
      m.addEventListener('click',e=>{if(e.target===m||e.target.closest('.fx-commerce-safe-close'))closeSafeModal()});
    }
    const b=q('#fxCommerceSafeBody');if(!b)return;
    b.innerHTML=`<h2>${esc(title)}</h2>${html}`;m.hidden=false;m.setAttribute('aria-hidden','false');
  }
  function compareHtml(){
    const offers=currentOffers(),priced=offers.filter(o=>positive(o.price)),unpriced=offers.filter(o=>!positive(o.price)),nearby=stores();
    return`<p class="fx-commerce-sub">Verified exact-product results from your current Find. FindIt does not guess missing prices or branch stock.</p><div id="fxPriceStatus" class="fx-commerce-status">${priced.length?`${priced.length} retailer${priced.length===1?'':'s'} with a verified/current price.`:'No trustworthy current price has been verified yet.'}</div><h3>Current online prices</h3><div id="fxOnlinePrices" class="fx-commerce-list">${priced.length?priced.map(o=>offerRow(o,true)).join(''):'<div class="fx-commerce-row"><div>No trustworthy current online price has been verified yet.</div></div>'}</div>${unpriced.length?`<h3>Exact listings without a published price</h3><div class="fx-commerce-list">${unpriced.map(o=>offerRow(o,true)).join('')}</div>`:''}<h3>Nearby retailers</h3><div class="fx-commerce-list">${nearby.length?nearby.slice(0,10).map(s=>`<div class="fx-commerce-row"><div><b>${esc(s.name||'Store')}</b><small>${Number.isFinite(Number(s.distanceKm))?`${Number(s.distanceKm).toFixed(1)} km · `:''}${esc(s.address||'')} · Branch stock unknown unless this exact branch publishes inventory</small></div></div>`).join(''):'<div class="fx-commerce-row"><div>No nearby retailer locations are available yet.</div></div>'}</div>`;
  }
  function stockHtml(){
    const offers=currentOffers(),known=offers.filter(o=>knownStock(o.availability)),unknown=offers.filter(o=>!knownStock(o.availability)),nearby=stores(),verifiedBranches=nearby.filter(s=>s.branchStockVerified===true||s.stockVerified===true);
    return`<p class="fx-commerce-sub">Online availability and physical-branch inventory are separate. FindIt only calls stock verified when the retailer publishes that evidence.</p><div id="fxStockStatus" class="fx-commerce-status">${known.length?'Verified online stock evidence loaded.':'No retailer currently publishes a trustworthy online stock signal for this exact product.'}</div><h3>Verified online availability</h3><div id="fxStockRows" class="fx-commerce-list">${known.length?known.map(o=>offerRow(o,false)).join(''):'<div class="fx-commerce-row"><div>No verified online stock signal yet.</div></div>'}</div>${unknown.length?`<h3>Exact listings — stock not published</h3><div class="fx-commerce-list">${unknown.map(o=>offerRow(o,false)).join('')}</div>`:''}<h3>Nearby branch stock</h3><div class="fx-commerce-list">${verifiedBranches.length?verifiedBranches.map(s=>`<div class="fx-commerce-row"><div><b>${esc(s.name||'Store')}</b><small>${s.inStock===false?'Verified out of stock at this branch':'Verified in stock at this branch'}${Number.isFinite(Number(s.distanceKm))?` · ${Number(s.distanceKm).toFixed(1)} km`:''}</small></div></div>`).join(''):'<div class="fx-commerce-row"><div>No nearby branch has published branch-specific inventory. FindIt will not guess it.</div></div>'}</div>`;
  }
  function runCommerce(action){if(action==='compare')safeModal('Compare Prices',compareHtml());else if(action==='stock')safeModal('Live Stock',stockHtml())}

  // Earliest owner: Free users see the Premium upgrade; Premium users get the isolated,
  // non-blocking commerce modal. Older handlers never receive the click.
  window.addEventListener('click',e=>{
    const el=e.target?.closest?.('#finditExactShell [data-fx="compare"],#finditExactShell [data-fxnav="compare"],#finditExactShell [data-fx="stock"]');
    if(!el)return;
    const action=el.dataset.fxnav||el.dataset.fx||'';if(action!=='compare'&&action!=='stock')return;
    e.preventDefault();e.stopImmediatePropagation();
    if(!premiumActive()){showPremiumGate();return}
    setTimeout(()=>runCommerce(action),0);
  },true);
  window.addEventListener('keydown',e=>{if(e.key==='Escape')closeSafeModal()});

  function ensureFeedbackUi(){
    const form=q('#feedbackForm');if(!form||form.dataset.finditFeedbackV2==='1')return;form.dataset.finditFeedbackV2='1';
    form.innerHTML=`<div class="feedback-intro">Tell us what worked, report a problem, or suggest what FindIt should build next.</div><label class="feedback-field">Feedback type<select id="feedbackTopic"><option value="general">General feedback</option><option value="identification">Wrong identification</option><option value="nearby">Nearby store / location problem</option><option value="price-stock">Price or stock problem</option><option value="feature">💡 Suggest a feature</option></select></label><div class="feature-suggest-card"><div><strong>💡 Have an idea for FindIt?</strong><span>Suggest a feature and tell us what would make FindIt more useful.</span></div><button id="suggestFeatureQuick" type="button">Suggest a feature</button></div><fieldset class="feedback-rating-field"><legend>Rating</legend><div class="star-rating" aria-label="Choose a rating from 1 to 5 stars">${[1,2,3,4,5].map(x=>`<button type="button" class="star-btn" data-rating="${x}" aria-label="${x} star${x===1?'':'s'}">★</button>`).join('')}</div><select id="feedbackRating" class="feedback-rating-value" aria-hidden="true" tabindex="-1"><option value="0" selected>0</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></fieldset><label class="feedback-field">Message<textarea id="feedbackMessage" maxlength="1000" required placeholder="What worked? What should improve?"></textarea></label><label class="check-row"><input id="includeTechnical" type="checkbox" checked> Include basic technical details to help us fix bugs</label><div class="feedback-actions"><button id="sendFeedback" class="btn primary" type="submit">Send feedback</button><button id="copyFeedback" class="btn secondary" type="button">Copy</button></div><p id="feedbackStatus" class="status" aria-live="polite"></p>`;
    q('#suggestFeatureQuick')?.addEventListener('click',()=>{const topic=q('#feedbackTopic'),msg=q('#feedbackMessage');if(topic)topic.value='feature';if(msg){msg.placeholder='Describe the feature you want FindIt to add…';msg.focus()}form.scrollIntoView({behavior:'auto',block:'center'})});
  }
  function enhanceStorePrices(){
    const st=state(),nearby=Array.isArray(st?.stores)?st.stores:[],offers=Array.isArray(st?.offers)?st.offers:[];
    qa('#nearbyStores .store-card').forEach(card=>{const i=Number(card.dataset.store),store=nearby[i];if(!store)return;const main=card.querySelector('.store-main');if(!main)return;const branchPrice=store.branchPriceVerified===true&&positive(store.price)?Number(store.price):null;const sn=norm(store.retailer||store.name),offer=offers.find(o=>{const rn=norm(o?.retailer?.name||o?.retailer);return rn&&sn&&(sn.includes(rn)||rn.includes(sn))});const onlinePrice=offer&&positive(offer.price)?Number(offer.price):null,value=branchPrice??onlinePrice;if(value==null)return;let box=main.querySelector('.findit-price-scope');if(!box){box=document.createElement('div');box.className='result-note findit-price-scope';main.insertBefore(box,main.querySelector('.store-actions')||null)}const currency=branchPrice!=null?(store.currency||'ZAR'):(offer?.currency||'ZAR'),label=branchPrice!=null?'Verified branch price':`${offer?.retailer?.name||offer?.retailer||store.name} online price`;box.innerHTML=`<strong>${money(value,currency)}</strong> • ${label}`});
  }
  function ensureStyle(){
    if(q('#finditTrustUiStyle'))return;const s=document.createElement('style');s.id='finditTrustUiStyle';s.textContent=`
html{scroll-behavior:auto!important}button,a,[role="button"]{touch-action:manipulation}.reveal{opacity:1!important;transform:none!important;visibility:visible!important}#finditV3Strip{display:none!important}#finditV3Actions [aria-disabled="true"]{display:none!important}
.fx-commerce-safe-modal{position:fixed;inset:0;z-index:2147483000;background:#020817d9;display:grid;place-items:center;padding:20px;overflow:auto}.fx-commerce-safe-modal[hidden]{display:none!important}.fx-commerce-safe-card{position:relative;width:min(760px,100%);max-height:min(84vh,900px);overflow:auto;background:#071321;border:1px solid #233c58;border-radius:20px;padding:26px;color:#eef4ff;box-shadow:0 30px 80px #000a}.fx-commerce-safe-close{position:absolute;right:14px;top:12px;border:0;background:transparent;color:#fff;font-size:30px;line-height:1;cursor:pointer}.fx-commerce-safe-card h2{margin:0 44px 10px 0}.fx-commerce-safe-card h3{margin:20px 0 10px}.fx-commerce-sub{color:#93a4ba;line-height:1.5}.fx-commerce-status{margin:12px 0 16px;color:#b9c7da}.fx-commerce-list{display:grid;gap:10px}.fx-commerce-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;padding:12px;border:1px solid #1f3853;border-radius:12px;background:#0a1829;min-width:0}.fx-commerce-row>div{min-width:0}.fx-commerce-row b,.fx-commerce-row small{display:block;overflow-wrap:break-word;word-break:normal}.fx-commerce-row small{color:#93a4ba;margin-top:4px;line-height:1.4}.fx-commerce-row a{color:#7bb6ff}.feedback-intro{color:#98a6bd;font-size:13px;line-height:1.6}.feedback-field{display:grid;gap:8px;color:#e8edf6;font-weight:700}.feedback-field select{min-height:48px;padding:0 14px;background:#10192a;border:1px solid var(--line);border-radius:13px;color:#fff}.feedback-rating-field{border:0;padding:0;margin:0}.feedback-rating-value{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important}.feature-suggest-card{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:15px;border:1px solid #7b68ff55;border-radius:16px}.feature-suggest-card span{display:block;color:#91a0b7;font-size:11px;margin-top:4px}.findit-price-scope{margin-top:12px}@media(max-width:760px){.fx-commerce-safe-modal{padding:10px}.fx-commerce-safe-card{padding:20px;max-height:92vh}.fx-commerce-row{grid-template-columns:1fr}.feature-suggest-card{align-items:stretch;flex-direction:column}}
`;document.head.appendChild(s)}
  function clean(){ensureFeedbackUi();ensureStyle();enhanceStorePrices();qa('.reveal').forEach(el=>{el.classList.add('visible');el.style.opacity='1';el.style.transform='none';el.style.visibility='visible'});remove(q('#finditV3Strip'));remove(q('#widenSearch'));qa('button[disabled].premium-coming').forEach(remove);qa('#finditV3Actions [aria-disabled="true"]').forEach(remove);q('#exactSellerResults .premium-insights')?.remove()}
  ensureFeedbackUi();ensureStyle();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',clean,{once:true});else clean();let queued=false;document.addEventListener('findit:results-rendered',()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;clean()})});
})();