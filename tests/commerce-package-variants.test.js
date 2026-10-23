import test from 'node:test';
import assert from 'node:assert/strict';
import {ident,verify} from '../lib/product-intelligence-core.js';
const url='https://tools.example.co.za/products/cordless-drill-x50';
function fixture(t,name){t.mock.method(globalThis,'fetch',async()=>new Response('<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name,offers:{'@type':'Offer',price:4999,priceCurrency:'ZAR',availability:'https://schema.org/InStock'}})+'</script>',{headers:{'content-type':'text/html'}}));}
test('a drill and added batteries plus charger cannot become an exact bare model price',async t=>{fixture(t,'Acme Cordless Drill X50 + 2 x 2Ah Batteries + Charger');assert.equal(await verify(url,ident({name:'Acme Cordless Drill X50'})),null);});
test('explicitly requested package retains verified product price',async t=>{const name='Acme Cordless Drill X50 + 2 x 2Ah Batteries + Charger';fixture(t,name);assert.equal((await verify(url,ident({name}))).price,4999);});
test('an ordinary standalone drill remains eligible',async t=>{const name='Acme Cordless Drill X50';fixture(t,name);assert.equal((await verify(url,ident({name}))).price,4999);});
