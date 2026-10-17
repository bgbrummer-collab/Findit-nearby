import test from 'node:test';import assert from 'node:assert/strict';import worker from '../cloudflare/worker.js';
const request=()=>new Request('https://findit.test/api/nearby',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({lat:-25.78,lon:28.27,identification:{object:'conditioner'}})});
test('provider outages are distinguished from a successful empty nearby search',async t=>{
 let available=false;t.mock.method(globalThis,'fetch',async()=>available?new Response(JSON.stringify({elements:[]})):new Response('unavailable',{status:503}));
 const failed=await(await worker.fetch(request(),{})).json();assert.equal(failed.discoveryAvailable,false);assert.match(failed.message,/could not be retrieved/);assert.doesNotMatch(failed.message,/No relevant nearby retailers were found/);
 available=true;const empty=await(await worker.fetch(request(),{})).json();assert.equal(empty.discoveryAvailable,true);assert.match(empty.message,/No relevant nearby retailers were found/);assert.equal(empty.branchStockVerified,false);
});
