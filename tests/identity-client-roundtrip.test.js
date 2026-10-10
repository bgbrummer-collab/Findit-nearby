import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import handler from '../lib/product-intelligence-core.js';
test('active reliability client retains uncertainty through the commerce API', async t=>{
 const identity={name:'Marc Anthony conditioner',brand:'Marc Anthony',object:'conditioner',requiresModelConfirmation:true};
 const source=readFileSync(new URL('../findit-core-reliability.js',import.meta.url),'utf8');
 const payloadFunction=source.split('\n').find(line=>line.startsWith('function productPayload()'));
 const payload=vm.runInNewContext(payloadFunction+';productPayload()', {ident:()=>identity,state:()=>({}),localStorage:{getItem:()=>null}});
 assert.equal(payload.identification.requiresModelConfirmation,true);
 t.mock.method(globalThis,'fetch',()=>{throw Error('uncertain image must not discover other variants')});
 let result;await handler({method:'POST',body:payload},{setHeader(){},status(){return this},json(v){result=v}});
 assert.deepEqual(result.offers,[]);assert.equal(result.exactMatchVerified,false);
});
