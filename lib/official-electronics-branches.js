// Read only the inert JSON published by these public branch locators. Never
// execute retailer scripts, use their map keys, or interpret branches as stock.
import {fetchPublicProductPage} from './public-product-page.js';
const SOURCES=[
 {key:'incredible',url:'https://www.incredible.co.za/storelocator/',name:/^incredible\b/i},
 {key:'hificorp',url:'https://www.hificorp.co.za/storelocator',name:/^hifi\s*corp\b/i}
];
const clean=value=>String(value??'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/\s+/g,' ').trim();
export const electronicsBranchName=value=>clean(value).toLowerCase().replace(/^incredible connection\b/,'incredible').replace(/^hifi\s+corp\b/,'hificorp');
export const isElectronicsBranch=value=>SOURCES.some(source=>source.name.test(clean(value)));
const DAYS={monday:'Mo',tuesday:'Tu',wednesday:'We',thursday:'Th',friday:'Fr',saturday:'Sa',sunday:'Su',public_holiday:'PH'};
function data(value){try{return typeof value==='string'?JSON.parse(value):value;}catch{return null;}}
export function electronicsSchedule(value,specialHours='[]'){
 const rows=data(value),rules=new Map();
 if(rows&&typeof rows==='object')for(const entry of Object.values(rows).slice(0,32)){
  if(!entry||typeof entry!=='object')continue;
  const day=DAYS[String(entry.weekday||'').toLowerCase()];if(!day)continue;
  const start=String(entry.open_time||''),end=String(entry.close_time||'');
  let hours='unknown';
  if(/^(?:closed|off)$/i.test(start)||/^(?:closed|off)$/i.test(end))hours='off';
  else if(/^\d{2}:\d{2}$/.test(start)&&/^\d{2}:\d{2}$/.test(end)){
   const [a,b]=start.split(':').map(Number),[c,d]=end.split(':').map(Number);
   if(a<=23&&b<=59&&c<=24&&d<=59&&(c!==24||d===0)&&c*60+d>a*60+b)hours=start+'-'+end;
  }
  rules.set(day,rules.has(day)&&rules.get(day)!==hours?'unknown':hours);
 }
 const schedule=Object.values(DAYS).map(day=>day+' '+(rules.get(day)||'unknown'));
 const special=data(specialHours);
 // Date exceptions need explicit evaluation; do not silently use a normal week.
 if(special==null||typeof special!=='object'||Object.keys(special).length)schedule.push('SH unknown');
 return schedule.join('; ');
}
export function parseElectronicsBranches(html,sourceUrl){
 const source=SOURCES.find(s=>s.url===sourceUrl);if(!source)return[];
 const result=[],seen=new Set();
 for(const script of String(html||'').slice(0,2000000).matchAll(/<script\b[^>]*type\s*=\s*["']text\/x-magento-init["'][^>]*>([\s\S]*?)<\/script>/gi)){
  const root=data(script[1]),component=root?.['#storelocator-store-list']?.['Magento_Ui/js/core/app']?.components?.storelocatorList;
  if(component?.component!=='Vaimo_Storelocator/js/view/list')continue;
  const records=component.storeData;if(!records||typeof records!=='object'||Array.isArray(records))continue;
  for(const entry of Object.values(records).slice(0,1000)){
   if(!entry||String(entry.status)!=='1'||String(entry.virtual_store)!=='0'||String(entry.store_closed)==='1'||entry.country_id!=='ZA')continue;
   const name=clean(entry.name),id=String(entry.entity_id||'');if(!source.name.test(name)||!/^\d{1,12}$/.test(id)||seen.has(id))continue;
   if(entry.latitude==null||entry.longitude==null||entry.latitude===''||entry.longitude==='')continue;
   const lat=Number(entry.latitude),lon=Number(entry.longitude);if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat < -35||lat > -22||lon < 16||lon > 33)continue;
   const street=clean(entry.address),city=clean(entry.city),postcode=clean(entry.postcode);const address=[street,street.split(',').some(part=>clean(part).toLowerCase()===city.toLowerCase())?'':city,street.split(/\s+/).includes(postcode)?'':postcode].filter(Boolean).join(', ');if(!address)continue;
   const schedule=electronicsSchedule(entry.opening_hours,entry.special_hours??'[]');seen.add(id);
   result.push({id:source.key+'-'+id,name,lat,lon,address,phone:clean(entry.phone),countryCode:'ZA',website:source.url,sourceUrl:source.url,source:'Official retailer locator',branchDetailsVerified:true,openingHours:schedule,schedule,openNow:null,exactProductMatch:false,stockVerified:false,branchStockVerified:false,branchPriceVerified:false,directionsAvailable:false,price:null,type:'Nearby electronics retailer — exact item stock not verified'});
  }
 }
 return result;
}
export function findElectronicsBranch(records,store){
 const name=electronicsBranchName(store?.name),hasCoords=store?.lat!=null&&store?.lon!=null&&store.lat!==''&&store.lon!=='';
 return records.find(branch=>{
  if(electronicsBranchName(branch.name)!==name)return false;
  if(hasCoords){const lat=Number(store.lat),lon=Number(store.lon);return Number.isFinite(lat)&&Number.isFinite(lon)&&Math.hypot((branch.lat-lat)*111,(branch.lon-lon)*111*Math.cos(branch.lat*Math.PI/180))<=.08;}
  const normalize=value=>clean(value).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(),published=normalize(branch.address).split(' ');
  const wanted=normalize(store?.address).split(' ').filter(word=>(word.length>=4||/^\d{2,6}$/.test(word))&&!/^(street|road|shop|mall|south|africa|pretoria|centre|center)$/.test(word));
  return wanted.length>=2&&wanted.filter(word=>published.includes(word)).length>=Math.max(2,Math.ceil(wanted.length*.7));
 })||null;
}
export function preferOfficialElectronics(rows){
 const official=rows.filter(row=>row.source==='Official retailer locator'&&isElectronicsBranch(row.name));
 return rows.filter(row=>{
  if(row.source==='Official retailer locator'||!isElectronicsBranch(row.name))return true;
  const chain=electronicsBranchName(row.name).split(' ')[0];
  return !official.some(branch=>electronicsBranchName(branch.name).split(' ')[0]===chain&&Math.hypot((branch.lat-Number(row.lat))*111,(branch.lon-Number(row.lon))*111*Math.cos(branch.lat*Math.PI/180))<=.08);
 });
}
const cache=new Map(),pending=new Map();
async function readSource(source){
 const hit=cache.get(source.key);if(hit&&Date.now()-hit.at<900000)return hit.rows;
 if(pending.has(source.key))return pending.get(source.key);
 const job=(async()=>{try{
  const response=await fetchPublicProductPage(source.url,{headers:{accept:'text/html','user-agent':'FindItNearby/42.0'},signal:AbortSignal.timeout(8000)});
  if(!response.ok)return[];
  const rows=parseElectronicsBranches(await response.text(),source.url);
  if(rows.length)cache.set(source.key,{at:Date.now(),rows});return rows;
 }catch{return[];}})();pending.set(source.key,job);
 try{return await job;}finally{pending.delete(source.key);}
}
export async function officialElectronicsBranches(){const rows=await Promise.all(SOURCES.map(readSource));return rows.flat();}
