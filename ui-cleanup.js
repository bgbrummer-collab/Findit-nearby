/* FindIt critical UI cleanup. Intentionally network-free so initial page load can finish. */
(()=>{
  'use strict';
  const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
  const remove=el=>{if(el?.parentNode)el.parentNode.removeChild(el)};

  function ensureStyle(){
    if(q('#finditTrustUiStyle'))return;
    const s=document.createElement('style');
    s.id='finditTrustUiStyle';
    s.textContent=`
      .reveal{opacity:1!important;transform:none!important;visibility:visible!important}
      #finditV3Strip{display:none!important}
      #finditV3Actions [aria-disabled="true"]{display:none!important}
      @media(max-width:760px){
        main,main>section,main>.shell,footer{opacity:1!important;visibility:visible!important}
        .shell{min-height:0!important}
        .steps-grid article,.example-card,.challenge-banner,.search-card,.examples-section{opacity:1!important;visibility:visible!important;transform:none!important}
      }
    `;
    document.head.appendChild(s);
  }

  function clean(){
    ensureStyle();
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

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',clean,{once:true});
  else clean();
  document.addEventListener('findit:results-rendered',()=>{
    requestAnimationFrame(clean);
    setTimeout(clean,250);
  });
})();
