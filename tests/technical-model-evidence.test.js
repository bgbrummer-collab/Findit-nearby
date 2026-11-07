import test from 'node:test';
import assert from 'node:assert/strict';
import {ident,identityMatches,productVariantConflict,structuredProduct} from '../lib/product-intelligence-core.js';
const html=(name,description)=>'<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name,description,offers:{price:1200,priceCurrency:'ZAR'}})+'</script>';
for(const [wanted,other] of [
 ['Logitech G502 HERO mouse','Logitech G502 X wired gaming mouse HERO sensor'],
 ['Example EX42 keyboard','Example EX42 SE keyboard'],
 ['Example EX42 S keyboard','Example EX42 keyboard'],
 ['Example EX42 II printer','Example EX42 III printer']
])test('technical suffix does not borrow exact identity from prose '+other,()=>{
 const i=ident({name:wanted});assert.equal(identityMatches(other,i),false);assert.equal(productVariantConflict(other,i),true);assert.equal(structuredProduct(html(other,wanted),i),null);
});
test('sensor marketing cannot establish the selected model variant',()=>{
 const i=ident({name:'Logitech G502 HERO mouse'});
 assert.equal(structuredProduct(html('Logitech G502 wired gaming mouse','Features a HERO sensor. '+i.name),i),null);
 assert.equal(structuredProduct(html('Logitech G502 HERO wired gaming mouse','25K sensor'),i).price,1200);
});
test('technical codes may be formatted with spaces without losing identity',()=>{
 const i=ident({name:'Sony WH-1000XM5 headphones black'});
 assert.equal(structuredProduct(html('Sony WH 1000 XM5 headphones black',''),i).price,1200);
});

test('a separately published structured brand remains identity evidence',()=>{
 const node={'@type':'Product',name:'EX42 keyboard',brand:{'@type':'Brand',name:'Example'},offers:{price:1200,priceCurrency:'ZAR'}};
 const raw='<script type="application/ld+json">'+JSON.stringify(node)+'</script>';
 assert.equal(structuredProduct(raw,ident({name:'Example EX42 keyboard'})).price,1200);
 assert.equal(structuredProduct(raw,ident({name:'Different EX42 keyboard'})),null);
});
