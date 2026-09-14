/* FindIt upload/search stability — keep the visible primary action reachable after a real photo selection. */
(()=>{
'use strict';
if(window.__finditUploadSearchStability)return;window.__finditUploadSearchStability=true;
const $=s=>document.querySelector(s);
function visiblePrimary(){return $('#fxSearchNow')||$('#search')}
function ensurePrimaryAction(){const btn=visiblePrimary();if(!btn)return;btn.classList.add('fx-search-stable');const r=btn.getBoundingClientRect();if(r.bottom>window.innerHeight-12||r.top<8)btn.scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'})}
function onPhoto(){document.documentElement.classList.add('fx-photo-selected');requestAnimationFrame(()=>requestAnimationFrame(ensurePrimaryAction));setTimeout(ensurePrimaryAction,120);setTimeout(ensurePrimaryAction,420)}
function bind(){const input=$('#photo');if(!input||input.dataset.fxSearchStable)return false;input.dataset.fxSearchStable='1';input.addEventListener('change',onPhoto,{passive:true});return true}
const st=document.createElement('style');st.id='fxUploadSearchStabilityStyles';st.textContent=`#fxSearchNow.fx-search-stable{transform:none!important;will-change:auto!important}.fx-photo-selected #finditExactShell .upload-preview img,.fx-photo-selected #finditExactShell .preview{max-height:min(34vh,260px)!important;object-fit:contain!important}@media(max-width:760px){.fx-photo-selected #finditExactShell .upload-preview img,.fx-photo-selected #finditExactShell .preview{max-height:220px!important}}`;document.head.appendChild(st);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();setTimeout(bind,300);setTimeout(bind,1200);document.addEventListener('findit:dashboard-sync',bind);
})();