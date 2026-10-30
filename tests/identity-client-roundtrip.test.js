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

test('GET retry preserves uncertainty rather than publishing another variant',async t=>{
 t.mock.method(globalThis,'fetch',()=>{throw Error('must not discover uncertain variant')});
 const source=readFileSync(new URL('../dashboard-commerce-status.js',import.meta.url),'utf8'),line=source.split('\n').find(x=>x.startsWith('function getUrl(b)'));
 const url=vm.runInNewContext(line+';getUrl(b)',{URLSearchParams,b:{identification:{requiresModelConfirmation:true},name:'Marc Anthony conditioner'}});
 const query=Object.fromEntries(new URL(url,'https://findit.test').searchParams);assert.equal(query.requiresModelConfirmation,'true');
 let result;await handler({method:'GET',query},{setHeader(){},status(){return this},json(v){result=v}});assert.deepEqual(result.offers,[]);assert.equal(result.exactMatchVerified,false);
});

test('GET product research never fetches specifications for an uncertain variant',async t=>{
 t.mock.method(globalThis,'fetch',()=>{throw Error('must not research an uncertain variant')});
 const {default:worker}=await import('../cloudflare/worker.js');
 const r=await worker.fetch(new Request('https://findit.test/api/product-insights?name=Beats%20headphones&requiresModelConfirmation=true'),{}),d=await r.json();
 assert.equal(d.researched,false);assert.equal(d.identityScope,'product-family');assert.deepEqual(d.sources,[]);
});

test('GET commerce retries retain photo origin and separate variant fields',()=>{
 const i={name:'A42 headphones',identificationMethod:'independent-vision-consensus',userConfirmed:false,color:'black',size:'UK 8',barcode:'5449000000996'};
 const source=readFileSync(new URL('../dashboard-commerce-status.js',import.meta.url),'utf8'),line=source.split('\n').find(x=>x.startsWith('function getUrl(b)'));
 const url=vm.runInNewContext(line+';getUrl(b)',{URLSearchParams,b:{identification:i,name:i.name}}),query=new URL(url,'https://findit.test').searchParams;
 for(const field of ['identificationMethod','userConfirmed','color','size','barcode'])assert.equal(query.get(field),String(i[field]));
});

test('retailer fallback cache cannot reuse typed confirmation for an unconfirmed photo variant',()=>{
 const source=readFileSync(new URL('../offer-stability-fix.js',import.meta.url),'utf8'),line=source.split('\n').find(x=>x.trim().startsWith('const keyFor='));
 const i={name:'A42 headphones',model:'A42',identificationMethod:'independent-vision-consensus'};
 const key=identity=>vm.runInNewContext(line+";keyFor('/api/product-intelligence-v2',b)",{norm:v=>String(v??'').toLowerCase(),b:{identification:identity}});
 assert.notEqual(key(i),key({...i,userConfirmed:true}));assert.notEqual(key(i),key({...i,color:'blue'}));assert.notEqual(key(i),key({...i,size:'UK 8'}));
});
