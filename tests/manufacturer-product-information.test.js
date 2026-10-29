import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare/worker.js';
import {manufacturerResearchUrls,shureGuideMetadata,shureGuideProduct,expandedPrimaryProduct,manufacturerProductData} from '../lib/manufacturer-product-information.js';
import {reconcileVision} from '../lib/vision-consensus.js';
import {visualProductCandidates} from '../lib/visual-product-candidates.js';

const identity={name:'Shure EX12 microphone',brand:'Shure',model:'EX12',object:'microphone',searchQuery:'Shure EX12 microphone'};
const guide='https://www.shure.com/en-US/docs/guide/EX12';
const shell=(model='EX12',lang='English')=>'<script id="__NEXT_DATA__" type="application/json">'+JSON.stringify({props:{pageProps:{model,docId:42,helperLang:{42:lang},helperpubName:{42:['Podcast Microphone']},description:'Published manufacturer guide.'}}})+'</script>';
const manual='<div id="pub-content"><h1>General Description</h1><p>The Shure EX12 microphone is designed for recording speech.</p><h1>EX12 Output</h1><p>Connects to an XLR audio interface.</p><h1>Specifications</h1><h3 class="spec1_title">Output Impedance</h3><p class="spec1_value">250 Ω</p><h3 class="spec1_title">Sensitivity</h3><p class="spectext_cond">at 1 kHz, open circuit</p><p class="spec1_value">-55 dBV/Pa [1]</p><p class="spec1_fn">[1] 1 Pa = 94 dB SPL</p><h1>Certifications</h1><p>Unrelated footer promotion with 999 hours battery.</p></div>';

test('manufacturer adapters use requested models rather than stored specifications or guessed variants',()=>{
 assert.deepEqual(manufacturerResearchUrls(identity),[guide]);
 assert.deepEqual(manufacturerResearchUrls({name:'Shure microphone'}),[]);
 assert.deepEqual(manufacturerResearchUrls({brand:'Shure',model:'../../private',name:'microphone'}),[]);
 assert.equal(shureGuideMetadata(shell('EX13'),identity,guide),null);
 assert.equal(shureGuideMetadata(shell('EX12','German'),identity,guide),null);
 assert.equal(shureGuideMetadata(shell(),identity,'https://other.example/en-US/docs/guide/EX12'),null);
 const node=JSON.parse(shureGuideProduct(shureGuideMetadata(shell(),identity,guide),manual).match(/<script[^>]*>([\s\S]*)<\/script>/)[1]);
 assert.equal(node.name,'Shure EX12 Podcast Microphone');assert.equal(node.offers,undefined);assert.ok(node.additionalProperty.some(p=>p.name==='Sensitivity'&&p.value.includes('at 1 kHz')));assert.ok(node.additionalProperty.some(p=>p.name==='Specification notes'));assert.doesNotMatch(node.description,/999 hours|Certifications/);
});

