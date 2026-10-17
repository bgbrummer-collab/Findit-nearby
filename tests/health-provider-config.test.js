import test from 'node:test';import assert from 'node:assert/strict';import handler from '../api/health-router.js';
test('legacy health recognizes configured Gemini without asserting a successful inference',async t=>{
 const before=process.env.GEMINI_API_KEY;t.after(()=>{if(before===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=before;});process.env.GEMINI_API_KEY='unit-test-placeholder';let status,data;const res={setHeader(){},status(n){status=n;return this},json(d){data=d;return this}};
 await handler({query:{}},res);assert.equal(status,200);assert.equal(data.visionProvider,'google-gemini');assert.equal(data.checksAreConfigurationOnly,true);assert.equal(JSON.stringify(data).includes('unit-test-placeholder'),false);
});
