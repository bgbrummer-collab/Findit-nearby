import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileVision} from '../lib/vision-consensus.js';
const beats={name:'Beats Solo 3 headphones',brand:'Beats',model:'Solo 3',object:'headphones',retailCategory:'electronics'};
test('retains Beats headphones when exact models conflict, without leaking guessed model in query',()=>{const d=reconcileVision([beats,{...beats,model:'Studio 3'}]);assert.equal(d.name,'Beats headphones');assert.equal(d.model,'');assert.equal(d.searchQuery,'Beats headphones');assert.equal(d.requiresModelConfirmation,true)});
test('retains exact corroborated model with fewer calls',()=>{const d=reconcileVision([beats,beats]);assert.equal(d.model,'Solo 3');assert.equal(d.requiresModelConfirmation,false)});
test('different objects cannot confirm an exact product even when the brand agrees',()=>{const i=reconcileVision([beats,{...beats,object:'speaker'}]);assert.equal(i.identityScope,'brand');assert.equal(i.object,'product');assert.equal(i.model,'');assert.equal(i.requiresModelConfirmation,true)});
test('one confident model cannot independently verify itself',()=>assert.equal(reconcileVision([{...beats,confidence:1}]),null));
test('different brands cannot corroborate an identically named model',()=>{const d=reconcileVision([beats,{...beats,brand:'Sony'}]);assert.equal(d.brand,'');assert.equal(d.model,'');assert.equal(d.name,'headphones')});
test('headset and headphones are recognised as the same broad object',()=>assert.equal(reconcileVision([beats,{...beats,name:'Beats headset',object:'headset',model:''}]).name,'Beats headphones'));
test('container descriptions retain the independently recognised labelled product',()=>{const a={name:'Marc Anthony Triple Blend Conditioner',brand:'Marc Anthony',model:'Triple Blend Conditioner',object:'conditioner'},b={name:'Marc Anthony Strictly Curls 3x Moisture Conditioner',brand:'Marc Anthony',model:'Strictly Curls 3x Moisture Conditioner',object:'tube'};const d=reconcileVision([a,b]);assert.equal(d.name,'Marc Anthony conditioner');assert.equal(d.model,'');assert.equal(d.requiresModelConfirmation,true)});

test('two agreeing brands retain the brand when a third model misreads the logo',()=>{const i=reconcileVision([{name:'Beats headphones',brand:'Beats',object:'headphones'},{name:'Beats headphones',brand:'Beats by Dr. Dre',object:'headset'},{name:'Sony headphones',brand:'Sony',object:'headphones'}]);assert.equal(i.brand,'Beats');assert.equal(i.name,'Beats headphones');assert.equal(i.requiresModelConfirmation,true);assert.equal(i.model,'')});

test('model punctuation and size spacing preserve exact identity',()=>{const a={name:'Sony headphones',brand:'Sony',model:'WH-1000XM5',object:'headphones',size:'250 ml'},b={...a,model:'WH1000XM5',size:'250ml'};const d=reconcileVision([a,b]);assert.equal(d.requiresModelConfirmation,false);assert.match(d.name,/WH-1000XM5/);assert.equal(d.size,'250 ml')});
test('conflicting colour or size cannot publish an exact variant',()=>{for(const key of ['size','color','barcode']){const d=reconcileVision([{...beats,[key]:'1'},{...beats,[key]:'2'}]);assert.equal(d.requiresModelConfirmation,true);assert.equal(d[key],key==='barcode'?null:'')}});

test('a complete single-model label reading is retained only for human confirmation',()=>{const a={name:'Marc Anthony conditioner',brand:'Marc Anthony',model:'Strictly Curls 3X Moisture',object:'conditioner',visibleText:['Marc Anthony','Strictly Curls','3X Moisture']},b={...a,model:'',visibleText:[]};const d=reconcileVision([a,b]);assert.equal(d.suggestedLabel,'Marc Anthony Strictly Curls 3X Moisture');assert.equal(d.name,'Marc Anthony conditioner');assert.equal(d.model,'');assert.equal(d.requiresModelConfirmation,true);assert.equal(d.searchQuery,d.name)});
test('shape guesses and incompletely read labels are never suggested as a model',()=>{for(const visibleText of [[],['Beats'],['Beats Solo']]){const d=reconcileVision([{...beats,visibleText},{...beats,model:'Studio 3',visibleText:[]}]);assert.equal(d.suggestedLabel,'');assert.equal(d.requiresModelConfirmation,true)}});

test('a common printed metric size survives disagreement on an unverified secondary unit',()=>{const d=reconcileVision([{...beats,size:'8.4 fl. oz. / 250 ml'},{...beats,size:'8 fl. oz./250ml'}]);assert.equal(d.size,'250 ml');assert.equal(d.requiresModelConfirmation,false)});
test('different metric pack sizes still require confirmation',()=>{const d=reconcileVision([{...beats,size:'250 ml'},{...beats,size:'500 ml'}]);assert.equal(d.requiresModelConfirmation,true);assert.equal(d.size,'')});

