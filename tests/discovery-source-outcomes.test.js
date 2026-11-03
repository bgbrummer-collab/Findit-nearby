import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeRetailerUrls} from '../lib/native-retailer-discovery.js';

test('catalogue verification challenges stop that read and report only bounded response metadata',async t=>{
 const requested=[],reads=[];
 t.mock.method(globalThis,'fetch',async u=>{requested.push(String(u));return new Response('<title>Checking your browser</title><p>Verify you are human</p>');});
 const urls=await nativeRetailerUrls({name:'Example M42 blood glucose meter',object:'blood glucose meter'},{observe:row=>reads.push(row)});
 assert.deepEqual(urls,[]);assert.ok(reads.length>0);assert.ok(reads.every(row=>row.outcome==='verification-required'&&row.status===200));
 assert.ok(requested.every(url=>!url.startsWith('https://r.jina.ai/')));
 assert.ok(reads.every(row=>Object.keys(row).every(key=>['host','status','outcome','characters'].includes(key))));
});

test('an exact-page verification challenge is reported and never retried through a reader',async t=>{
 const {verify,ident}=await import('../lib/product-intelligence-core.js'),requested=[],reads=[];
 t.mock.method(globalThis,'fetch',async u=>{requested.push(String(u));return new Response('<title>Checking your browser</title>',{headers:{'content-type':'text/html'}});});
 assert.equal(await verify('https://shop.example/products/example-m42',ident({name:'Example M42 headphones'}),row=>reads.push(row)),null);
 assert.equal(requested.length,1);assert.equal(reads[0].outcome,'verification-required');assert.equal(reads[0].phase,'product');
 assert.equal(reads[0].host,'shop.example');assert.ok(!('url' in reads[0]));
});
