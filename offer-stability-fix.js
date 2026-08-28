/* FindIt stability/evidence layer — fast-path version.
   User-facing requests return immediately. Any recovery refresh happens in the background,
   so retailer stability no longer makes buttons/search feel frozen. */
(()=>{
  'use strict';
  if(window.__finditOfferStabilityV3)return;window.__finditOfferStabilityV3=true;
  const originalFetch=window.fetch.bind(window);
  const MAX_AGE=20*60*1000;
  const norm=v=>String(v??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  const toks=v=>[...new Set(norm(v).split(' ').filter(x=>x.length>2))];
  const safeParse=s=>{try{return JSON.parse(s)}catch{return null}};
  const requestUrl=input=>{try{return new URL(typeof input==='string'?input:input?.url,location.href)}catch{return null}};
  const endpoint=input=>requestUrl(input)?.pathname||'';
  const bodyFromInit=init=>{if(!init?.body||typeof init.body!=='string')return null;return safeParse(init.body)};
  const isExactAction=input=>requestUrl(input)?.searchParams?.get('action')==='exact';
  const keyFor=(path,b)=>{
    if(!b)return'';
    const q=[b.query,b.name,b.object,b.brand,b.model,b.category,b.retailCategory].map(norm).filter(Boolean).join('|');
    return q?`findit_offer_cache_v3:${path}:${q}`:'';
  };
  const useful=(path,d,exactAction=false)=>{
    if(!d||typeof d!=='object')return false;
    if(path==='/api/product-intelligence-v2')return Array.isArray(d.offers)&&d.offers.some(o=>o&&o.verified===true&&(Number.isFinite(Number(o.price))||o.availability));
    if(path==='/api/official-brand-intelligence'&&exactAction)return d.exactFound===true&&Number(d.confidence||0)>=.76&&Boolean(d.productName);
    if(path==='/api/official-brand-intelligence')return Array.isArray(d.retailerMatches)&&d.retailerMatches.some(x=>x&&x.sourceUrl&&Number(x.matchConfidence||0)>=.8&&(Number.isFinite(Number(x.price))||x.onlineAvailability||x.branchStockVerified));
    return false;
  };
  const readCache=k=>{
    if(!k)return null;
    try{const x=JSON.parse(localStorage.getItem(k)||'null');if(!x||!x.ts||Date.now()-x.ts>MAX_AGE)return null;return x.data||null}catch{return null}
  };
  const writeCache=(k,d)=>{if(!k)return;try{localStorage.setItem(k,JSON.stringify({ts:Date.now(),data:d}))}catch{}};
  const jsonResponse=(d,status=200,source='recent-verified-fallback')=>new Response(JSON.stringify(d),{status,headers:{'content-type':'application/json','cache-control':'no-store','x-findit-offer-source':source}});

  const LABEL_DRIVEN=/\b(conditioner|shampoo|hair care|haircare|skincare|skin care|serum|cosmetic|makeup|moisturizer|moisturiser|lotion|cream|cleanser|deodorant|toothpaste|detergent|cleaner|soap|grocery|food|beverage|drink|cereal|supplement|vitamin)\b/i;
  const MODEL_GENERIC=new Set(['conditioner','shampoo','hair','care','skin','skincare','product','item','cream','lotion','serum','cleanser','beauty','moisture','moisturizer','moisturiser','blend','triple','professional','true']);
  function parseBaseIdentification(init){
    if(!(init?.body instanceof FormData))return null;
    const raw=String(init.body.get('baseIdentification')||'').trim();if(!raw)return null;
    const parts=raw.split(';').map(x=>x.trim()).filter(Boolean),name=parts[0]||'';
    const field=key=>{const p=parts.find(x=>x.toLowerCase().startsWith(key+' '));return p?p.slice(key.length+1).trim():''};
    return{name,brand:field('brand'),model:field('model'),visible:field('visible'),features:field('features'),raw};
  }
  function strongLabelIdentity(init,d){
    if(d?.exactFound===true)return null;
    const b=parseBaseIdentification(init);if(!b?.name||!b.brand||!b.model||!b.visible||!LABEL_DRIVEN.test(`${b.name} ${b.model} ${b.features}`))return null;
    const visible=norm(b.visible),brand=norm(b.brand);
    const keys=toks(b.model).filter(t=>!MODEL_GENERIC.has(t)&&t!==brand&&t.length>3);
    if(!keys.length)return null;
    const hits=keys.filter(t=>visible.includes(t));
    const needed=keys.length===1?1:Math.min(2,keys.length);
    if(hits.length<needed)return null;
    return{...(d&&typeof d==='object'?d:{}),exactFound:true,confidence:Math.max(.86,Number(d?.confidence||0)),productName:b.name,brand:b.brand,model:b.model,searchQuery:b.name,evidence:[...(Array.isArray(d?.evidence)?d.evidence:[]),'Brand and model/variant are supported by readable text on the photographed product label.'],note:'Exact identity accepted from strong on-product label evidence. Retailer prices and stock still require retailer-page verification.',exactIdentitySource:'visual-label-evidence'};
  }

  function backgroundRefresh(input,init,path,key,exactAction){
    // Never block a click/search for a retry. A quiet refresh can improve the next request.
    if(exactAction||!key)return;
    setTimeout(async()=>{
      try{
        const r=await originalFetch(input,init);
        if(!r.ok)return;
        const d=await r.clone().json().catch(()=>null);
        if(useful(path,d,false))writeCache(key,d);
      }catch{}
    },0);
  }

  window.fetch=async function(input,init){
    const path=endpoint(input),method=String(init?.method||'GET').toUpperCase();
    if(!['/api/product-intelligence-v2','/api/official-brand-intelligence'].includes(path)||method!=='POST')return originalFetch(input,init);
    const exactAction=path==='/api/official-brand-intelligence'&&isExactAction(input);
    const body=bodyFromInit(init),key=exactAction?'':keyFor(path,body);
    try{
      const first=await originalFetch(input,init);
      const data=await first.clone().json().catch(()=>null);
      if(first.ok&&exactAction){
        if(useful(path,data,true))return first;
        const promoted=strongLabelIdentity(init,data);if(promoted)return jsonResponse(promoted,200,'visual-label-evidence');
        return first;
      }
      if(first.ok&&useful(path,data,false)){writeCache(key,data);return first}
      const cached=readCache(key);
      if(cached){backgroundRefresh(input,init,path,key,false);return jsonResponse({...cached,recoveredFromRecentVerifiedResult:true,recoveredAt:new Date().toISOString()})}
      backgroundRefresh(input,init,path,key,false);
      return first;
    }catch(err){
      const cached=readCache(key);
      if(cached)return jsonResponse({...cached,recoveredFromRecentVerifiedResult:true,recoveredAt:new Date().toISOString()});
      throw err;
    }
  };

  function addNearbyDirections(){
    document.querySelectorAll('#nearbyStores .store-card').forEach(card=>{
      const actions=card.querySelector('.store-actions');if(!actions||actions.querySelector('[data-findit-directions="1"]'))return;
      if([...actions.querySelectorAll('a')].some(a=>/directions/i.test(a.textContent||'')))return;
      const map=[...actions.querySelectorAll('a')].find(a=>/\bmap\b/i.test(a.textContent||''));if(!map)return;
      try{
        const u=new URL(map.href,location.href),query=u.searchParams.get('query');if(!query||!/,/.test(query))return;
        const exact=card.dataset.exactBranch==='1';
        if(!exact)return;
        const a=document.createElement('a');a.dataset.finditDirections='1';a.target='_blank';a.rel='noopener noreferrer';a.textContent='Directions to store →';
        a.href=`https://www.google.com/maps/dir/?${new URLSearchParams({api:'1',destination:query})}`;actions.appendChild(a);
      }catch{}
    });
  }
  let directionsQueued=false;
  const queueDirections=()=>{if(directionsQueued)return;directionsQueued=true;requestAnimationFrame(()=>{directionsQueued=false;addNearbyDirections()})};
  document.addEventListener('findit:results-rendered',queueDirections);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addNearbyDirections,{once:true});else addNearbyDirections();
  const mo=new MutationObserver(queueDirections);
  const startObserver=()=>{const root=document.querySelector('#nearbyStores');if(root)mo.observe(root,{childList:true,subtree:true})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startObserver,{once:true});else startObserver();
})();
