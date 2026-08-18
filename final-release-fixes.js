/* Final FindIt release hardening: share deep-links, shared-result restore, school-uniform routing/display, and mobile Watchlist layout. */
(()=>{
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clampText=(v,n=180)=>String(v??'').trim().slice(0,n);

  function injectStyles(){
    if($('#finditFinalReleaseStyles'))return;
    const s=document.createElement('style');s.id='finditFinalReleaseStyles';s.textContent=`
      .findit-shared-banner{margin:0 0 16px;padding:12px 14px;border:1px solid rgba(106,226,255,.25);background:rgba(20,184,220,.08);border-radius:14px;color:#d9f8ff}
      .findit-shared-banner b{display:block;margin-bottom:3px}
      .findit-school-card strong{overflow-wrap:anywhere}
      @media(max-width:600px){
        .findit-watch-modal .v10-list>.v10-row{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:12px!important;align-items:stretch!important;padding:14px!important}
        .findit-watch-modal .v10-list>.v10-row>div:first-child{width:100%!important;min-width:0!important;max-width:none!important}
        .findit-watch-modal .v10-list>.v10-row>div:first-child>b{display:block!important;font-size:15px!important;line-height:1.35!important;overflow-wrap:anywhere!important;word-break:normal!important}
        .findit-watch-modal .findit-row-actions{width:100%!important;display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;margin-top:2px!important}
        .findit-watch-modal .findit-row-actions button{width:100%!important;min-height:42px!important;margin:0!important}
        .findit-watch-modal [data-watch-target2]{width:100%!important;max-width:100%!important;box-sizing:border-box!important}
        .findit-watch-modal .findit-watch-source{display:block!important;line-height:1.35!important;white-space:normal!important}
      }
    `;document.head.appendChild(s);
  }

  function enc(obj){
    try{const bytes=new TextEncoder().encode(JSON.stringify(obj));let bin='';for(const b of bytes)bin+=String.fromCharCode(b);return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}catch{return''}
  }
  function dec(v){
    try{let s=String(v||'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const bin=atob(s),bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));return JSON.parse(new TextDecoder().decode(bytes))}catch{return null}
  }
  function currentId(){try{return state?.result?.identification||null}catch{return null}}
  function sharePayload(){
    const i=currentId();if(!i)return null;
    const p={v:1,name:clampText(i.name||i.object),object:clampText(i.object),brand:clampText(i.brand),model:clampText(i.model),category:clampText(i.category),retailCategory:clampText(i.retailCategory),query:clampText(i.searchQuery||i.name||i.object),summary:clampText(i.summary,300),confidence:Number(i.confidence||0)||null,schoolName:clampText(i.schoolName),uniformItem:clampText(i.uniformItem),likelyStoreTypes:Array.isArray(i.likelyStoreTypes)?i.likelyStoreTypes.slice(0,5).map(x=>clampText(x,100)):[]};
    return p.query?p:null;
  }
  function shareUrl(p){const u=new URL(location.origin+location.pathname);u.searchParams.set('find',enc(p));u.hash='results';return u.toString()}
  async function shareCurrent(){
    const p=sharePayload();if(!p){if(typeof setStatus==='function')setStatus('Run a FindIt search first.',true);return}
    const url=shareUrl(p),text=`FindIt found: ${p.name||p.query}`;
    try{
      if(navigator.share)await navigator.share({title:'FindIt Nearby',text,url});
      else{await navigator.clipboard.writeText(`${text}\n${url}`);if(typeof setStatus==='function')setStatus('✓ Shared Find link copied.')}
    }catch(e){if(e?.name!=='AbortError'&&typeof setStatus==='function')setStatus('Sharing unavailable.',true)}
  }

  async function restoreShared(){
    const raw=new URLSearchParams(location.search).get('find');if(!raw)return;
    const p=dec(raw);if(!p?.query)return;
    const i={object:p.object||p.name||'Shared item',name:p.name||p.query,brand:p.brand||null,model:p.model||null,category:p.category||'Product',retailCategory:p.retailCategory||p.category||'product',searchQuery:p.query,summary:p.summary||'A FindIt result shared with you.',confidence:Number.isFinite(Number(p.confidence))?Number(p.confidence):.9,visibleText:[],features:[],likelyStoreTypes:Array.isArray(p.likelyStoreTypes)?p.likelyStoreTypes:[],schoolName:p.schoolName||null,uniformItem:p.uniformItem||null,sharedResult:true};
    try{
      if(typeof resetResults==='function')resetResults();
      state.result={identification:i,offers:[],shared:true};state.offers=[];
      if(typeof renderIdentification==='function')renderIdentification(i);
      if(typeof renderFreeActions==='function')renderFreeActions(i);
      if(typeof loadProductIntelligence==='function')loadProductIntelligence(i);
      if(typeof saveRecent==='function')saveRecent(i);
      const r=$('#results');if(r){r.classList.remove('hidden');const head=r.querySelector('.result-header')||r.firstElementChild;if(head&&!r.querySelector('.findit-shared-banner')){const b=document.createElement('div');b.className='findit-shared-banner';b.innerHTML=`<b>↗ Shared Find</b><span>${esc(i.name)} — this exact product query was shared with you.</span>`;head.parentNode.insertBefore(b,head)}}
      if(typeof setStatus==='function')setStatus('Shared Find opened. Use your location to check nearby verified retailers.');
      if(state.coords&&typeof loadNearby==='function')await loadNearby(i,state.radius);
      setTimeout(()=>r?.scrollIntoView({behavior:'smooth',block:'start'}),150);
    }catch(e){console.warn('Shared Find restore failed',e)}
  }

  function patchSchool(){
    try{
      if(typeof retailerQuery==='function'&&!retailerQuery.__finditSchool){const old=retailerQuery;const next=function(i){const t=[i?.schoolName,i?.uniformItem,i?.retailCategory,i?.category,i?.searchQuery,i?.name].filter(Boolean).join(' ');if(/\b(school|uniform|blazer|school jersey|school tie)\b/i.test(t))return `${i?.schoolName?i.schoolName+' ':''}school uniform shop`;return old(i)};next.__finditSchool=true;retailerQuery=next}
      if(typeof renderIdentification==='function'&&!renderIdentification.__finditSchool){const old=renderIdentification;const next=function(i){old(i);if(!i?.schoolName&&!i?.uniformItem)return;const a=$('#analysis');if(!a)return;if(i.schoolName)a.insertAdjacentHTML('afterbegin',`<div class="analysis-card findit-school-card"><span>School</span><strong>${esc(i.schoolName)}</strong></div>`);if(i.uniformItem)a.insertAdjacentHTML('afterbegin',`<div class="analysis-card findit-school-card"><span>Uniform item</span><strong>${esc(i.uniformItem)}</strong></div>`)};next.__finditSchool=true;renderIdentification=next}
    }catch(e){console.warn('School routing patch unavailable',e)}
  }

  function watchModalClass(){const m=$('#v10UniversalModal'),b=$('#v10ModalBody');if(!m||!b)return;const is=/Exact price\s*&\s*stock tracker|Price drops\s*&\s*stock alerts/i.test(b.textContent||'');m.classList.toggle('findit-watch-modal',is)}

  function wire(){
    injectStyles();patchSchool();
    const mo=new MutationObserver(watchModalClass);const b=$('#v10ModalBody');if(b)mo.observe(b,{childList:true,subtree:true,characterData:true});watchModalClass();
    document.addEventListener('click',e=>{
      const share=e.target.closest?.('#shareFind,[data-v10="share"]');if(!share)return;e.preventDefault();e.stopImmediatePropagation();shareCurrent();
    },true);
    const loc=$('#location');if(loc)loc.addEventListener('click',()=>setTimeout(()=>{try{const i=currentId();if(i?.sharedResult&&state.coords&&typeof loadNearby==='function')loadNearby(i,state.radius)}catch{}},900));
    restoreShared();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire,{once:true});else wire();
})();