import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare/worker.js';
const request=()=>{const form=new FormData();form.append('image',new File([new Uint8Array([1,2,3])],'photo.jpg',{type:'image/jpeg'}));return new Request('https://findit.test/api/search',{method:'POST',body:form});};
const claim=model=>({name:'Example '+model+' headphones',brand:'Example',model,object:'headphones',confidence:.9});
function cache(t){const rows=new Map(),writes=[];const previous=Object.getOwnPropertyDescriptor(globalThis,'caches');t.after(()=>{if(previous)Object.defineProperty(globalThis,'caches',previous);else delete globalThis.caches;});Object.defineProperty(globalThis,'caches',{configurable:true,value:{default:{match:async key=>rows.get(key.url)?.clone(),put:async(key,response)=>{rows.set(key.url,response.clone());writes.push({url:key.url,control:response.headers.get('cache-control')});}}}});return {writes};}
test('configuring the optional provider cannot reuse the old provider profile identity',async t=>{
 const c=cache(t);let calls=0;
 const first=await worker.fetch(request(),{AI:{run:async()=>{calls++;return {response:JSON.stringify(claim('X1'))};}}});
 assert.equal((await first.json()).identification.model,'X1');
 const hit=await worker.fetch(request(),{AI:{run:async()=>{throw Error('Expected cached identity');}}});assert.equal((await hit.json()).provider,'verified-visual-cache');
 t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(claim('X2'))}]}}]}),{headers:{'content-type':'application/json'}}));
 const second=await worker.fetch(request(),{GEMINI_API_KEY:'unit-test-placeholder',AI:{run:async()=>{calls++;return {response:JSON.stringify(claim('X2'))};}}});
 assert.equal((await second.json()).identification.model,'X2');assert.equal(calls,3);
 assert.ok(c.writes.some(x=>x.url.includes('/cloudflare/')));assert.ok(c.writes.some(x=>x.url.includes('/gemini/')));assert.ok(c.writes.every(x=>!x.url.includes('unit-test-placeholder')));
});
test('uncertain photo identities expire quickly instead of blocking a better retry for a day',async t=>{
 const c=cache(t);const env={AI:{run:async model=>({response:JSON.stringify(claim(model.includes('gemma')?'X1':'X2'))})}};
 const response=await worker.fetch(request(),env),data=await response.json();assert.equal(data.identification.requiresModelConfirmation,true);assert.equal(c.writes.length,1);assert.equal(c.writes[0].control,'public, max-age=120');
});
