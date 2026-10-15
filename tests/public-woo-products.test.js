import test from 'node:test';import assert from 'node:assert/strict';import {verify,ident} from '../lib/product-intelligence-core.js';import {wooProductData} from '../lib/public-woo-products.js';
const url='https://www.marshallmusic.co.za/product/korg-pitchclip-2-clip-on-tuner/';
const row={name:'KORG Pitchclip 2 Clip-On Tuner',permalink:url,sku:'PC2',short_description:'A compact tuner for guitar.',prices:{price:'34500',currency_code:'ZAR',currency_minor_unit:2,price_range:null},is_in_stock:true,is_password_protected:false};
test('public catalogue price uses published currency and minor units, with online stock only',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify([row])));const offer=await verify(url,ident({name:'Korg Pitchclip 2 clip-on tuner',brand:'Korg',model:'Pitchclip 2'}));assert.equal(offer.price,345);assert.equal(offer.currency,'ZAR');assert.equal(offer.availability,'in_stock');assert.equal(offer.retailerApiVerified,true);assert.equal(offer.branchStockVerified,false);assert.match(offer.evidenceUrl,/wp-json\/wc\/store/);
});
test('different permalinks and protected catalogue entries are not used',async t=>{
 for(const p of [{...row,permalink:'https://unrelated.example/product/tuner'},{...row,is_password_protected:true}]){t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify([p])));assert.equal(await wooProductData(url),null);t.mock.restoreAll();}
});
test('price ranges or absent currency units do not become an invented exact price',async t=>{
 for(const prices of [{...row.prices,price_range:{min_amount:'34500',max_amount:'50000'}},{...row.prices,currency_minor_unit:undefined}]){t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify([{...row,prices}])));const p=await wooProductData(url);assert.equal(p.node.offers.price,undefined);t.mock.restoreAll();}
});
test('a public catalogue cannot substitute an adjacent Plus model',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify([{...row,name:'KORG Pitchclip 2 Plus Clip-On Tuner'}])));assert.equal(await verify(url,ident({name:'Korg Pitchclip 2 clip-on tuner',brand:'Korg',model:'Pitchclip 2'})),null);
});

test('native public catalogue discovery validates publisher and protected records',async t=>{
 const {wooSearchProducts}=await import('../lib/public-woo-products.js');
 t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify([row,{...row,permalink:'https://other.example/product/tuner/'},{...row,is_password_protected:true}])));
 assert.deepEqual(await wooSearchProducts('https://www.marshallmusic.co.za/?s=tuner','Korg Pitchclip 2'),[{title:row.name,url}]);
 assert.deepEqual(await wooSearchProducts('https://unrecognised.example/','tuner'),[]);
});

test('nested official WooCommerce product permalinks are discovered and independently verified',async t=>{
 const {wooSearchProducts}=await import('../lib/public-woo-products.js');
 const nested='https://bothners.co.za/shop/microphones-and-wireless/microphones/dynamic-microphones/shure-mv7-podcast-microphone/';
 const product={...row,name:'Shure MV7 Podcast Microphone',sku:'MV7',permalink:nested,prices:{...row.prices,price:'699900'}};let requested=[];
 t.mock.method(globalThis,'fetch',async u=>{requested.push(String(u));return new Response(JSON.stringify([product]));});
 assert.deepEqual(await wooSearchProducts('https://bothners.co.za/?s=Shure','Shure MV7'),[{title:product.name,url:nested}]);
 const offer=await verify(nested,ident({name:'Shure MV7 Podcast Microphone',brand:'Shure',model:'MV7',object:'microphone'}));
 assert.equal(offer.price,6999);assert.equal(offer.currency,'ZAR');assert.equal(offer.branchStockVerified,false);assert.ok(requested.some(u=>new URL(u).searchParams.get('slug')==='shure-mv7-podcast-microphone'));
 assert.equal(await wooProductData(nested.replace('shure-mv7-podcast','shure-mv7x-podcast')),null);
 assert.equal(await wooProductData('https://bothners.co.za/product-category/microphones/'),null);
});

test('published catalogue names decode HTML entities before display and matching',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify([{...row,name:'KORG Pitchclip 2 &#8211; Clip-On Tuner &amp; Clip'}])));
 const result=await wooProductData(url);assert.equal(result.node.name,'KORG Pitchclip 2 – Clip-On Tuner & Clip');
});
