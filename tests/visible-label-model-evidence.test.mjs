import test from 'node:test';
import assert from 'node:assert/strict';
import search from '../api/search.js';

function identity(overrides={}) {
 return {
  object:'product',name:'TP-Link product',brand:'TP-Link',model:'',size:'',color:'',barcode:'',
  category:'electronics',retailCategory:'electronics',searchQuery:'TP-Link product',confidence:.9,
  visibleText:['TL-WA850RE'],features:[],likelyStoreTypes:[],summary:'',productKind:'real_product',
  scaleClass:'handheld',brandEvidence:true,modelEvidence:false,evidence:[],verificationNote:'',
  draftChanged:false,...overrides
 };
}
function geminiResponse(value) {
 return new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(value)}]}}]}),{
  status:200,headers:{'content-type':'application/json'}
 });
}
async function identify(t,value) {
 const previous=process.env.GEMINI_API_KEY;
 process.env.GEMINI_API_KEY='unit-test-placeholder';
 t.after(()=>{if(previous===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=previous});
 t.mock.method(globalThis,'fetch',async()=>geminiResponse(value));
 const form=new FormData();
 form.append('image',new File([new Uint8Array([1,2,3])],'photo.jpg',{type:'image/jpeg'}));
 const response=await search.fetch(new Request('https://findit.test/api/search',{method:'POST',body:form}));
 assert.equal(response.status,200);
 return response.json();
}

test('readable electronics model codes in visibleText become model evidence and exact search terms',async t=>{
 const data=await identify(t,identity());
 assert.equal(data.identification.model,'TL-WA850RE');
 assert.equal(data.identification.modelEvidence,true);
 assert.equal(data.identification.modelEvidenceFromVisibleText,true);
 assert.match(data.identification.searchQuery,/TL-WA850RE/);
 assert.equal(data.identification.matchLevel,'model-unverified');
});

test('readable NIVEA Soft variant and 200 ml size are retained from the package label',async t=>{
 const photo=identity({
  name:'NIVEA product',brand:'NIVEA',object:'product',category:'beauty',retailCategory:'beauty',
  searchQuery:'NIVEA product',visibleText:['NIVEA','Soft','200 ml']
 });
 const data=await identify(t,photo);
 assert.equal(data.identification.model,'Soft');
 assert.equal(data.identification.modelEvidence,true);
 assert.equal(data.identification.modelEvidenceFromVisibleText,true);
 assert.equal(data.identification.size,'200 ml');
 assert.match(data.identification.searchQuery,/NIVEA Soft/i);
 assert.match(data.identification.searchQuery,/200 ml/i);
});
