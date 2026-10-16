import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare/worker.js';
test('store website checks reject local, encoded IP, IPv6 and credential-bearing destinations before fetching',async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;throw Error('must not fetch')});
 for(const website of ['https://127.0.0.1','https://2130706433','https://0x7f000001','https://10.0.0.1','https://192.168.0.1','https://169.254.169.254','https://172.16.1.2','https://[::1]','https://[::ffff:127.0.0.1]','https://shop.local','https://shop.internal','https://shop.localhost','https://user:password@shop.example','https://shop.example:8443','http://shop.example']){
  const response=await worker.fetch(new Request('https://findit.example/api/store-website-check',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({website})}),{});
  assert.equal(response.status,400,website);
 }
 assert.equal(calls,0);
});
