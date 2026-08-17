const STOP=new Set(['the','and','for','with','from','this','that','pair','clear','black','white','small','large','new','men','women','unisex','featuring','designed','suitable','available']);
const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const toks=v=>[...new Set(norm(v).split(/\s+/).filter(x=>x.length>1&&!STOP.has(x)))];
const clean=v=>String(v||'').trim();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const safe=v=>clean(v).replace(/[%(),]/g,' ').replace(/\s+/g,' ').trim().slice(0,100);
function overlap(a,b){const A=new Set(toks(a)),B=new Set(toks(b));if(!A.size||!B.size)return 0;let h=0;for(const x of A)if(B.has(x))h++;return h/Math.max(A.size,B.size)}
function family(v){const x=norm(v);if(/\b(glasses|eyeglasses|sunglasses|spectacles|eyewear|optical|frame|frames)\b/.test(x))return['eyewear',['glasses','eyeglasses','sunglasses','spectacles','eyewear','optical','frame']];if(/\b(shoe|shoes|sneaker|sneakers|footwear|boot|boots)\b/.test(x))return['footwear',['shoe','sneaker','footwear','boot']];if(/\b(phone|smartphone|iphone|mobile)\b/.test(x))return['phones',['phone','smartphone','mobile']];if(/\b(headphone|headphones|earbuds|speaker|microphone|headset|router|wifi|modem)\b/.test(x))return['electronics',['headphone','earbuds','speaker','microphone','headset','router','wifi','modem']];return[null,[]]}
function score(p,c){const text=norm([p.name,p.brand,p.model,p.category,p.description,p.search_query,p.sku,p.gtin].join(' '));let s=0;const q=toks([c.q,c.name].join(' '));if(c.model&&text.includes(norm(c.model)))s+=.48;if(c.brand&&text.includes(norm(c.brand)))s+=.32;let hit=0;for(const t of q)if(text.includes(t))hit++;const ratio=q.length?hit/q.length:0;s+=.42*ratio;s+=.16*overlap([c.q,c.name,c.brand,c.model].filter(Boolean).join(' '),text);if(c.aliases.some(a=>text.includes(a)))s+=.12;return{score:clamp(s,0,1),ratio,hit,text}}

async function supabaseLookup(b){
 const u=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SECRET_KEY;
 if(!u||!k)return {offers:[],bestProduct:null,family:null,configured:false};
 const q=clean(b.query||b.name),name=clean(b.name),brand=clean(b.brand),model=clean(b.model),[fam,aliases]=family([q,name,b.object,b.category].filter(Boolean).join(' '));
 const base=u.replace(/\/$/,''),headers={apikey:k,Authorization:`Bearer ${k}`};
 const terms=[model,brand,q,name,...aliases,...toks(q),...toks(name)].map(safe).filter(x=>x.length>1).slice(0,20);
 const pu=new URL(base+'/rest/v1/products');pu.searchParams.set('select','id,name,brand,model,category,description,gtin,sku,image_url,search_query');pu.searchParams.set('limit','180');const filters=[];for(const t of terms){filters.push(`name.ilike.%${t}%`,`brand.ilike.%${t}%`,`model.ilike.%${t}%`,`search_query.ilike.%${t}%`,`category.ilike.%${t}%`)}if(filters.length)pu.searchParams.set('or',`(${filters.slice(0,100).join(',')})`);
 const pr=await fetch(pu,{headers});if(!pr.ok)throw Error(await pr.text());let products=await pr.json();if(!products.length)return {offers:[],bestProduct:null,family:fam,configured:true};
 products=products.map(p=>{const x=score(p,{q,name,brand,model,aliases});return{...p,_score:x.score,_ratio:x.ratio,_hits:x.hit}}).sort((a,b)=>b._score-a._score);
 const strict=p=>{if(model&&p._score<.58)return false;if(brand&&p._score<.50)return false;if(!brand&&!model&&(p._hits<2||p._ratio<.34||p._score<.42))return false;return true};
 const candidates=products.filter(strict).slice(0,12);if(!candidates.length)return {offers:[],bestProduct:null,family:fam,configured:true};
 const ids=candidates.map(x=>x.id).join(','),ou=new URL(base+'/rest/v1/product_offers');ou.searchParams.set('select','id,product_id,retailer_id,product_name,price,original_price,currency,availability,stock_quantity,product_url,image_url,verified,source,source_updated_at,updated_at');ou.searchParams.set('product_id',`in.(${ids})`);ou.searchParams.set('limit','100');const or=await fetch(ou,{headers});if(!or.ok)throw Error(await or.text());let offers=await or.json();
 const rids=[...new Set(offers.map(x=>x.retailer_id).filter(Boolean))],retailers=[];if(rids.length){const ru=new URL(base+'/rest/v1/retailers');ru.searchParams.set('select','id,name,website,logo_url,country,retailer_type,source,external_id');ru.searchParams.set('id',`in.(${rids.join(',')})`);const rr=await fetch(ru,{headers});if(rr.ok)retailers.push(...await rr.json())}const rm=new Map(retailers.map(x=>[x.id,x])),pm=new Map(candidates.map(x=>[x.id,x]));
 offers=offers.map(o=>{const p=pm.get(o.product_id);return{...o,retailer:rm.get(o.retailer_id)||null,matchScore:p?._score||0,matchedProduct:p?{id:p.id,name:p.name,brand:p.brand,model:p.model,category:p.category,image_url:p.image_url}:null,branchStockVerified:false,listingType:'authorised_feed'}}).filter(o=>o.matchScore>=.42).sort((a,b)=>b.matchScore-a.matchScore).slice(0,12);
 return {offers,bestProduct:offers.length?pm.get(offers[0].product_id):null,family:fam,configured:true};
}

