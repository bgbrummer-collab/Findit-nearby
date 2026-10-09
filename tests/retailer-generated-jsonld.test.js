import test from 'node:test';
import assert from 'node:assert/strict';
import {ident,structuredProduct} from '../lib/product-intelligence-core.js';
const i=ident({name:'Nivea Rich Nourishing Body Lotion 250ml'});
const product={ '@context':'http://schema.org/', '@type':'Product',name:'NIVEA Body Lotion Rich Nourishing 250ml',brand:'Nivea',offers:{'@type':'Offer',priceCurrency:'ZAR',price:'59.99',availability:'http://schema.org/InStock'}};
const page=x=>`<script>var el=document.createElement('script');el.type='application/ld+json';el.text=JSON.stringify(${x});document.querySelector('body').appendChild(el);</script>`;
test('retailer generated JSON-LD yields only exact product-scoped price and stock',()=>{
 const found=structuredProduct(page(JSON.stringify(product)),i);
 assert.equal(found.price,59.99);assert.equal(found.currency,'ZAR');assert.equal(found.availability,'in_stock');
 assert.equal(structuredProduct(page(JSON.stringify({...product,name:'Nivea Rich Nourishing Body Lotion 400ml'})),i),null);
});
test('generated JSON-LD parser handles escaped strings without executing expressions',()=>{
 assert.equal(structuredProduct(page(JSON.stringify({...product,description:'Quoted "text" and {braces}'})),i).price,59.99);
 assert.equal(structuredProduct(page('(()=>{throw new Error("must not run")})()'),i),null);
 assert.equal(structuredProduct(page(JSON.stringify(product)+' + unknownValue'),i),null);
 assert.equal(structuredProduct('<script>el.text=JSON.stringify('+JSON.stringify(product)+')</script>',i),null);
});

test('Clicks brand-only JSON-LD name requires exact description and ignores an unevaluated image identifier',()=>{
 const literal=JSON.stringify({...product,name:'Nivea',description:'NIVEA Body Lotion Rich Nourishing 250ml',image:null}).replace('"image":null','"image":imgUrl');
 const found=structuredProduct(page(literal),i);
 assert.equal(found.name,'NIVEA Body Lotion Rich Nourishing 250ml');assert.equal(found.price,59.99);
 assert.equal(structuredProduct(page(literal.replace('Rich Nourishing 250ml','Rich Nourishing 400ml')),i),null);
 assert.equal(structuredProduct(page(literal.replace('"price":"59.99"','"price":priceVariable')),i),null);
});
