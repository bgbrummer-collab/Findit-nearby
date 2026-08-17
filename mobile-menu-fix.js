(() => {
  function injectMobileDrawerStyles(){
    if(document.getElementById('findit-mobile-drawer-fix'))return;
    const style=document.createElement('style');style.id='findit-mobile-drawer-fix';style.textContent=`
      @media (max-width:760px){#drawer.drawer{width:min(88vw,390px)!important;max-width:390px!important;height:100dvh!important;overflow-y:auto!important;overflow-x:hidden!important;padding:22px 18px 110px!important;box-sizing:border-box!important}#drawer .drawer-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:14px!important;width:100%!important;margin-bottom:22px!important}#drawer .drawer-nav,#drawer #premiumDrawerNav{width:100%!important;display:flex!important;flex-direction:column!important;gap:9px!important}#drawer .drawer-nav>a,#drawer .drawer-nav>button,#drawer #premiumDrawerNav>a,#drawer #premiumDrawerNav>button{display:flex!important;width:100%!important;min-height:50px!important;align-items:center!important;justify-content:flex-start!important;box-sizing:border-box!important;white-space:normal!important;padding:13px 15px!important;border-radius:16px!important}#drawer #premiumDrawerNav{display:none!important}body.premium-active #drawer #premiumDrawerNav,body.premium-v10 #drawer #premiumDrawerNav{display:flex!important}}
      .findit-useful-fallback{padding:18px;border:1px solid rgba(120,145,220,.22);border-radius:18px;background:rgba(16,25,45,.55)}.findit-useful-fallback h4{margin:0 0 6px;font-size:17px}.findit-useful-fallback p{margin:0 0 14px;opacity:.76;font-size:13px;line-height:1.5}.findit-fallback-actions{display:flex;gap:9px;flex-wrap:wrap}.findit-fallback-actions a,.findit-fallback-actions button{border:1px solid rgba(110,130,255,.35);background:rgba(85,110,255,.16);color:inherit;text-decoration:none;padding:10px 13px;border-radius:12px;font-weight:800;cursor:pointer}.findit-fallback-actions a:first-child{background:linear-gradient(135deg,#6d63ff,#24c7ed);color:#fff}`;document.head.appendChild(style);
  }
  function identification(){try{return state?.result?.identification||{}}catch{return {}}}
  function currentQuery(){const i=identification();return String(i.searchQuery||i.name||i.object||'').trim()}
  function brandStoreTerm(){
    const i=identification(),brand=String(i.brand||'').trim(),q=currentQuery().toLowerCase();
    const b=brand.toLowerCase();
    if(b==='nike'||q.includes('nike '))return 'Nike Factory Store';
    if(b==='adidas'||q.includes('adidas '))return 'adidas store';
    if(b==='puma'||q.includes('puma '))return 'PUMA store';
    if(b==='new balance'||q.includes('new balance '))return 'New Balance store';
    if(b==='under armour'||q.includes('under armour '))return 'Under Armour store';
    if(b==='samsung'||q.includes('samsung '))return 'Samsung Experience Store';
    if(b==='apple'||q.includes('iphone')||q.includes('macbook'))return 'iStore';
    if(b==='huawei'||q.includes('huawei '))return 'Huawei store';
    if(b==='sony'||q.includes('sony '))return 'Sony retailer';
    if(brand)return brand+' store';
    try{if(typeof retailerQuery==='function')return retailerQuery(i)||'retailer'}catch{}
    return 'retailer';
  }
  function retailerSearchUrl(){const q=currentQuery();return `https://www.google.com/search?q=${encodeURIComponent((q||'product')+' official store South Africa')}`}
  function mapsSearchUrl(){return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(brandStoreTerm()+' near me')}`}
  function usefulFallback(title,body){const q=currentQuery();return `<div class="findit-useful-fallback"><h4>${title}</h4><p>${body}</p><div class="findit-fallback-actions"><a href="${retailerSearchUrl()}" target="_blank" rel="noopener">Search exact item online →</a><a href="${mapsSearchUrl()}" target="_blank" rel="noopener">Find ${brandStoreTerm()} near me</a>${q?'<button type="button" data-findit-correct>Correct item</button>':''}</div></div>`}
  function improveDeadEnds(){
    const noOffers=document.getElementById('noOffers');
    if(noOffers&&!noOffers.classList.contains('hidden')&&noOffers.dataset.finditFallback!=='1'){
      noOffers.dataset.finditFallback='1';
      noOffers.innerHTML=usefulFallback('Continue with retailer results','FindIt has not verified a catalogue offer yet, but you can still continue with the identified item.');
    }
    const nothing=document.getElementById('nothingFound');
    if(nothing&&!nothing.classList.contains('hidden')&&nothing.dataset.finditFallback!=='1'){
      const base=nothing.querySelector('p')?.textContent||'No verified nearby branch stock is connected yet.';
      nothing.dataset.finditFallback='1';
      nothing.innerHTML=usefulFallback('No verified branch stock yet',base);
    }
    document.querySelectorAll('[data-findit-correct]').forEach(b=>{if(b.dataset.wired)return;b.dataset.wired='1';b.onclick=()=>document.getElementById('correctSearch')?.click()});
  }
  function watchResults(){const root=document.getElementById('results');if(!root)return;let queued=false;const run=()=>{if(queued)return;queued=true;setTimeout(()=>{queued=false;improveDeadEnds()},60)};new MutationObserver(run).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});run()}
  function initFinderRecovery(){
    const choose=document.getElementById('choosePhoto'),take=document.getElementById('takePhoto'),photo=document.getElementById('photo'),camera=document.getElementById('cameraPhoto'),preview=document.getElementById('preview'),placeholder=document.getElementById('uploadPlaceholder'),search=document.getElementById('search'),status=document.getElementById('status'),location=document.getElementById('location');if(!choose||!take||!photo||!camera)return;
    const setStatus=(t,e=false)=>{if(status){status.textContent=t;status.style.color=e?'#ff9da7':''}};
    const applyFile=file=>{if(!file)return;if(!String(file.type||'').startsWith('image/'))return setStatus('Please choose an image file.',true);if(file.size>8*1024*1024)return setStatus('Please use an image smaller than 8 MB.',true);window.__finditSelectedFile=file;try{if(typeof state!=='undefined')state.file=file}catch{}if(preview){try{if(preview.src?.startsWith('blob:'))URL.revokeObjectURL(preview.src)}catch{}preview.src=URL.createObjectURL(file);preview.classList.remove('hidden')}placeholder?.classList.add('hidden');if(search)search.disabled=false;setStatus('Photo ready. You can now identify and find this item.')};
    choose.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();photo.value='';photo.click()},true);
    take.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();camera.value='';camera.click()},true);
    photo.addEventListener('change',()=>applyFile(photo.files?.[0]),true);camera.addEventListener('change',()=>applyFile(camera.files?.[0]),true);
    if(location)location.addEventListener('click',e=>{if(!navigator.geolocation)return setStatus('Location is unavailable in this browser.',true);e.preventDefault();e.stopImmediatePropagation();location.disabled=true;location.textContent='Finding location…';navigator.geolocation.getCurrentPosition(p=>{const coords={lat:p.coords.latitude,lon:p.coords.longitude};window.__finditCoords=coords;try{if(typeof state!=='undefined')state.coords=coords}catch{}location.disabled=false;location.textContent='✓ Location ready';setStatus('Location ready. Nearby search can use your selected radius.')},()=>{location.disabled=false;location.textContent='📍 Use my location';setStatus('Location permission was not granted. Identification still works.',true)},{enableHighAccuracy:true,timeout:15000,maximumAge:120000})},true);
    search?.addEventListener('click',()=>{try{if(typeof state!=='undefined'){if(!state.file&&window.__finditSelectedFile)state.file=window.__finditSelectedFile;if(!state.coords&&window.__finditCoords)state.coords=window.__finditCoords}}catch{}},true);
  }
  function init(){injectMobileDrawerStyles();watchResults();initFinderRecovery()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