async function retailerWebLookup(req,b){
 try{
  const host=req.headers['x-forwarded-host']||req.headers.host;if(!host)return {products:[],retailers:[]};
  const proto=req.headers['x-forwarded-proto']||'https';
  const r=await fetch(`${proto}://${host}/api/retailer-web`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b),signal:AbortSignal.timeout(9000)});
  const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)return {products:[],retailers:[]};return d;
 }catch{return {products:[],retailers:[]}}
}
function webOffer(p,i){return{id:`web:${i}:${p.retailer}:${p.productName}`,product_id:null,retailer_id:null,product_name:p.productName,price:p.price,original_price:null,currency:p.currency||'ZAR',availability:p.availability,stock_quantity:null,product_url:p.productUrl,image_url:p.image,verified:true,source:'Official retailer website',source_updated_at:new Date().toISOString(),updated_at:new Date().toISOString(),retailer:{name:p.retailer,website:p.productUrl||null,country:'ZA',retailer_type:'official_website',source:'official_web'},matchScore:Number(p.match||0),matchedProduct:{id:null,name:p.productName,brand:p.brand||null,model:p.model||null,category:null,image_url:p.image||null},branchStockVerified:false,listingType:'official_web',onlineListing:true}}

export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const b=req.body||{},q=clean(b.query||b.name),name=clean(b.name),brand=clean(b.brand),model=clean(b.model);if(!q&&!brand&&!model)return res.status(400).json({error:'Product details required'});
 try{
  const [dbResult,webResult]=await Promise.all([supabaseLookup(b).catch(e=>{console.error('supabase product intelligence',e);return {offers:[],bestProduct:null,family:null,configured:true,error:true}}),retailerWebLookup(req,b)]);
  const webOffers=(webResult.products||[]).map(webOffer);
  const key=o=>norm([o.retailer?.name,o.product_name,o.product_url].join('|'));
  const merged=[];const seen=new Set();for(const o of [...dbResult.offers,...webOffers].sort((a,b)=>Number(b.matchScore||0)-Number(a.matchScore||0))){const k=key(o);if(seen.has(k))continue;seen.add(k);merged.push(o);if(merged.length>=18)break}
  const best=dbResult.bestProduct||merged[0]?.matchedProduct||null;
  return res.json({ok:true,matched:merged.length>0,family:dbResult.family||webResult.family||null,bestProduct:best,offers:merged,verifiedOfferCount:merged.filter(x=>x.verified).length,branchStockVerified:false,directionsAvailable:false,webRetailers:webResult.retailers||[],sources:{supabase:Boolean(dbResult.configured),officialRetailerWeb:true},message:merged.length?'Product listings found from connected catalogue data and/or official retailer websites. Online availability is not physical branch stock.':'No strong product listing match was found yet. Official retailer search links may still be available.'});
 }catch(e){console.error('product-intelligence',e);return res.status(502).json({error:'Product Intelligence lookup failed.',details:String(e.message||e).slice(0,250)})}
}
