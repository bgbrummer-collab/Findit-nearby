(() => {
  const KEY = 'findit_premium_beta';
  const $ = (s) => document.querySelector(s);
  const active = () => localStorage.getItem(KEY) === '1';
  let suppressUpgradeModalUntil = 0;
  let explicitPlanOpen = false;

  const FREE = [
    'AI photo identification','Nearby retailer results','Directions & map','Up to 10 km search radius',
    'Basic recent finds','Search exact item online','Search retailer type near you','Copy product name','Share this find'
  ];
  const PREMIUM = [
    'Up to 25 km search radius','Saved Items','Collections','Price & stock Watchlist','Favourite Stores','Compare Stores',
    'Smart store filters','History+ (up to 50 finds)','Manual product search','Exact Match search','AI retailer search',
    'Premium stats & workspace'
  ];

  function modal(show, explicit = false) {
    const m = $('#premiumModal');
    if (!m) return;
    if (show && active() && !explicit && Date.now() < suppressUpgradeModalUntil) return;
    explicitPlanOpen = Boolean(show && explicit);
    m.classList.toggle('hidden', !show);
    m.setAttribute('aria-hidden', show ? 'false' : 'true');
  }

  function ensureRuntime() {
    const on = active();
    if (typeof premiumState !== 'undefined') premiumState.active = on;
    document.body.classList.toggle('premium-active', on);
    document.body.classList.toggle('premium-v10', on);
    $('#premiumStatusBadge')?.classList.toggle('hidden', !on);
    $('#premiumWorkspaceButton')?.classList.toggle('hidden', !on);
    $('#premiumHome')?.classList.toggle('hidden', !on);
    $('#v10CommandCentre')?.classList.toggle('hidden', !on);
    const drawer = $('#premiumDrawerNav');
    if (drawer) drawer.style.display = on ? '' : 'none';

    const limit = on ? 25 : 10;
    try {
      if (typeof state !== 'undefined' && Number(state.radius) > limit) state.radius = limit;
      const stored = Math.min(limit, Number(localStorage.getItem('finditRadius') || 10));
      localStorage.setItem('finditRadius', String(stored));
      ['#radiusSelect','#settingsRadius'].forEach(s => {
        const el = $(s);
        if (el && Number(el.value) > limit) el.value = String(limit);
      });
    } catch {}
  }

  function updateCopy() {
    const cards = document.querySelectorAll('#premiumModal .premium-plan-card');
    const freeCard = cards[0];
    const pc = $('#premiumModal .premium-plan-card.premium');
    if (freeCard?.querySelector('ul')) freeCard.querySelector('ul').innerHTML = FREE.map(x => `<li>${x}</li>`).join('');
    if (pc?.querySelector('ul')) pc.querySelector('ul').innerHTML = PREMIUM.map(x => `<li>${x}</li>`).join('');
    if (pc?.querySelector('small')) pc.querySelector('small').textContent = 'Free during Premium Beta testing. Real payments are disabled.';
    const p = $('#premiumModal .premium-card > p');
    if (p) p.textContent = 'Premium Beta is free while FindIt is being tested. Premium-only tools are separated from the Free plan.';
    const b = $('#activatePremiumTester');
    if (b) b.textContent = active() ? 'Premium Beta active ✓' : 'Activate Premium Beta — Free';

    $('#v10CommandCentre [data-v10="share"]')?.remove();
    const wt = $('#v10CommandCentre [data-v10="watchlist"] small');
    if (wt) wt.textContent = 'Track price drops & stock';
    const save = $('#saveFind');
    if (save) {
      save.textContent = active() ? '♡ Save' : '♡ Save ★';
      save.title = active() ? 'Save this Find' : 'Premium feature';
    }

    let back = $('#finditReturnFree');
    if (active() && pc && !back) {
      back = document.createElement('button');
      back.id = 'finditReturnFree';
      back.type = 'button';
      back.textContent = 'Return to Free for testing';
      back.style.marginTop = '10px';
      back.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        localStorage.removeItem(KEY);
        syncAll();
        modal(false);
        window.scrollTo(0,0);
      }, true);
      pc.appendChild(back);
    }
    if (!active()) back?.remove();
  }

  function runV10(a) {
    ensureRuntime();
    if (a === 'scan') return $('#finder')?.scrollIntoView({behavior:'smooth',block:'start'});
    if (a === 'manual' && typeof v10Manual === 'function') return v10Manual();
    if (a === 'exact' && typeof v10Exact === 'function') return v10Exact();
    if (a === 'assistant' && typeof v10Assistant === 'function') return v10Assistant();
    if (a === 'collections' && typeof v10Collections === 'function') return v10Collections();
    if (a === 'watchlist' && typeof window.finditOpenAlertsWatchlist === 'function') return window.finditOpenAlertsWatchlist();
    if (a === 'watchlist' && typeof v10Watchlist === 'function') return v10Watchlist();
    if (a === 'favourites' && typeof v10FavouriteStores === 'function') return v10FavouriteStores();
    if (a === 'stats' && typeof v10Stats === 'function') return v10Stats();
    if (a === 'history' && typeof v10History === 'function') return v10History();
    if (typeof v10Handle === 'function') return v10Handle(a);
  }

  function runAction(a) {
    ensureRuntime();
    if (a === 'find') return $('#finder')?.scrollIntoView({behavior:'smooth',block:'start'});
    if (a === 'saved' && typeof openTool === 'function') return openTool('saved');
    if (a === 'compare' && typeof openTool === 'function') return openTool('compare');
    if (a === 'map') {
      const r = $('#results');
      if (r && !r.classList.contains('hidden')) {
        r.scrollIntoView({behavior:'smooth',block:'start'});
        setTimeout(() => $('#mapViewBtn')?.click(), 180);
      } else $('#finder')?.scrollIntoView({behavior:'smooth'});
      return;
    }
    if (typeof premiumAction === 'function') return premiumAction(a);
  }

  function runWorkspace(a) {
    ensureRuntime();
    if (typeof closePremiumWorkspace === 'function') closePremiumWorkspace();
    if (a === 'saved' && typeof openTool === 'function') return openTool('saved');
    if (a === 'compare' && typeof openTool === 'function') return openTool('compare');
    if (a === 'filters' && typeof openTool === 'function') return openTool('filters');
    if (a === 'history') return $('#recent')?.scrollIntoView({behavior:'smooth'});
    if (a === 'challenge') return $('#challengeBtn')?.click();
    if (a === 'map') return runAction('map');
    if (a === 'find') return runAction('find');
    if (a === 'radius') return $('#premiumHome')?.scrollIntoView({behavior:'smooth'});
  }

  function saveCurrent(el) {
    ensureRuntime();
    const i = (typeof state !== 'undefined' && state.result?.identification) || null;
    if (!i) return;
    let arr = [];
    try { arr = JSON.parse(localStorage.getItem('finditSaved') || '[]'); } catch {}
    arr = [{name:i.name||i.object||'Item',query:i.searchQuery||'',savedAt:new Date().toISOString()}, ...arr].slice(0,30);
    localStorage.setItem('finditSaved', JSON.stringify(arr));
    el.textContent = '✓ Saved';
    setTimeout(() => { if (active()) el.textContent = '♡ Save'; }, 900);
    if (typeof updatePremiumDashboard === 'function') updatePremiumDashboard();
  }

  function route(el) {
    if (el.matches('[data-v10]')) return runV10(el.dataset.v10);
    if (el.matches('[data-premium-action]')) return runAction(el.dataset.premiumAction);
    if (el.matches('[data-premium-radius]')) {
      ensureRuntime();
      return typeof premiumRadius === 'function' ? premiumRadius(el.dataset.premiumRadius) : undefined;
    }
    if (el.matches('[data-store-sort]')) {
      ensureRuntime();
      return typeof applyPremiumStoreSort === 'function' ? applyPremiumStoreSort(el.dataset.storeSort) : undefined;
    }
    if (el.matches('[data-pw]')) return runWorkspace(el.dataset.pw);
    if (el.id === 'saveFind') return saveCurrent(el);
  }

  function captureClick(e) {
    const planButton = e.target?.closest?.('#premiumButton,#drawerPremium');
    if (planButton) {
      e.preventDefault();
      e.stopImmediatePropagation();
      modal(true, true);
      return;
    }

    const activate = e.target?.closest?.('#activatePremiumTester');
    if (activate) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!active()) localStorage.setItem(KEY, '1');
      syncAll();
      modal(false);
      const wow = $('#premiumWow');
      wow?.classList.remove('hidden');
      setTimeout(() => wow?.classList.add('hidden'), 1500);
      setTimeout(() => $('#v10CommandCentre')?.scrollIntoView({block:'start'}), 120);
      return;
    }

    const close = e.target?.closest?.('#closePremium');
    if (close) {
      e.preventDefault();
      e.stopImmediatePropagation();
      modal(false);
      return;
    }

    const el = e.target?.closest?.('[data-v10],[data-premium-action],[data-premium-radius],[data-store-sort],[data-pw],#saveFind,#widenSearch');
    if (!el) return;

    if (el.id === 'widenSearch') {
      if (!active()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        modal(true);
      }
      return;
    }

    e.preventDefault();
    e.stopImmediatePropagation();
    if (!active()) {
      modal(true);
      return;
    }

    suppressUpgradeModalUntil = Date.now() + 1500;
    explicitPlanOpen = false;
    modal(false);
    try { route(el); }
    finally {
      requestAnimationFrame(() => modal(false));
      setTimeout(() => modal(false), 0);
      setTimeout(() => modal(false), 120);
    }
  }

  function installModalGuard() {
    const m = $('#premiumModal');
    if (!m || m.dataset.guardInstalled === '1') return;
    m.dataset.guardInstalled = '1';
    new MutationObserver(() => {
      if (!active()) return;
      if (explicitPlanOpen) return;
      if (Date.now() < suppressUpgradeModalUntil && !m.classList.contains('hidden')) {
        m.classList.add('hidden');
        m.setAttribute('aria-hidden','true');
      }
    }).observe(m, {attributes:true, attributeFilter:['class','aria-hidden']});
  }

  function syncAll() {
    ensureRuntime();
    updateCopy();
    installModalGuard();
  }

  function init() {
    syncAll();
    window.addEventListener('click', captureClick, true);
    document.addEventListener('findit:results-rendered', syncAll);
    setTimeout(syncAll, 300);
    setTimeout(syncAll, 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
  window.addEventListener('pageshow', syncAll);
})();

