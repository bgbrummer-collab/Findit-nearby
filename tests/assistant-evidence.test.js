import {test} from 'node:test';
import assert from 'node:assert/strict';
import {answerFromEvidence} from '../lib/assistant-answer.js';
import worker from '../cloudflare/worker.js';
const offer=(name,price,currency='ZAR')=>({retailer:{name},price,currency,availability:'in_stock',sourcePageVerified:true,exactProductMatch:true,product_url:'https://example.com/'+name});
test('assistant answers combined price and location questions instead of hiding prices behind where intent',()=>{
 const r=answerFromEvidence('Where nearby is cheapest and is it in stock?',{identification:{name:'Headphones'},offers:[offer('Expensive',200),offer('Cheap',100)],stores:[{name:'Branch',distanceKm:2,address:'123 Test Road'}]});
 assert.match(r.answer,/Cheap:.*100/);assert.match(r.answer,/Lowest listed ZAR price: Cheap/);assert.match(r.answer,/2.0 km/);assert.match(r.answer,/does not confirm stock at a nearby branch/);assert.equal(r.sources.length,2);
});
test('assistant separates currencies and rejects null, unverified and partial-identity prices',()=>{
 const r=answerFromEvidence('compare prices',{offers:[offer('ZA',100),offer('US',10,'USD'),offer('Null',null),{...offer('Fake',1),sourcePageVerified:false}]});
 assert.match(r.answer,/Different currencies/);assert.doesNotMatch(r.answer,/Null:|Fake:/);
 assert.doesNotMatch(answerFromEvidence('price',{identification:{requiresModelConfirmation:true},offers:[offer('ZA',100)]}).answer,/ZA:/);
});
test('assistant returns researched purpose, specifications and sources, without fabricating cons',()=>{
 const r=answerFromEvidence('what does it do and what are the pros?',{identification:{name:'Conditioner'}},{researched:true,whatItDoes:'Helps detangle hair.',pros:['Contains shea butter.'],cons:[],specifications:[{name:'Size',value:'250 ml'}],sources:[{url:'https://example.com/product'}]});
 assert.match(r.answer,/Helps detangle/);assert.match(r.answer,/Size: 250 ml/);assert.match(r.answer,/does not mean there are none/);assert.match(r.answer,/https:\/\/example.com\/product/);
});
test('live worker assistant obtains exact-product research rather than canned product redirect',async t=>{
 t.mock.method(globalThis,'fetch',async url=>String(url).includes('bing.com')?new Response('<rss/>'):new Response('<title>Test Brand Conditioner 250 ml</title><script type="application/ld+json">'+JSON.stringify({'@type':'Product',name:'Test Brand Conditioner 250 ml',description:'This conditioner helps detangle hair. It contains shea butter.',brand:{name:'Test Brand'}})+'</script>'));
 const r=await worker.fetch(new Request('https://example.com/api/assistant',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:'What does this product do?',context:{identification:{name:'Test Brand Conditioner 250 ml'},offers:[{...offer('Retailer',100),product_name:'Test Brand'}]}})}),{});
 const d=await r.json();assert.equal(r.status,200);assert.match(d.answer,/helps detangle/);assert.equal(d.modelUsed,'findit-sourced-evidence');
});
test('typed conditioner name discovers and researches retailer candidates without parsed brand or search-engine results',async t=>{
 const name='Marc Anthony strictly curls triple blend conditioner';
 const raw='<title>Marc Anthony 3X Moisture Conditioner 250ml</title><script type="application/ld+json">'+JSON.stringify({'@type':'Product',name:'Marc Anthony',brand:'Marc Anthony',description:'Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml',offers:{price:'230',priceCurrency:'ZAR',availability:'https://schema.org/InStock'}})+'</script><div id="information" class="description active"><div class="description_wrap"><p><b>Marketing description:</b><br>Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner helps hydrate and detangle curly hair.</p></div></div>';
 t.mock.method(globalThis,'fetch',async url=>String(url).includes('clicks.co.za/marc-anthony_')?new Response(raw):new Response('<rss/>'));
 const identification={name,searchQuery:name,brand:'',model:'',category:'product'};
 for(const endpoint of ['product-intelligence','product-insights']){
  const d=await(await worker.fetch(new Request('https://findit.test/api/'+endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification})}),{})).json();
  if(endpoint==='product-intelligence'){assert.equal(d.matched,true);assert.equal(d.offers[0].price,230);assert.equal(d.offers[0].currency,'ZAR');}
  else {assert.equal(d.researched,true);assert.match(d.whatItDoes,/hydrate and detangle/);assert.match(d.sources[0].url,/clicks/);}
 }
});
