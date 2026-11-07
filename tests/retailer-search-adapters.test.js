import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeRetailerUrls} from '../lib/native-retailer-discovery.js';
for(const [name,expected,productUrl] of [
 ['Sony WH-1000XM5 black','https://www.incredible.co.za/catalogsearch/result/?q=Sony%20WH-1000XM5%20black','https://www.incredible.co.za/sony-wh-1000xm5-wireless-noise-cancelling-headphones-black'],
 ['Nivea Rich Nourishing Body Lotion 250ml','https://clicks.co.za/search?q=Nivea%20Rich%20Nourishing%20Body%20Lotion%20250ml%3Arelevance&text=Nivea%20Rich%20Nourishing%20Body%20Lotion%20250ml&count=100','https://clicks.co.za/nivea_rich-nourishing-body-lotion-250ml/p/129748']
])test(`retailer adapter discovers ${name} with the retailer's actual search route`,async t=>{
 const requested=[];
 t.mock.method(globalThis,'fetch',async u=>{const url=String(u);requested.push(url);return new Response(url.endsWith(expected)?`${' '.repeat(900000)}${Array.from({length:125},(_,n)=>'<a href="https://www.incredible.co.za/navigation-section-'+n+'">Browse</a>').join('')}<a href="https://www.incredible.co.za/static/Sony-WH-1000XM5-black.css">Styles</a><a href="https://www.incredible.co.za/catalogsearch/result/?q=Sony&amp;type=product">Search</a><a href="${productUrl}">${name}</a>`:'')});
 const urls=await nativeRetailerUrls({name,searchQuery:name});
 assert(urls.includes(productUrl));assert(requested.some(url=>url.endsWith(expected)));
 assert(urls.every(url=>!url.includes('/search?')&&!url.includes('/catalogsearch/')&&!url.includes('/static/')));
});

test('broader retailer discovery preserves exact identity and size for subsequent verification',async t=>{
 const exact='https://clicks.co.za/nivea_rich-nourishing-body-lotion-250ml/p/129748';
 const requested=[];
 t.mock.method(globalThis,'fetch',async u=>{const url=String(u);requested.push(url);return new Response(url.includes('q=Nivea%3Arelevance')?'<a href="'+exact+'">Nivea Rich Nourishing Body Lotion 250ml</a>':'')});
 const urls=await nativeRetailerUrls({name:'Nivea Rich Nourishing Body Lotion 250ml',searchQuery:'Nivea Rich Nourishing Body Lotion 250ml'});
 assert(urls.includes(exact));
 assert(requested.some(u=>u.includes('q=Nivea%3Arelevance')&&u.includes('count=100')));
 const {ident,identityMatches}=await import('../lib/product-intelligence-core.js');
 const i=ident({name:'Nivea Rich Nourishing Body Lotion 250ml'});
 assert(identityMatches('Nivea Rich Nourishing Body Lotion 250ml',i));
 assert(!identityMatches('Nivea Rich Nourishing Body Lotion 400ml',i));
 assert(!identityMatches('Nivea Intensive Moisturising Body Lotion 250ml',i));
});

test('strong exact candidates from later searches outrank partial matches before the verification budget',async t=>{
 const exact='https://clicks.co.za/nivea_rich-nourishing-body-lotion-250ml/p/129748';
 t.mock.method(globalThis,'fetch',async u=>new Response(String(u).includes('q=Nivea%3Arelevance')?'<a href="'+exact+'">Nivea Rich Nourishing Body Lotion 250ml</a>':String(u).includes('clicks.co.za/search?text=')?Array.from({length:20},(_,n)=>'<a href="https://clicks.co.za/other-body-lotion-250ml-'+n+'/p/'+n+'">Body Lotion 250ml</a>').join(''):''));
 const urls=await nativeRetailerUrls({name:'Nivea Rich Nourishing Body Lotion 250ml'});
 assert.equal(urls[0],exact);
});

