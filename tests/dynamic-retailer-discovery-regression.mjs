import assert from 'node:assert/strict';
import {__dynamicRetailerTest} from '../lib/retailer-coverage.js';

const {safeDynamicProfile,dynamicPageOffer,directProductUrl}=__dynamicRetailerTest;
const body={brand:'Acme',model:'Runner X100',name:'Acme Runner X100',searchQuery:'Acme Runner X100',object:'sneaker',category:'footwear',retailCategory:'footwear'};

const p=safeDynamicProfile('https://newshop.example.co.za/products/acme-runner-x100');
assert.ok(p,'unknown legitimate-looking retailer domain should be discoverable');
assert.equal(p.dynamic,true);
assert.equal(p.branchMode,'unknown');
assert.equal(directProductUrl('https://newshop.example.co.za/products/acme-runner-x100',p.domain),true);
assert.equal(safeDynamicProfile('http://127.0.0.1/products/acme-runner-x100'),null,'private/local targets must be rejected');
assert.equal(safeDynamicProfile('https://example.co.za/search?q=acme'),null,'search pages must be rejected');
assert.equal(safeDynamicProfile('https://news24.com/shop/acme-runner-x100'),null,'content/news domains must not become retailers');

const good=`Title: Acme Runner X100 Sneaker\nR 1 999.00\nAdd to cart\nIn stock\nProduct code AX100`;
const offer=dynamicPageOffer(good,'https://newshop.example.co.za/products/acme-runner-x100',body,p);
assert.ok(offer,'exact direct retailer page with usable commerce data should be accepted');
assert.equal(offer.price,1999);
assert.equal(offer.availability,'in_stock');
assert.equal(offer.sourcePageVerified,true);
assert.equal(offer.branchStockVerified,false,'online stock must never become branch stock');
assert.equal(offer.branchPriceVerified,false,'online price must never become branch price');
assert.equal(offer.stockScope,'online');
assert.equal(offer.priceScope,'online');

const wrong=`Title: Acme Runner X200 Sneaker\nR 1 899.00\nAdd to cart\nIn stock\nProduct code AX200`;
assert.equal(dynamicPageOffer(wrong,'https://newshop.example.co.za/products/acme-runner-x200',body,p),null,'wrong model must not be accepted');

console.log('DYNAMIC_RETAILER_DISCOVERY_REGRESSION_PASS');
