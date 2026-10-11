import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function runtime(){
 const elements=new Map(),modal={style:{},removeAttribute(){},classList:{contains:()=>false,add(){},remove(){}}};
 modal.querySelector=s=>elements.get(s)||null;const body={innerHTML:''};elements.set('#fxInformationModal',modal);elements.set('#fxInformationBody',body);
 for(const id of ['#fxInfoCompare','#fxInfoRetry','#fxInfoCorrect'])elements.set(id,{});
 let finish;const context={window:{finditState:{result:{identification:{name:'Product A'}}}},document:{querySelector:s=>elements.get(s)||null,querySelectorAll:()=>[],addEventListener(){},createElement:()=>({}),head:{appendChild(){} }},fetch:()=>new Promise(r=>finish=r),AbortController,setTimeout,clearTimeout,Intl,console};
 context.window.addEventListener=()=>{};
 let source=readFileSync(new URL('../information-runtime.js',import.meta.url),'utf8').replace('window.finditRunProductSearch=runSearch;','window.finditRunProductSearch=runSearch;window.testInfo=showProductInfo;');
 vm.runInNewContext(source,context);
 return {context,body,elements,finish:async(data)=>{finish({ok:true,json:async()=>data});await new Promise(r=>setImmediate(r));}};
}
test('delayed product research never reopens a closed Product Info panel',async()=>{const r=runtime();r.context.window.testInfo();const original=r.body.innerHTML;await r.finish({researched:true,whatItDoes:'A verified description'});assert.equal(r.body.innerHTML,original);r.context.window.testInfo();assert.match(r.body.innerHTML,/A verified description/)});
test('research for an old product cannot overwrite the next product',async()=>{const r=runtime();r.context.window.testInfo();r.context.window.finditState.result.identification={name:'Product B'};await r.finish({researched:true,whatItDoes:'Old product description'});r.context.window.testInfo();assert.doesNotMatch(r.body.innerHTML,/Old product description/);assert.match(r.body.innerHTML,/Product B/);await r.finish({researched:false})});
test('a failed research request settles the retry control',async()=>{const r=runtime();r.elements.set('#fxInformationModal.open #fxInfoRetry',r.elements.get('#fxInfoRetry'));r.context.window.testInfo();await r.finish({researched:false});assert.equal(r.elements.get('#fxInfoRetry').disabled,false);assert.equal(r.elements.get('#fxInfoRetry').textContent,'Refresh product information')});
test('saved items merge storage sources and flatten collection products',()=>{
 const values={finditSaved:[{name:'Soap',query:'Soap'}],findit_v10_collections:[{name:'Collection title',items:[{name:'Shampoo'}]}],findit_favourites:[{item:'Comb'}]};const body={innerHTML:''},modal={style:{},removeAttribute(){},classList:{add(){},remove(){}},setAttribute(){}};
 const context={window:{addEventListener(){}},document:{querySelector:s=>s==='#fxStableModal'?modal:s==='#fxStableBody'?body:null,querySelectorAll:()=>[]},localStorage:{getItem:k=>JSON.stringify(values[k]||[])},Intl,console};
 vm.runInNewContext(readFileSync(new URL('../dashboard-audit-controls.js',import.meta.url),'utf8'),context);context.window.finditDashboardAuditAction('saved');for(const name of ['Soap','Shampoo','Comb'])assert.match(body.innerHTML,new RegExp(name));assert.doesNotMatch(body.innerHTML,/Collection title/);assert.match(body.innerHTML,/Open product/);
});
test('shopping snapshots reject old offers and uncertain product identities',()=>{
 const oldOffer={retailer:{name:'Old Retailer'},price:230,currency:'ZAR',product_url:'https://example.com/old',exactProductMatch:true,verified:true};
 const context={window:{finditState:{result:{identification:{name:'New product'}},offers:[]},productIntelligence:{offers:[oldOffer]}},document:{readyState:'loading',addEventListener(){}},localStorage:{getItem:()=>null,setItem(){}},setTimeout(){},Intl};
 const source=readFileSync(new URL('../shopping-assistant-ui.js',import.meta.url),'utf8').replace('window.finditShoppingAssistantRefresh=refresh;','window.finditShoppingAssistantRefresh=refresh;window.testSnapshot=snapshot;');vm.runInNewContext(source,context);
 assert.equal(context.window.testSnapshot().offers.length,0);context.window.finditState.offers=[oldOffer];assert.equal(context.window.testSnapshot().offers.length,1);context.window.finditState.result.identification.requiresModelConfirmation=true;assert.equal(context.window.testSnapshot().offers.length,0);
});
test('saved shopping item gains late verified offers without losing its saved date',()=>{
 const data=new Map();const context={window:{finditState:{result:{identification:{name:'Soap'}},offers:[]}},document:{readyState:'loading',addEventListener(){},querySelector:s=>s==='#fxShoppingAssistantStyles'?{}:null},localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},setTimeout(){},Intl};
 const source=readFileSync(new URL('../shopping-assistant-ui.js',import.meta.url),'utf8').replace('window.finditShoppingAssistantRefresh=refresh;','window.finditShoppingAssistantRefresh=refresh;window.testSnapshot=snapshot;');vm.runInNewContext(source,context);
 const item=context.window.testSnapshot();item.addedAt=100;data.set('findit.shoppingList.v2',JSON.stringify([item]));context.window.finditState.offers=[{retailer:{name:'Clicks'},price:230,currency:'ZAR',product_url:'https://example.com/soap',exactProductMatch:true,verified:true}];context.window.finditShoppingAssistantRefresh();const list=JSON.parse(data.get('findit.shoppingList.v2'));assert.equal(list[0].offers[0].price,230);assert.equal(list[0].addedAt,100);assert.equal(list.length,1);
});

