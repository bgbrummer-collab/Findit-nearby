(() => {
  const KEY='findit_premium_beta';
  const $=s=>document.querySelector(s);
  const active=()=>localStorage.getItem(KEY)==='1';
  const FREE=['AI photo identification','Nearby retailer results','Directions & map','Up to 10 km search radius','Basic recent finds','Search exact item online','Search retailer type near you','Copy product name','Share this find'];
  const PREMIUM=['Up to 25 km search radius','Saved Items','Collections','Watchlist','Favourite Stores','Compare Stores','Smart store filters','History+ (up to 50 finds)','Manual product search','Exact Match search','AI retailer search','Premium stats & workspace'];

  function modal(show){const m=$('#premiumModal');if(!m)return;m.classList.toggle('hidden',!show);m.setAttribute('aria-hidden',show?'false':'true')}
  function syncState(){const on=active();if(typeof premiumState!=='undefined')premiumState.active=on;document.body.classList.toggle('premium-active',on);document.body.classList.toggle('premium-v10',on);$('#premiumStatusBadge')?.classList.toggle('hidden',!on);$('#premiumWorkspaceButton')?.classList.toggle('hidden',!on);$('#premiumHome')?.classList.toggle('hidden',!on);$('#v10CommandCentre')?.classList.toggle('hidden',!on);const drawer=$('#premiumDrawerNav');if(drawer)drawer.style.display=on?'':'none';const limit=on?25:10;try{if(typeof state!=='undefined'&&Number(state.radius)>limit)state.radius=limit;const stored=Math.min(limit,Number(localStorage.getItem('finditRadius')||10));localStorage.setItem('finditRadius',String(stored));['#radiusSelect','#settingsRadius'].forEach(s=>{const el=$(s);if(el&&Number(el.value)>limit)el.value=String(limit)})}catch{} }

  function updateCopy(){const cards=document.querySelectorAll('#premiumModal .premium-plan-card');if(cards[0])cards[0].querySelector('ul').innerHTML=FREE.map(x=>`<li>${x}</li>`).join('');const pc=$('#premiumModal .premium-plan-card.premium');if(pc){pc.querySelector('ul').innerHTML=PREMIUM.map(x=>`<li>${x}</li>`).join('');const small=pc.querySelector('small');if(small)small.textContent='Free during Premium Beta testing. Real payments are disabled.'}const p=$('#premiumModal .premium-card > p');if(p)p.textContent='Premium Beta is free while FindIt is being tested. Premium-only tools are separated from the Free plan.';const b=$('#activatePremiumTester');if(b)b.textContent=active()?'Premium Beta active ✓':'Activate Premium Beta — Free';let back=$('#finditReturnFree');if(active()&&pc&&!back){back=document.createElement('button');back.id='finditReturnFree';back.type='button';back.textContent='Return to Free for testing';back.style.marginTop='10px';back.onclick=e=>{e.preventDefault();localStorage.removeItem(KEY);syncAll();modal(false);window.scrollTo(0,0)};pc.appendChild(back)}if(!active())back?.remove();$('#v10CommandCentre [data-v10="share"]')?.remove();const save=$('#saveFind');if(save){save.textContent=active()?'♡ Save':'♡ Save ★';save.title=active()?'Save this Find':'Premium feature'}}

  function ensurePremiumRuntime(){if(typeof premiumState!=='undefined')premiumState.active=true;document.body.classList.add('premium-active','premium-v10')}
  function runV10(a){ensurePremiumRuntime();if(a==='scan')return $('#finder')?.scrollIntoView({behavior:'smooth',block:'start'});if(a==='manual'&&typeof v10Manual==='function')return v10Manual();if(a==='exact'&&typeof v10Exact==='function')return v10Exact();if(a==='assistant'&&typeof v10Assistant==='function')return v10Assistant();if(a==='collections'&&typeof v10Collections==='function')return v10Collections();if(a==='watchlist'&&typeof v10Watchlist==='function')return v10Watchlist();if(a==='favourites'&&typeof v10FavouriteStores==='function')return v10FavouriteStores();if(a==='stats'&&typeof v10Stats==='function')return v10Stats();if(a==='history'&&typeof v10History==='function')return v10History();if(typeof v10Handle==='function')return v10Handle(a)}
  function runAction(a){ensurePremiumRuntime();if(a==='find')return $('#finder')?.scrollIntoView({behavior:'smooth',block:'start'});if(a==='saved'&&typeof openTool==='function')return openTool('saved');if(a==='compare'&&typeof openTool==='function')return openTool('compare');if(a==='map'){const r=$('#results');if(r&&!r.classList.contains('hidden')){r.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>$('#mapViewBtn')?.click(),180)}else $('#finder')?.scrollIntoView({behavior:'smooth'});return}if(typeof premiumAction==='function')return premiumAction(a)}
  function runWorkspace(a){ensurePremiumRuntime();if(typeof closePremiumWorkspace==='function')closePremiumWorkspace();if(a==='saved'&&typeof openTool==='function')return openTool('saved');if(a==='compare'&&typeof openTool==='function')return openTool('compare');if(a==='filters'&&typeof openTool==='function')return openTool('filters');if(a==='history')return $('#recent')?.scrollIntoView({behavior:'smooth'});if(a==='challenge')return $('#challengeBtn')?.click();if(a==='map')return runAction('map');if(a==='find')return runAction('find');if(a==='radius')return $('#premiumHome')?.scrollIntoView({behavior:'smooth'});}

  function routePremiumClick(el){
    if(el.matches('[data-v10]'))return runV10(el.dataset.v10);
    if(el.matches('[data-premium-action]'))return runAction(el.dataset.premiumAction);
    if(el.matches('[data-premium-radius]')){ensurePremiumRuntime();if(typeof premiumRadius==='function')return premiumRadius(el.dataset.premiumRadius)}
    if(el.matches('[data-store-sort]')){ensurePremiumRuntime();if(typeof applyPremiumStoreSort==='function')return applyPremiumStoreSort(el.dataset.storeSort)}
    if(el.matches('[data-pw]'))return runWorkspace(el.dataset.pw);
    if(el.id==='saveFind'){ensurePremiumRuntime();const i=(typeof state!=='undefined'&&state.result?.identification)||null;if(!i)return;let arr=[];try{arr=JSON.parse(localStorage.getItem('finditSaved')||'[]')}catch{}arr=[{name:i.name||i.object||'Item',query:i.searchQuery||'',savedAt:new Date().toISOString()},...arr].slice(0,30);localStorage.setItem('finditSaved',JSON.stringify(arr));el.textContent='✓ Saved';setTimeout(()=>el.textContent='♡ Save',900);if(typeof updatePremiumDashboard==='function')updatePremiumDashboard();return}
  }

  function delegatedGate(e){const el=e.target?.closest?.('[data-v10],[data-premium-action],[data-premium-radius],[data-store-sort],[data-pw],#saveFind,#widenSearch');if(!el)return;
    if(el.id==='widenSearch'){if(active()){ensurePremiumRuntime();return}else{e.preventDefault();e.stopImmediatePropagation();modal(true);return}}
    e.preventDefault();e.stopImmediatePropagation();
    if(!active()){modal(true);return}
    modal(false);routePremiumClick(el);
  }

  function wire(){document.addEventListener('click',delegatedGate,true);const b=$('#activatePremiumTester');if(b)b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();if(!active())localStorage.setItem(KEY,'1');syncAll();modal(false);const wow=$('#premiumWow');wow?.classList.remove('hidden');setTimeout(()=>wow?.classList.add('hidden'),1500);setTimeout(()=>$('#v10CommandCentre')?.scrollIntoView({block:'start'}),120)},true);$('#closePremium')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();modal(false)},true)}
  function syncAll(){syncState();updateCopy();}
  function init(){syncAll();wire();setTimeout(syncAll,300);setTimeout(syncAll,1200)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('pageshow',syncAll);
})();