(()=>{
'use strict';
if(window.__finditJourneyGuardV2)return;window.__finditJourneyGuardV2=true;
const selectors=['#finditJourneyV5','#finditJourney','#journeyOverlay','#journeyScreen','.journey-overlay','.journey-screen'];
function premiumActive(){try{return localStorage.getItem('findit_premium_beta')==='1'||localStorage.getItem('finditPremium')==='1'||localStorage.getItem('finditPremium')==='true'||window.premiumState?.active===true||document.body?.classList.contains('premium-active')}catch{return false}}
function hideLegacyJourney(){
  for(const sel of selectors){document.querySelectorAll(sel).forEach(el=>{el.classList.add('hidden');el.hidden=true;el.setAttribute('aria-hidden','true');el.style.setProperty('display','none','important');el.style.setProperty('visibility','hidden','important');el.style.setProperty('pointer-events','none','important')})}
  document.documentElement.classList.remove('journey-open','journey-active','findit-journey-open');
  document.body?.classList.remove('journey-open','journey-active','findit-journey-open');
  const dash=document.querySelector('#finditExactShell');if(dash){dash.style.removeProperty('display');dash.style.removeProperty('visibility')}
}
function syncPremiumOverlay(){
  const m=document.querySelector('#premiumModal');if(!m)return;
  if(premiumActive()){
    m.classList.add('hidden');m.setAttribute('aria-hidden','true');m.style.setProperty('display','none','important');m.style.setProperty('pointer-events','none','important');
  }else if(m.classList.contains('hidden')){
    m.style.removeProperty('display');m.style.removeProperty('pointer-events');
  }
}
function guard(){hideLegacyJourney();syncPremiumOverlay()}
function backToDashboard(){guard();document.querySelector('#finditExactShell')?.scrollIntoView({block:'start',behavior:'auto'});window.scrollTo({top:0,left:0,behavior:'auto'})}
document.addEventListener('findit:results-rendered',()=>{backToDashboard();setTimeout(backToDashboard,50);setTimeout(backToDashboard,250)});
document.addEventListener('findit:nearby-updated',guard);
document.addEventListener('findit:dashboard-sync',guard);
window.addEventListener('storage',guard);
window.addEventListener('click',e=>{if(premiumActive()&&e.target?.closest?.('#finditExactShell'))syncPremiumOverlay()},true);
window.addEventListener('load',()=>{guard();setTimeout(guard,500)});
const mo=new MutationObserver(()=>guard());
function start(){guard();mo.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden','aria-hidden']})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();