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

test('empty photo research settles the dashboard loading status',async()=>{
 const source=readFileSync(new URL('../information-runtime.js',import.meta.url),'utf8');const start=source.indexOf('async function hydrateIdentifiedPhoto('),end=source.indexOf('\nfunction recoveryNote',start);assert.ok(start>=0&&end>start);
 const states=[];const state={file:{name:'photo.jpg'},radius:10,result:{identification:{name:'Example toilet paper',model:'Twin Ply'}}};
 const context={window:{},st:()=>state,ident:()=>state.result.identification,productName:()=>state.result.identification.name,owned:false,busy:false,commerce:null,research:null,photoGeneration:0,syncIdentity(){},getLocationIfAlreadyAllowed:async()=>null,json:async()=>({offers:[],researched:false}),syncAll(){states.push(context.busy)},saveRecent(){},document:{dispatchEvent(){}},CustomEvent:class{},console};
 vm.runInNewContext(source.slice(start,end)+';this.hydrate=hydrateIdentifiedPhoto;',context);await context.hydrate();assert.equal(context.busy,false);assert.equal(states.at(-1),false);assert.ok(states.includes(true));
});

test('nearby outage messages follow only the selected product, radius and location',()=>{
 const source=readFileSync(new URL('../information-runtime.js',import.meta.url),'utf8'),start=source.indexOf('let nearbyOutcome=null;'),end=source.indexOf('function storeRow',start),state={coords:{lat:-25.78,lon:28.27},radius:10};let name='Conditioner';const c={st:()=>state,productName:()=>name,clean:v=>String(v||'')};vm.runInNewContext(source.slice(start,end)+';this.remember=rememberNearby;this.failure=nearbyFailure;',c);
 c.remember({discoveryAvailable:false,stores:[],message:'Nearby data unavailable'}, {},state.coords,10);assert.equal(c.failure(),'Nearby data unavailable');state.radius=5;assert.equal(c.failure(),'');state.radius=10;name='Shirt';assert.equal(c.failure(),'');name='Conditioner';state.coords.lon=29;assert.equal(c.failure(),'');
});

test('typed product research preserves the advertised fifty Premium history entries',()=>{
 const source=readFileSync(new URL('../information-runtime.js',import.meta.url),'utf8'),line=source.split('\n').find(x=>x.startsWith('function saveRecent('));let saved=Array.from({length:50},(_,n)=>({query:'Old '+n,name:'Old '+n}));const ctx={window:{premiumHistoryLimit:()=>50},localStorage:{getItem:()=>JSON.stringify(saved),setItem:(k,v)=>{saved=JSON.parse(v)}},productName:i=>i.name};vm.runInNewContext(line+';saveRecent({name:"New product",searchQuery:"New product"})',ctx);assert.equal(saved.length,50);assert.equal(saved[0].query,'New product');assert.ok(saved.some(x=>x.query==='Old 48'));
});

test('barcode tool reuses maintained search and replaces the previous photo identity',async()=>{
 const old={name:'Previous photo',barcode:null};let called='';
 const context={window:{finditState:{result:{identification:old}},finditRunProductSearch:async code=>{called=code;context.window.finditState.result.identification={name:'Catalogue match',barcode:code,catalogueSource:{title:'Test catalogue'}};}},document:{readyState:'loading',addEventListener(){},querySelector:()=>null},localStorage:{getItem:()=>null,setItem(){}},setTimeout(){},clearTimeout(){},CustomEvent:class{constructor(name,options){this.type=name;this.detail=options.detail;}},Intl};
 context.document.dispatchEvent=()=>{};vm.runInNewContext(readFileSync(new URL('../shopping-assistant-ui.js',import.meta.url),'utf8'),context);
 await context.window.finditUseBarcode('5449000000996');assert.equal(called,'5449000000996');assert.equal(context.window.finditLastBarcodeProduct.name,'Catalogue match');assert.notEqual(context.window.finditState.result.identification,old);
});

test('brand-only photo evidence cannot claim a recognised product type',()=>{
 const label={textContent:''},description={textContent:''};
 const ctx={window:{finditState:{result:{identification:{name:'Coca-Cola product',brand:'Coca-Cola',object:'product',identityScope:'brand',requiresModelConfirmation:true},message:'Brand recognised; product type unknown.'}}},document:{querySelector:s=>s==='#fxExactBadge'?label:s==='#fxProductDesc'?description:null,querySelectorAll:()=>[],addEventListener(){}},setTimeout(){},console};
 ctx.MutationObserver=class{observe(){}};let source=readFileSync(new URL('../launch-ux-polish.js',import.meta.url),'utf8').replace('function truthfulProductState(){','window.testTruthfulProductState=function truthfulProductState(){');vm.runInNewContext(source,ctx);ctx.window.testTruthfulProductState();assert.equal(label.textContent,'Brand recognised — confirm product');assert.match(description.textContent,/product type unknown/);
});


