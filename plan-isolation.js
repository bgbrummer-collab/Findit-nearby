/* FindIt Free / Premium isolation
   Keeps the standard FindIt experience clean and prevents Premium-only tools
   from running outside the Premium workspace. */
(()=>{
  const PREMIUM_ROOTS=['#premiumHome','#v10CommandCentre','#premiumDrawerNav','#premiumWorkspace','#premiumWorkspaceButton','#premiumStatusBadge','#v10UniversalModal','#premiumSavedModal','#premiumCompareModal','#premiumFiltersModal'];
  const PREMIUM_ACTIONS='[data-v10],[data-premium-action],[data-premium-radius],[data-store-sort],[data-pw],#premiumSavedMenu,#premiumCompareMenu,#premiumRadiusMenu,#premiumFiltersMenu,#premiumHistoryMenu,#premiumChallengeMenu,#openSettingsPremium';
  const PREMIUM_FN_NAMES=['v10Collections','v10Watchlist','v10FavouriteStores','v10Stats','v10History','v10ManualSearch','v10ExactMatch','v10Assistant','openTool','premiumRadius','openPremiumWorkspace'];
  let currentMode='free';
  let applying=false;

  function premiumActive(){
    try{return typeof premiumState!=='undefined'&&premiumState.active===true}
    catch{return localStorage.getItem('findit_premium_beta')==='1'}
  }
  function inPremium(){return premiumActive()&&currentMode==='premium'}

  function hidePremiumSurface(el){
    if(!el)return;
    el.classList.add('hidden');
    if(el.matches('.premium-modal,.premium-wow,.premium-tool-modal'))el.setAttribute('aria-hidden','true');
  }

  function applyMode(){
    if(applying)return; applying=true;
    const premium=inPremium();
    document.body.dataset.finditPlan=premium?'premium':'free';
    document.body.classList.toggle('findit-premium-mode',premium);
    document.body.classList.toggle('findit-free-mode',!premium);

    const standardDrawer=document.querySelector('#drawer > nav.drawer-nav:not(#premiumDrawerNav)');
    if(standardDrawer)standardDrawer.style.display=premium?'none':'';
    const premiumDrawer=document.querySelector('#premiumDrawerNav');
    if(premiumDrawer)premiumDrawer.style.display=premium?'':'none';

    for(const sel of PREMIUM_ROOTS){
      const el=document.querySelector(sel); if(!el)continue;
      if(premium){
        if(['#premiumHome','#v10CommandCentre','#premiumWorkspaceButton','#premiumStatusBadge'].includes(sel))el.classList.remove('hidden');
      }else hidePremiumSurface(el);
    }

    // Premium-only controls must not leak into ordinary result cards.
    document.querySelectorAll('.premium-compare-check').forEach(el=>{el.style.display=premium?'':'none'});
    document.querySelectorAll('[data-premium-option]').forEach(o=>{o.disabled=!premium});

    // Saved favourites are a Premium feature. Share remains available in Free.
    const save=document.querySelector('#saveFind'); if(save)save.style.display=premium?'':'none';

    const pbtn=document.querySelector('#premiumButton');
    if(pbtn)pbtn.textContent=premium?'← FindIt':'★ Premium';
    const badge=document.querySelector('#premiumStatusBadge');
    if(badge&&premium)badge.classList.remove('hidden');
    applying=false;
  }

  function enterPremium(){
    if(!premiumActive()){
      try{if(typeof openPremium==='function')openPremium()}catch{}
      return false;
    }
    currentMode='premium';
    applyMode();
    try{if(typeof updatePremiumDashboard==='function')updatePremiumDashboard()}catch{}
    try{if(typeof v10Refresh==='function')v10Refresh()}catch{}
    document.querySelector('#v10CommandCentre,#premiumHome')?.scrollIntoView({behavior:'auto',block:'start'});
    return true;
  }
  function enterFree(){
    currentMode='free';
    applyMode();
    document.querySelector('#home')?.scrollIntoView({behavior:'auto',block:'start'});
  }
  window.finditEnterPremium=enterPremium;
  window.finditEnterFree=enterFree;
  window.finditIsPremiumContext=inPremium;

  // Gate Premium actions before older click handlers can run.
  document.addEventListener('click',e=>{
    const premiumButton=e.target.closest?.('#premiumButton');
    if(premiumButton){
      if(inPremium()){e.preventDefault();e.stopImmediatePropagation();enterFree();return}
      if(premiumActive()){e.preventDefault();e.stopImmediatePropagation();enterPremium();return}
      return; // allow the existing upgrade modal for Free users
    }
    const drawerPremium=e.target.closest?.('#drawerPremium');
    if(drawerPremium&&premiumActive()){
      e.preventDefault();e.stopImmediatePropagation();enterPremium();
      try{if(typeof closeDrawer==='function')closeDrawer()}catch{}
      return;
    }
    const premiumAction=e.target.closest?.(PREMIUM_ACTIONS);
    if(!premiumAction)return;
    if(!premiumActive()){
      e.preventDefault();e.stopImmediatePropagation();
      try{if(typeof openPremium==='function')openPremium()}catch{}
      return;
    }
    if(!inPremium()){
      e.preventDefault();e.stopImmediatePropagation();enterPremium();
    }
  },true);

  // Standard FindIt is always capped to the Free radius, even for a Premium
  // account, until the user explicitly enters the Premium workspace.
  document.addEventListener('change',e=>{
    const s=e.target.closest?.('#radiusSelect,#settingsRadius');
    if(!s)return;
    if(!inPremium()&&Number(s.value)>10){
      e.preventDefault();e.stopImmediatePropagation();s.value='10';
      try{if(typeof setRadius==='function')setRadius(10)}catch{}
    }
  },true);

  // Add logic-level guards around the main Premium entry points as a second
  // layer, not just visual hiding.
  function installFunctionGuards(){
    PREMIUM_FN_NAMES.forEach(name=>{
      const original=window[name];
      if(typeof original!=='function'||original.__finditPlanGuard)return;
      const wrapped=function(...args){
        if(!premiumActive()){
          try{if(typeof openPremium==='function')openPremium()}catch{}
          return;
        }
        if(!inPremium()){enterPremium();return;}
        return original.apply(this,args);
      };
      wrapped.__finditPlanGuard=true; wrapped.__finditOriginal=original;
      try{window[name]=wrapped}catch{}
    });
  }

  document.addEventListener('DOMContentLoaded',()=>{
    currentMode='free';
    installFunctionGuards();
    applyMode();
    // Keep isolation intact if legacy UI code tries to reveal Premium widgets.
    const mo=new MutationObserver(()=>applyMode());
    mo.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','style']});
  });
})();
