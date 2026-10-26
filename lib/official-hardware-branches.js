// Public, anonymous locator used by Builders' own store-finder. The endpoint
// returns the national list; these fixed public coordinates only set its order.
// Never use checkout/collection capability flags as product stock evidence.
import {fetchPublicProductPage} from './public-product-page.js';
export const BUILDERS_LOCATOR='https://www.builders.co.za/web/v2/builders/channel/web/zone/B14/stores?latitude=-25.7821&longitude=28.2752&fields=FULL';
const clean=value=>String(value??'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const norm=value=>clean(value).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export const isHardwareBranch=value=>/^builders\s+(?:warehouse|express|superstore)\b/i.test(clean(value));
const DAYS={Monday:'Mo',Tuesday:'Tu',Wednesday:'We',Thursday:'Th',Friday:'Fr',Saturday:'Sa',Sunday:'Su'};
function time(value){
 const match=String(value?.formattedHour||'').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
 if(!match)return '';
 const hour=Number(match[1]),minute=Number(match[2]);if(hour<1||hour>12||minute>59)return '';
 return String(hour%12+(/pm/i.test(match[3])?12:0)).padStart(2,'0')+':'+match[2];
}
export function hardwareSchedule(value){
 const rules=new Map();
 for(const row of Array.isArray(value?.weekDayOpeningList)?value.weekDayOpeningList.slice(0,32):[]){
  const day=DAYS[row?.weekDay];if(!day)continue;
  const start=time(row.openingTime),end=time(row.closingTime);
  const hours=row.closed===true?'off':row.closed===false&&start&&end&&end>start?start+'-'+end:'unknown';
  rules.set(day,rules.has(day)&&rules.get(day)!==hours?'unknown':hours);
 }
 // The locator publishes an ordinary week, not a public-holiday guarantee.
 const result=[...Object.values(DAYS).map(day=>day+' '+(rules.get(day)||'unknown')),'PH unknown'];
 if(value?.specialDayOpeningList!=null&&(!Array.isArray(value.specialDayOpeningList)||value.specialDayOpeningList.length))result.push('SH unknown');
 return result.join('; ');
}
export function parseHardwareBranches(data){
 if(!Array.isArray(data?.stores))return[];
 const rows=[],seen=new Set();
 for(const entry of data.stores.slice(0,1000)){
  const name=clean(entry?.displayName),id=String(entry?.name||''),address=entry?.address;
  if(entry?.type!=='STORE'||!isHardwareBranch(name)||/\b(?:closed|closing down|virtual|online only)\b/i.test(name)||!/^[SBMR]\d{1,6}$/.test(id)||seen.has(id)||address?.country?.isocode!=='ZA')continue;
  const point=entry.geoPoint;if(point?.latitude==null||point?.longitude==null||point.latitude===''||point.longitude==='')continue;
  const lat=Number(point.latitude),lon=Number(point.longitude);if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat < -35||lat > -22||lon < 16||lon > 33)continue;
  // Some source records contradict their own address coordinates by kilometres.
  // Do not choose one silently and send a shopper to a potentially wrong pin.
  if(address.latitude!=null||address.longitude!=null){
   if(address.latitude==null||address.longitude==null||address.latitude===''||address.longitude==='')continue;
   const a=Number(address.latitude),b=Number(address.longitude);
   if(!Number.isFinite(a)||!Number.isFinite(b)||Math.hypot((lat-a)*111,(lon-b)*111*Math.cos(lat*Math.PI/180))>.25)continue;
  }
  const published=clean(address.formattedAddress);if(!published||/\b(?:null|undefined)\b/i.test(published))continue;
  // The published link must identify the same branch on the official host.
  let url;try{url=new URL(entry.url,'https://www.builders.co.za');if(url.origin!=='https://www.builders.co.za'||url.pathname!=='/store/'+id||url.username||url.password)continue;url.search='';url.hash='';}catch{continue;}
  const schedule=hardwareSchedule(entry.openingHours);seen.add(id);
  // The API still publishes legacy /store/{id} links which the current site
  // renders as unavailable. Link shoppers to the working official locator.
  rows.push({id:'builders-'+id,name,lat,lon,address:published,phone:clean(address.phone),countryCode:'ZA',website:'https://www.builders.co.za/store-finder',sourceUrl:BUILDERS_LOCATOR,source:'Official retailer locator',branchDetailsVerified:true,openingHours:schedule,schedule,openNow:null,exactProductMatch:false,stockVerified:false,branchStockVerified:false,branchPriceVerified:false,directionsAvailable:false,price:null,type:'Nearby hardware retailer — exact item stock not verified'});
 }
 return rows;
}
export function findHardwareBranch(rows,store){
 const name=norm(store?.name),coordinates=store?.lat!=null&&store?.lon!=null&&store.lat!==''&&store.lon!=='';
 return rows.find(branch=>{
  if(norm(branch.name)!==name)return false;
  if(coordinates){const lat=Number(store.lat),lon=Number(store.lon);return Number.isFinite(lat)&&Number.isFinite(lon)&&Math.hypot((branch.lat-lat)*111,(branch.lon-lon)*111*Math.cos(branch.lat*Math.PI/180))<=.08;}
  const wanted=norm(store?.address).split(' ').filter(word=>(word.length>=4||/^\d{2,6}$/.test(word))&&!/^(street|road|shop|mall|south|africa|pretoria|centre|center)$/.test(word));
  const published=norm(branch.address).split(' ');return wanted.length>=2&&wanted.filter(word=>published.includes(word)).length>=Math.max(2,Math.ceil(wanted.length*.7));
 })||null;
}
export function preferOfficialHardware(rows){
 const official=rows.filter(row=>row.source==='Official retailer locator'&&isHardwareBranch(row.name));
 return rows.filter(row=>row.source==='Official retailer locator'||!/^builders\b/i.test(clean(row.name))||!official.some(branch=>Math.hypot((branch.lat-Number(row.lat))*111,(branch.lon-Number(row.lon))*111*Math.cos(branch.lat*Math.PI/180))<=.08));
}
let cached=null,pending=null;
export async function officialHardwareBranches(){
 if(cached&&Date.now()-cached.at<900000)return cached.rows;
 if(pending)return pending;
 pending=(async()=>{try{
  const response=await fetchPublicProductPage(BUILDERS_LOCATOR,{headers:{accept:'application/json','user-agent':'FindItNearby/42.0'},signal:AbortSignal.timeout(8000)});
  if(!response.ok)return[];
  const text=await response.text();if(text.length>2000000)return[];
  const rows=parseHardwareBranches(JSON.parse(text));if(rows.length)cached={at:Date.now(),rows};return rows;
 }catch{return[];}})();
 try{return await pending;}finally{pending=null;}
}
