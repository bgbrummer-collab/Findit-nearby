import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../lib/product-intelligence-core.js';
import {nativeRetailerUrls} from '../lib/native-retailer-discovery.js';
import {familyOf} from '../lib/retailers.js';
import {productTypeInformation} from '../lib/product-type-information.js';

for(const name of ['Office chair','IKEA POANG armchair','Dressing table','Coffee table','Moleskine notebook'])test('category words do not match inside another product word: '+name,async t=>{
 const stationery=/notebook/.test(name),expected=stationery?'PNA':'Mr Price Home';let data;
 await handler({method:'POST',body:{name,requiresModelConfirmation:true}},{setHeader(){},status(){return this},json(d){data=d;return this;}});
 assert.ok(data.retailerStatus.some(s=>s.name===expected),JSON.stringify(data.retailerStatus));
 const requests=[];t.mock.method(globalThis,'fetch',async u=>{requests.push(String(u));return new Response('');});
 await nativeRetailerUrls({name});
 assert.ok(requests.some(u=>u.includes(stationery?'www.pna.co.za':'www.mrphome.com')));
 assert.ok(!requests.some(u=>u.includes('clicks.co.za')||u.includes('dischem.co.za')));
 if(!stationery){assert.equal(familyOf(name),'home');assert.match(productTypeInformation({name}).overview,/Furniture/);}
});

test('a vehicle model containing tuner is not a musical tuner',async()=>{
 let data;await handler({method:'POST',body:{name:'Toyota Fortuner',object:'vehicle',requiresModelConfirmation:true}},{setHeader(){},status(){return this},json(d){data=d;return this;}});
 assert.ok(data.retailerStatus.some(s=>s.name==='AutoTrader'));
});

for(const [name,retailer] of [['Hair conditioner','Clicks'],['Skin care lotion','Clicks'],['Summer dresses','Bash'],['Korg guitar tuner','Marshall Music']])test('whole category words retain their intended route: '+name,async()=>{
 let data;await handler({method:'POST',body:{name,requiresModelConfirmation:true}},{setHeader(){},status(){return this},json(d){data=d;return this;}});
 assert.ok(data.retailerStatus.some(s=>s.name===retailer));
});

test('synthetic material does not turn furniture into a synthesizer search',async t=>{
 const name='Synthetic leather chair';let data;
 await handler({method:'POST',body:{name,requiresModelConfirmation:true}},{setHeader(){},status(){return this},json(d){data=d;return this;}});
 assert.ok(data.retailerStatus.some(s=>s.name==='Mr Price Home'));
 const seen=[];t.mock.method(globalThis,'fetch',async u=>{seen.push(String(u));return new Response('');});
 await nativeRetailerUrls({name});assert.ok(seen.some(u=>u.includes('mrphome.com')));assert.ok(!seen.some(u=>u.includes('marshallmusic')));
});
test('a baby bassinet is not a bass instrument',async t=>{
 const seen=[];t.mock.method(globalThis,'fetch',async u=>{seen.push(String(u));return new Response('');});await nativeRetailerUrls({name:'Baby bassinet'});
 assert.ok(seen.some(u=>u.includes('babycity.co.za')));assert.ok(!seen.some(u=>u.includes('marshallmusic')));
});

test('nearby search uses the same whole-word categories as retailer discovery',async t=>{
 const worker=(await import('../cloudflare/worker.js')).default;
 t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({elements:[]}),{headers:{'content-type':'application/json'}}));
 for(const [name,wanted,unwanted]of [['Synthetic leather chair','furniture','musical_instrument'],['Moleskine notebook','stationery','chemist'],['Smartphones','electronics','stationery'],['Over-ear headphones','electronics','stationery']]){
  const r=await worker.fetch(new Request('https://findit.test/api/nearby',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({lat:-25.78,lon:28.27,identification:{name}})}),{}),d=await r.json();
  assert.ok(d.searchedShopTags.includes(wanted),name+': '+d.searchedShopTags);assert.ok(!d.searchedShopTags.includes(unwanted),name);
 }
});
