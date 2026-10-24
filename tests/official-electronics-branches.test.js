import test from 'node:test';import assert from 'node:assert/strict';
import {parseElectronicsBranches,electronicsSchedule,findElectronicsBranch,preferOfficialElectronics} from '../lib/official-electronics-branches.js';
import {scheduleStatus} from '../lib/store-hours.js';
const source='https://www.incredible.co.za/storelocator/';
const hours=Object.fromEntries(['monday','tuesday','wednesday','thursday','friday','saturday','sunday','public_holiday'].map((weekday,n)=>[n,{weekday,open_time:'09:00',close_time:n===6?'18:00':'21:00'}]));
const record={entity_id:'61',status:'1',name:'INCREDIBLE MENLYN',virtual_store:'0',store_closed:'0',country_id:'ZA',address:'Shop 34A, Menlyn Shopping Mall',city:'Pretoria',postcode:'0047',phone:'(012) 369 6480',latitude:'-25.782677',longitude:'28.276191',opening_hours:JSON.stringify(hours),special_hours:'[]'};
const html=rows=>'<script type="text/x-magento-init">'+JSON.stringify({'#storelocator-store-list':{'Magento_Ui/js/core/app':{components:{storelocatorList:{component:'Vaimo_Storelocator/js/view/list',storeData:rows}}}}})+'</script>';
test('published electronics branches retain exact contact/coordinate provenance and never claim inventory',()=>{
 const rows=parseElectronicsBranches(html({a:record}),source);assert.equal(rows.length,1);const branch=rows[0];
 assert.equal(branch.name,'INCREDIBLE MENLYN');assert.equal(branch.lat,-25.782677);assert.equal(branch.phone,'(012) 369 6480');assert.match(branch.address,/Menlyn/);assert.equal(branch.sourceUrl,source);assert.equal(branch.branchDetailsVerified,true);assert.equal(branch.openNow,null);assert.equal(branch.exactProductMatch,false);assert.equal(branch.branchStockVerified,false);assert.equal(branch.price,null);assert.equal(branch.directionsAvailable,false);
});
test('inactive, closed, virtual, foreign, malformed and duplicate locator records do not become physical stores',()=>{
 const rows={valid:record,duplicate:record};let id=100;
 for(const changes of [{status:'0'},{store_closed:'1'},{virtual_store:'1'},{country_id:'NA'},{latitude:''},{latitude:'NaN'},{latitude:'-90'},{longitude:999},{name:'Unrelated store'},{entity_id:'bad'}])rows[++id]={...record,entity_id:String(id),...changes};
 assert.equal(parseElectronicsBranches(html(rows),source).length,1);assert.deepEqual(parseElectronicsBranches(html({a:record}),'https://unrelated.example/locator'),[]);assert.deepEqual(parseElectronicsBranches('<script>window.run='+JSON.stringify(record)+'</script>',source),[]);
});
test('published schedules retain holidays and keep missing, conflicting or exceptional hours unknown',()=>{
 const schedule=electronicsSchedule(hours);assert.equal(scheduleStatus(schedule,'Africa/Johannesburg',new Date('2026-10-24T17:00:00Z'),'ZA').status,'open');assert.equal(scheduleStatus(schedule,'Africa/Johannesburg',new Date('2026-10-24T20:00:00Z'),'ZA').status,'closed');
 for(const value of [{m:hours[0]},{...hours,duplicate:{weekday:'saturday',open_time:'10:00',close_time:'13:00'}},{...hours,5:{weekday:'saturday',open_time:'99:00',close_time:'21:00'}}])assert.equal(scheduleStatus(electronicsSchedule(value),'Africa/Johannesburg',new Date('2026-10-24T17:00:00Z'),'ZA').status,'unknown');
 assert.equal(scheduleStatus(electronicsSchedule(hours,'[{"date":"2026-10-24"}]'),'Africa/Johannesburg',new Date('2026-10-24T17:00:00Z'),'ZA').status,'unknown');
});
test('nearby electronics discovery survives failed map providers and independently verifies branch schedules',async t=>{
 const worker=(await import('../cloudflare/worker.js')).default;let sourceCalls=0;
 t.mock.method(globalThis,'fetch',async u=>{u=String(u);if(u===source){sourceCalls++;return new Response(html({a:record}),{headers:{'content-type':'text/html'}});}if(u==='https://www.hificorp.co.za/storelocator')return new Response(html({a:{...record,name:'HiFiCorp Menlyn',entity_id:'1293',latitude:'-25.78021823',longitude:'28.27530038',phone:'012 133 0032'}}),{headers:{'content-type':'text/html'}});return new Response('provider unavailable',{status:503});});
 const request=()=>new Request('https://findit.test/api/nearby',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({lat:-25.7821,lon:28.2752,radiusKm:3,identification:{name:'Sony headphones',object:'headphones',category:'electronics'}})});
 const response=await worker.fetch(request(),{}),d=await response.json();assert.equal(d.stores.length,2);assert.equal(d.discoveryAvailable,true);assert.ok(d.stores.every(s=>s.distanceKm<3&&s.branchStockVerified===false&&s.price===null));assert.equal(d.stores[0].name,'INCREDIBLE MENLYN');
 const result=await worker.fetch(new Request('https://findit.test/api/assistant?action=store-hours',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({stores:d.stores})}),{}),h=await result.json();assert.ok(h.stores.every(s=>s.hoursVerified&&s.sourceLabel==='Official retailer locator'&&s.phone));assert.equal(sourceCalls,1,'A locator download is shared across nearby and branch-hours requests');
 const modelOnly=await(await worker.fetch(new Request('https://findit.test/api/nearby',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({lat:-25.7821,lon:28.2752,radiusKm:3,identification:{name:'Sony WH-1000XM5 black',object:'product',category:'general'}})}),{})).json();
 assert.ok(modelOnly.searchedShopTags.includes('electronics'),'Model-only browser searches use the commerce category');assert.equal(modelOnly.stores.length,2);

 const checked=await(await worker.fetch(new Request('https://findit.test/api/store-website-check',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:d.stores[0].name,address:d.stores[0].address,website:source})}),{})).json();assert.equal(checked.verifiedFields.phone,record.phone);assert.equal(checked.source,'Official retailer locator');
});

