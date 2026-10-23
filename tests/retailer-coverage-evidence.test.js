import test from 'node:test';
import assert from 'node:assert/strict';
import {__dynamicRetailerTest as api} from '../lib/retailer-coverage.js';
const url='https://newshop.example.co.za/products/acme-runner-x100';
const profile=api.safeDynamicProfile(url);
const body={brand:'Acme',model:'Runner X100',name:'Acme Runner X100 Sneaker',object:'sneaker',searchQuery:'Acme Runner X100 Sneaker'};
const text='Title: Acme Runner X100 Sneaker\nR 10\nIn stock\nAdd to cart';
const product=(name='Acme Runner X100 Sneaker',currency='ZAR')=>({'@type':'Product',name,offers:{'@type':'Offer',price:1999,priceCurrency:currency,availability:'https://schema.org/OutOfStock'}});
async function run(t,node,request=body){t.mock.method(globalThis,'fetch',async()=>new Response('<title>Acme Runner X100 Sneaker</title><script type="application/ld+json">'+JSON.stringify(node)+'</script><aside>R 10 In stock Add to cart</aside>',{headers:{'content-type':'text/html'}}));return api.dynamicPageOffer(text,url,request,profile);}
test('fallback uses product-scoped price and stock rather than recommendation text',async t=>{const offer=await run(t,product());assert.equal(offer.price,1999);assert.equal(offer.availability,'out_of_stock');assert.equal(offer.exactProductMatch,true);assert.equal(offer.sourcePageVerified,true);assert.equal(offer.branchStockVerified,false);});
test('fallback preserves published foreign currency instead of assuming ZAR',async t=>{assert.equal((await run(t,product(undefined,'GBP'))).currency,'GBP');});
test('fallback cannot promote an unconfirmed photo to an exact seller',async t=>{assert.equal(await run(t,product(),{...body,requiresModelConfirmation:true}),null);});
test('fallback cannot use recommendations as the requested product',async t=>{const offer=await run(t,product('Acme Runner X200 Sneaker'));assert.ok(!offer||offer.price===null);assert.ok(!offer||offer.availability===null);});
test('failed retailer requests do not fabricate an offer from rendered snippets',async t=>{t.mock.method(globalThis,'fetch',async()=>{throw Error('offline')});assert.equal(await api.dynamicPageOffer(text,url,body,profile),null);});
test('coverage never ranks incomparable currencies as the cheapest offer',()=>{const offers=[{retailer:{name:'A'},product_url:url,price:10,currency:'GBP'},{retailer:{name:'B'},product_url:url+'/other',price:100,currency:'ZAR'}];assert.equal(api.merge({offers:[],ok:true},offers).bestPrice,null);assert.equal(api.merge({offers:[],ok:true},offers.map(o=>({...o,currency:'ZAR'}))).bestPrice.price,10);});
