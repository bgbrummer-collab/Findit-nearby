/* FindIt Product Information buying-context guard.
   Adds useful buying context only from already researched product facts. */
(()=>{
'use strict';
if(window.__finditProductBuyingContextFix)return;window.__finditProductBuyingContextFix=true;
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state=()=>{try{return window.finditState||window.state||{}}catch{return{}}};
const ident=()=>state()?.result?.identification||{};
function usable(s){const x=clean(s);return x.length>=12&&!/no trustworthy|not available|could not be loaded|checking exact/i.test(x)}
function addContext(){
 const box=document.querySelector('#fxStableResearch');if(!box||!box.isConnected)return;
 const text=clean(box.textContent);if(!/Exact-product web research loaded\./i.test(text))return;
 const i=ident(),label=clean(i.object||i.name||i.category||'product');
 const pros=[...box.querySelectorAll('h4')].find(h=>/^Pros$/i.test(clean(h.textContent)))?.nextElementSibling;
 const firstPro=pros?.querySelector?.('li')?.textContent||'';
 const whatNode=[...box.querySelectorAll('b')].find(b=>/^What it does$/i.test(clean(b.textContent)))?.nextElementSibling;
 const what=clean(whatNode?.textContent||'');
 const sourceCount=(text.match(/Grounded in\s+(\d+)/i)||[])[1];
 const chunks=[];
 if(!/Best for/i.test(text)){
   const best=usable(what)?`People looking for ${/^a\b|^an\b/i.test(label)?label:`a ${label}`} for the verified use described above.`:`People whose needs match the verified product purpose and features above.`;
   chunks.push(`<h4>Best for</h4><small>${esc(best)}</small>`);
 }
 if(!/Stand-out point/i.test(text)){
   const standout=usable(firstPro)?clean(firstPro):usable(what)?`Its clearest verified point is the product-specific purpose described above.`:'The strongest product-specific point is shown in the verified facts above.';
   chunks.push(`<h4>Stand-out point</h4><small>${esc(standout)}</small>`);
 }
 if(!/Value \/ buying takeaway|Buying takeaway/i.test(text)){
   let takeaway=usable(firstPro)?`Consider it if that verified feature matters to you; compare the live price and availability shown by FindIt before buying.`:`Use the verified purpose, price and availability above to decide whether it fits your needs before buying.`;
   if(sourceCount)takeaway+=` Product research is grounded in ${sourceCount} source${sourceCount==='1'?'':'s'}.`;
   chunks.push(`<h4>Value / buying takeaway</h4><small>${esc(takeaway)}</small>`);
 }
 if(chunks.length){const facts=box.querySelector('.fx-fact-grid');const wrap=document.createElement('div');wrap.className='fx-buying-context';wrap.innerHTML=chunks.join('');if(facts)box.insertBefore(wrap,facts);else box.appendChild(wrap)}
}
const mo=new MutationObserver(()=>addContext());mo.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
document.addEventListener('findit:results-rendered',()=>setTimeout(addContext,50));
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-fx="product"],[data-stable-action="product"]')){setTimeout(addContext,100);setTimeout(addContext,700)}},true);
})();
