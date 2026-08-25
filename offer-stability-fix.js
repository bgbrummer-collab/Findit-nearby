/* FindIt offer stability layer — retries transient retail lookups, rescues empty exact-product searches, and reuses only recent exact results for the SAME query. */
(()=>{
  'use strict';
  if(window.__finditOfferStabilityV2)return;window.__finditOfferStabilityV2=true;
  const originalFetch=window.fetch.bind(window);
  const MAX_AGE=20*60*1000;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const norm=v=>String(v??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  const safeParse=s=>{try{return JSON.parse(s)}catch{return null}};
  const endpoint=u=>{try{return new URL(typeof u==='string'?u:u?.url,location.href).pathname}catch{return''}};
  const bodyFromInit=init=>{if(!init?.body||typeof init.body!=='string')return null;return safeParse(init.body)};
  const keyFor=(path,b)=>{if(!b)return'';const q=[b.query,b.name,b.object,b.brand,b.model,b.category,b.retailCategory].map(norm).filter(Boolean).join('|');return q?`findit_offer_cache_v2:${path}:${q}`:''};
  const useful=(path,d)=>{if(!d||typeof d!=='object')return false;if(path==='/api/product-intelligence-v2')return Array.isArray(d.offers)&&d.offers.some(o=>o&&o.verified===true&&(Number.isFinite(Number(o.price))||o.availability));if(path==='/api/official-brand-intelligence')return Array.isArray(d.retailerMatches)&&d.retailerMatches.some(x=>x&&x.sourceUrl&&Number(x.matchConfidence||0)>=.8&&(Number.isFinite(Number(x.price))||x.onlineAvailability||x.branchStockVerified));return false};
  const readCache=k=>{if(!k)return null;try{const x=JSON.parse(localStorage.getItem(k)||'null');if(!x||!x.ts||Date.now()-x.ts>MAX_AGE)return null;return x.data||null}catch{return null}};
  const writeCache=(k,d)=>{if(!k)return;try{localStorage.setItem(k,JSON.stringify({ts:Date.now(),data:d}))}catch{}};
  const jsonResponse=(d,status=200,source='findit-offer-stability-v2')=>new Response(JSON.stringify(d),{status,headers:{'content-type':'application/json','cache-control':'no-store','x-findit-offer-source':source}});
  const mergeProduct=(base,rescue)=>{const seen=new Set(),offers=[];for(const o of [...(base?.offers||[]),...(rescue?.offers||[])]){const k=norm(`${o?.retailer?.name||o?.retailer||''}|${o?.product_url||o?.url||''}`);if(!k||seen.has(k))continue;seen.add(k);offers.push(o)}const priced=offers.filter(o=>Number.isFinite(Number(o?.price))).sort((a,b)=>Number(a.price)-Number(b.price));return{...(base||{}),offers,matched:offers.length>0,verifiedOfferCount:offers.length,verifiedSellerCount:new Set(offers.map(o=>o?.retailer?.name||o?.retailer).filter(Boolean)).size,bestPrice:priced[0]||base?.bestPrice||null,rescuedExactProduct:Boolean(rescue?.offers?.length)}};
  async function rescueProduct(body,base){try{const r=await originalFetch('/api/exact-product-rescue',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body||{})});const d=await r.json().catch(()=>null);if(r.ok&&Array.isArray(d?.offers)&&d.offers.length)return mergeProduct(base,d)}catch{}return base};

  window.fetch=async function(input,init){
    const path=endpoint(input),method=String(init?.method||'GET').toUpperCase();
    if(!['/api/product-intelligence-v2','/api/official-brand-intelligence'].includes(path)||method!=='POST')return originalFetch(input,init);
    const body=bodyFromInit(init),key=keyFor(path,body);
    let first=null,firstData=null;
    try{
      first=await originalFetch(input,init);
      firstData=await first.clone().json().catch(()=>null);
      if(first.ok&&useful(path,firstData)){writeCache(key,firstData);return first}
      await sleep(350);
      const second=await originalFetch(input,init),secondData=await second.clone().json().catch(()=>null);
      if(second.ok&&useful(path,secondData)){writeCache(key,secondData);return second}
      if(path==='/api/product-intelligence-v2'){
        const base=secondData||firstData||{};
        const rescued=await rescueProduct(body,base);
        if(Array.isArray(rescued?.offers)&&rescued.offers.length){writeCache(key,rescued);return jsonResponse(rescued,200,'exact-product-rescue')}
      }
      const cached=readCache(key);if(cached)return jsonResponse({...cached,recoveredFromRecentVerifiedResult:true,recoveredAt:new Date().toISOString()});
      return second.ok?second:(first||second);
    }catch(err){
      if(path==='/api/product-intelligence-v2'){
        const rescued=await rescueProduct(body,firstData||{});
        if(Array.isArray(rescued?.offers)&&rescued.offers.length){writeCache(key,rescued);return jsonResponse(rescued,200,'exact-product-rescue')}
      }
      const cached=readCache(key);if(cached)return jsonResponse({...cached,recoveredFromRecentVerifiedResult:true,recoveredAt:new Date().toISOString()});
      if(first)return first;throw err;
    }
  };
})();
