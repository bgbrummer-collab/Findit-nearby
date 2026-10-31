import test from 'node:test';
import assert from 'node:assert/strict';
import {verify,ident,structuredProduct} from '../lib/product-intelligence-core.js';
const name='Example Classic White Blue Sneaker',url='https://bash.com/example-classic-white-blue/p';
const offer=(sku,availability='InStock',price=1200)=>({'@type':'Offer',sku,price,priceCurrency:'ZAR',availability:'https://schema.org/'+availability});
const node={'@type':'Product',name,url,offers:offer('eight')};
const html=x=>'<title>'+name+'</title><script type="application/ld+json">'+JSON.stringify(x)+'</script>';
test('a product page cannot borrow price or availability from recommendation lists',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response(html({'@type':'ItemList',itemListElement:[{'@type':'ListItem',item:node}]}),{headers:{'content-type':'text/html'}}));
 assert.equal(await verify(url,ident({name})),null);
 assert.equal(structuredProduct(html({'@type':'Product',name:'Unrelated other shoe',isRelatedTo:node}),ident({name})),null);
});
test('primary graph and webpage entities retain product evidence',()=>{
 for(const data of [{'@graph':[node]},{'@type':'WebPage',mainEntity:node}])assert.equal(structuredProduct(html(data),ident({name})).price,1200);
});
test('aggregate variant offers retain one common price without choosing stock or a size',async t=>{
 const variants={...node,sku:'parent',offers:{'@type':'AggregateOffer',lowPrice:1,highPrice:9999,offers:[offer('eight','InStock'),offer('nine','OutOfStock')]}};
 t.mock.method(globalThis,'fetch',async()=>new Response(html(variants),{headers:{'content-type':'text/html'}}));
 const result=await verify(url,ident({name}));assert.equal(result.price,1200);assert.equal(result.currency,'ZAR');assert.equal(result.availability,null);assert.equal(result.comparisonAmbiguous,true);assert.equal(result.sku,'');assert.equal(result.branchStockVerified,false);
 assert.equal(await verify(url,ident({name,size:'UK 9'})),null);
 variants.offers.offers[1].price=1400;
 assert.equal(structuredProduct(html(variants),ident({name})).price,null);
});

test('explicit product and offer URLs must belong to the checked product page',async t=>{
 let record={...node,url:'https://bash.com/another-product/p'};
 t.mock.method(globalThis,'fetch',async()=>new Response(html(record),{headers:{'content-type':'text/html'}}));
 assert.equal(await verify(url,ident({name})),null);
 record={...node,url:url+'#product',offers:{...offer('eight'),url:'https://bash.com/another-product/p'}};
 assert.equal((await verify(url,ident({name})))?.price,null);
 record={...node,url:url+'#product',offers:{...offer('eight'),url:url+'?variant=eight'}};
 assert.equal((await verify(url,ident({name}))).price,1200);
});
test('explicit product variants remain available without recommendation traversal',()=>{
 const group={'@type':'ProductGroup',hasVariant:[{...node,size:'UK 8',offers:offer('eight')},{...node,size:'UK 9',offers:offer('nine','OutOfStock')}]};
 const result=structuredProduct(html(group),ident({name,size:'UK 9'}),url);assert.equal(result.price,1200);assert.equal(result.availability,'out_of_stock');assert.equal(result.comparisonAttributes.size,'UK 9');
});

test('published name entities are decoded without changing requested variants',()=>{
 const encoded={...node,name:"Example Men&apos;s Classic White/Blue Sneaker"};
 const result=structuredProduct(html(encoded),ident({name:"Example Men's Classic White Blue Sneaker"}),url);assert.equal(result.name,"Example Men's Classic White/Blue Sneaker");
 assert.equal(structuredProduct(html(encoded),ident({name:"Example Men's Classic White Red Sneaker"}),url),null);
});

test('aggregate offers without variant codes cannot imply a confirmed shoe size',()=>{
 const product={...node,offers:{'@type':'AggregateOffer',offers:[offer(''),offer('')]}};
 const result=structuredProduct(html(product),ident({name}),url);assert.equal(result.price,1200);assert.equal(result.comparisonAmbiguous,true);assert.equal(result.sku,'');
});

test('one incomplete aggregate variant cannot inherit another variant price or stock',async t=>{
 const incomplete={...node,offers:{'@type':'AggregateOffer',offers:[offer('eight'),{'@type':'Offer',sku:'nine'}]}};
 t.mock.method(globalThis,'fetch',async()=>new Response(html(incomplete)+'<meta property="product:price:amount" content="1200"><meta property="product:price:currency" content="ZAR">',{headers:{'content-type':'text/html'}}));
 const result=await verify(url,ident({name}));assert.equal(result.price,null);assert.equal(result.availability,null);assert.equal(result.comparisonAmbiguous,true);
});
