/* FindIt upload/search stability — keep the visible primary action reachable after a real photo selection and recover once from transient AI-provider busy responses. */
(()=>{
'use strict';
if(window.__finditUploadSearchStability)return;window.__finditUploadSearchStability=true;
const $=s=>document.querySelector(s);
const nativeFetch=window.fetch.bind(window);
const quotaRe=/quota|billing|rate.?limit|resource.?exhausted|too many requests/i;
const transientRe=/high demand|temporar(?:y|ily)|busy|service unavailable|overload/i;
function visiblePrimary(){return $('#fxSearchNow')||$('#search')}
function ensurePrimaryAction(){const btn=visiblePrimary();if(!btn)return;btn.classList.add('fx-search-stable');const r=btn.getBoundingClientRect();if(r.bottom>window.innerHeight-12||r.top<8)btn.scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'})}
function onPhoto(){document.documentElement.classList.add('fx-photo-selected');requestAnimationFrame(()=>requestAnimationFrame(ensurePrimaryAction));setTimeout(ensurePrimaryAction,120);setTimeout(ensurePrimaryAction,420)}
function bind(){const input=$('#photo');if(!input||input.dataset.fxSearchStable)return false;input.dataset.fxSearchStable='1';input.addEventListener('change',onPhoto,{passive:true});return true}
function isImageSearch(input,init){const raw=typeof input==='string'?input:input?.url||'';let path='';try{path=new URL(raw,location.href).pathname}catch{path=String(raw)}return path==='/api/search'&&String(init?.method||'GET').toUpperCase()==='POST'&&init?.body instanceof FormData}
function copyFormData(body){const next=new FormData();for(const [key,value] of body.entries())next.append(key,value);return next}
function friendlyBusyResponse(response,data){const friendly=data?.error||'Image identification is temporarily busy. Please try again shortly.';return new Response(JSON.stringify({...data,message:friendly}),{status:response.status,statusText:response.statusText,headers:{'content-type':'application/json'}})}
async function fetchWithTransientSearchRetry(input,init){if(!isImageSearch(input,init))return nativeFetch(input,init);const first=await nativeFetch(input,init);if(first.status!==503)return first;let data={};try{data=await first.clone().json()}catch{}const text=`${data?.message||''} ${data?.error||''}`;const transient=data?.retryable===true&&!quotaRe.test(text)&&transientRe.test(text);if(!transient)return data?.retryable?friendlyBusyResponse(first,data):first;await new Promise(resolve=>setTimeout(resolve,700));if(init?.signal?.aborted)return friendlyBusyResponse(first,data);const second=await nativeFetch(input,{...init,body:copyFormData(init.body)});if(second.status!==503)return second;let secondData={};try{secondData=await second.clone().json()}catch{}return secondData?.retryable?friendlyBusyResponse(second,secondData):second}
window.fetch=fetchWithTransientSearchRetry;
const st=document.createElement('style');st.id='fxUploadSearchStabilityStyles';st.textContent=`#fxSearchNow.fx-search-stable{transform:none!important;will-change:auto!important}.fx-photo-selected #finditExactShell .upload-preview img,.fx-photo-selected #finditExactShell .preview{max-height:min(34vh,260px)!important;object-fit:contain!important}@media(max-width:760px){.fx-photo-selected #finditExactShell .upload-preview img,.fx-photo-selected #finditExactShell .preview{max-height:220px!important}}`;document.head.appendChild(st);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();setTimeout(bind,300);setTimeout(bind,1200);document.addEventListener('findit:dashboard-sync',bind);
})();