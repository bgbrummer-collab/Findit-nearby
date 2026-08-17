const PRIMARY_MODEL='gemini-3.6-flash';
const FALLBACK_MODEL='gemini-3.5-flash-lite';
const CONFIDENCE_MIN=.55;
const RESTRICTED=['firearm','gun','rifle','pistol','ammunition','ammo','weapon','knife','knives','machete','sword','switchblade','taser','stun gun','pepper spray','mace','brass knuckles','fireworks','explosive','vape','nicotine','cigarette','cigar','alcohol','beer','wine','liquor','cannabis','marijuana','thc','cbd','psilocybin','magic mushroom','gambling','sports betting','casino','pornography','adult sex toy'];

export default{async fetch(request){
 if(request.method!=='POST')return json({error:'POST only'},405);
 try{
  const key=process.env.GEMINI_API_KEY;if(!key)return json({error:'GEMINI_API_KEY is missing in Vercel.'},500);
  const form=await request.formData(),image=form.get('image');if(!image||typeof image.arrayBuffer!=='function')return json({error:'No image uploaded.'},400);if(!String(image.type||'').startsWith('image/'))return json({error:'Uploaded file must be an image.'},400);if(image.size>8*1024*1024)return json({error:'Image must be smaller than 8 MB.'},413);
  const lat=num(form.get('lat')),lon=num(form.get('lon')),base64=Buffer.from(await image.arrayBuffer()).toString('base64');
  const identification=postProcess(await identify(key,base64,image.type||'image/jpeg'));
  if(isRestricted(identification))return json({identification,offers:[],blocked:true,verified:false,message:'FindIt cannot help search for restricted, dangerous or age-limited products.'});
  if(Number(identification.confidence||0)<CONFIDENCE_MIN)return json({identification,offers:[],blocked:false,verified:false,message:'The image was not identified confidently enough. Try a clearer photo showing the whole item, logo or model text.'});
  const products=await loadFeeds(),offers=matchProducts(identification,products,lat,lon);
  return json({identification,offers,blocked:false,verified:offers.length>0,message:offers.length?'Verified retailer offers found from connected authorised product data.':'The item was identified, but no connected authorised retailer feed returned a verified matching offer yet.'});
 }catch(e){console.error('FindIt /api/search error',e);return json({error:'FindIt image search failed.',message:e.message||'Unknown error'},500)}
}};

async function identify(key,b64,mime){
 const prompt=`You are FindIt Nearby's product-identification engine. Identify the ACTUAL physical product in the photo as accurately as possible.
Use visible logos, text, model numbers, shape, materials, lens/frame shape, controls, ports and other distinctive features. Never invent a brand/model.
Important: do NOT call ordinary eyeglasses, sports/cycling glasses or fashion eyewear "safety glasses" or PPE just because they wrap around or have side shields. Only classify eyewear as safety/PPE when there is direct evidence such as visible safety-standard markings, explicit PPE/safety text, industrial packaging, or unmistakable protective equipment context. If uncertain, use neutral terms such as "eyeglasses", "sports eyewear" or "eyeglasses with side shields" and lower confidence.
Likewise, do not turn any product into a random broad category merely because a store type could sell it.
searchQuery must describe the photographed item itself, not a guessed retailer. retailCategory and likelyStoreTypes must be realistic places that sell that item.
Examples: eyeglasses/sunglasses -> optician/eyewear; sneakers -> footwear/sportswear; microphone -> electronics/music; flower -> florist/garden; pencil case -> stationery; phone -> mobile/electronics.
Return structured JSON only.`;
 const schema={type:'OBJECT',properties:{object:{type:'STRING'},name:{type:'STRING'},brand:{type:'STRING',nullable:true},model:{type:'STRING',nullable:true},category:{type:'STRING'},searchQuery:{type:'STRING'},confidence:{type:'NUMBER'},visibleText:{type:'ARRAY',items:{type:'STRING'}},features:{type:'ARRAY',items:{type:'STRING'}},retailCategory:{type:'STRING'},likelyStoreTypes:{type:'ARRAY',items:{type:'STRING'}},summary:{type:'STRING'}},required:['object','name','category','searchQuery','confidence','visibleText','features','retailCategory','likelyStoreTypes','summary']};
 let last;for(const model of [PRIMARY_MODEL,FALLBACK_MODEL]){const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{parts:[{text:prompt},{inlineData:{mimeType:mime,data:b64}}]}],generationConfig:{responseMimeType:'application/json',responseSchema:schema}})});const raw=await r.json().catch(()=>({}));if(r.ok){const text=raw?.candidates?.[0]?.content?.parts?.find(p=>typeof p.text==='string')?.text;if(!text)throw Error(`${model} returned no identification text`);const x=JSON.parse(text);x.modelUsed=model;return x}last=Error(raw?.error?.message||`${model} failed`)}throw last||Error('Gemini request failed');
}

