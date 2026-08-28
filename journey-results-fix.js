/* FindIt journey result fixes: functional Online/In-store tabs, richer product info,
   truthful retailer fallbacks, and better nearest-store map fallback. */
(()=>{
'use strict';
if(window.__finditJourneyResultsFixV1)return;
window.__finditJourneyResultsFixV1=true;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validUrl=v=>{try{return /^https?:$/.test(new URL(v,location.href).protocol)}catch{return false}};
const money=(n,c='ZAR')=>{if(n==null||!Number.isFinite(Number(n)))return'';try{return new Intl.NumberFormat('en-ZA',{style:'currency',currency:c||'ZAR'}).format(Number(n))}catch{return `${c||'ZAR'} ${Number(n).toFixed(2)}`}};
const root=()=>$('#finditJourneyV5');

function identification(){try{return window.state?.result?.identification||{}}catch{return{}}}
function stores(){try{return Array.isArray(window.state?.stores)?window.state.stores:[]}catch{return[]}}
function offers(){
  const rows=[];
  try{if(Array.isArray(window.state?.offers))rows.push(...window.state.offers)}catch{}
  try{if(Array.isArray(window.productIntelligence?.offers))rows.push(...window.productIntelligence.offers)}catch{}
  const seen=new Set();
  return rows.filter(o=>{
    if(!o)return false;
    const k=`${o.retailer?.name||o.retailer||''}|${o.product_url||o.url||''}|${o.price??''}`;
    if(seen.has(k))return false;seen.add(k);return true;
  });
}
function retailerSearches(){
  const rows=[];
  try{
    for(const x of window.productIntelligence?.webRetailers||[]){
      if(validUrl(x.searchUrl))rows.push({name:x.name||'Retailer',url:x.searchUrl});
    }
  }catch{}
  for(const a of $$('#exactSellerResults a[href],#freeActions a[href]')){
    if(validUrl(a.href))rows.push({name:a.querySelector('strong')?.textContent?.trim()||a.textContent.replace(/Search this product|Open product page|→/gi,'').trim()||'Retailer',url:a.href});
  }
  const seen=new Set();
  return rows.filter(x=>{if(!x.url||seen.has(x.url))return false;seen.add(x.url);return true}).slice(0,10);
}
function confidence(i){
  const n=Number(i?.confidence);
  if(Number.isFinite(n))return Math.round(n<=1?n*100:n);
  const x=String($('#confidenceValue')?.textContent||'').replace(/[^0-9.]/g,'');
  return x||'—';
}
function inferredCategory(i){
  const given=String(i?.retailCategory||i?.category||'').trim();
  if(given&&!/^(product|item|general)$/i.test(given))return given;
  const s=[i?.object,i?.name,i?.model,i?.searchQuery].filter(Boolean).join(' ').toLowerCase();
  if(/toilet paper|bread|milk|cereal|food|grocery|detergent|cleaning/.test(s))return'Grocery / household';
  if(/speaker|headphone|phone|computer|camera|router|bluetooth/.test(s))return'Electronics';
  if(/toaster|kettle|microwave|vacuum|fridge/.test(s))return'Appliances';
  if(/shoe|sneaker|samba|footwear|trainer/.test(s))return'Footwear';
  if(/wrench|spanner|drill|hammer|screwdriver|pliers|tool/.test(s))return'Hardware / tools';
  if(/plug|adaptor|adapter|power strip|extension lead/.test(s))return'Electrical';
  if(/conditioner|shampoo|skincare|cosmetic|beauty/.test(s))return'Beauty / personal care';
  if(/car|vehicle|suv|sedan|coupe|mercedes/.test(s))return'Automotive';
  return given||'Product';
}

function style(){
  if($('#finditJourneyResultsFixStyle'))return;
  const s=document.createElement('style');s.id='finditJourneyResultsFixStyle';
  s.textContent=`
  #finditJourneyV5 .fj-tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;background:#10192a;border-radius:14px;padding:4px;margin:10px 0 16px}
  #finditJourneyV5 .fj-tabs button{border:0;border-radius:10px;padding:10px;background:transparent;color:#8997aa;font:inherit;cursor:pointer}
  #finditJourneyV5 .fj-tabs button.active{background:#1b4483;color:#fff}
  #finditJourneyV5 .fj-fix-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}
  #finditJourneyV5 .fj-fix-cell{padding:10px;border:1px solid #202d43;border-radius:11px;background:#0d1728;min-width:0}
  #finditJourneyV5 .fj-fix-cell span,#finditJourneyV5 .fj-fix-cell strong{display:block}
  #finditJourneyV5 .fj-fix-cell span{color:#8493aa;font-size:10px}
  #finditJourneyV5 .fj-fix-cell strong{margin-top:4px;font-size:12px;overflow-wrap:anywhere}
  #finditJourneyV5 .fj-fix-note{padding:11px 12px;border-radius:12px;background:#0d1728;color:#9fb0c9;font-size:11px;line-height:1.45;margin:10px 0}
  #finditJourneyV5 .fj-fix-links{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}
  #finditJourneyV5 .fj-fix-links a{display:inline-flex;text-decoration:none;border-radius:10px;background:#15233a;color:#7ee5b4;padding:9px 11px;font-weight:800;font-size:11px}
  `;
  document.head.appendChild(s);
}

function priceCards(mode){
  const r=root();if(!r)return;
  const oldCards=$$('.fj-card,.fj-fix-note',r).filter(x=>!x.closest('.fj-topbar'));
  oldCards.forEach(x=>x.remove());
  const back=$('.fj-secondary[data-fj="actions"]',r);
  const insert=html=>{const box=document.createElement('div');box.innerHTML=html;while(box.firstChild)r.querySelector('.fj-page')?.insertBefore(box.firstChild,back||null)};
  if(mode==='online'){
    const priced=offers().filter(o=>(o.verified===true||o.sourcePageVerified===true)&&Number.isFinite(Number(o.price)));
    if(priced.length){
      insert(priced.sort((a,b)=>Number(a.price)-Number(b.price)).slice(0,12).map(o=>{
        const name=o.retailer?.name||o.retailer||'Retailer',url=o.product_url||o.url||'',availability=String(o.availability||'').replace(/_/g,' ');
        return `<div class="fj-card"><div class="fj-row"><div><h3>${esc(name)}</h3><div class="fj-green">Verified current listing</div>${availability?`<div class="fj-muted">${esc(availability)}</div>`:''}</div><div class="fj-price">${esc(money(o.price,o.currency||'ZAR'))}</div></div>${validUrl(url)?`<button class="fj-link" data-fix-open="${esc(url)}">View product</button>`:''}</div>`;
      }).join(''));
    }else{
      const links=retailerSearches();
      insert(`<div class="fj-fix-note">No trustworthy current price was verified yet. FindIt will not invent one.${links.length?' You can still check the identified product at relevant retailers below.':''}</div>${links.map(x=>`<div class="fj-card"><h3>${esc(x.name)}</h3><div class="fj-muted">Current price not verified by FindIt yet.</div><button class="fj-link" data-fix-open="${esc(x.url)}">Search this retailer</button></div>`).join('')}`);
    }
  }else{
    const all=stores();
    const verified=all.filter(s=>s.branchPriceVerified===true&&Number.isFinite(Number(s.price)));
    if(verified.length){
      insert(verified.slice(0,12).map(s=>`<div class="fj-card"><div class="fj-row"><div><h3>${esc(s.name||'Store')}</h3><div class="fj-green">Verified branch price</div><div class="fj-muted">${esc([Number.isFinite(Number(s.distanceKm))?`${Number(s.distanceKm).toFixed(1)} km`:'',s.address||''].filter(Boolean).join(' • '))}</div></div><div class="fj-price">${esc(money(s.price,s.currency||'ZAR'))}</div></div></div>`).join(''));
    }else if(all.length){
      insert(`<div class="fj-fix-note">Nearby retailers were found, but FindIt does not have branch-specific prices for this exact item. These are nearby possibilities, not stock or price claims.</div>${all.slice(0,10).map(s=>`<div class="fj-card"><h3>${esc(s.name||'Store')}</h3><div class="fj-muted">${esc([Number.isFinite(Number(s.distanceKm))?`${Number(s.distanceKm).toFixed(1)} km`:'',s.address||''].filter(Boolean).join(' • '))}</div><span class="fj-badge">Branch price not verified</span>${Number.isFinite(Number(s.lat))&&Number.isFinite(Number(s.lon))?`<button class="fj-link" data-fix-open="${esc(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.lat},${s.lon}`)}`)}">Map</button>`:''}</div>`).join('')}`);
    }else{
      insert('<div class="fj-card"><h3>No in-store price data yet</h3><div class="fj-muted">No branch-specific price or stock data was returned for this item.</div></div>');
    }
  }
}
function patchPrices(r){
  const h=$('.fj-head b',r);if(!h||h.textContent.trim()!=='Compare Prices')return;
  const tabs=$('.fj-tabs',r);if(!tabs)return;
  if(!tabs.querySelector('button')){
    tabs.innerHTML='<button type="button" class="active" data-fix-price="online">Online</button><button type="button" data-fix-price="store">In-store</button>';
  }
}
function patchProduct(r){
  const h=$('.fj-head b',r);if(!h||h.textContent.trim()!=='Product Information'||r.dataset.productEnhanced==='1')return;
  r.dataset.productEnhanced='1';
  const i=identification(),page=$('.fj-page',r),back=$('.fj-secondary[data-fj="actions"]',r);if(!page)return;
  const rows=[
    ['Brand',i.brand],['Model / variant',i.model],['Category',inferredCategory(i)],
    ['Search identity',i.searchQuery||i.query||i.name||i.object],
    ['Identity status',i.exactIdentityVerified===true?'Photo identity verified':'AI identification — retailer verification separate']
  ].filter(([,v])=>v);
  const features=Array.isArray(i.features)?i.features.filter(Boolean).slice(0,8):[];
  const visible=Array.isArray(i.visibleText)?i.visibleText.filter(Boolean).slice(0,8):[];
  const evidence=Array.isArray(i.exactIdentityEvidence)?i.exactIdentityEvidence.filter(Boolean).slice(0,6):[];
  const links=retailerSearches();
  const wrap=document.createElement('div');wrap.className='findit-product-extra';
  wrap.innerHTML=`<div class="fj-card"><h3>Product details</h3><div class="fj-fix-grid">${rows.map(([k,v])=>`<div class="fj-fix-cell"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}</div></div>${features.length?`<div class="fj-card"><h3>Key details</h3>${features.map(x=>`<div class="fj-muted">✓ ${esc(x)}</div>`).join('')}</div>`:''}${visible.length?`<div class="fj-card"><h3>Text visible on the product</h3><div class="fj-muted">${visible.map(esc).join(' • ')}</div></div>`:''}${evidence.length?`<div class="fj-card"><h3>Identification evidence</h3>${evidence.map(x=>`<div class="fj-muted">• ${esc(x)}</div>`).join('')}</div>`:''}${links.length?`<div class="fj-card"><h3>Retailers to check</h3><div class="fj-muted">These links search the identified item. Prices are shown separately only when verified.</div><div class="fj-fix-links">${links.slice(0,6).map(x=>`<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.name)}</a>`).join('')}</div></div>`:''}<div class="fj-fix-note">Identification confidence: ${esc(confidence(i))}%. Product identity, online price, branch stock and branch price are separate checks.</div>`;
  page.insertBefore(wrap,back||null);
}
function patchStores(r){
  const h=$('.fj-head b',r);if(!h||h.textContent.trim()!=='Nearest Stores')return;
  const empty=$('.fj-map-empty',r);if(!empty||empty.dataset.fixed==='1')return;
  const s=stores().find(x=>Number.isFinite(Number(x.lat))&&Number.isFinite(Number(x.lon)));
  const mapButton=$('.fj-card [data-open*="google.com/maps"],.fj-card [data-open*="openstreetmap"]',r);
  if(s){
    const url=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.lat},${s.lon}`)}`;
    empty.innerHTML=`Map preview is unavailable here.<br><button class="fj-link" data-fix-open="${esc(url)}">Open nearest store map</button>`;
    empty.dataset.fixed='1';
  }else if(mapButton?.dataset.open){
    empty.innerHTML=`Map preview is unavailable here.<br><button class="fj-link" data-fix-open="${esc(mapButton.dataset.open)}">Open nearest store map</button>`;
    empty.dataset.fixed='1';
  }
}
let queued=false;
function patch(){
  const r=root();if(!r||r.classList.contains('hidden'))return;
  style();patchPrices(r);patchProduct(r);patchStores(r);
}
function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;patch()})}
document.addEventListener('click',e=>{
  const price=e.target.closest?.('[data-fix-price]');
  if(price){e.preventDefault();e.stopImmediatePropagation();const r=root();$$('[data-fix-price]',r).forEach(b=>b.classList.toggle('active',b===price));priceCards(price.dataset.fixPrice);return}
  const open=e.target.closest?.('[data-fix-open]');
  if(open){e.preventDefault();e.stopImmediatePropagation();if(validUrl(open.dataset.fixOpen))window.open(open.dataset.fixOpen,'_blank','noopener')}
},true);
function init(){
  style();
  const observer=new MutationObserver(queue);
  const attach=()=>{const r=root();if(r&&!r.dataset.resultsFixObserved){r.dataset.resultsFixObserved='1';observer.observe(r,{childList:true,subtree:true});queue()}};
  attach();setTimeout(attach,300);setTimeout(attach,1200);
  document.addEventListener('findit:results-rendered',queue);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();