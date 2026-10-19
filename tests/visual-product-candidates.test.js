import test from 'node:test';
import assert from 'node:assert/strict';
import {candidateLabelMatches,visualProductCandidates} from '../lib/visual-product-candidates.js';
import worker from '../cloudflare/worker.js';
import {answerFromEvidence} from '../lib/assistant-answer.js';
const partial={name:'Marc Anthony conditioner',brand:'Marc Anthony',object:'conditioner',requiresModelConfirmation:true,suggestedLabel:'Marc Anthony strictly curls triple bend conditioner'};
const canonical='Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml';
const raw='<title>Marc Anthony 3X Moisture Conditioner 250ml</title><script type="application/ld+json">'+JSON.stringify({'@type':'Product',name:canonical,brand:'Marc Anthony',description:'Helps hydrate and detangle curly hair. Contains shea butter.',offers:{price:230,priceCurrency:'ZAR',availability:'https://schema.org/InStock'}})+'</script>';
test('a single small OCR letter error can propose a source-backed product, without changing numeric models',()=>{
 assert.equal(candidateLabelMatches(canonical,partial),true);
 for(const name of ['Marc Anthony Strictly Curls Triple Blend Shampoo','Other Brand Strictly Curls Triple Blend Conditioner','Marc Anthony Conditioner','Marc Anthony Strictly Waves Triple Blend Conditioner'])assert.equal(candidateLabelMatches(name,partial),false);
 assert.equal(candidateLabelMatches(canonical,{...partial,size:'500 ml'}),false);
 assert.equal(candidateLabelMatches('Sony WH1000XM4 Black Headphones',{brand:'Sony',object:'headphones',suggestedLabel:'Sony WH1000XM5 Black Headphones'}),false);
});
test('candidate page evidence stays separate from an exact photo identity and is researched without refetching',async t=>{
 let count=0;t.mock.method(globalThis,'fetch',async u=>{if(String(u).includes('clicks.co.za/marc-anthony_')){count++;return new Response(raw);}return new Response('<rss/>');});
 const r=await worker.fetch(new Request('https://findit.test/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification:partial})}),{});const d=await r.json();
 assert.equal(d.researched,false);assert.equal(d.identityScope,'product-family');assert.equal(d.possibleProducts.length,1);const p=d.possibleProducts[0];assert.equal(p.name,canonical);assert.equal(p.photoMatchConfirmed,false);assert.equal(p.price,230);assert.match(p.whatItDoes,/hydrate and detangle/);assert.equal(count,1);
 const answer=answerFromEvidence('What does this product do?',{identification:partial},d).answer;assert.match(answer,/match to the photo is unconfirmed/);assert.match(answer,/hydrate and detangle/);assert.match(answer,/not a confirmed price for the photographed item/);
 const assistant=await worker.fetch(new Request('https://findit.test/api/assistant',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:'Price and stock?',context:{identification:partial}})}),{});assert.match((await assistant.json()).answer,/Possible retailer product/);
});
test('bare brands, incorrect sizes and guessed shape models do not discover candidates',async t=>{
 t.mock.method(globalThis,'fetch',()=>{throw Error('No request expected');});
 assert.deepEqual(await visualProductCandidates({...partial,suggestedLabel:''}),[]);
 assert.deepEqual(await visualProductCandidates({...partial,requiresModelConfirmation:false}),[]);
});
test('published usage, ingredients and warnings stay scoped to verified product tabs',async t=>{
 const tabs='<div id="use"><p><b>Usage instructions:</b><br>Apply after shampooing and rinse.</p><p><b>Warnings:</b><br>For external use only.</p></div><div id="ingredients"><p><b>Ingredients:</b><br>Water, Shea Butter.</p></div><footer><p><b>Usage instructions:</b><br>Wrong footer instructions.</p></footer>';
 t.mock.method(globalThis,'fetch',async u=>String(u).includes('clicks.co.za/marc-anthony_')?new Response(raw+tabs):new Response('<rss/>'));
 const d=await(await worker.fetch(new Request('https://findit.test/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification:partial})}),{})).json();
 const specs=d.possibleProducts[0].specifications;assert.ok(specs.some(x=>x.name==='How to use'&&/rinse/.test(x.value)));assert.ok(specs.some(x=>x.name==='Ingredients'&&/Shea Butter/.test(x.value)));assert.ok(specs.some(x=>x.name==='Warnings'));assert.doesNotMatch(JSON.stringify(d),/Wrong footer/);
});
test('candidate research follows only same-retailer HTTPS redirects',async t=>{
 let crossFetched=false;t.mock.method(globalThis,'fetch',async u=>{if(String(u).includes('www.clicks.co.za/verified'))return new Response(raw);if(String(u).includes('clicks.co.za/marc-anthony_'))return new Response('',{status:301,headers:{location:'https://www.clicks.co.za/verified'}});if(String(u).includes('dischem.co.za'))return new Response('',{status:302,headers:{location:'http://127.0.0.1/private'}});if(String(u).includes('127.0.0.1'))crossFetched=true;return new Response('<rss/>');});
 const d=await visualProductCandidates(partial);assert.equal(d.length,1);assert.equal(crossFetched,false);assert.equal(d[0].photoMatchConfirmed,false);
});

test('known brand and product family can offer an explicitly unconfirmed catalogue choice',async t=>{
 const title='Example Audio M8 Microphone';const product='<title>'+title+'</title><script type="application/ld+json">'+JSON.stringify({'@type':'Product',name:title,brand:'Example Audio',description:'Designed for recording vocals.',offers:{price:900,priceCurrency:'ZAR'}})+'</script>';
 t.mock.method(globalThis,'fetch',async url=>String(url).includes('bing.com')?new Response('<rss/>'):String(url).includes('/product/m8')?new Response(product):new Response('<a href="/product/m8">'+title+'</a>'));
 const r=await visualProductCandidates({name:'Example Audio microphone',brand:'Example Audio',object:'microphone',requiresModelConfirmation:true});
 assert.ok(r.length>0);assert.equal(r[0].name,title);assert.equal(r[0].photoMatchConfirmed,false);assert.equal(r[0].price,900);
});

test('visual model hypotheses can research matching listings without becoming confirmed photo offers',async t=>{
 const name='Nike Air Force 1 Low White Blue Shoes',url='https://retailer.example/product/white-blue-af1';
 const page='<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name,brand:'Nike',description:'Low-top shoes with a padded collar.',offers:{price:1800,priceCurrency:'ZAR',availability:'https://schema.org/InStock'}})+'</script>';
 t.mock.method(globalThis,'fetch',async u=>String(u)===url?new Response(page):String(u).includes('bing.com')?new Response('<rss><item><title>'+name+'</title><link>'+url+'</link></item><item><title>Nike Dunk Low White Blue Shoes</title><link>https://retailer.example/product/dunk</link></item></rss>'):new Response('<rss/>'));
 const result=await visualProductCandidates({name:'Nike shoes',brand:'Nike',object:'shoes',color:'White and Blue',requiresModelConfirmation:true,suggestedModels:[{name:'Nike Air Force 1 Low',confirmed:false,source:'visual-model-hypothesis'}]});
 assert.equal(result.length,1);assert.equal(result[0].name,name);assert.equal(result[0].photoMatchConfirmed,false);assert.equal(result[0].price,1800);assert.equal(result[0].identity.userConfirmed,false);
});

test('short complete model names can propose matches without accepting a bare brand or number',()=>{
 assert.equal(candidateLabelMatches('Nike Air Force 1 Low White Blue Shoes',{brand:'Nike',suggestedLabel:'Nike Air Force 1',object:'shoes'}),true);
 assert.equal(candidateLabelMatches('Nike Dunk Low White Blue Shoes',{brand:'Nike',suggestedLabel:'Nike Dunk Low',object:'shoes'}),true);
 assert.equal(candidateLabelMatches('Shure MV7 Microphone',{brand:'Shure',suggestedLabel:'Shure MV7',object:'microphone'}),true);
 for(const suggestedLabel of ['Nike','Nike 1','Nike Shoes'])assert.equal(candidateLabelMatches('Nike Air Force 1 Shoes',{brand:'Nike',suggestedLabel,object:'shoes'}),false);
 assert.equal(candidateLabelMatches('Shure MV7X Microphone',{brand:'Shure',suggestedLabel:'Shure MV7',object:'microphone'}),false);
});

test('a second model hypothesis is researched when the first has no retailer result',async t=>{
 const name='Nike Dunk Low White Blue Shoes',url='https://retailer.example/product/dunk';let queries=[];
 const page='<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name,brand:'Nike',offers:{price:1700,priceCurrency:'ZAR'}})+'</script>';
 t.mock.method(globalThis,'fetch',async input=>{const u=String(input);if(u===url)return new Response(page);if(u.includes('bing.com')){const q=new URL(u).searchParams.get('q');queries.push(q);return new Response(q.includes('Dunk Low')?'<rss><item><title>'+name+'</title><link>'+url+'</link></item></rss>':'<rss/>');}return new Response('<rss/>');});
 const result=await visualProductCandidates({name:'Nike shoes',brand:'Nike',object:'shoes',color:'White and Blue',requiresModelConfirmation:true,suggestedModels:['Nike Air Force 1','Nike Dunk Low'].map(name=>({name,confirmed:false,source:'visual-model-hypothesis'}))});
 assert.equal(result.length,1);assert.equal(result[0].name,name);assert.equal(result[0].photoMatchConfirmed,false);assert.equal(queries.length,2);assert.ok(queries.every(q=>q.includes('White and Blue')));
});

test('published headset connection facts survive research for compatibility questions',async t=>{
 const url='https://retailer.example/product/example-x-headset';
 const page='<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name:'Example X Gaming Headset',brand:'Example',description:'Designed for listening to game audio. Connects to Windows computers using USB.',offers:{price:900,priceCurrency:'ZAR'}})+'</script>';
 t.mock.method(globalThis,'fetch',async u=>String(u)===url?new Response(page):new Response('<rss/>'));
 const d=await(await worker.fetch(new Request('https://findit.test/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification:{name:'Example X Gaming Headset',brand:'Example',object:'headset',searchQuery:'Example X Gaming Headset'},offers:[{product_url:url,sourcePageVerified:true,exactProductMatch:true}]})}),{})).json();
 assert.equal(d.researched,true);assert.ok(d.compatibility.some(x=>/Windows computers using USB/.test(x)));
 const answer=answerFromEvidence('Will it work with Xbox?',{identification:{name:'Example X Gaming Headset'}},d).answer;
 assert.match(answer,/Windows computers using USB/);assert.match(answer,/Compatibility with xbox has not been verified/i);
});

test('research removes rhetorical marketing and keeps differing variant codes scoped to their listings',async t=>{
 const urls=['https://retailer.example/product/jeans-grey','https://retailer.example/product/jeans-brown'];
 t.mock.method(globalThis,'fetch',async u=>{const index=urls.indexOf(String(u));if(index<0)return new Response('<rss/>');return new Response('<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name:'Example 501 Original Jeans '+(index?'Brown':'Grey'),brand:'Example',sku:index?'BROWN-32':'GREY-30',description:'Close your eyes. Think “jeans.” Now open. They were 501 Originals, right? With a classic straight leg and iconic styling, they are a fashion icon. To this day they have never gone out of style.',offers:{price:1000,priceCurrency:'ZAR'}})+'</script>');});
 const d=await(await worker.fetch(new Request('https://findit.test/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification:{name:'Example 501 Original Jeans',searchQuery:'Example 501 Original Jeans'},offers:urls.map(product_url=>({product_url,sourcePageVerified:true,exactProductMatch:true}))})}),{})).json();
 assert.equal(d.whatItDoes,'A classic straight leg and iconic styling.');assert.doesNotMatch(d.pros.join(' '),/close your eyes|now open|right\?|never gone out/i);
 assert.ok(!d.specifications.some(x=>x.name==='SKU / product code'));assert.equal(d.variants.length,2);assert.equal(d.variants[0].specifications.find(x=>x.name==='SKU / product code').value,'GREY-30');assert.equal(d.variants[1].specifications.find(x=>x.name==='SKU / product code').value,'BROWN-32');
});

test('alternate printed brand is used only for an unconfirmed retailer page and retains exact size checks',async t=>{
 const product={'@type':'Product',name:'Example Relief Cream 25g',brand:'Example Relief',description:'Published cream description.',offers:{price:75,priceCurrency:'ZAR'}};
 t.mock.method(globalThis,'fetch',async u=>String(u).includes('bing.com')?new Response('<rss><item><title>Example Relief Cream 25g</title><link>https://retailer.example/cream</link></item></rss>'):new Response('<script type="application/ld+json">'+JSON.stringify(product)+'</script>'));
 const input={name:'Maker cream tube',brand:'Maker',object:'cream tube',size:'25 g',requiresModelConfirmation:true,labelCandidates:[{name:'Example Relief Cream 25g',brand:'Example Relief',confirmed:false,source:'printed-label-hypothesis'}]};
 const r=await visualProductCandidates(input);assert.equal(r.length,1);assert.equal(r[0].photoMatchConfirmed,false);assert.equal(input.brand,'Maker');assert.equal(input.requiresModelConfirmation,true);
 product.name='Example Relief Cream 50g';assert.equal((await visualProductCandidates(input)).length,0);
});
test('a complete printed name and quantity can research a retailer brand without promoting a manufacturer guess',async t=>{
 const product={'@type':'Product',name:'Example Relief Cream 25g',brand:'Example Relief',offers:{price:75,priceCurrency:'ZAR'}};
 t.mock.method(globalThis,'fetch',async u=>String(u).includes('bing.com')?new Response('<rss><item><title>'+product.name+'</title><link>https://retailer.example/cream</link></item></rss>'):new Response('<script type="application/ld+json">'+JSON.stringify(product)+'</script>'));
 const input={name:'Maker Company topical cream',brand:'Maker Company',object:'cream tube',size:'25 g',requiresModelConfirmation:true,labelCandidates:[{name:'Example Relief Cream 25g',brand:'',manufacturer:'Maker Company',size:'25 g',confirmed:false,source:'printed-label-hypothesis'}]};
 const result=await visualProductCandidates(input);assert.equal(result.length,1);assert.equal(result[0].identity.brand,'Example Relief');assert.equal(result[0].photoMatchConfirmed,false);assert.equal(result[0].identity.userConfirmed,false);assert.equal(input.brand,'Maker Company');assert.equal(input.requiresModelConfirmation,true);
 product.name='Example Relief Cream 50g';assert.equal((await visualProductCandidates(input)).length,0);
 product.name='Other Relief Cream 25g';assert.equal((await visualProductCandidates(input)).length,0);
 assert.equal((await visualProductCandidates({...input,labelCandidates:[{...input.labelCandidates[0],size:''}]})).length,0);
});

test('generic visual phrases cannot admit a different numbered headset model beside a specific hypothesis',async t=>{
 const {specificVisualModel}=await import('../lib/visual-product-candidates.js');const input={name:'Example headphones',brand:'Example',object:'headphones',category:'electronics',requiresModelConfirmation:true,suggestedModels:['Example G Pro X','Example G gaming headset'].map(name=>({name,confirmed:false,source:'visual-model-hypothesis'}))};
 assert.equal(specificVisualModel('Example G gaming headset',input),false);assert.equal(specificVisualModel('Example G Pro X',input),true);
 const product={'@type':'Product',name:'Example G G321 Wireless Gaming Headset White',brand:'Example',offers:{price:1000,priceCurrency:'ZAR'}};
 t.mock.method(globalThis,'fetch',async u=>String(u).includes('bing.com')?new Response('<rss><item><title>'+product.name+'</title><link>https://retailer.example/product/g321</link></item></rss>'):new Response('<script type="application/ld+json">'+JSON.stringify(product)+'</script>'));
 assert.equal((await visualProductCandidates(input)).length,0);
 assert.equal((await visualProductCandidates({...input,suggestedModels:[input.suggestedModels[1]]})).length,0);
});