/* =========================================================
   FINDIT PREMIUM — PRICE DROP + STOCK WATCHLIST
========================================================= */
(() => {
  const WATCH_KEY = 'findit_v10_watchlist';
  const $ = (s) => document.querySelector(s);
  const read = () => { try { const x = JSON.parse(localStorage.getItem(WATCH_KEY) || '[]'); return Array.isArray(x) ? x : []; } catch { return []; } };
  const write = (x) => localStorage.setItem(WATCH_KEY, JSON.stringify(x.slice(0,50)));
  const esc2 = (v='') => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money2 = (n,c='ZAR') => Number.isFinite(Number(n)) ? new Intl.NumberFormat(undefined,{style:'currency',currency:c||'ZAR'}).format(Number(n)) : 'Price not verified';
  const stockText = s => s==='in_stock'?'In stock':s==='out_of_stock'?'Out of stock':s==='preorder'?'Pre-order':'Stock not verified';
  const currentItem = () => {
    const i = (typeof state !== 'undefined' && state.result?.identification) || {};
    const offers = (typeof productIntelligence !== 'undefined' && productIntelligence?.offers) || (typeof state !== 'undefined' ? state.offers : []) || [];
    const best = [...offers].filter(o=>o && (o.price!=null || o.availability)).sort((a,b)=>Number(b.matchScore||b.match||0)-Number(a.matchScore||a.match||0))[0] || {};
    return {name:i.name||i.object||'Current Find',query:i.searchQuery||i.name||i.object||'',brand:i.brand||'',model:i.model||'',addedAt:new Date().toISOString(),baselinePrice:Number.isFinite(Number(best.price))?Number(best.price):null,lastPrice:Number.isFinite(Number(best.price))?Number(best.price):null,currency:best.currency||'ZAR',lastStock:best.availability||best.stock?.status||null,retailer:best.retailer?.name||best.retailer||'',productUrl:best.product_url||best.url||'',alertPriceDrop:true,alertBackInStock:true,targetPrice:null,lastCheckedAt:null,lastAlert:null};
  };
  async function notify(title, body) { if ('Notification' in window && Notification.permission === 'granted') { try { new Notification(title,{body}); } catch {} } }
  async function checkOne(item) {
    const r = await fetch('/api/product-intelligence',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query:item.query,name:item.name,brand:item.brand,model:item.model})});
    const d = await r.json().catch(()=>({})); if (!r.ok) throw new Error(d.error||'Could not check this product.');
    const offers = Array.isArray(d.offers)?d.offers:[]; const best = offers.filter(o=>o && (o.price!=null || o.availability)).sort((a,b)=>Number(b.matchScore||b.match||0)-Number(a.matchScore||a.match||0))[0] || null;
    const now = new Date().toISOString(); if (!best) return {...item,lastCheckedAt:now,lastAlert:'No verified price or stock update yet'};
    const newPrice = Number.isFinite(Number(best.price))?Number(best.price):null; const newStock = best.availability||null; let alertMsg = null;
    if (item.alertPriceDrop && newPrice!=null && item.baselinePrice!=null && newPrice < Number(item.baselinePrice)) { alertMsg = `Price dropped from ${money2(item.baselinePrice,item.currency)} to ${money2(newPrice,best.currency||item.currency)}.`; await notify('FindIt price drop', `${item.name}: ${alertMsg}`); }
    if (item.alertPriceDrop && item.targetPrice!=null && newPrice!=null && newPrice <= Number(item.targetPrice)) { alertMsg = `Target price reached: ${money2(newPrice,best.currency||item.currency)}.`; await notify('FindIt target price reached', `${item.name}: ${alertMsg}`); }
    if (item.alertBackInStock && newStock==='in_stock' && item.lastStock && item.lastStock!=='in_stock') { alertMsg = 'Back in stock.'; await notify('FindIt stock alert', `${item.name} is back in stock.`); }
    return {...item,lastPrice:newPrice??item.lastPrice,lastStock:newStock??item.lastStock,currency:best.currency||item.currency,retailer:best.retailer?.name||item.retailer,productUrl:best.product_url||item.productUrl,lastCheckedAt:now,lastAlert:alertMsg||`Checked ${new Date(now).toLocaleString()}`};
  }
  async function checkIndex(index, button) { const list = read(); if (!list[index]) return; if (button) { button.disabled=true; button.textContent='Checking…'; } try { list[index] = await checkOne(list[index]); write(list); openWatchlist(); } catch(e) { if(button){button.disabled=false;button.textContent='Check now';} alert(e.message||'Could not check product.'); } }
  async function checkAll(button) { const list = read(); if (button) { button.disabled=true; button.textContent='Checking watchlist…'; } for (let i=0;i<list.length;i++) { try { list[i]=await checkOne(list[i]); } catch {} } write(list); openWatchlist(); }
  function addCurrent() { const x = currentItem(); if (!x.query) { alert('Run a FindIt product search first, then add that product to the Watchlist.'); return; } const list = read(); const key = `${x.query}|${x.model}`.toLowerCase(); const existing = list.findIndex(v=>`${v.query}|${v.model||''}`.toLowerCase()===key); if (existing>=0) list[existing] = {...list[existing],...x,addedAt:list[existing].addedAt||x.addedAt}; else list.unshift(x); write(list); openWatchlist(); }
  function openWatchlist() {
    if (typeof premiumState !== 'undefined') premiumState.active=true;
    const body = $('#v10ModalBody'), modal = $('#v10UniversalModal'); if (!body || !modal) return; const list = read();
    body.innerHTML = `<p class="premium-home-kicker">★ PREMIUM WATCHLIST</p><h2>Price drops & stock alerts</h2><p class="premium-tool-note">Save products here and re-check verified retailer data for price drops or stock changes. During Beta, checks happen when FindIt is open or when you press Check now.</p><div class="v10-actions"><button id="watchAddCurrent">+ Add current product</button><button id="watchCheckAll" ${list.length?'':'disabled'}>Check all now</button><button id="watchEnableAlerts">Enable browser alerts</button></div><div class="v10-list" style="margin-top:15px">${list.length?list.map((x,i)=>`<div class="v10-row" style="align-items:flex-start"><div style="flex:1"><b>${esc2(x.name)}</b><br><small>${esc2(x.retailer||'Retailer not verified yet')}</small><br><small>Price: ${esc2(money2(x.lastPrice,x.currency))} • ${esc2(stockText(x.lastStock))}</small>${x.baselinePrice!=null?`<br><small>Saved at ${esc2(money2(x.baselinePrice,x.currency))}</small>`:''}${x.lastAlert?`<br><small>${esc2(x.lastAlert)}</small>`:''}<div style="margin-top:8px"><label><small>Target price</small><br><input data-watch-target="${i}" type="number" min="0" step="0.01" value="${x.targetPrice??''}" placeholder="Optional"></label></div></div><div><button data-watch-check="${i}">Check now</button><button data-watch-remove="${i}" style="margin-top:6px">Remove</button></div></div>`).join(''):'<p>No products are being watched yet.</p>'}</div>`;
    modal.classList.remove('hidden'); $('#watchAddCurrent')?.addEventListener('click',addCurrent); $('#watchCheckAll')?.addEventListener('click',e=>checkAll(e.currentTarget)); $('#watchEnableAlerts')?.addEventListener('click',async()=>{if(!('Notification' in window))return alert('Browser notifications are not supported on this device.');const p=await Notification.requestPermission();alert(p==='granted'?'Browser alerts enabled ✓':'Notifications were not enabled.');}); document.querySelectorAll('[data-watch-check]').forEach(b=>b.addEventListener('click',()=>checkIndex(Number(b.dataset.watchCheck),b))); document.querySelectorAll('[data-watch-remove]').forEach(b=>b.addEventListener('click',()=>{const a=read();a.splice(Number(b.dataset.watchRemove),1);write(a);openWatchlist();})); document.querySelectorAll('[data-watch-target]').forEach(inp=>inp.addEventListener('change',()=>{const a=read(),i=Number(inp.dataset.watchTarget);if(a[i]){a[i].targetPrice=inp.value===''?null:Number(inp.value);write(a);}}));
  }
  window.finditOpenAlertsWatchlist = openWatchlist;
  async function refreshStale() { if (localStorage.getItem('findit_premium_beta')!=='1') return; const list=read(), now=Date.now(); let changed=false; for(let i=0;i<list.length;i++){ const t=Date.parse(list[i].lastCheckedAt||0)||0; if(now-t<30*60*1000) continue; try{list[i]=await checkOne(list[i]);changed=true;}catch{} } if(changed) write(list); }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(refreshStale,2500),{once:true});else setTimeout(refreshStale,2500);
})();

