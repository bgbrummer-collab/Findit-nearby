(()=>{'use strict';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const valid=v=>{try{return /^https?:$/.test(new URL(v).protocol)}catch{return false}};
 function render(){const top=document.querySelector('#fxTopStores'),d=window.productIntelligence||{};if(!top||top.querySelector('.fx-store'))return;const all=[...(Array.isArray(d.webRetailers)?d.webRetailers:[]),...(Array.isArray(d.retailerStatus)?d.retailerStatus:[])],seen=new Set(),rows=all.filter(x=>x?.name&&valid(x.searchUrl)&&!seen.has(x.name)&&(seen.add(x.name),true)).slice(0,5);if(!rows.length)return;top.innerHTML='<div class="fx-retailer-candidates"><p class="fx-empty">No exact listing verified yet. Check relevant retailer searches:</p>'+rows.map(x=>'<a class="fx-retailer-candidate" href="'+esc(x.searchUrl)+'" target="_blank" rel="noopener"><b>'+esc(x.name)+'</b><small>Price and stock not verified</small></a>').join('')+'</div>'}
 document.addEventListener('findit:dashboard-sync',()=>setTimeout(render,50));document.addEventListener('findit:results-rendered',()=>setTimeout(render,50));setTimeout(render,2500);
})();
