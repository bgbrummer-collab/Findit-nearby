import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

function runtime(){
 const events={},inputEvents={},pending=[];let scrolls=0;
 const button={classList:{add(){}},getBoundingClientRect:()=>({top:-100,bottom:-50}),scrollIntoView(){scrolls++}};
 const input={dataset:{},addEventListener(name,fn){inputEvents[name]=fn}};
 const document={readyState:'complete',querySelector:s=>s==='#photo'?input:s==='#fxSearchNow'?button:null,createElement:()=>({}),head:{appendChild(){}},documentElement:{classList:{add(){}}},addEventListener(name,fn){(events[name]??=[]).push(fn)}};
 const context={window:{innerHeight:900},document,setTimeout:fn=>pending.push(fn),requestAnimationFrame:fn=>pending.push(fn)};
 vm.runInNewContext(fs.readFileSync(new URL('../upload-search-stability.js',import.meta.url),'utf8'),context);
 const flush=()=>{while(pending.length)pending.shift()()};flush();
 return{photo:()=>inputEvents.change(),search:()=>{for(const fn of events.click||[])fn({target:{closest:s=>s.includes('#fxSearchNow')?button:null}})},flush,scrolls:()=>scrolls};
}

test('photo selection brings its primary action into view',()=>{
 const r=runtime();r.photo();r.flush();assert.ok(r.scrolls()>0);
});
test('delayed upload scrolling cannot steal the viewport after search starts',()=>{
 const r=runtime();r.photo();r.search();const before=r.scrolls();r.flush();assert.equal(r.scrolls(),before);
});
