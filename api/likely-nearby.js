const clean=v=>String(v??'').trim();
const norm=v=>clean(v).toLowerCase();
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
function km(a,b,c,d){const R=6371,p=Math.PI/180;const x=Math.sin((c-a)*p/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin((d-b)*p/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
function tagsFor(i={}){const s=norm([i.category,i.retailCategory,i.object,i.name,i.searchQuery].join(' '));
 if(/grocery|household|toilet paper|food|supermarket|cleaning|beverage|snack/.test(s))return ['supermarket','convenience','department_store','variety_store'];
 if(/pharmacy|medicine|cream|health|medical/.test(s))return ['chemist','pharmacy'];
 if(/beauty|perfume|cosmetic|skincare|makeup/.test(s))return ['beauty','cosmetics','perfumery','chemist'];
 if(/electronic|audio|microphone|computer|phone|camera|gaming/.test(s))return ['electronics','computer','mobile_phone'];
 if(/shoe|footwear/.test(s))return ['shoes','sports'];
 if(/clothing|clothes|fashion|shirt|dress|jacket|uniform/.test(s))return ['clothes','department_store'];
 if(/stationery|pencil|pen|book|school supplies/.test(s))return ['stationery','books'];
 if(/hardware|tool|diy|paint|building/.test(s))return ['hardware','doityourself'];
 if(/sport|fitness|gym|outdoor/.test(s))return ['sports','outdoor'];
 if(/pet|dog|cat|animal/.test(s))return ['pet'];
 if(/toy|game/.test(s))return ['toys'];
 if(/furniture|home decor|homeware/.test(s))return ['furniture','houseware','department_store'];
 return ['department_store','variety_store'];
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','s-maxage=120, stale-while-revalidate=300');
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const {lat,lon,radiusKm=10,identification={}}=req.body||{};const a=num(lat),b=num(lon);if(a==null||b==null)return res.status(400).json({error:'Valid location required'});
 const r=Math.max(3,Math.min(25,num(radiusKm)||10))*1000,tags=tagsFor(identification);
 const ors=tags.map(t=>`nwr(around:${Math.round(r)},${a},${b})[shop=${JSON.stringify(t)}];`).join('');
 const q=`[out:json][timeout:12];(${ors});out center tags;`;
 try{
  const rr=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','user-agent':'FindIt-Nearby/1.0'},body:new URLSearchParams({data:q})});
  if(!rr.ok)throw Error('Overpass '+rr.status);const d=await rr.json();const seen=new Set(),stores=[];
  for(const e of d.elements||[]){const t=e.tags||{},name=clean(t.name||t.brand||t.operator);if(!name)continue;const x=num(e.lat??e.center?.lat),y=num(e.lon??e.center?.lon);if(x==null||y==null)continue;const distanceKm=km(a,b,x,y);const key=norm(name)+'|'+x.toFixed(4)+'|'+y.toFixed(4);if(seen.has(key))continue;seen.add(key);stores.push({id:`osm-${e.type}-${e.id}`,name,address:clean([t['addr:housenumber'],t['addr:street'],t['addr:suburb'],t['addr:city']].filter(Boolean).join(' ')),lat:x,lon:y,distanceKm,phone:clean(t.phone||t['contact:phone']),website:clean(t.website||t['contact:website']),shopType:clean(t.shop),exactProductMatch:false,stockVerified:false,matchTier:'likely',type:'Likely relevant retailer — exact item not verified',source:'OpenStreetMap retail category'});}
  stores.sort((x,y)=>x.distanceKm-y.distanceKm);return res.status(200).json({ok:true,stores:stores.slice(0,12),tags,disclaimer:'These are real nearby retailers matching the product category. Exact product availability is not verified.'});
 }catch(e){console.error('likely-nearby',e);return res.status(503).json({ok:false,stores:[],error:'Nearby retailer discovery is temporarily unavailable.'});}
}