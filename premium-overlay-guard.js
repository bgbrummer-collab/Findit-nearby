(()=>{
'use strict';
if(window.__finditPremiumOverlayGuardV1)return;window.__finditPremiumOverlayGuardV1=true;
const $=s=>document.querySelector(s);
function active(){try{return localStorage.getItem('findit_premium_beta')==='1'||localStorage.getItem('finditPremium')==='1'||localStorage.getItem('finditPremium')==='true'||window.premiumState?.active===true||document.body.classList.contains('premium-active')}catch{return false}}
function closeActivePremiumOverlay(){
  if(!active())return;
  const m=$('#premiumModal');
  if(!m)return;
  m.classList.add('hidden');
  m.setAttribute('aria-hidden','true');
  m.style.setProperty('display','none','important');
  m.style.setProperty('pointer-events','none','important');
}
function restoreForFree(){
  if(active())return;
  const m=$('#premiumModal');
  if(!m)return;
  m.style.removeProperty('display');
  m.style.removeProperty('pointer-events');
}
function sync(){active()?closeActivePremiumOverlay():restoreForFree()}
window.addEventListener('click',e=>{
  if(!active())return;
  const dash=e.target?.closest?.('#finditExactShell button,#finditExactShell [role="button"],#finditExactShell [data-fx],#finditExactShell [data-fxnav]');
  if(dash)closeActivePremiumOverlay();
},true);
document.addEventListener('findit:results-rendered',sync);
document.addEventListener('findit:dashboard-sync',sync);
window.addEventListener('storage',sync);
const observer=new MutationObserver(()=>{if(active())closeActivePremiumOverlay()});
function init(){sync();const m=$('#premiumModal');if(m)observer.observe(m,{attributes:true,attributeFilter:['class','style','aria-hidden']});setInterval(sync,1000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();