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

test('retailer product attributes and price caveats remain scoped and do not turn a link into purpose',async t=>{
 const url='https://retailer.example/example-cream-25g',name='Example Cream 25g';
 const caveat='Price shown excludes the dispensing fee.';
 const raw='<title>'+name+'</title><script type="application/ld+json">'+JSON.stringify({'@type':'Product',name,brand:'Example',description:'Get more information on the regulator website by clicking here',offers:{price:75,priceCurrency:'ZAR'}})+'</script><table id="product-attribute-specs-table"><tr><th>Product Main Barcode</th><td>6009712390007</td></tr><tr><th>Pack Size</th><td>25</td></tr></table><div class="product-nappi-disclaimer"><div>disclaimer:</div><span>'+caveat+'</span></div></div><footer><table><tr><td>Wrong product barcode</td><td>9999999999999</td></tr></table></footer>';
 t.mock.method(globalThis,'fetch',async u=>String(u)===url?new Response(raw):new Response('<rss/>'));
 const d=await(await worker.fetch(new Request('https://findit.test/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification:{name},offers:[{product_url:url,sourcePageVerified:true,exactProductMatch:true}]})}),{})).json();
 assert.equal(d.whatItDoes,'');assert.equal(d.researched,true);assert.ok(d.specifications.some(x=>x.name==='Product Main Barcode'&&x.value==='6009712390007'&&x.sourceUrl===url));assert.ok(d.specifications.some(x=>x.name==='Price conditions'&&x.value===caveat));assert.doesNotMatch(JSON.stringify(d),/Wrong product barcode|9999999999999/);
 const {verify}=await import('../lib/product-intelligence-core.js');const offer=await verify(url,{name,searchQuery:name,brand:'',model:'',object:'cream',category:'beauty',size:'',color:'',barcode:'',visibleText:[],features:[]});assert.equal(offer.price,75);assert.equal(offer.priceConditions,caveat);
 const {answerFromEvidence}=await import('../lib/assistant-answer.js');assert.match(answerFromEvidence('What does it cost?',{identification:{name},offers:[offer]},{}).answer,/excludes the dispensing fee/);
});