test('matching manufacturer documents provide attributed specifications without requiring an offer',async t=>{
 t.mock.method(globalThis,'fetch',async u=>String(u)===guide?new Response(shell()):String(u).includes('/render/42.html.twig')?new Response(manual):new Response('<rss/>'));
 const d=await(await worker.fetch(new Request('https://findit.test/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification:identity})}),{})).json();
 assert.equal(d.researched,true);assert.match(d.whatItDoes,/recording speech/);assert.ok(d.specifications.some(s=>s.name==='Output Impedance'&&s.value==='250 Ω'&&s.sourceUrl===guide));assert.ok(d.compatibility.some(s=>/XLR/.test(s)));assert.doesNotMatch(JSON.stringify(d),/999 hours/);
});

test('a single branded model reading remains separate from a corroborated object',()=>{
 const claims=[{name:'headphones',object:'headphones',brand:'',model:''},{name:'Example Audio A2 Gaming Headset',object:'headset',brand:'Example Audio',model:'A2'}];
 const i=reconcileVision(claims);assert.equal(i.brand,'');assert.equal(i.model,'');assert.equal(i.name,'headphones');assert.equal(i.requiresModelConfirmation,true);assert.deepEqual(i.visualHypotheses,[{name:'Example Audio A2',brand:'Example Audio',model:'A2',object:'headphones',confirmed:false,source:'single-visual-model-hypothesis'}]);
 const wrong=reconcileVision([claims[0],claims[0],{name:'Example Audio A2 Mouse',brand:'Example Audio',model:'A2',object:'mouse'}]);assert.deepEqual(wrong.visualHypotheses,[]);
});

test('possible model research cannot promote an unconfirmed brand, price or stock onto the photo',async t=>{
 const name='Example Audio A2 Gaming Headset',url='https://retailer.example/product/a2';
 t.mock.method(globalThis,'fetch',async u=>String(u).includes('bing.com')?new Response('<rss><item><title>'+name+'</title><link>'+url+'</link></item></rss>'):new Response(String(u)===url?'<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name,brand:'Example Audio',description:'Designed for audio listening.',offers:{price:900,priceCurrency:'ZAR'}})+'</script>':'<rss/>'));
 const i=reconcileVision([{name:'headphones',object:'headphones'},{name,brand:'Example Audio',object:'headset',model:'A2'}]);
 const d=await(await worker.fetch(new Request('https://findit.test/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification:i})}),{})).json();
 assert.equal(d.researched,false);assert.equal(d.possibleProducts.length,1);assert.equal(d.possibleProducts[0].photoMatchConfirmed,false);assert.match(d.possibleProducts[0].hypothesisNote,/not independently confirmed/);assert.equal(d.possibleProducts[0].price,900);assert.equal(i.brand,'');assert.equal(i.requiresModelConfirmation,true);
});

test('ambiguous, mismatched and untagged brand hypotheses cannot silently select a product',async t=>{
 t.mock.method(globalThis,'fetch',()=>{throw Error('No request expected');});
 const h={name:'Example A2',brand:'Example',model:'A2',object:'headphones',confirmed:false,source:'single-visual-model-hypothesis'},i={name:'headphones',object:'headphones',requiresModelConfirmation:true};
 for(const visualHypotheses of [[{...h,source:'untrusted'}],[{...h,object:'mouse'}],[h,{...h,name:'Other B2',brand:'Other',model:'B2'}]])assert.deepEqual(await visualProductCandidates({...i,visualHypotheses}),[]);
});

test('abbreviated names expand only for the same canonical product and a matching page title',()=>{
 const url='https://manufacturer.example/products/a2',title='Example Audio A2 Gaming Headset',matches=name=>name.includes('Example Audio A2');
 const page=node=>'<title>'+title+'</title><meta name="description" content="Designed for listening to audio."><script type="application/ld+json">'+JSON.stringify(node)+'</script>';
 const node={'@type':'Product',name:'A2',brand:'Example Audio',url,offers:{price:0,priceCurrency:'ZAR'}};
 const raw=expandedPrimaryProduct(page(node),url,matches);assert.match(raw,/Designed for listening/);assert.match(raw,/"name":"Example Audio A2 Gaming Headset"/);
 assert.equal(expandedPrimaryProduct(page({...node,url:'https://manufacturer.example/products/recommendation'}),url,matches),null);
 assert.equal(expandedPrimaryProduct(page({...node,url:undefined}),url,matches),null);
 assert.equal(expandedPrimaryProduct(page({...node,brand:'Other'}),url,matches),null);
 assert.equal(expandedPrimaryProduct(page(node),url,()=>false),null);
});

test('primary manufacturer names can supply possible product facts with no price or confirmed photo brand',async t=>{
 const name='Logitech G PRO Gaming Headset Designed for Esports Players',url='https://www.logitechg.com/en-sg/shop/p/pro-gaming-headset';
 const raw='<title>'+name+'</title><meta name="description" content="Designed for listening to audio with noise isolation."><script type="application/ld+json">'+JSON.stringify({'@type':'Product',name:'PRO',brand:'Logitech G',url,offers:{'@type':'AggregateOffer',lowPrice:0,highPrice:0,priceCurrency:'SGD'}})+'</script>';
 t.mock.method(globalThis,'fetch',async u=>new Response(String(u)===url?raw:'<rss/>'));
 const i=reconcileVision([{name:'headphones',object:'headphones'},{name:'Logitech G Pro Gaming Headset',brand:'Logitech',model:'G Pro',object:'headset'}]);
 const rows=await visualProductCandidates(i);assert.equal(rows.length,1);assert.equal(rows[0].price,null);assert.equal(rows[0].name,name);assert.equal(rows[0].photoMatchConfirmed,false);assert.match(rows[0].hypothesisNote,/one image reader/);assert.equal(i.brand,'');
});

test('the product definition takes priority over a mounting feature as its purpose',async t=>{
 const url='https://retailer.example/products/example-v4';
 const name='Example V4 Microphone',description='The Example V4 is a dynamic microphone for recording speech. Its adjustable yoke features flexible mounting on stands. Connects to an XLR interface.';
 t.mock.method(globalThis,'fetch',async u=>new Response(String(u)===url?'<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name,description})+'</script>':'<rss/>'));
 const d=await(await worker.fetch(new Request('https://findit.test/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification:{name},offers:[{product_url:url,sourcePageVerified:true,exactProductMatch:true}]})}),{})).json();
 assert.equal(d.whatItDoes,'The Example V4 is a dynamic microphone for recording speech.');assert.equal(d.claimEvidence.whatItDoes.sourceUrl,url);
});

test('public document metadata retrieves the guide without relying on the website shell',async t=>{
 let websiteFetched=false;
 t.mock.method(globalThis,'fetch',async (u,options)=>{
  if(String(u)===guide)websiteFetched=true;
  if(String(u).endsWith('/documents/public/product')){assert.deepEqual(JSON.parse(options.body),{docTypeShortCode:'guide',prodId:'EX12',lang:'en-US'});return Response.json({status:'success',data:{id:42,model:'EX12',product_id:'EX12',public:true,language:1,document_type:1,pub_name:'Podcast Microphone'}});}
  return new Response(String(u).includes('/render/42.html.twig')?manual:'');
 });
 const data=await manufacturerProductData(guide,identity);assert.match(data,/Output Impedance/);assert.equal(websiteFetched,false);
});

test('private, mismatched or non-English document lookups cannot supply product facts',async t=>{
 for(const changed of [{public:false},{model:'EX13'},{product_id:'EX13'},{language:2},{document_type:2},{id:'42'}]){
  let rendered=false;t.mock.method(globalThis,'fetch',async u=>{if(String(u).includes('/render/'))rendered=true;return Response.json({status:'success',data:{id:42,model:'EX12',product_id:'EX12',public:true,language:1,document_type:1,...changed}});});
  assert.equal(await manufacturerProductData(guide,identity),null);assert.equal(rendered,false);t.mock.restoreAll();
 }
});

test('unavailable manufacturer documents report source status without exposing response bodies',async t=>{
 const checks=[];t.mock.method(globalThis,'fetch',async()=>new Response('Private upstream diagnostic',{status:403}));
 assert.equal(await manufacturerProductData(guide,identity,undefined,x=>checks.push(x)),null);
 assert.deepEqual(checks,[{url:guide,status:'http-error',resource:'manufacturer-document',stage:'metadata',httpStatus:403}]);assert.doesNotMatch(JSON.stringify(checks),/Private upstream/);
});

test('confirmed product research retains the canonical manufacturer record when search fills the page budget',async t=>{
 const name='Logitech G PRO Gaming Headset Designed for Esports Players',url='https://www.logitechg.com/en-sg/shop/p/pro-gaming-headset';
 const raw='<title>'+name+'</title><script type="application/ld+json">'+JSON.stringify({'@type':'Product',name:'PRO',brand:'Logitech G',url,description:'The Logitech G PRO gaming headset isolates background noise for audio listening.',additionalProperty:[{name:'Connection',value:'3.5 mm audio'}]})+'</script>';
 const fetched=[];
 t.mock.method(globalThis,'fetch',async u=>{
  fetched.push(String(u));
  if(String(u).includes('bing.com'))return new Response('<rss>'+Array.from({length:4},(_,n)=>'<item><title>'+name+'</title><link>https://retailer'+n+'.example/products/pro-headset</link></item>').join('')+'</rss>');
  return new Response(String(u)===url?raw:'<title>Unavailable</title>');
 });
 const identification={name:'Logitech G PRO Gaming Headset',brand:'Logitech',model:'G PRO',object:'headset',userConfirmed:true};
 const d=await(await worker.fetch(new Request('https://findit.test/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification})}),{})).json();
 assert.ok(fetched.includes(url),'manufacturer must remain within the four-page budget');
 assert.equal(d.researched,true);assert.match(d.whatItDoes,/isolates background noise/);
 assert.ok(d.specifications.some(s=>s.name==='Connection'&&s.value==='3.5 mm audio'&&s.sourceUrl===url));
});

test('confirmed research rejects abbreviated recommendation records on another canonical page',async t=>{
 const name='Logitech G PRO Gaming Headset',url='https://www.logitechg.com/en-sg/shop/p/pro-gaming-headset';
 const raw='<title>'+name+'</title><script type="application/ld+json">'+JSON.stringify({'@type':'Product',name:'PRO',brand:'Logitech G',url:url+'-other',description:'Unrelated recommendation provides 999 hours of listening.',additionalProperty:[{name:'Battery',value:'999 hours'}]})+'</script>';
 t.mock.method(globalThis,'fetch',async u=>new Response(String(u)===url?raw:'<rss/>'));
 const d=await(await worker.fetch(new Request('https://findit.test/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification:{name,brand:'Logitech',model:'G PRO',object:'headset',userConfirmed:true}})}),{})).json();
 assert.doesNotMatch(JSON.stringify(d.specifications),/999 hours/);
});
