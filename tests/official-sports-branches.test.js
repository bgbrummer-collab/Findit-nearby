import test from 'node:test';import assert from 'node:assert/strict';
import {parseSportsBranches,sportsSchedule} from '../lib/official-sports-branches.js';
import {scheduleStatus} from '../lib/store-hours.js';
test('official sports locator keeps active coordinate-backed branches and published contact details',()=>{
 const page=rows=>"<store-selector :stores='"+JSON.stringify(rows)+"'>";
 const row={id:1,status:'active',title:'Example Mall',lat:-25.8,lng:28.3,contact_number:'012 123 4567',street_address:'Shop 2 Example Mall',city:'Pretoria',trading_hours:{Monday:'9:00 to 18:00'}};
 const result=parseSportsBranches(page([row,{...row,id:2,status:'closed'},{...row,id:3,lat:null}]));assert.equal(result.length,1);assert.equal(result[0].phone,'012 123 4567');assert.match(result[0].openingHours,/9:00 to 18:00/);assert.equal(result[0].exactProductMatch,false);assert.equal(result[0].branchStockVerified,false);assert.equal(result[0].sourceUrl,'https://www.sportsmanswarehouse.co.za/store-locator/');
 assert.deepEqual(parseSportsBranches("<script>malicious()</script>"),[]);
});
test('official locator schedules retain weekday and public-holiday rules without guessing missing days',()=>{
 const hours=Object.fromEntries(['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day=>[day,'9:00 to 20:00']));hours.Friday='9:00 to 21:00';hours['Public Holidays']='9:00 to 17:00';
 const schedule=sportsSchedule(hours);assert.match(schedule,/Fr 09:00-21:00/);assert.match(schedule,/PH 09:00-17:00/);
 assert.equal(scheduleStatus(schedule,'Africa/Johannesburg',new Date('2026-10-16T18:00:00Z'),'ZA').status,'open');
 assert.equal(scheduleStatus(schedule,'Africa/Johannesburg',new Date('2026-12-16T16:00:00Z'),'ZA').status,'closed');
 delete hours.Monday;assert.equal(sportsSchedule(hours),'');
});
