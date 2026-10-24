import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare/worker.js';
const request=(path,body,type='application/json')=>new Request('https://findit.test'+path,{method:'POST',headers:{'content-type':type},body});

test('malformed search inputs return actionable input errors without invoking providers',async t=>{
  let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;throw Error('No external calls expected')});
  for(const body of ['null','[]','123','"hello"','{',JSON.stringify({query:{name:'Sony'}}),JSON.stringify({barcode:5449000000996}),JSON.stringify({query:'Sony '+ 'a'.repeat(240)})]){
    const r=await worker.fetch(request('/api/search',body),{AI:{run(){calls++;throw Error('No inference expected')}}});
    assert.equal(r.status,400,body);
    const d=await r.json();assert.equal(d.code,'INVALID_SEARCH_INPUT');assert.equal(d.imageAccepted,false);assert.equal(d.retryable,false);assert.ok(d.error);
  }
  assert.equal(calls,0);
});
test('unsupported search payload and broken multipart data are not reported as photo-service outages',async()=>{
  const unsupported=await worker.fetch(request('/api/search','Sony headphones','text/plain'),{});
  assert.equal(unsupported.status,415);assert.equal((await unsupported.json()).imageAccepted,false);
  const broken=await worker.fetch(request('/api/search','broken','multipart/form-data; boundary=missing'),{});
  assert.equal(broken.status,400);assert.equal((await broken.json()).code,'INVALID_SEARCH_INPUT');
});
test('valid aliases remain usable and an overlong search never silently loses its size qualifier',async()=>{
  const response=await worker.fetch(request('/api/search',JSON.stringify({searchQuery:'Sony WH-1000XM5 black'})),{});
  assert.equal(response.status,200);assert.equal((await response.json()).identification.name,'Sony WH-1000XM5 black');
  const long=await worker.fetch(request('/api/search',JSON.stringify({query:'Long product description '.repeat(12)+'1.5L'})),{});
  assert.equal(long.status,400);assert.match((await long.json()).error,/too long/);
});
test('null and array payloads cannot crash product information, assistant or feedback routes',async()=>{
  for(const body of ['null','[]'])for(const [path,status] of [['/api/assistant',400],['/api/feedback',400],['/api/product-insights',200],['/api/product-intelligence-v2',200]]){
    const r=await worker.fetch(request(path,body),{});assert.equal(r.status,status,path);
    const data=await r.json();assert.ok(data&&typeof data==='object');
    if(path==='/api/product-insights')assert.equal(data.researched,false);
    if(path==='/api/product-intelligence-v2')assert.deepEqual(data.offers,[]);
  }
});
