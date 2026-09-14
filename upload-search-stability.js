/* FindIt upload/search stability — keep the visible primary action reachable after a real photo selection and recover once from a temporary image-provider busy response. */
(function(){
'use strict';
if(window.__finditUploadSearchStability)return;
window.__finditUploadSearchStability=true;
var nativeFetch=window.fetch.bind(window);
var quotaRe=/quota|billing|rate.?limit|resource.?exhausted|too many requests/i;
var transientRe=/high demand|temporar(y|ily)|busy|service unavailable|overload/i;
function $(s){return document.querySelector(s)}
function visiblePrimary(){return $('#fxSearchNow')||$('#search')}
function ensurePrimaryAction(){var btn=visiblePrimary();if(!btn)return;btn.classList.add('fx-search-stable');var r=btn.getBoundingClientRect();if(r.bottom>window.innerHeight-12||r.top<8)btn.scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'})}
function onPhoto(){document.documentElement.classList.add('fx-photo-selected');requestAnimationFrame(function(){requestAnimationFrame(ensurePrimaryAction)});setTimeout(ensurePrimaryAction,120);setTimeout(ensurePrimaryAction,420)}
function bind(){var input=$('#photo');if(!input||input.dataset.fxSearchStable)return false;input.dataset.fxSearchStable='1';input.addEventListener('change',onPhoto,{passive:true});return true}
function isImageSearch(input,init){var raw=typeof input==='string'?input:(input&&input.url)||'';var path=String(raw);try{path=new URL(raw,location.href).pathname}catch(e){}return path==='/api/search'&&String((init&&init.method)||'GET').toUpperCase()==='POST'&&init&&init.body instanceof FormData}
function copyFormData(body){var next=new FormData();body.forEach(function(value,key){next.append(key,value)});return next}
function retrySearchFetch(input,init){
 if(!isImageSearch(input,init))return nativeFetch(input,init);
 return nativeFetch(input,init).then(function(first){
  if(first.status!==503)return first;
  return first.clone().json().catch(function(){return {}}).then(function(data){
   var text=String((data&&data.message)||'')+' '+String((data&&data.error)||'');
   var transient=Boolean(data&&data.retryable===true)&&!quotaRe.test(text)&&transientRe.test(text);
   if(!transient)return first;
   return new Promise(function(resolve){setTimeout(resolve,700)}).then(function(){
    if(init.signal&&init.signal.aborted)return first;
    var retryInit={};Object.keys(init).forEach(function(key){retryInit[key]=init[key]});retryInit.body=copyFormData(init.body);
    return nativeFetch(input,retryInit);
   });
  });
 });
}
window.fetch=retrySearchFetch;
var st=document.createElement('style');st.id='fxUploadSearchStabilityStyles';st.textContent='#fxSearchNow.fx-search-stable{transform:none!important;will-change:auto!important}.fx-photo-selected #finditExactShell .upload-preview img,.fx-photo-selected #finditExactShell .preview{max-height:min(34vh,260px)!important;object-fit:contain!important}@media(max-width:760px){.fx-photo-selected #finditExactShell .upload-preview img,.fx-photo-selected #finditExactShell .preview{max-height:220px!important}}';document.head.appendChild(st);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();setTimeout(bind,300);setTimeout(bind,1200);document.addEventListener('findit:dashboard-sync',bind);
})();