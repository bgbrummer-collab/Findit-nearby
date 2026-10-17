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

test('partial photo identities load nearby category stores without claiming exact stock',async()=>{
 const r=runtime();r.context.window.finditState.coords={lat:-25.8,lon:28.3};r.context.window.finditState.result.identification={name:'NIKE shoes',brand:'NIKE',object:'shoes',requiresModelConfirmation:true};r.context.document.dispatchEvent=()=>{};r.context.CustomEvent=class{constructor(type,options){this.type=type;this.detail=options.detail}};
 const source=readFileSync(new URL('../information-runtime.js',import.meta.url),'utf8').replace('window.finditRunProductSearch=runSearch;','window.finditRunProductSearch=runSearch;window.testNearby=loadPartialNearby;');
 delete r.context.window.__finditInformationRuntime;let requested; r.context.fetch=async(url,options)=>{requested={url,body:JSON.parse(options.body)};return {ok:true,json:async()=>({stores:[{name:'Footwear Store',exactProductMatch:false,branchStockVerified:false}]})}};vm.runInNewContext(source,r.context);await r.context.window.testNearby(r.context.window.finditState.result.identification);assert.equal(requested.url,'/api/nearby');assert.equal(requested.body.identification.requiresModelConfirmation,true);assert.equal(r.context.window.finditState.stores[0].name,'Footwear Store');assert.equal(r.context.window.finditState.stores[0].branchStockVerified,false);
});

test('typing a brand and product type does not confirm an exact model',async()=>{
 const worker=(await import('../cloudflare/worker.js')).default;
 const response=await worker.fetch(new Request('https://findit.test/api/search',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query:'NIKE shoes'})}),{});const d=await response.json();assert.equal(d.identification.requiresModelConfirmation,true);assert.equal(d.identification.object,'shoes');assert.equal(d.identification.retailCategory,'footwear');assert.equal(d.identification.userConfirmed,false);
 const exact=await(await worker.fetch(new Request('https://findit.test/api/search',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query:'Nike Air Force 1 CW2288-111'})}),{})).json();assert.equal(exact.identification.requiresModelConfirmation,undefined);assert.equal(exact.identification.name,'Nike Air Force 1 CW2288-111');
});

test('a new typed family search clears the previous photo, while explicit candidate confirmation retains it',async()=>{
 for(const confirm of [false,true]){
  const r=runtime(),state=r.context.window.finditState;
  state.file={name:'old-product.jpg'};state.result.identification={name:'Old photo',requiresModelConfirmation:true};
  let removed=false;r.elements.set('#preview',{removeAttribute(){removed=true},classList:{add(){}}});
  r.elements.set('#fxProductImage',{innerHTML:'<img src="old-product.jpg">'});
  r.context.navigator={};r.context.CustomEvent=class{};r.context.document.dispatchEvent=()=>{};
  r.context.fetch=async url=>({ok:true,json:async()=>String(url)==='/api/search'?{identification:{name:'Nike shoes',brand:'Nike',object:'shoes',requiresModelConfirmation:true}}:{offers:[],researched:false}});
  await r.context.window.finditRunProductSearch('Nike shoes',confirm?{name:'Nike shoes'}:null);
  assert.equal(removed,!confirm);
  assert.equal(state.file===null,!confirm);
 }
});

test('a delayed product-family nearby lookup cannot overwrite a newly selected location or radius',async()=>{
 for(const change of ['location','radius']){
  const r=runtime(),s=r.context.window.finditState;s.coords={lat:-25.8,lon:28.3};s.radius=10;
  s.result.identification={name:'Nike shoes',requiresModelConfirmation:true};
  const code=readFileSync(new URL('../information-runtime.js',import.meta.url),'utf8').replace('window.finditRunProductSearch=runSearch;','window.finditRunProductSearch=runSearch;window.testNearby=loadPartialNearby;');
  delete r.context.window.__finditInformationRuntime;r.context.document.dispatchEvent=()=>{};r.context.CustomEvent=class{};
  vm.runInNewContext(code,r.context);
  const pending=r.context.window.testNearby(s.result.identification);await new Promise(resolve=>setImmediate(resolve));
  if(change==='location')s.coords={lat:-33.9,lon:18.4};else s.radius=3;
  s.stores=[{name:'Current result'}];await r.finish({stores:[{name:'Obsolete result'}]});await pending;
  assert.equal(s.stores[0].name,'Current result');
 }
});

