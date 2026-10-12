import test from 'node:test';import assert from 'node:assert/strict';
import {parseSportsBranches} from '../lib/official-sports-branches.js';
test('official sports locator keeps active coordinate-backed branches and published contact details',()=>{
 const page=rows=>"<store-selector :stores='"+JSON.stringify(rows)+"'>";
 const row={id:1,status:'active',title:'Example Mall',lat:-25.8,lng:28.3,contact_number:'012 123 4567',street_address:'Shop 2 Example Mall',city:'Pretoria',trading_hours:{Monday:'9:00 to 18:00'}};
 const result=parseSportsBranches(page([row,{...row,id:2,status:'closed'},{...row,id:3,lat:null}]));assert.equal(result.length,1);assert.equal(result[0].phone,'012 123 4567');assert.match(result[0].openingHours,/9:00 to 18:00/);assert.equal(result[0].exactProductMatch,false);assert.equal(result[0].branchStockVerified,false);assert.equal(result[0].sourceUrl,'https://www.sportsmanswarehouse.co.za/store-locator/');
 assert.deepEqual(parseSportsBranches("<script>malicious()</script>"),[]);
});
