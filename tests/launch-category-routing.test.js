import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../lib/product-intelligence-core.js';
import {nativeRetailerUrls} from '../lib/native-retailer-discovery.js';
test('toy windows are not labelled as Windows operating-system compatibility',async t=>{
 const worker=(await import('../cloudflare/worker.js')).default;
 const node={'@type':'Product',name:'LEGO Classic 10696',description:'Windows, eyes, and wheels add to the fun. Includes windows, eyes, 18 tires and wheel rims. LEGO construction toys are compatible with LEGO building sets.'};
 t.mock.method(globalThis,'fetch',async()=>new Response('<title>LEGO Classic 10696</title><script type="application/ld+json">'+JSON.stringify(node)+'</script>'));
 const response=await worker.fetch(new Request('https://findit.example/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification:{name:node.name},offers:[{product_url:'https://retailer.example/product/10696',sourcePageVerified:true,exactProductMatch:true}]})}),{});
 const data=await response.json();assert.equal(data.researched,true);assert.ok(data.compatibility.some(s=>/compatible with LEGO/.test(s)));assert.ok(data.compatibility.every(s=>!/windows, eyes/i.test(s)));
});

test('retailer suggestions follow the product category and never claim unverified stock',async()=>{
 for(const [name,expected,excluded]of [['Shure MV7 microphone','Marshall Music','Incredible Connection'],['LEGO Classic 10696','Toys R Us','PriceCheck'],['Levis 501 Original Jeans','Levi’s South Africa','Makro'],['Generic cotton shirt','Bash','Levi’s South Africa'],['IKEA BILLY bookcase','Mr Price Home','PriceCheck'],['Coca-Cola Original Taste 2L','Checkers','PriceCheck']]){
  let data;await handler({method:'POST',body:{identification:{name,searchQuery:name,requiresModelConfirmation:true}}},{setHeader(){},status(){return this},json(d){data=d;return this}});
  const names=data.retailerStatus.map(x=>x.name);assert.ok(names.includes(expected),name+': '+names);assert.ok(!names.includes(excluded));assert.ok(data.retailerStatus.every(x=>x.exactProductMatch===false&&x.stockVerified===false&&x.branchStockVerified===false));
 }
});

test('native discovery actually visits category retailers instead of the general fallback',async t=>{
 let visited=[];t.mock.method(globalThis,'fetch',async u=>{visited.push(String(u));return new Response('<html></html>')});
 for(const [name,host]of [['Levis 501 Original Jeans','www.levi.co.za'],['IKEA BILLY bookcase','www.mrphome.com'],['Coca-Cola Original Taste 2L','www.checkers.co.za']]){
  visited=[];await nativeRetailerUrls({name,searchQuery:name});assert.ok(visited.some(u=>new URL(u).hostname===host),name);assert.ok(!visited.some(u=>new URL(u).hostname==='www.takealot.com'),name);
 }
});

test('an Original jeans search does not accept adjacent shrink-to-fit, Thermadapt or loose variants',async()=>{
 const {structuredProduct,ident}=await import('../lib/product-intelligence-core.js');
 const identity=ident({name:'Levis 501 Original Jeans',searchQuery:'Levis 501 Original Jeans'});
 const page=name=>'<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name,brand:'Levis',offers:{price:1299,priceCurrency:'ZAR'}})+'</script>';
 assert.ok(structuredProduct(page('Levis 501 Original Jeans Grey'),identity));
 for(const name of ['Levis 501 Original Shrink-to-Fit Jeans Grey','Levis 501 Original Thermadapt Jeans Blue','Levis 501 Original Thermodapt Jeans Blue','Levis 501 Original Loose Jeans'])assert.equal(structuredProduct(page(name),identity),null,name);
});
