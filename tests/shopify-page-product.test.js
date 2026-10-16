import test from 'node:test';
import assert from 'node:assert/strict';
import {shopifyPageProduct} from '../lib/shopify-page-product.js';
import {structuredProduct,ident} from '../lib/product-intelligence-core.js';
const product={id:123,title:'10696 | LEGO Classic Medium Creative Brick Box',handle:'lego-classic-medium-creative-brick-box-10696',description:'484 pieces. For ages 4 and up.',variants:[{id:456,title:'Default Title',name:'10696 | LEGO Classic Medium Creative Brick Box',sku:'5702015357180',price:55900,available:true}]};
const html=p=>`<link rel="canonical" href="https://shop.example/products/${p.handle}"><meta property="og:price:currency" content="ZAR"><script>Shopify.currency = {"active":"ZAR","rate":"1.0"};</script><script type="application/ld+json">${JSON.stringify(p)}</script>`;
test('native Shopify product JSON produces a product-scoped price, availability and research description',()=>{
 const node=shopifyPageProduct(product,html(product));
 assert.equal(node.offers.price,559);assert.equal(node.offers.priceCurrency,'ZAR');assert.match(node.offers.availability,/InStock$/);assert.equal(node.description,product.description);
 const selected=structuredProduct(html(product),ident({name:'LEGO Classic 10696'}));assert.equal(selected.price,559);assert.equal(selected.availability,'in_stock');
 assert.equal(structuredProduct(html(product),ident({name:'LEGO Classic 10698'})),null);
});
test('unscoped recommendations, multiple variants, invalid currency and price are rejected',()=>{
 assert.equal(shopifyPageProduct(product,html(product).replace('/products/lego-classic-medium-creative-brick-box-10696','/collections/lego')),null);
 assert.equal(shopifyPageProduct({...product,variants:[...product.variants,...product.variants]},html(product)),null);
 assert.equal(shopifyPageProduct(product,html(product).replace('"active":"ZAR"','"active":"USD"')),null);
 assert.equal(shopifyPageProduct(product,html(product).replace('og:price:currency','unrelated:currency')),null);
 for(const price of [0,-1,559.5,'55900',null])assert.equal(shopifyPageProduct({...product,variants:[{...product.variants[0],price}]},html(product)),null);
});
test('Shopify SKU is never silently converted into a barcode',()=>{
 assert.equal(structuredProduct(html(product),ident({barcode:'5702015357180'})),null);
 const coded={...product,variants:[{...product.variants[0],barcode:'5702015357180'}]};assert.ok(structuredProduct(html(coded),ident({name:'LEGO Classic 10696',barcode:'5702015357180'})));
});
