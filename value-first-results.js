/* FindIt value-first result guard.
   A search must give the shopper useful next-step information even when exact commerce evidence is unavailable. */
(()=>{'use strict';if(window.__finditValueFirst)return;window.__finditValueFirst=true;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)],clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const esc=v=>clean(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state=()=>window.finditState||window.state||{}, id=()=>state()?.result?.identification||{};
function hasIdentity(){let i=id();return !!clean(i.name||i.object||i.model||i.searchQuery)}
function name(){let i=id();return clean(i.name||i.model||i.object||i.searchQuery)||'Selected product'}
function category(){let i=id();return clean(i.retailCategory||i.category||'product')}
function usefulSummary(){let i=id(),parts=[];if(i.brand)parts.push('Brand: '+i.brand);if(i.model)parts.push('Model/variant: '+i.model);if(i.category||i.retailCategory)parts.push('Category: '+category());if(i.barcode)parts.push('Barcode: '+i.barcode);return parts}
function nearby(){return Array.isArray(state().stores)?state().stores:[]}
function offers(){let a=[...(Array.isArray(state().offers)?state().offers:[]),...(Array.isArray(window.productIntelligence?.offers)?window.productIntelligence.offers:[])];let seen=new Set();return a.filter(o=>{let k=clean(o?.product_url||o?.url||o?.retailer?.name||o?.retailer||'');if(!k||seen.has(k))return false;seen.add(k);return true})}
function sourceName(o){return clean(o?.retailer?.name||o?.retailer||o?.store||o?.seller||'Retailer')}
function productModalFallback(){
 const m=$('#fxStableModal:not(.hidden)'),body=m&&$('#fxStableBody',m);if(!body||!hasIdentity())return;
 const txt=clean(body.textContent);
 if(!/Search for a product first|No product selected yet|Purpose is being verified|Product-specific advantages are being verified/i.test(txt))return;
 let i=id(),rows=usefulSummary(),os=offers(),ss=nearby();
 body.innerHTML='<div class="fx-value-product"><div class="fx-value-identity"><h3>'+esc(name())+'</h3><p>'+esc(rows.join(' · ')||'Product selected from your search.')+'</p></div>'+
 '<section><h4>What FindIt knows</h4><p>'+esc(i.summary||i.description||('This is being treated as a '+category()+'. FindIt will only add product-specific claims when a reliable source supports them.'))+'</p></section>'+
 '<section><h4>Where to look</h4><p>'+(ss.length?esc(ss.slice(0,4).map(s=>s.name).filter(Boolean).join(', '))+' are relevant nearby retailers found for this search. Exact branch stock still needs retailer confirmation.':'No nearby retailer has been confirmed yet. You can still compare online retailer evidence below when available.')+'</p></section>'+
 '<section><h4>Retailer evidence</h4><p>'+(os.length?esc(os.length+' retailer listing'+(os.length===1?'':'s')+' found. Open Compare Prices to inspect verified price and availability evidence.'):'No exact retailer listing has been verified yet. FindIt will not invent a price or stock status.')+'</p></section>'+
 '<section><h4>Useful next step</h4><p>'+esc(i.barcode?'Use the barcode and retailer links to confirm the exact variant before buying.':'If the exact model or size matters, add the model, size or barcode to the search. That gives FindIt a much stronger exact-product query.')+'</p></section></div>';
}
function enrichDashboard(){
 if(!hasIdentity())return;let i=id(),ss=nearby(),os=offers();
 let n=$('#fxProductName');if(n&&/No item selected|Item identified/i.test(n.textContent))n.textContent=name();
 let meta=$('#fxProductMeta');if(meta&&!clean(meta.textContent))meta.textContent=usefulSummary().join(' · ');
 let desc=$('#fxProductDesc');if(desc&&/Automatic photo identification is unavailable|Upload a photo|New photo selected/i.test(desc.textContent)&&clean(i.identificationMethod||i.userConfirmed))desc.textContent='Product selected. FindIt is checking retailer evidence for this exact search.';
 let badge=$('#fxExactBadge');if(badge&&/Photo ready|Waiting|Item identified/i.test(badge.textContent))badge.textContent=i.userConfirmed?'Product confirmed by search':'Product identified';
 let list=$('#fxStoreList');if(list&&ss.length&&/Use your location|Nearby stores will appear/i.test(list.textContent))list.innerHTML=ss.slice(0,5).map(s=>'<button class="fx-store" data-fx="nearby"><span><b>'+esc(s.name||'Nearby retailer')+'</b><small>'+esc([Number.isFinite(+s.distanceKm)?(+s.distanceKm).toFixed(1)+' km':'',s.address||''].filter(Boolean).join(' • '))+'</small><em>Exact branch stock not verified</em></span><strong>›</strong></button>').join('');
 let info=$('#fxValueStrip');if(!info){let anchor=$('.fx-product-copy');if(anchor){info=document.createElement('div');info.id='fxValueStrip';info.className='fx-value-strip';anchor.insertBefore(info,anchor.querySelector('.fx-product-actions'))}}
 if(info)info.innerHTML='<b>What we found</b><span>'+esc(os.length?os.length+' retailer listing'+(os.length===1?'':'s')+' found':ss.length?ss.length+' relevant nearby retailer'+(ss.length===1?'':'s')+' found':'Retailer verification still needed')+'</span>';
}
function smartChoiceValue(){
 if(!hasIdentity())return;let root=$('#fxSmartChoice');if(!root)return;let ss=nearby(),os=offers(),verified=os.filter(o=>o?.verified===true||o?.sourcePageVerified===true),prices=verified.filter(o=>Number.isFinite(+o.price));
 let cards=$$('.fx-smart-card',root);if(cards[0]&&/Need verified retailer evidence/i.test(cards[0].textContent)){let s=cards[0].querySelector('strong'),p=cards[0].querySelector('p');if(s)s.textContent=verified.length?verified.length+' verified retailer option'+(verified.length===1?'':'s'):(ss.length?ss.length+' nearby retailer'+(ss.length===1?'':'s')+' to check':'Retailer check needed');if(p)p.textContent=verified.length?'Compare the verified retailer evidence below.':ss.length?'These stores are relevant nearby options; exact product stock still needs confirmation.':'No retailer evidence has been confirmed yet.'}
 if(cards[1]&&prices.length){let cheapest=prices.sort((a,b)=>+a.price-+b.price)[0],s=cards[1].querySelector('strong'),p=cards[1].querySelector('p');if(s)s.textContent=new Intl.NumberFormat('en-ZA',{style:'currency',currency:cheapest.currency||'ZAR'}).format(+cheapest.price);if(p)p.textContent='Lowest verified price currently found at '+sourceName(cheapest)+'.'}
}
function run(){enrichDashboard();productModalFallback();smartChoiceValue()}
for(const ev of ['findit:results-rendered','findit:dashboard-sync','findit:nearby-updated'])document.addEventListener(ev,()=>{run();setTimeout(run,100);setTimeout(run,700)});
document.addEventListener('click',e=>{if(e.target.closest?.('[data-fx="product"],[data-fx="compare"],[data-fx="nearby"]')){setTimeout(run,50);setTimeout(run,350)}},true);
new MutationObserver(()=>{if(hasIdentity())setTimeout(run,20)}).observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,500),{once:true});else setTimeout(run,500);
})();