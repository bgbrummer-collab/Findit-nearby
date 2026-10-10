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
