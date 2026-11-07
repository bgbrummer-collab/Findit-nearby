import test from 'node:test';import assert from 'node:assert/strict';
import {ident,productVariantConflict,structuredProduct} from '../lib/product-intelligence-core.js';
const html=(name,description)=>'<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name,description,offers:{price:400,priceCurrency:'ZAR'}})+'</script>';
for(const variant of ['Sterilised','Persian','British Shorthair','Renal','Sensitive','Indoor'])test('generic pet food cannot borrow exact identity from '+variant+' descriptions',()=>{
 const name='Example Kitten dry cat food 2kg',other='Example '+variant+' Kitten dry cat food 2kg',i=ident({name});assert.equal(productVariantConflict(other,i),true);assert.equal(structuredProduct(html(other,name),i),null);
 const selected=ident({name:other});assert.equal(structuredProduct(html(name,other),selected),null);assert.equal(structuredProduct(html(other,other),selected).price,400);
});
