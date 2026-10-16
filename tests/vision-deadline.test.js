import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare/worker.js';
test('independent photo readings start together so a slow first model does not starve corroboration',async()=>{
 const calls=[];let release;
 const claim={name:'Example X1 headphones',brand:'Example',model:'X1',object:'headphones',confidence:.9};
 const env={AI:{run:async model=>{
  calls.push(model);
  if(model.includes('scout'))return new Promise(resolve=>{release=()=>resolve({response:JSON.stringify(claim)})});
  if(model.includes('moondream')){release();return {response:JSON.stringify(claim)}}
  throw Error('A third model is unnecessary for exact corroborated readings');
 }}};
 const form=new FormData();form.append('image',new File([new Uint8Array([1,2,3])],'test.jpg',{type:'image/jpeg'}));
 const response=await worker.fetch(new Request('https://findit.test/api/search',{method:'POST',body:form}),env),data=await response.json();
 assert.equal(response.status,200);assert.equal(calls.length,2);assert.equal(data.identification.model,'X1');assert.equal(data.identification.requiresModelConfirmation,false);
});

test('an unconfirmed family reading still asks the configured alternate provider for corroboration',async t=>{
 let hf=0;
 t.mock.method(globalThis,'fetch',async()=>{hf++;return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({name:'Example X1 headphones',brand:'Example',model:'X1',object:'headphones',confidence:.9})}}]}));});
 const env={HF_TOKEN:'test-only',AI:{run:async model=>{if(model.includes('moondream'))return{response:JSON.stringify({name:'Example headphones',brand:'Example',model:'',object:'headphones',confidence:.7})};throw Error('provider unavailable');}}};
 const form=new FormData();form.append('image',new File([new Uint8Array([1,2,3])],'test.jpg',{type:'image/jpeg'}));const d=await(await worker.fetch(new Request('https://findit.test/api/search',{method:'POST',body:form}),env)).json();assert.equal(hf,1);assert.ok(d.visionDiagnostics.some(x=>x.provider==='huggingface'&&x.code==='IDENTIFIED'));assert.equal(d.identification.requiresModelConfirmation,true,'An unsupported exact-model claim must remain unconfirmed');
});

test('vision corroboration does not send unsupported capacity options to the legacy image model',async()=>{
 const calls=[],claim={name:'Example X1 headphones',brand:'Example',model:'X1',object:'headphones',confidence:.9};
 const env={AI:{run:async(model,input,options)=>{calls.push(model);if(model.includes('scout')){assert.equal(options?.rejectIfBusy,undefined,'Scout must allow its bounded capacity wait');throw Error('3040: Capacity temporarily exceeded');}if(model.includes('moondream'))return{answer:JSON.stringify(claim)};if(options?.rejectIfBusy)throw Error('8007: unsupported request queuing');return{description:JSON.stringify(claim)};}}};
 const f=new FormData();f.append('image',new File([new Uint8Array([1,2,3])],'test.jpg',{type:'image/jpeg'}));const d=await(await worker.fetch(new Request('https://findit.test/api/search',{method:'POST',body:f}),env)).json();assert.equal(calls.length,3);assert.equal(d.identification.model,'X1');assert.equal(d.identification.requiresModelConfirmation,false);assert.equal(d.visionDiagnostics[0].providerErrorCode,'3040');
});
