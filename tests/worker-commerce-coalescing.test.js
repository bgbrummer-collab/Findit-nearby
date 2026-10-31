import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare/worker.js';

const name='Example A42 headset Blue',url='https://retailer.example/products/a42-blue';
const identity={name:'A42 headphones',model:'A42',object:'headphones',category:'electronics',identificationMethod:'independent-vision-consensus'};
const request=body=>new Request('https://findit.test/api/product-intelligence-v2',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
function sources(t){
 let checks=0;
 t.mock.method(globalThis,'fetch',async u=>{
  if(String(u).includes('bing.com'))return new Response('<rss><item><title>'+name+'</title><description>'+name+'</description><link>'+url+'</link></item></rss>');
  if(String(u)!==url)return new Response('');
  checks++;await new Promise(resolve=>setTimeout(resolve,10));return new Response('<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name,offers:{price:750,priceCurrency:'ZAR',availability:'https://schema.org/InStock'}})+'</script>',{headers:{'content-type':'text/html'}});
 });return ()=>checks;
}
test('simultaneous identical read-only commerce requests share verification and receive independent response bodies',async t=>{
 const checks=sources(t),body={identification:{...identity,userConfirmed:true}};
 const responses=await Promise.all([worker.fetch(request(body),{}),worker.fetch(request(body),{})]);
 const [a,b]=await Promise.all(responses.map(r=>r.json()));assert.equal(checks(),1);assert.equal(a.offers[0].price,750);assert.deepEqual(a,b);
 await worker.fetch(request(body),{});assert.equal(checks(),2,'a later request must perform fresh verification');
});
test('photo uncertainty and typed confirmation never share a verification result',async t=>{
 const checks=sources(t);
 const [photo,typed]=await Promise.all([worker.fetch(request({identification:identity}),{}),worker.fetch(request({identification:{...identity,userConfirmed:true}}),{})]);
 const [a,b]=await Promise.all([photo.json(),typed.json()]);assert.equal(checks(),2);assert.equal(a.offers.length,0);assert.equal(a.possibleOffers.length,1);assert.equal(b.offers.length,1);
});
test('distinct selected locations do not coalesce commerce requests',async t=>{
 const checks=sources(t),body={identification:{...identity,userConfirmed:true}};
 await Promise.all([worker.fetch(request({...body,lat:-25,lon:28}),{}),worker.fetch(request({...body,lat:-26,lon:28}),{})]);assert.equal(checks(),2);
});
