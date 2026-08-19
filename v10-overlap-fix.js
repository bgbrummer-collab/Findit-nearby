(()=>{
  if(document.getElementById('finditV10OverlapFix'))return;
  const s=document.createElement('style');
  s.id='finditV10OverlapFix';
  s.textContent=`
    #v10CommandCentre .v10-launch button,
    #v10CommandCentre .v10-tools button{
      position:relative!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:flex-start!important;
      justify-content:flex-start!important;
      gap:8px!important;
      min-height:138px!important;
      padding:18px!important;
      overflow:visible!important;
      text-align:left!important;
      white-space:normal!important;
    }
    #v10CommandCentre .v10-launch button>span,
    #v10CommandCentre .v10-tools button>span{
      display:flex!important;
      flex-direction:column!important;
      gap:3px!important;
      min-width:0!important;
      width:100%!important;
      position:static!important;
      transform:none!important;
    }
    #v10CommandCentre .v10-launch button b,
    #v10CommandCentre .v10-tools button b{
      display:block!important;
      margin:0!important;
      line-height:1.25!important;
      white-space:normal!important;
      position:static!important;
    }
    #v10CommandCentre .v10-launch button small,
    #v10CommandCentre .v10-tools button small{
      display:block!important;
      margin:0!important;
      line-height:1.45!important;
      white-space:normal!important;
      overflow-wrap:anywhere!important;
      position:static!important;
    }
    #v10CommandCentre .v10-how{
      display:block!important;
      width:100%!important;
      min-width:0!important;
      margin:8px 0 0!important;
      padding:10px 0 0!important;
      border-top:1px solid rgba(255,255,255,.08)!important;
      font-size:10px!important;
      line-height:1.45!important;
      white-space:normal!important;
      overflow-wrap:anywhere!important;
      position:static!important;
      transform:none!important;
    }
    #v10CommandCentre .v10-how b{display:inline!important;margin:0!important;font-size:inherit!important;line-height:inherit!important}

    #premiumExperience{padding-bottom:0!important;margin-bottom:18px!important}
    #premiumExperience .px-grid,
    #premiumExperience .px-flow,
    #premiumExperience .px-strip{align-items:stretch!important}
    #premiumExperience .px-card,
    #premiumExperience .px-flow article,
    #premiumExperience .px-strip>div{
      height:auto!important;
      overflow:visible!important;
      min-width:0!important;
    }
    #premiumExperience .px-card{display:flex!important;flex-direction:column!important;justify-content:flex-start!important}
    #premiumExperience .px-card p{margin-bottom:0!important}
    #premiumExperience .px-badge{margin-top:auto!important;align-self:flex-start!important}
    #premiumExperience .px-flow article{display:flex!important;flex-direction:column!important;gap:5px!important}
    #premiumExperience .px-flow b,#premiumExperience .px-flow small{position:static!important;transform:none!important;white-space:normal!important;overflow-wrap:anywhere!important}

    #finditPremiumGuide{width:min(1260px,calc(100% - 28px));margin:0 auto 34px;padding:22px;border:1px solid rgba(124,142,192,.22);border-radius:24px;background:linear-gradient(145deg,rgba(14,22,49,.9),rgba(7,13,31,.94))}
    #finditPremiumGuide h3{margin:0 0 8px;font-size:22px}
    #finditPremiumGuide>p{margin:0 0 16px;color:#93a4c6;font-size:12px;line-height:1.6}
    .findit-premium-guide-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
    .findit-premium-guide-grid article{padding:16px;border:1px solid rgba(124,142,192,.18);border-radius:16px;background:rgba(10,17,39,.72)}
    .findit-premium-guide-grid b{display:block;font-size:13px;margin-bottom:6px}
    .findit-premium-guide-grid small{display:block;color:#8798bb;font-size:10px;line-height:1.5}

    @media(max-width:900px){
      #v10CommandCentre .v10-launch button,#v10CommandCentre .v10-tools button{min-height:0!important}
      .findit-premium-guide-grid{grid-template-columns:1fr 1fr}
    }
    @media(max-width:600px){
      #v10CommandCentre .v10-launch button,#v10CommandCentre .v10-tools button{padding:16px!important}
      #premiumExperience .px-card{min-height:0!important}
      #finditPremiumGuide{width:calc(100% - 20px);padding:18px}
      .findit-premium-guide-grid{grid-template-columns:1fr}
    }
  `;
  document.head.appendChild(s);

  function addGuide(){
    const px=document.getElementById('premiumExperience');
    if(!px||document.getElementById('finditPremiumGuide'))return;
    const guide=document.createElement('section');
    guide.id='finditPremiumGuide';
    guide.innerHTML=`<h3>How to use Premium</h3><p>Start with a search, then use the Premium tools to compare, save and monitor the item.</p><div class="findit-premium-guide-grid"><article><b>1. Identify</b><small>Upload a photo or use Manual Search to name the product.</small></article><article><b>2. Compare</b><small>Check nearby retailers, Exact Match and store sorting.</small></article><article><b>3. Save</b><small>Add useful finds to Collections, Saved Items or Favourite Stores.</small></article><article><b>4. Watch</b><small>Add the product to Watchlist and use Check now for price or stock updates.</small></article></div>`;
    px.insertAdjacentElement('afterend',guide);
  }
  const sync=()=>{if(document.body.classList.contains('premium-active'))addGuide()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(sync,50),{once:true});else setTimeout(sync,50);
  window.addEventListener('pageshow',()=>setTimeout(sync,100));
  new MutationObserver(()=>setTimeout(sync,0)).observe(document.body,{childList:true,subtree:true});
})();