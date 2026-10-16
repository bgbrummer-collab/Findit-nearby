// Live data coverage is deliberately stricter than UI smoke tests: an empty
// offer list is a failed discovery example, even when the endpoint returns 200.
import fs from 'node:fs/promises';
const base=process.env.FINDIT_URL||'https://findit-nearby.bgbrummer.workers.dev/';
const cases=[
 ['electronics','Logitech PRO X Gaming Headset 981-000818'],
 ['groceries','Coca-Cola Original Taste 2L'],
 ['clothing','Levis 501 Original Jeans'],
 ['shoes','Nike Air Force 1 Low White Blue'],
 ['beauty','Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml'],
 ['tools','Bosch GSB 18V-50'],
 ['toys','LEGO Classic 10696'],
 ['furniture','IKEA BILLY bookcase 80x28x202 white'],
 ['household','Twinsaver Comfort 3 Ply Tissues 120'],
 ['music','Shure MV7+ microphone']
];
const post=async(path,body)=>{
 const r=await fetch(new URL(path,base),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(65000)});
 const raw=await r.text();let data;try{data=JSON.parse(raw)}catch{throw Error('Non-JSON response: HTTP '+r.status+' '+r.headers.get('content-type')+' '+raw.slice(0,160));}return {status:r.status,data};
};
const version=await(await fetch(new URL('/api/version',base))).json(),results=[];
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
   const passed=search.status===200&&commerce.status===200&&offers.length>0&&offers.every(o=>o.exactProductMatch===true&&o.sourcePageVerified===true&&Number(o.price)>0&&/^[A-Z]{3}$/.test(o.currency||''))&&research.data.researched===true;
   results.push({category,query,status:passed?'passed':'failed',durationMs:Date.now()-started,search,commerce,research});
   console.log(JSON.stringify({category,status:passed?'passed':'failed',offers:offers.length,researched:research.data.researched===true,prices:offers.map(o=>({retailer:o.retailer?.name,price:o.price,currency:o.currency,url:o.product_url}))}));
  }catch(error){results.push({category,query,status:'failed',error:error.message,durationMs:Date.now()-started});console.log(JSON.stringify({category,status:'failed',error:error.message}));}
 }
}));
const endVersion=await(await fetch(new URL('/api/version',base))).json();
const report={checkedAt:new Date().toISOString(),base,version,endVersion,versionStable:version.commit===endVersion.commit,results};
const output=process.env.FINDIT_EVIDENCE_PATH||'/tmp/findit-live-data-matrix.json';
await fs.writeFile(output,JSON.stringify(report,null,2));
console.log('LIVE_DATA_MATRIX',JSON.stringify({passed:results.filter(x=>x.status==='passed').length,total:results.length,output}));
if(!report.versionStable||results.some(x=>x.status!=='passed'))process.exitCode=1;
