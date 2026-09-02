/* FindIt nearby-results fallback + live dashboard regression repair. */
(()=>{
'use strict';
if(window.__finditNearbyResultsFallbackV2)return;window.__finditNearbyResultsFallbackV2=true;
let runToken=0,busy=false,lastKey='',intelBusy=false,intelKey='';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const getState=()=>{try{return window.finditState||window.state||null}catch{return null}};
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const keyFor=i=>[i?.brand,i?.model,i?.searchQuery,i?.name,i?.object].filter(Boolean).join('|').toLowerCase();
const validUrl=v=>{try{return /^https?:$/.test(new URL(v).protocol)}catch{return false}};
const money=(n,c='ZAR')=>{if(!Number.isFinite(Number(n)))return'';try{return new Intl.NumberFormat('en-ZA',{style:'currency',currency:c||'ZAR'}).format(Number(n))}catch{return`${c||'ZAR'} ${Number(n).toFixed(2)}`}};
function normalize(rows){return (Array.isArray(rows)?rows:[]).filter(x=>x&&x.name&&Number.isFinite(Number(x.distanceKm))).map(x=>({...x,exactProductMatch:x.exactProductMatch===true,stockVerified:x.stockVerified===true,branchStockVerified:x.branchStockVerified===true,branchPriceVerified:x.branchPriceVerified===true,directionsAvailable:x.directionsAvailable===true&&x.exactProductMatch===true&&(x.branchStockVerified===true||x.stockVerified===true)})).sort((a,b)=>Number(a.distanceKm)-Number(b.distanceKm));}
async function fillIfNeeded(){
 const st=getState(),i=st?.result?.identification;
 if(!st?.coords||!i||Number(i.confidence||0)<.55||st?.result?.blocked)return;
 if(Array.isArray(st.stores)&&st.stores.length){document.dispatchEvent(new CustomEvent('findit:nearby-updated',{detail:{stores:st.stores}}));return;}
 const key=keyFor(i);if(!key||busy||lastKey===key)return;
 busy=true;lastKey=key;const token=++runToken;
 try{
  const r=await fetch('/api/nearby',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({lat:st.coords.lat,lon:st.coords.lon,identification:i,radiusKm:Number(st.radius)||10,mode:'likely'})});
  const d=await r.json().catch(()=>({}));if(token!==runToken||!r.ok||!d?.ok)return;
  const rows=normalize(d.stores);if(!rows.length)return;
  st.stores=rows;
  if(st.diagnostics)Object.assign(st.diagnostics,{nearbyStoreCount:rows.length,closestStoreDistanceKm:rows[0]?.distanceKm??null,nearbyRadiusKm:Number(st.radius)||10,nearbyReliable:d.reliable!==false,lastSearchCompletedAt:new Date().toISOString()});
  try{if(typeof window.renderStores==='function')window.renderStores()}catch{}
  try{if(typeof window.updateMap==='function')window.updateMap()}catch{}
  document.dispatchEvent(new CustomEvent('findit:nearby-updated',{detail:{stores:rows,fallback:true}}));
 }catch(e){console.warn('FindIt nearby fallback unavailable',e)}finally{busy=false}
}
function schedule(){const token=++runToken;setTimeout(()=>{if(token===runToken)fillIfNeeded()},700)}

const RETAILER_DOMAINS={
 'woolworths':'woolworths.co.za','clicks':'clicks.co.za','dis chem':'dischem.co.za','makro':'makro.co.za','checkers':'checkers.co.za','shoprite':'shoprite.co.za','pick n pay':'pnp.co.za','takealot':'takealot.com','game':'game.co.za','incredible connection':'incredible.co.za','computer mania':'computermania.co.za','builders':'builders.co.za','leroy merlin':'leroymerlin.co.za','buco':'buco.co.za','nike':'nike.com','adidas':'adidas.co.za','sportscene':'sportscene.co.za','totalsports':'totalsports.co.za','jd sports south africa':'jdsports.co.za','bash':'bash.com','superbalist':'superbalist.com','dischem':'dischem.co.za'
};
function domainForStore(name){const n=norm(name);for(const [k,d] of Object.entries(RETAILER_DOMAINS))if(n===k||n.includes(k)||k.includes(n))return d;return''}
function applyLogos(){
 $$('#fxStoreList .fx-store,#fxTopStores button').forEach(card=>{
  const name=card.querySelector('b')?.textContent?.trim()||'',logo=card.querySelector('.fx-store-logo');if(!logo||logo.dataset.logoReady==='1')return;
  const domain=domainForStore(name);if(!domain)return;const initials=(name||'?').slice(0,2).toUpperCase();logo.dataset.logoReady='1';logo.innerHTML=`<img alt="${esc(name)} logo" src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64" style="width:28px;height:28px;object-fit:contain;border-radius:6px" onerror="this.parentNode.textContent='${esc(initials)}'">`;
 });
}
function currentOffers(){const st=getState(),rows=[];if(Array.isArray(st?.offers))rows.push(...st.offers);if(Array.isArray(window.productIntelligence?.offers))rows.push(...window.productIntelligence.offers);const seen=new Set();return rows.filter(o=>{if(!(o?.verified===true||o?.sourcePageVerified===true))return false;const k=`${norm(o?.retailer?.name||o?.retailer)}|${o?.product_url||o?.url||''}`;if(!k||seen.has(k))return false;seen.add(k);return true})}
function applyOfferEvidence(){
 const offers=currentOffers();if(!offers.length)return;
 const priceRows=offers.filter(o=>Number.isFinite(Number(o.price))).sort((a,b)=>Number(a.price)-Number(b.price));const best=priceRows[0];
 const bestEl=$('#fxBestPrice');if(bestEl&&best)bestEl.textContent=money(best.price,best.currency||'ZAR');
 const cards=$$('#fxStoreList .fx-store,#fxTopStores button');for(const card of cards){const name=card.querySelector('b')?.textContent?.trim()||'',o=offers.find(x=>{const r=norm(x?.retailer?.name||x?.retailer||'');const n=norm(name);return r&&n&&(r===n||r.includes(n)||n.includes(r))});if(!o)continue;let line=card.querySelector('.fx-online-evidence');if(!line){line=document.createElement('small');line.className='fx-online-evidence';line.style.display='block';line.style.marginTop='4px';line.style.color='#8fb7ff';const host=card.querySelector('span:nth-child(2)')||card;host.appendChild(line)}const bits=[];if(Number.isFinite(Number(o.price)))bits.push(`Online ${money(o.price,o.currency||'ZAR')}`);if(o.availability==='in_stock')bits.push('online stock verified');else if(o.availability==='out_of_stock')bits.push('online out of stock');line.textContent=bits.join(' • ')}
}
async function refreshIntel(force=false){
 const st=getState(),i=st?.result?.identification;if(!i||st?.result?.blocked)return;const key=keyFor(i);if(!key||intelBusy||(!force&&intelKey===key))return;intelBusy=true;intelKey=key;
 try{const coords=st?.coords||{},payload={query:i.searchQuery||i.name||i.object||'',searchQuery:i.searchQuery||'',name:i.name||i.object||'',object:i.object||'',brand:i.brand||'',model:i.model||'',category:i.retailCategory||i.category||'',retailCategory:i.retailCategory||i.category||'',visibleText:Array.isArray(i.visibleText)?i.visibleText:[],features:Array.isArray(i.features)?i.features:[],evidence:Array.isArray(i.evidence)?i.evidence:[],country:localStorage.getItem('findit_country')||'',lat:coords.lat??null,lng:coords.lon??coords.lng??null};const c=new AbortController(),t=setTimeout(()=>c.abort(),18000);let r;try{r=await fetch('/api/product-intelligence-v2',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal:c.signal})}finally{clearTimeout(t)}const d=await r.json().catch(()=>({}));if(!r.ok||!Array.isArray(d.offers))return;const trusted=window.finditTrustAudit?.filterOffers?window.finditTrustAudit.filterOffers(d.offers,i):d.offers.filter(o=>o?.verified===true||o?.sourcePageVerified===true);st.offers=trusted;window.productIntelligence={...d,offers:trusted};document.dispatchEvent(new CustomEvent('findit:dashboard-sync',{detail:{offers:trusted}}));setTimeout(()=>{applyOfferEvidence();applyLogos()},50)}catch(e){console.warn('FindIt verified offer lookup unavailable',e?.message||e)}finally{intelBusy=false}}
