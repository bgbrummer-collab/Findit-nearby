import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function plan(items){
  const values=new Map([['findit.shoppingList.v2',JSON.stringify(items)]]);
  const context={window:{finditState:{}},document:{readyState:'loading',addEventListener(){}},localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},setTimeout(){},Intl};
  vm.runInNewContext(readFileSync(new URL('../offer-evidence.js',import.meta.url),'utf8'),context);
  vm.runInNewContext(readFileSync(new URL('../shopping-assistant-ui.js',import.meta.url),'utf8'),context);
  return context.window.finditShoppingPlan();
}
const item=(name,currency,price,extra={})=>({name,offers:[{retailer:'Retailer',url:'https://retailer.example/product',price,currency,...extra}]});
test('shopping plan retains USD rather than assuming rand',()=>{const p=plan([item('Sony','USD',398)]);assert.equal(p.total,398);assert.equal(p.currency,'USD');assert.equal(p.stops.length,1);assert.equal(p.url,'')});
test('mixed or missing currencies cannot be summed into a shopping total',()=>{for(const currency of ['ZAR',null,'R']){const p=plan([item('Sony','USD',398),item('Soap',currency,20)]);assert.equal(p.total,null);assert.equal(p.nonComparable,true);assert.equal(p.url,'')}});
test('saved online offers do not turn matching retailer coordinates into verified trips',()=>{const p=plan([item('Sony','USD',398,{lat:-25.7479,lon:28.2293})]);assert.equal(p.stops[0].coords,null);assert.equal(p.url,'')});
test('branch-specific price and stock can support a physical trip',()=>{const p=plan([item('Sony','ZAR',8000,{lat:-25.7479,lon:28.2293,branchStockVerified:true,branchPriceVerified:true})]);assert.equal(p.stops[0].coords.lat,-25.7479);assert.match(p.url,/google.com\/maps\/dir/)});
test('missing prices are not zero-cost shopping totals',()=>{const p=plan([item('Sony','USD',null)]);assert.equal(p.total,null);assert.equal(p.missing[0],'Sony')});

test('shopping plans retain the item but do not choose an arbitrary colour or eligibility condition',()=>{for(const alternatives of [[{product_name:'Example jeans Grey',price:100},{product_name:'Example jeans Blue',price:90}],[{product_name:'Example headphones',price:100,priceConditions:'Members only'},{product_name:'Example headphones',price:110}]]){const p=plan([{name:'Example item',offers:alternatives.map(o=>({retailer:'Retailer',url:'https://retailer.example/product',currency:'ZAR',...o}))}]);assert.equal(p.total,null);assert.equal(p.missing[0],'Example item');assert.equal(p.chosen.length,0);assert.equal(p.list.length,1);}});
