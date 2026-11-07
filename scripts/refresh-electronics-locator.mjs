import fs from 'node:fs/promises';
import snapshots from '../lib/data/electronics-locator-snapshot.js';
import {ELECTRONICS_LOCATOR_SOURCES,parseElectronicsBranches} from '../lib/official-electronics-branches.js';
import {fetchPublicProductPage} from '../lib/public-product-page.js';
const records=await Promise.all(ELECTRONICS_LOCATOR_SOURCES.map(async source=>{
 try{
  const response=await fetchPublicProductPage(source.url,{headers:{accept:'text/html','user-agent':'FindItNearby-published-locator/1.0'},signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('HTTP '+response.status);
  const branches=parseElectronicsBranches(await response.text(),source.url).map(({id,name,lat,lon,address,phone,sourceUrl})=>({id,name,lat,lon,address,phone,sourceUrl}));
  if(!branches.length)throw Error('No valid branches');
  console.log(source.key+': refreshed '+branches.length+' published locations');
  return {source:source.url,checkedAt:new Date().toISOString(),branches};
 }catch(error){
  console.warn(source.key+': retaining dated snapshot, '+error.message);
  return snapshots.find(row=>row.source===source.url)||null;
 }
}));
await fs.writeFile(new URL('../lib/data/electronics-locator-snapshot.js',import.meta.url),'// Public locator observations. No inventory, branch prices or live hours.\nexport default '+JSON.stringify(records.filter(Boolean),null,2)+';\n');
