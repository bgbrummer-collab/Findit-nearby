import {test} from 'node:test';
import assert from 'node:assert/strict';
import {answerFromEvidence} from '../lib/assistant-answer.js';
import worker from '../cloudflare/worker.js';
const offer=(name,price,currency='ZAR')=>({product_name:'Example X1 headphones',retailer:{name},price,currency,availability:'in_stock',sourcePageVerified:true,exactProductMatch:true,product_url:'https://example.com/'+name});
test('assistant answers combined price and location questions instead of hiding prices behind where intent',()=>{
 const r=answerFromEvidence('Where nearby is cheapest and is it in stock?',{identification:{name:'Headphones'},offers:[offer('Expensive',200),offer('Cheap',100)],stores:[{name:'Branch',distanceKm:2,address:'123 Test Road'}]});
 assert.match(r.answer,/Cheap:.*100/);assert.match(r.answer,/Lowest comparable listed ZAR price: Cheap/);assert.match(r.answer,/2.0 km/);assert.match(r.answer,/does not confirm stock at a nearby branch/);assert.equal(r.sources.length,2);
});
test('assistant separates currencies and rejects null, unverified and partial-identity prices',()=>{
 const r=answerFromEvidence('compare prices',{offers:[offer('ZA',100),offer('US',10,'USD'),offer('Null',null),{...offer('Fake',1),sourcePageVerified:false}]});
 assert.match(r.answer,/Different currencies/);assert.doesNotMatch(r.answer,/Null:|Fake:/);
 assert.doesNotMatch(answerFromEvidence('price',{identification:{requiresModelConfirmation:true},offers:[offer('ZA',100)]}).answer,/ZA:/);
});
test('assistant returns researched purpose, specifications and sources, without fabricating cons',()=>{
 const r=answerFromEvidence('what does it do and what are the pros?',{identification:{name:'Conditioner'}},{researched:true,whatItDoes:'Helps detangle hair.',pros:['Contains shea butter.'],cons:[],specifications:[{name:'Size',value:'250 ml'}],sources:[{url:'https://example.com/product'}]});
 assert.match(r.answer,/Helps detangle/);assert.match(r.answer,/Size: 250 ml/);assert.match(r.answer,/does not mean there are none/);assert.match(r.answer,/https:\/\/example.com\/product/);
});
test('live worker assistant obtains exact-product research rather than canned product redirect',async t=>{
 t.mock.method(globalThis,'fetch',async url=>String(url).includes('bing.com')?new Response('<rss/>'):new Response('<title>Test Brand Conditioner 250 ml</title><script type="application/ld+json">'+JSON.stringify({'@type':'Product',name:'Test Brand Conditioner 250 ml',description:'This conditioner helps detangle hair. It contains shea butter.',brand:{name:'Test Brand'}})+'</script>'));
 const r=await worker.fetch(new Request('https://example.com/api/assistant',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:'What does this product do?',context:{identification:{name:'Test Brand Conditioner 250 ml'},offers:[{...offer('Retailer',100),product_name:'Test Brand'}]}})}),{});
 const d=await r.json();assert.equal(r.status,200);assert.match(d.answer,/helps detangle/);assert.equal(d.modelUsed,'findit-sourced-evidence');
});
test('typed conditioner name discovers and researches retailer candidates without parsed brand or search-engine results',async t=>{
 const name='Marc Anthony strictly curls triple blend conditioner';
 const raw='<title>Marc Anthony 3X Moisture Conditioner 250ml</title><script type="application/ld+json">'+JSON.stringify({'@type':'Product',name:'Marc Anthony',brand:'Marc Anthony',description:'Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml',offers:{price:'230',priceCurrency:'ZAR',availability:'https://schema.org/InStock'}})+'</script><div id="information" class="description active"><div class="description_wrap"><p><b>Marketing description:</b><br>Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner helps hydrate and detangle curly hair.</p></div></div>';
 t.mock.method(globalThis,'fetch',async url=>String(url).includes('clicks.co.za/marc-anthony_')?new Response(raw):new Response('<rss/>'));
 const identification={name,searchQuery:name,brand:'',model:'',category:'product'};
 for(const endpoint of ['product-intelligence','product-insights']){
  const d=await(await worker.fetch(new Request('https://findit.test/api/'+endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification})}),{})).json();
  if(endpoint==='product-intelligence'){assert.equal(d.matched,true);assert.equal(d.offers[0].price,230);assert.equal(d.offers[0].currency,'ZAR');}
  else {assert.equal(d.researched,true);assert.match(d.whatItDoes,/hydrate and detangle/);assert.match(d.sources[0].url,/clicks/);}
 }
});
test('partial photos answer practical buying questions without inventing specifications',()=>{
 const cases=[['Build it paint','paint','outdoor concrete stoep, how do I apply it, size and price','primer'],['Nike shoes','shoes','what model and colourway, running and available sizes','style code'],['Twinsaver tissues','tissues','how many tissues and plies, what are they used for','sheet count'],['Shure microphone','microphone','does it connect by USB, what equipment do I need','XLR']];
 for(const [name,object,question,expected] of cases){const r=answerFromEvidence(question,{identification:{name,object,requiresModelConfirmation:true}});assert.match(r.answer,new RegExp(expected));assert.match(r.answer,/not verified specifications/);assert.doesNotMatch(r.answer,/MV7|SM7|120 sheets|5 litres|Dunk Low/);}
 const r=answerFromEvidence('what is it?',{identification:{name:'Twinsaver product',object:'product',identityScope:'brand',requiresModelConfirmation:true}});assert.doesNotMatch(r.answer,/Facial tissues/);
});

