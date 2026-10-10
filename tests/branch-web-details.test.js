import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseBranchDetails,researchBranchDetails} from '../lib/branch-web-details.js';
const html=node=>'<script type="application/ld+json">'+JSON.stringify(node)+'</script>';
const branch={name:'Clicks',address:'123 Brooklyn Road Pretoria',lat:-25.77,lon:28.23};
const node={'@type':'Pharmacy',name:'Clicks Brooklyn',address:{streetAddress:'123 Brooklyn Road',addressLocality:'Pretoria'},telephone:'+27123456789',openingHoursSpecification:[{dayOfWeek:['https://schema.org/Monday','https://schema.org/Tuesday'],opens:'09:00',closes:'17:00'}]};
test('Clicks branch HTML selects the shop phone and excludes the corporate footer',()=>{
 const page='<h1>Middestad Mall</h1><strong>Address</strong><span>247 Pretorius St, Pretoria Central</span><div class="store-hours"><dl><dt>Monday</dt><dd>08.00 - 18.00</dd><dt>Shop telephone 1</dt><dd><span>012 322 1111</span></dd></dl></div><footer>Customer Service Centre 0860 254 257</footer>';
 const d=parseBranchDetails(page,{name:'Clicks',address:'247 Pretorius St Pretoria Central'},'https://clicks.co.za/store/Middestad/309');assert.equal(d.phone,'012 322 1111');assert.equal(d.todayHours,'Mo 08:00-18:00');assert.equal(parseBranchDetails(page,{name:'Clicks',address:'888 Wrong Avenue'},'https://clicks.co.za/store/Middestad/309'),null);
});
test('official branch evidence supplies actual contact details and a published schedule',()=>{
 const d=parseBranchDetails(html(node),branch,'https://clicks.co.za/branch');assert.equal(d.phone,'+27123456789');assert.equal(d.todayHours,'Mo 09:00-17:00; Tu 09:00-17:00');assert.equal(d.branchDetailsVerified,true);
});
test('corporate data, another branch and a single shared address token are rejected',()=>{
 assert.equal(parseBranchDetails(html({...node,address:{streetAddress:'Another Road',addressLocality:'Pretoria'}}),branch,'https://clicks.co.za'),null);
 assert.equal(parseBranchDetails(html({...node,name:'Unrelated Pharmacy'}),branch,'https://clicks.co.za'),null);
 assert.equal(parseBranchDetails(html({...node,address:{streetAddress:'Brooklyn Avenue'}}),branch,'https://clicks.co.za'),null);
});
test('published coordinates can corroborate a branch despite address formatting differences',()=>{
 const d=parseBranchDetails(html({...node,address:{streetAddress:'Shop 5'},geo:{latitude:branch.lat,longitude:branch.lon}}),branch,'https://clicks.co.za/branch');assert.ok(d);
});
test('branch search reads only matching official domains, then checks the actual branch',async t=>{
 let fetched=[];t.mock.method(globalThis,'fetch',async url=>{fetched.push(String(url));return String(url).includes('bing.com')?new Response('<rss><link>https://unrelated.example/branch</link><link>https://clicks.co.za/branch-test-444</link></rss>'):new Response(html(node));});
 const d=await researchBranchDetails(branch);assert.equal(d.phone,'+27123456789');assert.equal(fetched.length,2);assert.ok(fetched.every(u=>!u.includes('unrelated.example')));
});