for(const [name,route] of [
 ['Nivea Rich Nourishing Body Lotion 250ml','https://www.dischem.co.za/catalogsearch/result/?q='],
 ['Bosch GSB 185 LI drill','https://www.buco.co.za/catalogsearch/result/?q='],
 ['Bosch GSB 18V-50 drill','https://leroymerlin.co.za/catalogsearch/result/?q='],
 ['LEGO Classic 10698','https://www.toysrus.co.za/catalogsearch/result/?q='],
 ['Sony smart speaker','https://www.geewiz.co.za/jolisearch?controller=search&s='],
 ['Sony WH-1000XM5 black','https://www.hificorp.co.za/catalogsearch/result/?q='],
 ['Faber Castell pencil','https://www.pna.co.za/?s='],
 ['Caterpillar cordless drill','https://www.buco.co.za/catalogsearch/result/?q=']
])test('retailer platform and category adapter: '+name,async t=>{
 const requested=[];t.mock.method(globalThis,'fetch',async u=>{requested.push(String(u));return new Response('')});
 await nativeRetailerUrls({name});assert(requested.some(u=>u.startsWith(route)));
 assert(!requested.some(u=>u.includes('absolute-pets')||u.includes('petheaven')));
});
test('apostrophe spelling is equivalent while size and brand remain exact',async()=>{
 const {ident,identityMatches}=await import('../lib/product-intelligence-core.js');
 const i=ident({name:'Kelloggs Corn Flakes 500g'});
 assert(identityMatches("Kellogg’s Corn Flakes 500 g",i));
 assert(!identityMatches("Kellogg’s Corn Flakes 750 g",i));
 assert(!identityMatches('Other Brand Corn Flakes 500g',i));
});

test('product name anchor wins over earlier duplicate image anchor containing inline styles',async t=>{
 const page='https://www.dischem.co.za/catalogsearch/result/?q=Example%20Relief%20Cream%2025g',url='https://www.dischem.co.za/example-relief-cream-25g-123';
 const html='<a href="'+url+'"><img alt="Example Relief Cream 25g"><style>.product-image { width:240px; }</style></a><strong><a class="product-item-link" href="'+url+'">Example Relief Cream 25g</a></strong>';
 t.mock.method(globalThis,'fetch',async u=>new Response(String(u)===page?html:''));
 const urls=await nativeRetailerUrls({brand:'Example Relief',name:'Example Relief Cream 25g',object:'topical cream',category:'beauty',searchQuery:'Example Relief Cream 25g'});
 assert.equal(urls.filter(u=>u===url).length,1);
});

test('large personal-care catalogue pages retain later exact products instead of truncating them',async t=>{
 const name='Example Men Deep Anti-Perspirant 150ml',url='https://clicks.co.za/example-men_deep-anti-perspirant-150ml/p/123456';
 const requested=[];
 t.mock.method(globalThis,'fetch',async u=>{requested.push(String(u));return new Response(String(u).includes('clicks.co.za/search?')&&new URL(String(u)).searchParams.get('text')===name?' '.repeat(1900000)+'<a href="'+url+'">'+name+'</a>':'');});
 const urls=await nativeRetailerUrls({name,searchQuery:name},{maxSearchPages:2,timeoutMs:3500,readerFallback:false});
 assert.ok(urls.includes(url));assert.ok(requested.some(u=>new URL(u).searchParams.get('count')==='100'));
 assert.ok(requested.every(u=>!u.startsWith('https://r.jina.ai/')));
});

test('electronics catalogue discovery includes FirstShop and excludes different colourways',async t=>{
 const name='Logitech G435 headset black',right='/products/logitech-g435-headset-black',wrong='/products/logitech-g435-headset-blue';
 t.mock.method(globalThis,'fetch',async u=>new Response(String(u).startsWith('https://www.firstshop.co.za/search/suggest.json')?JSON.stringify({resources:{results:{products:[{title:name,url:right},{title:'Logitech G435 headset blue',url:wrong},{title:'Logitech G522 headset black',url:'/products/g522'}]}}}):''));
 const urls=await nativeRetailerUrls({name,brand:'Logitech',model:'G435',object:'headset',color:'black'});
 assert.ok(urls.includes('https://www.firstshop.co.za'+right));assert.ok(!urls.includes('https://www.firstshop.co.za'+wrong));assert.ok(!urls.some(u=>u.endsWith('/g522')));
});

