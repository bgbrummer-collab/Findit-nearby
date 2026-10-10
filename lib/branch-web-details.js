import {RETAILERS} from './retailers.js';
const clean=v=>String(v??'').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const norm=v=>clean(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const cache=new Map();
function domainFor(store){try{const u=new URL(store.website);if(u.protocol==='https:'){const host=u.hostname.replace(/^www\./,'');if(!/^\d|localhost|\[/.test(host)&&!host.endsWith('.local'))return host;}}catch{}const name=norm(store.name);return RETAILERS.find(r=>name===norm(r.name)||name.startsWith(norm(r.name)+' '))?.domain||'';}
function sameDomain(url,domain){try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&(u.hostname===domain||u.hostname.endsWith('.'+domain));}catch{return false;}}
export function parseBranchDetails(html,store,url){
 const nodes=[];for(const m of String(html).matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{const stack=[JSON.parse(m[1])];while(stack.length&&nodes.length<200){const x=stack.pop();if(Array.isArray(x))stack.push(...x);else if(x&&typeof x==='object'){nodes.push(x);for(const key of ['@graph','department','location','subOrganization'])if(x[key])stack.push(x[key]);}}}catch{}}
 // Clicks publishes branch fields in scoped HTML rather than JSON-LD.
 if(sameDomain(url,'clicks.co.za')&&new URL(url).pathname.startsWith('/store/')){
  const title=clean((String(html).match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)||[])[1]),address=clean((String(html).match(/<strong>\s*Address\s*<\/strong>\s*<span>([\s\S]*?)<\/span>/i)||[])[1]);
  const start=String(html).indexOf('class="store-hours"'),section=start>=0?String(html).slice(start,start+14000):'',rules=[],days={Monday:'Mo',Tuesday:'Tu',Wednesday:'We',Thursday:'Th',Friday:'Fr',Saturday:'Sa',Sunday:'Su','Public Holidays':'PH'};
  for(const m of section.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi)){const day=days[clean(m[1])],time=clean(m[2]).replace(/(\d{2})\.(\d{2})/g,'$1:$2').replace(/\s*-\s*/g,'-');if(day&&/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(time))rules.push(day+' '+time);}
  const phone=clean((section.match(/<dt[^>]*>\s*Shop telephone 1\s*<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/i)||[])[1]);
  const map=(String(html).replace(/<!--[\s\S]*?-->/g,'').match(/<div\b[^>]*class=["']map active["'][^>]*>/i)||[])[0]||'',lat=(map.match(/data-latitude\s*=\s*["']([^"']+)/i)||[])[1],lon=(map.match(/data-longitude\s*=\s*["']([^"']+)/i)||[])[1];
  if(title&&address)nodes.push({'@type':'Pharmacy',name:'Clicks '+title,address:{streetAddress:address},telephone:phone,openingHours:rules.join('; '),geo:lat&&lon?{latitude:lat,longitude:lon}:null});
 }
 const wanted=norm(store.name),addressTokens=norm(store.address).split(' ').filter(x=>(x.length>3||/^\d{2,6}$/.test(x))&&!/^(street|road|shop|mall|south|africa|centre|center|pretoria)$/.test(x));
 for(const x of nodes){const types=Array.isArray(x['@type'])?x['@type']:[x['@type']];if(!types.some(t=>/Store|LocalBusiness|Pharmacy|ShoppingCenter/i.test(t||'')))continue;const name=norm(x.name);if(!name||!(name===wanted||name.startsWith(wanted+' ')||wanted.startsWith(name+' ')))continue;
  const a=x.address||{},address=clean([a.streetAddress,a.addressLocality,a.addressRegion,a.postalCode].filter(Boolean).join(', ')),published=norm(address);
  const lat=x.geo?.latitude,lon=x.geo?.longitude,geoMatch=lat!=null&&lon!=null&&store.lat!=null&&store.lon!=null&&Math.hypot((Number(lat)-Number(store.lat))*111,(Number(lon)-Number(store.lon))*111*Math.cos(Number(store.lat)*Math.PI/180))<.15;
  const addressMatch=addressTokens.length>=2&&addressTokens.filter(t=>published.split(' ').includes(t)).length>=Math.max(2,Math.ceil(addressTokens.length*.7));
  if(!geoMatch&&!addressMatch)continue;
  let hours=Array.isArray(x.openingHours)?x.openingHours.join('; '):clean(x.openingHours);
  if(!hours&&Array.isArray(x.openingHoursSpecification)){const days={Monday:'Mo',Tuesday:'Tu',Wednesday:'We',Thursday:'Th',Friday:'Fr',Saturday:'Sa',Sunday:'Su'};const rules=[];for(const rule of x.openingHoursSpecification){for(const d of [].concat(rule.dayOfWeek||[])){const day=days[String(d).split('/').pop()];if(day&&/^\d{2}:\d{2}$/.test(rule.opens||'')&&/^\d{2}:\d{2}$/.test(rule.closes||''))rules.push(day+' '+rule.opens+'-'+rule.closes);}}hours=rules.join('; ');}
  return {phone:clean(x.telephone),publishedAddress:address,todayHours:hours,website:url,sourceUrl:url,sourceLabel:'Official retailer branch page',branchDetailsVerified:true};
 }return null;
}
export async function researchBranchDetails(store){
 const domain=domainFor(store);if(!domain||!store.address)return null;
 const key=[store.name,store.address,store.lat,store.lon,domain].join('|'),hit=cache.get(key);if(hit&&Date.now()-hit.at<15*60*1000)return hit.value;
 let value=null,urls=sameDomain(store.website,domain)&&new URL(store.website).pathname!=='/'?[store.website]:[];
 if(!urls.length)try{const q=`site:${domain} ${clean(store.name)} ${clean(store.address)} store opening hours contact`,r=await fetch('https://www.bing.com/search?format=rss&q='+encodeURIComponent(q),{signal:AbortSignal.timeout(2500)});if(r.ok){const xml=await r.text();urls=[...xml.matchAll(/<link>([\s\S]*?)<\/link>/gi)].map(m=>clean(m[1])).filter(u=>sameDomain(u,domain));}}catch{}
 const pages=await Promise.all([...new Set(urls)].slice(0,2).map(async url=>{try{const p=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(3500),headers:{accept:'text/html'}});if(!p.ok)return null;return parseBranchDetails((await p.text()).slice(0,500000),store,url);}catch{return null;}}));value=pages.find(Boolean)||null;
 cache.set(key,{at:Date.now(),value});if(cache.size>200)cache.delete(cache.keys().next().value);return value;
}
