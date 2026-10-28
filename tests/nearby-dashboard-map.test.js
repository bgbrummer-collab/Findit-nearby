import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

test('empty nearby map is stable under repeated dashboard mutation refreshes',async()=>{
 let mutations=0,loads=0;
 const element=()=>{
  let hidden=false,text='';
  return {dataset:{},children:[],setAttribute(){},append(...xs){this.children.push(...xs);mutations++},contains(x){return this.children.includes(x)},replaceChildren(){this.children=[];mutations++},get hidden(){return hidden},set hidden(v){hidden=v;mutations++},get textContent(){return text},set textContent(v){text=v;mutations++}};
 };
 const art=element(),state={stores:[]};
 const window={finditState:state,addEventListener(){},finditLoadLeaflet(){loads++;throw new Error('Map assets unavailable')}};
 const document={readyState:'complete',head:{appendChild(){}},querySelector:()=>art,createElement:element,addEventListener(){}};
 vm.runInNewContext(readFileSync(new URL('../nearby-dashboard-map.js',import.meta.url),'utf8'),{window,document});
 const initial=mutations;
 for(let n=0;n<10;n++)await window.finditRenderNearbyMap();
 assert.equal(mutations,initial,'repeated empty rendering must not trigger a MutationObserver loop');
 state.stores=[{lat:null,lon:28},{lat:0,lon:0},{lat:91,lon:28},{lat:-25,lon:''}];
 await window.finditRenderNearbyMap();assert.equal(loads,0);assert.equal(mutations,initial);
 state.stores=[{name:'Test branch',lat:-25.78,lon:28.27}];
 await window.finditRenderNearbyMap();assert.equal(loads,1);
 const failed=mutations;
 for(let n=0;n<10;n++)await window.finditRenderNearbyMap();
 assert.equal(loads,1,'failed map assets should wait for an explicit retry');assert.equal(mutations,failed);
});
