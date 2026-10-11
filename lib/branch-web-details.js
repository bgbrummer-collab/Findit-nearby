import {RETAILERS} from './retailers.js';
const clean=v=>String(v??'').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const norm=v=>clean(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const cache=new Map();
const pendingPages=new Map();
async function branchPage(url,domain){
 if(pendingPages.has(url))return pendingPages.get(url);
 const task=(async()=>{let target=url;for(let step=0;step<2;step++){const r=await fetch(target,{redirect:"manual",signal:AbortSignal.timeout(11000),headers:{accept:"text/html","user-agent":"FindItNearby/42.0","accept-language":"en-ZA,en;q=0.9"}});if([301,302,303,307,308].includes(r.status)){const next=new URL(r.headers.get("location")||"",target).href;if(!sameDomain(next,domain))return null;target=next;continue;}if(!r.ok)return null;return {url:target,html:(await r.text()).slice(0,2000000)};}return null;})();
 pendingPages.set(url,task);try{return await task;}finally{pendingPages.delete(url);}
}
const BRANCH_DOMAINS={'computer mania':'computermania.co.za','cell c':'cellc.co.za','mtn':'mtn.co.za','telkom':'telkom.co.za','vodacom':'vodacom.co.za','istore':'istore.co.za'};
function domainFor(store){try{const u=new URL(store.website);if(u.protocol==='https:'){const host=u.hostname.replace(/^www\./,'');if(!/^\d|localhost|\[/.test(host)&&!host.endsWith('.local'))return host;}}catch{}const name=norm(store.name);const extra=Object.entries(BRANCH_DOMAINS).find(([n])=>name===n||name.startsWith(n+' '));if(extra)return extra[1];return RETAILERS.find(r=>name===norm(r.name)||name.startsWith(norm(r.name)+' '))?.domain||'';}
function sameDomain(url,domain){try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&(u.hostname===domain||u.hostname.endsWith('.'+domain));}catch{return false;}}
export function parseBranchDetails(html,store,url){
 const nodes=[];for(const m of String(html).matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{const stack=[JSON.parse(m[1])];while(stack.length&&nodes.length<200){const x=stack.pop();if(Array.isArray(x))stack.push(...x);else if(x&&typeof x==='object'){nodes.push(x);for(const key of ['@graph','department','location','subOrganization'])if(x[key])stack.push(x[key]);}}}catch{}}
 // Magento/Vaimo locators publish branch records as inert JSON, not JSON-LD.
 for(const m of String(html).matchAll(/<script\b[^>]*type=["']text\/x-magento-init["'][^>]*>([\s\S]*?)<\/script>/gi))try{
  const stack=[JSON.parse(m[1])];let visited=0;while(stack.length&&visited++<10000){const x=stack.pop();if(!x||typeof x!=='object')continue;if(Array.isArray(x)){stack.push(...x);continue;}
   if(x.name&&x.address&&x.latitude!=null&&x.longitude!=null){const rules=[],days={monday:'Mo',tuesday:'Tu',wednesday:'We',thursday:'Th',friday:'Fr',saturday:'Sa',sunday:'Su',public_holiday:'PH'};let schedule={};try{schedule=typeof x.opening_hours==='string'?JSON.parse(x.opening_hours):x.opening_hours||{};}catch{}
    for(const r of Object.values(schedule)){const d=days[r.weekday];if(d&&/^\d{2}:\d{2}$/.test(r.open_time||'')&&/^\d{2}:\d{2}$/.test(r.close_time||''))rules.push(d+' '+r.open_time+'-'+r.close_time);}
    nodes.push({'@type':'Store',name:x.name,address:{streetAddress:x.address,addressLocality:x.city,postalCode:x.postcode},telephone:x.phone,geo:{latitude:x.latitude,longitude:x.longitude},openingHours:rules.join('; ')});
   }for(const v of Object.values(x))if(v&&typeof v==='object')stack.push(v);
  }
 }catch{}
 // Scoped locator cards work across retailers without reading corporate footer fields.
 for(const m of String(html).matchAll(/<li\b([^>]*\bdata-(?:title|name)=[^>]*)>([\s\S]*?)<\/li>/gi)){
  const attrs={};for(const a of m[1].matchAll(/data-([\w-]+)\s*=\s*["']([^"']*)["']/gi))attrs[a[1]]=clean(a[2]);
  const name=attrs.title||attrs.name,address=attrs.address,lat=attrs.lat||attrs.latitude,lon=attrs.lng||attrs.lon||attrs.longitude;
  if(!name||!address||lat==null||lon==null)continue;
  const phone=clean((m[2].match(/Phone:\s*([^<]+)/i)||[])[1]),href=(m[2].match(/href=["']([^"']+)["']/i)||[])[1];let detailUrl='';try{if(!href)throw Error('No detail link');const u=new URL(href,url);if(sameDomain(u.href,new URL(url).hostname.replace(/^www\./,'')))detailUrl=u.href;}catch{}
  nodes.push({'@type':'Store',name,address:{streetAddress:address},geo:{latitude:lat,longitude:lon},telephone:phone,detailUrl});
 }
 // Clicks publishes branch fields in scoped HTML rather than JSON-LD.
 if(sameDomain(url,'clicks.co.za')&&new URL(url).pathname.startsWith('/store/')){
  const title=clean((String(html).match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)||[])[1]),address=clean((String(html).match(/<strong>\s*Address\s*<\/strong>\s*<span>([\s\S]*?)<\/span>/i)||[])[1]);
  const start=String(html).indexOf('class="store-hours"'),section=start>=0?String(html).slice(start,start+14000):'',rules=[],days={Monday:'Mo',Tuesday:'Tu',Wednesday:'We',Thursday:'Th',Friday:'Fr',Saturday:'Sa',Sunday:'Su','Public Holidays':'PH'};
  for(const m of section.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi)){const day=days[clean(m[1])],time=clean(m[2]).replace(/(\d{2})\.(\d{2})/g,'$1:$2').replace(/\s*-\s*/g,'-');if(day&&/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(time))rules.push(day+' '+time);}
  const phone=clean((section.match(/<dt[^>]*>\s*Shop telephone 1\s*<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/i)||[])[1]);
  const map=(String(html).replace(/<!--[\s\S]*?-->/g,'').match(/<div\b[^>]*class=["']map active["'][^>]*>/i)||[])[0]||'',lat=(map.match(/data-latitude\s*=\s*["']([^"']+)/i)||[])[1],lon=(map.match(/data-longitude\s*=\s*["']([^"']+)/i)||[])[1];
  if(title&&address)nodes.push({'@type':'Pharmacy',name:'Clicks '+title,address:{streetAddress:address},telephone:phone,openingHours:rules.join('; '),geo:lat&&lon?{latitude:lat,longitude:lon}:null});
 }
 const branchNorm=v=>norm(v).replace(/^incredible connection\b/,'incredible');
 const wanted=branchNorm(store.name),addressTokens=norm(store.address).split(' ').filter(x=>(x.length>3||/^\d{2,6}$/.test(x))&&!/^(street|road|shop|mall|south|africa|centre|center|pretoria)$/.test(x));
 for(const x of nodes){const types=Array.isArray(x['@type'])?x['@type']:[x['@type']];if(!types.some(t=>/Store|LocalBusiness|Pharmacy|ShoppingCenter/i.test(t||'')))continue;const name=branchNorm(x.name);if(!name||!(name===wanted||name.startsWith(wanted+' ')||wanted.startsWith(name+' ')))continue;
  const a=x.address||{},address=clean([a.streetAddress,a.addressLocality,a.addressRegion,a.postalCode].filter(Boolean).join(', ')),published=norm(address);
  const lat=x.geo?.latitude,lon=x.geo?.longitude,geoMatch=lat!=null&&lon!=null&&store.lat!=null&&store.lon!=null&&Math.hypot((Number(lat)-Number(store.lat))*111,(Number(lon)-Number(store.lon))*111*Math.cos(Number(store.lat)*Math.PI/180))<.15;
  const addressMatch=addressTokens.length>=2&&addressTokens.filter(t=>published.split(' ').includes(t)).length>=Math.max(2,Math.ceil(addressTokens.length*.7));
  if(!geoMatch&&!addressMatch)continue;
  let hours=Array.isArray(x.openingHours)?x.openingHours.join('; '):clean(x.openingHours);
  if(!hours&&Array.isArray(x.openingHoursSpecification)){const days={Monday:'Mo',Tuesday:'Tu',Wednesday:'We',Thursday:'Th',Friday:'Fr',Saturday:'Sa',Sunday:'Su'};const rules=[];for(const rule of x.openingHoursSpecification){for(const d of [].concat(rule.dayOfWeek||[])){const day=days[String(d).split('/').pop()];if(day&&/^\d{2}:\d{2}$/.test(rule.opens||'')&&/^\d{2}:\d{2}$/.test(rule.closes||''))rules.push(day+' '+rule.opens+'-'+rule.closes);}}hours=rules.join('; ');}
  return {branchName:clean(x.name),detailUrl:x.detailUrl||'',phone:clean(x.telephone),publishedAddress:address,todayHours:hours,website:url,sourceUrl:url,sourceLabel:'Official retailer branch page',branchDetailsVerified:true};
 }return null;
}
export async function researchBranchDetails(store){
 const domain=domainFor(store);const hasCoordinates=store.lat!=null&&store.lon!=null&&store.lat!==''&&store.lon!==''&&Number.isFinite(Number(store.lat))&&Number.isFinite(Number(store.lon));if(!domain||(!store.address&&!hasCoordinates))return null;
 const key=[store.name,store.address,store.lat,store.lon,domain].join('|'),hit=cache.get(key);if(hit&&Date.now()-hit.at<(hit.value?15*60*1000:30000))return hit.value;
 let value=null,urls=domain==='computermania.co.za'?['https://computermania.co.za/pages/store-locator']:domain==='incredible.co.za'?['https://www.incredible.co.za/storelocator/']:sameDomain(store.website,domain)&&new URL(store.website).pathname!=='/'?[store.website]:[];
 if(!urls.length)try{const q=`site:${domain} ${clean(store.name)} ${clean(store.address)} ${store.branchName||''} store opening hours contact`,r=await fetch('https://www.bing.com/search?format=rss&q='+encodeURIComponent(q),{signal:AbortSignal.timeout(2500)});if(r.ok){const xml=await r.text();urls=[...xml.matchAll(/<link>([\s\S]*?)<\/link>/gi)].map(m=>clean(m[1])).filter(u=>sameDomain(u,domain));}}catch{}
 if(!urls.length&&store.website&&sameDomain(store.website,domain))urls.push(store.website);
 const pages=await Promise.all([...new Set(urls)].slice(0,2).map(async url=>{try{const page=await branchPage(url,domain);return page?parseBranchDetails(page.html,store,page.url):null;}catch{return null;}}));value=pages.find(Boolean)||null;
 if(value?.detailUrl)try{const page=await branchPage(value.detailUrl,domain);if(page){const raw=page.html,heading=clean((raw.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)||[])[1]);if(norm(heading)===norm(value.branchName)){const part=(raw.match(/<h[23][^>]*>(?:(?!<\/h[23]>)[\s\S])*?Opening hours(?:(?!<\/h[23]>)[\s\S])*?<\/h[23]>([\s\S]*?)(?=<h[123]|<\/main|<\/section|<footer|<theme-footer|$)/i)||[])[1]||'';value.todayHours=parsePublishedHours(part);if(value.todayHours){value.sourceUrl=page.url;value.website=page.url;}}}}catch{}

 cache.set(key,{at:Date.now(),value});if(cache.size>200)cache.delete(cache.keys().next().value);return value;
}

export function parsePublishedHours(html){
 const text=String(html).replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' '),days={Monday:'Mo',Tuesday:'Tu',Wednesday:'We',Thursday:'Th',Friday:'Fr',Saturday:'Sa',Sunday:'Su','Public Holidays':'PH'},rules=[];
 const time=(h,m,ap)=>{let n=Number(h);if(n<1||n>12||Number(m)>59)return null;n=n%12+(/pm/i.test(ap)?12:0);return String(n).padStart(2,'0')+':'+m;};
 for(const m of text.matchAll(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Public Holidays)(?:\s*[-–]\s*(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday))?\s+(\d{1,2}):(\d{2})\s*(AM|PM)\s*[-–]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/gi)){const day=Object.keys(days).find(d=>d.toLowerCase()===m[1].toLowerCase()),end=Object.keys(days).find(d=>d.toLowerCase()===m[2]?.toLowerCase()),a=time(m[3],m[4],m[5]),b=time(m[6],m[7],m[8]);if(a&&b)rules.push(days[day]+(end?'-'+days[end]:'')+' '+a+'-'+b);}
 return rules.join('; ');
}
