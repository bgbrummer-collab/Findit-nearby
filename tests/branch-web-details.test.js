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

test('concurrent branches share the official locator request and keep their own details',async t=>{
 let count=0;
 t.mock.method(globalThis,'fetch',async()=>{count++;await new Promise(resolve=>setTimeout(resolve,10));return new Response('<li data-title="Computer Mania First" data-address="First Mall" data-lat="-25.901" data-lng="28.411"><p>Phone: 012 111 1111</p></li><li data-title="Computer Mania Second" data-address="Second Mall" data-lat="-25.951" data-lng="28.461"><p>Phone: 012 222 2222</p></li>');});
 const [a,b]=await Promise.all([researchBranchDetails({name:'Computer Mania',lat:-25.901,lon:28.411}),researchBranchDetails({name:'Computer Mania',lat:-25.951,lon:28.461})]);
 assert.equal(count,1);assert.equal(a.phone,'012 111 1111');assert.equal(b.phone,'012 222 2222');
});

test('Magento locator JSON matches Incredible Connection by branch coordinates and scopes contact fields',()=>{
 const records={one:{name:'INCREDIBLE OTHER',address:'Wrong Mall',phone:'011 000 0000',latitude:-26,longitude:28},two:{name:'INCREDIBLE WOODLANDS',address:'Shop 70C Woodlands',city:'Pretoria',postcode:'0072',phone:'012 994 9000',latitude:-25.82305903,longitude:28.31168174,opening_hours:JSON.stringify({m:{weekday:'monday',open_time:'09:00',close_time:'19:00'},s:{weekday:'sunday',open_time:'09:00',close_time:'17:00'}})}};
 const page='<script type="text/x-magento-init">'+JSON.stringify({'*':{locator:{stores:records}}})+'</script>';
 const d=parseBranchDetails(page,{name:'Incredible Connection',lat:-25.82305903,lon:28.31168174},'https://www.incredible.co.za/storelocator/');assert.equal(d.phone,'012 994 9000');assert.equal(d.todayHours,'Mo 09:00-19:00; Su 09:00-17:00');assert.match(d.publishedAddress,/Shop 70C/);assert.equal(parseBranchDetails(page,{name:'Incredible Connection',lat:-24,lon:28},'https://www.incredible.co.za/storelocator/'),null);
});

test('attribute locator cards select iStore branch details without leaking another branch',()=>{
 const card=(name,lat,phone)=>`<div data-store-name="${name}" data-latitude="${lat}," data-longitude="28.31"><div class="store-locator__address"><span>Address:</span><span>Shop 35 Example Mall</span></div><a href="tel:${phone}">Call</a><table><tr><th>Monday</th><td>09:00 - 19:00</td></tr></table></div>`;
 const page=card('iStore Other',-26.4,'0110000000')+card('iStore Selected',-25.82,'0870575500');const found=parseBranchDetails(page,{name:'iStore',lat:-25.82,lon:28.31},'https://www.istore.co.za/storelocator');assert.equal(found.phone,'0870575500');assert.equal(found.todayHours,'Mo 09:00-19:00');assert.equal(found.branchName,'iStore Selected');assert.equal(parseBranchDetails(page,{name:'iStore',lat:-24,lon:28.31},'https://www.istore.co.za/storelocator'),null);
});
