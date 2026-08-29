/* FindIt live in-store availability check.
   When the user opens Compare Prices > In-store, verify the exact product on
   retailer product pages automatically. Retailer-site availability is kept
   separate from branch-specific stock so FindIt never invents local stock. */
(()=>{
'use strict';
if(window.__finditStoreLiveCheck)return;window.__finditStoreLiveCheck=true;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const root=()=>$('#finditJourneyV5');
const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const retailerName=o=>String(o?.retailer?.name||o?.retailer||'').trim();
let busy=false,lastKey='',lastChecked=0;

function identification(){try{return window.state?.result?.identification||{}}catch{return{}}}
function currentQuery(){const i=identification();return i.searchQuery||i.query||i.name||i.model||i.object||$('#resultName')?.textContent?.trim()||'product'}
function inStoreOpen(){const r=root();if(!r||r.classList.contains('hidden'))return false;if($('.fj-head b',r)?.textContent?.trim()!=='Compare Prices')return false;return /in.?store/i.test($('.fj-tabs .active',r)?.textContent||'')}
function offers(){const out=[];try{if(Array.isArray(window.productIntelligence?.offers))out.push(...window.productIntelligence.offers)}catch{}try{if(Array.isArray(window.state?.offers))out.push(...window.state.offers)}catch{}const seen=new Set();return out.filter(o=>{const k=`${retailerName(o)}|${o?.product_url||o?.url||''}`;if(!k||seen.has(k))return false;seen.add(k);return true})}
function verifiedOfferFor(name){const n=norm(name);if(!n)return null;const rows=offers().filter(o=>o&&(o.sourcePageVerified===true||o.verified===true));return rows.find(o=>{const r=norm(retailerName(o));return r&&(r.includes(n)||n.includes(r))})||null}
function stockState(o){const a=norm(o?.availability);if(/out of stock|sold out|unavailable|out_of_stock/.test(a))return'out';if(/in stock|available online|add to cart|add to basket|delivery available|click collect|store pickup|in_stock/.test(a))return'in';return'unknown'}
function money(n,c='ZAR'){if(!Number.isFinite(Number(n)))return'';try{return new Intl.NumberFormat('en-ZA',{style:'currency',currency:c||'ZAR'}).format(Number(n))}catch{return `${c||'ZAR'} ${Number(n).toFixed(2)}`}}
function storeName(card){return card.querySelector('h3,strong,h4')?.textContent?.trim()||''}
function setCheckNote(text,working=false){const r=root();if(!r)return;let note=$('.fj-live-store-note',r);if(!note){note=document.createElement('div');note.className='fj-empty-help fj-live-store-note';const page=$('.fj-page',r);if(page)page.prepend(note)}if(note){note.innerHTML=`<b>${working?'Checking retailer websites…':'Retailer website check'}</b><br>${text}`}}
function markChecking(){const r=root();if(!r)return;$$('.fj-card',r).forEach(card=>{if(!storeName(card))return;const badge=card.querySelector('.fj-stock-unknown,.fj-badge');if(badge&&!/branch stock verified/i.test(badge.textContent||''))badge.textContent='Checking retailer website…'})}
function applyResults(){if(!inStoreOpen())return;const r=root();if(!r)return;let any=false;$$('.fj-card',r).forEach(card=>{const name=storeName(card);if(!name)return;const offer=verifiedOfferFor(name);const badge=card.querySelector('.fj-stock-unknown,.fj-badge');const button=card.querySelector('.fj-check-stock,[data-v3-open]');const existing=(badge?.textContent||'').toLowerCase();if(existing.includes('branch stock verified'))return;
 if(offer){any=true;const state=stockState(offer);let text=state==='in'?'Retailer website: available':state==='out'?'Retailer website: unavailable':'Exact product page found • availability not shown';if(Number.isFinite(Number(offer.price)))text+=` • ${money(offer.price,offer.currency||'ZAR')}`;if(badge)badge.textContent=text;if(button&&offer.product_url){button.dataset.v3Open=offer.product_url;button.textContent='Open exact product page'}}
 else if(badge){badge.textContent='Could not verify exact product on retailer website'}
 });
 setCheckNote(any?'FindIt checked exact retailer product pages automatically. Website availability can still differ by delivery address or selected branch, so FindIt only calls branch stock verified when branch-specific evidence exists.':'FindIt checked the retailer websites, but no exact verified product page was returned for these nearby retailers. FindIt will not guess local stock.');
}
async function checkNow(force=false){if(!inStoreOpen()||busy)return;const i=identification(),q=currentQuery(),key=norm(q);if(!key)return;if(!force&&key===lastKey&&Date.now()-lastChecked<120000){applyResults();return}busy=true;lastKey=key;lastChecked=Date.now();setCheckNote('FindIt is looking for the exact identified product on the nearby retailers’ websites and reading trustworthy availability signals.',true);markChecking();
 try{const body={...i,query:q,searchQuery:q};const c=new AbortController(),t=setTimeout(()=>c.abort(),24000);const res=await fetch('/api/product-intelligence-v2',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:c.signal});clearTimeout(t);if(!res.ok)throw new Error(`availability ${res.status}`);const data=await res.json();window.productIntelligence=data;try{if(Array.isArray(data.offers))window.state.offers=data.offers}catch{}applyResults()}catch(e){setCheckNote('The automatic retailer check could not complete right now. You can still open a retailer result, but FindIt will not claim stock without evidence.');$$('.fj-card',root()||document).forEach(card=>{const badge=card.querySelector('.fj-stock-unknown,.fj-badge');if(badge&&/checking retailer/i.test(badge.textContent||''))badge.textContent='Retailer check unavailable'})}finally{busy=false}}
function schedule(){setTimeout(()=>checkNow(false),80)}
document.addEventListener('click',e=>{if(e.target.closest?.('#finditJourneyV5 .fj-tabs'))schedule()},true);
document.addEventListener('findit:results-rendered',schedule);
document.addEventListener('findit:nearby-updated',()=>{if(inStoreOpen())setTimeout(()=>{applyResults();checkNow(false)},120)});
const mo=new MutationObserver(()=>{if(inStoreOpen())applyResults()});
function init(){mo.observe(document.body,{childList:true,subtree:true});if(inStoreOpen())checkNow(false)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
