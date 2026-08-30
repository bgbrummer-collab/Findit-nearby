(()=>{
'use strict';
if(window.__finditJourneyGuardV1)return;window.__finditJourneyGuardV1=true;
const selectors=['#finditJourneyV5','#finditJourney','#journeyOverlay','#journeyScreen','.journey-overlay','.journey-screen'];
function hideLegacyJourney(){
  for(const sel of selectors){document.querySelectorAll(sel).forEach(el=>{el.classList.add('hidden');el.hidden=true;el.setAttribute('aria-hidden','true');el.style.setProperty('display','none','important');el.style.setProperty('visibility','hidden','important');el.style.setProperty('pointer-events','none','important')})}
  document.documentElement.classList.remove('journey-open','journey-active','findit-journey-open');
  document.body?.classList.remove('journey-open','journey-active','findit-journey-open');
  const dash=document.querySelector('#finditExactShell');if(dash){dash.style.removeProperty('display');dash.style.removeProperty('visibility')}
}
function backToDashboard(){hideLegacyJourney();document.querySelector('#finditExactShell')?.scrollIntoView({block:'start',behavior:'auto'});window.scrollTo({top:0,left:0,behavior:'auto'})}
document.addEventListener('findit:results-rendered',()=>{backToDashboard();setTimeout(backToDashboard,50);setTimeout(backToDashboard,250)});
document.addEventListener('findit:nearby-updated',hideLegacyJourney);
window.addEventListener('load',()=>{hideLegacyJourney();setTimeout(hideLegacyJourney,500)});
const mo=new MutationObserver(()=>hideLegacyJourney());
function start(){hideLegacyJourney();mo.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden']})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();