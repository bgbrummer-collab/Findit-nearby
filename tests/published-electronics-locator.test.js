import test from 'node:test';
import assert from 'node:assert/strict';
import {publishedElectronicsBranches} from '../lib/published-electronics-locator.js';
const source='https://www.incredible.co.za/storelocator/';
const now=Date.parse('2026-11-07T10:00:00Z');
const branch={name:'Incredible Menlyn',lat:-25.78,lon:28.27,sourceUrl:source,id:'incredible-61',schedule:'Mo-Su 00:00-24:00',price:1,stockVerified:true};
test('dated locator fallback expires and never inherits source inventory or live hours',()=>{
 const data=[{source,checkedAt:new Date(now-86400000).toISOString(),branches:[branch]}];
 const [row]=publishedElectronicsBranches(source,data,now);
 assert.equal(row.name,branch.name);assert.equal(row.price,null);assert.equal(row.stockVerified,false);assert.equal(row.branchStockVerified,false);assert.equal(row.schedule,'');assert.equal(row.openNow,null);
 assert.deepEqual(publishedElectronicsBranches(source,data,now+15*86400000),[]);
 assert.deepEqual(publishedElectronicsBranches(source,data,now-2*86400000),[]);
 assert.deepEqual(publishedElectronicsBranches('https://other.example',data,now),[]);
 data[0].branches=[{...branch,name:'Unrelated'},{...branch,lat:0},{...branch,sourceUrl:'https://other.example'}];
 assert.deepEqual(publishedElectronicsBranches(source,data,now),[]);
});
