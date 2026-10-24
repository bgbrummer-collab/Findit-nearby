import test from 'node:test';
import assert from 'node:assert/strict';
import {publicHttpsUrl,fetchPublicProductPage} from '../lib/public-product-page.js';
import {verify,ident} from '../lib/product-intelligence-core.js';
import worker from '../cloudflare/worker.js';
for(const url of ['https://user:password@shop.example/item','https://shop.example:8443/item','https://metadata.google.internal/item','https://printer.local/item','https://localhost/item','https://127.0.0.1/item','https://2130706433/item','https://[::1]/item','http://shop.example/item'])test('reject unsafe product source '+url,()=>assert.equal(publicHttpsUrl(url),null));
for(const location of ['https://127.0.0.1/secret','https://metadata.google.internal/secret','https://other.example/item','https://user:password@shop.example/item','/'])test('offer verifier rejects redirect before requesting its invalid destination: '+location,async t=>{
 const requested=[];t.mock.method(globalThis,'fetch',async(u,options)=>{requested.push(String(u));assert.equal(options.redirect,'manual');return new Response(null,{status:302,headers:{location}});});
 assert.equal(await verify('https://shop.example/products/acme-x1',ident({name:'Acme X1 headphones'})),null);
 assert.deepEqual(requested,['https://shop.example/products/acme-x1']);
});
test('same-publisher canonical redirects are followed with a bounded request budget',async t=>{
 let count=0;t.mock.method(globalThis,'fetch',async(u,o)=>{assert.equal(o.redirect,'manual');count++;return count===1?new Response(null,{status:301,headers:{location:'https://www.shop.example/products/new'}}):new Response('canonical product');});
 assert.equal(await(await fetchPublicProductPage('https://shop.example/products/old')).text(),'canonical product');assert.equal(count,2);
 count=0;t.mock.method(globalThis,'fetch',async()=>{count++;return new Response(null,{status:302,headers:{location:'/loop'}});});
 await assert.rejects(fetchPublicProductPage('https://shop.example/loop'),{code:'PUBLIC_PAGE_REDIRECT_LIMIT'});assert.equal(count,5);
});
test('product-information input cannot request a credential-bearing or redirected private source',async t=>{
 const seen=[];t.mock.method(globalThis,'fetch',async(u,o)=>{seen.push(String(u));if(String(u).includes('bing.com'))return new Response('<rss/>');assert.equal(o.redirect,'manual');return new Response(null,{status:302,headers:{location:'https://metadata.google.internal/secret'}});});
 const d=await(await worker.fetch(new Request('https://findit.test/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification:{name:'Acme X1 headphones'},offers:[{product_url:'https://user:password@shop.example/item',sourcePageVerified:true,exactProductMatch:true},{product_url:'https://shop.example/products/acme-x1',sourcePageVerified:true,exactProductMatch:true}]})}),{})).json();
 assert.equal(d.researched,false);assert.ok(!seen.some(u=>u.includes('password')||u.includes('metadata.google.internal')));
});