test('catalogue model fallback handles headset wording without dropping separate colour or size constraints',async t=>{
 const requests=[],right='https://www.firstshop.co.za/products/example-a42-headset-black';
 t.mock.method(globalThis,'fetch',async u=>{
  const url=new URL(String(u));requests.push(url.href);
  if(url.hostname==='www.firstshop.co.za'&&url.pathname==='/search/suggest.json')return Response.json({resources:{results:{products:url.searchParams.get('q')==='Example A42'?[{title:'Example A42 headset black',url:right},{title:'Example A42 headset blue',url:'/products/example-a42-headset-blue'},{title:'Example A43 headset black',url:'/products/example-a43-headset-black'}]:[]}}});
  return new Response('');
 });
 const i={name:'Example A42 headphones',brand:'Example',model:'A42',object:'headphones',color:'black',category:'electronics',searchQuery:'Example A42 headphones'};
 const urls=await nativeRetailerUrls(i);
 assert.ok(urls.includes(right));assert.ok(!urls.some(u=>/headset-blue|a43/.test(u)));assert.ok(requests.some(u=>new URL(u).searchParams.get('q')==='Example A42 headphones'));assert.ok(requests.some(u=>new URL(u).searchParams.get('q')==='Example A42'));
 requests.length=0;const wrongSize=await nativeRetailerUrls({...i,size:'XL'});assert.ok(!wrongSize.includes(right));
});

test('full HTML catalogue extraction retains later named anchors while excluding unrelated navigation',async t=>{
 const name='Example Men Deep Anti-Perspirant 150ml',url='https://clicks.co.za/example_men-deep-150ml/p/123456';
 const html='<!doctype html><html><body>'+Array.from({length:180},(_,n)=>'<a href="/navigation-'+n+'">Shop department</a>').join('')+'<a href="'+url+'"><img alt="'+name+'"></a>'+' '.repeat(100000)+'<a href="'+url+'">'+name+'</a></body></html>';
 t.mock.method(globalThis,'fetch',async u=>new Response(String(u).includes('clicks.co.za/search?')?html:''));
 const urls=await nativeRetailerUrls({name,brand:'Example',object:'deodorant',category:'beauty'},{maxSearchPages:2,readerFallback:false});assert.deepEqual(urls,[url]);
});

for(const name of ['Example Classic Low White Blue Sneaker','Example Original Jeans'])test('Bash uses its published search route for '+name,async t=>{
 const route='https://bash.com/s?search='+encodeURIComponent(name),product='https://bash.com/example-product-123/p',seen=[];
 t.mock.method(globalThis,'fetch',async u=>{seen.push(String(u));return new Response(String(u)===route?'<!DOCTYPE html><html><body><a href="'+product+'">'+name+'</a></body></html>':'')});
 const urls=await nativeRetailerUrls({name,searchQuery:name});assert.ok(seen.includes(route));assert.ok(urls.includes(product));assert.ok(!seen.some(u=>u.startsWith('https://bash.com/search?')));assert.ok(!urls.includes(route));
});

