import test from 'node:test';
import assert from 'node:assert/strict';
import {descriptionTableSpecifications} from '../lib/product-description-specs.js';
import worker from '../cloudflare/worker.js';
test('product specification tables keep exact units and deduplicate repeated tables',()=>{
 const table='<table><tr><th>Battery voltage</th><td>18V</td></tr><tr><td>Torque</td><td>28/50/50 Nm</td></tr><tr><td>Shipping</td><td>Free</td></tr></table>';
 assert.deepEqual(descriptionTableSpecifications(table+table),[{name:'Battery voltage',value:'18V'},{name:'Torque',value:'28/50/50 Nm'}]);
});
test('Shopify description specifications are scoped to the verified product, excluding footer tables',async t=>{
 const url='https://retailer.example/products/example-d1';
 const raw='<title>Example D1 drill</title><script type="application/ld+json">'+JSON.stringify({'@type':'Product',name:'Example D1 drill',brand:'Example',description:'A drill designed for drilling.'})+'</script><div class="product__description rte"><p>Designed for drilling.</p><table><tr><td>Battery voltage</td><td>18V</td></tr><tr><td>Torque</td><td>50 Nm</td></tr></table></div><footer><table><tr><td>Wrong product rating</td><td>999W</td></tr></table></footer>';
 t.mock.method(globalThis,'fetch',async u=>String(u)===url?new Response(raw):new Response('<rss/>'));
 const d=await(await worker.fetch(new Request('https://findit.test/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification:{name:'Example D1 drill'},offers:[{product_url:url,sourcePageVerified:true,exactProductMatch:true}]})}),{})).json();
 assert.ok(d.specifications.some(x=>x.name==='Battery voltage'&&x.value==='18V'&&x.sourceUrl===url));assert.ok(d.specifications.some(x=>x.name==='Torque'&&x.value==='50 Nm'));assert.doesNotMatch(JSON.stringify(d.specifications),/Wrong product rating|999W/);
});
