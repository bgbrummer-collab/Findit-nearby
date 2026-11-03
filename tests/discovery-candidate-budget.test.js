import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../lib/product-intelligence-core.js';
import {dedupe} from '../lib/product-intelligence-core.js';
import {selectDiscoveryCandidates,productCandidateKey} from '../lib/discovery-candidates.js';

test('discovery shares its bounded budget without losing either source or variant identity',()=>{
 const native=Array.from({length:20},(_,n)=>'https://native.example/products/'+n),web=Array.from({length:20},(_,n)=>'https://web.example/products/'+n);
 const chosen=selectDiscoveryCandidates([],web,native);assert.equal(chosen.length,12);assert.equal(chosen.filter(x=>x.includes('native.example')).length,6);assert.equal(chosen.filter(x=>x.includes('web.example')).length,6);
 assert.deepEqual(selectDiscoveryCandidates([],web,[]),web.slice(0,12));assert.deepEqual(selectDiscoveryCandidates([],[],native),native.slice(0,12));
 const a='https://shop.example/products/example?variant=100&_pos=1&_sid=abc&utm_source=test',b='https://shop.example/products/example?_sid=def&variant=100&_pos=4';
 assert.equal(productCandidateKey(a),productCandidateKey(b));assert.notEqual(productCandidateKey(a),productCandidateKey(b.replace('variant=100','variant=200')));
 assert.notEqual(productCandidateKey(a),productCandidateKey(a+'&country=US'));
 assert.deepEqual(selectDiscoveryCandidates([a],[b],[b.replace('variant=100','variant=200')]),[a,b.replace('variant=100','variant=200')]);
});

test('tracking-only duplicate offers collapse while distinct variants and price conflicts remain protected',()=>{
 const base={retailer:{name:'Example'},product_name:'Example E42',price:100,currency:'ZAR',sourcePageVerified:true};
 const a={...base,product_url:'https://shop.example/products/e42?variant=1&_pos=1'},b={...base,product_url:'https://shop.example/products/e42?_sid=other&variant=1'};
 assert.equal(dedupe([a,b]).length,1);assert.equal(dedupe([a,{...b,product_url:b.product_url.replace('variant=1','variant=2')}]).length,2);
 const conflict=dedupe([a,{...b,price:200}]);assert.equal(conflict.length,1);assert.equal(conflict[0].price,null);assert.equal(conflict[0].verified,false);
});

test('a full web-search batch cannot starve an exact native catalogue candidate',async t=>{
 const name='Example E42 headphones',native='https://www.firstshop.co.za/products/example-e42-headphones',seen=[];
 const web=Array.from({length:12},(_,n)=>'https://shop.example/products/wrong-'+n);
 const product=title=>'<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name:title,offers:{price:100,priceCurrency:'ZAR'}})+'</script>';
 t.mock.method(globalThis,'fetch',async u=>{
  const url=String(u);seen.push(url);
  if(url.includes('bing.com/search'))return new Response('<rss>'+web.map(link=>'<item><title>'+name+'</title><link>'+link+'</link></item>').join('')+'</rss>');
  if(url.startsWith('https://www.firstshop.co.za/search/suggest.json'))return Response.json({resources:{results:{products:[{title:name,url:native}]}}});
  return new Response(url===native?product(name):web.includes(url)?product('Other E43 headphones'):'');
 });
 let result;await handler({method:'POST',body:{identification:{name,brand:'Example',model:'E42',object:'headphones'}}},{setHeader(){},status(){return this},json(d){result=d;return this}});
 assert.ok(seen.includes(native));assert.equal(result.offers.length,1);assert.equal(result.offers[0].product_url,native);assert.equal(result.offers[0].price,100);
 assert.ok(result.offers.every(o=>o.exactProductMatch===true&&o.sourcePageVerified===true));
 assert.equal(result.discoveryDiagnostics.candidates.web,12);assert.equal(result.discoveryDiagnostics.candidates.native,1);assert.equal(result.discoveryDiagnostics.candidates.selected,12);assert.equal(result.discoveryDiagnostics.candidates.accepted,1);
 assert.ok(result.discoveryDiagnostics.sourceReads.some(r=>r.host==='www.firstshop.co.za'&&r.status===200&&r.outcome==='read'));
 assert.ok(result.discoveryDiagnostics.sourceReads.every(r=>!('url' in r)&&!('query' in r)&&!('body' in r)));
});
