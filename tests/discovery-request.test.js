import test from 'node:test';import assert from 'node:assert/strict';
import vm from 'node:vm';import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../information-runtime.js',import.meta.url),'utf8');
const requestDiscoveryJson=vm.runInNewContext('('+source.slice(source.indexOf('async function json('),source.indexOf('async function getLocationIfAlreadyAllowed(')).trim()+')',{fetch:(...args)=>globalThis.fetch(...args),AbortController,setTimeout,clearTimeout,TypeError});
for(const status of [500,502,503,504])test('read-only discovery recovers from HTML HTTP '+status,async t=>{
 let calls=0;const signals=[];t.mock.method(globalThis,'fetch',async(_,opts)=>{signals.push(opts.signal);return ++calls===1?new Response('<html>Temporary error</html>',{status}):Response.json({offers:[{product_name:'Verified fixture'}]});});
 assert.equal((await requestDiscoveryJson('/api/product-intelligence-v2',{})).offers.length,1);assert.equal(calls,2);assert.equal(signals[0],signals[1]);
});
test('malformed successful responses do not become empty successful results',async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;return new Response('bad');});
 await assert.rejects(requestDiscoveryJson('/api/product-insights',{}),/unreadable/);assert.equal(calls,2);
});
test('ordinary empty discovery is returned without another request',async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;return Response.json({offers:[]});});
 assert.equal((await requestDiscoveryJson('/api/product-intelligence-v2',{})).offers.length,0);assert.equal(calls,1);
});
for(const route of ['/api/feedback','/api/search'])test('writes and photo calls never retry '+route,async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;return new Response('busy',{status:503});});await assert.rejects(requestDiscoveryJson(route,{}));assert.equal(calls,1);
});
test('authorization failures are never retried',async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;return Response.json({error:'Unavailable'},{status:403});});await assert.rejects(requestDiscoveryJson('/api/nearby',{}),/Unavailable/);assert.equal(calls,1);
});
test('transport recovery stays within the original deadline',async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async(_,opts)=>{calls++;if(opts.signal.aborted)throw opts.signal.reason;throw new TypeError('Network failed');});
 await assert.rejects(requestDiscoveryJson('/api/nearby',{},20));assert.ok(calls<=2);
});

test('explicit shopping-country preference reaches the commerce request',async t=>{
 const helper=vm.runInNewContext('('+source.slice(source.indexOf('async function json('),source.indexOf('async function getLocationIfAlreadyAllowed(')).trim()+')',{fetch:(...args)=>globalThis.fetch(...args),AbortController,setTimeout,clearTimeout,TypeError,localStorage:{getItem:key=>key==='finditShoppingCountry'?'ZA':null}});
 const bodies=[];t.mock.method(globalThis,'fetch',async(_,opts)=>{bodies.push(JSON.parse(opts.body));return Response.json({offers:[]});});
 await helper('/api/product-intelligence-v2',{identification:{name:'Example EX42'}});assert.equal(bodies[0].country,'ZA');assert.equal(bodies[0].identification.name,'Example EX42');
 await helper('/api/product-intelligence-v2',{country:'GB'});assert.equal(bodies[1].country,'GB');
});
