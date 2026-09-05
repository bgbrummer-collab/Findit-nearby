/* FindIt plan guard — keeps Free and Premium capabilities separated on the exact dashboard. */
(()=>{
'use strict';
const KEY='findit_premium_beta';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const active=()=>localStorage.getItem(KEY)==='1';

// Free keeps the core FindIt journey: photo identification, Product Info,
// nearby retailers/map, <=10 km search, basic history, feedback and settings.
// These actions are Premium-only because they correspond to the Premium list.
const PREMIUM_ACTIONS=new Set(['saved','compare','stock','deals','pricehistory','alerts','assistant']);
const PREMIUM_NAV=new Set(['compare','deals','saved','alerts']);

function state(){try{return window.finditState||window.state||null}catch{return null}}
function openPremium(){($('#premiumButton')||$('#drawerPremium'))?.click()}
function addBadge(el){
  if(!el||el.querySelector(':scope > .fx-plan-lock'))return;
  const b=document.createElement('span');b.className='fx-plan-lock';b.textContent='★ PREMIUM';el.appendChild(b);
}
function removeBadge(el){el?.querySelector(':scope > .fx-plan-lock')?.remove()}

function enforceRadius(on){
  const limit=on?25:10,st=state();
  if(st&&Number(st.radius)>limit)st.radius=limit;
  const stored=Number(localStorage.getItem('finditRadius')||10);
  if(!Number.isFinite(stored)||stored>limit)localStorage.setItem('finditRadius',String(limit));
  ['#radiusSelect','#settingsRadius','#fxStableRadius'].forEach(sel=>{
    const el=$(sel);if(!el)return;
    [...el.options].forEach(o=>{
      const n=Number(o.value);if(n>10){o.disabled=!on;o.hidden=false;o.textContent=o.textContent.replace(/\s*★\s*$/,'')+(on?'':' ★ Premium')}
    });
    if(Number(el.value)>limit)el.value=String(limit);
  });
  const sort=$('#fxStableSort');
  if(sort){sort.disabled=!on;if(!on)sort.value='best';sort.title=on?'Store sorting':'Premium feature';}
}

function syncPlan(){
  const on=active(),shell=$('#finditExactShell');
  enforceRadius(on);
  if(!shell)return;
  shell.dataset.plan=on?'premium':'free';
  $$('#finditExactShell [data-fx]').forEach(el=>{
    const premium=PREMIUM_ACTIONS.has(el.dataset.fx);
    el.classList.toggle('fx-premium-only',premium&&!on);
    if(premium&&!on)addBadge(el);else removeBadge(el);
  });
  $$('#finditExactShell [data-fxnav]').forEach(el=>{
    const premium=PREMIUM_NAV.has(el.dataset.fxnav);
    el.classList.toggle('fx-premium-only',premium&&!on);
    if(premium&&!on)addBadge(el);else removeBadge(el);
  });
}

function capturePlanClick(e){
  if(active())return;
  const el=e.target?.closest?.('#finditExactShell [data-fx],#finditExactShell [data-fxnav]');
  if(!el)return;
  const a=el.dataset.fx||el.dataset.fxnav;
  if(!(PREMIUM_ACTIONS.has(a)||PREMIUM_NAV.has(a)))return;
  e.preventDefault();e.stopImmediatePropagation();openPremium();
}

function captureRadiusChange(e){
  const el=e.target;if(active()||!el?.matches?.('#radiusSelect,#settingsRadius,#fxStableRadius'))return;
  if(Number(el.value)<=10)return;
  el.value='10';const st=state();if(st)st.radius=10;localStorage.setItem('finditRadius','10');openPremium();
}

function cleanProductInfo(){
  const modal=$('#fxStableModal:not(.hidden)'),title=modal?.querySelector('.fx-stable-title');
  if(!modal||title?.textContent?.trim()!=='Product Information')return;
  const box=$('#fxStableResearch',modal);if(!box)return;
  const i=state()?.result?.identification||{},family=String(i.retailCategory||i.category||i.object||'').toLowerCase();
  const whatHeading=[...box.querySelectorAll('b')].find(x=>/^What it does$/i.test(x.textContent.trim()));
  const what=whatHeading?.nextElementSibling;
  if(what){
    const t=what.textContent.trim();
    const weak=/^yes[,.:\s]/i.test(t)||/available in (?:a )?range of (?:materials|colou?rs|sizes)/i.test(t)||(family.includes('footwear')&&/materials including/i.test(t));
    if(weak){
      const name=i.name||i.model||i.object||'this product';
      what.textContent=`FindIt identified ${name}. Detailed claims are only shown when exact-product web evidence supports them.`;
    }
  }
  const negative=/\b(drawback|limitation|difficult|tricky|poor|weak|fragile|heavy|bulky|stiff|break[- ]?in|requires?|not included|sold separately|may not|cannot|does not|issue|problem|warning|inconsistent|short battery|limited)\b/i;
  [...box.querySelectorAll('h4')].forEach(h=>{
    if(!/Cons\s*\/\s*considerations/i.test(h.textContent))return;
    const ul=h.nextElementSibling;if(!ul||ul.tagName!=='UL')return;
    [...ul.querySelectorAll('li')].forEach(li=>{if(!negative.test(li.textContent))li.remove()});
    if(!ul.querySelector('li')){h.remove();ul.remove()}
  });
}

function improveCompareStatus(){
  const modal=$('#fxStableModal:not(.hidden)'),title=modal?.querySelector('.fx-stable-title');
  if(!modal||!/(Compare Prices|Verified Deals|Price History)/i.test(title?.textContent||''))return;
  const status=$('#fxPriceStatus',modal);if(!status||status.dataset.guardTimer)return;
  status.dataset.guardTimer='1';
  setTimeout(()=>{
    if(status.isConnected&&/Checking verified retailer pages/i.test(status.textContent))
      status.textContent='Still checking retailer pages. FindIt will only show a price when it can verify it.';
  },18000);
}

function qualitySync(){syncPlan();cleanProductInfo();improveCompareStatus()}

const style=document.createElement('style');
style.textContent=`
#finditExactShell .fx-premium-only{position:relative;opacity:.72}
#finditExactShell .fx-premium-only:hover{opacity:1}
#finditExactShell .fx-plan-lock{position:absolute;right:7px;top:6px;z-index:3;font-size:8px;font-weight:900;letter-spacing:.06em;color:#ddd2ff;background:#321b66;border:1px solid #704cff;border-radius:999px;padding:3px 5px;line-height:1;pointer-events:none}
#fxStableRadius option:disabled,#radiusSelect option:disabled,#settingsRadius option:disabled{color:#8f95a6}
`;
document.head.appendChild(style);

document.addEventListener('click',capturePlanClick,true);
document.addEventListener('change',captureRadiusChange,true);
window.addEventListener('storage',qualitySync);
document.addEventListener('findit:results-rendered',qualitySync);
document.addEventListener('findit:dashboard-sync',qualitySync);
new MutationObserver(()=>qualitySync()).observe(document.documentElement,{childList:true,subtree:true});
setTimeout(qualitySync,0);setTimeout(qualitySync,500);setTimeout(qualitySync,1500);
})();
