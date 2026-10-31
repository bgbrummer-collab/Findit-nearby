import test from 'node:test';import assert from 'node:assert/strict';
import {catalogueDiscoveryTerms,catalogueQueryUrl} from '../lib/catalogue-discovery-terms.js';
import {nativeRetailerUrls} from '../lib/native-retailer-discovery.js';
test('discovery removes generic wording without mutating requested identity',async t=>{
 const input={name:'Example EX42 wireless mechanical keyboard Black',query:'Example EX42 wireless mechanical keyboard Black',color:'Black',size:'Large'};assert.deepEqual(catalogueDiscoveryTerms(input),[input.query,'Example EX42']);assert.equal(input.color,'Black');
 const requested=[];t.mock.method(globalThis,'fetch',async url=>{const u=new URL(url);requested.push(u);return new Response(JSON.stringify({resources:{results:{products:u.searchParams.get('q')==='Example EX42'?[{title:input.name+' Large',url:'/products/black-large'},{title:'Example EX42 wireless mechanical keyboard White Large',url:'/products/white-large'}]:[]}}}));});
 const urls=await nativeRetailerUrls(input,{maxSearchPages:3});assert.ok(requested.some(u=>u.searchParams.get('q')==='Example EX42'));assert.ok(urls.some(u=>u.includes('black-large')));assert.ok(!urls.some(u=>u.includes('white-large')));
});
test('published catalogue query parameters preserve route and Hybris relevance syntax',()=>{
 assert.equal(catalogueQueryUrl('https://shop.example/search?q=Full%3Arelevance&text=Full&count=100','EX42'),'https://shop.example/search?q=EX42%3Arelevance&text=EX42&count=100');
});