function ensureRepairModal(){let m=$('#fxRepairModal');if(m)return m;m=document.createElement('div');m.id='fxRepairModal';m.style.cssText='position:fixed;inset:0;z-index:2147483647;background:rgba(1,6,15,.86);display:none;place-items:center;padding:18px;backdrop-filter:blur(8px)';m.innerHTML='<div style="position:relative;width:min(820px,calc(100vw - 28px));max-height:88vh;overflow:auto;border:1px solid #28415f;border-radius:20px;background:#081425;color:#fff;padding:24px;box-shadow:0 30px 90px #000a"><button id="fxRepairClose" type="button" aria-label="Close" style="position:absolute;right:14px;top:10px;border:0;background:transparent;color:#fff;font-size:30px;cursor:pointer">×</button><div id="fxRepairBody"></div></div>';document.body.appendChild(m);m.addEventListener('click',e=>{if(e.target===m||e.target.closest('#fxRepairClose'))m.style.display='none'});return m}
function openRepair(html){const m=ensureRepairModal();$('#fxRepairBody').innerHTML=html;m.style.display='grid'}
async function showProductInfo(){
 const st=getState(),i=st?.result?.identification||{};openRepair(`<h2 style="margin:0 36px 8px 0">Product Information</h2><p style="color:#91a1b8">Loading verified information for this item…</p>`);if(!i.name&&!i.object&&!i.model){$('#fxRepairBody').innerHTML='<h2>Product Information</h2><p>No product is selected yet.</p>';return}
 await refreshIntel(true);const offers=currentOffers(),facts=[['Brand',i.brand],['Model',i.model],['Category',i.retailCategory||i.category],['Search identity',i.searchQuery||i.name||i.object],['Confidence',Number.isFinite(Number(i.confidence))?Math.round(Number(i.confidence)*100)+'%':'']].filter(([,v])=>v).map(([k,v])=>`<div style="padding:11px 0;border-bottom:1px solid #19304a"><small style="color:#91a1b8">${esc(k)}</small><div><b>${esc(v)}</b></div></div>`).join('');let research={researched:false};const sources=offers.slice(0,3).map(o=>({url:o.product_url||o.url,title:o.product_name||'',retailer:o.retailer?.name||o.retailer||''})).filter(x=>validUrl(x.url));if(sources.length)try{const c=new AbortController(),t=setTimeout(()=>c.abort(),9000);let r;try{r=await fetch('/api/product-intelligence',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification:i,sources}),signal:c.signal})}finally{clearTimeout(t)}if(r.ok)research=await r.json().catch(()=>research)}catch{}
 const researchHtml=research?.researched?`<div style="margin-top:18px"><h3>What it does</h3><p>${esc(research.whatItDoes||'')}</p>${research.pros?.length?`<h3>Pros</h3><ul>${research.pros.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}${research.cons?.length?`<h3>Cons / considerations</h3><ul>${research.cons.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}</div>`:`<div style="margin-top:18px;padding:13px;border:1px solid #19304a;border-radius:12px"><b>Verified product research is not available yet.</b><div style="color:#91a1b8;margin-top:5px">FindIt will not invent product facts.</div></div>`;$('#fxRepairBody').innerHTML=`<h2 style="margin:0 36px 8px 0">Product Information</h2>${facts}${researchHtml}`}