/* =========================================================
   FINDIT PREMIUM — LUXURY EXPERIENCE REDESIGN
========================================================= */
(() => {
  const active=()=>localStorage.getItem('findit_premium_beta')==='1';
  function installLuxury(){
    if(document.getElementById('finditPremiumLuxuryStyles')) return;
    const s=document.createElement('style');s.id='finditPremiumLuxuryStyles';s.textContent=`
body.premium-active{background:radial-gradient(circle at 10% 4%,rgba(123,80,255,.25),transparent 28%),radial-gradient(circle at 88% 11%,rgba(30,190,255,.18),transparent 30%),radial-gradient(circle at 55% 55%,rgba(112,79,255,.08),transparent 35%),#03050d}
body.premium-active .topbar{background:rgba(5,7,18,.72);border-bottom-color:rgba(147,117,255,.22);box-shadow:0 14px 50px rgba(0,0,0,.32)}
body.premium-active .brand b{background:linear-gradient(90deg,#fff,#bba7ff,#5bdcff);-webkit-background-clip:text;color:transparent}
body.premium-active #v10CommandCentre{position:relative;overflow:hidden;max-width:1260px;margin:34px auto 24px;padding:38px;border-radius:40px;background:linear-gradient(145deg,rgba(19,18,52,.96),rgba(6,10,26,.97) 52%,rgba(5,25,38,.96));border:1px solid rgba(151,117,255,.45);box-shadow:0 35px 120px rgba(0,0,0,.62),0 0 90px rgba(114,78,255,.16)}
body.premium-active #v10CommandCentre:before{content:"";position:absolute;width:480px;height:480px;border-radius:50%;right:-160px;top:-230px;background:radial-gradient(circle,rgba(67,210,255,.18),transparent 67%);pointer-events:none}
body.premium-active #v10CommandCentre:after{content:"PREMIUM";position:absolute;right:24px;bottom:-25px;font-size:110px;font-weight:1000;letter-spacing:-8px;color:rgba(255,255,255,.018);pointer-events:none}
body.premium-active .v10-top h2{font-size:clamp(44px,6vw,76px);letter-spacing:-3px;line-height:.96;max-width:780px}
body.premium-active .v10-top p:last-child{font-size:15px;line-height:1.75;color:#aab8d8}
body.premium-active .v10-score{border-color:rgba(180,145,255,.65);background:linear-gradient(145deg,rgba(87,48,165,.5),rgba(8,50,75,.7));box-shadow:inset 0 1px rgba(255,255,255,.1),0 20px 60px rgba(65,45,155,.3)}
body.premium-active .v10-launch{gap:14px;margin-top:30px}
body.premium-active .v10-launch button,body.premium-active .v10-tools button{position:relative;overflow:hidden;border-color:rgba(127,142,190,.25);background:linear-gradient(150deg,rgba(18,27,59,.88),rgba(8,15,36,.92));box-shadow:inset 0 1px rgba(255,255,255,.035),0 14px 35px rgba(0,0,0,.22)}
body.premium-active .v10-launch button:hover,body.premium-active .v10-tools button:hover{transform:translateY(-5px) scale(1.01);border-color:rgba(137,108,255,.72);box-shadow:0 22px 55px rgba(55,35,125,.28),0 0 28px rgba(62,190,255,.08)}
body.premium-active .v10-launch-main{background:linear-gradient(135deg,#5b2ea0,#0b6b91)!important;box-shadow:0 20px 55px rgba(73,46,180,.32)!important}
body.premium-active .v10-tools{gap:12px;margin-top:14px}
body.premium-active .v10-tools button{min-height:118px;padding:19px}
body.premium-active #premiumExperience{display:block}
#premiumExperience{display:none;width:min(1260px,calc(100% - 28px));margin:0 auto 28px}
.px-eyebrow{font-size:10px;letter-spacing:.22em;color:#a992ff;font-weight:950;margin-bottom:8px}.px-title{font-size:clamp(34px,5vw,58px);letter-spacing:-2px;margin:0 0 10px}.px-sub{color:#93a4c6;max-width:760px;line-height:1.7;margin:0}
.px-grid{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:14px;margin-top:22px}.px-card{min-height:230px;padding:24px;border-radius:26px;border:1px solid rgba(124,142,192,.22);background:linear-gradient(145deg,rgba(15,23,52,.94),rgba(7,13,31,.96));box-shadow:0 22px 60px rgba(0,0,0,.3);position:relative;overflow:hidden}.px-card.big{background:radial-gradient(circle at 90% 5%,rgba(48,210,255,.14),transparent 40%),linear-gradient(145deg,rgba(42,23,85,.95),rgba(8,19,40,.96))}.px-icon{font-size:28px}.px-card h3{font-size:22px;margin:18px 0 8px}.px-card p{color:#93a3c5;line-height:1.65;font-size:12px}.px-badge{display:inline-flex;margin-top:15px;padding:7px 10px;border-radius:999px;background:rgba(127,91,255,.13);border:1px solid rgba(142,112,255,.25);font-size:9px;font-weight:900;color:#c7b7ff}.px-flow{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:14px}.px-flow article{padding:20px;border-radius:22px;background:rgba(9,16,37,.86);border:1px solid rgba(120,136,183,.2)}.px-flow b{display:block;font-size:15px;margin:10px 0 6px}.px-flow small{color:#8394b8;line-height:1.5}.px-number{width:34px;height:34px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(135deg,#704cff,#1baad4);font-size:11px;font-weight:950}.px-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:14px}.px-strip div{padding:16px;border-radius:18px;background:rgba(13,21,47,.72);border:1px solid rgba(133,145,190,.17)}.px-strip strong{display:block;font-size:18px}.px-strip span{display:block;color:#8090b2;font-size:9px;margin-top:4px}
body.premium-active #finder,body.premium-active #examples,body.premium-active #how,body.premium-active #recent,body.premium-active #feedback,body.premium-active #results{border-color:rgba(117,99,218,.30);background:linear-gradient(150deg,rgba(12,18,43,.92),rgba(6,11,25,.93));box-shadow:0 28px 75px rgba(0,0,0,.28)}
body.premium-active #finder{margin-top:28px;position:relative}body.premium-active #finder:before{content:"PREMIUM SEARCH";position:absolute;right:24px;top:20px;font-size:9px;letter-spacing:.18em;color:#a58fff;font-weight:950}
body.premium-active .section-title-row h2,body.premium-active .section-heading{letter-spacing:-1.7px}
@media(max-width:900px){.px-grid{grid-template-columns:1fr 1fr}.px-card.big{grid-column:1/-1}.px-flow,.px-strip{grid-template-columns:1fr 1fr}}
@media(max-width:600px){body.premium-active #v10CommandCentre{margin:12px 10px 18px;padding:22px;border-radius:26px}.px-grid,.px-flow,.px-strip{grid-template-columns:1fr}.px-card.big{grid-column:auto}.px-card{min-height:0}#premiumExperience{width:calc(100% - 20px)}body.premium-active #v10CommandCentre:after{font-size:66px;bottom:-12px}}
`;document.head.appendChild(s);
    const centre=document.getElementById('v10CommandCentre'); if(!centre||document.getElementById('premiumExperience'))return;
    const section=document.createElement('section');section.id='premiumExperience';section.innerHTML=`<div class="px-eyebrow">THE PREMIUM EXPERIENCE</div><h2 class="px-title">More than a bigger radius.</h2><p class="px-sub">Premium is built to help you find the right product, keep track of it, compare nearby options and come back when the price or stock changes.</p><div class="px-grid"><article class="px-card big"><div class="px-icon">⚡</div><h3>Find once. Keep watching.</h3><p>Save products to your Watchlist, set a target price and re-check verified retailer data for price drops or restocks.</p><span class="px-badge">PRICE + STOCK WATCHLIST</span></article><article class="px-card"><div class="px-icon">🎯</div><h3>Search smarter</h3><p>Vision+, Exact Match, Manual Search and AI Search give you more ways to find what you actually mean.</p><span class="px-badge">4 SEARCH MODES</span></article><article class="px-card"><div class="px-icon">⌖</div><h3>Go further</h3><p>Search up to 25 km, compare stores and sort results by closest, name or best match.</p><span class="px-badge">UP TO 25 KM</span></article></div><div class="px-flow"><article><span class="px-number">01</span><b>Identify</b><small>Use a photo or named product.</small></article><article><span class="px-number">02</span><b>Compare</b><small>Check relevant nearby retailers.</small></article><article><span class="px-number">03</span><b>Save</b><small>Collections, favourites and history.</small></article><article><span class="px-number">04</span><b>Watch</b><small>Track price and stock changes.</small></article></div><div class="px-strip"><div><strong>25 km</strong><span>Premium search radius</span></div><div><strong>50</strong><span>Extended history capacity</span></div><div><strong>4</strong><span>Premium search modes</span></div><div><strong>Live</strong><span>Price & stock checks when available</span></div></div>`; centre.insertAdjacentElement('afterend',section);
  }
  function sync(){if(active())installLuxury()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();window.addEventListener('pageshow',sync);
})();