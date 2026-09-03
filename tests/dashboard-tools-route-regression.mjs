import fs from 'node:fs';
const cfg=JSON.parse(fs.readFileSync('vercel.json','utf8'));
const routes=cfg.routes||[];
const fsIndex=routes.findIndex(r=>r.handle==='filesystem');
const dashboardIndex=routes.findIndex(r=>r.src==='/dashboard-runtime-stable.js'&&r.dest==='/dashboard-runtime-v8.js');
const intelligenceIndex=routes.findIndex(r=>r.src==='/api/product-intelligence'&&r.dest==='/api/product-intelligence-v2');
const insightsIndex=routes.findIndex(r=>r.src==='/api/product-insights'&&/action=research/.test(r.dest||''));
if(fsIndex<0)throw Error('filesystem route missing');
for(const [name,index] of [['dashboard',dashboardIndex],['product intelligence',intelligenceIndex],['product insights',insightsIndex]]){
  if(index<0)throw Error(`${name} route missing`);
  if(index>fsIndex)throw Error(`${name} route must precede filesystem routing`);
}
const runtime=fs.readFileSync('dashboard-runtime-v8.js','utf8');
for(const token of ['function product()','function compare(','function stock()','function settings()','fx-ask-send','wireSpecialCards'])if(!runtime.includes(token))throw Error(`runtime missing ${token}`);
console.log('FINDIT_DASHBOARD_TOOLS_ROUTE_REGRESSION_PASS');
