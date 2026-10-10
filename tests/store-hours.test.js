import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scheduleStatus,branchHours} from '../lib/store-hours.js';
import worker from '../cloudflare/worker.js';
const friday=new Date('2026-10-09T08:00:00Z');
test('published branch schedule uses the branch time zone',()=>{
  assert.equal(scheduleStatus('Mo-Fr 09:00-17:00','Africa/Johannesburg',friday).status,'open');
  assert.equal(scheduleStatus('Mo-Fr 09:00-17:00','UTC',friday).status,'closed');
});
test('closing time is exclusive and unknown/complex schedules are not guessed',()=>{
  assert.equal(scheduleStatus('Mo-Fr 09:00-17:00','Africa/Johannesburg',new Date('2026-10-09T15:00:00Z')).status,'closed');
  for(const hours of ['Mo-Fr 09:00-17:00; PH off','Mo-Fr 22:00-02:00','Mo-Fr 09:00-17:00; Fr 08:00-19:00','Mo-Fr 09:99-17:00'])assert.equal(scheduleStatus(hours,'Africa/Johannesburg',friday).status,'unknown',hours);
  assert.equal(scheduleStatus('Mo-Fr 09:00-17:00','',friday).status,'unknown');
});
test('always-open schedule requires no time-zone inference',()=>assert.equal(scheduleStatus('24/7','',friday).status,'open'));
test('branch enrichment covers all twelve retailers and keeps same-chain branches separate',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({elements:[{type:'node',id:321,lat:-25.7,lon:28.2,tags:{name:'Clicks',phone:'+27123456789',website:'https://clicks.co.za',opening_hours:'24/7','addr:street':'Branch Road'}}]})));
 const stores=Array.from({length:12},(_,n)=>({name:'Clicks',lat:-25.7+n*.01,lon:28.2,address:''}));
 const d=await branchHours({stores});assert.equal(d.stores.length,12);assert.equal(d.stores[0].phone,'+27123456789');assert.equal(d.stores[0].publishedAddress,'Branch Road');assert.equal(d.stores[0].branchDetailsVerified,true);assert.equal(d.stores[1].phone,'');assert.equal(d.stores[1].branchDetailsVerified,false);
});
test('hours are fetched for the correct named branch; client hours are not evidence',async t=>{
  t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({elements:[{type:'node',id:123,lat:-25.7479,lon:28.2293,tags:{name:'Checkers',opening_hours:'24/7'}},{type:'node',id:124,lat:-25.7479,lon:28.2293,tags:{name:'Unrelated',opening_hours:'24/7'}}]}),{headers:{'content-type':'application/json'}}));
  const data=await branchHours({stores:[{name:'Checkers',lat:-25.7479,lon:28.2293},{name:'Missing store',lat:-25.7479,lon:28.2293,publishedHours:'24/7'}]});
  assert.equal(data.stores[0].status,'open');assert.equal(data.stores[0].hoursVerified,true);assert.match(data.stores[0].sourceUrl,/node\/123$/);
  assert.equal(data.stores[1].status,'unknown');assert.equal(data.stores[1].hoursVerified,false);
});
test('store-hours route does not fall through to Message required',async t=>{
  t.mock.method(globalThis,'fetch',async()=>{throw Error('offline')});
  const r=await worker.fetch(new Request('https://findit.test/api/assistant?action=store-hours',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({stores:[{name:'Checkers',lat:-25.7479,lon:28.2293}]})}),{});
  const d=await r.json();assert.equal(r.status,200);assert.equal(d.ok,true);assert.equal(d.retryable,false);assert.equal(d.stores[0].status,'unknown');assert.equal(d.stores[0].todayHours,'');
});
