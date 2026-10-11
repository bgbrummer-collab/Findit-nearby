import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function runtime(){
 const elements=new Map(),modal={style:{},removeAttribute(){},classList:{contains:()=>false,add(){},remove(){}}};
 modal.querySelector=s=>elements.get(s)||null;const body={innerHTML:''};elements.set('#fxInformationModal',modal);elements.set('#fxInformationBody',body);
 for(const id of ['#fxInfoCompare','#fxInfoRetry','#fxInfoCorrect'])elements.set(id,{});
 let finish;const context={window:{finditState:{result:{identification:{name:'Product A'}}}},document:{querySelector:s=>elements.get(s)||null,querySelectorAll:()=>[],addEventListener(){},createElement:()=>({}),head:{appendChild(){} }},fetch:()=>new Promise(r=>finish=r),AbortController,setTimeout,clearTimeout,Intl,console};
 context.window.addEventListener=()=>{};
 let source=readFileSync(new URL('../information-runtime.js',import.meta.url),'utf8').replace('window.finditRunProductSearch=runSearch;','window.finditRunProductSearch=runSearch;window.testInfo=showProductInfo;');
 vm.runInNewContext(source,context);
 return {context,body,elements,finish:async(data)=>{finish({ok:true,json:async()=>data});await new Promise(r=>setImmediate(r));}};
}
test('delayed product research never reopens a closed Product Info panel',async()=>{const r=runtime();r.context.window.testInfo();const original=r.body.innerHTML;await r.finish({researched:true,whatItDoes:'A verified description'});assert.equal(r.body.innerHTML,original);r.context.window.testInfo();assert.match(r.body.innerHTML,/A verified description/)});
test('research for an old product cannot overwrite the next product',async()=>{const r=runtime();r.context.window.testInfo();r.context.window.finditState.result.identification={name:'Product B'};await r.finish({researched:true,whatItDoes:'Old product description'});r.context.window.testInfo();assert.doesNotMatch(r.body.innerHTML,/Old product description/);assert.match(r.body.innerHTML,/Product B/);await r.finish({researched:false})});
test('a failed research request settles the retry control',async()=>{const r=runtime();r.elements.set('#fxInformationModal.open #fxInfoRetry',r.elements.get('#fxInfoRetry'));r.context.window.testInfo();await r.finish({researched:false});assert.equal(r.elements.get('#fxInfoRetry').disabled,false);assert.equal(r.elements.get('#fxInfoRetry').textContent,'Refresh product information')});
test('saved items merge storage sources and flatten collection products',()=>{
 const values={finditSaved:[{name:'Soap',query:'Soap'}],findit_v10_collections:[{name:'Collection title',items:[{name:'Shampoo'}]}],findit_favourites:[{item:'Comb'}]};const body={innerHTML:''},modal={style:{},removeAttribute(){},classList:{add(){},remove(){}},setAttribute(){}};
 const context={window:{addEventListener(){}},document:{querySelector:s=>s==='#fxStableModal'?modal:s==='#fxStableBody'?body:null,querySelectorAll:()=>[]},localStorage:{getItem:k=>JSON.stringify(values[k]||[])},Intl,console};
 vm.runInNewContext(readFileSync(new URL('../dashboard-audit-controls.js',import.meta.url),'utf8'),context);context.window.finditDashboardAuditAction('saved');for(const name of ['Soap','Shampoo','Comb'])assert.match(body.innerHTML,new RegExp(name));assert.doesNotMatch(body.innerHTML,/Collection title/);assert.match(body.innerHTML,/Open product/);
});
test('shopping snapshots reject old offers and uncertain product identities',()=>{
 const oldOffer={retailer:{name:'Old Retailer'},price:230,currency:'ZAR',product_url:'https://example.com/old',exactProductMatch:true,verified:true};
 const context={window:{finditState:{result:{identification:{name:'New product'}},offers:[]},productIntelligence:{offers:[oldOffer]}},document:{readyState:'loading',addEventListener(){}},localStorage:{getItem:()=>null,setItem(){}},setTimeout(){},Intl};
 const source=readFileSync(new URL('../shopping-assistant-ui.js',import.meta.url),'utf8').replace('window.finditShoppingAssistantRefresh=refresh;','window.finditShoppingAssistantRefresh=refresh;window.testSnapshot=snapshot;');vm.runInNewContext(source,context);
 assert.equal(context.window.testSnapshot().offers.length,0);context.window.finditState.offers=[oldOffer];assert.equal(context.window.testSnapshot().offers.length,1);context.window.finditState.result.identification.requiresModelConfirmation=true;assert.equal(context.window.testSnapshot().offers.length,0);
});
