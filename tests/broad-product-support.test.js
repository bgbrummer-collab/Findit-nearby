import test from 'node:test';import assert from 'node:assert/strict';
import {specializedProductFamily,specializedShopTags} from '../lib/specialized-product-routing.js';
import commerce,{productFamily,productVariantConflict,identityMatches,ident,verify} from '../lib/product-intelligence-core.js';
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

test('typed model spacing and object synonyms do not hide an otherwise exact published product',async t=>{
 const source={"@type":"Product",name:'Example 2 EX42 Rower',description:'An indoor rower with adjustable resistance.',offers:{price:2000,priceCurrency:'ZAR'}};
 t.mock.method(globalThis,'fetch',async()=>new Response('<script type="application/ld+json">'+JSON.stringify(source)+'</script>',{headers:{'content-type':'text/html'}}));
 assert.equal((await verify('https://shop.example/products/ex42',ident({name:'Example2 EX42 rowing machine'})))?.price,2000);
 assert.equal(await verify('https://shop.example/products/ex42',ident({name:'Example3 EX42 rowing machine'})),null);
 assert.equal(await verify('https://shop.example/products/ex42',ident({name:'Example2 EX420 rowing machine'})),null);
});

for(const title of ['Example Q42 mouse pad XXL','Example Q42 mouse pad XL','Example Q42 mouse pad Small','Example Q42 mouse pad M'])test('named purchase size rejects incompatible pad: '+title,()=>{assert.equal(productVariantConflict(title,ident({name:'Example Q42 Large mouse pad'})),true);});
for(const title of ['Example Q42 mouse pad L','Example Q42 Large mouse pad'])test('named purchase size preserves equivalent large pad: '+title,()=>{assert.equal(productVariantConflict(title,ident({name:'Example Q42 Large mouse pad'})),false);});

for(const title of ['Example EX42 rower 10 Pack','Example EX42 rower pack of 10','Example EX42 rower set of 2','Example EX42 rower 4-piece'])test('single product rejects an unrequested multi-unit purchase: '+title,()=>{assert.equal(productVariantConflict(title,ident({name:'Example EX42 rower'})),true);});
test('matching explicit purchase quantity remains valid',()=>{assert.equal(productVariantConflict('Example EX42 rower pack of 10',ident({name:'Example EX42 rower 10 pack'})),false);});

test('gym equipment retains official sports branches when map providers fail',async t=>{
 const row={id:712,status:'active',title:'Example Mall',lat:-25.75,lng:28.23,contact_number:'012 123 4567',street_address:'Shop 2 Example Mall',city:'Pretoria',trading_hours:{Monday:'9:00 to 18:00'}};
 t.mock.method(globalThis,'fetch',async url=>String(url)==='https://www.sportsmanswarehouse.co.za/store-locator/'?new Response("<store-selector :stores='"+JSON.stringify([row])+"'>"):new Response('',{status:503}));
 const d=await(await worker.fetch(new Request('https://findit.test/api/nearby',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({lat:-25.75,lon:28.23,identification:{name:'Example rowing machine'}})}),{})).json();
 assert.equal(d.stores.length,1);assert.equal(d.stores[0].name,'Sportsmans Warehouse Example Mall');assert.equal(d.stores[0].phone,'012 123 4567');assert.equal(d.stores[0].source,'Official retailer locator');assert.equal(d.stores[0].branchStockVerified,false);assert.equal(d.stores[0].exactProductMatch,false);assert.equal(d.discoveryAvailable,true);
});

for(const [query,title]of [['Example WH-1000XM5 black','Example WH1000XM5 headphones black'],['Example FX-82ZA Plus II calculator','Example FX82ZA Plus II calculator'],['Example MF-752Cdw printer','Example MF752Cdw printer']])test('typed technical code accepts punctuation-only differences: '+query,()=>{assert.equal(identityMatches(title,ident({name:query})),true);});
for(const title of ['Example WH1000XM4 headphones black','Example WH1000XM5B headphones black','Example WH1000XM5 headphones white'])test('typed technical-code formatting never changes model or colour: '+title,()=>{assert.equal(identityMatches(title,ident({name:'Example WH-1000XM5 black'})),false);});
test('technical-code formatting retains generation identity',()=>{assert.equal(identityMatches('Example FX82ZA Plus III calculator',ident({name:'Example FX-82ZA Plus II calculator'})),false);});

test('whole-vehicle retailer suggestions do not recommend an unrelated manufacturer',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response('<rss><channel></channel></rss>'));let data;
 await commerce({method:'POST',body:{identification:{name:'Toyota Corolla Cross 1.8 Xi'}}},{setHeader(){},status(){return this},json(value){data=value;return this;}});
 assert.ok(data.retailerStatus.some(r=>r.name==='AutoTrader'));assert.ok(!data.retailerStatus.some(r=>/Ford/i.test(r.name)));
});

test('an explicitly requested vehicle manufacturer remains a relevant source',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response('<rss><channel></channel></rss>'));
 for(const identification of [{name:'Ford Mustang car'},{brand:'Ford',name:'Mustang car',searchQuery:'Mustang car'}]){let data;await commerce({method:'POST',body:{identification}},{setHeader(){},status(){return this},json(value){data=value;return this;}});assert.ok(data.retailerStatus.some(r=>r.name==='Ford South Africa'));}
});

for(const name of ['Example adult dog food 2kg','Example cat litter','Example pet carrier'])test('pet products share pet retailers and nearby categories: '+name,async t=>{
 assert.equal(specializedProductFamily({name}),'pet');assert.equal(productFamily(ident({name})),'pet');assert.deepEqual(specializedShopTags({name}),['pet']);let data;const urls=[];
 t.mock.method(globalThis,'fetch',async url=>{urls.push(String(url));return new Response('<rss><channel></channel></rss>');});
 await commerce({method:'POST',body:{identification:{name}}},{setHeader(){},status(){return this},json(value){data=value;return this;}});
 assert.ok(data.retailerStatus.some(r=>r.name==='Petworld'));assert.ok(data.retailerStatus.some(r=>r.name==='Absolute Pets'&&r.searchUrl==='https://www.absolutepets.com/'));assert.ok(!data.retailerStatus.some(r=>/Checkers|Shoprite/.test(r.name)));assert.ok(urls.some(u=>u.includes('petworld.co.za')));assert.ok(!urls.some(u=>u.includes('absolute-pets.co.za')));
});
for(const name of ['CAT drill','Cat ear headphones','Carpet cleaner','Fish eye camera lens'])test('pet routing does not hijack animal words in other products: '+name,()=>assert.notEqual(specializedProductFamily({name}),'pet'));

test('fitness discovery searches another published catalogue without fixed product URLs',async t=>{
 const {nativeRetailerUrls}=await import('../lib/native-retailer-discovery.js'),seen=[];t.mock.method(globalThis,'fetch',async url=>{seen.push(String(url));return new Response('');});
 await nativeRetailerUrls({name:'Example EX42 rowing machine'});assert.ok(seen.some(u=>u.startsWith('https://gymgear.co.za/search/suggest.json?')));assert.ok(!seen.some(u=>/gymgear\.co\.za\/products\//.test(u)));
});
