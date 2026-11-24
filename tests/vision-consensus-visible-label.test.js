import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileVision} from '../lib/vision-consensus.js';

function pair(overrides={}){
 const base={name:'Logitech mouse',brand:'Logitech',model:'M185',object:'mouse',category:'electronics',retailCategory:'electronics',searchQuery:'Logitech mouse',visibleText:['M185','Logitech'],confidence:.9};
 return [{...base,...overrides},{...base,...overrides}];
}

test('promotes an electronics model code only when independent readers also transcribe it',()=>{
 const result=reconcileVision(pair());
 assert.equal(result.model,'M185');
 assert.equal(result.modelEvidence,true);
 assert.equal(result.modelEvidenceFromVisibleText,true);
 assert.equal(result.requiresModelConfirmation,false);
 assert.match(result.searchQuery,/M185/);
});

test('promotes a readable technical code with punctuation from corroborated label text',()=>{
 const result=reconcileVision(pair({name:'TP-Link range extender',brand:'TP-Link',model:'',object:'router',category:'electronics',retailCategory:'electronics',searchQuery:'TP-Link range extender',visibleText:['TL-WA850RE','TP-Link']}));
 assert.equal(result.model,'TL-WA850RE');
 assert.equal(result.modelEvidence,true);
 assert.equal(result.requiresModelConfirmation,false);
 assert.match(result.searchQuery,/TL-WA850RE/);
});

test('retains one unambiguous printed personal-care variant and package size',()=>{
 const result=reconcileVision(pair({name:'NIVEA product',brand:'NIVEA',model:'',object:'cream',category:'beauty',retailCategory:'beauty',searchQuery:'NIVEA product',size:'',visibleText:['NIVEA','Soft','200 ml']}));
 assert.equal(result.model,'Soft');
 assert.equal(result.modelEvidence,true);
 assert.equal(result.modelEvidenceFromVisibleText,true);
 assert.equal(result.size,'200 ml');
 assert.equal(result.requiresModelConfirmation,false);
 assert.match(result.searchQuery,/NIVEA Soft/i);
 assert.match(result.searchQuery,/200 ml/i);
});
