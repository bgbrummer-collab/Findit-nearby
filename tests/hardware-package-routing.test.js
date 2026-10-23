import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../lib/product-intelligence-core.js';
import {nativeRetailerUrls} from '../lib/native-retailer-discovery.js';
const name='Acme cordless drill X50 with batteries and charger';
test('a hardware package charger does not route its drill to electronics stores',async t=>{let data;await handler({method:'POST',body:{name,searchQuery:name,requiresModelConfirmation:true}},{setHeader(){},status(){return this},json(d){data=d;return this}});assert.ok(data.retailerStatus.some(s=>s.name==='Builders'));assert.ok(!data.retailerStatus.some(s=>s.name==='Incredible Connection'));const visited=[];t.mock.method(globalThis,'fetch',async url=>{visited.push(String(url));return new Response('<html></html>')});await nativeRetailerUrls({name,searchQuery:name});assert.ok(visited.some(u=>new URL(u).hostname==='www.tmbsupplies.co.za'));assert.ok(!visited.some(u=>new URL(u).hostname==='www.incredible.co.za'));});
