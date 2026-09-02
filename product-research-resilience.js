/* FindIt product research resilience: verified retailer-source GET + local stale fallback. */
(()=>{
'use strict';
if(window.__finditResearchResilienceV2)return;window.__finditResearchResilienceV2=true;
const nativeFetch=window.fetch.bind(window);
const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const keyFor=i=>'findit_web_research_'+norm([i?.brand,i?.model,i?.searchQuery||i?.name||i?.object].filter(Boolean).join(' ')).slice(0,160);
const inflight=new Map();
function getCached(i){try{const x=JSON.parse(localStorage.getItem(keyFor(i))||'null');return x?.researched?x:null}catch{return null}}
function saveCached(i,d){try{if(d?.researched)localStorage.setItem(keyFor(i),JSON.stringify({...d,clientCachedAt:new Date().toISOString()}))}catch{}}
function responseJson(obj,status=200){return new Response(JSON.stringify(obj),{status,headers:{'content-type':'application/json','x-findit-cache':'client-fallback'}})}
function sourceRows(xs){const seen=new Set(),out=[];for(const o of Array.isArray(xs)?xs:[]){if(!(o?.verified===true||o?.sourcePageVerified===true))continue;const url=o?.product_url||o?.url||'';if(!/^https?:\/\//i.test(url))continue;let h='';try{h=new URL(url).hostname.replace(/^www\./,'')}catch{}if(!h||seen.has(h))continue;seen.add(h);out.push({url,title:o?.product_name||o?.name||'',retailer:o?.retailer?.name||o?.retailer||h});if(out.length>=3)break}return out}
function currentSources(){try{return sourceRows(window.productIntelligence?.offers||window.finditState?.offers||window.state?.offers||[])}catch{return[]}}
function getUrl(i,sources=[]){const p=new URLSearchParams();[['name',i?.name],['brand',i?.brand],['model',i?.model],['object',i?.object],['category',i?.retailCategory||i?.category],['searchQuery',i?.searchQuery]].forEach(([k,v])=>{if(v)p.set(k,String(v).slice(0,500))});const rows=sourceRows(sources).length?sourceRows(sources):currentSources();if(rows.length)p.set('sources',JSON.stringify(rows));return '/api/product-insights?'+p.toString()}
window.fetch=async function(input,init){let url='';try{url=typeof input==='string'?input:input?.url||''}catch{}
 if(!url.includes('/api/product-insights'))return nativeFetch(input,init);
 let i=null,sources=[];
 try{if((init?.method||'GET').toUpperCase()==='POST'&&init?.body){const b=JSON.parse(init.body);i=b.identification||b;sources=b.offers||b.sources||[]}}catch{}
 if(!i){try{const u=new URL(url,location.href);i={name:u.searchParams.get('name')||'',brand:u.searchParams.get('brand')||'',model:u.searchParams.get('model')||'',object:u.searchParams.get('object')||'',category:u.searchParams.get('category')||'',searchQuery:u.searchParams.get('searchQuery')||''};const raw=u.searchParams.get('sources');if(raw)sources=JSON.parse(raw)}catch{i={}}}
 const cached=getCached(i),k=keyFor(i);
 if(inflight.has(k))return (await inflight.get(k)).clone();
 const job=(async()=>{
   try{
     const requestUrl=getUrl(i,sources),hasSources=requestUrl.includes('sources=');
     if(!hasSources&&cached)return responseJson({...cached,cache:'client-stale',stale:true});
     const r=await nativeFetch(requestUrl,{method:'GET',headers:{accept:'application/json'}});
     const d=await r.clone().json().catch(()=>null);
     if(r.ok&&d?.researched){saveCached(i,d);return r}
     if(cached)return responseJson({...cached,cache:'client-stale',stale:true});
     return responseJson({researched:false,whatItDoes:'',pros:[],cons:[],sources:[],message:'No verified retailer research is available for this exact product yet.'},200);
   }catch{
     if(cached)return responseJson({...cached,cache:'client-stale',stale:true});
     return responseJson({researched:false,whatItDoes:'',pros:[],cons:[],sources:[],message:'No verified retailer research is available for this exact product yet.'},200);
   }
 })().finally(()=>inflight.delete(k));
 inflight.set(k,job);
 return (await job).clone();
};
})();

(()=>{if(!document.querySelector('script[data-findit-paid-tool-audit]')){const s=document.createElement('script');s.src='/premium-tool-audit-fix.js?v=20260901-audit1';s.defer=true;s.dataset.finditPaidToolAudit='1';document.head.appendChild(s)}})();
