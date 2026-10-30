import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare/worker.js';
import {candidateLabelMatches,labelSearchName,visualProductCandidates} from '../lib/visual-product-candidates.js';
import {descriptionTableSpecifications} from '../lib/product-description-specs.js';
import {productInformationChecklist} from '../lib/product-type-information.js';

test('quantity formatting cannot obstruct label discovery or silently confirm a different pack',()=>{
 const base={brand:'Example',object:'conditioner',suggestedLabel:'Example Curl Triple Blend Conditioner 8.4 fl. oz.'};
 assert.equal(labelSearchName(base.suggestedLabel),'Example Curl Triple Blend Conditioner');
 assert.equal(candidateLabelMatches('Example Curl Triple Blend Conditioner 250ml',base),true);
 assert.equal(candidateLabelMatches('Example Curl Triple Blend Conditioner 12 fl oz',base),false);
 assert.equal(candidateLabelMatches('Other Curl Triple Blend Conditioner 250ml',base),false);
 for(const [wanted,given,expected] of [['250 ml','500 millilitres',false],['1.5 l','15 l',false],['1 l','1000 ml',true],['250 g','250 ml',false]]){
  assert.equal(candidateLabelMatches('Example Curl Conditioner '+given,{...base,suggestedLabel:'Example Curl Conditioner '+wanted}),expected);
 }
 assert.equal(candidateLabelMatches('Example Curl Shampoo 250ml',base),false);
 assert.equal(candidateLabelMatches('Example Curl Conditioner 1250ml',{brand:'Example',object:'conditioner',suggestedLabel:'Example Curl Conditioner',size:'250 ml'}),false);
 assert.equal(candidateLabelMatches('Example Curl Conditioner 1000ml',{brand:'Example',object:'conditioner',suggestedLabel:'Example Curl Conditioner',size:'1 l'}),true);
 assert.equal(candidateLabelMatches('Example Shoes UK19',{brand:'Example',object:'shoes',suggestedLabel:'Example Style Shoes',size:'UK9'}),false);
});

test('cross-unit label candidates retain uncertainty and never become confirmed photo identity',async t=>{
 const name='Example Curl Triple Blend Conditioner 250ml',url='https://retailer.example/product/curl';
 const page='<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name,brand:'Example',description:'Designed to condition curly hair.'})+'</script>';
 const queries=[];t.mock.method(globalThis,'fetch',async u=>{if(String(u).includes('bing.com')){queries.push(new URL(u).searchParams.get('q'));return new Response('<rss><item><title>'+name+'</title><link>'+url+'</link></item></rss>');}return new Response(String(u)===url?page:'<rss/>');});
 const i={name:'Example conditioner',brand:'Example',object:'conditioner',requiresModelConfirmation:true,suggestedLabel:'Example Curl Triple Blend Conditioner 8.4 fl oz',labelCandidates:[{name:'Example Curl Triple Blend Conditioner 8.4 fl oz',brand:'Example',size:'8.4 fl oz',confirmed:false,source:'printed-label-hypothesis'}]};
 const rows=await visualProductCandidates(i);assert.equal(rows.length,1);assert.equal(rows[0].photoMatchConfirmed,false);assert.equal(rows[0].identity.userConfirmed,false);assert.equal(rows[0].identity.size,'');assert.match(rows[0].quantityNote,/no unit conversion or size match/);assert.ok(queries.every(q=>!q.includes('8.4')));assert.equal(i.requiresModelConfirmation,true);
});

test('scoped definition lists preserve units and label instructions without contact or payment content',()=>{
 const html='<dl><dt>Driver diameter</dt><dd>40 mm</dd><dt>Connectivity:</dt><dd>3.5 mm analog</dd><dt>How to use</dt><dd>Connect the supplied cable.</dd><dt>Phone</dt><dd>0123456789</dd><dt>Payment</dt><dd>Monthly instalments</dd></dl>';
 assert.deepEqual(descriptionTableSpecifications(html),[{name:'Driver diameter',value:'40 mm'},{name:'Connectivity',value:'3.5 mm analog'},{name:'How to use',value:'Connect the supplied cable.'}]);
});

