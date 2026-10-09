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
