import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../lib/product-intelligence-core.js';
import {nativeRetailerUrls} from '../lib/native-retailer-discovery.js';
import {productFamily,ident} from '../lib/product-intelligence-core.js';
import worker from '../cloudflare/worker.js';
import nearby from '../api/nearby.js';
const name='Acme cordless drill X50 with batteries and charger';
for(const name of ['Bosch GSB 18V-50 with batteries and charger','Bosch Professional GSR 18V-50 with charger'])test('model-only tool package keeps hardware routing: '+name,async t=>{
 assert.equal(productFamily(ident({name})), 'hardware');
 const visited=[];
 t.mock.method(globalThis,'fetch',async url=>{visited.push(String(url));return new Response(JSON.stringify(String(url).includes('nominatim')?[]:{elements:[]}));});
 await nativeRetailerUrls({name,object:name,category:'general'});
 assert.ok(visited.some(u=>new URL(u).hostname==='www.tmbsupplies.co.za'));
 assert.ok(!visited.some(u=>new URL(u).hostname==='www.incredible.co.za'));
 const response=await worker.fetch(new Request('https://findit.test/api/nearby',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({lat:-25.78,lon:28.27,identification:{name,object:name,category:'general'}})}),{});
 const data=await response.json();
 assert.deepEqual(data.searchedShopTags,['hardware','doityourself']);
 assert.equal(data.branchStockVerified,false);
 let alternate;
 await nearby({method:'POST',body:{mode:'likely',lat:-25.78,lon:28.27,identification:{name,object:name,category:'general'}}},{setHeader(){},status(){return this},json(d){alternate=d;return this}});
 assert.deepEqual(alternate.searchedShopTags,['hardware','doityourself']);
 assert.equal(alternate.branchStockVerified,false);
});
for(const name of ['Samsung phone charger','Bosch USB phone charger'])test('a charger without tool identity retains electronics routing: '+name,()=>{
 assert.equal(productFamily(ident({name})), 'electronics');
});
test('a hardware package charger does not route its drill to electronics stores',async t=>{let data;await handler({method:'POST',body:{name,searchQuery:name,requiresModelConfirmation:true}},{setHeader(){},status(){return this},json(d){data=d;return this}});assert.ok(data.retailerStatus.some(s=>s.name==='Builders'));assert.ok(!data.retailerStatus.some(s=>s.name==='Incredible Connection'));const visited=[];t.mock.method(globalThis,'fetch',async url=>{visited.push(String(url));return new Response('<html></html>')});await nativeRetailerUrls({name,searchQuery:name});assert.ok(visited.some(u=>new URL(u).hostname==='www.tmbsupplies.co.za'));assert.ok(!visited.some(u=>new URL(u).hostname==='www.incredible.co.za'));});