test('product research prefers drill facts over corporate marketing on the same product page',async t=>{
 const worker=(await import('../cloudflare/worker.js')).default,name='Bosch Professional GSB 18V-50 Cordless Drill';
 t.mock.method(globalThis,'fetch',async u=>String(u).includes('bing.com')?new Response('<rss/>'):new Response('<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name,description:'The professional blue power tools and accessories from Bosch are developed for professionals. Bosch creates new innovations in power tools and accessories by working intensively with professionals. GSB18V-50 Cordless Impact Drill - Robust brushless motor for durability and flexibility. Professional 18V System works with Bosch batteries and chargers of the same voltage.'})+'</script>'));
 const d=await(await worker.fetch(new Request('https://findit.test/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name,offers:[{product_url:'https://retailer.example/drill',sourcePageVerified:true,exactProductMatch:true}]})}),{})).json();
 assert.match(d.whatItDoes,/Cordless Impact Drill/);assert.doesNotMatch(d.whatItDoes,/developed for professionals/);assert.ok(d.pros.every(x=>!/creates new innovations/.test(x)));assert.match(d.compatibility.join(' '),/same voltage/);
});

test('history entries reopen their stored query for fresh product research',()=>{
 let listener,opened;const body={innerHTML:''},modal={style:{},removeAttribute(){},classList:{add(){},remove(){}},setAttribute(){}};
 const context={window:{addEventListener(type,fn){if(type==='click')listener=fn;},finditRunProductSearch:q=>opened=q},document:{querySelector:s=>s==='#fxStableModal'?modal:s==='#fxStableBody'?body:null,querySelectorAll:()=>[]},localStorage:{getItem:k=>k==='finditRecent'?JSON.stringify([{name:'Bosch drill',query:'Bosch GSB 18V-50'}]):null},Intl,console};
 vm.runInNewContext(readFileSync(new URL('../dashboard-audit-controls.js',import.meta.url),'utf8'),context);context.window.finditDashboardAuditAction('history');assert.match(body.innerHTML,/data-history-query="Bosch GSB 18V-50"/);assert.match(body.innerHTML,/Open product/);listener({target:{closest:s=>s.includes('data-open-history')?{dataset:{historyQuery:'Bosch GSB 18V-50'}}:null},preventDefault(){},stopImmediatePropagation(){}});assert.equal(opened,'Bosch GSB 18V-50');
});

test('catalogue identities are labelled as barcode matches rather than AI or user confirmations',async()=>{
 const r=runtime();r.context.navigator={};r.context.CustomEvent=class{};r.context.document.dispatchEvent=()=>{};
 for(const selector of ['#fxExactBadge','#fxConfidence'])r.elements.set(selector,{textContent:''});
 r.context.fetch=async url=>({ok:true,json:async()=>String(url)==='/api/search'?{identification:{name:'Coca-Cola 330 ml',barcode:'5449000000996',confidence:null,userConfirmed:false,catalogueSource:{title:'Open Food Facts'}}}:{offers:[],researched:false}});
 await r.context.window.finditRunProductSearch('5449000000996');assert.equal(r.elements.get('#fxExactBadge').textContent,'Barcode catalogue match');assert.equal(r.elements.get('#fxConfidence').textContent,'Barcode catalogue match');
});

test('product strengths discard popularity slogans and keep published microphone features',async t=>{
 const worker=(await import('../cloudflare/worker.js')).default,name='Example X2 Podcast Microphone';
 const description='Hybrid USB/XLR Dynamic Microphone with Onboard DSP and headphone jack. The next evolution. More and more creators are using our podcast microphones. With quality offerings like this, it is easy to see why. Descended from the iconic podcast mic. Auto Level Mode adjusts microphone gain. The LED panel includes a touch mute control.';
 t.mock.method(globalThis,'fetch',async u=>String(u).includes('bing.com')?new Response('<rss/>'):new Response('<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name,description})+'</script>'));
 const d=await(await worker.fetch(new Request('https://findit.test/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name,offers:[{product_url:'https://retailer.example/microphone',sourcePageVerified:true,exactProductMatch:true}]})}),{})).json();
 assert.ok(d.pros.length);assert.doesNotMatch(d.pros.join(' '),/next evolution|more and more|quality offerings|easy to see why|Descended from/i);assert.match([d.whatItDoes,...d.pros].join(' '),/USB\/XLR/);assert.match(d.pros.join(' '),/Auto Level|touch mute/);
});

test('a toilet-paper photo gets paper buying guidance rather than food instructions',async()=>{
 const {productTypeInformation}=await import('../lib/product-type-information.js');
 const d=productTypeInformation({name:'Twinsaver toilet paper',object:'toilet paper',category:'grocery/household',identityScope:'product-family'});
 assert.match(d.overview,/personal hygiene/);assert.match(d.buyingChecks,/plies|sheets per roll/);assert.doesNotMatch(d.overview+' '+d.buyingChecks,/food|ingredients|allergens|nutrition|recipe/);assert.equal(d.scope,'general-product-type');
 assert.equal(productTypeInformation({name:'Twinsaver product',object:'product',identityScope:'brand'}),null);
});
