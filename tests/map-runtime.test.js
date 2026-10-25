import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync, existsSync} from 'node:fs';
const source=readFileSync(new URL('../map-runtime.js',import.meta.url),'utf8');
function setup(){
 const nodes=[],timers=new Map();let id=0;
 const window={},document={head:{appendChild(el){nodes.push(el)}},createElement(tag){return {tag,remove(){this.removed=true}}},addEventListener(){}};
 vm.runInNewContext(source,{window,document,setTimeout(fn){timers.set(++id,fn);return id},clearTimeout(id){timers.delete(id)}});
 return {window,nodes,timers};
}
const leaflet={map(){},tileLayer(){}};
test('map requests share a load, use local assets, and wait for both CSS and JS',async()=>{
 const {window,nodes}=setup(),a=window.finditLoadLeaflet(),b=window.finditLoadLeaflet();assert.equal(a,b);assert.equal(nodes.length,2);
 assert.match(nodes[0].href,/^\/assets\/leaflet\//);assert.match(nodes[1].src,/^\/assets\/leaflet\//);
 window.L=leaflet;nodes[1].onload();nodes[0].onload();assert.equal(await a,leaflet);
 await window.finditLoadLeaflet();assert.equal(nodes.length,2);
});
test('failed script is removed and next user attempt can recover without a reload',async()=>{
 const {window,nodes}=setup(),a=window.finditLoadLeaflet();nodes[0].onload();nodes[1].onerror();await assert.rejects(a,/unavailable/);assert.equal(nodes[1].removed,true);
 const b=window.finditLoadLeaflet();assert.equal(nodes.length,3);window.L=leaflet;nodes[2].onload();assert.equal(await b,leaflet);
});
test('CSS failure retries styling even when JavaScript has loaded',async()=>{
 const {window,nodes}=setup(),a=window.finditLoadLeaflet();window.L=leaflet;nodes[0].onerror();nodes[1].onload();await assert.rejects(a);
 const b=window.finditLoadLeaflet();assert.equal(nodes.length,3);assert.equal(nodes[2].tag,'link');nodes[2].onload();await b;
});
test('hung downloads time out and permit a later attempt',async()=>{
 const {window,nodes,timers}=setup(),a=window.finditLoadLeaflet();for(const fn of [...timers.values()])fn();await assert.rejects(a,/timed out/);assert.ok(nodes.every(n=>n.removed));
 const b=window.finditLoadLeaflet();window.L=leaflet;nodes[2].onload();nodes[3].onload();await b;
});
test('tile errors and stalls report uncertainty; recovered imagery clears it; teardown cancels timer',()=>{
 const {window,timers}=setup(),events={},mapEvents={},messages=[];
 const layer={on(n,fn){events[n]=fn;return this},addTo(){return this}};
 window.finditAddMapTiles({tileLayer(){return layer}},{on(n,fn){mapEvents[n]=fn}},s=>messages.push(s));
 events.loading();events.tileerror();events.load();assert.match(messages.at(-1),/imagery could not load/);
 events.loading();events.load();assert.equal(messages.at(-1),'');
 events.loading();for(const fn of [...timers.values()])fn();assert.match(messages.at(-1),/coordinates/);
 mapEvents.unload();assert.equal(timers.size,0);
});
test('vendored Leaflet includes license and every CSS/marker image dependency',()=>{
 for(const name of ['LICENSE','leaflet.js','leaflet.css','images/marker-icon.png','images/marker-icon-2x.png','images/marker-shadow.png','images/layers.png','images/layers-2x.png'])assert.ok(existsSync(new URL('../assets/leaflet/'+name,import.meta.url)),name);
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.ok(html.indexOf('src="map-runtime.js"')<html.indexOf('src="script.js'));
});
