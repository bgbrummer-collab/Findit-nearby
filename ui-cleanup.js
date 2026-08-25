/* Load the retailer-offer stability layer immediately. This script sits at the end of the page before deferred result code executes. */
(()=>{if(window.__finditOfferStabilityLoader)return;window.__finditOfferStabilityLoader=true;const s=document.createElement('script');s.src='offer-stability-fix.js?v=20260825-stable1';s.async=false;document.head.appendChild(s)})();

/* FindIt critical UI cleanup. Intentionally network-free so initial page load can finish. */
(()=>{
  'use strict';
  const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
  const remove=el=>{if(el?.parentNode)el.parentNode.removeChild(el)};
  const norm=v=>String(v??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  const money=(n,c='ZAR')=>{if(n==null||!Number.isFinite(Number(n)))return'';try{return new Intl.NumberFormat('en-ZA',{style:'currency',currency:c||'ZAR'}).format(Number(n))}catch{return`${c||'ZAR'} ${Number(n).toFixed(2)}`}};

  function ensureFeedbackUi(){
    const form=q('#feedbackForm');
    if(!form||form.dataset.finditFeedbackV2==='1')return;
    form.dataset.finditFeedbackV2='1';
    form.innerHTML=`
      <div class="feedback-intro">Tell us what worked, report a problem, or suggest what FindIt should build next.</div>
      <label class="feedback-field">Feedback type
        <select id="feedbackTopic">
          <option value="general">General feedback</option>
          <option value="identification">Wrong identification</option>
          <option value="nearby">Nearby store / location problem</option>
          <option value="price-stock">Price or stock problem</option>
          <option value="feature">💡 Suggest a feature</option>
        </select>
      </label>
      <div class="feature-suggest-card">
        <div><strong>💡 Have an idea for FindIt?</strong><span>Suggest a feature and tell us what would make FindIt more useful.</span></div>
        <button id="suggestFeatureQuick" type="button">Suggest a feature</button>
      </div>
      <fieldset class="feedback-rating-field">
        <legend>Rating</legend>
        <div class="star-rating" aria-label="Choose a rating from 1 to 5 stars">
          <button type="button" class="star-btn" data-rating="1" aria-label="1 star">★</button>
          <button type="button" class="star-btn" data-rating="2" aria-label="2 stars">★</button>
          <button type="button" class="star-btn" data-rating="3" aria-label="3 stars">★</button>
          <button type="button" class="star-btn" data-rating="4" aria-label="4 stars">★</button>
          <button type="button" class="star-btn" data-rating="5" aria-label="5 stars">★</button>
        </div>
        <select id="feedbackRating" class="feedback-rating-value" aria-hidden="true" tabindex="-1">
          <option value="0" selected>0</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option>
        </select>
      </fieldset>
      <label class="feedback-field">Message
        <textarea id="feedbackMessage" maxlength="1000" required placeholder="What worked? What should improve?"></textarea>
      </label>
      <label class="check-row"><input id="includeTechnical" type="checkbox" checked> Include basic technical details to help us fix bugs</label>
      <div class="feedback-actions">
        <button id="sendFeedback" class="btn primary" type="submit">Send feedback</button>
        <button id="copyFeedback" class="btn secondary" type="button">Copy</button>
      </div>
      <p id="feedbackStatus" class="status" aria-live="polite"></p>`;

    const quick=q('#suggestFeatureQuick');
    if(quick)quick.addEventListener('click',()=>{
      const topic=q('#feedbackTopic'),msg=q('#feedbackMessage');
      if(topic)topic.value='feature';
      if(msg){msg.placeholder='Describe the feature you want FindIt to add…';msg.focus()}
      form.scrollIntoView({behavior:'smooth',block:'center'});
    });
    q('#feedbackTopic')?.addEventListener('change',e=>{
      const msg=q('#feedbackMessage');if(!msg)return;
      msg.placeholder=e.target.value==='feature'?'Describe the feature you want FindIt to add…':'What worked? What should improve?';
    });
  }

  function enhanceStorePrices(){
    let st=null;try{st=window.state}catch{}
    const stores=Array.isArray(st?.stores)?st.stores:[],offers=Array.isArray(st?.offers)?st.offers:[];
    qa('#nearbyStores .store-card').forEach(card=>{
      const i=Number(card.dataset.store),store=stores[i];if(!store)return;
      const main=card.querySelector('.store-main');if(!main)return;
      const branchPrice=store.branchPriceVerified===true&&Number.isFinite(Number(store.price))?Number(store.price):null;
      const sn=norm(store.retailer||store.name),offer=offers.find(o=>{const rn=norm(o?.retailer?.name||o?.retailer);return rn&&sn&&(sn.includes(rn)||rn.includes(sn))});
      const onlinePrice=offer&&Number.isFinite(Number(offer.price))?Number(offer.price):null;
      const value=branchPrice??onlinePrice;if(value==null)return;
      let box=main.querySelector('.findit-price-scope');if(!box){box=document.createElement('div');box.className='result-note findit-price-scope';const actions=main.querySelector('.store-actions');main.insertBefore(box,actions||null)}
      const currency=branchPrice!=null?(store.currency||'ZAR'):(offer?.currency||'ZAR'),label=branchPrice!=null?'Verified branch price':`${offer?.retailer?.name||offer?.retailer||store.name} online price`;
      const stock=branchPrice!=null?(store.stockVerified?' • branch stock confirmed':''):(offer?.availability==='in_stock'?' • in stock online':offer?.availability==='out_of_stock'?' • out of stock online':'');
      box.innerHTML=`<strong>${money(value,currency)}</strong> • ${label}${stock}`;
    });
  }

  function ensureStyle(){
    if(q('#finditTrustUiStyle'))return;
    const s=document.createElement('style');
    s.id='finditTrustUiStyle';
    s.textContent=`
      .reveal{opacity:1!important;transform:none!important;visibility:visible!important}
      #finditV3Strip{display:none!important}
      #finditV3Actions [aria-disabled="true"]{display:none!important}
      .feedback-intro{color:#98a6bd;font-size:13px;line-height:1.6}
      .feedback-field{display:grid;gap:8px;color:#e8edf6;font-weight:700}
      .feedback-field select{min-height:48px;padding:0 14px;background:#10192a;border:1px solid var(--line);border-radius:13px;color:#fff;font:inherit}
      .feedback-rating-field{border:0;padding:0;margin:0}.feedback-rating-field legend{font-weight:700;margin-bottom:5px}
      .feedback-rating-value{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important}
      .feature-suggest-card{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:15px;border:1px solid #7b68ff55;border-radius:16px;background:linear-gradient(135deg,#715cff12,#27d4f20d)}
      .feature-suggest-card strong,.feature-suggest-card span{display:block}.feature-suggest-card span{color:#91a0b7;font-size:11px;margin-top:4px;line-height:1.45}
      .feature-suggest-card button{flex:0 0 auto;border:1px solid #7667ff88;border-radius:11px;background:#181d3b;color:#fff;padding:10px 12px;font-weight:850;cursor:pointer}
      #exactSellerResults .offer-list{display:grid!important;grid-template-columns:1fr!important;gap:12px!important;width:100%!important}
      #exactSellerResults .offer-card{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:18px!important;align-items:center!important;width:100%!important;min-width:0!important;padding:18px!important}
      #exactSellerResults .offer-card>div:first-child{min-width:0!important;width:100%!important}
      #exactSellerResults .offer-card h4,#exactSellerResults .offer-card p,#exactSellerResults .offer-card a{white-space:normal!important;overflow-wrap:anywhere!important;word-break:normal!important;max-width:none!important}
      #exactSellerResults .offer-card .price{min-width:120px!important;text-align:right!important;white-space:nowrap!important;font-size:18px!important;font-weight:900!important}
      #nearbyStores .store-card{min-width:0}
      #nearbyStores .store-main{min-width:0;width:100%}
      #nearbyStores .store-main>small{white-space:normal;overflow-wrap:anywhere;word-break:normal;line-height:1.45}
      #nearbyStores .store-trust-note{display:block;white-space:normal;overflow-wrap:anywhere;line-height:1.45;margin-top:10px}
      .findit-price-scope{margin-top:12px}
      @media(max-width:760px){
        main,main>section,main>.shell,footer{opacity:1!important;visibility:visible!important}
        .shell{min-height:0!important}
        .steps-grid article,.example-card,.challenge-banner,.search-card,.examples-section{opacity:1!important;visibility:visible!important;transform:none!important}
        #exactSellerResults .offer-card{grid-template-columns:1fr!important;gap:10px!important;padding:16px!important}
        #exactSellerResults .offer-card .price{text-align:left!important;min-width:0!important;font-size:17px!important}
        #nearbyStores{display:grid!important;gap:12px!important}
        #nearbyStores .store-card{display:block!important;width:100%!important;padding:18px!important;border-radius:18px!important}
        #nearbyStores .store-main{display:block!important;width:100%!important;max-width:none!important}
        #nearbyStores .store-main>strong{font-size:18px!important;line-height:1.2!important}
        #nearbyStores .store-main>small{font-size:13px!important;line-height:1.45!important;margin-top:7px!important;color:#9aa7ba!important}
        #nearbyStores .store-tags{display:flex!important;flex-wrap:wrap!important;gap:7px!important;margin-top:12px!important}
        #nearbyStores .store-tags span{font-size:11px!important;line-height:1.25!important;padding:7px 9px!important;max-width:100%!important;white-space:normal!important}
        #nearbyStores .result-note{margin-top:12px!important;padding:11px 12px!important;font-size:12px!important;line-height:1.4!important}
        #nearbyStores .store-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;justify-content:stretch!important;margin-top:14px!important;width:100%!important}
        #nearbyStores .store-actions a{display:flex!important;align-items:center!important;justify-content:center!important;min-height:44px!important;width:100%!important;padding:9px 8px!important;font-size:11px!important;line-height:1.2!important;text-align:center!important;white-space:normal!important}
        #nearbyStores .store-trust-note{font-size:12px!important;color:#8f9db0!important;margin-top:12px!important}
        .feature-suggest-card{align-items:stretch;flex-direction:column}.feature-suggest-card button{width:100%;min-height:44px}
        .star-rating{gap:2px}.star-btn{font-size:34px}
      }
    `;
    document.head.appendChild(s);
  }

  function clean(){
    ensureFeedbackUi();
    ensureStyle();
    enhanceStorePrices();
    qa('.reveal').forEach(el=>{
      el.classList.add('visible');
      el.style.opacity='1';
      el.style.transform='none';
      el.style.visibility='visible';
    });
    remove(q('#finditV3Strip'));
    remove(q('#widenSearch'));
    qa('button[disabled].premium-coming').forEach(remove);
    qa('#finditV3Actions [aria-disabled="true"]').forEach(remove);
    q('#exactSellerResults .premium-insights')?.remove();
  }

  ensureFeedbackUi();
  ensureStyle();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',clean,{once:true});
  else clean();
  document.addEventListener('findit:results-rendered',()=>{
    requestAnimationFrame(clean);
    setTimeout(clean,250);
  });
})();
