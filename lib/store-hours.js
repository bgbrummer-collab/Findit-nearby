const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0,350);
const normalized = value => clean(value).toLowerCase();
const unknown = () => ({status:'unknown', opensAt:'', closesAt:''});

// Evaluate only simple, unambiguous published schedules. Holiday exceptions and
// overnight/complex rules need a full opening-hours evaluator; do not guess them.
export function scheduleStatus(hours, timeZone, at = new Date()) {
  if (hours === '24/7') return {...unknown(),status:'open'};
  if (/^(off|closed)$/i.test(hours)) return {...unknown(),status:'closed'};
  if (!timeZone || !hours || /PH|SH|sunrise|sunset|\+|\"/i.test(hours)) return unknown();
  let parts;
  try { parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone,weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(at).map(p=>[p.type,p.value])); }
  catch { return unknown(); }
  const days=['Mo','Tu','We','Th','Fr','Sa','Su'],day=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].indexOf(parts.weekday),minute=Number(parts.hour)*60+Number(parts.minute);
  const rules=[];
  for (const raw of hours.split(';')) {
    const m=raw.trim().match(/^(Mo|Tu|We|Th|Fr|Sa|Su)(?:-(Mo|Tu|We|Th|Fr|Sa|Su))?\s+(off|closed|\d{2}:\d{2}-\d{2}:\d{2})$/);
    if(!m)return unknown();
    const start=days.indexOf(m[1]),end=days.indexOf(m[2]||m[1]);if(end<start)return unknown();
    if(/off|closed/.test(m[3])) {rules.push({start,end,closed:true});continue;}
    const [open,close]=m[3].split('-'),nums=m[3].match(/\d+/g).map(Number);
    if(nums[0]>23||nums[2]>24||nums[1]>59||nums[3]>59||nums[2]===24&&nums[3]!==0)return unknown();
    const a=nums[0]*60+nums[1],b=nums[2]*60+nums[3];if(b<=a)return unknown();
    rules.push({start,end,a,b,open,close});
  }
  const today=rules.filter(r=>day>=r.start&&day<=r.end);
  if(today.length>1)return unknown();
  const r=today[0];if(!r||r.closed)return {...unknown(),status:'closed'};
  if(minute>=r.a&&minute<r.b)return {...unknown(),status:'open',closesAt:r.close};
  return {...unknown(),status:'closed',opensAt:minute<r.a?r.open:''};
}

export async function branchHours(body={}) {
  const inputs=(Array.isArray(body.stores)?body.stores:[]).slice(0,8).filter(s=>clean(s.name));
  if(!inputs.length)return {ok:false,error:'Stores required'};
  const valid=s=>s.lat!=null&&s.lon!=null&&s.lat!==''&&s.lon!==''&&Number.isFinite(Number(s.lat))&&Number.isFinite(Number(s.lon))&&Math.abs(Number(s.lat))<=90&&Math.abs(Number(s.lon))<=180;
  const located=inputs.filter(valid),rows=[];
  if(located.length){
    const query='[out:json][timeout:7];('+located.map(s=>`nwr(around:40,${Number(s.lat)},${Number(s.lon)})[shop];`).join('')+');out center tags;';
    const results=await Promise.allSettled(['https://overpass.kumi.systems/api/interpreter','https://overpass-api.de/api/interpreter'].map(async url=>{
      const r=await fetch(url,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({data:query}),signal:AbortSignal.timeout(8000)});
      return r.ok?(await r.json()).elements||[]:[];
    }));
    for(const r of results)if(r.status==='fulfilled')rows.push(...r.value);
  }
  const stores=inputs.map(s=>{
    const match=valid(s)?rows.filter(r=>normalized(r.tags?.name||r.tags?.brand||r.tags?.operator)===normalized(s.name)).find(r=>{
      const a=Number(r.lat??r.center?.lat),b=Number(r.lon??r.center?.lon);
      return Number.isFinite(a)&&Number.isFinite(b)&&Math.hypot((a-Number(s.lat))*111,(b-Number(s.lon))*111*Math.cos(a*Math.PI/180))<=.04;
    }):null;
    const hours=clean(match?.tags?.opening_hours),lat=Number(s.lat),lon=Number(s.lon);
    const zone=match?.tags?.timezone||(lat>=-35&&lat<=-22&&lon>=16&&lon<=33?'Africa/Johannesburg':'');
    return {name:clean(s.name),address:clean(s.address),...scheduleStatus(hours,zone),todayHours:hours,sourceLabel:hours?'OpenStreetMap published branch schedule':'No published branch hours verified',sourceUrl:match?`https://www.openstreetmap.org/${match.type}/${match.id}`:'',hoursVerified:Boolean(hours)};
  });
  return {ok:true,researchMode:'published-branch-hours',retryable:false,checkedAt:new Date().toISOString(),stores,sources:stores.filter(s=>s.sourceUrl).map(s=>({title:s.name,url:s.sourceUrl}))};
}
