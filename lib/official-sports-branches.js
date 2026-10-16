// Read inert, published locator data. No scripts or retailer keys are executed.
const SOURCE='https://www.sportsmanswarehouse.co.za/store-locator/';
let cached=null,pending=null;
export function sportsSchedule(hours){
 const names=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],days=['Mo','Tu','We','Th','Fr','Sa','Su'];
 const rules=[];
 for(let n=0;n<names.length;n++){
  const value=String(hours?.[names[n]]||'').trim();
  if(/^closed$/i.test(value)){rules.push(days[n]+' off');continue;}
  const m=value.match(/^(\d{1,2}):(\d{2})\s+to\s+(\d{1,2}):(\d{2})$/i);if(!m)return '';
  rules.push(days[n]+' '+m[1].padStart(2,'0')+':'+m[2]+'-'+m[3].padStart(2,'0')+':'+m[4]);
 }
 const holiday=String(hours?.['Public Holidays']||'').trim(),m=holiday.match(/^(\d{1,2}):(\d{2})\s+to\s+(\d{1,2}):(\d{2})$/i);
 rules.push(/^closed$/i.test(holiday)?'PH off':m?'PH '+m[1].padStart(2,'0')+':'+m[2]+'-'+m[3].padStart(2,'0')+':'+m[4]:'PH unknown');
 return rules.join('; ');
}
export function parseSportsBranches(html){
 const raw=String(html).match(/:stores='([^']*)'/)?.[1];if(!raw)return [];
 let records;try{records=JSON.parse(raw.replace(/&quot;/g,'"').replace(/&#039;|&#39;/g,"'").replace(/&amp;/g,'&'));}catch{return [];}if(!Array.isArray(records))return [];
 return records.filter(x=>x.status==='active'&&x.lat!=null&&x.lng!=null&&Number.isFinite(Number(x.lat))&&Number.isFinite(Number(x.lng))&&Math.abs(Number(x.lat))<=90&&Math.abs(Number(x.lng))<=180&&x.title).map(x=>({id:'sportsmans-'+x.id,name:'Sportsmans Warehouse '+x.title,lat:Number(x.lat),lon:Number(x.lng),address:[x.street_address,x.street_address_2,x.suburb,x.city,x.postal_code].filter(Boolean).join(', '),phone:String(x.contact_number||''),website:SOURCE,openingHours:Object.entries(x.trading_hours||x.trading_times||{}).map(([day,time])=>day+': '+time).join('; '),schedule:sportsSchedule(x.trading_hours||x.trading_times),source:'Official retailer locator',sourceUrl:SOURCE,exactProductMatch:false,stockVerified:false,branchStockVerified:false,branchDetailsVerified:true,openNow:null,type:'Nearby footwear and sports retailer — exact item stock not verified'}));
}
export async function officialSportsBranches(){
 if(cached&&Date.now()-cached.at<900000)return cached.rows;if(pending)return pending;
 pending=(async()=>{try{const r=await fetch(SOURCE,{headers:{accept:'text/html','user-agent':'FindItNearby/42.0'},signal:AbortSignal.timeout(10000)});if(!r.ok)return [];const rows=parseSportsBranches((await r.text()).slice(0,1500000));if(rows.length)cached={at:Date.now(),rows};return rows;}catch{return [];}})();try{return await pending;}finally{pending=null;}
}
