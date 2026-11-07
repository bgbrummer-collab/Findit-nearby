import test from 'node:test';import assert from 'node:assert/strict';
import {offerMarket,marketRetailers} from '../lib/retailer-markets.js';
import worker from '../cloudflare/worker.js';
for(const country of ['US','GB','AU','CA','DE','FR'])test('international discovery is scoped to '+country,async t=>{
 const seen=[];t.mock.method(globalThis,'fetch',async url=>{seen.push(String(url));return new Response('<rss/>');});
 const response=await worker.fetch(new Request('https://findit.test/api/product-intelligence-v2',{method:'POST',headers:{'content-type':'application/json','cf-ipcountry':'ZA'},body:JSON.stringify({country,identification:{name:'Example EX42 headphones'}})}),{});
 const d=await response.json();assert.equal(d.offers.length,0);assert.ok(d.retailerStatus.length>0);assert.ok(d.retailerStatus.every(r=>r.exactProductMatch===false&&r.status==='candidate_retailer'));
 assert.ok(seen.length>0);assert.ok(seen.every(url=>new URL(url).hostname==='www.bing.com'));
 assert.ok(seen.every(url=>!new URL(url).searchParams.get('q').includes('South Africa')));assert.equal(d.providerSearchUrl,null);
});
test('unknown country does not fall back to South African native catalogues',async t=>{
 const seen=[];t.mock.method(globalThis,'fetch',async url=>{seen.push(String(url));return new Response('<rss/>');});
 const d=await(await worker.fetch(new Request('https://findit.test/api/product-intelligence-v2?country=JP&name=Example%20EX42%20headphones'),{})).json();assert.deepEqual(d.retailerStatus,[]);assert.ok(seen.every(url=>!url.includes('.co.za')));
});
test('foreign offers keep original currency and disclose unverified local delivery',()=>{
 const offer={product_url:'https://www.amazon.com/dp/B000EXAMPLE',price:42,currency:'USD',availability:'in_stock'};
 const d=offerMarket(offer,'ZA');assert.equal(d.internationalOffer,true);assert.equal(d.retailerCountry,'US');assert.equal(d.localAvailabilityVerified,false);assert.equal(d.currency,'USD');assert.match(d.marketNote,/import charges/);
 const same=offerMarket({...offer,product_url:'https://www.makro.co.za/example/p/itm123'},'ZA');assert.equal(same.internationalOffer,false);assert.equal(same.localAvailabilityVerified,false);
 const unknown=offerMarket({...offer,product_url:'https://shop.example/products/ex42'},'ZA');assert.equal(unknown.internationalOffer,null);assert.match(unknown.marketNote,/not verified/);
 assert.ok(marketRetailers('US').some(r=>r.name==='Best Buy'));
});
