/* FindIt dashboard commerce status v10 — exact online price/stock with product-scoped state.
   Verified evidence is monotonic only inside the SAME identified product. New-result offers are retained only when they match
   the new identity; old-product evidence and late network replies are discarded so prices never bleed between searches. */
(()=>{
'use strict';
if(window.__finditDashboardCommerceStatus)return;window.__finditDashboardCommerceStatus=true;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const state=()=>{try{return window.finditState||window.state||{}}catch{return{}}};
const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const positive=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))&&Number(v)>0;
const money=(n,c='ZAR')=>{if(!positive(n))return'';try{return new Intl.NumberFormat('en-ZA',{style:'currency',currency:c||'ZAR'}).format(Number(n))}catch{return`${c||'ZAR'} ${Number(n).toFixed(2)}`}};
const stock=v=>{const x=String(v||'').toLowerCase();if(x==='in_stock')return'In stock online';if(x==='out_of_stock')return'Out of stock online';if(x==='preorder')return'Pre-order online';if(x==='backorder')return'Back-order online';return''};
const knownAvailability=v=>/^(in_stock|out_of_stock|preorder|backorder)$/i.test(String(v||''));
function key(v){const n=norm(v);if(/\bdis chem\b|\bdischem\b/.test(n))return'dischem';if(/\bpick n pay\b|\bpnp\b/.test(n))return'pick n pay';if(/\bincredible connection\b/.test(n))return'incredible connection';if(/\bhifi corp\b|\bhificorp\b/.test(n))return'hifi corp';return n}
function currentIdentity(){return state()?.result?.identification||{}}
function currentIdentityKey(){const i=currentIdentity();return norm([i.brand,i.model,i.name,i.object,i.searchQuery].filter(Boolean).join('|'))}
function validOffer(o){const verified=!!(o&&(o.verified===true||o.sourcePageVerified===true||o.searchGroundedVerified===true));if(!verified||o.exactProductMatch===false)return false;return o.exactProductMatch===true||positive(o.price)||knownAvailability(o.availability);}
function evidenceScore(o){return(o?.sourcePageVerified===true?1000:0)+(o?.exactProductMatch===true?300:0)+(o?.verified===true?100:0)+(o?.searchGroundedVerified===true?80:0)+(positive(o?.price)?70:0)+(knownAvailability(o?.availability)?40:0)+Math.min(100,Number(o?.matchScore||0));}
function offerKey(o){const retailer=key(o?.retailer?.name||o?.retailer||o?.store||o?.seller||'');const url=String(o?.product_url||o?.url||'').trim().toLowerCase();const title=norm(o?.product_name||o?.title||o?.name||'');return `${retailer}|${url||title}`;}
function mergeOffers(...groups){const map=new Map();for(const group of groups){for(const o of(Array.isArray(group)?group:[])){if(!validOffer(o))continue;const k=offerKey(o);if(!k||k==='|')continue;const old=map.get(k);if(!old||evidenceScore(o)>evidenceScore(old)){map.set(k,o);continue;}if(evidenceScore(o)===evidenceScore(old)){map.set(k,{...old,...o,price:positive(o.price)?o.price:old.price,currency:positive(o.price)?(o.currency||old.currency):old.currency,availability:knownAvailability(o.availability)?o.availability:old.availability,sourcePageVerified:old.sourcePageVerified===true||o.sourcePageVerified===true,exactProductMatch:old.exactProductMatch===true||o.exactProductMatch===true,verified:old.verified===true||o.verified===true,searchGroundedVerified:old.searchGroundedVerified===true||o.searchGroundedVerified===true});}}}return[...map.values()];}
const stop=new Set(['the','and','for','with','from','this','that','product','item','online','white','black','new','original','classic','professional','low','high']);
function tokens(v){return norm(v).split(' ').filter(x=>x.length>2&&!stop.has(x))}
function offerMatchesIdentity(o,i=currentIdentity()){
  if(!validOffer(o))return false;
  const hay=norm([o?.product_name,o?.title,o?.name,o?.product_url,o?.url].filter(Boolean).join(' '));if(!hay)return false;
  const brand=norm(i.brand);if(brand&&brand.length>2&&!hay.includes(brand))return false;
  const model=tokens(i.model),name=tokens(i.name),object=tokens(i.object),query=tokens(i.searchQuery);
  const distinctive=[...new Set([...model,...name,...query])].filter(t=>!brand.split(' ').includes(t));
  const hits=distinctive.filter(t=>hay.includes(t)).length;
  if(distinctive.length>=3&&hits>=2)return true;
  if(distinctive.length>=1&&hits>=1&&object.some(t=>hay.includes(t)))return true;
  if(!distinctive.length&&object.length&&object.some(t=>hay.includes(t)))return true;
  if(brand&&hits>=1)return true;
  try{if(window.finditTrustAudit?.filterOffers)return window.finditTrustAudit.filterOffers([o],i).length>0}catch{}
  return false;
}
function matchingIncoming(rows,i=currentIdentity()){return (Array.isArray(rows)?rows:[]).filter(o=>offerMatchesIdentity(o,i))}
let retainedOffers=[],activeIdentityKey='',prefetchKey='',prefetchPromise=null,prefetchGeneration=0;
function writeOffers(rows){const s=state();try{s.offers=rows}catch{}try{if(window.finditState)window.finditState.offers=rows}catch{}try{if(window.state&&window.state!==window.finditState)window.state.offers=rows}catch{}}
function resetForIdentity(nextKey,incoming=[]){activeIdentityKey=nextKey||'';retainedOffers=mergeOffers(matchingIncoming(incoming));prefetchKey='';prefetchPromise=null;prefetchGeneration++;writeOffers(retainedOffers);try{window.productIntelligence={offers:retainedOffers,identityKey:activeIdentityKey}}catch{}const best=$('#fxBestPrice');if(best)best.textContent='Not verified yet';}
function ensureIdentityScope(){const k=currentIdentityKey();if(k!==activeIdentityKey){const incoming=[...(state()?.offers||[]),...(window.productIntelligence?.offers||[])];resetForIdentity(k,incoming)}return k}
function persistOffers(extra=[]){ensureIdentityScope();retainedOffers=mergeOffers(retainedOffers,state()?.offers,window.productIntelligence?.offers,extra);writeOffers(retainedOffers);return retainedOffers;}
function offers(){const merged=persistOffers();const m=new Map();for(const o of merged){const k=key(o?.retailer?.name||o?.retailer);if(!k)continue;const old=m.get(k);if(!old||evidenceScore(o)>evidenceScore(old))m.set(k,o)}return m}
function sanitizeModal(){const root=$('#fxStableBody');if(!root)return;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(w.nextNode())nodes.push(w.currentNode);for(const n of nodes){const original=n.nodeValue||'';let text=original.replace(/Missing prices are never turned into\s*R\s*0(?:[,.]00)?\.?/gi,'Missing prices are labelled as not published.');if(/^\s*(?:ZAR\s*)?R\s*0(?:[,.]00)?\s*$/i.test(text))text='Price not published';if(text!==original)n.nodeValue=text}}
function sync(){ensureIdentityScope();persistOffers();const map=offers();for(const row of $$('#fxStoreList .fx-store')){const name=$('b',row)?.textContent||'',o=map.get(key(name)),em=$('em',row),right=$('strong',row);if(!em)continue;if(o){const bits=['Exact product online'];const st=stock(o.availability);if(st)bits.push(st);bits.push('Branch stock not published');const text=bits.join(' • ');if(em.textContent!==text)em.textContent=text;em.classList.toggle('ok',o.availability==='in_stock');const p=money(o.price,o.currency||'ZAR');if(right&&p&&right.textContent!==`${p} ›`)right.textContent=`${p} ›`;}else{const text='Relevant nearby retailer • exact item not confirmed';if(em.textContent!==text)em.textContent=text;em.classList.remove('ok')}}
 for(const row of $$('#fxTopStores > button')){const name=$('b',row)?.textContent||'',o=map.get(key(name)),badge=$('.fx-star',row);if(!badge)continue;const text=o?(o.availability==='in_stock'?'Exact online • In stock':'Exact product online'):'Nearby';if(badge.textContent!==text)badge.textContent=text}
 const priced=[...map.values()].filter(o=>positive(o.price)).sort((a,b)=>Number(a.price)-Number(b.price));const best=$('#fxBestPrice');if(best){if(priced.length){const text=money(priced[0].price,priced[0].currency||'ZAR');if(text&&best.textContent!==text)best.textContent=text}else if(!/Not verified yet/i.test(best.textContent||''))best.textContent='Not verified yet'}sanitizeModal()
}
function identityBody(){const s=state(),i=s?.result?.identification||{},c=s?.coords||{};return{identification:i,name:i.name||i.object||'',brand:i.brand||'',model:i.model||'',object:i.object||'',category:i.retailCategory||i.category||'',retailCategory:i.retailCategory||i.category||'',searchQuery:i.searchQuery||i.name||i.model||i.object||'',query:i.searchQuery||i.name||i.model||i.object||'',visibleText:i.visibleText||[],features:i.features||[],evidence:i.evidence||[],exactIdentityVerified:Boolean(i.exactIdentityVerified),lat:c.lat,lon:c.lon,radius:Number(s.radius||localStorage.getItem('finditRadius')||10)}}
function applyCommerce(d,expectedKey,generation){if(!d||!Array.isArray(d.offers))return null;if(expectedKey!==currentIdentityKey()||generation!==prefetchGeneration)return null;const scoped=matchingIncoming(d.offers);const merged=persistOffers(scoped);window.productIntelligence={...(window.productIntelligence||{}),...d,offers:merged,identityKey:expectedKey};persistOffers(merged);sync();try{document.dispatchEvent(new CustomEvent('findit:dashboard-sync',{detail:{commerce:true}}))}catch{}return{...d,offers:merged}}
function hasVerifiedPrice(d){return Array.isArray(d?.offers)&&d.offers.some(o=>positive(o?.price)&&o?.verified===true&&o?.sourcePageVerified===true&&o?.exactProductMatch!==false)}
function getUrl(b){const q=new URLSearchParams();for(const k of ['name','brand','model','object','category','retailCategory','searchQuery','query','lat','lon','radius']){const v=b[k];if(v!==undefined&&v!==null&&String(v).trim())q.set(k,String(v).trim())}return`/api/product-intelligence-v2?${q.toString()}`}
async function requestPost(b){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),22000);try{const r=await fetch('/api/product-intelligence-v2',{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},body:JSON.stringify(b),signal:ctl.signal,cache:'no-store'});const d=await r.json().catch(()=>({}));return r.ok&&Array.isArray(d.offers)?d:null}catch{return null}finally{clearTimeout(timer)}}
async function requestGet(b){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),22000);try{const r=await fetch(getUrl(b),{method:'GET',headers:{accept:'application/json'},signal:ctl.signal,cache:'no-store'});const d=await r.json().catch(()=>({}));return r.ok&&Array.isArray(d.offers)?d:null}catch{return null}finally{clearTimeout(timer)}}
async function prefetch(force=false){const scopedKey=ensureIdentityScope(),b=identityBody(),k=norm(`${b.brand}|${b.model}|${b.name}|${b.searchQuery}`);if(!k)return null;if(!force&&k===prefetchKey&&prefetchPromise)return prefetchPromise;prefetchKey=k;const generation=prefetchGeneration;const expectedKey=scopedKey;prefetchPromise=(async()=>{let d=await requestPost(b);if(expectedKey!==currentIdentityKey()||generation!==prefetchGeneration)return null;if(d)d=applyCommerce(d,expectedKey,generation);if(!hasVerifiedPrice(d)){const g=await requestGet(b);if(expectedKey!==currentIdentityKey()||generation!==prefetchGeneration)return null;if(g)d=applyCommerce(g,expectedKey,generation)}if(expectedKey===currentIdentityKey()&&generation===prefetchGeneration)persistOffers();return d})().finally(()=>{if(generation===prefetchGeneration)prefetchPromise=null});return prefetchPromise}
let timer=0;function queue(){clearTimeout(timer);timer=setTimeout(sync,60)}
['findit:dashboard-sync','findit:stores-updated'].forEach(n=>document.addEventListener(n,queue));
document.addEventListener('findit:results-rendered',()=>{const next=currentIdentityKey();if(next!==activeIdentityKey){const incoming=[...(state()?.offers||[]),...(window.productIntelligence?.offers||[])];resetForIdentity(next,incoming)}queue();setTimeout(()=>prefetch(false),0)});
window.addEventListener('load',()=>{activeIdentityKey=currentIdentityKey();retainedOffers=mergeOffers(matchingIncoming([...(state()?.offers||[]),...(window.productIntelligence?.offers||[])]));writeOffers(retainedOffers);queue();setTimeout(sync,800);setTimeout(sync,2500);setTimeout(()=>prefetch(false),1200)});
window.finditRefreshCommerce=()=>prefetch(true);
window.addEventListener('click',e=>{if(!e.target?.closest?.('#fxRefreshPrices,#fxRefreshStock'))return;setTimeout(()=>prefetch(true),0)},true);
const mo=new MutationObserver(m=>{if(m.some(x=>x.target?.closest?.('#fxStoreList,#fxTopStores,#fxStableModal')||x.target?.id==='fxStoreList'||x.target?.id==='fxTopStores'||x.target?.id==='fxStableBody'))queue()});
mo.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
})();
