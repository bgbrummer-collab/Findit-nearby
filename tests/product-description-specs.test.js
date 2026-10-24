import test from 'node:test';
import assert from 'node:assert/strict';
import {descriptionTableSpecifications} from '../lib/product-description-specs.js';
import worker from '../cloudflare/worker.js';
test('product specification tables keep exact units and deduplicate repeated tables',()=>{
 const table='<table><tr><th>Battery voltage</th><td>18V</td></tr><tr><td>Torque</td><td>28/50/50 Nm</td></tr><tr><td>Shipping</td><td>Free</td></tr></table>';
 assert.deepEqual(descriptionTableSpecifications(table+table),[{name:'Battery voltage',value:'18V'},{name:'Torque',value:'28/50/50 Nm'}]);
});
test('labelled technical paragraphs retain exact source units and exclude unrelated prose',()=>{
 const specs='<h2>Tech Specs</h2><p><strong>Model</strong>: Example 2<br><strong>Detection</strong> <strong>Range</strong>: A0 (27.5 Hz) – C8 (4186 Hz)<br><strong>Power</strong> <strong>Supply</strong>: 1 x CR2032 lithium battery<br><strong>Battery</strong> <strong>Life</strong>: Approximately 24 hours (A4 input)</p>';
 const rows=descriptionTableSpecifications(specs+specs+'<p><strong>Phone</strong>: 0123456789</p><h2>Contact</h2><p><strong>Address</strong>: Wrong street</p>');
 assert.deepEqual(rows,[{name:'Model',value:'Example 2'},{name:'Detection Range',value:'A0 (27.5 Hz) – C8 (4186 Hz)'},{name:'Power Supply',value:'1 x CR2032 lithium battery'},{name:'Battery Life',value:'Approximately 24 hours (A4 input)'}]);
 assert.deepEqual(descriptionTableSpecifications('<p><strong>Battery life</strong>: Invented 999 hours</p><h2>Features</h2><p><strong>Rating</strong>: Best ever</p>'),[]);
});
test('Shopify description specifications are scoped to the verified product, excluding footer tables',async t=>{
 const url='https://retailer.example/products/example-d1';
 const raw='<title>Example D1 drill</title><script type="application/ld+json">'+JSON.stringify({'@type':'Product',name:'Example D1 drill',brand:'Example',description:'A drill designed for drilling.'})+'</script><div class="product__description rte"><p>Designed for drilling.</p><table><tr><td>Battery voltage</td><td>18V</td></tr><tr><td>Torque</td><td>50 Nm</td></tr></table></div><footer><table><tr><td>Wrong product rating</td><td>999W</td></tr></table></footer>';
 t.mock.method(globalThis,'fetch',async u=>String(u)===url?new Response(raw):new Response('<rss/>'));
 const d=await(await worker.fetch(new Request('https://findit.test/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification:{name:'Example D1 drill'},offers:[{product_url:url,sourcePageVerified:true,exactProductMatch:true}]})}),{})).json();
 assert.ok(d.specifications.some(x=>x.name==='Battery voltage'&&x.value==='18V'&&x.sourceUrl===url));assert.ok(d.specifications.some(x=>x.name==='Torque'&&x.value==='50 Nm'));assert.doesNotMatch(JSON.stringify(d.specifications),/Wrong product rating|999W/);
});
test('verified structured descriptions expose technical paragraph specs with attribution',async t=>{
 const url='https://retailer.example/products/example-t2-tuner';
 const raw='<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name:'Example T2 tuner',brand:'Example',description:'<p>A compact clip-on tuner for stringed instruments.</p><h2>Technical Specifications</h2><p><strong>Detection Accuracy</strong>: ±1 cent<br><strong>Power Supply</strong>: 1 x CR2032 lithium battery</p>'})+'</script><footer><p><strong>Weight</strong>: 999kg</p></footer>';
 t.mock.method(globalThis,'fetch',async u=>String(u)===url?new Response(raw):new Response('<rss/>'));
 const d=await(await worker.fetch(new Request('https://findit.test/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification:{name:'Example T2 tuner'},offers:[{product_url:url,sourcePageVerified:true,exactProductMatch:true}]})}),{})).json();
 assert.ok(d.specifications.some(x=>x.name==='Detection Accuracy'&&x.value==='±1 cent'&&x.sourceUrl===url));
 assert.ok(d.specifications.some(x=>x.name==='Power Supply'&&x.value==='1 x CR2032 lithium battery'&&x.sourceUrl===url));
 assert.doesNotMatch(JSON.stringify(d.specifications),/999kg/);
});
test('short Woo catalogue descriptions are enriched only from an independently matching product content block',async t=>{
 const url='https://www.marshallmusic.co.za/product/example-t2-tuner/';
 for(const sameModel of [true,false]){
  const api={name:'Example T2 tuner',permalink:url,short_description:'A compact tuner for stringed instruments.',description:'',sku:'T2',prices:{price:'34500',currency_code:'ZAR',currency_minor_unit:2},is_in_stock:true};
  const html='<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name:sameModel?'Example T2 tuner':'Example T3 tuner',brand:'Example',sku:sameModel?'T2':'T3',offers:{price:345,priceCurrency:'ZAR'}})+'</script><div class="elementor-widget-wd_single_product_content"><div class="elementor-widget-container"><h2>Tech Specs</h2><p><strong>Power Supply</strong>: 1 x CR2032 lithium battery<br><strong>Detection Accuracy</strong>: ±1 cent</p></div></div><footer><h2>Tech Specs</h2><p><strong>Wrong field</strong>: 999kg</p></footer>';
  t.mock.method(globalThis,'fetch',async u=>String(u).includes('/wp-json/wc/store/')?new Response(JSON.stringify([api])):String(u)===url?new Response(html):new Response('<rss/>'));
  const d=await(await worker.fetch(new Request('https://findit.test/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification:{name:'Example T2 tuner',brand:'Example',model:'T2'},offers:[{product_url:url,sourcePageVerified:true,exactProductMatch:true}]})}),{})).json();
  assert.equal(d.specifications.some(x=>x.name==='Power Supply'&&x.value==='1 x CR2032 lithium battery'&&x.sourceUrl===url),sameModel);
  assert.doesNotMatch(JSON.stringify(d.specifications),/Wrong field|999kg/);t.mock.restoreAll();
 }
});

test('retailer product attributes and price caveats remain scoped and do not turn a link into purpose',async t=>{
 const url='https://retailer.example/example-cream-25g',name='Example Cream 25g';
 const caveat='Price shown excludes the dispensing fee.';
 const raw='<title>'+name+'</title><script type="application/ld+json">'+JSON.stringify({'@type':'Product',name,brand:'Example',description:'Get more information on the regulator website by clicking here',offers:{price:75,priceCurrency:'ZAR'}})+'</script><table id="product-attribute-specs-table"><tr><th>Product Main Barcode</th><td>6009712390007</td></tr><tr><th>Pack Size</th><td>25</td></tr></table><div class="product-nappi-disclaimer"><div>disclaimer:</div><span>'+caveat+'</span></div></div><footer><table><tr><td>Wrong product barcode</td><td>9999999999999</td></tr></table></footer>';
 t.mock.method(globalThis,'fetch',async u=>String(u)===url?new Response(raw):new Response('<rss/>'));
 const d=await(await worker.fetch(new Request('https://findit.test/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification:{name},offers:[{product_url:url,sourcePageVerified:true,exactProductMatch:true}]})}),{})).json();
 assert.equal(d.whatItDoes,'');assert.equal(d.researched,true);assert.ok(d.specifications.some(x=>x.name==='Barcode'&&x.value==='6009712390007'&&x.sourceUrl===url));assert.ok(d.specifications.some(x=>x.name==='Price conditions'&&x.value===caveat));assert.doesNotMatch(JSON.stringify(d),/Wrong product barcode|9999999999999/);
 const {verify}=await import('../lib/product-intelligence-core.js');const offer=await verify(url,{name,searchQuery:name,brand:'',model:'',object:'cream',category:'beauty',size:'',color:'',barcode:'',visibleText:[],features:[]});assert.equal(offer.price,75);assert.equal(offer.priceConditions,caveat);
 const {answerFromEvidence}=await import('../lib/assistant-answer.js');assert.match(answerFromEvidence('What does it cost?',{identification:{name},offers:[offer]},{}).answer,/excludes the dispensing fee/);
});

import {normalizePublishedSpecifications} from '../lib/product-description-specs.js';
test('catalogue aliases collapse without claiming an independently verified manufacturer code or units',()=>{
 const sourceUrl='https://shop.example/item';
 const rows=normalizePublishedSpecifications([
  {name:'SKU / product code',value:'0004023',sourceUrl},
  {name:'Manufacturer part number',value:'0004023',sourceUrl},
  {name:'SKU',value:'0004023',sourceUrl},
  {name:'Pack Size',value:'25',sourceUrl},
  {name:'Product Main Barcode',value:'6009712390007',sourceUrl},
 ]);
 assert.deepEqual(rows.map(r=>[r.name,r.value]),[
 ['Retailer product code','0004023'],
 ['Pack size (unit not supplied by source)','25'],['Barcode','6009712390007']]);
 assert.ok(rows.every(r=>r.sourceUrl===sourceUrl));assert.equal(rows[0].sourceAlsoListsAsMpn,true);
});
test('different manufacturer codes, quantities and source provenance remain separate',()=>{
 const rows=normalizePublishedSpecifications([{name:'SKU',value:'123',sourceUrl:'https://a.example'},
 {name:'Manufacturer part number',value:'ABC'}, {name:'SKU',value:'123',sourceUrl:'https://b.example'},
 {name:'Pack Size',value:'25 g'}, {name:'Pack Size',value:'50 g'}]);
 assert.equal(rows.length,5);assert.equal(rows[1].name,'Manufacturer part number');
 assert.equal(rows[3].value,'25 g');assert.equal(rows[4].value,'50 g');
});

test('product research distinguishes unavailable sources from product mismatches',async t=>{
 const urls=['https://retailer.example/product/unavailable','https://retailer.example/product/different'];
 t.mock.method(globalThis,'fetch',async u=>String(u)===urls[0]?new Response('unavailable',{status:403}):String(u)===urls[1]?new Response('<title>Unrelated product</title>'):new Response('<rss/>'));
 const d=await(await worker.fetch(new Request('https://findit.test/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification:{name:'Example Relief Cream 25g'},offers:urls.map(product_url=>({product_url,sourcePageVerified:true,exactProductMatch:true}))})}),{})).json();
 assert.equal(d.researched,false);assert.ok(d.sourceChecks.some(s=>s.url===urls[0]&&s.status==='http-error'&&s.httpStatus===403));
 assert.ok(d.sourceChecks.some(s=>s.url===urls[1]&&s.status==='identity-mismatch'));
 assert.equal(d.sources.length,0);assert.equal(d.specifications.length,0);
});

test('product purpose prefers a sourced function over an earlier material or fit fragment',async t=>{
 const name='Acme X1 headphones',url='https://shop.example/products/acme-x1';
 const description='Soft fit leather earcups. Industry-leading noise cancellation. Up to 30 hours of playback time. Multipoint connection.';
 t.mock.method(globalThis,'fetch',async u=>String(u)===url?new Response('<title>'+name+'</title><script type="application/ld+json">'+JSON.stringify({'@type':'Product',name,description})+'</script>'):new Response('<rss/>'));
 const d=await(await worker.fetch(new Request('https://findit.test/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification:{name},offers:[{product_url:url,sourcePageVerified:true,exactProductMatch:true}]})}),{})).json();
 assert.equal(d.whatItDoes,'Industry-leading noise cancellation.');
 assert.ok(d.pros.includes('Soft fit leather earcups.'));
 assert.ok(d.sources.some(s=>s.url===url));
});

import {productPagePriceConditions} from '../lib/product-description-specs.js';
const memberPrice='<div class="price-box"><span class="plusmore-price regular"><span class="price">R 9,499</span>Normal Price</span><div class="price-plus-container"><span class="plusmore-price special"><span data-price-type="finalPrice">R 5,999</span><div class="plusmore-text"><span>more</span></div><div>Sale ends Friday, 30 October 2026</div></span></div></div>';
test('product-specific member-price badge is retained as a price condition',()=>{
 const conditions=productPagePriceConditions('<div class="product-info-main"><h1>Acme headphones</h1>'+memberPrice+'</div>');
 assert.match(conditions,/\+more price/);assert.match(conditions,/eligibility/);assert.match(conditions,/Sale ends Friday, 30 October 2026/);
});
test('member-price badges in recommendations, headers or script templates do not qualify this product',()=>{
 for(const raw of ['<header>'+memberPrice+'</header><div class="product-info-main"><div class="price-box">R 123</div></div>', '<div class="product-info-main"><div class="price-box">R 123</div></div><aside>'+memberPrice+'</aside>', '<div class="product-info-main"><script type="text/template">'+memberPrice+'</script><div class="price-box">R 123</div></div>'])assert.equal(productPagePriceConditions(raw),'');
});
test('verified offers preserve the member-price qualification through the existing price-condition field',async t=>{
 const name='Acme X1 headphones',url='https://shop.example/products/acme-x1';
 const raw='<title>'+name+'</title><script type="application/ld+json">'+JSON.stringify({'@type':'Product',name,offers:{price:5999,priceCurrency:'ZAR'}})+'</script><div class="product-info-main">'+memberPrice+'</div>';
 t.mock.method(globalThis,'fetch',async()=>new Response(raw,{headers:{'content-type':'text/html'}}));
 const {ident,verify}=await import('../lib/product-intelligence-core.js');const offer=await verify(url,ident({name}));
 assert.equal(offer.price,5999);assert.equal(offer.currency,'ZAR');assert.match(offer.priceConditions,/\+more price/);
});

test('retailer layout with the primary price outside its metadata-only main block retains the badge',()=>{assert.match(productPagePriceConditions('<div class="product-info-right-row-shop">'+memberPrice+'</div><div class="product-info-main"><div>Product metadata</div></div>'),/\+more price/);});
test('the same primary member price is recognised when the retailer uses a textual +more label',()=>{const alternate=memberPrice.replace('<div class="plusmore-text"><span>more</span></div>','<span class="plusmore-label">with +more</span>');assert.match(productPagePriceConditions('<div class="product-info-right-row-shop">'+alternate+'</div>'),/\+more price/);assert.equal(productPagePriceConditions('<div class="product-info-main"><div class="price-box">R 123</div></div><aside>'+alternate+'</aside>'),'');});