test('abbreviated retailer title uses its own Product description without changing variants',async()=>{
 const {structuredProduct,ident}=await import('../lib/product-intelligence-core.js');
 const product={ '@type':'Product',name:'Marc Anthony 3x Moist Conditioner 250ml',description:'Strictly Curls 3X Moisture Triple Blend Conditioner',offers:{price:'229.99',priceCurrency:'ZAR',availability:'https://schema.org/InStock'}};
 const raw=p=>'<script type="application/ld+json">'+JSON.stringify(p)+'</script>';
 const requested=ident({name:'Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml',brand:'Marc Anthony',size:'250ml'});
 assert.equal(structuredProduct(raw(product),requested)?.price,229.99);
 assert.equal(structuredProduct(raw({...product,name:product.name.replace('250ml','500ml')}),requested),null);
 assert.equal(structuredProduct(raw({...product,name:product.name.replace('Conditioner','Shampoo')}),requested),null);
 assert.equal(structuredProduct(raw({...product,description:'Another conditioner'}),requested),null);
 assert.equal(structuredProduct(raw(product),{...requested,model:'Something Else'}),null);
});

test('product information extracts item-specific structured specifications across categories',async t=>{
 const worker=(await import('../cloudflare/worker.js')).default;
 for(const p of [{name:'Example Audio Microphone M8',brand:'Example Audio',description:'Designed to capture vocals. Requires an audio interface.',additionalProperty:[{name:'Connector',value:'XLR'}]},{name:'Example Comfort Tissues 120',brand:'Example',description:'Provides disposable facial tissues.',material:'Paper',additionalProperty:[{name:'Ply',value:3}]},{name:'Example Court Shoes',brand:'Example',description:'Designed for everyday footwear.',material:'Leather',size:'UK 8'}]){
  t.mock.method(globalThis,'fetch',async url=>String(url).includes('bing.com')?new Response('<rss/>'):new Response('<title>'+p.name+'</title><script type="application/ld+json">'+JSON.stringify({'@type':'Product',...p})+'</script>'));
  const r=await worker.fetch(new Request('https://findit.test/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification:{name:p.name,brand:p.brand},offers:[{product_url:'https://retailer.example/product',sourcePageVerified:true,exactProductMatch:true}]})}),{});
  const d=await r.json();assert.equal(d.researched,true);assert.match(d.whatItDoes,/Designed|Provides/);assert.ok(d.specifications.some(x=>x.name===(p.additionalProperty?.[0].name||'Material')));t.mock.restoreAll();
 }
});
