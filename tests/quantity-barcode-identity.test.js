import test from 'node:test';
import assert from 'node:assert/strict';
import {ident, identityMatches, structuredProduct, verify} from '../lib/product-intelligence-core.js';
import {normalizeProductQuantities} from '../lib/product-quantities.js';

const product = size => ident({brand:'Acme', model:'Mix 20', name:`Acme Mix 20 ${size}`, object:'cleaner', searchQuery:`Acme Mix 20 ${size}`});
const page = (name, extra={}) => '<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name,...extra,offers:{price:120,priceCurrency:'ZAR',availability:'https://schema.org/InStock'}})+'</script>';

test('fractional volumes and weights never accept the integer suffix as an exact variant', () => {
  for (const [wanted, wrong] of [['1.5L','5L'],['0.5kg','5kg'],['2.5cm','5cm'],['1.25 litres','25 litres'],['0.25 mg','25mg']]) {
    assert.equal(identityMatches(`Acme Mix 20 ${wrong}`,product(wanted)),false,`${wanted} vs ${wrong}`);
    assert.equal(structuredProduct(page(`Acme Mix 20 ${wrong}`),product(wanted)),null);
  }
});

test('metric spelling, spacing and equivalent units preserve exact quantity identity', () => {
  for (const [wanted, equivalent] of [['1.5L','1500 ml'],['0.5kg','500 g'],['2.5cm','25 millimetres'],['250ml','0.25 litres'],['0.25 mg','0.00025 g']]) {
    assert.equal(identityMatches(`Acme Mix 20 ${equivalent}`,product(wanted)),true,`${wanted} vs ${equivalent}`);
    assert.equal(structuredProduct(page(`Acme Mix 20 ${equivalent}`),product(wanted))?.price,120);
  }
  assert.notEqual(normalizeProductQuantities('128GB'),normalizeProductQuantities('1TB'));
  assert.equal(normalizeProductQuantities('1,5L'),normalizeProductQuantities('1500ml'));
  assert.notEqual(normalizeProductQuantities('1,000g'),normalizeProductQuantities('1g'));
  assert.equal(identityMatches('Acme Mix 20 1g',product('1,000g')),false);
  assert.notEqual(normalizeProductQuantities('0.00000001mg'),normalizeProductQuantities('0.00000002mg'));
});

test('equivalent size cannot bypass model, colour, product type or explicit size constraints', () => {
  const i=ident({...product('1.5L'),color:'blue',size:'1.5L'});
  assert.equal(identityMatches('Acme Mix 20 blue 1500ml',i),true);
  for(const text of ['Acme Mix 200 blue 1500ml','Acme Mix 20 red 1500ml','Other Mix 20 blue 1500ml','Acme Mix 20 blue 500ml'])assert.equal(identityMatches(text,i),false);
});

test('the page verifier rejects wrong quantities and retains the published equivalent size', async t => {
  let title='Acme Mix 20 5L';
  t.mock.method(globalThis,'fetch',async()=>new Response(page(title),{headers:{'content-type':'text/html'}}));
  assert.equal(await verify('https://shop.example/products/acme-mix-20',product('1.5L')),null);
  title='Acme Mix 20 1500ml';
  const offer=await verify('https://shop.example/products/acme-mix-20',product('1.5L'));
  assert.equal(offer?.product_name,title);
  assert.equal(offer?.price,120);
  assert.equal(offer?.branchStockVerified,false);
});

test('EAN and zero-padded GTIN14 match only the same valid barcode', () => {
  const i=ident({barcode:'5449000000996',name:'Barcode 5449000000996',searchQuery:'5449000000996'});
  assert.equal(structuredProduct(page('Coca-Cola 330ml',{gtin14:'05449000000996'}),i)?.price,120);
  assert.equal(structuredProduct(page('Coca-Cola 330ml',{gtin13:'5449000000997'}),i),null);
  assert.equal(structuredProduct(page('Coca-Cola 330ml',{gtin13:'5449000000286'}),i),null);
  assert.equal(structuredProduct(page('Coca-Cola 330ml'),i),null);
  assert.equal(structuredProduct(page('Coca-Cola 330ml',{gtin13:'5449000000996'}),ident({...i,barcode:'05449000000996'}))?.price,120);
});
