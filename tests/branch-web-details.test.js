import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseBranchDetails,researchBranchDetails,parsePublishedHours} from '../lib/branch-web-details.js';
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
test('missing map address does not prevent coordinate-matched branch research',async t=>{
 const store={name:'Computer Mania',lat:-25.801,lon:28.311};
 const official={...node,name:'Computer Mania Test Branch',address:{streetAddress:'Shop 12 Example Centre'},geo:{latitude:store.lat,longitude:store.lon}};
 t.mock.method(globalThis,'fetch',async url=>String(url).includes('bing.com')?new Response('<rss><link>https://computermania.co.za/pages/test-branch</link></rss>'):new Response(html(official)));
 const d=await researchBranchDetails(store);assert.ok(d);assert.equal(d.publishedAddress,'Shop 12 Example Centre');assert.equal(d.phone,'+27123456789');
});
test('missing address still rejects a different branch with the same chain name',()=>{
 const store={name:'Computer Mania',lat:-25.8,lon:28.3};
 assert.equal(parseBranchDetails(html({...node,name:'Computer Mania',geo:{latitude:-26.2,longitude:28.0}}),store,'https://computermania.co.za/pages/store'),null);
});
test('locator cards keep branch phone and address inside the coordinate-matched card',()=>{
 const card=(name,lat,phone)=>`<li class="store-location" data-title="${name}" data-address="Shop 5 Example Mall" data-lat="${lat}" data-lng="28.32"><a href="/pages/branch">${name}</a><p>Phone: ${phone}</p></li>`;
 const d=parseBranchDetails(card('Computer Mania Other Branch',-26.2,'011 000 0000')+card('Computer Mania Correct Branch',-25.76,'012 123 4567'),{name:'Computer Mania',lat:-25.76,lon:28.32},'https://computermania.co.za/pages/store-locator');
 assert.equal(d.phone,'012 123 4567');assert.equal(d.publishedAddress,'Shop 5 Example Mall');assert.equal(d.branchName,'Computer Mania Correct Branch');
});

test('scoped published hours convert AM/PM without inventing unsupported schedules',()=>{assert.equal(parsePublishedHours('<p>Monday – Friday 9:00 AM – 7:00 PM<br>Sunday 9:00 AM – 4:00 PM</p>'),'Mo-Fr 09:00-19:00; Su 09:00-16:00');assert.equal(parsePublishedHours('Call us for hours'), '');});
