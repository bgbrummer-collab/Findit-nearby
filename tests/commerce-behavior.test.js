import test from 'node:test';
import assert from 'node:assert/strict';
import handler, {ident, query, identityMatches, structuredProduct, structuralPrice, verify} from '../lib/product-intelligence-core.js';
import worker from '../cloudflare/worker.js';
const product=(name,extra={})=>ident({name,searchQuery:name,...extra});
const html=(name,price=120,currency='ZAR',extra={})=>`<title>${name}</title><script type="application/ld+json">${JSON.stringify({'@type':'Product',name,...extra,offers:{'@type':'Offer',price,priceCurrency:currency,availability:'https://schema.org/InStock'}})}</script>`;
const categories=[['electronics','Sony WH-1000XM5 black'],['groceries','Kelloggs Corn Flakes 500g'],['clothing','Levis 501 jeans blue'],['shoes','Nike Air Force 1 white'],['beauty','Nivea body lotion 250ml'],['tools','Bosch GSB 13 RE drill'],['toys','LEGO 75301 X Wing'],['furniture','IKEA Billy bookcase white'],['household','Twinsaver toilet paper 18 rolls']];
for(const [category,name] of categories)test(`${category}: exact retailer evidence retains price/currency/online stock`,async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response(html(name),{headers:{'content-type':'text/html'}}));
 const offer=await verify('https://retailer.example/product/exact-item',product(name));
 assert.ok(offer);assert.equal(offer.price,120);assert.equal(offer.currency,'ZAR');assert.equal(offer.availability,'in_stock');assert.equal(offer.branchStockVerified,false);assert.equal(offer.directionsAvailable,false);
});
test('search retains model, colour and capacity qualifiers',()=>assert.equal(query(product('Sony WH-1000XM5 black',{brand:'Sony',model:'WH-1000XM5'})),'Sony WH-1000XM5 black'));
for(const [wanted,wrong] of [['Sony WH-1000XM5','Sony WH-1000XM50'],['Bosch GSB 13 RE drill','Bosch GSB 130 RE drill'],['Nike Air Force 1 white','Nike Air Force 1 black white'],['Nivea lotion 250ml','Nivea lotion 500ml'],['Twinsaver 18 rolls','Twinsaver 9 rolls'],['Samsung phone 128GB','Samsung phone 256GB']])test(`reject adjacent variant: ${wrong}`,()=>assert.equal(identityMatches(wrong,product(wanted)),false));
test('Product type arrays and later valid offers are supported',()=>{const data={'@type':['Thing','Product'],name:'Sony WH-1000XM5',offers:[{price:null},{price:'199.99',priceCurrency:'USD'}]};const p=structuredProduct(`<script type="application/ld+json">${JSON.stringify(data)}</script>`,product(data.name));assert.equal(p.price,199.99);assert.equal(p.currency,'USD')});
test('barcode must match product-scoped GTIN',()=>{const i=product('Nivea lotion 250ml',{barcode:'1234567890123'});assert.equal(structuredProduct(html(i.name),i),null);assert.equal(structuredProduct(html(i.name,120,'ZAR',{gtin13:i.barcode}),i).price,120);assert.equal(structuredProduct(html(i.name,120,'ZAR',{gtin13:'9876543210987'}),i),null)});
test('no prices from recommendation JSON or catalogue text',()=>{const i=product('Sony WH-1000XM5');assert.equal(structuralPrice('<script>{"recommendations":[{"price":1}]}</script> R 1', '',i,i.name,'https://store.co.za/item'),null)});
test('currency is explicit evidence, never inferred from retailer country',()=>{const i=product('Sony WH-1000XM5');assert.equal(structuralPrice(html(i.name,100,''),'',i,i.name,'https://store.co.za/item').currency,null);assert.equal(structuralPrice(html(i.name,100,'USD'),' ',i,i.name,'https://store.co.za/item').currency,'USD')});
test('product price meta supports reversed attribute order',()=>{const i=product('Sony WH-1000XM5');assert.deepEqual(structuralPrice('<meta content="99.95" property="product:price:amount"><meta content="EUR" property="product:price:currency">','',i,i.name,'https://store.example/item'),{price:99.95,currency:'EUR'})});
test('end-to-end discovery rejects wrong variants and mixed-currency cheapest',async t=>{
 const wanted='Sony WH-1000XM5 black',urls=['https://store.example/product/right','https://other.example/product/right','https://store.example/product/wrong'];
 t.mock.method(globalThis,'fetch',async url=>{const u=String(url);if(u.includes('bing.com/search'))return new Response(`<rss>${urls.map(link=>`<item><title>${wanted}</title><description>${wanted} price</description><link>${link}</link></item>`).join('')}</rss>`);return new Response(html(u.endsWith('wrong')?'Sony WH-1000XM50 black':wanted, u.includes('other')?10:100,u.includes('other')?'USD':'ZAR'),{headers:{'content-type':'text/html'}})});
 let result;const res={setHeader(){},status(){return this},json(x){result=x;return this}};
 await handler({method:'POST',body:{identification:product(wanted)}},res);
 assert.equal(result.offers.length,2);assert.equal(result.bestPrice,null);assert.ok(result.offers.every(o=>!o.product_url.endsWith('wrong')));
});
test('worker validates missing and invalid input without remote calls',async()=>{
 for(const [route,body,status] of [['search',{},400],['nearby',{lat:91,lon:28},400],['nearby',{lat:null,lon:28},400],['assistant',{},400],['feedback',{rating:0,message:''},400]]){
 const r=await worker.fetch(new Request(`https://findit.test/api/${route}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),{});assert.equal(r.status,status,route);
 }
 const r=await worker.fetch(new Request('https://findit.test/api/no-such-route'),{});assert.equal(r.status,404);
});
test('typed search is user input, never a claimed visual identification',async()=>{const r=await worker.fetch(new Request('https://findit.test/api/search',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query:'Sony WH-1000XM5 black'})}),{});const d=await r.json();assert.equal(d.identification.name,'Sony WH-1000XM5 black');assert.equal(d.visualVerification,false);assert.equal(d.verified,false);assert.equal(d.identification.confidence,null)});
test('barcode-only lookup resolves product name by matching GTIN',async t=>{const i=product('1234567890123',{barcode:'1234567890123'});t.mock.method(globalThis,'fetch',async()=>new Response(html('Nivea body lotion 250ml',100,'ZAR',{gtin13:i.barcode}),{headers:{'content-type':'text/html'}}));assert.equal((await verify('https://store.example/item',i)).price,100)});
test('explicit shoe size must be present in the product title',()=>{assert.equal(identityMatches('Nike Air Force 1 white size 9',product('Nike Air Force 1 white',{brand:'Nike',model:'Air Force 1',size:'8'})),false)});
test('feedback delivery failure is not a successful save',async()=>{const r=await worker.fetch(new Request('https://findit.test/api/feedback',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({rating:5,message:'test'})}),{});assert.equal(r.status,503);assert.equal((await r.json()).delivered,false)});
test('health reports configuration and version identifies the deployed commit',async()=>{const r=await worker.fetch(new Request('https://findit.test/api/health'),{}),d=await r.json();assert.equal(d.photoIdentification,false);assert.equal(d.feedbackEndpoint,false);assert.equal(d.checksAreConfigurationOnly,true);const v=await worker.fetch(new Request('https://findit.test/api/version'),{BUILD_COMMIT:'test-sha'});assert.equal((await v.json()).commit,'test-sha')});
test('nearby uses category-specific shops and never implies branch inventory',async t=>{
 const cases=[['LEGO toy','toys'],['IKEA Billy bookcase','furniture'],['Levis jeans','clothes'],['Bosch drill','hardware'],['Sony headphones','electronics'],['Kelloggs grocery cereal','supermarket']];
 let queries=[];t.mock.method(globalThis,'fetch',async(url,options)=>{queries.push(String(options.body));return new Response(JSON.stringify({elements:[{id:1,type:'node',lat:-25.748,lon:28.229,tags:{name:'Fixture Store',shop:'toys'}}]}))});
 for(const [name,tag] of cases){queries=[];const r=await worker.fetch(new Request('https://findit.test/api/nearby',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({lat:-25.7479,lon:28.2293,identification:{name}})}),{});const d=await r.json();assert.ok(d.searchedShopTags.includes(tag),name);assert.ok(d.stores[0].distanceKm<1);assert.equal(d.stores[0].branchStockVerified,false);assert.equal(d.stores[0].directionsAvailable,false);}
});
test('photo flow accepts corroborated visible identity and rejects conflicting models',async()=>{
 const post=()=>{const f=new FormData();f.set('image',new Blob(['fixture'],{type:'image/jpeg'}),'fixture.jpg');return new Request('https://findit.test/api/search',{method:'POST',body:f})};
 const good={name:'Sony WH-1000XM5 headphones',brand:'Sony',model:'WH-1000XM5',object:'headphones',category:'electronics',confidence:.9};
 let calls=0;const env={AI:{run:async()=>{calls++;return {answer:JSON.stringify(good)}}}};
 const d=await (await worker.fetch(post(),env)).json();assert.equal(d.visualVerification,true);assert.equal(d.identification.model,'WH-1000XM5');assert.ok(calls>=2);
 calls=0;env.AI.run=async()=>({answer:JSON.stringify(++calls===1?good:{...good,model:'WH-1000XM4'})});
 const conflict=await (await worker.fetch(post(),env)).json();assert.equal(conflict.identification,null);assert.equal(conflict.requiresUserInput,true);
});
test('invalid image upload is rejected',async()=>{const f=new FormData();f.set('image',new Blob(['text'],{type:'text/plain'}),'file.txt');const r=await worker.fetch(new Request('https://findit.test/api/search',{method:'POST',body:f}),{});assert.equal(r.status,400)});
for(const wrong of ['Sony WH-1000XM5 replacement ear pads','Sony WH-1000XM5 protective case','Sony WH-1000XM5 bundle'])test(`reject accessories and bundles: ${wrong}`,()=>assert.equal(structuredProduct(html(wrong),product('Sony WH-1000XM5 headphones',{brand:'Sony',model:'WH-1000XM5',object:'headphones'})),null));
test('worker research fetches the exact page and rejects neighbouring model snippets',async t=>{
 const name='Sony WH-1000XM5',url='https://sony.example/product/xm5';
 t.mock.method(globalThis,'fetch',async u=>String(u).includes('bing.com')?new Response('<rss><item><title>Sony WH-1000XM50</title><description>Sony headphones with invented battery claims</description><link>https://wrong.example/product</link></item></rss>'):new Response(`<title>${name}</title><meta name="description" content="Sony WH-1000XM5 provides wireless audio and noise cancellation. Wireless playback supports compatible Bluetooth devices.">`));
 const r=await worker.fetch(new Request('https://findit.test/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification:{name,searchQuery:name},offers:[{product_name:name,product_url:url,sourcePageVerified:true,exactProductMatch:true}]})}),{}),d=await r.json();
 assert.equal(d.researched,true);assert.match(d.whatItDoes,/noise cancellation/);assert.equal(d.sources.length,1);assert.equal(d.sources[0].url,url);assert.ok(d.pros.length);assert.doesNotMatch(JSON.stringify(d),/invented battery/);
});
test('worker research does not treat a search snippet as verified product evidence',async t=>{t.mock.method(globalThis,'fetch',async u=>String(u).includes('bing.com')?new Response('<rss><item><title>Sony WH-1000XM5</title><description>Best headphones with unverified claims.</description><link>https://store.example/product</link></item></rss>'):new Response('blocked',{status:403}));const r=await worker.fetch(new Request('https://findit.test/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification:{name:'Sony WH-1000XM5'}})}),{});assert.equal((await r.json()).researched,false)});
