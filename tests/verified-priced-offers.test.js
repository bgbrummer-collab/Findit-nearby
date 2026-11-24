import test from 'node:test';
import assert from 'node:assert/strict';
import {verifiedPricedOffers} from '../lib/verified-priced-offers.js';

test('only source-verified offers with a positive numeric price reach Compare Prices',()=>{
 const rows=[
  {retailer:'Verified Shop',price:199.99,verified:true,sourcePageVerified:true},
  {retailer:'Missing price',price:null,verified:false,sourcePageVerified:true},
  {retailer:'Unverified page',price:299,verified:true,sourcePageVerified:false},
  {retailer:'Zero price',price:0,verified:true,sourcePageVerified:true},
  {retailer:'Negative price',price:-1,verified:true,sourcePageVerified:true}
 ];
 assert.deepEqual(verifiedPricedOffers(rows),[rows[0]]);
});

test('empty or malformed offer data returns no priced offers',()=>{
 assert.deepEqual(verifiedPricedOffers(null),[]);
 assert.deepEqual(verifiedPricedOffers([null,{},'not an offer']),[]);
});
