import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source = name => readFileSync(new URL('../'+name, import.meta.url), 'utf8');

test('invalid chooser and dropped files are stopped before upload bridges mutate the current Find', () => {
  const handlers = {}, status = {setAttribute(){}}, window = {};
  vm.runInNewContext(source('upload-validation.js'), {window, document:{getElementById:()=>status, addEventListener:(name, fn)=>handlers[name]=fn}});
  for (const file of [{type:'text/plain',size:20},{type:'image/jpeg',size:0},{type:'image/png',size:8*1024*1024+1}]) {
    for (const type of ['change','drop']) {
      let blocked = false, prevented = false;
      const target = {matches:()=>true, closest:()=>true, files:[file], value:'selected'};
      handlers[type]({type,target,dataTransfer:{files:[file]},preventDefault(){prevented=true},stopImmediatePropagation(){blocked=true}});
      assert.equal(blocked,true); assert.equal(prevented,true); assert.ok(status.textContent);
      if (type==='change') assert.equal(target.value,'');
    }
  }
  assert.equal(window.finditValidateUpload({type:'image/jpeg',size:8*1024*1024}),true);
});

function nearbyClient() {
  const pending = [], published = [], state = {coords:{lat:-25,lon:28},result:{identification:{}},file:null,diagnostics:{},stores:[]};
  const ctx = {state, nearbyStores:{},fetch:()=>new Promise(resolve=>pending.push(resolve)),recordNearbyAnalyticsFromResponse(){},renderStores(){published.push(state.stores.map(x=>x.name))},updateMap(){},nothingFound:{classList:{add(){}}},document:{dispatchEvent(){}},CustomEvent:class{},showNothing(){},trackFindIt(){},AbortController,setTimeout,clearTimeout};
  const code = source('script.js');
  vm.runInNewContext(code.slice(code.indexOf('async function loadNearby('),code.indexOf('\nfunction renderStores()'))+';this.load=loadNearby',ctx);
  const finish=(index,name)=>pending[index]({ok:true,json:async()=>({ok:true,stores:[{name}]})});
  return {state,ctx,published,finish,pending};
}

test('changing location cannot publish an old location response, including errors', async () => {
  const c=nearbyClient(); const old=c.ctx.load({},10);
  c.state.coords={lat:-33,lon:18}; const next=c.ctx.load({},10);
  c.finish(1,'Cape Town'); await next; c.finish(0,'Pretoria'); await old;
  assert.equal(c.state.stores[0].name,'Cape Town'); assert.equal(c.published.length,1);
});

test('changing radius rejects a slower previous nearby request for the same product and coordinates', async () => {
  const c=nearbyClient(); const old=c.ctx.load({},25), next=c.ctx.load({},3);
  c.finish(1,'Inside 3 km'); await next; c.finish(0,'Outside 3 km'); await old;
  assert.equal(c.state.stores[0].name,'Inside 3 km'); assert.equal(c.published.length,1);
});
