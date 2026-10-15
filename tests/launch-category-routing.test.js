import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../lib/product-intelligence-core.js';
import {nativeRetailerUrls} from '../lib/native-retailer-discovery.js';

test('retailer suggestions follow the product category and never claim unverified stock',async()=>{
 for(const [name,expected,excluded]of [['Shure MV7 microphone','Marshall Music','Incredible Connection'],['LEGO Classic 10696','Toys R Us','PriceCheck'],['Levis 501 Original Jeans','Levi’s South Africa','Makro'],['Generic cotton shirt','Bash','Levi’s South Africa'],['IKEA BILLY bookcase','Mr Price Home','PriceCheck'],['Coca-Cola Original Taste 2L','Checkers','PriceCheck']]){
  let data;await handler({method:'POST',body:{identification:{name,searchQuery:name,requiresModelConfirmation:true}}},{setHeader(){},status(){return this},json(d){data=d;return this}});
  const names=data.retailerStatus.map(x=>x.name);assert.ok(names.includes(expected),name+': '+names);assert.ok(!names.includes(excluded));assert.ok(data.retailerStatus.every(x=>x.exactProductMatch===false&&x.stockVerified===false&&x.branchStockVerified===false));
 }
});

test('native discovery actually visits category retailers instead of the general fallback',async t=>{
 let visited=[];t.mock.method(globalThis,'fetch',async u=>{visited.push(String(u));return new Response('<html></html>')});
 for(const [name,host]of [['Levis 501 Original Jeans','www.levi.co.za'],['IKEA BILLY bookcase','www.mrphome.com'],['Coca-Cola Original Taste 2L','www.checkers.co.za']]){
  visited=[];await nativeRetailerUrls({name,searchQuery:name});assert.ok(visited.some(u=>new URL(u).hostname===host),name);assert.ok(!visited.some(u=>new URL(u).hostname==='www.takealot.com'),name);
 }
});
