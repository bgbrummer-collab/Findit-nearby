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
