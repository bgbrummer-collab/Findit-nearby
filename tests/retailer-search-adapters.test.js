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
