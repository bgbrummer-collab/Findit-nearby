/* FindIt Premium upgrades: desktop menu layout, deletable history/saved items, and exact-product watchlist. */
(() => {
  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const WATCH_KEY = 'findit_v10_watchlist';

  function injectDesktopMenuFix(){
    if ($('#finditPremiumUpgradeStyles')) return;
    const s=document.createElement('style');
    s.id='finditPremiumUpgradeStyles';
    s.textContent=`
      .drawer{overflow-y:auto;overflow-x:hidden}
      body.premium-active .premium-drawer-nav{display:flex!important;flex-direction:column!important;align-items:stretch!important;width:100%;gap:8px;margin-top:18px}
      .premium-drawer-nav>a,.premium-drawer-nav>button{width:100%!important;min-height:46px!important;display:flex!important;align-items:center!important;gap:10px!important;white-space:normal!important;line-height:1.25!important;padding:12px 14px!important}
      .premium-menu-title{width:100%;flex:0 0 auto}
      @media(min-width:601px){.drawer{width:min(390px,92vw)!important}.premium-drawer-nav{max-width:100%!important}.premium-drawer-nav>*{flex:0 0 auto!important}}
      .findit-row-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}
      .findit-delete-btn{border-color:#7a3545!important;background:#26111a!important;color:#ffc0cb!important}
      .findit-watch-source{display:inline-flex;margin-top:7px;padding:4px 7px;border-radius:999px;background:#ffffff0b;color:#9fb1d4;font-size:10px}
      .findit-watch-good{color:#66e0ad!important}.findit-watch-warn{color:#ffd27a!important}
      @media(max-width:600px){.findit-row-actions{justify-content:flex-start}}
    `;
    document.head.appendChild(s);
  }

  function patchDrawerCopy(){
    document.querySelectorAll('.premium-coming').forEach(b=>{
      if(/price alerts/i.test(b.textContent||'')){
        b.disabled=false;b.classList.remove('premium-coming');b.innerHTML='♢ Price & Stock Watchlist';b.onclick=()=>window.finditOpenAlertsWatchlist?.();
      }
    });
  }

  window.v10History = function(){
    let all=[]; try{all=JSON.parse(localStorage.getItem('finditRecent')||'[]');if(!Array.isArray(all))all=[]}catch{all=[]}
    if(typeof v10Open!=='function') return;
    v10Open('History+',`<p class="premium-tool-note">Premium keeps up to 50 recent finds. Delete individual items whenever you want to make space.</p><input id="v10HistorySearch" class="v10-input" placeholder="Search your recent finds"><div id="v10HistoryRows" class="v10-list"></div>`);
    const draw=()=>{
      const q=($('#v10HistorySearch')?.value||'').toLowerCase();
      const rows=all.map((x,index)=>({x,index})).filter(({x})=>`${x.name||''} ${x.query||''}`.toLowerCase().includes(q)).slice(0,50);
      const out=$('#v10HistoryRows'); if(!out)return;
      out.innerHTML=rows.length?rows.map(({x,index})=>`<div class="v10-row"><div><b>${esc(x.name||'FindIt item')}</b><br><small>${esc(x.query||'')}</small></div><div class="findit-row-actions"><button data-history-search="${index}">Search again</button><button class="findit-delete-btn" data-history-delete="${index}">Delete</button></div></div>`).join(''):'<p>No matching history.</p>';
      out.querySelectorAll('[data-history-search]').forEach(b=>b.onclick=()=>{const x=all[Number(b.dataset.historySearch)];if(x?.query)window.open(`https://www.google.com/search?q=${encodeURIComponent(x.query)}`,'_blank')});
      out.querySelectorAll('[data-history-delete]').forEach(b=>b.onclick=()=>{all.splice(Number(b.dataset.historyDelete),1);localStorage.setItem('finditRecent',JSON.stringify(all));if(typeof renderRecent==='function')renderRecent();if(typeof updatePremiumDashboard==='function')updatePremiumDashboard();draw()});
    };
    draw(); $('#v10HistorySearch').oninput=draw;
  };

  window.renderPremiumSaved = function(){
    const el=$('#premiumSavedList');if(!el)return;
    let list=[];try{list=JSON.parse(localStorage.getItem('finditSaved')||'[]');if(!Array.isArray(list))list=[]}catch{list=[]}
    if(!list.length){el.innerHTML='<p class="muted">No saved items yet. Use the ♡ Save button after a FindIt search.</p>';return}
    el.innerHTML=list.map((x,i)=>`<div class="premium-saved-row"><div><b>${esc(x.name||'Saved Find')}</b><small>${esc(x.query||'Saved Find')}</small></div><div class="findit-row-actions"><button data-premium-saved-search="${i}">Search again</button><button class="findit-delete-btn" data-premium-saved-delete="${i}">Delete</button></div></div>`).join('');
    el.querySelectorAll('[data-premium-saved-search]').forEach(b=>b.onclick=()=>{const x=list[Number(b.dataset.premiumSavedSearch)];if(x?.query)window.open(`https://www.google.com/search?q=${encodeURIComponent(x.query)}`,'_blank')});
    el.querySelectorAll('[data-premium-saved-delete]').forEach(b=>b.onclick=()=>{list.splice(Number(b.dataset.premiumSavedDelete),1);localStorage.setItem('finditSaved',JSON.stringify(list));window.renderPremiumSaved();if(typeof updatePremiumDashboard==='function')updatePremiumDashboard()});
  };

  const readWatch=()=>{try{const a=JSON.parse(localStorage.getItem(WATCH_KEY)||'[]');if(!Array.isArray(a))return[];return a.map(x=>{const verified=Boolean(x?.nearestStore?.exactProductMatch&&x?.nearestStore?.stockVerified)||Boolean(x?.exactBranchVerified);if(!verified)return {...x,nearestStore:null,exactBranchVerified:false,branchStockVerified:false};return x})}catch{return[]}};
  const writeWatch=a=>localStorage.setItem(WATCH_KEY,JSON.stringify(a.slice(0,50)));
  const money=(n,c='ZAR')=>Number.isFinite(Number(n))&&Number(n)>0?new Intl.NumberFormat(undefined,{style:'currency',currency:c||'ZAR'}).format(Number(n)):'Price not verified';
  const stockLabel=s=>s==='in_stock'?'In stock':s==='out_of_stock'?'Out of stock':s==='preorder'?'Pre-order':'Stock not verified';
  const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const retailerName=o=>typeof o?.retailer==='string'?o.retailer:(o?.retailer?.name||'');
  const sameRetailer=(a,b)=>{a=norm(a);b=norm(b);if(!a||!b)return false;const aw=a.split(' ').filter(x=>x.length>2),bw=b.split(' ').filter(x=>x.length>2);return aw.some(x=>bw.includes(x))||a.includes(b)||b.includes(a)};

  function nearestVerifiedExactStore(){
    const stores=(typeof state!=='undefined'&&Array.isArray(state.stores))?state.stores:[];
    return stores.filter(s=>s?.exactProductMatch===true&&s?.stockVerified===true&&Number.isFinite(Number(s.distanceKm))).sort((a,b)=>Number(a.distanceKm)-Number(b.distanceKm))[0]||null;
  }
  function currentWatchItem(){
    const i=(typeof state!=='undefined'&&state.result?.identification)||{};
    const offers=(typeof productIntelligence!=='undefined'&&Array.isArray(productIntelligence?.offers))?productIntelligence.offers:[];
    const near=nearestVerifiedExactStore();
    const localMatch=near?offers.filter(o=>sameRetailer(retailerName(o),near.name)):[];
    const best=(localMatch.length?localMatch:offers).filter(o=>o&&(o.price!=null||o.availability)).sort((a,b)=>Number(b.matchScore||b.match||0)-Number(a.matchScore||a.match||0))[0]||{};
    return {name:i.name||i.object||'Current Find',query:i.searchQuery||i.name||i.object||'',brand:i.brand||'',model:i.model||'',addedAt:new Date().toISOString(),baselinePrice:Number(best.price)>0?Number(best.price):null,lastPrice:Number(best.price)>0?Number(best.price):null,currency:best.currency||'ZAR',lastStock:best.availability||null,retailer:retailerName(best)||'',productUrl:best.product_url||best.url||'',nearestStore:near?{name:near.name,distanceKm:near.distanceKm,address:near.address||'',website:near.website||'',exactProductMatch:true,stockVerified:true}:null,exactBranchVerified:Boolean(near),branchStockVerified:Boolean(near&&best.branchStockVerified),alertPriceDrop:true,alertBackInStock:true,targetPrice:null,lastCheckedAt:null,lastAlert:null};
  }

  async function checkItem(item){
    const body={query:item.query,name:item.name,brand:item.brand,model:item.model};
    const r=await fetch('/api/product-intelligence',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Could not check this product.');
    const offers=Array.isArray(d.offers)?d.offers:[];
    const near=nearestVerifiedExactStore();
    const local=near?offers.filter(o=>sameRetailer(retailerName(o),near.name)):[];
    const best=(local.length?local:offers).filter(o=>o&&(o.price!=null||o.availability)).sort((a,b)=>Number(b.matchScore||b.match||0)-Number(a.matchScore||a.match||0))[0]||null;
    const now=new Date().toISOString();
    if(!best)return {...item,nearestStore:near?{name:near.name,distanceKm:near.distanceKm,address:near.address||'',website:near.website||'',exactProductMatch:true,stockVerified:true}:null,exactBranchVerified:Boolean(near),branchStockVerified:false,lastCheckedAt:now,lastAlert:'No verified exact price or stock update yet'};
    const p=Number(best.price)>0?Number(best.price):null,st=best.availability||null,branch=Boolean(near&&best.branchStockVerified),sourceRetailer=retailerName(best)||item.retailer;
    let msg=null;
    if(item.alertPriceDrop&&p!=null&&item.lastPrice!=null&&p<Number(item.lastPrice))msg=`Price dropped to ${money(p,best.currency||item.currency)}.`;
    if(item.alertPriceDrop&&item.targetPrice!=null&&p!=null&&p<=Number(item.targetPrice))msg=`Target price reached: ${money(p,best.currency||item.currency)}.`;
    if(item.alertBackInStock&&st==='in_stock'&&item.lastStock&&item.lastStock!=='in_stock')msg=branch?'Back in stock at the verified local retailer.':'Back in stock on the retailer listing.';
    if(msg&&'Notification'in window&&Notification.permission==='granted'){try{new Notification('FindIt Premium alert',{body:`${item.name}: ${msg}`})}catch{}}
    return {...item,lastPrice:p??item.lastPrice,lastStock:st??item.lastStock,currency:best.currency||item.currency,retailer:sourceRetailer,productUrl:best.product_url||best.url||item.productUrl,nearestStore:near?{name:near.name,distanceKm:near.distanceKm,address:near.address||'',website:near.website||'',exactProductMatch:true,stockVerified:true}:null,exactBranchVerified:Boolean(near),branchStockVerified:branch,lastCheckedAt:now,lastAlert:msg||'Checked latest available retailer data'};
  }

  function openWatch(){
    const body=$('#v10ModalBody'),modal=$('#v10UniversalModal');if(!body||!modal)return;
    let list=readWatch();writeWatch(list);
    body.innerHTML=`<p class="premium-home-kicker">★ PREMIUM LOCAL WATCH</p><h2>Exact price & stock tracker</h2><p class="premium-tool-note">FindIt tracks the exact identified product. A physical retailer is shown here only when FindIt has a verified exact-product branch match. Generic category stores are never used as proof of availability.</p><div class="v10-actions"><button id="watchAddCurrent2">+ Add current product</button><button id="watchCheckAll2" ${list.length?'':'disabled'}>Check all now</button><button id="watchAlerts2">Enable browser alerts</button></div><div class="v10-list" style="margin-top:15px">${list.length?list.map((x,i)=>`<div class="v10-row" style="align-items:flex-start"><div style="flex:1"><b>${esc(x.name)}</b><br><small>${esc([x.brand,x.model].filter(Boolean).join(' • '))}</small>${x.nearestStore&&x.exactBranchVerified?`<br><small>Verified exact-product branch: ${esc(x.nearestStore.name)}${Number.isFinite(Number(x.nearestStore.distanceKm))?` • ${Number(x.nearestStore.distanceKm).toFixed(1)} km`:''}</small>`:'<br><small>No verified exact-product branch matched yet</small>'}<br><small>Listing: ${esc(x.retailer||'Not matched yet')}</small><br><small>Price: ${esc(money(x.lastPrice,x.currency))} • ${esc(stockLabel(x.lastStock))}</small><br><span class="findit-watch-source ${x.branchStockVerified?'findit-watch-good':'findit-watch-warn'}">${x.branchStockVerified?'✓ Store-level stock verified':'Exact branch stock not verified'}</span>${x.lastAlert?`<br><small>${esc(x.lastAlert)}</small>`:''}<div style="margin-top:8px"><label><small>Target price</small><br><input data-watch-target2="${i}" class="v10-input" style="max-width:180px;margin:4px 0" type="number" min="0" step="0.01" value="${x.targetPrice??''}" placeholder="Optional"></label></div>${x.productUrl?`<a href="${esc(x.productUrl)}" target="_blank" rel="noopener noreferrer">Open exact retailer listing →</a>`:''}</div><div class="findit-row-actions"><button data-watch-check2="${i}">Check now</button><button class="findit-delete-btn" data-watch-remove2="${i}">Remove</button></div></div>`).join(''):'<p>No products are being watched yet. Search for an item first, then add it here.</p>'}</div>`;
    modal.classList.remove('hidden');
    $('#watchAddCurrent2').onclick=()=>{const x=currentWatchItem();if(!x.query)return alert('Run a FindIt search first.');list=readWatch();const k=norm(`${x.brand} ${x.model} ${x.query}`);const n=list.findIndex(v=>norm(`${v.brand} ${v.model} ${v.query}`)===k);if(n>=0)list[n]={...list[n],...x,addedAt:list[n].addedAt||x.addedAt};else list.unshift(x);writeWatch(list);openWatch()};
    $('#watchCheckAll2').onclick=async e=>{const b=e.currentTarget;b.disabled=true;b.textContent='Checking…';list=readWatch();for(let i=0;i<list.length;i++){try{list[i]=await checkItem(list[i])}catch{}}writeWatch(list);openWatch()};
    $('#watchAlerts2').onclick=async()=>{if(!('Notification'in window))return alert('Browser notifications are not supported here.');const p=await Notification.requestPermission();alert(p==='granted'?'Browser alerts enabled ✓':'Notifications were not enabled.')};
    body.querySelectorAll('[data-watch-check2]').forEach(b=>b.onclick=async()=>{const i=Number(b.dataset.watchCheck2);b.disabled=true;b.textContent='Checking…';list=readWatch();try{list[i]=await checkItem(list[i]);writeWatch(list)}catch(e){alert(e.message||'Could not check this product.')}openWatch()});
    body.querySelectorAll('[data-watch-remove2]').forEach(b=>b.onclick=()=>{list=readWatch();list.splice(Number(b.dataset.watchRemove2),1);writeWatch(list);openWatch()});
    body.querySelectorAll('[data-watch-target2]').forEach(inp=>inp.onchange=()=>{list=readWatch();const i=Number(inp.dataset.watchTarget2);if(list[i]){list[i].targetPrice=inp.value===''?null:Number(inp.value);writeWatch(list)}});
  }
  window.finditOpenAlertsWatchlist=openWatch;

  function init(){injectDesktopMenuFix();patchDrawerCopy();setTimeout(patchDrawerCopy,500);setTimeout(patchDrawerCopy,1600)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();