test('product research attributes individual facts and included items to the actual matched source',async t=>{
 const name='Example A2 Headset',url='https://retailer.example/product/a2';
 const raw='<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name,brand:'Example',description:'Designed for listening to game audio. Connects to Windows computers using USB. Includes a detachable microphone. An adapter is sold separately.'})+'</script><div class="product__description"><p>Designed for listening to game audio. Connects to Windows computers using USB. Includes a detachable microphone. An adapter is sold separately.</p><dl><dt>Weight</dt><dd>240 g</dd><dt>Care instructions</dt><dd>Wipe with a dry cloth.</dd></dl></div><footer><dl><dt>Battery life</dt><dd>Invented 999 hours</dd></dl></footer>';
 t.mock.method(globalThis,'fetch',async u=>new Response(String(u)===url?raw:'<rss/>'));
 const d=await(await worker.fetch(new Request('https://findit.test/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification:{name},offers:[{product_url:url,sourcePageVerified:true,exactProductMatch:true}]})}),{})).json();
 assert.equal(d.researched,true);assert.equal(d.claimEvidence.whatItDoes.sourceUrl,url);assert.ok(d.claimEvidence.compatibility.some(r=>r.sourceUrl===url&&/Windows/.test(r.text)));assert.ok(d.claimEvidence.includedItems.some(r=>/detachable microphone/.test(r.text)&&r.sourceUrl===url));assert.ok(d.claimEvidence.cons.some(r=>/sold separately/.test(r.text)&&r.sourceUrl===url));assert.ok(d.specifications.some(r=>r.name==='Weight'&&r.value==='240 g'&&r.sourceUrl===url));assert.ok(d.specifications.some(r=>r.name==='Care instructions'));assert.doesNotMatch(JSON.stringify(d),/999 hours/);
});

test('verification guidance covers different product families without inventing model specifications',()=>{
 const cases=[['headset',/Connector|supported devices/],['shoes',/Style|colourway/],['conditioner',/rinse-out|leave-in/],['drill',/Battery/],['paint',/surfaces/],['cereal',/allergens/],['jeans',/Fabric/],['building blocks',/Set|model/],['unusual object',/Exact model/]];
 for(const [object,expected] of cases){const r=productInformationChecklist({object});assert.match(r.checks.join(' '),expected);assert.match(r.nextPhoto,/Photograph/);assert.doesNotMatch(JSON.stringify(r),/250ml|50 mm|30 hours|waterproof|Strictly Curls|Logitech/);}
});

test('box contents stay attributed as included items rather than strengths or connection compatibility',async t=>{
 const name='Example A2 Headset',url='https://retailer.example/product/a2';
 const description='The Example A2 Headset is designed for listening to audio. Package includes A2 headset; wireless USB-A receiver; USB-C charging cable; documentation. Connects to computers using Bluetooth. Adjustable headband improves comfort.';
 t.mock.method(globalThis,'fetch',async u=>new Response(String(u)===url?'<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name,description})+'</script>':'<rss/>'));
 const d=await(await worker.fetch(new Request('https://findit.test/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification:{name},offers:[{product_url:url,sourcePageVerified:true,exactProductMatch:true}]})}),{})).json();
 assert.equal(d.researched,true);assert.ok(d.includedItems.some(s=>s.startsWith('Package includes')));assert.ok(d.claimEvidence.includedItems.every(s=>s.sourceUrl===url));
 assert.ok(d.compatibility.some(s=>/Connects.*Bluetooth/.test(s)));assert.ok(d.pros.some(s=>/Adjustable headband/.test(s)));
 assert.doesNotMatch(d.compatibility.join(' '),/Package includes|charging cable/);assert.doesNotMatch(d.pros.join(' '),/Package includes|documentation/);
});
