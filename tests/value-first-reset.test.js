import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
test('new photo clears every old product/count label and repeated renders do not rewrite the value strip',()=>{
 const listeners={},nodes={};let writes=0;
 const strip={hidden:false,_html:'',get innerHTML(){return this._html},set innerHTML(v){writes++;this._html=v}};
 nodes['#fxValueStrip']=strip;nodes['#fxResultStripName']={textContent:'Old product'};nodes['#fxResultStripMeta']={textContent:'Old price'};
 const state={result:{identification:{name:'Old product',userConfirmed:true}},offers:[{product_url:'https://store.example/old',retailer:{name:'Old seller'}}],stores:[]};
 const document={readyState:'complete',documentElement:{},querySelector:s=>nodes[s]||null,querySelectorAll:()=>[],addEventListener:(e,fn)=>{listeners[e]=fn}};
 const context={document,window:{finditState:state},setTimeout:fn=>fn(),MutationObserver:class{observe(){}}};
 vm.runInNewContext(fs.readFileSync(new URL('../value-first-results.js',import.meta.url),'utf8'),context);
 assert.match(strip.innerHTML,/1 retailer listing/);assert.equal(writes,1);
 listeners['findit:dashboard-sync']();assert.equal(writes,1);
 state.result=null;state.offers=[];listeners['findit:new-photo-selected']();
 assert.equal(strip.hidden,true);assert.equal(strip.innerHTML,'');assert.equal(nodes['#fxResultStripName'].textContent,'No item selected');assert.doesNotMatch(nodes['#fxResultStripMeta'].textContent,/Old price/);
});

test('replacement photo clears the previous Smart Choice confidence before identification completes',()=>{
 const listeners={},badge={textContent:''},state={result:{identification:{name:'Old product',confidence:.65}}};
 const context={window:{finditState:state},document:{querySelector:()=>null,querySelectorAll:s=>s==='.fx-match-confidence'?[badge]:[],addEventListener:(name,fn)=>listeners[name]=fn},setTimeout:fn=>fn()};
 vm.runInNewContext(fs.readFileSync(new URL('../user-pov-relevance-guard.js',import.meta.url),'utf8'),context);
 assert.match(badge.textContent,/65%/);state.result=null;listeners['findit:new-photo-selected']();assert.equal(badge.textContent,'Confidence not supplied');
});

test('Smart Choice rerender preserves the existing quick-action node and its handlers',()=>{
 let attached=null,html='',clicked=0;const actions={click:()=>clicked++},anchor={},box={querySelector:s=>s==='.fx-open-row'?anchor:null,insertBefore:(node,before)=>{assert.equal(before,anchor);attached=node},set innerHTML(value){html=value;attached=null}};
 const source=fs.readFileSync(new URL('../smart-choice-ui.js',import.meta.url),'utf8'),start=source.indexOf('function render(){'),end=source.indexOf('function applyOpenFilter(){',start);
 const context={$:s=>s==='#fxSmartChoice'?box:s==='#fxFindQuickActions'?actions:null,scoreChoices:()=>({best:null,cheapest:null,closestStore:null,stores:[]}),knownOpenState:()=>null,confidenceLabel:()=>'',esc:x=>x,card:()=>'',openOnly:false,applyOpenFilter(){}};
 vm.runInNewContext(source.slice(start,end)+';render();render()',context);assert.ok(html.includes('fxOpenNowToggle'));assert.equal(attached,actions);attached.click();assert.equal(clicked,1);
});
test('Open Now keeps an unconfirmed backend schedule unknown instead of recalculating it in browser time',()=>{
 const source=fs.readFileSync(new URL('../smart-choice-ui.js',import.meta.url),'utf8'),start=source.indexOf('function knownOpenState('),end=source.indexOf('\nfunction ',start+1),fn=vm.runInNewContext(source.slice(start,end)+';knownOpenState',{openingText:()=> 'Mo-Su 00:00-23:59'});
 assert.equal(fn({liveHours:{status:'unknown',checkedAt:'2026-10-19T07:00:00Z'},openingHours:'Mo-Su 00:00-23:59'}),null);
 assert.equal(fn({openNow:true,liveHours:{status:'open',checkedAt:'2026-10-19T07:00:00Z'}}),true);
});
test('Open Now filters real dashboard and quick-store cards by branch identity after sorting',()=>{
 const source=fs.readFileSync(new URL('../smart-choice-ui.js',import.meta.url),'utf8'),start=source.indexOf('function applyOpenFilter(){'),end=source.indexOf('\nfunction styles()',start);
 const stores=[{name:'Closed branch',openNow:false},{name:'Open branch',openNow:true},{name:'Unknown branch',openNow:null}];
 const card=(name,dataset={})=>({dataset,hidden:false,querySelector:()=>name?{textContent:name}:null,classList:{toggle(k,v){this.owner.hidden=v}}});
 const cards=[card('Open branch',{store:'0'}),card('Closed branch'),card('Unknown branch'),card('',{store:'0'}),card('',{store:'1'})];cards.forEach(c=>c.classList.owner=c);
 const context={state:()=>({stores}),$$:selector=>{assert.match(selector,/#fxStoreList/);assert.match(selector,/#fxCheckStoresQuickBody/);return cards},norm:v=>String(v||'').toLowerCase(),knownOpenState:s=>s?.openNow??null,openOnly:true};
 vm.runInNewContext(source.slice(start,end)+';applyOpenFilter()',context);assert.deepEqual(cards.map(c=>c.hidden),[false,true,true,true,false]);
 // Turning it off restores every card; a newly rendered closed card is filtered.
 context.openOnly=false;vm.runInNewContext('applyOpenFilter()',context);assert.ok(cards.every(c=>!c.hidden));
 context.openOnly=true;cards.push(card('Closed branch'));cards.at(-1).classList.owner=cards.at(-1);vm.runInNewContext('applyOpenFilter()',context);assert.equal(cards.at(-1).hidden,true);
});
test('Open Now closest recommendation skips closed and unknown branches while retaining truthful counts',()=>{
 const source=fs.readFileSync(new URL('../smart-choice-ui.js',import.meta.url),'utf8'),start=source.indexOf('function scoreChoices(){'),end=source.indexOf('\nfunction confidenceLabel()',start);
 const stores=[{name:'Closed',distanceKm:0,openNow:false},{name:'Unknown',distanceKm:1},{name:'Open',distanceKm:2,openNow:true}];
 const context={state:()=>({stores}),currentOffers:()=>[],positive:()=>false,num:v=>v==null?null:Number(v),knownOpenState:s=>s?.openNow??null,openOnly:true};
 vm.runInNewContext(source.slice(start,end)+';result=scoreChoices()',context);assert.equal(context.result.closestStore.name,'Open');assert.equal(context.result.stores.length,3);
 context.openOnly=false;vm.runInNewContext('result=scoreChoices()',context);assert.equal(context.result.closestStore.name,'Closed');
});
