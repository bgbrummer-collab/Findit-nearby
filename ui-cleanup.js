/* FindIt trust-first result cleanup: one clear path, no duplicate stats, no wasted-trip suggestions. */
(()=>{
  'use strict';
  const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
  const remove=el=>{if(el?.parentNode)el.parentNode.removeChild(el)};
  const stateSafe=()=>{try{return state}catch{return null}};
  const exactBranch=s=>Boolean(s&&s.exactProductMatch===true&&s.stockVerified===true&&Number.isFinite(Number(s.lat))&&Number.isFinite(Number(s.lon)));
  const checkedTime=()=>new Intl.DateTimeFormat('en-ZA',{hour:'2-digit',minute:'2-digit'}).format(new Date());

  function ensureStyle(){
    if(q('#finditTrustUiStyle'))return;
    const s=document.createElement('style');s.id='finditTrustUiStyle';s.textContent=`
      #finditV3Strip{display:none!important}
      #exactSellerResults .premium-insights{display:none!important}
      #finditV3Actions .findit-v3-action:first-child{display:none!important}
      #finditV3Actions [aria-disabled="true"]{display:none!important}
      #nearbyPanel.findit-no-trip #mapViewBtn,#nearbyPanel.findit-no-trip #map{display:none!important}
      .findit-exact-badge{display:inline-flex;align-items:center;gap:6px;margin:0 0 8px;padding:6px 10px;border-radius:999px;border:1px solid #45d6a54a;background:#45d6a512;color:#8ff0ca;font-size:11px;font-weight:900;letter-spacing:.2px}
      .findit-checked{display:block;margin-top:7px;color:#8393ad;font-size:11px}
      #finditNoVerifiedNearby{border:1px solid #ffffff14;background:#ffffff05;border-radius:16px;padding:18px}
      #finditNoVerifiedNearby strong{display:block;font-size:17px;margin-bottom:6px;color:#f5f7ff}
      #finditNoVerifiedNearby p{margin:0;color:#97a6bd;line-height:1.5}
      #exactSellerResults .offer-card{border:1px solid #45d6a52f!important}
      #exactSellerResults .offer-card a{display:inline-block;margin-top:8px}
      .reveal{opacity:1!important;transform:none!important;visibility:visible!important}
      @media(max-width:760px){
        main,main>section,main>.shell,footer{opacity:1!important;visibility:visible!important}
        .shell{min-height:0!important}
        .steps-grid article,.example-card,.challenge-banner,.search-card,.examples-section{opacity:1!important;visibility:visible!important;transform:none!important}
        .findit-empty-visual-panel{display:none!important;min-height:0!important;height:0!important;margin:0!important;padding:0!important;border:0!important}
      }
    `;document.head.appendChild(s);
  }

  function cleanNavigation(){
    if(q('#v10CommandCentre'))remove(q('#premiumHome'));
    qa('#premiumDrawerNav a[href="#premiumHome"],#premiumDrawerNav a[href="#finder"],#premiumDrawerNav .premium-coming,#premiumDrawerNav a[href="#feedback"]').forEach(remove);
    qa('button[disabled].premium-coming').forEach(remove);
    remove(q('#widenSearch'));
  }

  function simplifyActions(){
    remove(q('#finditV3Strip'));
    const actions=q('#finditV3Actions');
    if(actions){
      const first=actions.querySelector('.findit-v3-action:first-child');
      if(first&&/exact web search/i.test(first.textContent||''))remove(first);
      qa('#finditV3Actions [aria-disabled="true"]').forEach(remove);
    }
  }

  function simplifyExactSeller(){
    const exact=q('#exactSellerResults');if(!exact)return;
    exact.querySelector('.premium-insights')?.remove();
    const old=q('#freeActions');if(old&&!old.contains(exact))old.style.display='none';

    qa('#exactSellerResults .offer-card').forEach(card=>{
      if(!card.querySelector('.findit-exact-badge')){
        const badge=document.createElement('span');badge.className='findit-exact-badge';badge.textContent='✓ Exact product match';
        card.prepend(badge);
      }
      if(!card.querySelector('.findit-checked')){
        const stamp=document.createElement('small');stamp.className='findit-checked';stamp.textContent=`Checked ${checkedTime()} • Branch stock only shown when verified`;
        card.appendChild(stamp);
      }
      const link=[...card.querySelectorAll('a')].find(a=>/view exact listing/i.test(a.textContent||''));
      if(link)link.textContent='View retailer →';
    });

    const heading=exact.querySelector('h3');
    if(heading&&/retailer listings found/i.test(heading.textContent||''))heading.textContent='Where you can buy this exact product';
    const expl=[...exact.querySelectorAll('.section-title-row p')].find(p=>/product-page matches/i.test(p.textContent||''));
    if(expl)expl.textContent='Exact or strong product-page matches are shown below. Physical branch directions appear only when that branch has verified stock.';
  }

  function cleanNearby(){
    const panel=q('#nearbyPanel'),nearby=q('#nearbyStores');if(!panel||!nearby)return;
    const stores=Array.isArray(stateSafe()?.stores)?stateSafe().stores:[];
    const cards=qa('#nearbyStores .store-card,#nearbyStores [data-store]');
    const verifiedCards=[];
    cards.forEach(card=>{
      const idx=Number(card.dataset?.store);
      const st=Number.isInteger(idx)?stores[idx]:null;
      const verified=card.dataset?.exactBranch==='1'||exactBranch(st);
      if(verified)verifiedCards.push(card);else remove(card);
    });

    const head=q('#nearbyPanel .nearby-head h3')||q('#nearbyPanel h3');
    const summary=q('#nearbySummary');
    const map=q('#mapViewBtn');
    if(verifiedCards.length){
      panel.classList.remove('findit-no-trip');
      q('#finditNoVerifiedNearby')?.remove();
      if(head)head.textContent='Verified nearby sellers';
      if(summary)summary.textContent='These branches have the exact product and branch stock verified.';
      if(map)map.style.display='';
      verifiedCards.forEach(card=>{
        if(!card.querySelector('.findit-checked')){
          const stamp=document.createElement('small');stamp.className='findit-checked';stamp.textContent=`Branch stock checked ${checkedTime()}`;card.appendChild(stamp);
        }
      });
      return;
    }

    panel.classList.add('findit-no-trip');
    if(head)head.textContent='No verified nearby seller yet';
    if(summary)summary.textContent='FindIt will not suggest a trip until the exact product is verified at a physical branch.';
    if(map)map.style.display='none';
    nearby.innerHTML='';
    const note=document.createElement('div');note.id='finditNoVerifiedNearby';note.className='empty-state';
    note.innerHTML='<strong>No trip suggested yet.</strong><p>Use the exact retailer results above. If FindIt verifies this exact item at a nearby branch, the branch, distance and Directions button will appear here.</p>';
    nearby.appendChild(note);
  }

  function wireUtilityButtons(){
    const clear=q('#clearHistory');if(clear)clear.onclick=()=>{localStorage.removeItem('finditRecent');const grid=q('#recentGrid');if(grid)grid.innerHTML='<p class="muted">Nothing here yet.</p>'};
    const share=q('#shareFind');if(share)share.onclick=async()=>{
      const s=stateSafe(),i=s?.result?.identification||{};const text=['FindIt identified',i.name||i.object||'this item',i.brand,i.model].filter(Boolean).join(' • ');
      try{if(navigator.share)await navigator.share({title:'FindIt Nearby',text,url:location.href});else if(navigator.clipboard){await navigator.clipboard.writeText(text);const st=q('#status');if(st)st.textContent='✓ Find copied to share.'}}catch{}
    };
  }

  function forceVisible(){
    qa('.reveal').forEach(el=>{el.classList.add('visible');el.style.opacity='1';el.style.transform='none';el.style.visibility='visible'});
    qa('main>section,main>.shell,footer').forEach(el=>{if(!el.classList.contains('hidden')){el.style.visibility='visible';if(getComputedStyle(el).opacity==='0')el.style.opacity='1'}});
  }

  function removeEmptyMobilePanels(){
    if(innerWidth>760)return;
    const candidates=qa('main article,main section>div,main .premium-command,main .v10-tools>button,main .free-action-grid>*');
    candidates.forEach(el=>{
      if(el.id||el.closest('#map,#searchOverlay,#challengeModal,#settingsModal,#premiumModal,#assistantPanel'))return;
      const text=(el.textContent||'').replace(/\s+/g,'').trim();
      const hasMedia=!!el.querySelector('img,video,svg,canvas,input,textarea,select');
      const hasAction=!!el.querySelector('a,button');
      if(text||hasMedia||hasAction)return;
      const cs=getComputedStyle(el),r=el.getBoundingClientRect();
      const bordered=parseFloat(cs.borderTopWidth||'0')>0||parseFloat(cs.borderBottomWidth||'0')>0;
      const rounded=parseFloat(cs.borderRadius||'0')>=10;
      if(r.height>=60&&bordered&&rounded)el.classList.add('findit-empty-visual-panel');
    });
  }

  function loadCommercePolish(){
    if(document.querySelector('script[data-findit-commerce-polish]'))return;
    const s=document.createElement('script');s.src='/pricecheck-source.js?v=20260824-mobilefix2';s.defer=true;s.dataset.finditCommercePolish='1';document.head.appendChild(s);
  }
  function clean(){ensureStyle();cleanNavigation();simplifyActions();simplifyExactSeller();cleanNearby();wireUtilityButtons();forceVisible();removeEmptyMobilePanels();loadCommercePolish()}
  function settle(){requestAnimationFrame(clean);setTimeout(clean,250);setTimeout(clean,900);setTimeout(clean,2200)}

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',clean,{once:true});else clean();
  window.addEventListener('load',()=>{forceVisible();removeEmptyMobilePanels();setTimeout(()=>{forceVisible();removeEmptyMobilePanels()},300)});
  document.addEventListener('findit:results-rendered',settle);
})();
(()=>{if(document.querySelector('script[data-findit-quality-fix]'))return;const s=document.createElement('script');s.src='/results-data-quality-fix.js?v=20260824-1';s.defer=true;s.dataset.finditQualityFix='1';document.head.appendChild(s)})();