test('a generic object label recovers the corroborated sneaker family without accepting conflicting models',()=>{
 const i=reconcileVision([{brand:'Nike',object:'sneakers',name:'Sneakers',model:'Dunk'},{brand:'Nike',object:'product',name:'Nike Dunk Low',model:'Low'}]);
 assert.equal(i.object,'shoes');assert.equal(i.brand,'Nike');assert.equal(i.model,'');assert.equal(i.requiresModelConfirmation,true);
});
test('conflicting product types preserve only a corroborated brand',()=>{
 const i=reconcileVision([{brand:'Twinsaver',object:'Tissues',name:'Tissues',size:'120'},{brand:'Twinsaver',object:'Toilet paper',name:'Toilet Paper',size:'36 rolls'}]);
 assert.equal(i.brand,'Twinsaver');assert.equal(i.object,'product');assert.equal(i.size,'');assert.equal(i.identityScope,'brand');assert.equal(i.requiresModelConfirmation,true);
});
test('independent descriptive label agreement proposes paint family without inferring size or colour',()=>{
 const i=reconcileVision([{brand:'Build it',object:'paint',name:'Floor & Stoep Paint',model:'Specialist Floor & Stoep Paint'},{brand:'Build it',object:'paint',name:'SPECIALIST FLOOR & STOEP PAINT',model:''}]);
 assert.match(i.suggestedLabel,/Floor & Stoep Paint/i);assert.equal(i.size,'');assert.equal(i.requiresModelConfirmation,true);
});

test('a surviving complete printed label can propose a reviewed candidate when other providers fail',()=>{
 const claim={name:'Strictly Curls 3X Moisture',brand:'Marc Anthony',object:'conditioner',model:'strictly curls 3x moisture triple blend conditioner',size:'250ml',color:'yellow',visibleText:['Strictly Curls','3X Moisture','Triple Blend','Conditioner']};
 const result=reconcileVision([claim]);assert.equal(result.requiresModelConfirmation,true);assert.equal(result.identificationMethod,'single-label-reading');assert.equal(result.model,'');assert.equal(result.size,'');assert.equal(result.confidence,null);assert.match(result.suggestedLabel,/Marc Anthony/);
 assert.equal(reconcileVision([{...claim,visibleText:['Conditioner']}]),null);
 assert.equal(reconcileVision([{...claim,model:'Guessed different model'}]),null);
});

test('container graphics cannot become a paint colour or conditioner variant',()=>{
 const paint={name:'Build it Floor & Stoep Paint',brand:'Build it',model:'Floor and Stoep Paint',object:'paint',size:'5L',color:'green',visibleText:['Floor & Stoep Paint','5L']};const result=reconcileVision([paint,{...paint}]);assert.equal(result.color,'');assert.equal(result.requiresModelConfirmation,true);assert.match(result.suggestedLabel,/Floor and Stoep Paint/);
 const conditioner={name:'Example Hydrating Conditioner 250ml',brand:'Example',model:'Hydrating Conditioner',object:'conditioner',size:'250ml',color:'yellow',visibleText:['Example','Hydrating Conditioner','250ml']};assert.equal(reconcileVision([conditioner,{...conditioner}]).color,'');
 const printed={...paint,color:'white',visibleText:[...paint.visibleText,'White']};assert.equal(reconcileVision([printed,{...printed}]).color,'white');
});

test('conflicting shoe models remain reviewable hypotheses without confirming the photographed SKU',()=>{
 const claim={name:'Nike Air Force 1 Low',brand:'Nike',model:'Air Force 1 Low',object:'shoes',color:'White and Blue'};
 const result=reconcileVision([claim,{...claim,name:'Nike Air Force 1 07',model:'Air Force 1 07'}]);
 assert.equal(result.name,'Nike shoes');assert.equal(result.model,'');assert.equal(result.requiresModelConfirmation,true);assert.equal(result.suggestedLabel,'');
 assert.deepEqual(result.suggestedModels.map(x=>x.name),['Nike Air Force 1 Low','Nike Air Force 1 07']);assert.ok(result.suggestedModels.every(x=>x.confirmed===false));
 const mixed=reconcileVision([claim,{...claim,brand:'Other',model:'Unrelated model'}]);assert.deepEqual(mixed.suggestedModels,[]);
});

test('model hypotheses prefer the complete family name and discard isolated numeric fragments',()=>{
 const r=reconcileVision(['Air Force','1','Air Force 1'].map(model=>({brand:'Nike',object:'shoes',name:'Nike shoes',model})));
 assert.equal(r.requiresModelConfirmation,true);assert.deepEqual(r.suggestedModels.map(x=>x.name),['Nike Air Force 1']);assert.equal(r.model,'');
});
