import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker from '../cloudflare/worker.js';
import {structuredProduct,ident} from '../lib/product-intelligence-core.js';
import {primaryGroupDescription} from '../lib/product-group-research.js';
const captured=JSON.parse(fs.readFileSync(new URL('./fixtures/petworld-primary-product-group.json',import.meta.url),'utf8'));
const base='https://petworld.co.za/products/royal-canin-size-health-nutrition-mini-adult-dry-dog-food';
async function research(t,group,size='2kg',extra=''){
 const url=base+'?variant='+ (size==='2kg'?'40612055547939':'40612055580707');
 const raw='<title>Royal Canin Size Health Nutrition Mini Adult Dry Dog Food</title><script type="application/ld+json">'+JSON.stringify(group)+'</script>'+extra;
 t.mock.method(globalThis,'fetch',async u=>new Response(String(u)===url?raw:'<rss/>'));
 const name='Royal Canin Mini Adult dog food '+size;
 const response=await worker.fetch(new Request('https://findit.test/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification:{name},offers:[{product_url:url,sourcePageVerified:true,exactProductMatch:true}]})}),{});
 return {data:await response.json(),raw,url,name};
}
test('primary ProductGroup description becomes attributed facts for its matching 2kg variant',async t=>{
 const {data,raw,url,name}=await research(t,captured);
 assert.match(data.whatItDoes,/high energy needs|nutritional diet/i);
 assert.equal(data.claimEvidence.whatItDoes.sourceUrl,url);
 assert.ok(data.claimEvidence.pros.some(claim=>/EPA-DHA/.test(claim.text)&&claim.sourceUrl===url));
 assert.doesNotMatch(data.whatItDoes,/Packaged food and drinks should/);
 assert.equal(structuredProduct(raw,ident({name}),url).price,370);
});
test('2kg parent text cannot supply facts for an 8kg child',async t=>{
 const {data,raw,url,name}=await research(t,captured,'8kg');
 assert.equal(data.whatItDoes,'');assert.deepEqual(data.pros,[]);
 assert.equal(structuredProduct(raw,ident({name}),url).price,1160);
});
test('an explicit child description wins over parent marketing',async t=>{
 const group=structuredClone(captured);group.hasVariant[0].description='Designed for the selected small adult dog food package. Contains named published ingredients.';
 const {data}=await research(t,group);assert.match(data.whatItDoes,/selected small adult/);assert.doesNotMatch(data.whatItDoes,/high energy/);
});
for(const change of ['different-page','missing-parent-url','different-parent-name','recommendation'])test('unscoped parent text is excluded: '+change,async t=>{
 const group=structuredClone(captured);
 if(change==='different-page')group.url='https://petworld.co.za/products/other-food';
 if(change==='missing-parent-url'){delete group.url;delete group['@id'];}
 if(change==='different-parent-name')group.name='Other Brand Puppy Food';
 const payload=change==='recommendation'?{'@type':'ItemList',itemListElement:[group]}:group;
 const {data}=await research(t,payload);assert.equal(data.whatItDoes,'');assert.deepEqual(data.pros,[]);
});
test('common descriptions work for non-food variants without inheriting sibling facts',()=>{
 const url='https://catalogue.example/products/ex42?variant=10';
 const child={'@type':'Product',name:'Example EX42 Jacket Black Medium',url};
 const group={'@type':'ProductGroup',name:'Example EX42 Jacket',url:'https://catalogue.example/products/ex42',description:'Designed for outdoor wear. Contains a washable cotton lining.',hasVariant:[child]};
 assert.equal(primaryGroupDescription(child,[group,child],url),group.description);
 const sibling={...child,name:'Example EX43 Jacket Black Medium'};assert.equal(primaryGroupDescription(sibling,[group,sibling],url),'');
});
test('purchase-unit formatting remains equivalent and conflicting brands stay excluded',()=>{
 const url='https://catalogue.example/products/cleaner?variant=10';
 const child={'@type':'Product',name:'Example Cleaner 1000ml',brand:'Example',url};
 const group={'@type':'ProductGroup',name:'Example Cleaner',brand:'Example',url,description:'Designed for cleaning surfaces. Pack volume: 1 litre.',hasVariant:[child]};
 assert.equal(primaryGroupDescription(child,[group,child],url),group.description);
 assert.equal(primaryGroupDescription({...child,brand:'Other'},[{...group,hasVariant:[]},child],url),'');
 const wrong={...child,brand:'Other'};assert.equal(primaryGroupDescription(wrong,[{...group,hasVariant:[wrong]},wrong],url),'');
});
