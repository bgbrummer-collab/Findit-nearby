import test from 'node:test';
import assert from 'node:assert/strict';
import {googleSearchRetailerUrls} from '../lib/product-intelligence-core.js';

const identity={
 brand:'TP-Link',
 model:'TL-WA850RE',
 name:'TP-Link TL-WA850RE 300Mbps Wi-Fi Range Extender',
 object:'Wi-Fi range extender',
 category:'electronics',
 searchQuery:'TP-Link TL-WA850RE 300Mbps Wi-Fi Range Extender',
 size:'',color:'',visibleText:[],features:[]
};

test('Google-grounded discovery returns only retailer product-detail URLs for the exact identity',async()=>{
 const original=globalThis.fetch;
 let request;
 globalThis.fetch=async(url,options)=>{
  request={url,options};
  return {ok:true,status:200,json:async()=>({candidates:[{groundingMetadata:{groundingChunks:[
   {web:{title:'TP-Link TL-WA850RE 300Mbps Wi-Fi Range Extender',uri:'https://www.takealot.com/tp-link-tl-wa850re/PLID123'}},
   {web:{title:'Wi-Fi extenders | Takealot',uri:'https://www.takealot.com/all?q=wifi'}},
   {web:{title:'TP-Link TL-WA850RE 300Mbps Wi-Fi Range Extender',uri:'https://www.takealot.com/tp-link-tl-wa850re/PLID123'}}
  ]}}]})};
 };
 try{
  const observations=[];
  const urls=await googleSearchRetailerUrls(identity,{GEMINI_API_KEY:'test-key'},'ZA',row=>observations.push(row));
  assert.deepEqual(urls,['https://www.takealot.com/tp-link-tl-wa850re/PLID123']);
  assert.match(request.url,/gemini-2\.5-flash:generateContent/);
  const body=JSON.parse(request.options.body);
  assert.ok(body.tools.some(tool=>tool.google_search));
  assert.match(body.contents[0].parts[0].text,/TP-Link TL-WA850RE/);
  assert.ok(observations.some(row=>row.phase==='google-search'&&row.candidates===1));
 }finally{globalThis.fetch=original;}
});

test('Google-grounded discovery safely skips when the Google API key is unavailable',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async()=>{throw new Error('fetch should not run without a key')};
 try{
  const observations=[];
  assert.deepEqual(await googleSearchRetailerUrls(identity,{},'ZA',row=>observations.push(row)),[]);
  assert.ok(observations.some(row=>row.phase==='google-search'&&row.outcome==='missing-api-key'));
 }finally{globalThis.fetch=original;}
});

test('Google-grounded discovery does not search when exact model confirmation is still required',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async()=>{throw new Error('fetch should not run before identity confirmation')};
 try{
  assert.deepEqual(await googleSearchRetailerUrls({...identity,requiresModelConfirmation:true},{GEMINI_API_KEY:'test-key'},'ZA'),[]);
 }finally{globalThis.fetch=original;}
});