test('a newly selected photo immediately invalidates pending typed research',async()=>{
 const r=runtime(),listeners={};r.context.document.addEventListener=(name,fn)=>listeners[name]=fn;
 delete r.context.window.__finditInformationRuntime;
 vm.runInNewContext(readFileSync(new URL('../information-runtime.js',import.meta.url),'utf8'),r.context);
 r.elements.set('#fxRealQuery',{value:''});r.elements.set('#fxRealSearch',{});
 r.context.CustomEvent=class{};r.context.document.dispatchEvent=()=>{};
 const pending=r.context.window.finditRunProductSearch('Old product');
 r.context.window.finditState.result=null;r.context.window.finditState.file={name:'new.jpg'};
 listeners['findit:new-photo-selected']();
 await r.finish({identification:{name:'Old product',userConfirmed:true}});await pending;
 assert.equal(r.context.window.finditState.result,null);
 assert.doesNotMatch(r.body.innerHTML,/Old product.*Brand/s);
});
test('partial Product Info does not claim a brand absent from the identity',async()=>{
 const r=runtime();r.context.window.finditState.result.identification={name:'headphones',object:'headphones',requiresModelConfirmation:true};
 r.elements.set('#fxRetryCandidate',{});r.elements.set('#fxConfirmModel',{});
 r.context.window.testInfo();assert.match(r.body.innerHTML,/brand is not confirmed/);assert.doesNotMatch(r.body.innerHTML,/photo identifies the brand/);await r.finish({possibleProducts:[]});
});

test('partial photo history is persisted with its uncertainty and reopens without a typed identification request',async()=>{
 const r=runtime(),values=new Map(),listeners={};r.context.navigator={};r.context.document.addEventListener=(name,fn)=>listeners[name]=fn;
 r.context.localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
 r.context.document.dispatchEvent=()=>{};r.context.CustomEvent=class{};
 r.elements.set('#fxRetryCandidate',{});r.elements.set('#fxConfirmModel',{});
 r.elements.set('#fxResultStripName',{textContent:'No item selected'});r.elements.set('#fxResultStripMeta',{textContent:''});
 r.elements.set('#fxProductImage',{innerHTML:'Old photo'});r.elements.set('#fxRecentSide',{innerHTML:''});
 delete r.context.window.__finditInformationRuntime;
 let source=readFileSync(new URL('../information-runtime.js',import.meta.url),'utf8').replace('window.finditRunProductSearch=runSearch;','window.finditRunProductSearch=runSearch;window.testHydrate=hydrateIdentifiedPhoto;');
 vm.runInNewContext(source,r.context);
 r.context.window.finditState.file={name:'headset.jpg'};r.context.window.finditState.result={identification:{name:'Example headphones',brand:'Example',object:'headphones',requiresModelConfirmation:true,identificationMethod:'independent-vision-consensus'}};
 await r.context.window.testHydrate();await r.finish({possibleProducts:[]});
 const history=JSON.parse(values.get('finditRecent'));assert.equal(history.length,1);assert.equal(history[0].identification.requiresModelConfirmation,true);assert.equal(history[0].identification.userConfirmed,undefined);
 assert.match(r.elements.get('#fxRecentSide').innerHTML,/Example headphones/);
 const requests=[];r.context.fetch=async(url)=>{requests.push(url);return {ok:true,json:async()=>({possibleProducts:[]})}};
 values.delete('finditRecent');r.context.window.finditOpenRecordedProduct(history[0]);await new Promise(resolve=>setImmediate(resolve));
 assert.equal(r.context.window.finditState.result.identification.requiresModelConfirmation,true);assert.equal(r.context.window.finditState.result.identification.userConfirmed,undefined);
 assert.equal(r.context.window.finditState.file,null);assert.ok(!requests.includes('/api/search'));assert.deepEqual(Array.from(r.context.window.finditState.offers),[]);
 assert.doesNotMatch(r.elements.get('#fxProductImage').innerHTML,/Old photo/);
 assert.equal(r.elements.get('#fxResultStripName').textContent,'Example headphones');assert.match(r.elements.get('#fxResultStripMeta').textContent,/Example/);
});

test('saved and collection snapshots retain photo uncertainty independently of history',()=>{
 const source=readFileSync(new URL('../script.js',import.meta.url),'utf8');
 const start=source.indexOf('function v10Current(){'),end=source.indexOf('\n',start),identity={name:'Example headphones',object:'headphones',requiresModelConfirmation:true,suggestedModels:[{name:'Example X1',confirmed:false}]};
 const snap=vm.runInNewContext(source.slice(start,end)+';v10Current()', {state:{result:{identification:identity}},Date});
 assert.equal(snap.identification.requiresModelConfirmation,true);assert.equal(snap.identification.suggestedModels[0].confirmed,false);
 const savedStart=source.indexOf('function getPremiumSaved(){'),savedEnd=source.indexOf('function premiumHistoryLimit()',savedStart);
 const list=vm.runInNewContext(source.slice(savedStart,savedEnd)+';getPremiumSaved()', {localStorage:{getItem:k=>k==='finditSaved'?JSON.stringify([snap]):'[]'}});
 assert.equal(list[0].identification.requiresModelConfirmation,true);assert.equal(list[0].identification.userConfirmed,undefined);
});

