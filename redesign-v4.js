/* FindIt redesign navigation. Does not replace search/result logic. */
(()=>{
'use strict';
if(window.__finditRedesignV4)return;window.__finditRedesignV4=true;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
function scroll(sel){const el=$(sel);if(el)el.scrollIntoView({behavior:'smooth',block:'start'})}
function clickText(text){const target=$$('button,a').find(el=>String(el.textContent||'').trim().toLowerCase()===text.toLowerCase()&&el.offsetParent!==null);if(target){target.click();return true}return false}
function addResponsiveGuard(){if($('#rdResponsiveGuard'))return;const s=document.createElement('style');s.id='rdResponsiveGuard';s.textContent=`
@media(max-width:1400px){
 body.findit-redesign-v4{padding-left:0!important}
 body.findit-redesign-v4 .topbar{position:sticky!important;inset:auto!important;top:0!important;width:auto!important;min-height:0!important;border-radius:0 0 16px 16px!important;display:grid!important;grid-template-columns:auto 1fr auto!important;gap:10px!important;padding:10px 14px!important;background:rgba(5,10,20,.97)!important;backdrop-filter:blur(18px)!important}
 body.findit-redesign-v4 .topbar .brand{font-size:22px!important;white-space:nowrap!important}
 body.findit-redesign-v4 .desktop-nav{display:flex!important;grid-column:1/-1!important;flex-direction:row!important;gap:7px!important;overflow-x:auto!important;padding:2px 0 4px!important;scrollbar-width:none!important}
 body.findit-redesign-v4 .desktop-nav::-webkit-scrollbar{display:none!important}
 body.findit-redesign-v4 .desktop-nav a,body.findit-redesign-v4 .desktop-nav button{flex:0 0 auto!important;white-space:nowrap!important;padding:9px 12px!important;border:1px solid #162640!important;background:#091421!important;font-size:12px!important}
 body.findit-redesign-v4 .desktop-nav .rd-active{background:linear-gradient(90deg,#3478ff,#8b45ff)!important;border-color:transparent!important;transform:none!important}
 body.findit-redesign-v4 .rd-side-premium,body.findit-redesign-v4 .rd-side-recent{display:none!important}
 body.findit-redesign-v4 #menuBtn{display:inline-flex!important;grid-column:3!important;grid-row:1!important;margin-left:auto!important}
 body.findit-redesign-v4 main#home{padding:10px 12px 88px!important}
 body.findit-redesign-v4 .hero{grid-template-columns:1fr!important;min-height:auto!important;padding:34px 28px 54px!important;border-radius:20px!important}
 body.findit-redesign-v4 .hero-device{display:none!important}
 body.findit-redesign-v4 .hero-copy h1{font-size:clamp(42px,7vw,64px)!important;max-width:760px!important}
 body.findit-redesign-v4 .hero-text{max-width:700px!important}
 body.findit-redesign-v4 .trust-row{grid-template-columns:repeat(4,minmax(0,1fr))!important}
 body.findit-redesign-v4 #finder{margin:14px 0!important;position:relative!important;z-index:5!important}
 body.findit-redesign-v4 #finder .finder-grid{grid-template-columns:minmax(0,1.05fr) minmax(300px,.95fr)!important}
 body.findit-redesign-v4 #results:not(.hidden){grid-template-columns:1fr!important}
 body.findit-redesign-v4 #results>.result-actions{grid-column:1!important;grid-row:auto!important;position:static!important;grid-template-columns:repeat(3,1fr)!important}
 body.findit-redesign-v4 .nearby-stores{grid-template-columns:repeat(2,minmax(0,1fr))!important}
 body.findit-redesign-v4 #recent .recent-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
}
@media(max-width:760px){
 body.findit-redesign-v4 main#home{padding:8px 8px 92px!important}
 body.findit-redesign-v4 .topbar{padding:9px 10px!important}
 body.findit-redesign-v4 .topbar .brand{font-size:19px!important}
 body.findit-redesign-v4 .hero{padding:26px 18px 34px!important}
 body.findit-redesign-v4 .hero-copy h1{font-size:40px!important;line-height:1.02!important}
 body.findit-redesign-v4 .hero-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important}
 body.findit-redesign-v4 .trust-row{grid-template-columns:1fr 1fr!important}
 body.findit-redesign-v4 #finder{margin:10px 0!important;padding:14px!important}
 body.findit-redesign-v4 #finder .finder-grid{grid-template-columns:1fr!important}
 body.findit-redesign-v4 .finder-actions{grid-template-columns:1fr 1fr!important}
 body.findit-redesign-v4 #search,body.findit-redesign-v4 #status{grid-column:1/-1!important}
 body.findit-redesign-v4 #results{padding:12px!important}
 body.findit-redesign-v4 #results>.result-actions{grid-template-columns:1fr!important}
 body.findit-redesign-v4 .nearby-stores{grid-template-columns:1fr!important}
 body.findit-redesign-v4 #recent .recent-grid{grid-template-columns:1fr!important}
}
`;document.head.appendChild(s)}
function nav(){const n=$('.desktop-nav');if(!n)return;n.innerHTML=`<button class="rd-active" data-rd="home">⌂ Home</button><button data-rd="search">⌕ Search</button><button data-rd="nearby">⌖ Nearby</button><button data-rd="compare">⇄ Compare</button><button data-rd="saved">♡ Saved</button><button data-rd="history">◷ History</button><a href="#feedback">◌ Feedback</a>`;
 n.addEventListener('click',e=>{const b=e.target.closest('[data-rd]');if(!b)return;const x=b.dataset.rd;$$('[data-rd]',n).forEach(v=>v.classList.toggle('rd-active',v===b));if(x==='home')window.scrollTo({top:0,behavior:'smooth'});if(x==='search')scroll('#finder');if(x==='nearby')scroll(!$('#results')?.classList.contains('hidden')?'#nearbyPanel':'#finder');if(x==='compare'){if(!clickText('Compare Prices'))scroll(!$('#results')?.classList.contains('hidden')?'#freeActions':'#finder')}if(x==='saved'){if(!clickText('Save'))scroll('#recent')}if(x==='history')scroll('#recent')})}
function sideExtras(){const bar=$('.topbar');if(!bar)return;const prem=document.createElement('div');prem.className='rd-side-premium';prem.innerHTML='<b>👑 FindIt Premium</b><span>More search range, saved finds and smarter tools.</span><button type="button">Open Premium</button>';prem.querySelector('button').onclick=()=>{$('#premiumButton')?.click()||$('#drawerPremium')?.click()};bar.appendChild(prem);const rec=document.createElement('div');rec.className='rd-side-recent';rec.innerHTML='<b>Quick access</b><div class="rd-mini"><span>Recent finds</span><span>→</span></div><div class="rd-mini"><span>Saved items</span><span>♡</span></div>';rec.querySelectorAll('.rd-mini')[0].onclick=()=>scroll('#recent');rec.querySelectorAll('.rd-mini')[1].onclick=()=>{if(!clickText('Save'))scroll('#recent')};bar.appendChild(rec)}
function init(){document.body.classList.add('findit-redesign-v4');addResponsiveGuard();nav();sideExtras()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
