// Read published locator records only. Never execute retailer scripts or claim inventory.
const SOURCE='https://clicks.co.za/store-finder';
const text=v=>String(v||'').replace(/<[^>]*>/g,' ').replace(/&#39;|&#039;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
function records(html,attribute){
 const marker=attribute+"='",start=html.indexOf(marker);if(start<0)return null;const raw=html.slice(start+marker.length).trimStart();if(raw[0]!=='{')return null;
 let depth=0,quoted=false,escaped=false;for(let i=0;i<raw.length;i++){const c=raw[i];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;}else if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0){try{return JSON.parse(raw.slice(0,i+1));}catch{return null;}}}return null;
}
export function parseClicksBranches(html){
 const source=String(html).slice(0,1000000),data=records(source,'data-allstores')||records(source,'data-stores');if(!data||Array.isArray(data))return[];
 const rows=[];for(const entry of Object.values(data)){
  if(!entry||entry.latitude==null||entry.longitude==null||entry.latitude===''||entry.longitude==='')continue;const lat=Number(entry.latitude),lon=Number(entry.longitude);if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180||(!lat&&!lon))continue;
  const label=String(entry.name||''),parts=[...label.matchAll(/<div\b[^>]*>([\s\S]*?)<\/div>/gi)].map(m=>text(m[1])).filter(Boolean),name=parts[0];if(!name||/^(?:baby\b|claire['’]?s\b)/i.test(name))continue;
  const path=label.match(/<a\b[^>]*\bhref\s*=\s*["']?([^\s>"']+)/i)?.[1];if(!path)continue;let url;try{url=new URL(path,SOURCE);if(url.origin!=='https://clicks.co.za'||!/^\/store\/[^/]+\/\d+$/.test(url.pathname))continue;url.search='';url.hash='';}catch{continue;}
  if(rows.some(row=>row.website===url.href))continue;
  rows.push({id:'clicks-'+url.pathname.split('/').pop(),name:'Clicks '+name,lat,lon,address:parts.slice(1).join(', '),countryCode:parts.some(p=>/^South Africa$/i.test(p))?'ZA':undefined,phone:'',website:url.href,sourceUrl:SOURCE,source:'Official retailer locator',branchDetailsVerified:true,exactProductMatch:false,stockVerified:false,branchStockVerified:false,openingHours:'',openNow:null,directionsAvailable:false,type:'Nearby health and beauty retailer — exact item stock not verified'});
 }return rows;
}
let cached=null,pending=null;
export async function officialClicksBranches(lat,lon){
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return[];
 const key=lat+','+lon;if(cached?.key===key&&Date.now()-cached.at<900000)return cached.rows;if(pending?.key===key)return pending.job;
 const job=(async()=>{try{const url=new URL(SOURCE);url.searchParams.set('q',key);const r=await fetch(url.href,{headers:{accept:'text/html','user-agent':'FindItNearby/42.0'},signal:AbortSignal.timeout(10000)});if(!r.ok)return[];const rows=parseClicksBranches(await r.text());if(rows.length)cached={key,at:Date.now(),rows};return rows;}catch{return[];}})();pending={key,job};try{return await job;}finally{if(pending?.job===job)pending=null;}
}