test('Premium capture save handler preserves uncertain identity even when only maintained window state exists',()=>{
 const source=readFileSync(new URL('../premium-beta-fix.js',import.meta.url),'utf8'),start=source.indexOf('  function saveCurrent(el)'),end=source.indexOf('  function route(el)',start);let saved;
 const identity={name:'Example headphones',requiresModelConfirmation:true,suggestedLabel:'Example X1 headphones'};
 vm.runInNewContext(source.slice(start,end)+';saveCurrent(el)',{window:{finditState:{result:{identification:identity}}},ensureRuntime(){},localStorage:{getItem:()=>null,setItem:(k,v)=>saved=JSON.parse(v)},el:{textContent:''},setTimeout(){},Date});
 assert.equal(saved[0].identification.requiresModelConfirmation,true);assert.equal(saved[0].identification.suggestedLabel,'Example X1 headphones');assert.equal(saved[0].identification.userConfirmed,undefined);
});

test('older saved entries without original identity evidence cannot silently become confirmed typed products',async()=>{
 const r=runtime();r.context.navigator={};r.context.localStorage={getItem:()=>null,setItem(){}};r.context.document.dispatchEvent=()=>{};r.context.CustomEvent=class{};r.elements.set('#fxRetryCandidate',{});r.elements.set('#fxConfirmModel',{});
 const requests=[];r.context.fetch=async url=>{requests.push(url);return {ok:true,json:async()=>({possibleProducts:[]})}};
 r.context.window.finditOpenRecordedProduct({name:'Example headphones',query:'Example headphones'});await new Promise(resolve=>setImmediate(resolve));
 const i=r.context.window.finditState.result.identification;assert.equal(i.requiresModelConfirmation,true);assert.equal(i.userConfirmed,false);assert.equal(i.identificationMethod,'saved-query-unverified');assert.ok(!requests.includes('/api/search'));assert.match(r.body.innerHTML,/older saved entry has no original identity evidence/);
});

test('refreshing a restored uncertain Find needs no photo and never sends its guess to typed identification',async()=>{
 const r=runtime(),requests=[];r.context.navigator={};r.context.localStorage={getItem:()=>null,setItem(){}};r.context.document.dispatchEvent=()=>{};r.context.CustomEvent=class{};
 r.elements.set('#fxRetryCandidate',{});r.elements.set('#fxConfirmModel',{});
 const identity={name:'Example cream',brand:'Example',object:'cream',size:'25 g',requiresModelConfirmation:true,userConfirmed:false};r.context.window.finditState.result={identification:identity};r.context.window.finditState.file=null;
 r.context.fetch=async(url,opts)=>{requests.push({url,body:JSON.parse(opts.body)});return {ok:true,json:async()=>({possibleProducts:[]})}};
 await r.context.window.finditRefreshCurrentProduct();await new Promise(resolve=>setImmediate(resolve));
 assert.ok(requests.some(x=>x.url==='/api/product-insights'));assert.ok(!requests.some(x=>x.url==='/api/search'));assert.equal(r.context.window.finditState.result.identification,identity);assert.equal(identity.requiresModelConfirmation,true);assert.equal(identity.userConfirmed,false);assert.match(r.body.innerHTML,/not confirmed/);
});
test('refreshing a restored exact Find rechecks commerce and research with the existing identity',async()=>{
 const r=runtime(),requests=[];r.context.navigator={};r.context.localStorage={getItem:()=>null,setItem(){}};r.context.document.dispatchEvent=()=>{};r.context.CustomEvent=class{};
 const identity={name:'Example X1',model:'X1',userConfirmed:true};r.context.window.finditState.result={identification:identity};r.context.window.finditState.file=null;r.context.window.finditState.stores=[];
 r.context.fetch=async(url,opts)=>{requests.push({url,body:JSON.parse(opts.body)});return {ok:true,json:async()=>url.includes('intelligence')?{offers:[]}:{researched:true,whatItDoes:'Verified current description',sources:[]}}};
 await r.context.window.finditRefreshCurrentProduct();assert.ok(requests.some(x=>x.url==='/api/product-intelligence-v2'&&x.body.identification.model==='X1'));assert.ok(requests.some(x=>x.url==='/api/product-insights'));assert.ok(!requests.some(x=>x.url==='/api/search'));assert.equal(r.context.window.finditState.result.identification,identity);assert.match(r.body.innerHTML,/Verified current description/);
});
test('reopening a confirmed history item preserves brand, category and variant instead of reparsing its name',async()=>{
 const r=runtime(),requests=[];r.context.navigator={};r.context.localStorage={getItem:()=>null,setItem(){}};r.context.document.dispatchEvent=()=>{};r.context.CustomEvent=class{};
 const identity={name:'Example Relief Cream 25g',brand:'Example Relief',model:'',object:'topical cream',category:'beauty',retailCategory:'beauty',size:'25 g',userConfirmed:true,requiresModelConfirmation:false,confirmationMethod:'user-confirmed-retailer-candidate'};
 r.context.fetch=async(url,opts)=>{requests.push({url,body:JSON.parse(opts.body)});return {ok:true,json:async()=>url.includes('intelligence')?{offers:[]}:{researched:true,whatItDoes:'Verified current description',sources:[]}}};
 r.context.window.finditOpenRecordedProduct({name:identity.name,query:identity.name,identification:identity});
 for(let n=0;n<5;n++)await new Promise(resolve=>setImmediate(resolve));
 const i=r.context.window.finditState.result.identification;assert.equal(i.brand,'Example Relief');assert.equal(i.category,'beauty');assert.equal(i.size,'25 g');assert.equal(i.userConfirmed,true);assert.equal(i.confirmationMethod,'user-confirmed-retailer-candidate');assert.equal(r.context.window.finditState.result.visualVerification,false);assert.equal(r.context.window.finditState.result.identitySource,'saved-identity');
 assert.ok(requests.some(x=>x.url==='/api/product-intelligence-v2'&&x.body.identification.brand==='Example Relief'&&x.body.identification.retailCategory==='beauty'));assert.ok(requests.some(x=>x.url==='/api/product-insights'));assert.ok(!requests.some(x=>x.url==='/api/search'));assert.match(r.body.innerHTML,/Verified current description/);
});

