import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileVision} from '../lib/vision-consensus.js';
const beats={name:'Beats Solo 3 headphones',brand:'Beats',model:'Solo 3',object:'headphones',retailCategory:'electronics'};
test('retains Beats headphones when exact models conflict, without leaking guessed model in query',()=>{const d=reconcileVision([beats,{...beats,model:'Studio 3'}]);assert.equal(d.name,'Beats headphones');assert.equal(d.model,'');assert.equal(d.searchQuery,'Beats headphones');assert.equal(d.requiresModelConfirmation,true)});
test('retains exact corroborated model with fewer calls',()=>{const d=reconcileVision([beats,beats]);assert.equal(d.model,'Solo 3');assert.equal(d.requiresModelConfirmation,false)});
test('rejects broad category agreement on different objects',()=>assert.equal(reconcileVision([beats,{...beats,object:'speaker'}]),null));
test('one confident model cannot independently verify itself',()=>assert.equal(reconcileVision([{...beats,confidence:1}]),null));
test('different brands cannot corroborate an identically named model',()=>{const d=reconcileVision([beats,{...beats,brand:'Sony'}]);assert.equal(d.brand,'');assert.equal(d.model,'');assert.equal(d.name,'headphones')});
test('headset and headphones are recognised as the same broad object',()=>assert.equal(reconcileVision([beats,{...beats,name:'Beats headset',object:'headset',model:''}]).name,'Beats headphones'));
test('container descriptions retain the independently recognised labelled product',()=>{const a={name:'Marc Anthony Triple Blend Conditioner',brand:'Marc Anthony',model:'Triple Blend Conditioner',object:'conditioner'},b={name:'Marc Anthony Strictly Curls 3x Moisture Conditioner',brand:'Marc Anthony',model:'Strictly Curls 3x Moisture Conditioner',object:'tube'};const d=reconcileVision([a,b]);assert.equal(d.name,'Marc Anthony conditioner');assert.equal(d.model,'');assert.equal(d.requiresModelConfirmation,true)});

test('two agreeing brands retain the brand when a third model misreads the logo',()=>{const i=reconcileVision([{name:'Beats headphones',brand:'Beats',object:'headphones'},{name:'Beats headphones',brand:'Beats by Dr. Dre',object:'headset'},{name:'Sony headphones',brand:'Sony',object:'headphones'}]);assert.equal(i.brand,'Beats');assert.equal(i.name,'Beats headphones');assert.equal(i.requiresModelConfirmation,true);assert.equal(i.model,'')});
