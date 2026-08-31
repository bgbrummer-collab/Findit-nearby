(()=>{
'use strict';
if(window.__finditFinalInteractionGuard)return;window.__finditFinalInteractionGuard=true;
const $=s=>document.querySelector(s);
function premiumActive(){try{return localStorage.getItem('findit_premium_beta')==='1'||localStorage.getItem('finditPremium')==='1'||localStorage.getItem('finditPremium')==='true'||window.premiumState?.active===true||document.body.classList.contains('premium-active')}catch{return false}}
function forceHidden(el){if(!el)return;el.classList.add('hidden');el.setAttribute('aria-hidden','true');el.style.setProperty('display','none','important');el.style.setProperty('pointer-events','none','important')}
function closeAssistant(){const p=$('#assistantPanel');if(!p)return;const close=$('#closeAssistant');if(close&&getComputedStyle(p).display!=='none'){try{close.click()}catch{}}if(getComputedStyle(p).display!=='none'&&!p.classList.contains('hidden')){p.classList.add('hidden');p.setAttribute('aria-hidden','true')}}
function guardPremium(){if(!premiumActive())return;forceHidden($('#premiumModal'));document.body.classList.add('fx-premium-already-active')}
function style(){if($('#finditFinalInteractionStyle'))return;const s=document.createElement('style');s.id='finditFinalInteractionStyle';s.textContent=`
body.fx-premium-already-active #premiumModal{display:none!important;visibility:hidden!important;pointer-events:none!important}
@media(max-width:900px){#finditExactShell .fx-nav button:nth-child(n){display:block!important}.fx-nav{overflow-x:auto!important}.fx-feature-row article:nth-child(n){display:flex!important}.fx-bottom-row article:nth-child(n){display:grid!important}}
@media(max-width:620px){.fx-feature-row{grid-template-columns:1fr 1fr!important}.fx-bottom-row{grid-template-columns:1fr 1fr!important}.fx-bottom-row .premium{grid-column:1/-1!important}}
`;document.head.appendChild(s)}
window.addEventListener('pointerdown',e=>{const t=e.target?.closest?.('#finditExactShell button,#finditExactShell article');if(!t)return;if(!t.closest('[data-fx="assistant"]')&&!t.matches('[data-fx="assistant"]'))closeAssistant();guardPremium()},true);
window.addEventListener('click',e=>{const t=e.target?.closest?.('#finditExactShell button,#finditExactShell article');if(!t)return;if(!t.closest('[data-fx="assistant"]')&&!t.matches('[data-fx="assistant"]'))closeAssistant();guardPremium()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeAssistant();guardPremium()}});
document.addEventListener('findit:results-rendered',guardPremium);window.addEventListener('storage',guardPremium);
function init(){style();guardPremium();setTimeout(guardPremium,100);setTimeout(guardPremium,800)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();