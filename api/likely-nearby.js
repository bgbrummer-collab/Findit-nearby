const clean=v=>String(v??'').trim();
const norm=v=>clean(v).toLowerCase();
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
function km(a,b,c,d){const R=6371,p=Math.PI/180;const x=Math.sin((c-a)*p/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin((d-b)*p/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
function tagsFor(i={}){const s=norm([i.category,i.retailCategory,i.object,i.name,i.searchQuery].join(' '));
 if(/grocery|household|toilet[_ ]?paper|food|supermarket|cleaning|beverage|snack|tissue|paper towel/.test(s))return {shops:['supermarket','convenience','department_store','variety_store'],amenities:['marketplace']};
 if(/pharmacy|medicine|cream|health|medical/.test(s))return {shops:['chemist','pharmacy'],amenities:['pharmacy']};
 if(/beauty|perfume|cosmetic|skincare|makeup/.test(s))return {shops:['beauty','cosmetics','perfumery','chemist'],amenities:[]};
 if(/electronic|audio|microphone|computer|phone|camera|gaming/.test(s))return {shops:['electronics','computer','mobile_phone'],amenities:[]};
 if(/shoe|footwear/.test(s))return {shops:['shoes','sports'],amenities:[]};
 if(/clothing|clothes|fashion|shirt|dress|jacket|uniform/.test(s))return {shops:['clothes','department_store'],amenities:[]};
 if(/stationery|pencil|pen|book|school supplies/.test(s))return {shops:['stationery','books'],amenities:[]};
 if(/hardware|tool|diy|paint|building/.test(s))return {shops:['hardware','doityourself'],amenities:[]};
 if(/sport|fitness|gym|outdoor/.test(s))return {shops:['sports','outdoor'],amenities:[]};
 if(/pet|dog|cat|animal/.test(s))return {shops:['pet'],amenities:[]};
 if(/toy|game/.test(s))return {shops:['toys'],amenities:[]};
 if(/furniture|home decor|homeware/.test(s))return {shops:['furniture','houseware','department_store'],amenities:[]};
 return {shops:['department_store','variety_store','convenience'],amenities:[]};
}
async function overpass(query){
 const endpoints=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter','https://overpass.nchc.org.tw/api/interpreter'];
 let last=null;
 for(const endpoint of endpoints){
  try{const rr=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','user-agent':'FindIt-Nearby/1.0'},body:new URLSearchParams({data:query}),signal:AbortSignal.timeout?.(9000)});if(!rr.ok)throw Error(`Overpass ${rr.status}`);return await rr.json()}catch(e){last=e}
 }
 throw last||Error('Nearby lookup failed');
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','s-maxage=60, stale-while-revalidate=180');
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const {lat,lon,radiusKm=10,identification={}}=req.body||{};const a=num(lat),b=num(lon);if(a==null||b==null)return res.status(400).json({error:'Valid location required'});
 const r=Math.max(3,Math.min(25,num(radiusKm)||10))*1000,{shops,amenities}=tagsFor(identification);
 const clauses=[...shops.map(t=>`nwr(around:${Math.round(r)},${a},${b})[shop=${JSON.stringify(t)}];`),...amenities.map(t=>`nwr(around:${Math.round(r)},${a},${b})[amenity=${JSON.stringify(t)}];`)].join('');
 const q=`[out:json][timeout:20];(${clauses});out center tags;`;
 try{
  const d=await overpass(q),seen=new Set(),stores=[];
  for(const e of d.elements||[]){const t=e.tags||{},name=clean(t.name||t.brand||t.operator);if(!name)continue;const x=num(e.lat??e.center?.lat),y=num(e.lon??e.center?.lon);if(x==null||y==null)continue;const distanceKm=km(a,b,x,y);if(distanceKm>(r/1000)+0.25)continue;const key=norm(name)+'|'+x.toFixed(4)+'|'+y.toFixed(4);if(seen.has(key))continue;seen.add(key);stores.push({id:`osm-${e.type}-${e.id}`,name,address:clean([t['addr:housenumber'],t['addr:street'],t['addr:suburb'],t['addr:city']].filter(Boolean).join(' ')),lat:x,lon:y,distanceKm,phone:clean(t.phone||t['contact:phone']),website:clean(t.website||t['contact:website']),shopType:clean(t.shop||t.amenity),exactProductMatch:false,stockVerified:false,matchTier:'likely',type:'Relevant nearby retailer — exact item not verified',source:'OpenStreetMap retail category'});}
  stores.sort((x,y)=>x.distanceKm-y.distanceKm);
  return res.status(200).json({ok:true,stores:stores.slice(0,20),tags:{shops,amenities},disclaimer:'These are real nearby retailers matching the product type. Exact product availability and branch stock are not verified.'});
 }catch(e){console.error('likely-nearby',e);return res.status(503).json({ok:false,stores:[],error:'Nearby retailer discovery is temporarily unavailable. Please try again.'});}
}