test('microphone questions do not accidentally trigger phone-number or location intent',()=>{const r=answerFromEvidence('Does this microphone use USB or XLR and what extra equipment do I need?',{identification:{name:'Shure microphone',object:'microphone',requiresModelConfirmation:true}});assert.match(r.answer,/XLR/);assert.doesNotMatch(r.answer,/nearby branches|Allow location/);});

test('uncertain visual model choices and observed colours are not asserted as an exact SKU or price',()=>{
 const d=answerFromEvidence('What model and colour is this?',{identification:{name:'Nike shoes',requiresModelConfirmation:true,color:'White and Blue',suggestedModels:[{name:'Nike Air Force 1 Low',confirmed:false,source:'visual-model-hypothesis'}]}},{});
 assert.match(d.answer,/Possible models.*not confirmed/);assert.match(d.answer,/Nike Air Force 1 Low/);assert.match(d.answer,/does not establish an exact retailer colourway/);
});

test('compatibility questions answer published connections and explicitly leave unsupported devices unverified',()=>{
 const context={identification:{name:'Example X Headset'}};
 const r=answerFromEvidence('Does it work with Xbox?',context,{researched:true,whatItDoes:'A gaming headset.',compatibility:['Connects to Windows computers using USB.'],sources:[{url:'https://manufacturer.example/headset'}]});
 assert.match(r.answer,/Windows computers using USB/);assert.match(r.answer,/Compatibility with xbox has not been verified/i);assert.ok(r.sources.some(x=>x.url==='https://manufacturer.example/headset'));
 const supported=answerFromEvidence('Is it compatible with Xbox?',context,{researched:true,compatibility:['Not compatible with Xbox consoles.']});assert.match(supported.answer,/Not compatible with Xbox/);assert.doesNotMatch(supported.answer,/has not been verified/);
});

