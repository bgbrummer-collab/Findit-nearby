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
  function injectStyles(){
    if(document.getElementById('finditRetailerDiscoveryStyles'))return;
    const s=document.createElement('style');s.id='finditRetailerDiscoveryStyles';s.textContent=\`
      .findit-retailer-wrap{margin-top:18px}.findit-retailer-head{display:flex;align-items:end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px}.findit-retailer-head h4{margin:0;font-size:18px}.findit-retailer-head p{margin:4px 0 0;opacity:.72;font-size:13px}.findit-retailer-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px}.findit-retailer-card{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 15px;border-radius:16px;border:1px solid rgba(130,150,220,.2);background:rgba(16,25,45,.72)}.findit-retailer-card strong{display:block;font-size:14px}.findit-retailer-card small{display:block;margin-top:3px;opacity:.68;font-size:11px}.findit-retailer-card a{white-space:nowrap;text-decoration:none;font-weight:800;padding:9px 11px;border-radius:11px;background:rgba(85,110,255,.18);border:1px solid rgba(110,130,255,.35)}.findit-pi-note{padding:14px 16px;border-radius:15px;background:rgba(100,120,180,.08);border:1px solid rgba(130,150,220,.16);margin-bottom:12px}.findit-pi-note b{display:block;margin-bottom:4px}.findit-pi-note small{opacity:.7}.pi-offer.findit-web-offer{position:relative}.pi-offer.findit-web-offer:before{content:'LIVE WEB';position:absolute;right:12px;top:10px;font-size:9px;letter-spacing:.12em;font-weight:900;opacity:.6}
    \`;document.head.appendChild(s)
  }
  function discoveryHtml(retailers){
    if(!Array.isArray(retailers)||!retailers.length)return '';
    return '<div class="findit-retailer-wrap"><div class="findit-retailer-head"><div><h4>Official retailer searches</h4><p>Keep searching the exact item on retailer websites when a price cannot be safely extracted.</p></div><small>Official sites • no invented prices</small></div><div class="findit-retailer-grid">'+retailers.map(r=>{const status=r.status==='products_detected'?'Product data detected':'Open retailer search';return '<div class="findit-retailer-card"><div><strong>'+h(r.name||'Retailer')+'</strong><small>'+h(status)+'</small></div>'+(goodUrl(r.searchUrl)?'<a href="'+h(r.searchUrl)+'" target="_blank" rel="noopener noreferrer">Search →</a>':'')+'</div>'}).join('')+'</div></div>'
  }
  window.loadProductIntelligence=async function(i){
    const panel=document.getElementById('productIntelligencePanel'),el=document.getElementById('productIntelligenceResults');if(!panel||!el)return;
    injectStyles();panel.classList.remove('hidden');el.innerHTML='<div class="findit-pi-note"><b>Checking live retailer websites…</b><small>FindIt is looking for matching product listings, prices and online availability.</small></div>';
    try{
      const r=await fetch('/api/product-intelligence',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query:i.searchQuery||i.name||i.object||'',name:i.name||i.object||'',object:i.object||'',brand:i.brand||'',model:i.model||'',category:i.category||'',retailCategory:i.retailCategory||''})});
      const d=await r.json();window.productIntelligence=d;
      if(!r.ok)throw new Error(d.error||'Product lookup failed');
      const offers=Array.isArray(d.offers)?d.offers:[],retailers=Array.isArray(d.webRetailers)?d.webRetailers:[];
      let out='';
      if(offers.length){
        out+=offers.map(o=>{const retailer=o.retailer?.name||'Retailer',price=money(o.price,o.currency||'ZAR'),stock=stockLabel(o.availability),verified=o.verified&&o.price!=null;return '<article class="pi-offer '+(verified?'verified ':'')+(o.listingType==='official_web'?'findit-web-offer':'')+'"><div><h4>'+h(o.product_name||d.bestProduct?.name||'Product')+'</h4><p>'+h(retailer)+'</p><div class="pi-meta"><span>'+(verified?'✓ Price found on listing':'Possible product match')+'</span><span>'+h(stock)+'</span><span>'+h(o.source||'Retailer source')+'</span></div><div class="pi-actions">'+(goodUrl(o.product_url)?'<a href="'+h(o.product_url)+'" target="_blank" rel="noopener noreferrer">View retailer page →</a>':'')+'</div></div><div class="pi-price">'+h(price)+'</div></article>'}).join('');
        out+='<div class="findit-pi-note"><b>'+offers.length+' retailer listing'+(offers.length===1?'':'s')+' found</b><small>Online availability is not the same as confirmed stock at a nearby physical branch. FindIt only claims branch stock when a retailer supplies branch-level evidence.</small></div>';
      }else{
        out+='<div class="findit-pi-note"><b>No price could be safely verified automatically yet.</b><small>Instead of leaving you with a dead end, FindIt has prepared exact-item searches on relevant official retailer websites below.</small></div>';
      }
      out+=discoveryHtml(retailers);
      el.innerHTML=out||'<div class="findit-pi-note"><b>No retailer result yet.</b><small>Try Correct item or another photo with the brand/model visible.</small></div>';
    }catch(e){
      console.error('FindIt Product Intelligence UI',e);el.innerHTML='<div class="findit-pi-note"><b>Retailer lookup is temporarily unavailable.</b><small>Your normal nearby retailer search still works. Please try again shortly.</small></div>';
    }
  };
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
