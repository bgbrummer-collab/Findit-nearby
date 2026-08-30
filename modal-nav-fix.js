(()=>{
  'use strict';
  if(window.__finditModalNavFixV4)return;window.__finditModalNavFixV4=true;
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  function premiumActive(){try{return localStorage.getItem('findit_premium_beta')==='1'||localStorage.getItem('finditPremium')==='1'||localStorage.getItem('finditPremium')==='true'||window.premiumState?.active===true||document.body.classList.contains('premium-active')}catch{return false}}
  function hidePanel(sel){const el=$(sel);if(!el)return;el.classList.add('hidden');el.removeAttribute('hidden');el.style.removeProperty('display');el.setAttribute('aria-hidden','true')}
  function closeDashboardModals(){hidePanel('#fxPanelModal');hidePanel('#fxSettingsModal')}
  function removeLegacyChrome(){const drawer=$('#drawer'),backdrop=$('#drawerBackdrop'),menu=$('#menuBtn');if(drawer){drawer.classList.add('hidden');drawer.setAttribute('aria-hidden','true')}if(backdrop)backdrop.classList.add('hidden');if(menu)menu.style.setProperty('display','none','important')}
  function syncPremiumUi(){const on=premiumActive();document.body.classList.toggle('fx-premium-already-active',on);const side=$('#fxPremiumSideButton'),bottom=$('#fxPremiumBottomButton');if(side)side.hidden=on;if(bottom)bottom.hidden=on;const card=$('.fx-premium');if(card&&on)card.setAttribute('aria-label','FindIt Premium is active')}
  const domains={'nike':'nike.com','totalsports':'totalsports.co.za','sportscene':'sportscene.co.za','makro':'makro.co.za','checkers':'checkers.co.za','pick n pay':'pnp.co.za','shoprite':'shoprite.co.za','woolworths':'woolworths.co.za','game':'game.co.za','clicks':'clicks.co.za','dis chem':'dischem.co.za','adidas':'adidas.co.za','jd sports':'jdsports.co.za','bash':'bash.com','takealot':'takealot.com','builders':'builders.co.za','incredible connection':'incredible.co.za','istore':'istore.co.za','computer mania':'computermania.co.za','sportsmans warehouse':'sportsmanswarehouse.co.za','cape union mart':'capeunionmart.co.za','outdoor warehouse':'outdoorwarehouse.co.za','mr price home':'mrphome.com','buco':'buco.co.za','mica':'mica.co.za'};
  const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  function retailerDomain(name){const n=norm(name);for(const [k,d] of Object.entries(domains)){if(n===k||n.includes(k)||k.includes(n))return d}return''}
  function logoMarkup(name,size=28){const d=retailerDomain(name);if(!d)return'';const safe=String(name||'Retailer').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');return `<img src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(d)}&sz=64" alt="${safe} logo" width="${size}" height="${size}" loading="lazy">`}
  function installStyle(){if($('#finditModalNavFixStyleV4'))return;const s=document.createElement('style');s.id='finditModalNavFixStyleV4';s.textContent=`
    #fxPanelModal,#fxSettingsModal{pointer-events:none!important}
    #fxPanelModal .fx-modal-card,#fxSettingsModal .fx-modal-card{pointer-events:auto!important;touch-action:auto!important;overscroll-behavior:contain;scrollbar-gutter:stable}
    body.findit-exact-dashboard #drawer,body.findit-exact-dashboard #drawerBackdrop,body.findit-exact-dashboard #menuBtn{display:none!important;visibility:hidden!important;pointer-events:none!important}
    body.fx-premium-already-active #fxPremiumSideButton,body.fx-premium-already-active #fxPremiumBottomButton{display:none!important}
    body.fx-premium-already-active .fx-premium{cursor:default!important}
    .fx-store-logo img,.fx-top-list .fx-store-logo img{width:100%;height:100%;object-fit:contain;border-radius:5px;background:#fff;padding:3px;box-sizing:border-box}
    #fxPanelBody .fx-offer-logo{width:36px;height:36px;display:grid;place-items:center;border:1px solid #213852;border-radius:9px;background:#fff;overflow:hidden;flex:0 0 auto;color:#07111e;font-size:10px;font-weight:900}
    #fxPanelBody .fx-offer-logo img{width:27px;height:27px;object-fit:contain}
    #fxPanelBody .fx-offer-main{display:flex;align-items:center;gap:11px;min-width:0}
    #fxPanelBody .fx-offer-main>span:last-child{min-width:0}
    #fxPanelBody .fx-offer{grid-template-columns:minmax(0,1fr) auto!important}
    #fxPanelBody .fx-compare-note{margin:7px 0 14px;color:#8193aa;font-size:11px;line-height:1.45}
  `;document.head.appendChild(s)}
  async function enrichVerifiedOffers(){let st=null;try{st=window.finditState||window.state}catch{};const i=st?.result?.identification;if(!i||!String(i.name||i.model||i.object||'').trim())return;if(Array.isArray(st?.offers)&&st.offers.some(o=>(o?.verified===true||o?.sourcePageVerified===true)&&Number.isFinite(Number(o.price))))return;const q=i.searchQuery||i.query||i.name||i.model||i.object;try{const c=new AbortController(),t=setTimeout(()=>c.abort(),18000);const r=await fetch('/api/product-intelligence-v2',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...i,query:q,searchQuery:q}),signal:c.signal});clearTimeout(t);if(!r.ok)return;const data=await r.json();if(Array.isArray(data?.offers)){st.offers=data.offers;window.productIntelligence=data;document.dispatchEvent(new CustomEvent('findit:nearby-updated'))}}catch{}}
  function decorateStoreLogos(){
    $$('.fx-store').forEach(card=>{const name=card.querySelector('b')?.textContent?.trim()||'';const box=card.querySelector('.fx-store-logo');if(box&&name&&retailerDomain(name)&&!box.querySelector('img'))box.innerHTML=logoMarkup(name,28)});
    $$('#fxTopStores button').forEach(card=>{const name=card.querySelector('b')?.textContent?.trim()||'';const box=card.querySelector('.fx-store-logo');if(box&&name&&retailerDomain(name)&&!box.querySelector('img'))box.innerHTML=logoMarkup(name,28)});
  }
  function cleanCompare(){
    const body=$('#fxPanelBody');if(!body||!/^Compare Prices$/i.test(body.querySelector('.fx-panel-title')?.textContent?.trim()||''))return;
    const seen=new Set();$$('.fx-offer',body).forEach(card=>{const bold=[...card.querySelectorAll('b')];const name=bold[0]?.textContent?.trim()||'Retailer';const price=bold.map(x=>x.textContent.trim()).find(x=>/^R\s*[\d\s,.]+$/i.test(x))||'';const href=card.querySelector('a')?.href||'';let host='';try{host=new URL(href).hostname.replace(/^www\./,'')}catch{}const key=`${norm(name)}|${price.replace(/\s+/g,'')}|${host}`;if(seen.has(key)){card.remove();return}seen.add(key);const first=card.firstElementChild;if(first&&!first.classList.contains('fx-offer-main')){first.classList.add('fx-offer-main');const old=first.innerHTML;first.innerHTML=`<span class="fx-offer-logo">${logoMarkup(name,27)||name.slice(0,2).toUpperCase()}</span><span>${old}</span>`}});
    const online=[...body.querySelectorAll('h3')].find(h=>/^Online$/i.test(h.textContent.trim()));if(online&&!online.nextElementSibling?.classList?.contains('fx-compare-note')){const n=document.createElement('div');n.className='fx-compare-note';n.textContent='Duplicate listings from the same retailer at the same price are collapsed.';online.after(n)}
  }
  function refreshUi(){removeLegacyChrome();syncPremiumUi();decorateStoreLogos();cleanCompare()}
  window.addEventListener('pointerdown',e=>{const t=e.target?.closest?.('#finditExactShell [data-fx],#finditExactShell [data-fxnav]');if(!t)return;const action=t.dataset.fx||t.dataset.fxnav||'';if(!['product','compare','settings'].includes(action))closeDashboardModals();if(t.dataset.fx==='premium'&&premiumActive()){e.preventDefault();e.stopImmediatePropagation();syncPremiumUi()}},true);
  window.addEventListener('click',e=>{const t=e.target?.closest?.('#finditExactShell [data-fx],#finditExactShell [data-fxnav]');if(t&&t.dataset.fx==='premium'&&premiumActive()){e.preventDefault();e.stopImmediatePropagation();syncPremiumUi();return}if(t){setTimeout(refreshUi,0);setTimeout(refreshUi,100)}if(e.target=== $('#fxPanelModal')||e.target=== $('#fxSettingsModal'))closeDashboardModals()},true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDashboardModals()});
  document.addEventListener('findit:results-rendered',()=>{refreshUi();setTimeout(enrichVerifiedOffers,120)});
  document.addEventListener('findit:nearby-updated',()=>setTimeout(refreshUi,0));document.addEventListener('findit:dashboard-sync',()=>setTimeout(refreshUi,0));window.addEventListener('storage',refreshUi);
  function init(){installStyle();refreshUi();setTimeout(enrichVerifiedOffers,500);setTimeout(refreshUi,700)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