test('assistant answers kit contents from the published package instead of omitting charger evidence',()=>{
 const research={researched:true,whatItDoes:'Cordless impact drill.',includedItems:['2 x battery GBA 18V 2.0Ah.','1 x GAL 18V-20 charger.'],compatibility:['Professional 18V System works with Bosch batteries and chargers of the same voltage.'],sources:[{title:'Bosch GSB 18V-50 + 2 X 2.0Ah Batteries + Charger',url:'https://retailer.example/drill-kit'}]};
 const d=answerFromEvidence('Does this include batteries and a charger, and what batteries work with it?',{identification:{name:'Bosch GSB 18V-50'}},research);assert.match(d.answer,/2 x battery GBA/);assert.match(d.answer,/GAL 18V-20 charger/);assert.match(d.answer,/same voltage/);assert.equal(d.sources.length,1);
 const partial=answerFromEvidence('Does it include batteries?',{identification:{name:'Drill',requiresModelConfirmation:true}},research);assert.doesNotMatch(partial.answer,/GAL 18V-20/);assert.match(partial.answer,/not been confirmed/);
});
test('nearest branches keep zero distance first and do not confuse closest with closing hours',()=>{
 const stores=[{name:'Further',distanceKm:0.7,openingHours:'Mo-Fr 09:00-18:00'},{name:'At selected point',distanceKm:0,openingHours:'Mo-Fr 08:00-20:00'},{name:'Unknown',distanceKm:null},{name:'Invalid',distanceKm:-1}];
 const answer=answerFromEvidence('Which branch is closest?',{stores}).answer;
 assert.ok(answer.indexOf('At selected point')<answer.indexOf('Further'));assert.ok(answer.indexOf('Further')<answer.indexOf('Unknown'));assert.doesNotMatch(answer,/Published hours:|-1\.0 km/);
 assert.match(answerFromEvidence('What are the opening hours?',{stores}).answer,/Published hours: Mo-Fr 08:00-20:00/);
});

test('assistant uses corroborated photo purpose when external sources only have catalogue metadata',()=>{
 const identification={name:'Example Relief Cream 25g',identificationMethod:'independent-printed-label-consensus',visibleText:['Example Relief Cream 25g','Rapid relief from allergic skin reactions, stings and bites'],requiresModelConfirmation:false};
 for(const research of [{},{researched:true,whatItDoes:'',specifications:[{name:'Size',value:'25 g'}],sources:[{url:'https://retailer.example/product'}]}]){
  const answer=answerFromEvidence('What does this product do?',{identification},research).answer;
  assert.match(answer,/photo label states: Rapid relief/);assert.match(answer,/label claim, not independently verified effectiveness/i);
  assert.doesNotMatch(answer,/could not verify published product-specific information|mepyramine|2%/);
 }
});
test('assistant does not promote single-reader, partial or warning text into a photo purpose',()=>{
 for(const identification of [
  {name:'Example Cream',identificationMethod:'google-gemini',visibleText:['Helps treat everything']},
  {name:'Example Cream',identificationMethod:'independent-printed-label-consensus',requiresModelConfirmation:true,visibleText:['Helps treat everything']},
  {name:'Example Cream',identificationMethod:'independent-printed-label-consensus',visibleText:['Do not use for relief of burns']},
 ])assert.doesNotMatch(answerFromEvidence('What does it do?',{identification},{}).answer,/photo label states/i);
});

test('barcode questions distinguish the current identity, retailer evidence and missing evidence',()=>{
 const i={name:'Example Cream',identificationMethod:'independent-printed-label-consensus',visibleText:['Helps protect skin'],requiresModelConfirmation:false};
 assert.match(answerFromEvidence('What is its barcode?',{identification:i},{}).answer,/No barcode has been independently verified/);
 const research={researched:true,specifications:[{name:'Barcode',value:'6009712390007',sourceUrl:'https://retailer.example/product'}],sources:[{url:'https://retailer.example/product'}]};
 const r=answerFromEvidence('What is its barcode?',{identification:i},research);assert.match(r.answer,/Retailer source lists barcode: 6009712390007/);assert.match(r.answer,/not read from your photo/);assert.ok(r.sources.some(s=>s.url==='https://retailer.example/product'));
 const p=answerFromEvidence('barcode',{identification:{...i,requiresModelConfirmation:true}},research);assert.doesNotMatch(p.answer,/6009712390007/);assert.match(p.answer,/No barcode has been independently verified/);
});
