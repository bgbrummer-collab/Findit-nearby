/* FindIt offer stability + evidence bridge — retries transient retail lookups and feeds visual clues into exact product search. */
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
  const currentIdentification=()=>{try{return window.state?.result?.identification||null}catch{return null}};
  const genericWords=new Set(['nike','adidas','shoe','shoes','sneaker','sneakers','running','black','white','blue','red','green','product','item','footwear','clothing','electronics','visible','text']);
  function distinctiveClues(i){
    const rows=[...(Array.isArray(i?.visibleText)?i.visibleText:[]),...(Array.isArray(i?.evidence)?i.evidence:[])];
    const out=[];
    for(const raw of rows){
      const s=String(raw||'').trim();if(!s)continue;
      const n=norm(s);if(n.length<4)continue;
      const words=n.split(' ').filter(Boolean);if(words.every(w=>genericWords.has(w)))continue;
      if(!out.some(x=>norm(x)===n))out.push(s);
      if(out.length>=3)break;
    }
    return out;
  }
  function enrichBody(body){
    const i=currentIdentification();if(!body||!i)return body;
    const next={...body,visibleText:i.visibleText||[],features:i.features||[],evidence:i.evidence||[],summary:i.summary||''};
    if(!String(next.model||'').trim()&&String(i.brand||next.brand||'').trim()){
      const clues=distinctiveClues(i),brand=String(i.brand||next.brand||'').trim(),object=String(i.object||next.object||i.category||'product').trim();
      if(clues.length){
        const evidenceQuery=[brand,...clues.slice(0,2),object].filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
        next.query=evidenceQuery;
        next.searchQuery=evidenceQuery;
        next.visualEvidenceQuery=true;
      }
    }
    return next;
  }
  const keyFor=(path,b)=>{
    if(!b)return'';
    const q=[b.query,b.searchQuery,b.name,b.object,b.brand,b.model,b.category,b.retailCategory].map(norm).filter(Boolean).join('|');
    return q?`findit_offer_cache_v2:${path}:${q}`:'';
  };
  const useful=(path,d)=>{
    if(!d||typeof d!=='object')return false;
    if(path==='/api/product-intelligence-v2')return Array.isArray(d.offers)&&d.offers.some(o=>o&&o.verified===true&&(Number.isFinite(Number(o.price))||o.availability));
    if(path==='/api/official-brand-intelligence')return Array.isArray(d.retailerMatches)&&d.retailerMatches.some(x=>x&&x.sourceUrl&&Number(x.matchConfidence||0)>=.8&&(Number.isFinite(Number(x.price))||x.onlineAvailability||x.branchStockVerified));
    return false;
  };
  const readCache=k=>{if(!k)return null;try{const x=JSON.parse(localStorage.getItem(k)||'null');if(!x||!x.ts||Date.now()-x.ts>MAX_AGE)return null;return x.data||null}catch{return null}};
  const writeCache=(k,d)=>{if(!k)return;try{localStorage.setItem(k,JSON.stringify({ts:Date.now(),data:d}))}catch{}};
  const jsonResponse=d=>new Response(JSON.stringify(d),{status:200,headers:{'content-type':'application/json','cache-control':'no-store','x-findit-offer-source':'recent-verified-fallback'}});

  window.fetch=async function(input,init){
    const path=endpoint(input),method=String(init?.method||'GET').toUpperCase();
    if(!['/api/product-intelligence-v2','/api/official-brand-intelligence'].includes(path)||method!=='POST')return originalFetch(input,init);
    const parsed=bodyFromInit(init),body=enrichBody(parsed),nextInit=body?{...init,body:JSON.stringify(body)}:init,key=keyFor(path,body);
    let first=null,firstData=null;
    try{
      first=await originalFetch(input,nextInit);
      firstData=await first.clone().json().catch(()=>null);
      if(first.ok&&useful(path,firstData)){writeCache(key,firstData);return first}
      await sleep(450);
      const second=await originalFetch(input,nextInit),secondData=await second.clone().json().catch(()=>null);
      if(second.ok&&useful(path,secondData)){writeCache(key,secondData);return second}
      const cached=readCache(key);if(cached)return jsonResponse({...cached,recoveredFromRecentVerifiedResult:true,recoveredAt:new Date().toISOString()});
      return second.ok?second:(first||second);
    }catch(err){
      const cached=readCache(key);if(cached)return jsonResponse({...cached,recoveredFromRecentVerifiedResult:true,recoveredAt:new Date().toISOString()});
      if(first)return first;throw err;
    }
  };
})();
