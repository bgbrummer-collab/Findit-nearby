import test from 'node:test';import assert from 'node:assert/strict';
import {specializedProductFamily,specializedShopTags} from '../lib/specialized-product-routing.js';
import {productFamily,ident,verify} from '../lib/product-intelligence-core.js';
import {reconcileVision} from '../lib/vision-consensus.js';
import worker from '../cloudflare/worker.js';
for(const [name,family,tags]of [['Example upper arm blood pressure monitor','medical',['medical_supply','chemist']],['Example rowing machine','fitness',['sports']],['Toyota Corolla Cross 1.8 Xi','vehicle',['car']]])test('one category decision drives product and nearby routing: '+name,async t=>{
 assert.equal(specializedProductFamily({name}),family);assert.equal(productFamily(ident({name})),family);assert.deepEqual(specializedShopTags({name}),tags);
 t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({elements:[]})));
 const result=await(await worker.fetch(new Request('https://findit.test/api/nearby',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({lat:-25.75,lon:28.23,identification:{name}})}),{})).json();assert.deepEqual(result.searchedShopTags,tags);assert.equal(result.branchStockVerified,false);
});
for(const name of ['Coffee capsules','Graphics tablet','Keyboard monitor stand','Honda generator','Toyota car cover'])test('specialist routing does not hijack '+name,()=>assert.equal(specializedProductFamily({name}),null));
for(const [a,b,type]of [['gaming mouse','computer mouse','mouse'],['mechanical keyboard','wireless keyboard','keyboard'],['mousepad','mouse pad','mouse pad'],['indoor rower','rowing machine','rowing machine'],['blood pressure monitor','sphygmomanometer','blood pressure monitor'],['mirrorless camera','camera','camera']])test('specific model survives object synonyms: '+type,()=>{
 const base={brand:'Example',model:'EX42',name:'Example EX42',object:a};const result=reconcileVision([base,{...base,object:b}]);assert.equal(result.object,type);assert.equal(result.brand,'Example');assert.equal(result.model,'EX42');assert.equal(result.requiresModelConfirmation,false);assert.match(result.name,/EX42/);
 const conflict=reconcileVision([base,{...base,object:b,model:'EX43'}]);assert.equal(conflict.requiresModelConfirmation,true);assert.equal(conflict.model,'');
});
for(const [wanted,wrong]of [['Canon EOS R50 camera body','Tilta Full Camera Cage for Canon EOS R50 V Black'],['Canon EOS R50 camera body','Canon EOS R50 camera 18-45mm 55-210mm lens'],['Example EX42 mouse','Example EX42 mouse pad'],['Example EX42 keyboard','Replacement keycaps for Example EX42 keyboard']])test('exact retailer matching rejects compatible accessories: '+wrong,async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response('<title>'+wrong+'</title><script type="application/ld+json">'+JSON.stringify({'@type':'Product',name:wrong,description:wanted,offers:{price:100,priceCurrency:'ZAR',availability:'https://schema.org/InStock'}})+'</script>',{headers:{'content-type':'text/html'}}));assert.equal(await verify('https://shop.example/products/ex42',ident({name:wanted})),null);
});

test('confirmed photo titles retain independently supported exact colour and size',()=>{
 const row={name:'Example EX42 headphones',brand:'Example',model:'EX42',object:'headphones',color:'Black',size:'Large'};
 const result=reconcileVision([row,{...row,object:'headset'}]);assert.equal(result.name,'Example EX42 headphones Large Black');assert.equal(result.searchQuery,result.name);
 const already=reconcileVision([{...row,name:'Example EX42 headphones Large Black'},{...row,name:'Example EX42 headphones Large Black'}]);assert.equal(already.name,'Example EX42 headphones Large Black');
});

test('medical searches include pharmacy amenities without searching computer shops',async t=>{
 const requests=[];t.mock.method(globalThis,'fetch',async(url,opts)=>{if(String(url).includes('interpreter'))requests.push(new URLSearchParams(String(opts.body)).get('data'));return new Response(JSON.stringify({elements:[]}));});
 await worker.fetch(new Request('https://findit.test/api/nearby',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({lat:-25.75,lon:28.23,identification:{name:'Example upper arm blood pressure monitor'}})}),{});
 assert.ok(requests.length);for(const q of requests){assert.match(q,/amenity="pharmacy"/);assert.match(q,/shop="medical_supply"/);assert.doesNotMatch(q,/shop="computer"/);}
});

for(const name of ['Example EX42 mechanical keyboard','Example EX42 gaming mouse','Example mouse pad','Example EX42 printer','Example NA23 air fryer'])test('computer peripherals and appliances reach electronics catalogues: '+name,async t=>{
 const {nativeRetailerUrls}=await import('../lib/native-retailer-discovery.js');const seen=[];t.mock.method(globalThis,'fetch',async u=>{seen.push(String(u));return new Response('');});assert.equal(productFamily(ident({name})),'electronics');await nativeRetailerUrls({name});assert.ok(seen.some(u=>u.includes('firstshop.co.za')));assert.ok(!seen.some(u=>u.includes('absolute-pets')));
});

for(const query of ['headphones','headphones black','black headphones','wireless headphones','Logitech headphones','Keychron keyboard','rowing machine','blood pressure monitor','car'])test('generic typed searches cannot claim an exact product: '+query,async()=>{
 const d=await(await worker.fetch(new Request('https://findit.test/api/search',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query})}),{})).json();assert.equal(d.identification.requiresModelConfirmation,true);assert.equal(d.identification.userConfirmed,false);assert.equal(d.identification.confidence,null);
});
for(const query of ['Logitech G502 HERO mouse','Sony WH-1000XM5 headphones','Keychron K2 keyboard'])test('specific typed model is preserved: '+query,async()=>{
 const d=await(await worker.fetch(new Request('https://findit.test/api/search',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query})}),{})).json();assert.equal(d.identification.name,query);assert.equal(d.identification.userConfirmed,true);
});
