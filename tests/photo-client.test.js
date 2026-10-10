import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../script.js',import.meta.url),'utf8');
const handler=source.slice(source.indexOf('searchBtn.onclick=async()=>'),source.indexOf('\n\nfunction resetResults()',source.indexOf('searchBtn.onclick=async()=>')));
function client(){
  const pending=[],rendered=[],statuses=[],state={file:{name:'first.jpg'},coords:{lat:-25,lon:28},diagnostics:{},radius:10},button={},visibleButton={disabled:true};
  const ctx={state,searchBtn:button,FormData:class{append(){}},CustomEvent:class{},document:{dispatchEvent(){},getElementById(id){return id==='fxSearchNow'?visibleButton:null}},results:{classList:{remove(){}},scrollIntoView(){}},resetResults(){state.result=null},showSearchOverlay(){},hideSearchOverlay(){},finditSearchRequest(){return new Promise(resolve=>pending.push(data=>resolve({ok:true,json:async()=>data})))},renderIdentification(i){rendered.push(i.name)},syncExactDashboardResult(){},loadProductIntelligence(){},renderOffers(){},renderFreeActions(){},renderStores(){},updateMap(){},showWarning(){},showNothing(){},saveRecent(){},trackFindIt(){},setStatus(t){statuses.push(t)},loadNearby:async()=>{}};
  vm.runInNewContext(handler,ctx);
  return {state,button,visibleButton,pending,rendered,statuses};
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
  assert.equal(c.pending.length,1);assert.match(c.statuses.at(-1),/product name.*barcode/i);assert.equal(c.button.disabled,false);assert.equal(c.visibleButton.disabled,false);
});

test('service limits are explained instead of blaming photo clarity',async()=>{
 const c=client(),pending=c.button.onclick();
 c.pending[0]({identification:null,requiresUserInput:true,code:'PHOTO_DAILY_LIMIT_REACHED',message:'Photo identification has reached its daily service limit. Search by product name or barcode.',retryable:false});
 await pending;assert.match(c.statuses.at(-1),/daily service limit/);assert.doesNotMatch(c.statuses.at(-1),/clearer photo/);assert.equal(c.pending.length,1);
});

test('overlay cleanup immediately releases the page without a delayed timer racing a new search',()=>{
 const hidden=new Set(),progress={style:{}},overlay={classList:{add:x=>hidden.add(x)}},dropzone={classList:{remove(){}}};
 const code=source.slice(source.indexOf('function hideSearchOverlay()'),source.indexOf(String.fromCharCode(10),source.indexOf('function hideSearchOverlay()')));
 const ctx={stageTimer:1,clearInterval(){},dropzone,$:s=>s==='#searchProgress'?progress:overlay};
 vm.runInNewContext(code+';hideSearchOverlay()',ctx);
 assert.equal(hidden.has('hidden'),true);assert.equal(progress.style.width,'100%');
});

test('repeat activation while the same photo is pending starts only one inference request',async()=>{
 const c=client(),first=c.button.onclick();await c.button.onclick();
 assert.equal(c.pending.length,1);assert.equal(c.state.photoSearchPending,1);
 c.pending[0]({identification:null,requiresUserInput:true});await first;
 assert.equal(c.state.photoSearchPending,null);assert.equal(c.button.disabled,false);assert.equal(c.visibleButton.disabled,false);
});
