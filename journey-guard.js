(()=>{
'use strict';
if(window.__finditJourneyGuardV3)return;window.__finditJourneyGuardV3=true;
const selectors=['#finditJourneyV5','#finditJourney','#journeyOverlay','#journeyScreen','.journey-overlay','.journey-screen'];
function premiumActive(){try{return localStorage.getItem('findit_premium_beta')==='1'||localStorage.getItem('finditPremium')==='1'||localStorage.getItem('finditPremium')==='true'||window.premiumState?.active===true||document.body?.classList.contains('premium-active')||document.body?.classList.contains('fx-premium-already-active')}catch{return false}}
function hideElement(el){if(!el)return;el.classList.add('hidden');el.setAttribute('aria-hidden','true');el.style.setProperty('display','none','important');el.style.setProperty('visibility','hidden','important');el.style.setProperty('pointer-events','none','important')}
function hideLegacyJourney(){
  for(const sel of selectors){document.querySelectorAll(sel).forEach(hideElement)}
  document.documentElement.classList.remove('journey-open','journey-active','findit-journey-open','findit-v5-open','findit-journey-v5-open','fj-open','modal-open');
  document.body?.classList.remove('journey-open','journey-active','findit-journey-open','findit-v5-open','findit-journey-v5-open','fj-open','modal-open');
  const dash=document.querySelector('#finditExactShell');if(dash){dash.hidden=false;dash.style.removeProperty('display');dash.style.removeProperty('visibility')}
}
function syncPremiumOverlay(){
  const on=premiumActive(),m=document.querySelector('#premiumModal');
  document.body?.classList.toggle('fx-premium-already-active',on);
  for(const id of ['#fxPremiumSideButton','#fxPremiumBottomButton']){const b=document.querySelector(id);if(b){b.hidden=on;b.style.setProperty('display',on?'none':'','important')}}
  if(!m)return;
  if(on){hideElement(m)}
  else if(m.classList.contains('hidden')){m.style.removeProperty('display');m.style.removeProperty('visibility');m.style.removeProperty('pointer-events')}
}
function closeAssistant(){const p=document.querySelector('#assistantPanel');if(!p)return;p.classList.add('hidden');p.setAttribute('aria-hidden','true');p.style.setProperty('pointer-events','none','important')}
function allowAssistant(){const p=document.querySelector('#assistantPanel');if(!p)return;p.style.removeProperty('pointer-events');p.removeAttribute('aria-hidden')}
function guard(){hideLegacyJourney();syncPremiumOverlay()}
function backToDashboard(){guard();closeAssistant();document.querySelector('#finditExactShell')?.scrollIntoView({block:'start',behavior:'auto'});window.scrollTo({top:0,left:0,behavior:'auto'})}
function dashboardActionTarget(e){return e.target?.closest?.('#finditExactShell button,#finditExactShell [role="button"],#finditExactShell [data-fx],#finditExactShell [data-fxnav]')||null}
window.addEventListener('pointerdown',e=>{
  const t=dashboardActionTarget(e);if(!t)return;
  const isAssistant=t.matches?.('[data-fx="assistant"]')||!!t.closest?.('[data-fx="assistant"]');
  if(!isAssistant)closeAssistant();else allowAssistant();
  if(premiumActive())syncPremiumOverlay();
},true);
window.addEventListener('click',e=>{const t=dashboardActionTarget(e);if(t&&!t.matches?.('[data-fx="assistant"]'))closeAssistant();if(premiumActive())syncPremiumOverlay()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAssistant()});
document.addEventListener('findit:results-rendered',()=>{backToDashboard();setTimeout(backToDashboard,50);setTimeout(backToDashboard,250)});
document.addEventListener('findit:nearby-updated',guard);
document.addEventListener('findit:dashboard-sync',guard);
window.addEventListener('storage',guard);
window.addEventListener('load',()=>{guard();setTimeout(guard,250);setTimeout(guard,1000)});
const mo=new MutationObserver(()=>{queueMicrotask(guard)});
function start(){guard();const style=document.createElement('style');style.id='finditHardOverlayGuard';style.textContent='body.fx-premium-already-active #premiumModal{display:none!important;visibility:hidden!important;pointer-events:none!important}body.fx-premium-already-active #fxPremiumSideButton,body.fx-premium-already-active #fxPremiumBottomButton{display:none!important}#assistantPanel.hidden{pointer-events:none!important}';document.head.appendChild(style);mo.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden','aria-hidden']})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();