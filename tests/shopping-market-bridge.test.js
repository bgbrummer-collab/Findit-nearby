import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../shopping-market.js',import.meta.url),'utf8');
function setup(selected='ZA',reply=()=>Response.json({offers:[]})){
 const seen=[],context={window:{fetch:async(input,init)=>{seen.push({input,init});return reply(input,init,seen.length);}},localStorage:{getItem:()=>selected},location:{href:'https://findit.test/',origin:'https://findit.test'},Request,URL,AbortController,setTimeout,clearTimeout,TypeError};
 vm.runInNewContext(source,context);return {seen,fetch:context.window.fetch};
}
for(const path of ['/api/product-intelligence-v2','/api/product-intelligence'])test('all commerce POST entry points receive shopping country '+path,async()=>{
 const s=setup();await s.fetch(path,{method:'POST',body:JSON.stringify({identification:{name:'Example E42'}})});const d=JSON.parse(s.seen[0].init.body);assert.equal(d.country,'ZA');assert.equal(d.identification.name,'Example E42');
});
test('GET recovery receives the same country and preserves existing variants',async()=>{
 const s=setup();await s.fetch('/api/product-intelligence-v2?name=Example&color=black');const u=new URL(s.seen[0].input);assert.equal(u.searchParams.get('country'),'ZA');assert.equal(u.searchParams.get('color'),'black');
});
test('explicit request markets and unrelated or cross-origin requests remain intact',async()=>{
 const s=setup();const init={method:'POST',body:JSON.stringify({country:'GB'})};await s.fetch('/api/product-intelligence-v2',init);assert.equal(s.seen[0].init.body,init.body);
 for(const path of ['/api/search','/api/feedback','https://retailer.example/api/product-intelligence-v2']){await s.fetch(path,init);assert.equal(s.seen.at(-1).input,path);assert.equal(s.seen.at(-1).init,init);}
});
test('automatic country mode delegates without rewriting',async()=>{
 const s=setup('');const init={method:'POST',body:'{"name":"Example"}'};await s.fetch('/api/product-intelligence-v2',init);assert.equal(s.seen[0].init.body,init.body);
});
test('Request-object POST paths preserve original headers and body identity',async()=>{
 const s=setup('US'),request=new Request('https://findit.test/api/product-intelligence-v2',{method:'POST',headers:{'content-type':'application/json','x-test':'retained'},body:'{"name":"Example E42"}'});
 await s.fetch(request);const actual=s.seen[0].input;assert.equal(actual.headers.get('x-test'),'retained');assert.equal((await actual.json()).country,'US');assert.equal((await request.json()).name,'Example E42');
});

test('URL-object commerce requests use the selected country',async()=>{
 const s=setup();await s.fetch(new URL('https://findit.test/api/product-intelligence-v2'));assert.equal(new URL(s.seen[0].input).searchParams.get('country'),'ZA');
});
test('retained-offer identity keys separate countries for the same product',()=>{
 const file=readFileSync(new URL('../dashboard-commerce-status.js',import.meta.url),'utf8'),line=file.split('\n').find(s=>s.startsWith('function currentIdentityKey()'));
 const key=country=>vm.runInNewContext(line+';currentIdentityKey()',{currentIdentity:()=>({name:'Example E42'}),shoppingCountry:()=>country,norm:v=>v.toLowerCase()});
 assert.notEqual(key('ZA'),key('US'));
});

test('legacy photo commerce requests recover once from transient HTML failures',async()=>{
 const s=setup('',(_,init,n)=>n===1?new Response('temporary',{status:500}):Response.json({offers:[]}));
 const r=await s.fetch('/api/product-intelligence-v2',{method:'POST',body:'{}'});assert.equal(r.status,200);assert.equal(s.seen.length,2);assert.equal(s.seen[0].init.signal,s.seen[1].init.signal);
});
test('managed read retries do not multiply attempts through the bridge',async()=>{
 const s=setup('ZA',()=>new Response('temporary',{status:503}));
 const r=await s.fetch('/api/product-intelligence-v2',{method:'POST',body:'{}',finditRetryManaged:true});assert.equal(r.status,503);assert.equal(s.seen.length,1);
});
