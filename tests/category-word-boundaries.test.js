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
