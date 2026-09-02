import assert from 'node:assert/strict';
import {familyOf, selectedRetailers, retailerByName} from '../lib/retailers.js';

assert.equal(familyOf('Large Capacity Pencil Case Office & School Supplies'), 'stationery');
assert.equal(familyOf('A4 notebook and highlighters'), 'stationery');

const pencilCaseRetailers = selectedRetailers('large capacity pencil case', {
  name: 'Large Capacity Pencil Case',
  category: 'Office & School Supplies',
  retailCategory: 'stationery'
});
const names = pencilCaseRetailers.map(r=>r.name);
assert.equal(names[0], 'PNA', `Expected PNA first, got ${names.slice(0,5).join(', ')}`);
assert.equal(names[1], 'Waltons', `Expected Waltons second, got ${names.slice(0,5).join(', ')}`);
assert(names.includes('Makro'), 'Makro may remain as a broad fallback retailer');
assert(names.indexOf('PNA') < names.indexOf('Makro'), 'Specialist stationery retailer must rank above broad fallback retailers');
assert(names.indexOf('Waltons') < names.indexOf('Makro'), 'Specialist stationery retailer must rank above broad fallback retailers');

const pna = retailerByName('PNA');
assert(pna, 'PNA retailer profile missing');
assert(pna.cats.includes('stationery'), 'PNA must support stationery');
assert.equal(pna.branchMode, 'location_required');

console.log('stationery retailer regression: PASS');
