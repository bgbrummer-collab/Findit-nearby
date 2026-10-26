import test from 'node:test';
import assert from 'node:assert/strict';
import {BUILDERS_LOCATOR,parseHardwareBranches,hardwareSchedule,findHardwareBranch,preferOfficialHardware} from '../lib/official-hardware-branches.js';
import {scheduleStatus} from '../lib/store-hours.js';
import worker from '../cloudflare/worker.js';
import nearby from '../api/nearby.js';
const weekly=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(weekDay=>({weekDay,closed:false,openingTime:{formattedHour:'8:00 AM',hour:8},closingTime:{formattedHour:'6:00 PM',hour:6}}));
const record={name:'S62',displayName:'Builders Express Lynnwood',type:'STORE',address:{country:{isocode:'ZA'},formattedAddress:'Shop 1 Gift Acres Shopping Centre, 118 Lynnwood Road, Pretoria, 0081',phone:'0860008985'},geoPoint:{latitude:-25.767488,longitude:28.296105},openingHours:{weekDayOpeningList:weekly},url:'/store/S62?lat=-25.7821&long=28.2752',features:{entry:[{key:'canCollect',value:'Can collect from store'}]}};
test('official hardware branches retain published provenance without converting collection capability into stock',()=>{
 const [row]=parseHardwareBranches({stores:[record]});assert.equal(row.name,record.displayName);assert.equal(row.website,'https://www.builders.co.za/store/S62');assert.equal(row.sourceUrl,BUILDERS_LOCATOR);assert.equal(row.lat,record.geoPoint.latitude);assert.equal(row.phone,record.address.phone);assert.equal(row.branchDetailsVerified,true);
 for(const flag of ['exactProductMatch','stockVerified','branchStockVerified','branchPriceVerified','directionsAvailable'])assert.equal(row[flag],false);
 assert.equal(row.price,null);assert.equal(row.openNow,null);
});
test('foreign, closed, nonphysical, malformed, redirected and duplicate branches are rejected',()=>{
 const stores=[record,record];let n=100;
 for(const changes of [{type:'ONLINE'},{displayName:'CLOSED - Builders Express Test'},{displayName:'Builders Express Test closed'},{displayName:'Unrelated shop'},{address:{...record.address,country:{isocode:'ZM'}}},{address:{...record.address,formattedAddress:'null - Pretoria'}},{geoPoint:{latitude:null,longitude:28}},{geoPoint:{latitude:'',longitude:28}},{geoPoint:{latitude:-25,longitude:999}},{name:'bad'},{url:'https://unrelated.example/store/S100'},{url:'https://user:pass@www.builders.co.za/store/S100'},{url:'/store/Other'}]){const name='S'+n++;stores.push({...record,name,url:'/store/'+name,...changes});}
 assert.equal(parseHardwareBranches({stores}).length,1);assert.deepEqual(parseHardwareBranches({stores:{}}),[]);
});
test('warehouse and superstore IDs work while contradictory source coordinates cannot create a nearby pin',()=>{
 const stores=['S62','B36','R014','M012'].map((name,n)=>({...record,name,displayName:['Builders Express Test','Builders Warehouse Test','Builders Superstore Test','Builders Superstore Other'][n],url:'/store/'+name}));
 assert.equal(parseHardwareBranches({stores}).length,4);
 for(const address of [{...record.address,latitude:-25.6782869,longitude:28.192069},{...record.address,latitude:'',longitude:28},{...record.address,latitude:'NaN',longitude:28}])assert.deepEqual(parseHardwareBranches({stores:[{...record,address}]}),[]);
 assert.equal(parseHardwareBranches({stores:[{...record,address:{...record.address,latitude:record.geoPoint.latitude,longitude:record.geoPoint.longitude}}]}).length,1);
});
test('hardware schedule reads AM/PM and leaves missing, malformed, conflicting and exceptional days unknown',()=>{
 const check=(value,date)=>scheduleStatus(hardwareSchedule(value),'Africa/Johannesburg',new Date(date),'ZA').status;
 assert.equal(check(record.openingHours,'2026-10-26T14:00:00Z'),'open');assert.equal(check(record.openingHours,'2026-10-26T17:00:00Z'),'closed');
 assert.equal(check(record.openingHours,'2026-12-25T10:00:00Z'),'unknown');
 for(const weekDayOpeningList of [[],[{...weekly[0],openingTime:{hour:8},closingTime:{hour:6}}],[...weekly,{...weekly[0],closingTime:{formattedHour:'4:00 PM'}}],[{...weekly[0],closingTime:{formattedHour:'29:00 PM'}}]])assert.equal(check({weekDayOpeningList},'2026-10-26T14:00:00Z'),'unknown');
 assert.equal(check({...record.openingHours,specialDayOpeningList:[{date:'2026-10-26'}]},'2026-10-26T14:00:00Z'),'unknown');
 assert.match(hardwareSchedule({weekDayOpeningList:[{weekDay:'Monday',closed:true}]}),/Mo off/);
});
test('hardware branch verification requires the name and independent location evidence',()=>{
 const rows=parseHardwareBranches({stores:[record]}),row=rows[0];
 assert.equal(findHardwareBranch(rows,{name:row.name,lat:row.lat,lon:row.lon}),row);assert.equal(findHardwareBranch(rows,{name:row.name,address:row.address}),row);
 for(const store of [{name:row.name},{name:row.name+' Other',address:row.address},{name:row.name,lat:-26.2,lon:28.1,address:row.address},{name:row.name,address:'Other Street in another city'}])assert.equal(findHardwareBranch(rows,store),null);
 const duplicate={name:'Builders Warehouse',lat:row.lat,lon:row.lon,source:'OpenStreetMap',phone:'wrong',price:10,stockVerified:true};
 assert.deepEqual(preferOfficialHardware([duplicate,row]),[row]);
});
test('both nearby routes recover official hardware branches when maps fail and independently verify details',async t=>{
 let calls=0;let mapConflict=false;
 t.mock.method(globalThis,'fetch',async(url)=>{
  if(String(url)===BUILDERS_LOCATOR){calls++;return new Response(JSON.stringify({stores:[record]}),{headers:{'content-type':'application/json'}});}
  if(mapConflict&&String(url).includes('overpass'))return new Response(JSON.stringify({elements:[{type:'node',id:1,lat:record.geoPoint.latitude,lon:record.geoPoint.longitude,tags:{name:record.displayName,phone:'wrong phone',website:'https://wrong.example','addr:street':'Wrong address',opening_hours:'Mo-Su 00:00-24:00'}}]}));
  return new Response('Unavailable',{status:503});
 });
 const body={lat:-25.7821,lon:28.2752,radiusKm:3,identification:{name:'Bosch GSB 18V-50 with batteries and charger',object:'product',category:'general'}};
 const post=async(path,body)=>(await worker.fetch(new Request('https://findit.test'+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),{})).json();
 const d=await post('/api/nearby',body);assert.equal(d.stores.length,1);assert.equal(d.discoveryAvailable,true);assert.ok(d.stores[0].distanceKm<3);assert.equal(d.stores[0].branchStockVerified,false);
 let alternate;await nearby({method:'POST',body:{...body,mode:'likely'}},{setHeader(){},status(){return this},json(d){alternate=d;return this;}});assert.equal(alternate.stores.length,1);
 mapConflict=true;
 const h=await post('/api/assistant?action=store-hours',{stores:d.stores});assert.equal(h.stores[0].phone,record.address.phone);assert.equal(h.stores[0].publishedAddress,record.address.formattedAddress);assert.equal(h.stores[0].sourceLabel,'Official retailer locator');assert.equal(h.stores[0].hoursVerified,true);
 const checked=await post('/api/store-website-check',{...d.stores[0],website:'https://www.builders.co.za/store-finder'});assert.equal(checked.verifiedFields.phone,record.address.phone);assert.equal(checked.source,'Official retailer locator');
 assert.equal(calls,1,'Nearby, hours and website checks share a single locator request');
});
test('hardware locator coalesces callers and handles invalid JSON and provider outages without fake stores',async t=>{
 let calls=0;let release;const gate=new Promise(resolve=>release=resolve);
 t.mock.method(globalThis,'fetch',async()=>{calls++;await gate;return new Response(JSON.stringify({stores:[record]}));});
 const fresh=await import('../lib/official-hardware-branches.js?coalesce');const a=fresh.officialHardwareBranches(),b=fresh.officialHardwareBranches();release();assert.equal((await a).length,1);assert.equal((await b).length,1);assert.equal(calls,1);
 t.mock.method(globalThis,'fetch',async()=>new Response('Unavailable',{status:503}));assert.deepEqual(await (await import('../lib/official-hardware-branches.js?unavailable')).officialHardwareBranches(),[]);
 t.mock.method(globalThis,'fetch',async()=>new Response('not json'));assert.deepEqual(await (await import('../lib/official-hardware-branches.js?malformed')).officialHardwareBranches(),[]);
});
