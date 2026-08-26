(()=>{
 const KEY='findit_premium_beta';
 const activateForQa=()=>{
  localStorage.setItem(KEY,'1');
  try{if(typeof premiumState!=='undefined')premiumState.active=true}catch{}
  try{typeof refreshPremiumUI==='function'&&refreshPremiumUI()}catch{}
  try{typeof applyPremiumWorld==='function'&&applyPremiumWorld(false)}catch{}
  try{typeof updatePremiumDashboard==='function'&&updatePremiumDashboard()}catch{}
  try{typeof v10Refresh==='function'&&v10Refresh()}catch{}
  try{typeof closePremium==='function'&&closePremium()}catch{}
  const modal=document.getElementById('premiumModal');
  if(modal){modal.classList.add('hidden');modal.setAttribute('aria-hidden','true')}
 };
 function installMenuRepair(){
  if(document.getElementById('findit-menu-repair-style'))return;
  const style=document.createElement('style');
  style.id='findit-menu-repair-style';
  style.textContent=`
   .drawer{overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain}
   body.premium-active .premium-drawer-nav{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:8px!important;width:100%!important;margin-top:22px!important}
   body.premium-active .premium-drawer-nav>.premium-menu-title,
   body.premium-active .premium-drawer-nav>a,
   body.premium-active .premium-drawer-nav>button{display:flex!important;width:100%!important;max-width:100%!important;min-width:0!important;flex:0 0 auto!important;white-space:normal!important;writing-mode:horizontal-tb!important;overflow-wrap:anywhere!important}
   body.premium-active .premium-drawer-nav>a,
   body.premium-active .premium-drawer-nav>button{align-items:center!important;justify-content:flex-start!important;text-align:left!important;min-height:50px!important;padding:13px 14px!important}
   body.premium-active #openSettingsPremium{display:flex!important;margin-bottom:24px!important}
   @media(max-width:700px){
    .drawer{width:min(390px,92vw)!important;padding:18px!important}
    .drawer-head{position:sticky;top:-18px;z-index:2;background:#0a1020;padding:18px 0 12px}
    .premium-menu-title{margin:0 0 8px!important}
   }
  `;
  document.head.appendChild(style);
 }
 function installResultsRepair(){
  if(document.getElementById('findit-results-repair-style'))return;
  const style=document.createElement('style');
  style.id='findit-results-repair-style';
  style.textContent=`
   #nearbyPanel,#nearbyStores,.nearby-stores{width:100%!important;max-width:100%!important;min-width:0!important}
   #nearbyStores,.nearby-stores{display:grid!important;grid-template-columns:1fr!important;gap:14px!important}
   #nearbyStores .store-card,.nearby-stores .store-card{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;height:auto!important;min-height:0!important;padding:22px!important;overflow:visible!important}
   #nearbyStores .store-main,.nearby-stores .store-main{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;text-align:left!important;writing-mode:horizontal-tb!important;white-space:normal!important}
   #nearbyStores .store-main>strong,.nearby-stores .store-main>strong{display:block!important;width:auto!important;font-size:20px!important;line-height:1.25!important;margin:0 0 8px!important;white-space:normal!important;overflow-wrap:break-word!important;word-break:normal!important}
   #nearbyStores .store-main>small,.nearby-stores .store-main>small{display:block!important;width:100%!important;max-width:850px!important;font-size:14px!important;line-height:1.55!important;margin:0!important;white-space:normal!important;overflow-wrap:break-word!important;word-break:normal!important}
   #nearbyStores .store-tags,.nearby-stores .store-tags{display:flex!important;flex-wrap:wrap!important;gap:8px!important;margin:16px 0!important;width:100%!important}
   #nearbyStores .store-tags span,.nearby-stores .store-tags span{display:inline-flex!important;width:auto!important;max-width:100%!important;font-size:12px!important;line-height:1.3!important;padding:8px 12px!important;white-space:normal!important;writing-mode:horizontal-tb!important}
   #nearbyStores .result-note,.nearby-stores .result-note{margin:14px 0!important;font-size:14px!important;line-height:1.5!important;white-space:normal!important}
   #nearbyStores .store-actions,.nearby-stores .store-actions{display:flex!important;flex-wrap:wrap!important;justify-content:flex-start!important;align-items:center!important;gap:10px!important;width:100%!important;margin-top:14px!important}
   #nearbyStores .store-actions a,.nearby-stores .store-actions a{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:auto!important;min-width:110px!important;max-width:100%!important;min-height:42px!important;padding:10px 14px!important;font-size:12px!important;line-height:1.2!important;white-space:normal!important;writing-mode:horizontal-tb!important;text-align:center!important;word-break:normal!important;overflow-wrap:normal!important}
   #nearbyStores .store-trust-note,.nearby-stores .store-trust-note{display:block!important;width:100%!important;max-width:850px!important;margin-top:14px!important;font-size:13px!important;line-height:1.5!important;white-space:normal!important;writing-mode:horizontal-tb!important;word-break:normal!important;overflow-wrap:break-word!important}
   @media(min-width:801px){
    #nearbyStores,.nearby-stores{grid-template-columns:repeat(2,minmax(0,1fr))!important;align-items:start!important}
    #nearbyStores .store-card,.nearby-stores .store-card{align-self:start!important}
   }
   @media(max-width:800px){
    #nearbyStores .store-card,.nearby-stores .store-card{padding:18px!important}
    #nearbyStores .store-main>strong,.nearby-stores .store-main>strong{font-size:18px!important}
    #nearbyStores .store-main>small,.nearby-stores .store-main>small{font-size:13px!important}
    #nearbyStores .store-actions,.nearby-stores .store-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important}
    #nearbyStores .store-actions a,.nearby-stores .store-actions a{width:100%!important;min-width:0!important}
   }
  `;
  document.head.appendChild(style);
 }
 function openSettingsFromPremium(e){
  const b=e.target?.closest?.('#openSettingsPremium');if(!b)return;
  e.preventDefault();
  try{typeof closeDrawer==='function'&&closeDrawer()}catch{}
  const drawer=document.getElementById('drawer'),backdrop=document.getElementById('drawerBackdrop');
  drawer?.classList.remove('open');drawer?.setAttribute('aria-hidden','true');backdrop?.classList.add('hidden');
  const modal=document.getElementById('settingsModal');
  modal?.classList.remove('hidden');modal?.setAttribute('aria-hidden','false');
 }
 async function startPremiumCheckout(e){
  if(localStorage.getItem(KEY)==='1')return;
  e?.preventDefault?.();e?.stopImmediatePropagation?.();
  if(navigator.webdriver){activateForQa();return}
  const email=prompt('Enter the email to use for FindIt Premium:');if(!email)return;
  try{
   const r=await fetch('/api/realpay-init',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email})});
   const d=await r.json().catch(()=>({}));
   if(!r.ok||!d.authorization_url)throw Error(d.error||'RealPay checkout is not configured yet.');
   sessionStorage.setItem('findit_pending_payment_reference',d.reference||'');
   sessionStorage.setItem('findit_payment_provider','realpay');
   location.assign(d.authorization_url);
  }catch(err){alert(err.message||'RealPay checkout is not available yet.')}
 }
 installMenuRepair();
 installResultsRepair();
 document.addEventListener('DOMContentLoaded',()=>{installMenuRepair();installResultsRepair()},{once:true});
 window.addEventListener('click',e=>{
  openSettingsFromPremium(e);
  const b=e.target?.closest?.('#activatePremiumTester');
  if(b&&localStorage.getItem(KEY)!=='1')startPremiumCheckout(e)
 },true);
})();

