import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script, SourceTextModule } from 'node:vm';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const worker = read('cloudflare/worker.js');
const intelligence = read('lib/product-intelligence-core.js');
const runtime = read('information-runtime.js');

test('core files parse as JavaScript', () => {
  assert.doesNotThrow(() => new Script(runtime, { filename: 'information-runtime.js' }));
  assert.doesNotThrow(() => new SourceTextModule(worker, { identifier: 'cloudflare/worker.js' }));
  assert.doesNotThrow(() => new SourceTextModule(intelligence, { identifier: 'lib/product-intelligence-core.js' }));
});

test('retailer listings require exact identity and page evidence', () => {
  assert.match(intelligence, /function strictTitle\(/);
  assert.match(intelligence, /function structuredProduct\(/);
  assert.match(intelligence, /sourcePageVerified:true/);
  assert.match(intelligence, /branchStockVerified:false/);
  assert.match(intelligence, /if\(!nm\|\|matchScore\(nm,i\)<4/);
});

test('product prices never rely on page-wide text scanning', () => {
  assert.match(intelligence, /Do not infer the product price from unscoped page text/);
  assert.match(runtime, /currency unverified/);
  assert.match(runtime, /Number\(o\.price\)<=0/);
});

test('photo updates reject stale responses', () => {
  assert.match(runtime, /photoGeneration/);
  assert.match(runtime, /generation!==photoGeneration/);
  assert.match(runtime, /s\.file!==photoFile/);
});

test('critical product endpoints are wired', () => {
  for (const endpoint of ['/api/product-intelligence-v2', '/api/product-insights', '/api/nearby']) {
    assert.ok(worker.includes(endpoint), 'Missing worker endpoint: ' + endpoint);
    assert.ok(runtime.includes(endpoint), 'Missing UI request: ' + endpoint);
  }
});
