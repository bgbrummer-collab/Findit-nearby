import test from 'node:test';import assert from 'node:assert/strict';import {boundedSettled} from '../lib/bounded-tasks.js';
test('source tasks retain all results and failures while bounding simultaneous bodies',async()=>{
 let active=0,peak=0;const results=await boundedSettled([0,1,2,3,4,5],async n=>{active++;peak=Math.max(peak,active);try{await new Promise(r=>setTimeout(r,2));if(n===2)throw Error('source unavailable');return n;}finally{active--;}},2);
 assert.equal(peak,2);assert.equal(results.length,6);assert.equal(results[2].status,'rejected');assert.deepEqual(results.filter(r=>r.status==='fulfilled').map(r=>r.value),[0,1,3,4,5]);
});
