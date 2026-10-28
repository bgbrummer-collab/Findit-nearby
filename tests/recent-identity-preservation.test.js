import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

for(const file of ['script.js','results-core-v3.js','exact-retailer-fix.js'])test(file+' retains photo identity evidence in history',()=>{
 const raw=readFileSync(new URL('../'+file,import.meta.url),'utf8');
 let source=raw.slice(raw.indexOf('function saveRecent(i)')).split('\n')[0];
 if(source.includes('function renderRecent'))source=source.slice(0,source.indexOf('function renderRecent'));
 let records=[];
 const context={Date,clean:v=>String(v||''),getRecent:()=>records,premiumHistoryLimit:()=>50,renderRecent(){},localStorage:{getItem:()=>JSON.stringify(records),setItem:(_k,v)=>{records=JSON.parse(v)}}};
 vm.createContext(context);vm.runInContext(source,context);
 for(const uncertain of [false,true]){
  const identity={name:'Example headphones',brand:'Example',model:'G435',object:'headphones',category:'electronics',searchQuery:'Example G435',confidence:.85,requiresModelConfirmation:uncertain,identificationMethod:'vision-consensus'};
  context.saveRecent(identity);
  assert.deepEqual(records[0].identification,identity);
 }
});
