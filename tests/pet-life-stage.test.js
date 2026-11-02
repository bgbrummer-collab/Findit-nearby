import test from 'node:test';
import assert from 'node:assert/strict';
import {ident,productVariantConflict,verify} from '../lib/product-intelligence-core.js';

for(const [wanted,offered] of [['Adult','Puppy'],['Adult','Senior'],['Kitten','Adult'],['Puppy','Adult']])test('pet food rejects a different life stage even when its description mentions the requested stage: '+wanted+'/'+offered,async t=>{
 const name='Example Mini '+offered+' dog food 2kg';
 const i=ident({name:'Example Mini '+wanted+' dog food 2kg'});
 t.mock.method(globalThis,'fetch',async()=>new Response('<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name,description:'Example Mini '+wanted+' dog food 2kg is the next stage after this food.',offers:{price:100,priceCurrency:'ZAR'}})+'</script>',{headers:{'content-type':'text/html'}}));
 assert.equal(productVariantConflict(name,i),true);assert.equal(await verify('https://shop.example/products/pet-food',i),null);
});
test('matching pet life stage and pet accessories retain existing behavior',()=>{
 assert.equal(productVariantConflict('Example Mini Adult dog food 2kg',ident({name:'Example Mini Adult dog food 2kg'})),false);
 assert.equal(productVariantConflict('Example Adult dog collar',ident({name:'Example Adult dog collar'})),false);
});
