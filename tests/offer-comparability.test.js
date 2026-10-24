import test from 'node:test';import assert from 'node:assert/strict';
import {selectComparablePrice,priceComparisonIssue} from '../lib/offer-comparison.js';
const offer=(name,price,extra={})=>({product_name:name,price,currency:'ZAR',exactProductMatch:true,sourcePageVerified:true,...extra});
test('different colour/wash listings cannot be called the cheapest exact item',()=>{
 const rows=[offer('Example 501 Original Jeans Grey',1299),offer('Example 501 Original Jeans Dark Indigo',1199)];assert.equal(selectComparablePrice(rows),null);assert.equal(priceComparisonIssue(rows),'variants');
});
test('a published member price cannot silently compete with an unconditional price',()=>{
 const rows=[offer('Example X1 headphones',5999,{priceConditions:'+more eligibility applies'}),offer('Example X1 headphones',6499)];assert.equal(selectComparablePrice(rows),null);assert.equal(priceComparisonIssue(rows),'conditions');
});
test('different source variant attributes and ambiguous multi-variant pages prevent ranking',()=>{
 assert.equal(selectComparablePrice([offer('Example shoes',100,{comparisonAttributes:{size:'UK 8'}}),offer('Example shoes',90,{comparisonAttributes:{size:'UK 9'}})]),null);
 assert.equal(selectComparablePrice([offer('Example shoes',100,{comparisonAmbiguous:true})]),null);
});
test('equivalent listing labels and matching conditions retain useful comparisons',()=>{
 const cheap=offer('Example’s X1™ Headphones Grey',100,{priceConditions:'Member terms apply',comparisonAttributes:{color:'gray'}});
 assert.equal(selectComparablePrice([offer('Examples X1 Headphones Grey',200,{priceConditions:'Member terms apply',comparisonAttributes:{color:'grey'}}),cheap]),cheap);
 assert.equal(selectComparablePrice([offer('Example X1 headphones',200)]).price,200);
});
test('multiple nameless offers are not evidence of the same variant',()=>assert.equal(selectComparablePrice([offer('',100),offer('',90)]),null));

import {readFileSync} from 'node:fs';import vm from 'node:vm';
import handler from '../lib/product-intelligence-core.js';
function browserEvidence(){const c={window:{},Intl};vm.runInNewContext(readFileSync(new URL('../offer-evidence.js',import.meta.url),'utf8'),c);return c.window.finditOfferEvidence;}
test('browser and server reject the same variant and eligibility mismatches',()=>{
 const e=browserEvidence();
 for(const rows of [[offer('Example 501 Grey',100),offer('Example 501 Blue',90)],[offer('Example X1',100,{priceConditions:'Members only'}),offer('Example X1',110)],[offer('Example X1',100,{comparisonAttributes:{size:'UK 8'}}),offer('Example X1',90,{comparisonAttributes:{size:'UK 9'}})]])assert.equal(e.cheapest(rows),selectComparablePrice(rows));
});
test('the full commerce response preserves listings while withholding a mixed-variant best price',async t=>{
 const query='Example 501 Original Jeans',names=['Example 501 Original Jeans Grey','Example 501 Original Jeans Blue'],urls=['https://retailer.example/products/grey','https://retailer.example/products/blue'];
 t.mock.method(globalThis,'fetch',async u=>{u=String(u);if(u.includes('bing.com'))return new Response('<rss>'+urls.map((link,n)=>'<item><title>'+names[n]+'</title><description>'+names[n]+' price</description><link>'+link+'</link></item>').join('')+'</rss>');const n=urls.indexOf(u);return new Response(n<0?'':'<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name:names[n],offers:{price:n?90:100,priceCurrency:'ZAR'}})+'</script>',{headers:{'content-type':'text/html'}});});
 let result;await handler({method:'POST',body:{name:query,searchQuery:query}},{setHeader(){},status(){return this},json(d){result=d;return this;}});
 assert.equal(result.offers.length,2);assert.equal(result.bestPrice,null);assert.match(result.priceComparisonNote,/variant|listing/i);
});

test('Ask FindIt lists the variants and conditions without declaring one the cheapest',async()=>{
 const {answerFromEvidence}=await import('../lib/assistant-answer.js');
 const rows=[{...offer('Example jeans Grey',100),retailer:{name:'A'}},{...offer('Example jeans Blue',90),retailer:{name:'B'}}];
 const answer=answerFromEvidence('Where is cheapest?',{identification:{name:'Example jeans'},offers:rows},{}).answer;
 assert.match(answer,/Example jeans Grey/);assert.match(answer,/Example jeans Blue/);assert.doesNotMatch(answer,/Lowest (?:comparable )?listed/);assert.match(answer,/no cheapest exact-item comparison/);
});
test('structured variant attributes survive actual verification and expose multi-variant ambiguity',async t=>{
 const {verify,ident}=await import('../lib/product-intelligence-core.js');
 const nodes=[{size:'UK 8',color:'Grey',sku:'eight'},{size:'UK 9',color:'Grey',sku:'nine'}].map(v=>({'@type':'Product',name:'Example X1 shoes',...v,offers:{price:100,priceCurrency:'ZAR'}}));
 t.mock.method(globalThis,'fetch',async()=>new Response('<script type="application/ld+json">'+JSON.stringify(nodes)+'</script>',{headers:{'content-type':'text/html'}}));
 const result=await verify('https://shop.example/products/x1',ident({name:'Example X1 shoes'}));assert.equal(result.comparisonAmbiguous,true);assert.ok(result.comparisonAttributes.size);assert.equal(selectComparablePrice([result]),null);
});
test('Smart Choice does not make an arbitrary best-overall recommendation across different variants',()=>{
 const rows=[offer('Example jeans Grey',100),offer('Example jeans Blue',90)],source=readFileSync(new URL('../smart-choice-ui.js',import.meta.url),'utf8'),snippet=source.slice(source.indexOf('function matchStore('),source.indexOf('\nfunction confidenceLabel()'));
 const c={window:{finditOfferEvidence:browserEvidence()},state:()=>({stores:[]}),currentOffers:()=>rows,positive:v=>Number(v)>0,num:v=>v==null?null:Number(v),norm:v=>String(v||'').toLowerCase(),knownOpenState:()=>null,openOnly:false};
 const result=vm.runInNewContext(snippet+';scoreChoices()',c);assert.equal(result.best,null);assert.equal(result.cheapest,null);assert.match(result.comparisonNote,/variant/);
});
test('the quick shopping/watch selector cannot bypass a single ambiguous product-page result',()=>{
 const source=readFileSync(new URL('../shopping-assistant-ui.js',import.meta.url),'utf8'),start=source.indexOf('  function bestOffer(){'),end=source.indexOf('\n\n',start),e=browserEvidence();
 const result=vm.runInNewContext(source.slice(start,end)+';bestOffer()',{offers:()=>[offer('Example shoes',100,{comparisonAmbiguous:true})],window:{finditOfferEvidence:e}});assert.equal(result,null);
});
