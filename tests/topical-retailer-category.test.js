import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare/worker.js';
import {nativeRetailerUrls} from '../lib/native-retailer-discovery.js';
for(const category of ['Health','Skin Care','general'])test('topical cream selects pharmacy sources despite '+category+' category wording',async t=>{
 const requested=[];t.mock.method(globalThis,'fetch',async u=>{requested.push(String(u));return new Response(JSON.stringify({elements:[]}),{headers:{'content-type':'application/json'}})});
 const identity={name:'Example topical cream',brand:'Example',object:'topical cream',category,requiresModelConfirmation:true};
 const d=await(await worker.fetch(new Request('https://findit.test/api/nearby',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({lat:-25.7821,lon:28.2752,radiusKm:5,identification:identity})}),{})).json();
 assert.ok(d.searchedShopTags.includes('chemist'));assert.ok(d.searchedShopTags.includes('beauty'));assert.ok(!d.searchedShopTags.includes('variety_store'));
 await nativeRetailerUrls({...identity,searchQuery:identity.name});assert.ok(requested.some(u=>u.includes('dischem.co.za/catalogsearch')));
});
test('ice cream remains a food search rather than a pharmacy search',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({elements:[]}),{headers:{'content-type':'application/json'}}));
 const d=await(await worker.fetch(new Request('https://findit.test/api/nearby',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({lat:-25.7821,lon:28.2752,identification:{name:'Example ice cream',object:'ice cream',category:'food'}})}),{})).json();assert.ok(d.searchedShopTags.includes('supermarket'));assert.ok(!d.searchedShopTags.includes('chemist'));
});
