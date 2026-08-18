(() => {
  const BETA_KEY = 'findit_premium_beta';
  const qs = (s) => document.querySelector(s);
  const isActive = () => localStorage.getItem(BETA_KEY) === '1';
  const FREE_FEATURES = ['AI photo identification','Nearby retailer results','Directions & map','Up to 10 km search radius','Basic recent finds','Search exact item online','Search retailer type near you','Copy product name','Share this find'];
  const PREMIUM_FEATURES = ['Up to 25 km search radius','Saved Items','Collections','Watchlist','Favourite Stores','Compare Stores','Smart store filters','History+ (up to 50 finds)','Manual product search','Exact Match search','AI retailer search','Premium stats & workspace'];

  function openPremiumModal(){const m=qs('#premiumModal');m?.classList.remove('hidden');m?.setAttribute('aria-hidden','false')}
  function setText(el,text){if(el&&el.textContent!==text)el.textContent=text}
  function setHtml(el,html){if(el&&el.innerHTML!==html)el.innerHTML=html}

  function setRadiusLimit(active){
    try{
      const limit=active?25:10;
      const current=Math.min(limit,Number(localStorage.getItem('finditRadius')||10));
      localStorage.setItem('finditRadius',String(current));
      if(typeof state!=='undefined')state.radius=Math.min(limit,Number(state.radius||current));
      const radius=qs('#radiusSelect'),settings=qs('#settingsRadius');
      if(radius&&Number(radius.value)>limit)radius.value=String(limit);
      if(settings&&Number(settings.value)>limit)settings.value=String(limit);
    }catch{}
  }

  function updatePlanCopy(active){
    const cards=document.querySelectorAll('#premiumModal .premium-plan-card');
    const freeCard=cards[0],premiumCard=qs('#premiumModal .premium-plan-card.premium');
    if(freeCard)setHtml(freeCard.querySelector('ul'),FREE_FEATURES.map(x=>`<li>${x}</li>`).join(''));
    if(premiumCard){
      setHtml(premiumCard.querySelector('ul'),PREMIUM_FEATURES.map(x=>`<li>${x}</li>`).join(''));
      setText(premiumCard.querySelector('small'),'Free during Premium Beta testing. Real payments are disabled.');
    }
    setText(qs('#premiumModal .premium-kicker'),'FINDIT PREMIUM BETA');
    setText(qs('#premiumModal .premium-card > p'),'Premium Beta is free while FindIt is being tested. Premium-only tools are separated from the Free plan.');
    setText(qs('#activatePremiumTester'),active?'Premium Beta active ✓':'Activate Premium Beta — Free');
    let switchBtn=qs('#finditReturnFree');
    if(active&&premiumCard&&!switchBtn){
      switchBtn=document.createElement('button');switchBtn.id='finditReturnFree';switchBtn.type='button';switchBtn.textContent='Return to Free for testing';switchBtn.style.marginTop='10px';
      switchBtn.onclick=(e)=>{e.preventDefault();localStorage.removeItem(BETA_KEY);apply(false,true)};
      premiumCard.appendChild(switchBtn);
    }
    if(!active)switchBtn?.remove();
  }

  function updatePremiumVisibility(active){
    if(typeof premiumState!=='undefined')premiumState.active=active;
    document.body.classList.toggle('premium-active',active);document.body.classList.toggle('premium-v10',active);
    qs('#premiumStatusBadge')?.classList.toggle('hidden',!active);qs('#premiumWorkspaceButton')?.classList.toggle('hidden',!active);qs('#premiumHome')?.classList.toggle('hidden',!active);qs('#v10CommandCentre')?.classList.toggle('hidden',!active);
    const drawer=qs('#premiumDrawerNav');if(drawer)drawer.style.display=active?'':'none';
    if(typeof refreshPremiumUI==='function')refreshPremiumUI();if(typeof updatePremiumDashboard==='function')updatePremiumDashboard();if(typeof v10Refresh==='function'&&active)v10Refresh();
  }

  function lockFreeOnlyDuplicates(){
    qs('#v10CommandCentre [data-v10="share"]')?.remove();
    const save=qs('#saveFind');if(!save)return;
    if(!save.dataset.premiumGate){save.dataset.premiumGate='1';save.addEventListener('click',(e)=>{if(isActive())return;e.preventDefault();e.stopImmediatePropagation();openPremiumModal()},true)}
    const label=isActive()?'♡ Save':'♡ Save ★',title=isActive()?'Save this Find':'Premium feature';
    if(save.textContent!==label)save.textContent=label;if(save.title!==title)save.title=title;
  }

  function gatePremiumControls(){
    document.querySelectorAll('[data-premium-radius],[data-store-sort],[data-premium-action],[data-v10],[data-pw]').forEach(el=>{
      if(el.dataset.finditGate==='1')return;el.dataset.finditGate='1';
      el.addEventListener('click',(e)=>{if(isActive())return;const basic=el.matches('[data-premium-action="find"],[data-premium-action="map"],[data-v10="scan"],[data-pw="find"],[data-pw="map"]');if(basic)return;e.preventDefault();e.stopImmediatePropagation();openPremiumModal()},true);
    });
  }

  function repairWidenSearch(){const w=qs('#widenSearch');if(!w||w.dataset.finditPremiumWiden==='1')return;w.dataset.finditPremiumWiden='1';w.addEventListener('click',(e)=>{if(isActive())return;e.preventDefault();e.stopImmediatePropagation();openPremiumModal()},true)}
  function auditUI(){updatePlanCopy(isActive());lockFreeOnlyDuplicates();gatePremiumControls();repairWidenSearch()}

  function apply(active,showMessage=false){
    if(active)localStorage.setItem(BETA_KEY,'1');else localStorage.removeItem(BETA_KEY);
    setRadiusLimit(active);updatePremiumVisibility(active);auditUI();
    if(showMessage){
      if(active){const wow=qs('#premiumWow');wow?.classList.remove('hidden');setTimeout(()=>wow?.classList.add('hidden'),1800);qs('#premiumModal')?.classList.add('hidden');setTimeout(()=>qs('#v10CommandCentre')?.scrollIntoView({block:'start'}),150)}
      else{qs('#premiumModal')?.classList.add('hidden');window.scrollTo(0,0)}
    }
  }

  function wireActivation(){const b=qs('#activatePremiumTester');if(!b||b.dataset.betaFreeWired==='1')return;b.dataset.betaFreeWired='1';b.addEventListener('click',(e)=>{e.preventDefault();e.stopImmediatePropagation();if(!isActive())apply(true,true)},true)}

  function init(){apply(isActive(),false);wireActivation();auditUI();
    // Important: do NOT observe the full results subtree. The previous observer rewrote elements in response to its own mutations and could peg mobile CPU / freeze scrolling.
    document.addEventListener('findit:results-rendered',auditUI);
    setTimeout(auditUI,400);setTimeout(auditUI,1400);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('pageshow',()=>apply(isActive(),false));
})();
