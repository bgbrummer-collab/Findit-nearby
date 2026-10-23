import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../smart-choice-ui.js',import.meta.url),'utf8');
const snippet=source.slice(source.indexOf('function matchStore('),source.indexOf('\nfunction confidenceLabel()'));
function choices(offer){const stores=[{id:'branch-1',name:'Acme Menlyn',distanceKm:.1,openNow:true}],context={state:()=>({stores}),currentOffers:()=>[offer],positive:v=>Number(v)>0,num:v=>v==null?null:Number(v),norm:v=>String(v||'').toLowerCase(),knownOpenState:s=>s?.openNow??null,openOnly:false};return vm.runInNewContext(snippet+';scoreChoices()',context);}
test('chain online price never inherits nearest branch distance or opening state',()=>{const r=choices({retailer:'Acme',price:230,currency:'ZAR',availability:'in_stock',distanceKm:.1});assert.equal(r.best.store,null);assert.equal(r.best.distance,null);assert.equal(r.best.open,null);assert.equal(r.closestStore.name,'Acme Menlyn');});
test('branch evidence must name the matching branch, not just the chain',()=>{assert.equal(choices({retailer:'Acme',price:230,currency:'ZAR',branchPriceVerified:true}).best.store,null);assert.equal(choices({retailer:'Acme',price:230,currency:'ZAR',branchPriceVerified:true,branchId:'other'}).best.store,null);});
test('explicit branch price evidence retains verified distance and opening state',()=>{const r=choices({retailer:'Acme',price:230,currency:'ZAR',branchPriceVerified:true,branchId:'branch-1'});assert.equal(r.best.distance,.1);assert.equal(r.best.open,true);});

const offerSnippet=source.slice(source.indexOf('function currentOffers(){'),source.indexOf('function openingText('));
test('Smart Choice requires exact identity and independent source evidence',()=>{const run=(offers,i={})=>vm.runInNewContext(offerSnippet+';currentOffers()',{state:()=>({offers,result:{identification:i}}),window:{},norm:v=>String(v||''),retailerName:o=>o.retailer||'',positive:v=>Number(v)>0});assert.equal(run([{retailer:'A',price:1,verified:true}]).length,0);assert.equal(run([{retailer:'A',price:1,exactProductMatch:true}]).length,0);const good={retailer:'A',price:1,exactProductMatch:true,sourcePageVerified:true};assert.equal(run([good]).length,1);assert.equal(run([good],{requiresModelConfirmation:true}).length,0);});

test('branch stock evidence alone does not turn an online price into a branch price',()=>{const r=choices({retailer:'Acme',price:230,currency:'ZAR',branchStockVerified:true,branchId:'branch-1'});assert.equal(r.best.store,null);assert.equal(r.best.distance,null);});
