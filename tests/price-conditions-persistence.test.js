import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../shopping-assistant-ui.js',import.meta.url),'utf8');
const block=(name,next)=>source.slice(source.indexOf('  function '+name+'('),source.indexOf('  '+next,source.indexOf('  function '+name+'(')));
const caveat='Cash-only listed price excludes the dispensing fee.';
const offer={_retailer:'Example pharmacy',price:75,currency:'ZAR',availability:'in_stock',priceConditions:caveat,sourcePageVerified:true,product_url:'https://pharmacy.example/item'};
const item={key:'example',name:'Example cream 25g',brand:'Example',model:''};
function context(extra={}){
 const c={product:()=>item,offers:()=>[offer],stores:()=>[],coords:()=>null,n:v=>v==null?null:Number(v),Date,...extra};
 vm.runInNewContext(source.split('\n').filter(x=>x.includes('const esc=')||x.includes('const priceConditions=')).join('\n'),c);return c;
}
test('shopping and watch snapshots preserve the exact source price conditions',()=>{
 const c=context({bestOffer:()=>offer,LS:{watch:'watch'},read:()=>[],write:(key,value)=>c.saved=value,recordHistory(){},renderWatch(){},toast(){}});
 vm.runInNewContext(block('snapshot','function recordHistory(')+'\n'+block('watchCurrent','function unwatch('),c);
 assert.equal(c.snapshot().offers[0].priceConditions,caveat);c.watchCurrent();assert.equal(c.saved[0].priceConditions,caveat);assert.equal(c.saved[0].lastPrice,75);
});
test('shopping subtotal retains selected-offer caveats and their price sources',()=>{
 const body={innerHTML:''},chosen={item,offer:{...offer,retailer:offer._retailer,url:offer.product_url}},list=[{...item,offers:[chosen.offer]}];
 const c=context({$:s=>s==='#fxShoppingListBody'?body:null,$$:()=>[],LS:{list:'list'},read:()=>list,write(){},buildPlan:()=>({chosen:[chosen],mode:'cheapest',stops:[{name:offer._retailer,items:[item.name]}],total:75,currency:'ZAR',missing:[]}),money:(v,c)=>c+' '+v,removeCurrent(){},clearList(){}});
 vm.runInNewContext(block('renderList','function renderWatch('),c);c.renderList();assert.match(body.innerHTML,/Listed-price subtotal/);assert.ok(body.innerHTML.includes(caveat));assert.ok(body.innerHTML.includes('href="https://pharmacy.example/item"'));assert.doesNotMatch(body.innerHTML,/Open trip in Maps/);
});
test('history counts observations and compares only prices with the same conditions',()=>{
 let current={...offer,price:100,priceConditions:'Fee included'};const store={};
 const c=context({bestOffer:()=>current,stockYes:()=>true,LS:{history:'history'},read:(key,f)=>store[key]||f,write:(key,value)=>store[key]=value,money:v=>String(v)});
 vm.runInNewContext(block('recordHistory','function addCurrent('),c);c.recordHistory();current={...offer};c.recordHistory();c.recordHistory();
 assert.equal(store.history.example.length,2);assert.equal(store.history.example[1].priceConditions,caveat);assert.match(c.historySummary('example'),/2 observations · low 75 · high 75/);
});
test('quick watch does not announce a price drop when fee conditions change',()=>{
 const watch=[{...item,lastPrice:100,currency:'ZAR',retailer:offer._retailer,lastAvailability:'in_stock',priceConditions:'Fee included'}],alerts=[];let rendered=0;
 const c=context({recordHistory(){},bestOffer:()=>offer,stockYes:()=>true,LS:{watch:'watch'},read:()=>watch,write(){},addAlert:(...args)=>alerts.push(args),toast(){},renderWatch:()=>rendered++,money:v=>String(v),window:{}});
 vm.runInNewContext(block('evaluateWatch','async function notifications('),c);c.evaluateWatch();assert.equal(alerts.length,0);assert.equal(watch[0].priceConditions,caveat);assert.equal(watch[0].lastPrice,75);assert.equal(rendered,1);
 watch[0].lastPrice=100;c.evaluateWatch();assert.equal(alerts.length,1);assert.ok(alerts[0][2].includes(caveat));
});
test('Premium checks rebase changed fee conditions without false price or target alerts',async()=>{
 const premium=readFileSync(new URL('../premium-beta-fix.js',import.meta.url),'utf8'),start=premium.indexOf('  async function checkOne(item)'),end=premium.indexOf('  async function checkIndex(',start);let price=75;const notifications=[];
 const c={fetch:async()=>({ok:true,json:async()=>({offers:[{...offer,price,retailer:{name:offer._retailer}}]})}),notify:async(...args)=>notifications.push(args),money2:v=>String(v),Date};vm.runInNewContext(premium.slice(start,end),c);
 const initial={...item,retailer:offer._retailer,lastPrice:100,baselinePrice:100,currency:'ZAR',priceConditions:'Fee included',alertPriceDrop:true,targetPrice:80};
 const first=await c.checkOne(initial);assert.equal(notifications.length,0);assert.equal(first.priceConditions,caveat);assert.equal(first.baselinePrice,75);assert.match(first.lastAlert,/conditions changed/);
 price=50;await c.checkOne({...first,targetPrice:null});assert.equal(notifications.length,1);assert.ok(notifications[0][1].includes(caveat));
});
test('watch rendering escapes retailer price conditions rather than treating them as markup',()=>{
 const body={innerHTML:'',querySelector:()=>null},bad='<img src=x onerror=alert(1)> excludes fee';
 const c=context({$:s=>s==='#fxWatchBody'?body:null,$$:()=>[],LS:{watch:'watch',alerts:'alerts'},read:key=>key==='watch'?[{...item,lastPrice:75,priceConditions:bad}]:[],money:()=> 'ZAR 75',historySummary:()=>'',unwatch(){},notifications(){}});
 vm.runInNewContext(block('renderWatch','function stopScanner('),c);c.renderWatch();assert.ok(body.innerHTML.includes('&lt;img'));assert.doesNotMatch(body.innerHTML,/<img/);
});
