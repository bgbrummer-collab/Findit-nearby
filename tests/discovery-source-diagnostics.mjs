// Read-only public-source audit. No photos, credentials or coordinates are sent.
import fs from 'node:fs/promises';
import {AsyncLocalStorage} from 'node:async_hooks';
import {nativeRetailerUrls} from '../lib/native-retailer-discovery.js';
import {ident,verify} from '../lib/product-intelligence-core.js';

const baseline=JSON.parse(await fs.readFile(process.env.FINDIT_BASELINE||new URL('../docs/launch-evidence-2026-11-02/broad-after-7cb393d.json',import.meta.url),'utf8'));
const cases=baseline.results.filter(r=>r.status==='failed');
const contexts=new AsyncLocalStorage(),original=globalThis.fetch;
globalThis.fetch=async(input,options)=>{
 const rows=contexts.getStore(),url=String(input.url||input),started=Date.now();
 try{
  const response=await original(input,options);
  if(rows){const raw=await response.clone().text();rows.push({url,status:response.status,ms:Date.now()-started,characters:raw.length,title:raw.match(/<title[^>]*>([^<]*)/i)?.[1]||'',challenge:/verify (?:that )?you are human|checking your browser|cf-chl-/i.test(raw.slice(0,20000)),productTitles:raw.startsWith('{')?(()=>{try{return JSON.parse(raw).resources?.results?.products?.map(p=>p.title)||[]}catch{return[]}})():[]});}
  return response;
 }catch(error){rows?.push({url,ms:Date.now()-started,error:error.name});throw error;}
};
const results=[];let cursor=0;
await Promise.all(Array.from({length:2},async()=>{while(cursor<cases.length){
 const row=cases[cursor++],requests=[];
 await contexts.run(requests,async()=>{
  const identification=ident(row.search.data.identification);
  const urls=await nativeRetailerUrls(identification,{readerFallback:false});
  const verified=await Promise.all(urls.slice(0,12).map(async url=>({url,offer:await verify(url,identification)})));
  const result={query:row.query,requests,candidates:urls,verified};results.push(result);
  console.log(JSON.stringify({query:row.query,candidates:urls.length,verified:verified.filter(x=>x.offer).length,httpStatuses:[...new Set(requests.map(x=>x.status||x.error))],challenges:requests.filter(x=>x.challenge).map(x=>x.url)}));
 });
}}));
globalThis.fetch=original;
await fs.writeFile(process.env.FINDIT_DIAGNOSTIC_OUTPUT||'/tmp/findit-discovery-sources.json',JSON.stringify({checkedAt:new Date().toISOString(),results},null,2));
