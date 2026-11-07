import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare/worker.js';
test('product names and not-only-but praise do not become strengths or drawbacks',async t=>{
 const name='Example M42 headphones',url='https://retailer.example/products/example-m42';
 const description=name+'. Not only is the design stylish, but it is also crafted for ease of use. The 50-hour battery supports wireless listening. A USB-C charger is sold separately.';
 const raw='<title>'+name+'</title><script type="application/ld+json">'+JSON.stringify({'@type':'Product',name,description,offers:{price:100,priceCurrency:'ZAR'}})+'</script>';
 t.mock.method(globalThis,'fetch',async input=>String(input)===url?new Response(raw,{headers:{'content-type':'text/html'}}):new Response(''));
 const response=await worker.fetch(new Request('https://findit.test/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification:{name},offers:[{product_url:url,sourcePageVerified:true,exactProductMatch:true}]})}),{});
 const facts=await response.json();assert.equal(facts.researched,true);
 assert.ok(!facts.pros.some(text=>text===name+'.'));
 assert.ok(!facts.cons.some(text=>/Not only/.test(text)));
 assert.match(JSON.stringify({whatItDoes:facts.whatItDoes,pros:facts.pros}),/50-hour battery/);
 assert.ok(facts.cons.some(text=>/sold separately/.test(text)));
});
