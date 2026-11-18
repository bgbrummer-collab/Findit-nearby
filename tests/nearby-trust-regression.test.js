import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../api/nearby.js',import.meta.url),'utf8');
const freshnessLine=source.split('\\n').find(x=>x.startsWith('function isFresh('));
const namesLine=source.split('\\n').find(x=>x.startsWith('function relevantNames('));

test('branch stock without a valid recent source timestamp is never treated as fresh',()=>{
  assert.ok(freshnessLine);
  const now=Date.parse('2026-11-18T12:00:00Z');
  const ctx={Date:{now:()=>now,parse:value=>Date.parse(value)}};
  vm.runInNewContext(freshnessLine+';this.isFresh=isFresh',ctx);
  assert.equal(ctx.isFresh({availability:'in_stock'}),false);
  assert.equal(ctx.isFresh({checked_at:'not-a-date'}),false);
  assert.equal(ctx.isFresh({checked_at:'2026-11-18T03:59:59Z'}),false);
  assert.equal(ctx.isFresh({checked_at:'2026-11-18T11:30:00Z'}),true);
  assert.equal(ctx.isFresh({checked_at:'2026-11-18T12:01:00Z'}),false);
});

test('nearby retailer-name searches do not add the identified product brand as a store',()=>{
  assert.ok(namesLine);
  const ctx={
    queryOf:i=>i.searchQuery||i.name||i.object||'',
    clean:value=>String(value??'').trim(),
    selectedRetailers:()=>[
      {name:'Takealot',branchMode:'online_only'},
      {name:'Clicks',branchMode:'location_required'},
      {name:'Dis-Chem',branchMode:'location_required'}
    ]
  };
  vm.runInNewContext(namesLine+';this.relevantNames=relevantNames',ctx);
  assert.deepEqual(Array.from(ctx.relevantNames({
    name:'Handy Andy household cleaner',
    brand:'Handy Andy',
    category:'household'
  })),['Clicks','Dis-Chem']);
});

test('OpenStreetMap fallback does not expose phone numbers without independent verification',()=>{
  const parseLine=source.split('\\n').find(x=>x.startsWith('function parseOsm('));
  assert.ok(parseLine);
  const ctx={clean:value=>String(value??'').trim(),number:value=>Number.isFinite(Number(value))?Number(value):null,haversine:()=>1};
  vm.runInNewContext(parseLine+';this.parseOsm=parseOsm',ctx);
  const rows=ctx.parseOsm({elements:[{type:'node',id:1,lat:-25.7,lon:28.2,tags:{name:'Example Retailer',phone:'+27 12 345 6789','contact:phone':'+27 12 000 0000'}}]},-25.7,28.2);
  assert.equal(rows.length,1);
  assert.equal(rows[0].phone,'');
});
