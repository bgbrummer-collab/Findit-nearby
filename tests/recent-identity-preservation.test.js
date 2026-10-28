import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

for(const file of ['script.js','results-core-v3.js','exact-retailer-fix.js'])test(file+' retains photo identity evidence in history',()=>{
 const raw=readFileSync(new URL('../'+file,import.meta.url),'utf8');
 let source=raw.slice(raw.indexOf('function saveRecent(i)')).split('\n')[0];
 if(source.includes('function renderRecent'))source=source.slice(0,source.indexOf('function renderRecent'));
 let records=[];
 const context={window:{premiumHistoryLimit:()=>50},Date,clean:v=>String(v||''),getRecent:()=>records,premiumHistoryLimit:()=>50,renderRecent(){},localStorage:{getItem:()=>JSON.stringify(records),setItem:(_k,v)=>{records=JSON.parse(v)}}};
 vm.createContext(context);vm.runInContext(source,context);
 for(const uncertain of [false,true]){
  const identity={name:'Example headphones',brand:'Example',model:'G435',object:'headphones',category:'electronics',searchQuery:'Example G435',confidence:.85,requiresModelConfirmation:uncertain,identificationMethod:'vision-consensus'};
  context.saveRecent(identity);
  assert.deepEqual(records[0].identification,identity);
 }
 for(let n=0;n<55;n++)context.saveRecent({name:'Item '+n,searchQuery:'Item '+n});
 assert.equal(records.length,50,'Premium history retains its advertised 50 finds');
});

test('history dialog exposes all 50 Premium finds and applies the Free limit',()=>{
 const rows=Array.from({length:55},(_,n)=>({name:'Item '+n,query:'Item '+n})),body={innerHTML:''},modal={classList:{add(){},remove(){}},setAttribute(){}};
 let limit=50;
 const context={window:{addEventListener(){},premiumHistoryLimit:()=>limit},document:{querySelector:s=>s==='#fxStableModal'?modal:s==='#fxStableBody'?body:null,querySelectorAll:()=>[]},localStorage:{getItem:k=>k==='finditRecent'?JSON.stringify(rows):null},Intl};
 vm.runInNewContext(readFileSync(new URL('../dashboard-audit-controls.js',import.meta.url),'utf8'),context);
 context.window.finditDashboardAuditAction('history');assert.equal((body.innerHTML.match(/data-open-history /g)||[]).length,50);
 limit=30;context.window.finditDashboardAuditAction('history');assert.equal((body.innerHTML.match(/data-open-history /g)||[]).length,30);
});