function postProcess(i){
 i.confidence=clamp(Number(i.confidence||0),0,1);i.brand=clean(i.brand);i.model=clean(i.model);i.visibleText=Array.isArray(i.visibleText)?i.visibleText.filter(Boolean).slice(0,12):[];i.features=Array.isArray(i.features)?i.features.filter(Boolean).slice(0,12):[];i.likelyStoreTypes=Array.isArray(i.likelyStoreTypes)?i.likelyStoreTypes.filter(Boolean).map(String).slice(0,5):[];
 const all=norm([i.object,i.name,i.category,i.searchQuery,i.summary,...i.visibleText,...i.features].join(' '));
 const eyewear=/\b(glasses|eyeglasses|sunglasses|spectacles|eyewear|frames?)\b/.test(all),safetyClaim=/\b(safety|protective|ppe|industrial|laboratory|workshop)\b/.test(all),proof=/\b(ansi|z87|en166|en 166|ce marked|ppe|safety standard|impact rated|protective eyewear)\b/.test(norm(i.visibleText.join(' ')));
 if(eyewear&&safetyClaim&&!proof){
  const side=/side shield|side guard|wraparound/.test(all);i.object='eyeglasses';i.name=side?'Eyeglasses with Side Shields':'Eyeglasses';i.category='Eyewear';i.retailCategory='eyewear';i.likelyStoreTypes=['optician','eyewear store'];i.searchQuery=side?'eyeglasses with side shields':'eyeglasses';i.summary=side?'Eyeglasses with side-shield styling. No visible safety certification was detected, so FindIt is treating them as eyewear rather than confirmed PPE.':'Eyeglasses. No visible evidence supports classifying them as industrial safety equipment.';i.confidence=Math.min(i.confidence,.82);i.classificationAdjusted=true;
 }
 return i;
}

async function loadFeeds(){let cfg=[];try{cfg=JSON.parse(process.env.RETAILER_FEEDS_JSON||'[]')}catch{}if(!Array.isArray(cfg))return[];const settled=await Promise.allSettled(cfg.filter(x=>x?.url&&x?.name).map(fetchFeed));return settled.flatMap(x=>x.status==='fulfilled'?x.value:[])}
async function fetchFeed(c){const h={Accept:'application/json'};if(c.tokenEnv&&process.env[c.tokenEnv])h.Authorization=`Bearer ${process.env[c.tokenEnv]}`;const r=await fetch(c.url,{headers:h});if(!r.ok)throw Error(`${c.name} feed returned ${r.status}`);const d=await r.json(),a=Array.isArray(d)?d:Array.isArray(d.products)?d.products:[];return a.map(p=>({id:String(p.id||p.sku||p.url||p.name),name:String(p.name||''),brand:clean(p.brand),model:clean(p.model||p.sku),category:clean(p.category),keywords:Array.isArray(p.keywords)?p.keywords.map(String):[],image:clean(p.image),url:clean(p.url),retailer:c.name,price:num(p.price),currency:p.currency||'ZAR',stock:p.stock||null,stores:Array.isArray(p.stores)?p.stores:[]})).filter(p=>p.name)}
function matchProducts(i,products,lat,lon){const out=[];for(const p of products){const m=score(i,p);if(m<.62)continue;if(p.stores?.length){for(const s of p.stores)out.push(make(p,s,m,lat,lon))}else out.push(make(p,null,m,lat,lon))}return out.sort((a,b)=>b.match-a.match).slice(0,20)}
function score(i,p){const a=norm([i.name,i.object,i.searchQuery,i.brand,i.model].join(' ')),b=norm([p.name,p.brand,p.model,p.category,p.keywords?.join(' ')].join(' '));let s=overlap(a,b)*.55;if(i.brand&&p.brand)s+=norm(i.brand)===norm(p.brand)?.25:-.15;if(i.model&&p.model)s+=norm(i.model)===norm(p.model)?.35:0;return clamp(s,0,1)}
function make(p,s,m,lat,lon){const d=s&&lat!=null&&lon!=null&&num(s.lat)!=null&&num(s.lon)!=null?haversine(lat,lon,num(s.lat),num(s.lon)):null;return{id:`${p.id}:${s?.name||'online'}`,name:p.name,brand:p.brand,model:p.model,image:p.image,url:p.url,retailer:p.retailer,price:p.price,currency:p.currency,match:m,stock:s?.stock||p.stock,store:s||null,distanceKm:d}}
function overlap(a,b){const A=new Set(norm(a).split(/\W+/).filter(x=>x.length>1)),B=new Set(norm(b).split(/\W+/).filter(x=>x.length>1));if(!A.size||!B.size)return 0;let h=0;for(const x of A)if(B.has(x))h++;return h/Math.max(A.size,B.size)}
function isRestricted(i){const x=norm([i.object,i.name,i.brand,i.model,i.category,i.searchQuery,...(i.visibleText||[])].join(' '));return RESTRICTED.some(t=>x.includes(t))}
function clean(v){const s=String(v??'').trim();return !s||/^(null|unknown|not detected|n\/a)$/i.test(s)?null:s}function norm(v){return String(v||'').toLowerCase().trim()}function num(v){const n=Number(v);return Number.isFinite(n)?n:null}function clamp(v,a,b){return Math.max(a,Math.min(b,v))}function haversine(a,b,c,d){const R=6371,p=Math.PI/180,x=Math.sin((c-a)*p/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin((d-b)*p/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}})}