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
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',clean,{once:true});else clean();
  document.addEventListener('findit:results-rendered',()=>setTimeout(clean,0));
})();