function showAssistant(){
 const i=getState()?.result?.identification||{};openRepair(`<h2 style="margin:0 36px 8px 0">Ask FindIt</h2><p style="color:#91a1b8">Ask about the current product, nearby stores, prices, or how to use FindIt.</p><form id="fxRepairAsk"><textarea id="fxRepairQuestion" maxlength="1200" placeholder="Ask FindIt something…" style="width:100%;box-sizing:border-box;min-height:110px;border:1px solid #29425f;background:#071321;color:#fff;border-radius:10px;padding:12px;font:inherit"></textarea><button type="submit" style="margin-top:10px;border:0;border-radius:10px;padding:11px 16px;background:linear-gradient(90deg,#3979ff,#763cff);color:white;cursor:pointer">Ask FindIt</button><div id="fxRepairAnswer" style="margin-top:15px;line-height:1.55"></div></form>`);$('#fxRepairAsk').addEventListener('submit',async e=>{e.preventDefault();const q=$('#fxRepairQuestion').value.trim(),out=$('#fxRepairAnswer');if(!q)return;out.textContent='Thinking…';try{const r=await fetch('/api/assistant?action=assistant',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:q,context:{identification:i,offers:currentOffers().slice(0,8),stores:(getState()?.stores||[]).slice(0,8)},history:[]})});const d=await r.json().catch(()=>({}));out.textContent=r.ok?(d.answer||'No answer returned.'):(d.error||'Ask FindIt is temporarily unavailable.')}catch{out.textContent='Ask FindIt is temporarily unavailable.'}})}
function interceptDashboardActions(e){const b=e.target.closest?.('#finditExactShell [data-fx]');if(!b)return;const a=b.dataset.fx;if(a==='product'){e.preventDefault();e.stopImmediatePropagation();showProductInfo();return}if(a==='assistant'){e.preventDefault();e.stopImmediatePropagation();showAssistant();return}}
function repairUi(){applyLogos();applyOfferEvidence()}
document.addEventListener('click',interceptDashboardActions,true);
document.addEventListener('findit:results-rendered',()=>{schedule();setTimeout(()=>refreshIntel(false),250);setTimeout(repairUi,500)});
document.addEventListener('findit:dashboard-sync',()=>setTimeout(repairUi,20));
document.addEventListener('findit:location-ready',()=>{const st=getState();if(st?.result?.identification){schedule();refreshIntel(false)}});
document.addEventListener('findit:nearby-updated',()=>{const st=getState();if(st?.stores?.length)lastKey=keyFor(st.result?.identification);setTimeout(repairUi,20)});
window.addEventListener('pageshow',()=>setTimeout(repairUi,300));
setInterval(repairUi,1600);
setTimeout(()=>{repairUi();if(getState()?.result?.identification)refreshIntel(false)},600);
})();