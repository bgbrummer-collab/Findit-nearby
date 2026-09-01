/* FindIt product research resilience: shared GET cache + local stale fallback. */
(()=>{
'use strict';
if(window.__finditResearchResilience)return;window.__finditResearchResilience=true;
const nativeFetch=window.fetch.bind(window);
const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const keyFor=i=>'findit_web_research_'+norm([i?.brand,i?.model,i?.searchQuery||i?.name||i?.object].filter(Boolean).join(' ')).slice(0,160);
const inflight=new Map();
function getCached(i){try{const x=JSON.parse(localStorage.getItem(keyFor(i))||'null');return x?.researched?x:null}catch{return null}}
function saveCached(i,d){try{if(d?.researched)localStorage.setItem(keyFor(i),JSON.stringify({...d,clientCachedAt:new Date().toISOString()}))}catch{}}
function responseJson(obj,status=200){return new Response(JSON.stringify(obj),{status,headers:{'content-type':'application/json','x-findit-cache':'client-fallback'}})}
function getUrl(i){const p=new URLSearchParams();[['name',i?.name],['brand',i?.brand],['model',i?.model],['object',i?.object],['category',i?.retailCategory||i?.category],['searchQuery',i?.searchQuery]].forEach(([k,v])=>{if(v)p.set(k,String(v).slice(0,500))});return '/api/product-insights?'+p.toString()}
window.fetch=async function(input,init){let url='';try{url=typeof input==='string'?input:input?.url||''}catch{}
 if(!url.includes('/api/product-insights'))return nativeFetch(input,init);
 let i=null;
 try{if((init?.method||'GET').toUpperCase()==='POST'&&init?.body){const b=JSON.parse(init.body);i=b.identification||b}}catch{}
 if(!i){try{const u=new URL(url,location.href);i={name:u.searchParams.get('name')||'',brand:u.searchParams.get('brand')||'',model:u.searchParams.get('model')||'',object:u.searchParams.get('object')||'',category:u.searchParams.get('category')||'',searchQuery:u.searchParams.get('searchQuery')||''}}catch{i={}}}
 const cached=getCached(i),k=keyFor(i);
 if(inflight.has(k))return (await inflight.get(k)).clone();
 const job=(async()=>{
   try{
     const r=await nativeFetch(getUrl(i),{method:'GET',headers:{accept:'application/json'}});
     const d=await r.clone().json().catch(()=>null);
     if(r.ok&&d?.researched){saveCached(i,d);return r}
     if(cached)return responseJson({...cached,cache:'client-stale',stale:true});
     return responseJson({error:'Product research is temporarily unavailable. Please try again shortly.',retryable:true},503);
   }catch{
     if(cached)return responseJson({...cached,cache:'client-stale',stale:true});
     return responseJson({error:'Product research is temporarily unavailable. Please try again shortly.',retryable:true},503);
   }
 })().finally(()=>inflight.delete(k));
 inflight.set(k,job);
 return (await job).clone();
};
})();
