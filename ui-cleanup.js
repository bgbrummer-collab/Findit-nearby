/* FindIt UI cleanup: keep one working path per feature and remove obsolete/dead duplicates. */
(()=>{
  const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
  function remove(el){if(el&&el.parentNode)el.parentNode.removeChild(el)}
  function clean(){
    // V10 is the active Premium workspace. Remove the older duplicate Premium home panel.
    if(q('#v10CommandCentre')) remove(q('#premiumHome'));

    // Remove duplicate/obsolete Premium drawer entries that point to the same places or do nothing.
    qa('#premiumDrawerNav a[href="#premiumHome"], #premiumDrawerNav a[href="#finder"], #premiumDrawerNav .premium-coming, #premiumDrawerNav a[href="#feedback"]').forEach(remove);

    // Remove result actions that are duplicated elsewhere or are not part of the current exact-product flow.
    remove(q('#widenSearch'));

    // The exact-seller section already owns seller/offer/price/radius stats. Never show a second copy.
    if(q('#exactSellerResults')) remove(q('#finditV3Strip'));

    // Trust-first nearby policy: do not encourage a trip to a shop unless this exact product AND branch stock are verified.
    const nearby=q('#nearbyStores');
    if(nearby){
      const cards=qa('#nearbyStores .store-card, #nearbyStores [data-store]');
      const verified=cards.filter(card=>card.dataset?.exactBranch==='1');
      cards.filter(card=>card.dataset?.exactBranch!=='1').forEach(remove);
      const head=q('#nearbyPanel .nearby-head h3')||q('#nearbyPanel h3');
      const summary=q('#nearbySummary');
      if(cards.length && verified.length===0){
        if(head) head.textContent='No verified nearby seller yet';
        if(summary) summary.textContent='FindIt found nearby retailers for this product type, but none have verified this exact item at a branch. We will not suggest driving there until exact branch stock is verified.';
        if(!q('#finditNoVerifiedNearby')){
          const note=document.createElement('div');
          note.id='finditNoVerifiedNearby';
          note.className='empty-state';
          note.innerHTML='<strong>No trip suggested yet.</strong><p>Use the exact-product seller links above. Nearby directions will appear only when FindIt can verify the exact item at that branch.</p>';
          nearby.appendChild(note);
        }
        const map=q('#mapViewBtn'); if(map) map.style.display='none';
      }else if(verified.length){
        q('#finditNoVerifiedNearby')?.remove();
        if(head) head.textContent='Verified nearby sellers';
        if(summary) summary.textContent='These branches have the exact product and branch stock verified.';
        const map=q('#mapViewBtn'); if(map) map.style.display='';
      }else if(cards.length===0){
        q('#finditNoVerifiedNearby')?.remove();
      }
    }

    // Keep one Recent clear control and wire it to the current recent list.
    const clear=q('#clearHistory');
    if(clear){
      clear.onclick=()=>{
        localStorage.removeItem('finditRecent');
        const grid=q('#recentGrid'); if(grid) grid.innerHTML='<p class="muted">Nothing here yet.</p>';
      };
    }

    // Make Share work on the current result without relying on removed legacy UI.
    const share=q('#shareFind');
    if(share){
      share.onclick=async()=>{
        const s=(()=>{try{return state}catch{return null}})();
        const i=s?.result?.identification||{};
        const text=['FindIt identified',i.name||i.object||'this item',i.brand,i.model].filter(Boolean).join(' • ');
        try{
          if(navigator.share) await navigator.share({title:'FindIt Nearby',text,url:location.href});
          else if(navigator.clipboard){await navigator.clipboard.writeText(text); const st=q('#status'); if(st)st.textContent='✓ Find copied to share.';}
        }catch(e){}
      };
    }

    // Do not show duplicate retailer action blocks if exact seller results are already present.
    const exact=q('#exactSellerResults');
    if(exact){
      const old=q('#freeActions');
      if(old && !old.querySelector('#exactSellerResults')) old.style.display='none';
    }

    // Remove any visible control that is explicitly disabled/coming-soon from active navigation.
    qa('button[disabled].premium-coming').forEach(remove);
  }

  // Run once on load, and once after a completed FindIt result.
  // Do NOT observe the result DOM: cleanup changes the DOM itself and an observer here
  // can recursively schedule more cleanup, causing layout/scroll jumping.
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',clean,{once:true});else clean();
  document.addEventListener('findit:results-rendered',()=>requestAnimationFrame(clean));
})();
