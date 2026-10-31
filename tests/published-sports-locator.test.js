import test from 'node:test';import assert from 'node:assert/strict';
import {publishedSportsBranches} from '../lib/published-sports-locator.js';
import snapshot from '../lib/data/sports-locator-snapshot.js';
import worker from '../cloudflare/worker.js';
const now=Date.parse(snapshot.checkedAt)+1000;
test('published fallback contains dated coordinate-backed official retailer locations',()=>{
 const rows=publishedSportsBranches(snapshot,now);assert.ok(rows.length>0);assert.ok(rows.every(s=>s.locatorCheckedAt===snapshot.checkedAt&&s.sourceUrl===snapshot.source&&s.locatorDataStatus==='published_snapshot'));assert.match(rows[0].type,/details checked/);
});
test('published fallback expires instead of presenting stale locations as current',()=>assert.deepEqual(publishedSportsBranches(snapshot,Date.parse(snapshot.checkedAt)+15*86400000),[]));
test('future-dated and invalid publication dates cannot create locations',()=>{assert.deepEqual(publishedSportsBranches(snapshot,Date.parse(snapshot.checkedAt)-1),[]);assert.deepEqual(publishedSportsBranches({...snapshot,checkedAt:'invalid'},now),[]);});
test('untrusted source or malformed coordinates cannot create fallback pins',()=>{assert.deepEqual(publishedSportsBranches({...snapshot,source:'https://wrong.example'},now),[]);assert.deepEqual(publishedSportsBranches({...snapshot,branches:[{...snapshot.branches[0],lat:null},{...snapshot.branches[0],lon:999}]},now),[]);});
test('fallback strips live hours, inventory and prices even if present in input',()=>{const [r]=publishedSportsBranches({...snapshot,branches:[{...snapshot.branches[0],openingHours:'24/7',schedule:'24/7',openNow:true,price:1,stockVerified:true,branchStockVerified:true,exactProductMatch:true}]},now);assert.equal(r.openingHours,'');assert.equal(r.schedule,'');assert.equal(r.openNow,null);assert.equal(r.price,undefined);assert.equal(r.branchStockVerified,false);assert.equal(r.stockVerified,false);assert.equal(r.exactProductMatch,false);});
test('gym nearby search returns published official locations when all upstream sources fail',async t=>{
 t.mock.method(Date,'now',()=>now);t.mock.method(globalThis,'fetch',async()=>new Response('Unavailable',{status:503}));
 const d=await(await worker.fetch(new Request('https://findit.test/api/nearby',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({lat:-25.7479,lon:28.2293,radiusKm:10,identification:{name:'Concept2 RowErg rowing machine'}})}),{})).json();
 assert.ok(d.stores.length>0);assert.equal(d.discoveryAvailable,true);assert.ok(d.stores.every(s=>s.distanceKm<=10&&s.locatorDataStatus==='published_snapshot'&&s.branchStockVerified===false&&s.exactProductMatch===false&&s.openNow===null));
});
