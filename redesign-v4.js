/* FindIt redesign navigation. Does not replace search/result logic. */
(()=>{
'use strict';
if(window.__finditRedesignV4)return;window.__finditRedesignV4=true;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
function scroll(sel){const el=$(sel);if(el)el.scrollIntoView({behavior:'smooth',block:'start'})}
function clickText(text){const target=$$('button,a').find(el=>String(el.textContent||'').trim().toLowerCase()===text.toLowerCase()&&el.offsetParent!==null);if(target){target.click();return true}return false}
function nav(){const n=$('.desktop-nav');if(!n)return;n.innerHTML=`<button class="rd-active" data-rd="home">⌂ Home</button><button data-rd="search">⌕ Search</button><button data-rd="nearby">⌖ Nearby</button><button data-rd="compare">⇄ Compare</button><button data-rd="saved">♡ Saved</button><button data-rd="history">◷ History</button><a href="#feedback">◌ Feedback</a>`;
 n.addEventListener('click',e=>{const b=e.target.closest('[data-rd]');if(!b)return;const x=b.dataset.rd;$$('[data-rd]',n).forEach(v=>v.classList.toggle('rd-active',v===b));if(x==='home')window.scrollTo({top:0,behavior:'smooth'});if(x==='search')scroll('#finder');if(x==='nearby')scroll(!$('#results')?.classList.contains('hidden')?'#nearbyPanel':'#finder');if(x==='compare'){if(!clickText('Compare Prices'))scroll(!$('#results')?.classList.contains('hidden')?'#freeActions':'#finder')}if(x==='saved'){if(!clickText('Save'))scroll('#recent')}if(x==='history')scroll('#recent')})}
function sideExtras(){const bar=$('.topbar');if(!bar)return;const prem=document.createElement('div');prem.className='rd-side-premium';prem.innerHTML='<b>👑 FindIt Premium</b><span>More search range, saved finds and smarter tools.</span><button type="button">Open Premium</button>';prem.querySelector('button').onclick=()=>{$('#premiumButton')?.click()||$('#drawerPremium')?.click()};bar.appendChild(prem);const rec=document.createElement('div');rec.className='rd-side-recent';rec.innerHTML='<b>Quick access</b><div class="rd-mini"><span>Recent finds</span><span>→</span></div><div class="rd-mini"><span>Saved items</span><span>♡</span></div>';rec.querySelectorAll('.rd-mini')[0].onclick=()=>scroll('#recent');rec.querySelectorAll('.rd-mini')[1].onclick=()=>{if(!clickText('Save'))scroll('#recent')};bar.appendChild(rec)}
function init(){document.body.classList.add('findit-redesign-v4');nav();sideExtras()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
