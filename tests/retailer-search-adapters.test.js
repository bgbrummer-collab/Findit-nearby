import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeRetailerUrls} from '../lib/native-retailer-discovery.js';
for(const [name,expected,productUrl] of [
 ['Sony WH-1000XM5 black','https://www.incredible.co.za/catalogsearch/result/?q=Sony%20WH-1000XM5%20black','https://www.incredible.co.za/sony-wh-1000xm5-wireless-noise-cancelling-headphones-black'],
 ['Nivea Rich Nourishing Body Lotion 250ml','https://clicks.co.za/search?text=Nivea%20Rich%20Nourishing%20Body%20Lotion%20250ml','https://clicks.co.za/nivea_rich-nourishing-body-lotion-250ml/p/129748']
])test(`retailer adapter discovers ${name} with the retailer's actual search route`,async t=>{
 const requested=[];
 t.mock.method(globalThis,'fetch',async u=>{const url=String(u);requested.push(url);return new Response(url.endsWith(expected)?`${' '.repeat(900000)}${Array.from({length:125},(_,n)=>'<a href="https://www.incredible.co.za/navigation-section-'+n+'">Browse</a>').join('')}<a href="https://www.incredible.co.za/static/Sony-WH-1000XM5-black.css">Styles</a><a href="https://www.incredible.co.za/catalogsearch/result/?q=Sony&amp;type=product">Search</a><a href="${productUrl}">${name}</a>`:'')});
 const urls=await nativeRetailerUrls({name,searchQuery:name});
 assert(urls.includes(productUrl));assert(requested.some(url=>url.endsWith(expected)));
 assert(urls.every(url=>!url.includes('/search?')&&!url.includes('/catalogsearch/')&&!url.includes('/static/')));
});

test('broader retailer discovery preserves exact identity and size for subsequent verification',async t=>{
 const exact='https://clicks.co.za/nivea_rich-nourishing-body-lotion-250ml/p/129748';
 const requested=[];
 t.mock.method(globalThis,'fetch',async u=>{const url=String(u);requested.push(url);return new Response(url.includes('q=Nivea%3Arelevance')?'<a href="'+exact+'">Nivea Rich Nourishing Body Lotion 250ml</a>':'')});
 const urls=await nativeRetailerUrls({name:'Nivea Rich Nourishing Body Lotion 250ml',searchQuery:'Nivea Rich Nourishing Body Lotion 250ml'});
 assert(urls.includes(exact));
 assert(requested.some(u=>u.includes('q=Nivea%3Arelevance')&&u.includes('count=100')));
 const {ident,identityMatches}=await import('../lib/product-intelligence-core.js');
 const i=ident({name:'Nivea Rich Nourishing Body Lotion 250ml'});
 assert(identityMatches('Nivea Rich Nourishing Body Lotion 250ml',i));
 assert(!identityMatches('Nivea Rich Nourishing Body Lotion 400ml',i));
 assert(!identityMatches('Nivea Intensive Moisturising Body Lotion 250ml',i));
});

test('strong exact candidates from later searches outrank partial matches before the verification budget',async t=>{
 const exact='https://clicks.co.za/nivea_rich-nourishing-body-lotion-250ml/p/129748';
 t.mock.method(globalThis,'fetch',async u=>new Response(String(u).includes('q=Nivea%3Arelevance')?'<a href="'+exact+'">Nivea Rich Nourishing Body Lotion 250ml</a>':String(u).includes('clicks.co.za/search?text=')?Array.from({length:20},(_,n)=>'<a href="https://clicks.co.za/other-body-lotion-250ml-'+n+'/p/'+n+'">Body Lotion 250ml</a>').join(''):''));
 const urls=await nativeRetailerUrls({name:'Nivea Rich Nourishing Body Lotion 250ml'});
 assert.equal(urls[0],exact);
});

for(const [name,route] of [
 ['Nivea Rich Nourishing Body Lotion 250ml','https://www.dischem.co.za/catalogsearch/result/?q='],
 ['Bosch GSB 185 LI drill','https://www.buco.co.za/catalogsearch/result/?q='],
 ['LEGO Classic 10698','https://www.toysrus.co.za/catalogsearch/result/?q='],
 ['Sony smart speaker','https://www.geewiz.co.za/jolisearch?controller=search&s='],
 ['Sony WH-1000XM5 black','https://www.hificorp.co.za/catalogsearch/result/?q='],
 ['Faber Castell pencil','https://www.pna.co.za/?s='],
 ['Caterpillar cordless drill','https://www.buco.co.za/catalogsearch/result/?q=']
])test('retailer platform and category adapter: '+name,async t=>{
 const requested=[];t.mock.method(globalThis,'fetch',async u=>{requested.push(String(u));return new Response('')});
 await nativeRetailerUrls({name});assert(requested.some(u=>u.startsWith(route)));
 assert(!requested.some(u=>u.includes('absolute-pets')||u.includes('petheaven')));
});
test('apostrophe spelling is equivalent while size and brand remain exact',async()=>{
 const {ident,identityMatches}=await import('../lib/product-intelligence-core.js');
 const i=ident({name:'Kelloggs Corn Flakes 500g'});
 assert(identityMatches("Kellogg’s Corn Flakes 500 g",i));
 assert(!identityMatches("Kellogg’s Corn Flakes 750 g",i));
 assert(!identityMatches('Other Brand Corn Flakes 500g',i));
});
