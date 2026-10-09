import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../script.js',import.meta.url),'utf8');
const handler=source.slice(source.indexOf('searchBtn.onclick=async()=>'),source.indexOf('\n\nfunction resetResults()',source.indexOf('searchBtn.onclick=async()=>')));
function client(){
  const pending=[],rendered=[],statuses=[],state={file:{name:'first.jpg'},coords:{lat:-25,lon:28},diagnostics:{},radius:10},button={};
  const ctx={state,searchBtn:button,FormData:class{append(){}},CustomEvent:class{},document:{dispatchEvent(){}},results:{classList:{remove(){}},scrollIntoView(){}},resetResults(){state.result=null},showSearchOverlay(){},hideSearchOverlay(){},finditSearchRequest(){return new Promise(resolve=>pending.push(data=>resolve({ok:true,json:async()=>data})))},renderIdentification(i){rendered.push(i.name)},syncExactDashboardResult(){},loadProductIntelligence(){},renderOffers(){},renderFreeActions(){},renderStores(){},updateMap(){},showWarning(){},showNothing(){},saveRecent(){},trackFindIt(){},setStatus(t){statuses.push(t)},loadNearby:async()=>{}};
  vm.runInNewContext(handler,ctx);
  return {state,button,pending,rendered,statuses};
}
test('an older photo cannot overwrite a later photo result',async()=>{
  const c=client(),first=c.button.onclick();c.state.file={name:'second.jpg'};const second=c.button.onclick();
  c.pending[1]({identification:{name:'Second item',confidence:.8}});await second;
  c.pending[0]({identification:{name:'First item',confidence:.8}});await first;
  assert.equal(c.state.result.identification.name,'Second item');assert.deepEqual(c.rendered,['Second item']);
});
test('a photo response cannot overwrite a typed search',async()=>{
  const c=client(),pending=c.button.onclick();c.state.file=null;c.state.result={identification:{name:'Typed item'}};
  c.pending[0]({identification:{name:'Old photo',confidence:.8}});await pending;
  assert.equal(c.state.result.identification.name,'Typed item');assert.equal(c.rendered.length,0);
});
test('uncertain photos finish once with manual-input guidance, without repeated inference calls',async()=>{
  const c=client(),pending=c.button.onclick();c.pending[0]({identification:null,requiresUserInput:true,retryable:true});await pending;
  assert.equal(c.pending.length,1);assert.match(c.statuses.at(-1),/clearer photo.*product name or barcode/i);assert.equal(c.button.disabled,false);
});
