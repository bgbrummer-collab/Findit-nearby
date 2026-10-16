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
