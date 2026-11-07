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

test('an unpriced duplicate Product node does not hide a priced node for the same exact product',()=>{const incomplete={...product,offers:{'@type':'Offer',availability:'http://schema.org/InStock',priceSpecification:[{'@type':'UnitPriceSpecification',priceType:'https://schema.org/MSRP',price:79.99,priceCurrency:'ZAR'}]}};const found=structuredProduct(page(JSON.stringify(incomplete))+page(JSON.stringify(product)),i);assert.equal(found.price,59.99);assert.equal(found.currency,'ZAR');assert.equal(found.availability,'in_stock')});
test('conflicting prices or stock in duplicate exact Product nodes stay unverified',()=>{const conflict={...product,offers:{...product.offers,price:'79.99',availability:'http://schema.org/OutOfStock'}};const found=structuredProduct(page(JSON.stringify(product))+page(JSON.stringify(conflict)),i);assert.equal(found.price,null);assert.equal(found.priceConflict,true);assert.equal(found.availability,null)});

test('unselected clothing sizes cannot acquire a price or stock from the first matching variant',async()=>{
 const {structuredProduct,ident}=await import('../lib/product-intelligence-core.js');
 const nodes=['6/7','8/9'].map((size,index)=>({'@type':'Product',name:size+' / Black Classic Denim Jeans',size,color:'Black',sku:'SKU'+index,offers:{'@type':'Offer',price:index?120:100,priceCurrency:'ZAR',availability:'https://schema.org/'+(index?'OutOfStock':'InStock')}}));
 const raw='<script type="application/ld+json">'+JSON.stringify(nodes)+'</script>';
 const unresolved=structuredProduct(raw,ident({name:'Classic Denim Jeans black'}));
 assert.equal(unresolved.comparisonAmbiguous,true);assert.equal(unresolved.price,null);assert.equal(unresolved.availability,null);
 const selected=structuredProduct(raw,ident({name:'Classic Denim Jeans black',size:'8/9'}));
 assert.equal(selected.price,120);assert.equal(selected.availability,'out_of_stock');assert.equal(selected.comparisonAmbiguous,false);
});
