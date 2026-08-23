const clean=v=>String(v??'').trim();
const norm=v=>clean(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const STOP=new Set(['the','and','for','with','from','this','that','pair','new','white','black','small','large','men','women','unisex','pack','set']);
const toks=v=>[...new Set(norm(v).split(' ').filter(x=>x.length>1&&!STOP.has(x)))];
function score(row,q,b={}){
 const text=norm([row.name,row.brand,row.model,row.category,row.sku,row.gtin].join(' '));
 const qt=toks(q);if(!text||!qt.length)return 0;
 let hits=qt.filter(t=>text.includes(t)).length,s=(hits/qt.length)*.62;
 const brand=norm(b.brand),model=norm(b.model);
 if(brand&&text.includes(brand))s+=.18;
 if(model&&text.includes(model))s+=.28;
 return Math.min(1,s);
}
function strong(row,q,b={}){
 const text=norm([row.name,row.brand,row.model,row.category,row.sku,row.gtin].join(' '));
 const brand=norm(b.brand),model=norm(b.model);
 if(brand&&!text.includes(brand))return false;
 if(model&&!text.includes(model))return false;
 const qt=toks(q),hits=qt.filter(t=>text.includes(t)).length;
 return hits>=Math.min(3,Math.max(2,Math.ceil(qt.length*.45)))&&score(row,q,b)>=.68;
}
function availability(v){const x=norm(v);if(/out of stock|sold out|unavailable|not available/.test(x))return'out_of_stock';if(/in stock|available|instock/.test(x))return'in_stock';if(/preorder|pre order/.test(x))return'preorder';return clean(v)||null}
function num(v){const n=Number(v);return Number.isFinite(n)?n:null}
export async function catalogOffers(q,b={}){
 const base=clean(process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/$/,'');
 const key=clean(process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
 if(!base||!key)return{offers:[],configured:false};
 try{
  const u=new URL(base+'/rest/v1/findit_product_catalog');
  u.searchParams.set('select','name,brand,model,category,gtin,sku,retailer,retailer_website,price,original_price,currency,availability,stock_quantity,product_url,verified,source,source_updated_at,updated_at');
  u.searchParams.set('limit','120');
  const pieces=toks(q).filter(x=>x.length>=3).slice(0,4);
  if(pieces.length)u.searchParams.set('or',`(${pieces.map(x=>`name.ilike.*${x}*`).join(',')})`);
  const r=await fetch(u,{headers:{apikey:key,Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(6500)});
  if(!r.ok)return{offers:[],configured:true,error:`catalog_${r.status}`};
  const rows=await r.json();
  const offers=[];
  for(const row of rows||[]){if(!row?.product_url||!strong(row,q,b))continue;const s=score(row,q,b);offers.push({product_name:clean(row.name),price:num(row.price),originalPrice:num(row.original_price),currency:clean(row.currency||'ZAR')||'ZAR',availability:availability(row.availability),stockQuantity:num(row.stock_quantity),product_url:clean(row.product_url),verified:Boolean(row.verified),source:clean(row.source||'FindIt retailer catalog'),retailer:{name:clean(row.retailer||'Retailer'),country:'ZA',source:'findit_catalog'},matchScore:s,branchStockVerified:false,branchPriceVerified:false,stockScope:'online_or_catalog',priceScope:'retailer_catalog',directionsAvailable:false,listingType:'findit_catalog',onlineListing:true,sourceUpdatedAt:row.source_updated_at||row.updated_at||null,checkedAt:new Date().toISOString()})}
  offers.sort((a,z)=>(Number(z.verified)-Number(a.verified))||z.matchScore-a.matchScore);
  return{offers:offers.slice(0,12),configured:true};
 }catch(e){return{offers:[],configured:true,error:String(e.message||e).slice(0,120)}}
}