test('branch fields require independent name and coordinate/address evidence',()=>{const rows=parseElectronicsBranches(html({a:record}),source);assert.ok(findElectronicsBranch(rows,{name:'Incredible Connection Menlyn',lat:-25.782677,lon:28.276191}));assert.equal(findElectronicsBranch(rows,{name:'Incredible Menlyn',lat:-26.2,lon:28.1,address:rows[0].address}),null);assert.equal(findElectronicsBranch(rows,{name:'Incredible Menlyn On Maine',address:rows[0].address}),null);assert.equal(findElectronicsBranch(rows,{name:'Incredible Menlyn',address:'Wrong street in another city'}),null);assert.equal(findElectronicsBranch(rows,{name:'Incredible Menlyn'}),null);});

test('authoritative locator records replace nearby generic map duplicates without inheriting stock or price',()=>{const official=parseElectronicsBranches(html({a:record}),source)[0],duplicate={name:'Incredible Connection',lat:official.lat,lon:official.lon,source:'OpenStreetMap',phone:'wrong number',price:10,stockVerified:true},distinct={name:'Other electronics shop',lat:official.lat,lon:official.lon,source:'OpenStreetMap'};const rows=preferOfficialElectronics([duplicate,distinct,official]);assert.equal(rows.length,2);assert.ok(rows.includes(distinct));assert.ok(rows.includes(official));assert.equal(rows.find(s=>s.name===official.name).phone,record.phone);assert.equal(rows.find(s=>s.name===official.name).stockVerified,false);});

test('unavailable official locators do not manufacture branch details',async t=>{t.mock.method(globalThis,'fetch',async()=>new Response('Unavailable',{status:503}));const fresh=await import('../lib/official-electronics-branches.js?unavailable');assert.deepEqual(await fresh.officialElectronicsBranches(),[]);});
