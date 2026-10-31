// New-category baseline: these typed searches do not count as photo identification tests.
// Live data coverage is deliberately stricter than UI smoke tests: an empty
// offer list is a failed discovery example, even when the endpoint returns 200.
import fs from 'node:fs/promises';
import worker from '../cloudflare/worker.js';
import {productVariantConflict,ident as coreIdent} from '../lib/product-intelligence-core.js';
const local=process.env.FINDIT_LOCAL_WORKER==='true';
const versionInfo=async()=>local?{commit:'local-working-tree',platform:'local-worker-live-sources'}:await(await fetch(new URL('/api/version',base))).json();
const base=process.env.FINDIT_URL||'https://findit-nearby.bgbrummer.workers.dev/';
const cases=[
 [
  "gym",
  "Concept2 RowErg rowing machine"
 ],
 [
  "car",
  "Toyota Corolla Cross 1.8 Xi"
 ],
 [
  "mouse",
  "Logitech G502 HERO mouse"
 ],
 [
  "mousepad",
  "SteelSeries QcK Heavy Large mouse pad"
 ],
 [
  "keyboard",
  "Keychron K2 wireless mechanical keyboard"
 ],
 [
  "headphones",
  "Sony WH-1000XM5 black"
 ],
 [
  "medical-device",
  "Omron M2 Basic upper arm blood pressure monitor"
 ],
 [
  "medical-device",
  "Accu-Chek Instant blood glucose meter"
 ],
 [
  "appliance",
  "Philips NA230/00 air fryer"
 ],
 [
  "printer",
  "HP DeskJet 2820 All-in-One printer"
 ],
 [
  "garden",
  "Gardena Classic pruning shears"
 ],
 [
  "pet",
  "Royal Canin Mini Adult dog food 2kg"
 ],
 [
  "lighting",
  "Philips Hue White E27 bulb"
 ],
 [
  "stationery",
  "Casio fx-82ZA Plus II calculator"
 ],
 [
  "bag",
  "JanSport SuperBreak Plus backpack"
 ],
 [
  "camera",
  "Canon EOS R50 camera body"
 ]
];
const post=async(path,body)=>{
 const options={method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(65000)};const r=local?await worker.fetch(new Request(new URL(path,base),options),{}):await fetch(new URL(path,base),options);
 const raw=await r.text();let data;try{data=JSON.parse(raw)}catch{throw Error('Non-JSON response: HTTP '+r.status+' '+r.headers.get('content-type')+' '+raw.slice(0,160));}return {status:r.status,data};
};
const version=await versionInfo(),results=[];
let cursor=0;
await Promise.all(Array.from({length:2},async()=>{
 while(cursor<cases.length){
  const [category,query]=cases[cursor++],started=Date.now();
  try{
   const search=await post('/api/search',{query});
   const identification=search.data.identification;
   const commerce=await post('/api/product-intelligence-v2',{identification});
   const offers=commerce.data.offers||[];
   const research=await post('/api/product-insights',{identification,offers});
   const passed=search.status===200&&commerce.status===200&&offers.length>0&&offers.every(o=>!productVariantConflict(o.product_name,coreIdent(identification))&&o.exactProductMatch===true&&o.sourcePageVerified===true&&Number(o.price)>0&&/^[A-Z]{3}$/.test(o.currency||''))&&research.data.researched===true;
   results.push({category,query,status:passed?'passed':'failed',durationMs:Date.now()-started,search,commerce,research});
   console.log(JSON.stringify({category,status:passed?'passed':'failed',offers:offers.length,researched:research.data.researched===true,prices:offers.map(o=>({retailer:o.retailer?.name,price:o.price,currency:o.currency,url:o.product_url}))}));
  }catch(error){results.push({category,query,status:'failed',error:error.message,durationMs:Date.now()-started});console.log(JSON.stringify({category,status:'failed',error:error.message}));}
 }
}));
const endVersion=await versionInfo();
const report={checkedAt:new Date().toISOString(),base,version,endVersion,versionStable:version.commit===endVersion.commit,results};
const output=process.env.FINDIT_EVIDENCE_PATH||'/workspace/scratch/findit-broad-product-matrix.json';
await fs.writeFile(output,JSON.stringify(report,null,2));
console.log('LIVE_DATA_MATRIX',JSON.stringify({passed:results.filter(x=>x.status==='passed').length,total:results.length,output}));
if(!report.versionStable||results.some(x=>x.status!=='passed'))process.exitCode=1;
