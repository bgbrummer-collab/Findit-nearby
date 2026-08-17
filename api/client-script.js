const SOURCE='https://raw.githubusercontent.com/bgbrummer-collab/Findit-nearby/main/script.js';

const PATCH=`
;(()=>{
  function h(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}
  function goodUrl(v){try{const u=new URL(v);return u.protocol==='https:'||u.protocol==='http:'}catch{return false}}
  function money(amount,currency='ZAR'){
    if(amount==null||!Number.isFinite(Number(amount)))return 'Price not safely verified';
    try{return new Intl.NumberFormat(undefined,{style:'currency',currency}).format(Number(amount))}catch{return currency+' '+Number(amount).toFixed(2)}
  }
  function stockLabel(v){const x=String(v||'').toLowerCase();if(x==='in_stock')return 'In stock online';if(x==='out_of_stock')return 'Out of stock online';if(x==='preorder')return 'Pre-order';if(x==='backorder')return 'Back-order';return 'Online stock not confirmed'}

  const OFFICIAL_BRANDS=[
    {key:'nike',name:'Nike',test:/\\bnike\\b/i,search:q=>`https://www.nike.com/za/w?q=${encodeURIComponent(String(q||'').replace(/\\bnike\\b/ig,'').trim())}`,storeQuery:'Nike Factory Store'},
    {key:'adidas',name:'adidas',test:/\\badidas\\b/i,search:q=>`https://www.adidas.co.za/search?q=${encodeURIComponent(String(q||'').replace(/\\badidas\\b/ig,'').trim())}`,storeQuery:'adidas store'},
    {key:'puma',name:'PUMA',test:/\\bpuma\\b/i,search:q=>`https://za.puma.com/search?q=${encodeURIComponent(String(q||'').replace(/\\bpuma\\b/ig,'').trim())}`,storeQuery:'PUMA store'}
  ];
  function officialBrand(i){
    const text=[i?.brand,i?.name,i?.model,i?.searchQuery].filter(Boolean).join(' ');
    return OFFICIAL_BRANDS.find(b=>b.test.test(text))||null;
  }
  function exactQuery(i){
    const parts=[i?.brand,i?.model,i?.name||i?.object].filter(Boolean).map(v=>String(v).trim()).filter(Boolean);
    const seen=new Set();return parts.join(' ').split(/\\s+/).filter(w=>{const k=w.toLowerCase();if(seen.has(k))return false;seen.add(k);return true}).join(' ').trim();
  }
  function injectStyles(){
    if(document.getElementById('finditRetailerDiscoveryStyles'))return;
    const s=document.createElement('style');s.id='finditRetailerDiscoveryStyles';s.textContent=\`
      .findit-retailer-wrap{margin-top:18px}.findit-retailer-head{display:flex;align-items:end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px}.findit-retailer-head h4{margin:0;font-size:18px}.findit-retailer-head p{margin:4px 0 0;opacity:.72;font-size:13px}.findit-retailer-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px}.findit-retailer-card{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 15px;border-radius:16px;border:1px solid rgba(130,150,220,.2);background:rgba(16,25,45,.72)}.findit-retailer-card strong{display:block;font-size:14px}.findit-retailer-card small{display:block;margin-top:3px;opacity:.68;font-size:11px}.findit-retailer-card a{white-space:nowrap;text-decoration:none;font-weight:800;padding:9px 11px;border-radius:11px;background:rgba(85,110,255,.18);border:1px solid rgba(110,130,255,.35)}.findit-pi-note{padding:14px 16px;border-radius:15px;background:rgba(100,120,180,.08);border:1px solid rgba(130,150,220,.16);margin-bottom:12px}.findit-pi-note b{display:block;margin-bottom:4px}.findit-pi-note small{opacity:.7}.pi-offer.findit-web-offer{position:relative}.pi-offer.findit-web-offer:before{content:'LIVE WEB';position:absolute;right:12px;top:10px;font-size:9px;letter-spacing:.12em;font-weight:900;opacity:.6}.findit-official-brand{border-color:rgba(82,210,255,.45);box-shadow:0 0 0 1px rgba(82,210,255,.08) inset}
    \`;document.head.appendChild(s)
  }
  function discoveryHtml(retailers,i){
    const brand=officialBrand(i),q=exactQuery(i)||i?.searchQuery||i?.name||i?.object||'';
    if(brand){
      const url=brand.search(q);
      return '<div class="findit-retailer-wrap"><div class="findit-retailer-head"><div><h4>Official brand store</h4><p>FindIt detected '+h(brand.name)+', so it is prioritising the official brand shop instead of unrelated retailers.</p></div><small>Official brand first</small></div><div class="findit-retailer-grid"><div class="findit-retailer-card findit-official-brand"><div><strong>'+h(brand.name)+'</strong><small>Search the exact identified model on the official store</small></div><a href="'+h(url)+'" target="_blank" rel="noopener noreferrer">Find exact item →</a></div></div></div>';
    }
    if(!Array.isArray(retailers)||!retailers.length)return '';
    return '<div class="findit-retailer-wrap"><div class="findit-retailer-head"><div><h4>Relevant retailer searches</h4><p>Only retailer types that make sense for this product are shown.</p></div><small>Official sites • no invented prices</small></div><div class="findit-retailer-grid">'+retailers.map(r=>{const status=r.status==='products_detected'?'Product data detected':'Open retailer search';const href=r.productUrl||r.searchUrl;return '<div class="findit-retailer-card"><div><strong>'+h(r.name||'Retailer')+'</strong><small>'+h(status)+'</small></div>'+(goodUrl(href)?'<a href="'+h(href)+'" target="_blank" rel="noopener noreferrer">'+(r.productUrl?'View exact match →':'Search →')+'</a>':'')+'</div>'}).join('')+'</div></div>'
  }
  window.loadProductIntelligence=async function(i){
    const panel=document.getElementById('productIntelligencePanel'),el=document.getElementById('productIntelligenceResults');if(!panel||!el)return;
    injectStyles();panel.classList.remove('hidden');el.innerHTML='<div class="findit-pi-note"><b>Checking product sources…</b><small>FindIt is matching the item to the most relevant official brand or retailer source.</small></div>';
    try{
      const r=await fetch('/api/product-intelligence',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query:i.searchQuery||i.name||i.object||'',name:i.name||i.object||'',object:i.object||'',brand:i.brand||'',model:i.model||'',category:i.category||'',retailCategory:i.retailCategory||''})});
      const d=await r.json();window.productIntelligence=d;
      if(!r.ok)throw new Error(d.error||'Product lookup failed');
      const brand=officialBrand(i);
      let offers=Array.isArray(d.offers)?d.offers:[],retailers=Array.isArray(d.webRetailers)?d.webRetailers:[];
      if(brand){offers=offers.filter(o=>String(o.retailer?.name||'').toLowerCase()===brand.name.toLowerCase())}
      let out='';
      if(offers.length){
        out+=offers.map(o=>{const retailer=o.retailer?.name||'Retailer',price=money(o.price,o.currency||'ZAR'),stock=stockLabel(o.availability),verified=o.verified&&o.price!=null;return '<article class="pi-offer '+(verified?'verified ':'')+(o.listingType==='official_web'?'findit-web-offer':'')+'"><div><h4>'+h(o.product_name||d.bestProduct?.name||'Product')+'</h4><p>'+h(retailer)+'</p><div class="pi-meta"><span>'+(verified?'✓ Price found on listing':'Possible product match')+'</span><span>'+h(stock)+'</span><span>'+h(o.source||'Retailer source')+'</span></div><div class="pi-actions">'+(goodUrl(o.product_url)?'<a href="'+h(o.product_url)+'" target="_blank" rel="noopener noreferrer">View exact product →</a>':'')+'</div></div><div class="pi-price">'+h(price)+'</div></article>'}).join('');
      }else if(brand){
        out+='<div class="findit-pi-note"><b>'+h(brand.name)+' detected.</b><small>FindIt is prioritising the official '+h(brand.name)+' store. If the exact model is visible in the photo, the official-store search is built from that model name.</small></div>';
      }else{
        out+='<div class="findit-pi-note"><b>No price could be safely verified automatically yet.</b><small>FindIt will show only relevant retailer searches rather than filling the page with unrelated stores.</small></div>';
      }
      out+=discoveryHtml(retailers,i);
      el.innerHTML=out||'<div class="findit-pi-note"><b>No retailer result yet.</b><small>Try Correct item or another photo with the brand/model visible.</small></div>';
    }catch(e){
      console.error('FindIt Product Intelligence UI',e);el.innerHTML='<div class="findit-pi-note"><b>Retailer lookup is temporarily unavailable.</b><small>Your normal nearby retailer search still works. Please try again shortly.</small></div>';
    }
  };

  function repairBrandNearby(){
    const old=document.getElementById('searchNearbyFree');if(!old||old.dataset.brandAware==='1')return;
    const link=old.cloneNode(true);link.dataset.brandAware='1';old.replaceWith(link);
    link.addEventListener('click',e=>{
      e.preventDefault();
      const i=(typeof state!=='undefined'&&state.result?.identification)||{};
      const brand=officialBrand(i);
      let term;
      if(brand)term=brand.storeQuery;
      else if(typeof retailerQuery==='function')term=retailerQuery(i);
      else term=String(i.retailCategory||i.category||'retailer');
      const query=(typeof state!=='undefined'&&state.coords)?`${term} near ${state.coords.lat},${state.coords.lon}`:`${term} near me`;
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,'_blank','noopener');
    });
    const title=link.querySelector('strong'),note=link.querySelector('span');
    const i=(typeof state!=='undefined'&&state.result?.identification)||{},brand=officialBrand(i);
    if(brand&&title)title.textContent=`Find ${brand.name} stores near me`;
    if(brand&&note)note.textContent='Official brand locations first • verify exact branch stock before travelling';
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(repairBrandNearby,80));
  const mo=new MutationObserver(()=>setTimeout(repairBrandNearby,20));
  document.addEventListener('DOMContentLoaded',()=>{const root=document.getElementById('freeActions')||document.body;mo.observe(root,{subtree:true,childList:true,attributes:true})});
})();
`;

export default async function handler(req,res){
  try{
    const r=await fetch(SOURCE,{headers:{'User-Agent':'FindItNearby-client-script/1.0'},signal:AbortSignal.timeout(7000)});
    if(!r.ok)throw new Error('Could not load FindIt client');
    const source=await r.text();
    res.setHeader('Content-Type','application/javascript; charset=utf-8');
    res.setHeader('Cache-Control','public, s-maxage=120, stale-while-revalidate=600');
    return res.status(200).send(source+'\n'+PATCH);
  }catch(e){
    console.error('client-script',e);
    res.setHeader('Content-Type','application/javascript; charset=utf-8');
    res.setHeader('Cache-Control','no-store');
    return res.status(503).send(`console.error(${JSON.stringify('FindIt client could not load')});`);
  }
}
