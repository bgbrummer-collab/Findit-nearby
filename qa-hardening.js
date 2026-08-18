/* FindIt QA hardening: responsive Premium layout, in-context help, managed history/saved items, and runtime smoke checks. */
(() => {
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function installStyles(){
    if($('#finditQaHardeningStyles')) return;
    const s=document.createElement('style'); s.id='finditQaHardeningStyles'; s.textContent=`
      html,body{max-width:100%;overflow-x:hidden}
      body.premium-active #v10CommandCentre{width:min(1260px,calc(100% - 32px))!important;max-width:none!important;margin:24px auto!important;padding:34px!important;overflow:hidden!important}
      body.premium-active #v10CommandCentre>*{position:relative;z-index:2}
      body.premium-active #v10CommandCentre:after{z-index:0!important;opacity:.7;clip-path:inset(0 0 0 0)}
      body.premium-active .v10-top{grid-template-columns:minmax(0,1fr) 180px!important;align-items:start!important}
      body.premium-active .v10-top h2{font-size:clamp(42px,5.6vw,72px)!important;line-height:.96!important;max-width:850px!important;margin-top:8px!important}
      .v10-launch,.v10-tools{align-items:stretch}
      .v10-launch button,.v10-tools button{height:auto!important;min-width:0!important}
      .v10-how{display:block;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.07);font-size:9px!important;line-height:1.45;color:#b3c1de!important;font-style:normal;font-weight:650}
      .v10-how b{display:inline!important;font-size:9px!important;color:#d8d0ff!important;margin:0!important}
      .findit-help-ribbon{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:18px 0 2px;padding:13px 15px;border:1px solid rgba(133,112,255,.28);border-radius:15px;background:linear-gradient(135deg,rgba(105,76,255,.09),rgba(32,181,226,.06));color:#aab8d5;font-size:11px;line-height:1.5}
      .findit-help-ribbon strong{color:#fff}.findit-help-ribbon button{border:1px solid rgba(138,113,255,.38);background:#151b3b;color:#fff;border-radius:11px;padding:8px 10px;font-weight:850;cursor:pointer;white-space:nowrap}
      .findit-guide-modal{position:fixed;inset:0;z-index:18000;background:rgba(2,4,13,.86);backdrop-filter:blur(14px);display:grid;place-items:center;padding:18px}.findit-guide-modal.hidden{display:none}.findit-guide-card{width:min(900px,100%);max-height:88vh;overflow:auto;border:1px solid rgba(135,108,255,.45);border-radius:25px;padding:25px;background:linear-gradient(180deg,#101633,#080d1f);box-shadow:0 30px 100px #0009;position:relative}.findit-guide-card h2{font-size:34px;margin:5px 0 15px}.findit-guide-close{position:absolute;right:14px;top:10px;border:0;background:transparent;color:#fff;font-size:30px;cursor:pointer}.findit-guide-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.findit-guide-grid article{padding:15px;border-radius:15px;border:1px solid #29375a;background:#0a122b}.findit-guide-grid b{display:block;margin-bottom:5px}.findit-guide-grid p{margin:0;color:#94a3c1;font-size:11px;line-height:1.55}
      .findit-row-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.findit-delete-btn{border:1px solid #7d3949!important;background:#2a111b!important;color:#ffc3ce!important}.findit-manage-note{font-size:10px;color:#8fa0c1;margin:5px 0 12px}.recent-card .findit-recent-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.recent-card .findit-recent-actions button{margin-top:0}
      .findit-watch-help{margin-top:10px;padding:12px;border:1px solid rgba(113,138,210,.2);border-radius:13px;background:rgba(13,23,48,.65);font-size:10px;line-height:1.55;color:#94a4c5}.findit-watch-help a{color:#80dfff}
      @media(max-width:1100px){body.premium-active .v10-top{grid-template-columns:1fr auto!important}.v10-launch{grid-template-columns:1fr 1fr!important}.v10-tools{grid-template-columns:repeat(3,1fr)!important}}
      @media(max-width:760px){body.premium-active #v10CommandCentre{width:calc(100% - 20px)!important;margin:10px auto 16px!important;padding:21px!important;border-radius:26px!important}.v10-top{grid-template-columns:1fr!important}.v10-score{width:100%!important;min-width:0!important}.v10-launch{grid-template-columns:1fr!important}.v10-tools{grid-template-columns:1fr 1fr!important}.findit-guide-grid{grid-template-columns:1fr}.findit-help-ribbon{align-items:flex-start;flex-direction:column}.findit-row-actions{justify-content:flex-start}}
      @media(max-width:430px){.v10-tools{grid-template-columns:1fr!important}}
    `; document.head.appendChild(s);
  }

  const GUIDE={
    scan:['Vision+','Upload or take a clear photo, allow location if you want nearby stores, then press Identify & Find.'],
    manual:['Manual Search','Use this when you already know the product name. Type the exact name/model and search it directly.'],
    exact:['Exact Match','First run a photo search. Exact Match reuses the identified brand/model/search query to look for that exact product.'],
    assistant:['AI Search','First identify an item. AI Search uses the current item to build a smarter retailer/product query.'],
    collections:['Collections','Search and save an item, open Collections, create a collection, then add the current Find to it.'],
    watchlist:['Watchlist','Search an item first, open Watchlist, choose Add current product, optionally set a target price, then use Check now.'],
    favourites:['Favourite Stores','Run a nearby search with location enabled, open Favourite Stores, then save a retailer you want to remember.'],
    stats:['My Stats','Use FindIt normally. This page totals recent finds, saved items, Watchlist items and favourite stores stored on this device.'],
    history:['History+','Your searches are added automatically. Search the history list, Search again, or Delete individual entries to make space.']
  };

  function addGuidance(){
    const centre=$('#v10CommandCentre'); if(!centre) return;
    $$('[data-v10]').forEach(btn=>{
      const g=GUIDE[btn.dataset.v10]; if(!g) return;
      let how=btn.querySelector('.v10-how');
      if(!how){how=document.createElement('em');how.className='v10-how';btn.appendChild(how)}
      how.innerHTML=`<b>How:</b> ${esc(g[1])}`;
      btn.title=`${g[0]} — ${g[1]}`;
    });
    if(!$('#finditFeatureHelpRibbon')){
      const r=document.createElement('div');r.id='finditFeatureHelpRibbon';r.className='findit-help-ribbon';r.innerHTML='<div><strong>New to Premium?</strong> Every tool above now shows a quick “How” guide. You can also open the full guide.</div><button type="button" id="finditOpenGuide">How to use Premium</button>';
      centre.appendChild(r);
      $('#finditOpenGuide')?.addEventListener('click',openGuide);
    }
  }

  function openGuide(){
    let m=$('#finditGuideModal');
    if(!m){m=document.createElement('div');m.id='finditGuideModal';m.className='findit-guide-modal hidden';document.body.appendChild(m)}
    m.innerHTML=`<div class="findit-guide-card"><button class="findit-guide-close" type="button">×</button><p class="premium-home-kicker">★ PREMIUM HELP</p><h2>How to use every Premium tool</h2><div class="findit-guide-grid">${Object.values(GUIDE).map(([n,d])=>`<article><b>${esc(n)}</b><p>${esc(d)}</p></article>`).join('')}<article><b>Saved Items</b><p>After a successful FindIt search press Save. Open Saved Items to search again or delete old entries.</p></article><article><b>Compare Stores</b><p>Run a nearby search first. Select stores using Compare, then open Compare Stores to view them side-by-side.</p></article><article><b>Smart Filters</b><p>Run a nearby search, then choose Closest, A–Z or Best match to reorder the store results.</p></article><article><b>25 km Radius</b><p>Choose 15 km or 25 km from the radius controls. FindIt will search farther when location is available.</p></article></div></div>`;
    m.classList.remove('hidden');m.querySelector('.findit-guide-close').onclick=()=>m.classList.add('hidden');m.onclick=e=>{if(e.target===m)m.classList.add('hidden')};
  }

  function enhanceRecent(){
    const list=$('#recentList'); if(!list) return;
    const items=(()=>{try{return JSON.parse(localStorage.getItem('finditRecent')||'[]')}catch{return[]}})();
    $$('.recent-card').forEach((card,i)=>{
      if(card.querySelector('.findit-recent-actions')) return;
      const q=card.querySelector('[data-recent]')?.dataset.recent||items[i]?.query||'';
      const wrap=document.createElement('div');wrap.className='findit-recent-actions';
      const search=card.querySelector('[data-recent]'); if(search){search.remove();wrap.appendChild(search)}
      const del=document.createElement('button');del.type='button';del.className='findit-delete-btn';del.textContent='Delete';del.onclick=()=>{
        let a=[];try{a=JSON.parse(localStorage.getItem('finditRecent')||'[]')}catch{}
        const idx=a.findIndex(x=>String(x.query||'')===String(q));if(idx>=0)a.splice(idx,1);else if(a[i])a.splice(i,1);
        localStorage.setItem('finditRecent',JSON.stringify(a));
        if(typeof renderRecent==='function')renderRecent();setTimeout(enhanceRecent,0);if(typeof updatePremiumDashboard==='function')updatePremiumDashboard();
      };wrap.appendChild(del);card.appendChild(wrap);
    });
  }

  function manageSaved(){
    const el=$('#premiumSavedList');if(!el||el.dataset.qaManaged==='1')return;
    const mo=new MutationObserver(()=>injectSavedDelete(el));mo.observe(el,{childList:true,subtree:true});el.dataset.qaManaged='1';injectSavedDelete(el);
  }
  function injectSavedDelete(el){
    let list=[];try{list=JSON.parse(localStorage.getItem('finditSaved')||'[]');if(!Array.isArray(list))list=[]}catch{}
    el.querySelectorAll('.premium-saved-row').forEach((row,i)=>{
      if(row.querySelector('[data-qa-saved-delete]')) return;
      let actions=row.querySelector('.findit-row-actions'); if(!actions){actions=document.createElement('div');actions.className='findit-row-actions';const old=row.querySelector('button');if(old){old.remove();actions.appendChild(old)}row.appendChild(actions)}
      const b=document.createElement('button');b.type='button';b.className='findit-delete-btn';b.dataset.qaSavedDelete=String(i);b.textContent='Delete';b.onclick=()=>{let a=[];try{a=JSON.parse(localStorage.getItem('finditSaved')||'[]')}catch{};a.splice(i,1);localStorage.setItem('finditSaved',JSON.stringify(a));if(typeof renderPremiumSaved==='function')renderPremiumSaved();if(typeof updatePremiumDashboard==='function')updatePremiumDashboard()};actions.appendChild(b);
    });
  }

  function watchlistHelp(){
    const body=$('#v10ModalBody');if(!body)return;
    const title=body.querySelector('h2')?.textContent||'';if(!/stock|watch/i.test(title)||body.querySelector('.findit-watch-help'))return;
    const rows=body.querySelector('.v10-list');if(!rows)return;
    const h=document.createElement('div');h.className='findit-watch-help';
    h.innerHTML='If price or stock says <b>not verified</b>, FindIt has not found a trustworthy exact listing yet. Use <b>Check now</b> after the exact product is identified. FindIt will never invent a price or local-branch stock level.';
    rows.before(h);
  }

  function qaAudit(){
    const requiredIds=['menuBtn','closeMenu','choosePhoto','takePhoto','location','search','shuffleExamples','challengeBtn','challengeBtn2','openRecent','openSettings','premiumButton','activatePremiumTester','assistantFab','closeAssistant','feedbackForm','copyFeedback','clearRecent','mobileMore'];
    const missing=requiredIds.filter(id=>!document.getElementById(id));
    const premiumFns=['v10Manual','v10Exact','v10Assistant','v10Collections','v10FavouriteStores','v10Stats','v10History','openTool','premiumRadius','applyPremiumStoreSort'];
    const missingFns=premiumFns.filter(n=>typeof window[n]!=='function');
    const premiumButtons=$$('#v10CommandCentre [data-v10]').map(b=>b.dataset.v10);
    const report={time:new Date().toISOString(),missingElements:missing,missingPremiumFunctions:missingFns,premiumButtons,ok:missing.length===0&&missingFns.length===0};
    window.__finditQaReport=report;console.info('[FindIt QA]',report);return report;
  }
  window.finditRunQA=qaAudit;

  function sync(){installStyles();addGuidance();enhanceRecent();manageSaved();watchlistHelp();qaAudit()}
  function init(){sync();const body=$('#v10ModalBody');if(body)new MutationObserver(()=>{watchlistHelp();manageSaved()}).observe(body,{childList:true,subtree:true});const recent=$('#recentList');if(recent)new MutationObserver(()=>enhanceRecent()).observe(recent,{childList:true,subtree:true});setTimeout(sync,400);setTimeout(sync,1400)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();window.addEventListener('pageshow',()=>setTimeout(sync,120));
})();
