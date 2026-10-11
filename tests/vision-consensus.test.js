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
