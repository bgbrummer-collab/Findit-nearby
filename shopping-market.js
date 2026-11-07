/* Apply the explicit shopping market across photo, text, saved and comparison requests. */
(()=>{
'use strict';
if(window.__finditShoppingMarketBridge)return;window.__finditShoppingMarketBridge=true;
const nativeFetch=window.fetch.bind(window),routes=new Set(['/api/product-intelligence','/api/product-intelligence-v2']);
const country=()=>{try{const value=String(localStorage.getItem('finditShoppingCountry')||'').toUpperCase();return /^[A-Z]{2}$/.test(value)?value:'';}catch{return '';}};
window.finditShoppingMarket=country;
const readRoutes=new Set([...routes,'/api/product-insights','/api/nearby']);
const pause=signal=>new Promise((resolve,reject)=>{if(signal.aborted)return reject(signal.reason);const done=()=>{signal.removeEventListener('abort',abort);resolve();},timer=setTimeout(done,250),abort=()=>{clearTimeout(timer);reject(signal.reason);};signal.addEventListener('abort',abort,{once:true});});
async function send(input,init){
 let url;try{url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,location.href);}catch{return nativeFetch(input,init);}
 const method=String(init?.method||input?.method||'GET').toUpperCase();
 if(url.origin!==location.origin||!readRoutes.has(url.pathname)||!['GET','POST'].includes(method)||init?.finditRetryManaged||init?.body&&typeof init.body!=='string')return nativeFetch(input,init);
 const own=new AbortController(),signal=init?.signal||input?.signal||own.signal,timer=signal===own.signal?setTimeout(()=>own.abort(),30000):null;
 try{for(let attempt=0;attempt<2;attempt++){
  let response;
  try{response=await nativeFetch(typeof Request!=='undefined'&&input instanceof Request?input.clone():input,{...init,signal});}
  catch(error){if(attempt||signal.aborted||!(error instanceof TypeError))throw error;}
  if(attempt===0&&(!response||[500,502,503,504].includes(response.status))&&!signal.aborted){await response?.body?.cancel().catch(()=>{});await pause(signal);continue;}
  return response;
 }}finally{if(timer!==null)clearTimeout(timer);}
}
window.fetch=async function(input,init){
 const selected=country();if(!selected)return send(input,init);
 let url;try{url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,location.href);}catch{return send(input,init);}
 if(url.origin!==location.origin||!routes.has(url.pathname))return send(input,init);
 const method=String(init?.method||input?.method||'GET').toUpperCase();
 if(method==='GET'){
  if(url.searchParams.has('country'))return send(input,init);
  url.searchParams.set('country',selected);
  return send(typeof Request!=='undefined'&&input instanceof Request?new Request(url.href,input):url.href,init);
 }
 if(method!=='POST')return send(input,init);
 let raw=init?.body;
 if(raw===undefined&&typeof Request!=='undefined'&&input instanceof Request){try{raw=await input.clone().text();}catch{return send(input,init);}}
 if(typeof raw!=='string')return send(input,init);
 let body;try{body=JSON.parse(raw);}catch{return send(input,init);}
 if(!body||typeof body!=='object'||Array.isArray(body)||body.country)return send(input,init);
 const next={...init,body:JSON.stringify({...body,country:selected})};
 return typeof Request!=='undefined'&&input instanceof Request?send(new Request(input,next)):send(input,next);
};
})();