test('explicit candidate confirmation uses the reviewed listing brand rather than an earlier manufacturer guess',async()=>{
 const r=runtime(),requests=[];r.context.navigator={};r.context.localStorage={getItem:()=>null,setItem(){}};r.context.document.dispatchEvent=()=>{};r.context.CustomEvent=class{};r.context.window.finditState.stores=[];
 const photo={name:'Maker topical cream',brand:'Maker',object:'topical cream',category:'beauty',size:'25 g',requiresModelConfirmation:true,userConfirmed:false};r.context.window.finditState.result={identification:photo};r.context.window.finditState.file=null;
 r.context.fetch=async(url,opts)=>{const body=JSON.parse(opts.body);requests.push({url,body});return {ok:true,json:async()=>url==='/api/search'?{identification:{name:body.query,searchQuery:body.query,userConfirmed:true}}:url.includes('intelligence')?{offers:[]}:{researched:false}}};
 await r.context.window.finditRunProductSearch('Consumer Relief Cream 25g',{name:'Consumer Relief Cream 25g',identity:{name:'Consumer Relief Cream 25g',brand:'Consumer Relief',object:'topical cream',size:'25 g',category:'beauty'},photoMatchConfirmed:false});
 const request=requests.find(x=>x.url==='/api/product-intelligence-v2');assert.equal(request.body.identification.brand,'Consumer Relief');assert.equal(request.body.identification.size,'25 g');assert.equal(request.body.identification.userConfirmed,true);assert.equal(request.body.identification.confirmationMethod,'user-confirmed-retailer-candidate');assert.equal(photo.brand,'Maker');assert.equal(photo.requiresModelConfirmation,true);
});

test('older candidate payload preserves a supported brand only when the reviewed product name contains it',async()=>{
 for(const name of ['Example Maker Cream 25g','Other Cream 25g','Example Maker2 Cream 25g']){
 const r=runtime();r.context.navigator={};r.context.localStorage={getItem:()=>null,setItem(){}};r.context.document.dispatchEvent=()=>{};r.context.CustomEvent=class{};r.context.window.finditState.stores=[];
 r.context.window.finditState.result={identification:{name:'Example Maker cream',brand:'Example Maker',object:'cream',size:'25 g',requiresModelConfirmation:true}};r.context.window.finditState.file={name:'original.jpg'};
 r.context.fetch=async(url,opts)=>({ok:true,json:async()=>url==='/api/search'?{identification:{name,searchQuery:name,userConfirmed:true}}:url.includes('intelligence')?{offers:[]}:{researched:false}});
 await r.context.window.finditRunProductSearch(name,{name});assert.equal(r.context.window.finditState.result.identification.brand,name==='Example Maker Cream 25g'?'Example Maker':'');assert.equal(r.context.window.finditState.file.name,'original.jpg');
 }
});
