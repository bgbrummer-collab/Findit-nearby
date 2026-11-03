import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectedVariantInventory} from '../lib/selected-variant-inventory.js';
import {verify,ident} from '../lib/product-intelligence-core.js';
const captured=readFileSync(new URL('./fixtures/selected-variant-backorder.html',import.meta.url),'utf8');
const url='https://petworld.co.za/products/royal-canin-size-health-nutrition-mini-adult-dry-dog-food?variant=40612055580707',sku='3182550716888';
test('selected zero-stock variant allowing continued orders is backordered, not in stock',()=>{
 assert.equal(selectedVariantInventory(captured,url,sku),'backorder');
 assert.equal(selectedVariantInventory(captured.replace('data-inventory-quantity="0"','data-inventory-quantity="5"'),url,sku),undefined);
 assert.equal(selectedVariantInventory(captured.replace('data-variant-available="true"','data-variant-available="false"'),url,sku),'out_of_stock');
 assert.equal(selectedVariantInventory(captured.replace('data-inventory-policy="continue"','data-inventory-policy="deny"'),url,sku),null);
});
test('sibling variants, unrelated SKU, quick-add widgets and missing provenance cannot override stock',()=>{
 for(const [html,u,code] of [[captured,url.replace('40612055580707','40612055547939'),sku],[captured,url,'other'],[captured,url.split('?')[0],sku],[captured.replaceAll('__main','__recommendations'),url,sku],[captured.replaceAll('__main','quickadd'),url,sku],[captured.replace(/<input[^>]+>/,''),url,sku]])assert.equal(selectedVariantInventory(html,u,code),undefined);
});
test('actual page verification downgrades conflicting JSON-LD InStock and retains price',async t=>{
 const group=JSON.parse(readFileSync(new URL('./fixtures/petworld-primary-product-group.json',import.meta.url),'utf8'));
 const raw='<title>Royal Canin Mini Adult Dry Dog Food</title><script type="application/ld+json">'+JSON.stringify(group)+'</script>'+captured;
 t.mock.method(globalThis,'fetch',async()=>new Response(raw,{headers:{'content-type':'text/html'}}));
 const offer=await verify(url,ident({name:'Royal Canin Mini Adult dog food 8kg'}));
 assert.equal(offer.availability,'backorder');assert.equal(offer.price,1160);assert.equal(offer.branchStockVerified,false);
});
