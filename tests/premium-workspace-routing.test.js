import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../big-clean-fix.js',import.meta.url),'utf8');
const run=source.slice(source.indexOf('function run(a)'),source.indexOf("window.addEventListener('click'"));
test('workspace search tools use maintained actions even after legacy globals are overwritten',()=>{
  const calls=[];
  const c={close(){},hideLegacy(){},window:{finditAuditedPremiumAction:a=>calls.push(a),v10Exact(){throw Error('legacy external search')}},document:{createElement(){throw Error('Synthetic legacy routing must not run')}},localStorage:{}};
  vm.runInNewContext(run+';this.run=run',c);
  for(const a of ['exact','manual','assistant'])c.run(a);
  assert.deepEqual(calls,['exact','manual','assistant']);
});
test('Exact Match on a partial photo opens evidence review without researching an assumed model',()=>{
  const source=readFileSync(new URL('../premium-tool-audit-fix.js',import.meta.url),'utf8');let reviewed=0;
  const c={id:()=>({requiresModelConfirmation:true}),window:{finditOpenCurrentProductInfo(){reviewed++}},close(){},query(){throw Error('Do not turn a partial identity into an exact search')},runLookup(){throw Error('Do not query assumed model')}};
  vm.runInNewContext(source.split('\n').find(x=>x.startsWith('function exact('))+';exact()',c);
  assert.equal(reviewed,1);
});
