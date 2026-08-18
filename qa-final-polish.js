/* Final Premium desktop polish after QA: keep command centre inside viewport and remove decorative bleed. */
(() => {
  if (document.getElementById('finditQaFinalPolish')) return;
  const s=document.createElement('style');s.id='finditQaFinalPolish';s.textContent=`
    body.premium-active #v10CommandCentre:after{display:none!important}
    body.premium-active #v10CommandCentre{box-sizing:border-box!important}
    body.premium-active .v10-top h2{overflow-wrap:normal!important;word-break:normal!important}
    @media(min-width:1101px){
      body.premium-active #v10CommandCentre{width:min(1220px,calc(100vw - 48px))!important;padding:32px!important}
      body.premium-active .v10-top h2{font-size:clamp(48px,5vw,68px)!important;max-width:820px!important}
      body.premium-active .v10-launch{grid-template-columns:2fr 1fr 1fr 1fr!important}
      body.premium-active .v10-tools{grid-template-columns:repeat(5,minmax(0,1fr))!important}
    }
  `;document.head.appendChild(s);
})();
