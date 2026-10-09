import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeRetailerDiscovery} from '../lib/native-retailer-discovery.js';
const name='Sony WH-1000XM5 black',url='https://www.incredible.co.za/sony-wh-1000xm5-black';
const page=(body)=>'<title>'+name+'</title>'+body;
const search='<a href="'+url+'">'+name+'</a>';
for(const [label,html,expected] of [
 ['explicit USD remains USD',page('<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name,offers:{price:299,priceCurrency:'USD',availability:'https://schema.org/InStock'}})+'</script>'),{price:299,currency:'USD',availability:'in_stock'}],
 ['recommendation prices and cart buttons cannot verify product price or stock',page('<script>{"recommendations":[{"price":1}]}</script><p>R 1 Add to cart</p>'),{price:null,currency:null,availability:null}]
])test('legacy native retailer path uses authoritative evidence: '+label,async t=>{
 t.mock.method(globalThis,'fetch',async u=>new Response(String(u).includes('catalogsearch')||String(u).includes('/search?')||String(u).includes('/jolisearch?')?search:html,{headers:{'content-type':'text/html'}}));
 const offers=await nativeRetailerDiscovery({name,searchQuery:name});
 assert.equal(offers.length,1);for(const [key,value] of Object.entries(expected))assert.equal(offers[0][key],value);
 assert.equal(offers[0].branchStockVerified,false);assert.equal(offers[0].exactProductMatch,true);
});
