(() => {
  const BETA_KEY = 'findit_premium_beta';
  const qs = (s) => document.querySelector(s);
  const isActive = () => localStorage.getItem(BETA_KEY) === '1';

  const FREE_FEATURES = [
    'AI photo identification','Nearby retailer results','Directions & map','Up to 10 km search radius',
    'Basic recent finds','Search exact item online','Search retailer type near you','Copy product name','Share this find'
  ];
  const PREMIUM_FEATURES = [
    'Up to 25 km search radius','Saved Items','Collections','Watchlist','Favourite Stores','Compare Stores',
    'Smart store filters','History+ (up to 50 finds)','Manual product search','Exact Match search','AI retailer search',
    'Premium stats & workspace'
  ];

  function openPremiumModal(){
    const m=qs('#premiumModal');
    m?.classList.remove('hidden');
    m?.setAttribute('aria-hidden','false');
  }
  function closePremiumModal(){
    const m=qs('#premiumModal');
    m?.classList.add('hidden');
    m?.setAttribute('aria-hidden','true');
  }
  function setText(el,text){ if(el && el.textContent!==text) el.textContent=text; }
  function setHtml(el,html){ if(el && el.innerHTML!==html) el.innerHTML=html; }

  function setRadiusLimit(active){
    try{
      const limit=active?25:10;
      const current=Math.min(limit,Number(localStorage.getItem('finditRadius')||10));
      localStorage.setItem('finditRadius',String(current));
      if(typeof state!=='undefined') state.radius=Math.min(limit,Number(state.radius||current));
      const radius=qs('#radiusSelect'),settings=qs('#settingsRadius');
      if(radius&&Number(radius.value)>limit) radius.value=String(limit);
      if(settings&&Number(settings.value)>limit) settings.value=String(limit);
    }catch{}
  }

  function updatePlanCopy(active){
    const cards=document.querySelectorAll('#premiumModal .premium-plan-card');
    const freeCard=cards[0],premiumCard=qs('#premiumModal .premium-plan-card.premium');
    if(freeCard) setHtml(freeCard.querySelector('ul'),FREE_FEATURES.map(x=>`<li>${x}</li>`).join(''));
    if(premiumCard){
      setHtml(premiumCard.querySelector('ul'),PREMIUM_FEATURES.map(x=>`<li>${x}</li>`).join(''));
      setText(premiumCard.querySelector('small'),'Free during Premium Beta testing. Real payments are disabled.');
    }
    setText(qs('#premiumModal .premium-kicker'),'FINDIT PREMIUM BETA');
    setText(qs('#premiumModal .premium-card > p'),'Premium Beta is free while FindIt is being tested. Premium-only tools are separated from the Free plan.');
    setText(qs('#activatePremiumTester'),active?'Premium Beta active ✓':'Activate Premium Beta — Free');

    let switchBtn=qs('#finditReturnFree');
    if(active&&premiumCard&&!switchBtn){
      switchBtn=document.createElement('button');
      switchBtn.id='finditReturnFree';switchBtn.type='button';switchBtn.textContent='Return to Free for testing';switchBtn.style.marginTop='10px';
      switchBtn.addEventListener('click',(e)=>{e.preventDefault();e.stopImmediatePropagation();apply(false,true)},true);
      premiumCard.appendChild(switchBtn);
    }
    if(!active) switchBtn?.remove();
  }

  function updatePremiumVisibility(active){
    if(typeof premiumState!=='undefined') premiumState.active=active;
    document.body.classList.toggle('premium-active',active);
    document.body.classList.toggle('premium-v10',active);
    qs('#premiumStatusBadge')?.classList.toggle('hidden',!active);
    qs('#premiumWorkspaceButton')?.classList.toggle('hidden',!active);
    qs('#premiumHome')?.classList.toggle('hidden',!active);
    qs('#v10CommandCentre')?.classList.toggle('hidden',!active);
    const drawer=qs('#premiumDrawerNav');if(drawer) drawer.style.display=active?'':'none';
    if(typeof refreshPremiumUI==='function') refreshPremiumUI();
    if(typeof updatePremiumDashboard==='function') updatePremiumDashboard();
    if(typeof v10Refresh==='function'&&active) v10Refresh();
  }

  function lockFreeOnlyDuplicates(){
    // Share remains a Free feature, so remove the duplicate Premium V10 tile.
    qs('#v10CommandCentre [data-v10="share"]')?.remove();
    const save=qs('#saveFind');
    if(!save) return;
    if(!save.dataset.premiumGate){
      save.dataset.premiumGate='1';
      save.addEventListener('click',(e)=>{
        if(isActive()) return;
        e.preventDefault();e.stopImmediatePropagation();openPremiumModal();
      },true);
    }
    const label=isActive()?'♡ Save':'♡ Save ★';
    if(save.textContent!==label) save.textContent=label;
    save.title=isActive()?'Save this Find':'Premium feature';
  }

  function runV10(action){
    if(typeof premiumState!=='undefined') premiumState.active=true;
    if(action==='scan'){qs('#finder')?.scrollIntoView({behavior:'smooth',block:'start'});return;}
    if(action==='manual'&&typeof v10Manual==='function') return v10Manual();
    if(action==='exact'&&typeof v10Exact==='function') return v10Exact();
    if(action==='assistant'&&typeof v10Assistant==='function') return v10Assistant();
    if(action==='collections'&&typeof v10Collections==='function') return v10Collections();
    if(action==='watchlist'&&typeof v10Watchlist==='function') return v10Watchlist();
    if(action==='favourites'&&typeof v10FavouriteStores==='function') return v10FavouriteStores();
    if(action==='stats'&&typeof v10Stats==='function') return v10Stats();
    if(action==='history'&&typeof v10History==='function') return v10History();
    if(typeof v10Handle==='function') return v10Handle(action);
  }

  function runPremiumAction(action){
    if(typeof premiumState!=='undefined') premiumState.active=true;
    if(typeof premiumAction==='function') return premiumAction(action);
  }

  function runWorkspace(action){
    if(typeof premiumState!=='undefined') premiumState.active=true;
    if(typeof closePremiumWorkspace==='function') closePremiumWorkspace();
    if(action==='saved'&&typeof openTool==='function') return openTool('saved');
    if(action==='compare'&&typeof openTool==='function') return openTool('compare');
    if(action==='filters'&&typeof openTool==='function') return openTool('filters');
    if(action==='history'){qs('#recent')?.scrollIntoView({behavior:'smooth',block:'start'});return;}
    if(action==='challenge'){qs('#challengeBtn')?.click();return;}
    if(action==='map'){qs('#results')?.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>qs('#mapViewBtn')?.click(),200);return;}
    if(action==='find'){qs('#finder')?.scrollIntoView({behavior:'smooth',block:'start'});return;}
    if(action==='radius'){qs('#premiumHome')?.scrollIntoView({behavior:'smooth',block:'start'});return;}
  }

  function gatePremiumControls(){
    document.querySelectorAll('[data-v10]').forEach(el=>{
      if(el.dataset.finditGate==='v2') return;
      el.dataset.finditGate='v2';
      el.addEventListener('click',(e)=>{
        e.preventDefault();e.stopImmediatePropagation();
        if(!isActive()) return openPremiumModal();
        closePremiumModal();
        runV10(el.dataset.v10);
      },true);
    });

    document.querySelectorAll('[data-premium-action]').forEach(el=>{
      if(el.dataset.finditGate==='v2') return;
      el.dataset.finditGate='v2';
      el.addEventListener('click',(e)=>{
        e.preventDefault();e.stopImmediatePropagation();
        if(!isActive()) return openPremiumModal();
        closePremiumModal();runPremiumAction(el.dataset.premiumAction);
      },true);
    });

    document.querySelectorAll('[data-premium-radius]').forEach(el=>{
      if(el.dataset.finditGate==='v2') return;
      el.dataset.finditGate='v2';
      el.addEventListener('click',(e)=>{
        e.preventDefault();e.stopImmediatePropagation();
        if(!isActive()) return openPremiumModal();
        if(typeof premiumState!=='undefined') premiumState.active=true;
        if(typeof premiumRadius==='function') premiumRadius(el.dataset.premiumRadius);
      },true);
    });

    document.querySelectorAll('[data-store-sort]').forEach(el=>{
      if(el.dataset.finditGate==='v2') return;
      el.dataset.finditGate='v2';
      el.addEventListener('click',(e)=>{
        e.preventDefault();e.stopImmediatePropagation();
        if(!isActive()) return openPremiumModal();
        if(typeof premiumState!=='undefined') premiumState.active=true;
        if(typeof applyPremiumStoreSort==='function') applyPremiumStoreSort(el.dataset.storeSort);
      },true);
    });

    document.querySelectorAll('[data-pw]').forEach(el=>{
      if(el.dataset.finditGate==='v2') return;
      el.dataset.finditGate='v2';
      el.addEventListener('click',(e)=>{
        e.preventDefault();e.stopImmediatePropagation();
        if(!isActive()) return openPremiumModal();
        closePremiumModal();runWorkspace(el.dataset.pw);
      },true);
    });
  }

  function repairWidenSearch(){
    const w=qs('#widenSearch');
    if(!w||w.dataset.finditPremiumWiden==='1') return;
    w.dataset.finditPremiumWiden='1';
    w.addEventListener('click',(e)=>{
      if(isActive()) return;
      e.preventDefault();e.stopImmediatePropagation();openPremiumModal();
    },true);
  }

  function auditUI(){updatePlanCopy(isActive());lockFreeOnlyDuplicates();gatePremiumControls();repairWidenSearch();}

  function apply(active,showMessage=false){
    if(active) localStorage.setItem(BETA_KEY,'1'); else localStorage.removeItem(BETA_KEY);
    setRadiusLimit(active);updatePremiumVisibility(active);auditUI();
    if(showMessage){
      if(active){
        const wow=qs('#premiumWow');wow?.classList.remove('hidden');setTimeout(()=>wow?.classList.add('hidden'),1800);
        closePremiumModal();setTimeout(()=>qs('#v10CommandCentre')?.scrollIntoView({block:'start'}),150);
      }else{closePremiumModal();window.scrollTo(0,0);}
    }
  }

  function wireActivation(){
    const b=qs('#activatePremiumTester');
    if(!b||b.dataset.betaFreeWired==='2') return;
    b.dataset.betaFreeWired='2';
    b.addEventListener('click',(e)=>{
      e.preventDefault();e.stopImmediatePropagation();
      if(!isActive()) apply(true,true); else closePremiumModal();
    },true);
  }

  function init(){
    apply(isActive(),false);wireActivation();auditUI();
    document.addEventListener('findit:results-rendered',auditUI);
    setTimeout(auditUI,350);setTimeout(auditUI,1200);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
  window.addEventListener('pageshow',()=>apply(isActive(),false));
})();
