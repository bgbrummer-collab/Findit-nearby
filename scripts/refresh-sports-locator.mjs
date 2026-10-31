import fs from 'node:fs/promises';
import {parseSportsBranches} from '../lib/official-sports-branches.js';
const source='https://www.sportsmanswarehouse.co.za/store-locator/';
try{
 const r=await fetch(source,{headers:{accept:'text/html','user-agent':'FindItNearby-published-locator/1.0'},signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('HTTP '+r.status);
 const branches=parseSportsBranches((await r.text()).slice(0,1500000)).map(({id,name,lat,lon,address,phone,website,sourceUrl})=>({id,name,lat,lon,address,phone,website,sourceUrl}));if(!branches.length)throw Error('No valid published branches');
 await fs.writeFile(new URL('../lib/data/sports-locator-snapshot.js',import.meta.url),'// Published retailer locations; regenerated during deployment. No inventory or live hours.\nexport default '+JSON.stringify({source,checkedAt:new Date().toISOString(),branches},null,2)+';\n');console.log('Published sports locator refreshed:',branches.length,'branches');
}catch(error){console.warn('Published sports locator could not refresh; retain the existing dated snapshot:',error.message);}