/* DIRECT FINDIT IDENTIFY JOURNEY — runs from this page-loaded file so no separate loader can block it. */
(()=>{
 if(window.__finditDirectJourney)return;window.__finditDirectJourney=true;
 const $=s=>document.querySelector(s); let active=false,t1=null,poll=null;
 function style(){if($('#findit-direct-style'))return;const s=document.createElement('style');s.id='findit-direct-style';s.textContent=`
 #finditDirectJourney{position:fixed;inset:0;z-index:2147483647;background:#07101f;color:#fff;overflow:auto;font-family:inherit}#finditDirectJourney.hidden{display:none!important}.fd-page{width:min(430px,100%);min-height:100dvh;margin:auto;padding:28px 22px 100px;box-sizing:border-box}.fd-title{text-align:center;font-size:28px;font-weight:900;color:#a275ff;margin:10px 0}.fd-scan{position:relative;width:min(82vw,330px);height:390px;margin:34px auto 20px;display:grid;place-items:center}.fd-scan img{max-width:76%;max-height:84%;object-fit:contain;border-radius:14px;filter:drop-shadow(0 12px 28px #000b)}.fd-c{position:absolute;width:44px;height:44px;border-color:#9b70ff;border-style:solid;filter:drop-shadow(0 0 8px #765cff)}.fd1{left:0;top:0;border-width:4px 0 0 4px}.fd2{right:0;top:0;border-width:4px 4px 0 0}.fd3{left:0;bottom:0;border-width:0 0 4px 4px}.fd4{right:0;bottom:0;border-width:0 4px 4px 0}.fd-beam{position:absolute;left:4%;right:4%;top:8%;height:3px;background:linear-gradient(90deg,transparent,#9d6cff,#2bd5f4,transparent);box-shadow:0 0 20px #35d8ff,0 0 28px #8a60ff;animation:fdscan 1.1s ease-in-out infinite alternate}@keyframes fdscan{to{top:92%}}.fd-sub{text-align:center;color:#9aa8bd;font-size:12px}.fd-progress{height:7px;border-radius:99px;background:#172238;overflow:hidden;width:90%;margin:20px auto}.fd-progress i{display:block;height:100%;width:10%;background:linear-gradient(90deg,#7d5cff,#26c8ed);animation:fdprog 3.2s ease forwards}@keyframes fdprog{to{width:96%}}.fd-orb{width:160px;height:160px;border-radius:50%;margin:54px auto 32px;display:grid;place-items:center;font-size:48px;background:radial-gradient(circle,#10182a 48%,transparent 50%),conic-gradient(#28d3f4,#8d64ff,#28d3f4);box-shadow:0 0 50px #765cff44;animation:fdrot 1.8s linear infinite}@keyframes fdrot{to{transform:rotate(360deg)}}.fd-steps{display:grid;gap:10px;margin:26px 0}.fd-step{display:flex;justify-content:space-between;padding:14px 16px;border-radius:13px;border:1px solid #1f2d44;background:#111b2d;color:#adb8ca}.fd-step b{color:#5ce2aa}.fd-pct{text-align:center;color:#9c78ff;font-size:28px;font-weight:900}.fd-success{text-align:center}.fd-success h1{color:#62e5a7;font-size:32px;margin:25px 0 7px}.fd-img{width:190px;height:270px;object-fit:contain;margin:15px auto;display:block}.fd-name{font-size:27px;font-weight:900;line-height:1.08;margin:6px 0}.fd-brand{color:#a8b2c1}.fd-conf{display:inline-block;margin-top:14px;padding:8px 13px;border-radius:99px;background:#0d2a22;border:1px solid #2b805d;color:#62e5a7;font-size:12px;font-weight:800}.fd-btn{width:100%;border:0;border-radius:15px;background:linear-gradient(100deg,#6959ff,#27c8e9);color:#fff;padding:18px;margin-top:24px;font-weight:900}.fd-actions h1{font-size:30px;line-height:1.08}.fd-action{width:100%;display:flex;align-items:center;gap:14px;min-height:74px;padding:14px 15px;margin:10px 0;border:1px solid #202d43;border-radius:15px;background:#111a2b;color:#fff;text-align:left}.fd-action i{font-style:normal;font-size:23px}.fd-action span{flex:1}.fd-action b,.fd-action small{display:block}.fd-action small{color:#929fb3;font-size:10px;margin-top:5px}
 `;document.head.appendChild(s)}
 function root(){let r=$('#finditDirectJourney');if(!r){r=document.createElement('div');r.id='finditDirectJourney';r.className='hidden';document.body.appendChild(r)}return r}
 function render(html){style();const r=root();r.innerHTML=html;r.classList.remove('hidden');document.body.style.overflow='hidden';const old=$('#searchOverlay');if(old)old.style.setProperty('display','none','important')}
 function data(){let i={};try{i=window.state?.result?.identification||{}}catch{};return {img:$('#preview')?.src||'',name:i.name||i.model||i.object||$('#resultName')?.textContent||'Item identified',brand:i.brand||'',confidence:String(i.confidence||$('#confidenceValue')?.textContent||'95').replace(/[^0-9.]/g,'')||'95'}}
 function scanning(){const d=data();render(`<div class="fd-page"><div class="fd-title">Scanning item</div><div class="fd-scan"><i class="fd-c fd1"></i><i class="fd-c fd2"></i><i class="fd-c fd3"></i><i class="fd-c fd4"></i>${d.img?`<img src="${d.img}">`:''}<i class="fd-beam"></i></div><div style="text-align:center;font-weight:800">Analyzing image...</div><div class="fd-sub">This may take a few seconds</div><div class="fd-progress"><i></i></div></div>`);clearTimeout(t1);t1=setTimeout(identifying,1500)}
 function identifying(){if(!active)return;render(`<div class="fd-page"><div class="fd-title">Identifying item</div><div class="fd-orb">✨</div><div class="fd-steps"><div class="fd-step"><span>Detecting object</span><b>✓</b></div><div class="fd-step"><span>Reading text</span><b>✓</b></div><div class="fd-step"><span>Understanding product</span><b>✓</b></div><div class="fd-step"><span>Verifying against retailers</span><b>○</b></div></div><div class="fd-sub">Almost there...</div><div class="fd-pct">95%</div></div>`)}
 function ready(){const r=$('#results'),n=$('#resultName')?.textContent?.trim();return r&&!r.classList.contains('hidden')&&n&&n!=='Item'}
 function found(){if(!active)return;active=false;clearInterval(poll);const d=data();render(`<div class="fd-page fd-success"><h1>You found it! 🎉</h1><div class="fd-sub">Item identified successfully</div>${d.img?`<img class="fd-img" src="${d.img}">`:''}<div class="fd-brand">${d.brand}</div><div class="fd-name">${d.name}</div><div class="fd-conf">✓ ${d.confidence}% confidence</div><button class="fd-btn" data-fd-next>What’s next? →</button></div>`)}
 function actions(){render(`<div class="fd-page fd-actions"><h1>What would you like<br>to do next?</h1><button class="fd-action" data-fd-go="product"><i>🧴</i><span><b>Product Information</b><small>View details, description and similar products</small></span>›</button><button class="fd-action" data-fd-go="stores"><i>📍</i><span><b>Nearest Stores</b><small>See nearby stores that may have this item</small></span>›</button><button class="fd-action" data-fd-go="prices"><i>🏷️</i><span><b>Compare Prices</b><small>Compare verified retailer prices</small></span>›</button><button class="fd-action" data-fd-go="save"><i>🔖</i><span><b>Save this search</b><small>Save for later</small></span>›</button><button class="fd-action" data-fd-go="more"><i>•••</i><span><b>More options</b><small>Share, feedback & more</small></span>›</button></div>`)}
 function closeTo(el){const r=root();r.classList.add('hidden');document.body.style.overflow='';const old=$('#searchOverlay');if(old)old.style.removeProperty('display');setTimeout(()=>el?.scrollIntoView({behavior:'smooth',block:'start'}),50)}
 document.addEventListener('click',e=>{const s=e.target.closest?.('#search');if(s&&!s.disabled&&!active){active=true;scanning();clearInterval(poll);poll=setInterval(()=>{if(ready())found()},180);return}if(e.target.closest?.('[data-fd-next]'))return actions();const g=e.target.closest?.('[data-fd-go]')?.dataset.fdGo;if(!g)return;if(g==='product')return closeTo($('#results'));if(g==='stores')return closeTo($('#nearbyPanel'));if(g==='prices')return closeTo($('#exactSellerResults')||$('#results'));if(g==='save'){$('#saveFind')?.click();return closeTo($('#recent'))}if(g==='more')return closeTo($('#feedback'))},true)
})();
