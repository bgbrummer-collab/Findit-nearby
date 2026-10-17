import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeRetailerDiscovery} from '../lib/native-retailer-discovery.js';
import {verify,ident} from '../lib/product-intelligence-core.js';
const name='Sony WH-1000XM5 black',url='https://www.incredible.co.za/sony-wh-1000xm5-black';
const page=(body)=>'<title>'+name+'</title>'+body;
const search='<a href="'+url+'">'+name+'</a>';
test('specialist hardware search keeps exact models and distinguishes bundle separators from Plus models',async t=>{
 const {nativeRetailerUrls}=await import('../lib/native-retailer-discovery.js');
 t.mock.method(globalThis,'fetch',async u=>String(u).includes('tmbsupplies.co.za/search/suggest.json')?new Response(JSON.stringify({resources:{results:{products:[{title:'Bosch Professional Cordless Drill GSB 18V-50 + 2 X 2.0Ah Batteries + Charger',url:'/products/bosch-gsb-18v-50-batteries-charger'},{title:'Bosch Professional GSB 185-LI',url:'/products/gsb-185-li'}]}}})):new Response('',{status:404}));
 const urls=await nativeRetailerUrls({name:'Bosch GSB 18V-50',object:'Bosch GSB 18V-50',category:'general',searchQuery:'Bosch GSB 18V-50'});
 assert.deepEqual(urls,['https://www.tmbsupplies.co.za/products/bosch-gsb-18v-50-batteries-charger']);
});
test('a page is parsed once for identity, price and stock within a verification request',async t=>{
 const payload=JSON.stringify({'@type':'Product',name,offers:{price:5999,priceCurrency:'ZAR',availability:'https://schema.org/InStock'}}),raw=page('<script type="application/ld+json">'+payload+'</script>');
 const parse=JSON.parse;let parses=0;t.mock.method(JSON,'parse',function(value,...args){if(value===payload)parses++;return parse(value,...args)});
 t.mock.method(globalThis,'fetch',async()=>new Response(raw,{headers:{'content-type':'text/html'}}));
 const offer=await verify(url,ident({name}));assert.equal(offer.price,5999);assert.equal(offer.availability,'in_stock');assert.equal(parses,1,'Repeated full-page parsing exhausts the Worker CPU budget');
});
for(const [label,html,expected] of [
 ['explicit USD remains USD',page('<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name,offers:{price:299,priceCurrency:'USD',availability:'https://schema.org/InStock'}})+'</script>'),{price:299,currency:'USD',availability:'in_stock'}],
 ['recommendation prices and cart buttons cannot verify product price or stock',page('<script>{"recommendations":[{"price":1}]}</script><p>R 1 Add to cart</p>'),{price:null,currency:null,availability:null}]
])test('legacy native retailer path uses authoritative evidence: '+label,async t=>{
 t.mock.method(globalThis,'fetch',async u=>new Response(String(u).includes('catalogsearch')||String(u).includes('/search?')||String(u).includes('/jolisearch?')?search:html,{headers:{'content-type':'text/html'}}));
 const offers=await nativeRetailerDiscovery({name,searchQuery:name});
 assert.equal(offers.length,1);for(const [key,value] of Object.entries(expected))assert.equal(offers[0][key],value);
 assert.equal(offers[0].branchStockVerified,false);assert.equal(offers[0].exactProductMatch,true);
});

test('gaming headset discovery uses the current Computer Mania catalogue and verifies the exact listing',async t=>{
 const product='Logitech PRO X Gaming Headset',productUrl='https://computermania.co.za/products/logitech-pro-x-gaming-headset';let reached=false;
 t.mock.method(globalThis,'fetch',async u=>{const address=String(u);if(address.startsWith('https://computermania.co.za/search?')){reached=true;return new Response(`<a href="${productUrl}">${product}</a>`);}if(address===productUrl)return new Response('<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name:product,offers:{price:2999,priceCurrency:'ZAR',availability:'https://schema.org/InStock'}})+'</script>');return new Response('',{status:404});});
 const offers=await nativeRetailerDiscovery({name:product,searchQuery:product});assert.equal(reached,true);assert.equal(offers.length,1);assert.equal(offers[0].retailer.name,'Computer Mania');assert.equal(offers[0].exactProductMatch,true);assert.equal(offers[0].branchStockVerified,false);
});

test('predictive catalogue finds product URLs without treating suggestions as commerce evidence',async t=>{
 const {nativeRetailerUrls}=await import('../lib/native-retailer-discovery.js');
 t.mock.method(globalThis,'fetch',async u=>String(u).includes('computermania.co.za/search/suggest.json')?new Response(JSON.stringify({resources:{results:{products:[{title:'Logitech PRO X Gaming Headset',url:'/products/logitech-pro-x-headset?_pos=1'},{title:'Logitech PRO X Gaming Mouse',url:'/products/mouse'},{title:'Logitech PRO X3 Gaming Headset',url:'https://unrelated.example/products/headset'}]}}})):new Response(''));
 const rows=await nativeRetailerUrls({name:'Logitech PRO X Gaming Headset',object:'headset',searchQuery:'Logitech PRO X Gaming Headset'});assert.deepEqual(rows,['https://computermania.co.za/products/logitech-pro-x-headset']);
});

test('a published SKU omitted from suggestion titles can still reach strict page verification',async t=>{
 const {nativeRetailerUrls}=await import('../lib/native-retailer-discovery.js');t.mock.method(globalThis,'fetch',async u=>String(u).includes('computermania.co.za/search/suggest.json')?new Response(JSON.stringify({resources:{results:{products:[{title:'Logitech PRO X Gaming Headset',url:'/products/logitech-pro-x'}]}}})):new Response(''));
 const urls=await nativeRetailerUrls({name:'Logitech PRO X Gaming Headset 981-000818',searchQuery:'Logitech PRO X Gaming Headset 981-000818'});assert.deepEqual(urls,['https://computermania.co.za/products/logitech-pro-x']);
});

test('unavailable retailer search does not skip independently verified product candidates',async t=>{
 const title='Korg Pitchclip 2 clip-on tuner',url='https://www.marshallmusic.co.za/product/korg-pitchclip-2-clip-on-tuner/';
 t.mock.method(globalThis,'fetch',async input=>String(input)===url?new Response('<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name:title,offers:{price:345,priceCurrency:'ZAR',availability:'https://schema.org/InStock'}})+'</script>',{headers:{'content-type':'text/html'}}):new Response('',{status:503}));
 const offers=await nativeRetailerDiscovery({brand:'Korg',model:'Pitchclip 2',name:title,object:'clip-on instrument tuner',category:'musical accessories',searchQuery:title});
 assert.equal(offers.length,1);assert.equal(offers[0].product_url,url);assert.equal(offers[0].sourcePageVerified,true);assert.equal(offers[0].price,345);
});

test('a Plus title cannot override its contradictory base-model product code',async t=>{
 const url='https://bothners.co.za/shop/microphones/example-mv7/';let sku='MV7K';
 t.mock.method(globalThis,'fetch',async u=>String(u).includes('/wp-json/')?new Response(JSON.stringify([{name:'Shure MV7+ Podcast Microphone',sku,permalink:url,is_in_stock:true,prices:{price:'669500',currency_code:'ZAR',currency_minor_unit:2}}])):new Response('',{status:404}));
 const wanted=ident({name:'Shure MV7+ microphone',searchQuery:'Shure MV7+ microphone'});assert.equal(await verify(url,wanted),null,'Contradictory model code must be excluded from exact price comparisons');sku='MV7+K';assert.equal((await verify(url,wanted))?.price,6695);
});

// Reproduction: substring host matching previously gave these unrelated domains
// enough trust points to accept a page without structured product evidence.
test('retailer trust requires a complete host boundary',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response(page('<p>Add to cart In stock</p>')));
 for(const h of ['incredible.co.za.unrelated.example','fakeincredible.co.za','amazon.unrelated.example','notebay.example']){
  assert.equal(await verify('https://'+h+'/products/sony-wh-1000xm5-black',ident({name})),null,h);
 }
 for(const h of ['incredible.co.za','www.incredible.co.za']){
  assert.equal((await verify('https://'+h+'/products/sony-wh-1000xm5-black',ident({name})))?.trustedRetailerDomain,true,h);
 }
});
