/* FindIt stability/evidence + pipeline bridge — fast-path version.
   Keeps UI fast, promotes only strong on-package identities, and normalises
   retailer/nearby category data before those requests leave the browser. */
(()=>{
  'use strict';
  if(window.__finditOfferStabilityV4)return;window.__finditOfferStabilityV4=true;
  const originalFetch=window.fetch.bind(window);
  const MAX_AGE=20*60*1000;
  const norm=v=>String(v??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  const toks=v=>[...new Set(norm(v).split(' ').filter(x=>x.length>1))];
  const safeParse=s=>{try{return JSON.parse(s)}catch{return null}};
  const requestUrl=input=>{try{return new URL(typeof input==='string'?input:input?.url,location.href)}catch{return null}};
  const endpoint=input=>requestUrl(input)?.pathname||'';
  const bodyFromInit=init=>{if(!init?.body||typeof init.body!=='string')return null;return safeParse(init.body)};
  const isExactAction=input=>requestUrl(input)?.searchParams?.get('action')==='exact';
  const keyFor=(path,b)=>{if(!b)return'';const q=[b.query,b.name,b.object,b.brand,b.model,b.category,b.retailCategory].map(norm).filter(Boolean).join('|');return q?`findit_offer_cache_v4:${path}:${q}`:''};
  const useful=(path,d,exactAction=false)=>{
    if(!d||typeof d!=='object')return false;
    if(path==='/api/product-intelligence-v2')return Array.isArray(d.offers)&&d.offers.some(o=>o&&o.verified===true&&(Number.isFinite(Number(o.price))||o.availability));
    if(path==='/api/official-brand-intelligence'&&exactAction)return d.exactFound===true&&Number(d.confidence||0)>=.76&&Boolean(d.productName);
    if(path==='/api/official-brand-intelligence')return Array.isArray(d.retailerMatches)&&d.retailerMatches.some(x=>x&&x.sourceUrl&&Number(x.matchConfidence||0)>=.8&&(Number.isFinite(Number(x.price))||x.onlineAvailability||x.branchStockVerified));
    return false;
  };
  const readCache=k=>{if(!k)return null;try{const x=JSON.parse(localStorage.getItem(k)||'null');if(!x||!x.ts||Date.now()-x.ts>MAX_AGE)return null;return x.data||null}catch{return null}};
  const writeCache=(k,d)=>{if(!k)return;try{localStorage.setItem(k,JSON.stringify({ts:Date.now(),data:d}))}catch{}};
  const jsonResponse=(d,status=200,source='recent-verified-fallback')=>new Response(JSON.stringify(d),{status,headers:{'content-type':'application/json','cache-control':'no-store','x-findit-offer-source':source}});

  const LABEL_DRIVEN=/\b(conditioner|shampoo|hair care|haircare|skincare|skin care|serum|cosmetic|makeup|moisturizer|moisturiser|lotion|cream|cleanser|deodorant|toothpaste|detergent|cleaner|soap|grocery|food|beverage|drink|cereal|supplement|vitamin|toilet paper|tissue|paper towel|household|laundry|dishwashing|packaged)\b/i;
  const LABEL_GENERIC=new Set(['product','item','pack','packet','bottle','tube','box','bag','toilet','paper','tissue','roll','rolls','conditioner','shampoo','hair','care','skin','skincare','cream','lotion','serum','cleanser','beauty','grocery','food','household','white','black','professional','original','new']);
  function parseBaseIdentification(init){
    if(!(init?.body instanceof FormData))return null;
    const raw=String(init.body.get('baseIdentification')||'').trim();if(!raw)return null;
    const parts=raw.split(';').map(x=>x.trim()).filter(Boolean),name=parts[0]||'';
    const field=key=>{const p=parts.find(x=>x.toLowerCase().startsWith(key+' '));return p?p.slice(key.length+1).trim():''};
    return{name,brand:field('brand'),model:field('model'),visible:field('visible'),features:field('features'),raw};
  }
  function strongLabelIdentity(init,d){
    if(d?.exactFound===true)return null;
    const b=parseBaseIdentification(init);if(!b?.name||!b.brand||!b.visible||!LABEL_DRIVEN.test(`${b.name} ${b.model} ${b.features}`))return null;
    const visible=norm(b.visible),brand=norm(b.brand);if(!brand||!visible.includes(brand))return null;
    const source=norm(`${b.model||''} ${b.name}`);
    const keys=toks(source).filter(t=>!LABEL_GENERIC.has(t)&&t!==brand&&t.length>1);
    const evidenceKeys=[...new Set(keys.filter(t=>visible.includes(t)))];
    const numeric=[...new Set((source.match(/\b\d{1,4}\b/g)||[]).filter(t=>visible.includes(t)))];
    const evidenceCount=new Set([...evidenceKeys,...numeric]).size;
    if(evidenceCount<2)return null;
    return{...(d&&typeof d==='object'?d:{}),exactFound:true,confidence:Math.max(.86,Number(d?.confidence||0)),productName:b.name,brand:b.brand,model:b.model||null,searchQuery:b.name,evidence:[...(Array.isArray(d?.evidence)?d.evidence:[]),'Product brand and multiple identity details are directly readable on the photographed package/label.'],note:'Exact photo identity accepted from strong on-product label evidence. Retailer price and stock still require retailer-page verification.',exactIdentitySource:'visual-label-evidence'};
  }

  function inferFamily(v){
    const x=norm(v);
    if(/\b(car|vehicle|automotive|sedan|coupe|suv|bakkie|pickup|hatchback|mercedes|benz|ford|toyota|bmw|audi|volkswagen)\b/.test(x))return'automotive';
    if(/plug adapter|plug adaptor|multi plug|multiplug|power strip|extension lead|extension cord|electrical accessory|socket adaptor/.test(x))return'electrical';
    if(/appliance|fridge|washing machine|microwave|air fryer|dishwasher|toaster|kettle|vacuum/.test(x))return'appliances';
    if(/grocery|household|toilet paper|tissue|paper towel|food|drink|supermarket|cleaning|detergent|snack|bread|milk|cereal/.test(x))return'grocery';
    if(/shoe|sneaker|footwear|boot|trainer|samba/.test(x))return'footwear';
    if(/clothing|clothes|fashion|shirt|dress|jacket|jeans|pants/.test(x))return'clothing';
    if(/hardware|tool|drill|hammer|wrench|spanner|screwdriver|pliers|saw|paint|plumbing|diy/.test(x))return'hardware';
    if(/electronic|microphone|audio|computer|phone|camera|speaker|headphone|headset|gaming|laptop|monitor|keyboard|mouse|router|charger|bluetooth/.test(x))return'electronics';
    if(/salt shaker|pepper shaker|salt and pepper|pepper mill|salt mill|kitchenware|cookware|utensil|tableware|cutlery/.test(x))return'kitchenware';
    if(/beauty|perfume|cosmetic|skincare|makeup|shampoo|conditioner|hair care/.test(x))return'beauty';
    if(/garden|plant|flower/.test(x))return'garden';
    if(/sport|fitness|gym|soccer|rugby|cricket|tennis/.test(x))return'sports';
    return'general';
  }
  function normaliseCommerceBody(b){
    if(!b||typeof b!=='object')return b;
    const text=[b.query,b.searchQuery,b.name,b.object,b.brand,b.model,b.category,b.retailCategory].filter(Boolean).join(' '),fam=inferFamily(text);
    if(fam!=='general'&&(norm(b.retailCategory)==='general'||norm(b.retailCategory)==='product'||!b.retailCategory))b.retailCategory=fam;
    if(fam!=='general'&&(norm(b.category)==='general'||norm(b.category)==='product'||!b.category))b.category=fam;
    if(!b.query)b.query=b.searchQuery||b.name||b.object||'';
    if(!b.searchQuery)b.searchQuery=b.query||b.name||b.object||'';
    return b;
  }
  function normaliseNearbyBody(b){
    if(!b||typeof b!=='object')return b;
    const i={...(b.identification||{})};
    const text=[i.searchQuery,i.name,i.object,i.brand,i.model,i.category,i.retailCategory].filter(Boolean).join(' '),fam=inferFamily(text);
    if(fam!=='general'&&(norm(i.retailCategory)==='general'||norm(i.retailCategory)==='product'||!i.retailCategory))i.retailCategory=fam;
    if(fam!=='general'&&(norm(i.category)==='general'||norm(i.category)==='product'||!i.category))i.category=fam;
    if(!i.searchQuery)i.searchQuery=i.name||i.object||'';
    b.identification=i;return b;
  }
  function rewrittenInit(path,init){
    if(!init?.body||typeof init.body!=='string')return init;
    const parsed=safeParse(init.body);if(!parsed)return init;
    const next=path==='/api/nearby'?normaliseNearbyBody(parsed):normaliseCommerceBody(parsed);
    return{...init,body:JSON.stringify(next)};
  }

  function backgroundRefresh(input,init,path,key,exactAction){if(exactAction||!key)return;setTimeout(async()=>{try{const r=await originalFetch(input,init);if(!r.ok)return;const d=await r.clone().json().catch(()=>null);if(useful(path,d,false))writeCache(key,d)}catch{}},0)}

  window.fetch=async function(input,init){
    const path=endpoint(input),method=String(init?.method||'GET').toUpperCase();
    if(path==='/api/nearby'&&method==='POST')return originalFetch(input,rewrittenInit(path,init));
    if(!['/api/product-intelligence-v2','/api/official-brand-intelligence'].includes(path)||method!=='POST')return originalFetch(input,init);
    const effective=path==='/api/product-intelligence-v2'?rewrittenInit(path,init):init;
    const exactAction=path==='/api/official-brand-intelligence'&&isExactAction(input);
    const body=bodyFromInit(effective),key=exactAction?'':keyFor(path,body);
    try{
      const first=await originalFetch(input,effective);
      const data=await first.clone().json().catch(()=>null);
      if(first.ok&&exactAction){if(useful(path,data,true))return first;const promoted=strongLabelIdentity(effective,data);if(promoted)return jsonResponse(promoted,200,'visual-label-evidence');return first}
      if(first.ok&&useful(path,data,false)){writeCache(key,data);return first}
      const cached=readCache(key);if(cached){backgroundRefresh(input,effective,path,key,false);return jsonResponse({...cached,recoveredFromRecentVerifiedResult:true,recoveredAt:new Date().toISOString()})}
      backgroundRefresh(input,effective,path,key,false);return first;
    }catch(err){const cached=readCache(key);if(cached)return jsonResponse({...cached,recoveredFromRecentVerifiedResult:true,recoveredAt:new Date().toISOString()});throw err}
  };

  function addNearbyDirections(){document.querySelectorAll('#nearbyStores .store-card').forEach(card=>{const actions=card.querySelector('.store-actions');if(!actions||actions.querySelector('[data-findit-directions="1"]'))return;if([...actions.querySelectorAll('a')].some(a=>/directions/i.test(a.textContent||'')))return;const map=[...actions.querySelectorAll('a')].find(a=>/\bmap\b/i.test(a.textContent||''));if(!map||card.dataset.exactBranch!=='1')return;try{const u=new URL(map.href,location.href),query=u.searchParams.get('query');if(!query||!/,/.test(query))return;const a=document.createElement('a');a.dataset.finditDirections='1';a.target='_blank';a.rel='noopener noreferrer';a.textContent='Directions to store →';a.href=`https://www.google.com/maps/dir/?${new URLSearchParams({api:'1',destination:query})}`;actions.appendChild(a)}catch{}})}
  let directionsQueued=false;const queueDirections=()=>{if(directionsQueued)return;directionsQueued=true;requestAnimationFrame(()=>{directionsQueued=false;addNearbyDirections()})};
  document.addEventListener('findit:results-rendered',queueDirections);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addNearbyDirections,{once:true});else addNearbyDirections();
  const mo=new MutationObserver(queueDirections);const startObserver=()=>{const root=document.querySelector('#nearbyStores');if(root)mo.observe(root,{childList:true,subtree:true})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startObserver,{once:true});else startObserver();
})();
