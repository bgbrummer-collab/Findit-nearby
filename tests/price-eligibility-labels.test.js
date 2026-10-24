import test from 'node:test';
import assert from 'node:assert/strict';
import {productPagePriceConditions} from '../lib/product-description-specs.js';
import {ident,verify} from '../lib/product-intelligence-core.js';

const block=(label='plusmore-label',classes='plusmore-price special')=>`<div class="product-info-right-row-shop"><div class="product-info-price"><div class="price-box price-final_price"><span class="plusmore-price regular"><span class="price">R 9,499</span></span><div class="promo-date-plusmore">Sale ends Friday, 30 October 2026</div><span class = "${classes}"><span class="price">R 5,999</span><span class="${label}">with +more</span></span></div></div></div>`;

test('primary price eligibility survives publisher label names, class order and whitespace',()=>{
  for(const label of ['plusmore-label','plusmore-text'])for(const classes of ['plusmore-price special','special plusmore-price']){
    const note=productPagePriceConditions(block(label,classes));
    assert.match(note,/\+more price.*eligibility/);
    assert.match(note,/Sale ends Friday, 30 October 2026/);
  }
});
test('eligibility badges in recommendations cannot qualify an unrelated primary price',()=>{
  const primary='<div class="product-info-right-row-shop"><div class="price-box"><span class="price">R5999</span></div></div>';
  const recommendation='<div class="related-products">'+block()+'</div>';
  assert.equal(productPagePriceConditions(primary+recommendation),'');
  assert.equal(productPagePriceConditions('<script>'+block()+'</script>'+primary),'');
});
test('actual verification keeps the membership condition with the exact online offer',async t=>{
  const name='Sony WH-1000XM5 Wireless Noise Cancelling Headphones Black';
  const html=block()+'<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name,offers:{price:5999,priceCurrency:'ZAR'}})+'</script>';
  t.mock.method(globalThis,'fetch',async()=>new Response(html,{headers:{'content-type':'text/html'}}));
  const offer=await verify('https://www.hificorp.co.za/sony-wh-1000xm5-wireless-noise-cancelling-headphones-black',ident({name,searchQuery:name}));
  assert.equal(offer?.price,5999);assert.match(offer?.priceConditions,/\+more price/);assert.equal(offer?.branchStockVerified,false);
});
