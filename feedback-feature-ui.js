/* FindIt feedback + feature suggestion UI. */
(()=>{
'use strict';
if(window.__finditFeedbackFeatureUi)return;window.__finditFeedbackFeatureUi=true;
const $=(s,r=document)=>r.querySelector(s);
function technical(){
 const st=window.finditState||window.state||{},i=st.result?.identification||{},stores=Array.isArray(st.stores)?st.stores:[],offers=Array.isArray(st.offers)?st.offers:[];
 const distances=stores.map(x=>Number(x.distanceKm)).filter(Number.isFinite);
 return {page:location.pathname,viewport:`${innerWidth}x${innerHeight}`,platform:navigator.platform||'',language:navigator.language||'',online:navigator.onLine,hasLocation:Boolean(st.coords),item:i.name||i.object||'',searchQuery:i.searchQuery||'',retailCategory:i.retailCategory||i.category||'',likelyStoreTypes:i.likelyStoreTypes||[],recognitionConfidence:i.confidence,exactProductMatch:i.exactIdentityVerified===true,exactOfferCount:offers.length,nearbyStoreCount:stores.length,closestStoreDistanceKm:distances.length?Math.min(...distances):null,nearbyRadiusKm:Number(st.radius)||null,lastError:st.lastError||null,lastSearchCompletedAt:st.lastSearchCompletedAt||null};
}
async function send(payload,statusEl,button){
 const old=button?.textContent;if(button){button.disabled=true;button.textContent='Sending…'};if(statusEl){statusEl.textContent='Sending…';statusEl.classList.remove('error')}
 try{
  const r=await fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,technical:technical()})});
  const d=await r.json().catch(()=>({}));
  if(!r.ok||d.ok!==true||d.delivered===false)throw new Error(d.error||d.message||'Could not send');
  if(statusEl)statusEl.textContent=payload.topic==='idea'?'Feature suggestion sent ✓':'Feedback sent ✓';
  return true;
 }catch(e){if(statusEl){statusEl.textContent='Could not send right now. Please try again.';statusEl.classList.add('error')}return false}
 finally{if(button){button.disabled=false;button.textContent=old||'Send'}}
}
function wireLegacyFeedback(){
 const form=$('#feedbackForm');if(!form||form.dataset.finditFeedbackWired==='1')return;
 form.dataset.finditFeedbackWired='1';
 form.addEventListener('submit',async e=>{
  e.preventDefault();e.stopImmediatePropagation();
  const rating=Number($('#feedbackRating')?.value||5),message=String($('#feedbackMessage')?.value||'').trim(),status=$('#feedbackStatus'),btn=form.querySelector('button[type="submit"],button:not([type])');
  if(message.length<3){if(status)status.textContent='Please write a little more before sending.';return}
  if(await send({rating,topic:'general',message},status,btn))form.reset();
 },true);
}
function closeModal(m){m?.classList.add('hidden');m?.setAttribute('aria-hidden','true')}
function feedbackModal(){
 let m=$('#fxFeedbackModal');if(m)return m;
 m=document.createElement('div');m.id='fxFeedbackModal';m.className='fx-stable-modal hidden';m.setAttribute('aria-hidden','true');
 m.innerHTML=`<div class="fx-stable-card fx-feedback-card"><button type="button" class="fx-stable-close" aria-label="Close">×</button><div class="fx-feature-suggest-head"><span>▣</span><div><h2>Send Feedback</h2><p>Tell us what worked, what broke, or what FindIt should improve.</p></div></div><form id="fxFeedbackForm" class="fx-feature-form"><label>Rating<select id="fxFeedbackRating"><option value="5">★★★★★ Excellent</option><option value="4">★★★★ Good</option><option value="3">★★★ Okay</option><option value="2">★★ Needs work</option><option value="1">★ Poor</option></select></label><label>Feedback<textarea id="fxFeedbackMessage" maxlength="1200" required placeholder="What worked? What should improve?"></textarea></label><button class="btn primary" type="submit">Send feedback</button><button id="fxFeedbackSuggestFeature" class="btn secondary" type="button">✦ Suggest a Feature instead</button><p id="fxFeedbackStatus" class="status" aria-live="polite"></p></form></div>`;
 document.body.appendChild(m);
 m.addEventListener('click',e=>{if(e.target===m||e.target.closest('.fx-stable-close'))closeModal(m)});
 $('#fxFeedbackForm',m)?.addEventListener('submit',async e=>{e.preventDefault();const message=String($('#fxFeedbackMessage')?.value||'').trim(),rating=Number($('#fxFeedbackRating')?.value||5),status=$('#fxFeedbackStatus'),btn=e.currentTarget.querySelector('button[type="submit"]');if(message.length<3){status.textContent='Please write a little more before sending.';return}if(await send({rating,topic:'general',message},status,btn))$('#fxFeedbackMessage').value=''});
 $('#fxFeedbackSuggestFeature',m)?.addEventListener('click',()=>{closeModal(m);openFeature()});
 return m;
}
function featureModal(){
 let m=$('#fxFeatureSuggestionModal');if(m)return m;
 m=document.createElement('div');m.id='fxFeatureSuggestionModal';m.className='fx-stable-modal hidden';m.setAttribute('aria-hidden','true');
 m.innerHTML=`<div class="fx-stable-card fx-feature-suggest-card"><button type="button" class="fx-stable-close" aria-label="Close">×</button><div class="fx-feature-suggest-head"><span>✦</span><div><h2>Suggest a Feature</h2><p>Tell us what would make FindIt more useful for you.</p></div></div><form id="fxFeatureSuggestionForm" class="fx-feature-form"><label>Feature title<input id="fxFeatureTitle" maxlength="100" required placeholder="e.g. Notify me when a product is back in stock"></label><label>How would this help you?<textarea id="fxFeatureDetails" maxlength="900" required placeholder="Describe what you want FindIt to do and why it would be useful."></textarea></label><label>How useful would this be?<select id="fxFeatureRating"><option value="5">Very useful</option><option value="4">Useful</option><option value="3">Nice to have</option></select></label><button class="btn primary" type="submit">Send suggestion</button><button id="fxFeatureBackToFeedback" class="btn secondary" type="button">Back to Feedback</button><p id="fxFeatureStatus" class="status" aria-live="polite"></p></form></div>`;
 document.body.appendChild(m);
 m.addEventListener('click',e=>{if(e.target===m||e.target.closest('.fx-stable-close'))closeModal(m)});
 $('#fxFeatureSuggestionForm',m)?.addEventListener('submit',async e=>{e.preventDefault();const title=String($('#fxFeatureTitle')?.value||'').trim(),details=String($('#fxFeatureDetails')?.value||'').trim(),rating=Number($('#fxFeatureRating')?.value||5),status=$('#fxFeatureStatus'),btn=e.currentTarget.querySelector('button[type="submit"]');if(title.length<3||details.length<3){status.textContent='Please add a title and a short explanation.';return}const ok=await send({rating,topic:'idea',message:`Feature: ${title}\n\nHow it would help: ${details}`},status,btn);if(ok){$('#fxFeatureTitle').value='';$('#fxFeatureDetails').value=''}});
 $('#fxFeatureBackToFeedback',m)?.addEventListener('click',()=>{closeModal(m);openFeedback()});
 return m;
}
function openFeedback(){const m=feedbackModal();m.classList.remove('hidden');m.setAttribute('aria-hidden','false');setTimeout(()=>$('#fxFeedbackMessage')?.focus(),50)}
function openFeature(){const m=featureModal();m.classList.remove('hidden');m.setAttribute('aria-hidden','false');setTimeout(()=>$('#fxFeatureTitle')?.focus(),50)}
function injectDashboard(){
 const shell=$('#finditExactShell');if(!shell)return false;
 const nav=shell.querySelector('.fx-nav');
 if(nav&&!nav.querySelector('[data-fx="suggest-feature"]')){const b=document.createElement('button');b.type='button';b.dataset.fx='suggest-feature';b.innerHTML='✦ <span>Suggest a Feature</span>';const feedback=nav.querySelector('[data-fxnav="feedback"]');if(feedback)feedback.insertAdjacentElement('afterend',b);else nav.appendChild(b)}
 const bottom=shell.querySelector('.fx-bottom-row');
 if(bottom&&!bottom.querySelector('[data-fx="suggest-feature"]')){const a=document.createElement('article');a.dataset.fx='suggest-feature';a.innerHTML='<i>✦</i><div><b>Suggest a Feature</b><span>Tell us what FindIt should build next.</span></div><button type="button" data-fx="suggest-feature">Send Idea →</button>';bottom.appendChild(a)}
 return true;
}
function injectFeedbackCta(){
 const section=$('#feedback');if(!section||section.querySelector('#suggestFeatureFromFeedback'))return;
 const p=document.createElement('div');p.className='feedback-feature-cta';p.innerHTML='<div><b>Have an idea for FindIt?</b><span>Send a feature request separately from normal feedback.</span></div><button id="suggestFeatureFromFeedback" type="button" class="btn secondary">✦ Suggest a Feature</button>';section.insertBefore(p,section.querySelector('form'));
}
function sync(){wireLegacyFeedback();injectDashboard();injectFeedbackCta()}
window.finditOpenFeedback=openFeedback;window.finditOpenFeatureSuggestion=openFeature;
window.addEventListener('click',e=>{const hit=e.target?.closest?.('[data-fx="suggest-feature"],#suggestFeatureFromFeedback');if(!hit)return;e.preventDefault();e.stopImmediatePropagation();openFeature()},true);
document.addEventListener('DOMContentLoaded',sync);document.addEventListener('findit:dashboard-sync',sync);setTimeout(sync,0);setTimeout(sync,500);setTimeout(sync,1400);
const style=document.createElement('style');style.textContent='.feedback-feature-cta{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:18px 20px;margin:0 0 18px;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:rgba(255,255,255,.04)}.feedback-feature-cta div{display:grid;gap:4px}.feedback-feature-cta span{opacity:.72}.fx-feature-suggest-card,.fx-feedback-card{max-width:620px}.fx-feature-suggest-head{display:flex;gap:14px;align-items:flex-start;margin-bottom:18px}.fx-feature-suggest-head>span{font-size:28px}.fx-feature-suggest-head h2{margin:0 0 4px}.fx-feature-suggest-head p{margin:0;opacity:.72}.fx-feature-form{display:grid;gap:14px}.fx-feature-form label{display:grid;gap:7px;font-weight:700}.fx-feature-form input,.fx-feature-form textarea,.fx-feature-form select{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.16);border-radius:12px;padding:12px 13px;background:#111522;color:#fff;font:inherit}.fx-feature-form textarea{min-height:140px;resize:vertical}.status.error{color:#ff8f8f}@media(max-width:650px){.feedback-feature-cta{align-items:stretch;flex-direction:column}.feedback-feature-cta button{width:100%}}';document.head.appendChild(style);
})();
