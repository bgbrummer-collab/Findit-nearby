import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('late retailer rendering respects explicit A–Z and closest order, including zero distance',()=>{
 const source=fs.readFileSync(new URL('../dashboard-retailer-relevance-fix.js',import.meta.url),'utf8');
 const stores=[{name:'Zulu exact seller',distanceKm:5},{name:'Alpha far',distanceKm:8},{name:'Middle nearest',distanceKm:0},{name:'Beta unknown',distanceKm:null}];
 for(const [sort,expected] of [['name',['Alpha far','Beta unknown','Middle nearest','Zulu exact seller']],['closest',['Middle nearest','Zulu exact seller','Alpha far','Beta unknown']],['best',['Zulu exact seller','Middle nearest','Alpha far','Beta unknown']]]){
  const list={innerHTML:''},top={innerHTML:''},events={};
  const document={querySelector:s=>s==='#fxStoreList'?list:s==='#fxTopStores'?top:null,addEventListener:(name,fn)=>events[name]=fn};
  vm.runInNewContext(source,{window:{finditState:{stores,offers:[{retailer:'Zulu exact seller',exactProductMatch:true,url:'https://seller.example/item'}]}},document,localStorage:{getItem:()=>sort},setTimeout:fn=>fn()});
  assert.deepEqual([...list.innerHTML.matchAll(/<b>([^<]+)<\/b>/g)].map(x=>x[1]),expected);
  assert.deepEqual([...top.innerHTML.matchAll(/<b>([^<]+)<\/b>/g)].map(x=>x[1]),expected);
  events['findit:dashboard-sync']();assert.deepEqual([...list.innerHTML.matchAll(/<b>([^<]+)<\/b>/g)].map(x=>x[1]),expected);
 }
});
