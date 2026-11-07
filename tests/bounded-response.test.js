import test from 'node:test';import assert from 'node:assert/strict';
import {boundedResponseText} from '../lib/bounded-response.js';
test('large publisher bodies are stopped while reading rather than buffered whole',async()=>{
 let cancelled=false,reads=0;const response=new Response(new ReadableStream({pull(c){reads++;c.enqueue(new Uint8Array(100000).fill(65));},cancel(){cancelled=true;}}));
 assert.equal((await boundedResponseText(response,120000)).length,120000);assert.equal(cancelled,true);assert.ok(reads<=3);
});
test('streaming reads preserve complete UTF-8 across chunk boundaries',async()=>{
 const bytes=new TextEncoder().encode('Source café product'),stream=new ReadableStream({start(c){c.enqueue(bytes.slice(0,11));c.enqueue(bytes.slice(11));c.close();}});assert.equal(await boundedResponseText(new Response(stream),100),'Source café product');
});
