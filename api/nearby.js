const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const toks=v=>[...new Set(norm(v).split(/\s+/).filter(x=>x.length>1))];
const clean=v=>String(v??'').trim();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

function overlap(a,b){const A=new Set(toks(a)),B=new Set(toks(b));if(!A.size||!B.size)return 0;let hit=0;for(const x of A)if(B.has(x))hit++;return hit/Math.max(A.size,B.size)}
function haversine(a,b,c,d){const R=6371,p=Math.PI/180;const x=Math.sin((c-a)*p/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin((d-b)*p/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
function number(v){const n=Number(v);return Number.isFinite(n)?n:null}
function branchAvailable(store){if(!store)return false;if(store.in_stock===true||store.available===true)return true;if(Number(store.stock_quantity)>0||Number(store.quantity)>0)return true;const raw=typeof store.stock==='string'?store.stock:(store.stock?.status||store.availability||store.status||'');const s=norm(raw).replace(/\s+/g,'_');return ['in_stock','available','instock','low_stock','limited_stock'].includes(s)}
function scoreProduct(i,p){const left=norm([i.name,i.object,i.searchQuery,i.brand,i.model].join(' '));const right=norm([p.name,p.brand,p.model,p.category,(p.keywords||[]).join(' ')].join(' '));const brand=i.brand&&p.brand?norm(i.brand)===norm(p.brand):null;const model=i.model&&p.model?norm(i.model)===norm(p.model):null;let score=.55*overlap(left,right);if(brand===true)score+=.28;if(brand===false)score-=.2;if(model===true)score+=.42;return clamp(score,0,1)}
function strongEnough(i,p,score){if(i.model)return score>=.62&&(!p.model||norm(i.model)===norm(p.model));if(i.brand)return score>=.54&&(!p.brand||norm(i.brand)===norm(p.brand));const q=toks([i.name,i.object,i.searchQuery].join(' '));const text=norm([p.name,p.category,(p.keywords||[]).join(' ')].join(' '));const hits=q.filter(t=>text.includes(t)).length;return score>=.5&&hits>=2}

async function loadFeeds(){let cfg=[];try{cfg=JSON.parse(process.env.RETAILER_FEEDS_JSON||'[]')}catch{}if(!Array.isArray(cfg))return[];const settled=await Promise.allSettled(cfg.filter(x=>x?.url&&x?.name).map(fetchFeed));return settled.flatMap(x=>x.status==='fulfilled'?x.value:[])}
async function fetchFeed(c){const headers={Accept:'application/json'};if(c.tokenEnv&&process.env[c.tokenEnv])headers.Authorization=`Bearer ${process.env[c.tokenEnv]}`;const r=await fetch(c.url,{headers});if(!r.ok)throw new Error(`${c.name} feed returned ${r.status}`);const d=await r.json();const products=Array.isArray(d)?d:Array.isArray(d.products)?d.products:[];return products.map(p=>({id:String(p.id||p.sku||p.url||p.name||''),name:clean(p.name),brand:clean(p.brand),model:clean(p.model||p.sku),category:clean(p.category),keywords:Array.isArray(p.keywords)?p.keywords.map(String):[],url:clean(p.url),price:number(p.price),currency:p.currency||'ZAR',retailer:c.name,stores:Array.isArray(p.stores)?p.stores:[]})).filter(p=>p.name)}

function fallbackShopTags(i){
 const t=norm([i.retailCategory,i.category,i.object,i.name,i.searchQuery,...(i.likelyStoreTypes||[])].join(' '));
 const rules=[
  [/pencil|stationery|notebook|school supplies|pencil case/,['stationery','books','department_store']],
  [/shoe|sneaker|footwear|trainer/,['shoes','sports']],
  [/clothing|shirt|dress|hoodie|jacket|jeans|uniform|blazer/,['clothes','fashion','department_store']],
  [/phone|mobile phone|smartphone/,['mobile_phone','electronics']],
  [/computer|laptop|monitor|keyboard|mouse|electronics|headphone|earbud|speaker|microphone|camera|television|tv/,['electronics','computer','mobile_phone']],
  [/eyeglass|glasses|spectacle|sunglass|eyewear|optician/,['optician']],
  [/toiletry bag|travel pouch|luggage|suitcase|backpack|handbag|purse|wallet|bag/,['bag','travel_agency','department_store']],
  [/grocery|food|drink|cereal|milk|bread|toilet paper|tissue|detergent|household/,['supermarket','convenience']],
  [/perfume|fragrance|makeup|cosmetic|skincare|beauty/,['beauty','chemist','department_store']],
  [/fridge|refrigerator|washing machine|dishwasher|microwave|oven|air fryer|kettle|toaster|vacuum|appliance/,['appliance','electronics']],
  [/drill|saw|hammer|screwdriver|tool|hardware|paint|cement|plumbing/,['hardware','doityourself']],
  [/flower|plant|garden|seedling|florist|nursery/,['florist','garden_centre']],
  [/toy|lego|doll|action figure|board game|puzzle/,['toys','department_store']],
  [/sport|rugby|football|fitness/,['sports']],
  [/pet|dog food|cat food/,['pet']],
  [/car part|tyre|battery|automotive/,['car_parts','tyres']],
  [/pharmacy|medicine|health/,['chemist']],
  [/tractor|farm machinery|agricultural machinery/,['agrarian','trade']],
  [/car|suv|bakkie|pickup truck|vehicle/,['car']],
  [/motorcycle|motorbike/,['motorcycle']]
 ];
 for(const [re,tags] of rules)if(re.test(t))return tags;
 return [];
}
function osmName(tags={}){return clean(tags.name||tags.brand||tags.operator||'Relevant retailer')}
function osmAddress(tags={}){return clean(tags['addr:full']||[tags['addr:housenumber'],tags['addr:street'],tags['addr:suburb'],tags['addr:city']].filter(Boolean).join(' '))}
function osmWebsite(tags={}){let u=clean(tags.website||tags['contact:website']);if(u&&!/^https?:\/\//i.test(u))u='https://'+u;return u}
function osmPhone(tags={}){return clean(tags.phone||tags['contact:phone'])}
async function loadLikelyRetailers(i,lat,lon,radiusKm){
 const tags=fallbackShopTags(i);if(!tags.length)return[];
 const meters=Math.round(radiusKm*1000);
 const parts=tags.map(tag=>`nwr["shop"="${tag}"](around:${meters},${lat},${lon});`).join('');
 const query=`[out:json][timeout:18];(${parts});out center tags;`;
 const endpoints=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
 let data=null,last=null;
 for(const endpoint of endpoints){try{const r=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','user-agent':'FindIt-Nearby/1.0'},body:'data='+encodeURIComponent(query)});if(!r.ok)throw Error(`Overpass ${r.status}`);data=await r.json();break}catch(e){last=e}}
 if(!data)throw last||Error('Nearby map data unavailable');
 const allowed=new Set(tags);
 return (data.elements||[]).map(e=>{const tg=e.tags||{};const slat=number(e.lat??e.center?.lat),slon=number(e.lon??e.center?.lon);if(slat==null||slon==null||!allowed.has(tg.shop))return null;const distanceKm=haversine(lat,lon,slat,slon);if(distanceKm>radiusKm)return null;return {id:`osm:${e.type}:${e.id}`,name:osmName(tg),address:osmAddress(tg),lat:slat,lon:slon,distanceKm,phone:osmPhone(tg),website:osmWebsite(tg),type:'Likely retailer — exact item not verified',shopType:tg.shop,stockVerified:false,stockStatus:'Exact stock not verified',exactProductMatch:false,matchTier:'likely-retailer',source:'OpenStreetMap',price:null,currency:null}}).filter(Boolean).sort((a,b)=>a.distanceKm-b.distanceKm).slice(0,20)
}

export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 try{
  const {lat,lon,identification={},radiusKm:requested}=req.body||{};const a=number(lat),b=number(lon);if(a==null||b==null)return res.status(400).json({error:'Valid location required'});const radiusKm=Math.min(25,Math.max(3,number(requested)||10));const item=identification.name||identification.model||identification.object||'this product';const brand=identification.brand||null;
  const products=await loadFeeds();const exact=[];
  for(const p of products){const match=scoreProduct(identification,p);if(!strongEnough(identification,p,match))continue;for(const s of p.stores||[]){const slat=number(s.lat??s.latitude),slon=number(s.lon??s.lng??s.longitude);if(slat==null||slon==null||!branchAvailable(s))continue;const distanceKm=haversine(a,b,slat,slon);if(distanceKm>radiusKm)continue;exact.push({id:String(s.id||`${p.id}:${s.name||slat+','+slon}`),name:clean(s.name)||p.retailer,address:clean(s.address||s.formatted_address),lat:slat,lon:slon,distanceKm,phone:clean(s.phone),website:clean(s.website||p.url),type:'Verified exact-product branch',stockVerified:true,stockStatus:'In stock',exactProductMatch:true,matchTier:'exact',productName:p.name,productUrl:p.url,retailer:p.retailer,price:p.price,currency:p.currency,match,source:'Connected retailer feed'})}}
  const dedupe=(rows,max=20)=>{const out=[],seen=new Set();for(const s of rows){const key=norm(`${s.name}|${s.address}|${Number(s.lat).toFixed(5)}|${Number(s.lon).toFixed(5)}`);if(seen.has(key))continue;seen.add(key);out.push(s);if(out.length>=max)break}return out};
  const exactRows=dedupe(exact.sort((x,y)=>y.match-x.match||x.distanceKm-y.distanceKm),10);
  let likely=[];try{likely=await loadLikelyRetailers(identification,a,b,radiusKm)}catch(e){console.warn('Likely retailer fallback unavailable',e.message)}
  const exactKeys=new Set(exactRows.map(s=>norm(s.name)));likely=likely.filter(s=>!exactKeys.has(norm(s.name)));
  const stores=[...exactRows,...dedupe(likely,Math.max(0,20-exactRows.length))];
  const message=exactRows.length
   ?`Found ${exactRows.length} verified exact-product branch${exactRows.length===1?'':'es'}${likely.length?` plus ${Math.min(likely.length,20-exactRows.length)} nearby relevant retailer${Math.min(likely.length,20-exactRows.length)===1?'':'s'} where exact stock is not verified.`:'.'}`
   :stores.length
    ?`No exact verified listing was found within ${radiusKm} km. Showing ${stores.length} nearby retailer${stores.length===1?'':'s'} that genuinely match this product type. Exact item, price and stock are not verified.`
    :`${brand?brand+' ':''}${item}: no exact verified branch or strongly relevant nearby retailer was found within ${radiusKm} km.`;
  return res.status(200).json({ok:true,retailGroup:norm(identification.retailCategory||identification.category||'product'),radiusKm,stores,reliable:true,exactProductOnly:false,exactVerifiedCount:exactRows.length,likelyRetailerCount:Math.max(0,stores.length-exactRows.length),branchStockVerified:exactRows.length>0,item,brand,message,disclaimer:'Exact-match badges, prices and stock are shown only from connected retailer data. Other nearby stores are clearly labelled as likely retailers and do not imply exact stock.'});
 }catch(e){console.error('nearby',e);return res.status(503).json({ok:false,reliable:false,stores:[],error:'Nearby retailer availability is temporarily unavailable.'})}
}