test('Bash discovery leaves exact colour and size decisions to product-page verification',async t=>{
 const {verify,ident}=await import('../lib/product-intelligence-core.js');
 const wanted='Example Classic Low White Blue Sneaker',url='https://bash.com/example-classic-white-red-123/p';
 t.mock.method(globalThis,'fetch',async u=>new Response(String(u).includes('/s?search=')?'<!DOCTYPE html><html><body><a href="'+url+'">Example Classic Low White Red Sneaker</a></body></html>':'<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name:'Example Classic Low White Red Sneaker',color:'White Red',size:'9',offers:{price:1200,priceCurrency:'ZAR',availability:'https://schema.org/InStock'}})+'</script>'));
 const i=ident({name:wanted,color:'White Blue',size:'8'}),urls=await nativeRetailerUrls(i,{maxSearchPages:1});assert.ok(urls.includes(url));assert.equal(await verify(url,i),null);
});

for(const [domain,title,slug] of [
 ['www.pepstores.com','Classic Black Denim Jeans','classic-black-denim-jeans-sku-eqz84'],
 ['www.ackermans.co.za','Black Barrel Leg Jeans','black-barrel-leg-jeans-sku-230740']
])test('public clothing catalogue discovers exact items at '+domain,async t=>{
 const endpoint='https://'+domain+'/search?';
 t.mock.method(globalThis,'fetch',async input=>new Response(String(input).startsWith(endpoint)?'<a href="/products/'+slug+'">'+title+'</a>':''));
 const urls=await nativeRetailerUrls({name:title,category:'clothing',object:'jeans'});
 assert.ok(urls.includes('https://'+domain+'/products/'+slug));
});
test('Makro catalogue uses the published search form and retains product selection parameters',async t=>{
 const path='/logitech-g502-hero-mouse/p/itm123abc';
 t.mock.method(globalThis,'fetch',async input=>new Response(String(input)==='https://www.makro.co.za/search?q=Logitech%20G502%20HERO%20mouse'?'<a href="'+path+'?pid=SKU1&amp;lid=LIST1&amp;q=Logitech+G502">Logitech G502 HERO mouse</a>':''));
 const urls=await nativeRetailerUrls({name:'Logitech G502 HERO mouse'});
 assert.ok(urls.includes('https://www.makro.co.za'+path+'?pid=SKU1&lid=LIST1'));
});

test('marketplace and grocery adapters use their published search parameters',async t=>{
 const seen=[];t.mock.method(globalThis,'fetch',async url=>{seen.push(String(url));return new Response('');});
 await nativeRetailerUrls({name:'Example unusual product'});
 assert.ok(seen.includes('https://www.takealot.com/all?_sb=1&_r=1&qsearch=Example%20unusual%20product'));
 assert.ok(seen.includes('https://www.game.co.za/search?text=Example%20unusual%20product'));
 seen.length=0;await nativeRetailerUrls({name:'Example cereal 500g'});
 assert.ok(seen.includes('https://www.pnp.co.za/search?q=Example%20cereal%20500g'));
 assert.ok(seen.includes('https://www.makro.co.za/search?q=Example%20cereal%20500g'));
 const {catalogueQueryUrl}=await import('../lib/catalogue-discovery-terms.js');
 assert.equal(new URL(catalogueQueryUrl('https://www.takealot.com/all?qsearch=long','short')).searchParams.get('qsearch'),'short');
});

test('a readable predictive catalogue miss does not parse a recommendation-heavy HTML shell',async t=>{
 const seen=[];t.mock.method(globalThis,'fetch',async url=>{seen.push(String(url));return String(url).includes('/search/suggest.json')?Response.json({resources:{results:{products:[]}}}):new Response('');});
 await nativeRetailerUrls({name:'Example EX42 keyboard'});assert.ok(seen.some(u=>u.startsWith('https://www.firstshop.co.za/search/suggest.json')));assert.ok(!seen.some(u=>u.startsWith('https://www.firstshop.co.za/search?')));
});
test('discovery can retrieve abbreviated catalogue names through model codes without certifying them',async t=>{
 const exact='https://lego-gybc.co.za/products/example-plants-10329';
 t.mock.method(globalThis,'fetch',async url=>String(url).startsWith('https://lego-gybc.co.za/search/suggest.json')?Response.json({resources:{results:{products:[{title:'Tiny Plants',handle:'example-plants-10329',url:'/products/example-plants-10329',vendor:'LEGO'}]}}}):new Response(''));
 const urls=await nativeRetailerUrls({name:'LEGO Icons 10329 Tiny Plants'});assert.ok(urls.includes(exact));
 const {structuredProduct,ident}=await import('../lib/product-intelligence-core.js');assert.equal(structuredProduct('<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name:'LEGO Different Plants 10328',offers:{price:1,priceCurrency:'ZAR'}})+'</script>',ident({name:'LEGO Icons 10329 Tiny Plants'})),null);
});

test('a complete photo-catalogue result avoids fetching related lens kits and accessories',async t=>{
 const seen=[];t.mock.method(globalThis,'fetch',async url=>{seen.push(String(url));return String(url).startsWith('https://www.ormsdirect.co.za/search/suggest.json')?Response.json({resources:{results:{products:[{title:'Canon EOS R50 Mirrorless Camera Body',url:'/products/canon-r50-body'},{title:'Canon EOS R50 with 18-45mm Lens Kit',url:'/products/canon-r50-lens-kit'}]}}}):new Response('');});
 const urls=await nativeRetailerUrls({name:'Canon EOS R50 camera body'});assert.deepEqual(urls,['https://www.ormsdirect.co.za/products/canon-r50-body']);assert.ok(!seen.some(u=>u.startsWith('https://www.ormsdirect.co.za/search?')));
});

test('HTML discovery does not spend product verification on a missing Plus variant',async t=>{
 t.mock.method(globalThis,'fetch',async url=>new Response(String(url).startsWith('https://www.takealot.com/all?')?'<a href="/products/example-carry-backpack">Example Carry backpack</a>':''));
 assert.deepEqual(await nativeRetailerUrls({name:'Example Carry Plus backpack'}),[]);
});
