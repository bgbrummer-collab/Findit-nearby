
export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  const admin=process.env.FINDIT_ADMIN_KEY;
  if(!admin || req.headers["x-findit-admin-key"]!==admin) return res.status(401).json({error:"Unauthorized"});

  const u=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
  const k=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SECRET_KEY;
  if(!u||!k) return res.status(503).json({error:"Supabase is not configured."});

  const rows=Array.isArray(req.body?.rows)?req.body.rows:[];
  const source=clean(req.body?.source||"catalog",60);
  const retailerName=clean(req.body?.retailerName||"Imported retailer",160);
  const verified=Boolean(req.body?.verified);
  if(!rows.length) return res.status(400).json({error:"No rows supplied"});
  if(rows.length>150) return res.status(400).json({error:"Maximum 150 rows per request"});

  const base=u.replace(/\/$/,"");
  const headers={"Content-Type":"application/json",apikey:k,Authorization:`Bearer ${k}`};
  const now=new Date().toISOString();

  try{
    const retailer=await ensureRetailer(base,headers,{name:retailerName,source});
    let imported=0, skipped=0, pricesRecorded=0;

    for(const raw of rows){
      const x=normalise(raw);
      if(!x.name || !x.url){skipped++;continue}

      const product=await ensureProduct(base,headers,x);
      const offer=await ensureOffer(base,headers,{
        product_id:product.id,retailer_id:retailer.id,
        external_product_id:x.externalId,product_name:x.name,
        price:x.price,original_price:x.originalPrice,currency:x.currency||"ZAR",
        availability:x.availability,stock_quantity:x.stockQuantity,
        product_url:x.url,image_url:x.image,
        verified,source,source_updated_at:x.updatedAt||now,updated_at:now
      });
      if(x.price!=null && offer?.id){
        await fetch(base+"/rest/v1/price_history",{
          method:"POST",headers:{...headers,Prefer:"return=minimal"},
          body:JSON.stringify({offer_id:offer.id,price:x.price,currency:x.currency||"ZAR",availability:x.availability||null,recorded_at:now})
        });
        pricesRecorded++;
      }
      imported++;
    }
    return res.json({ok:true,imported,skipped,pricesRecorded,retailer:retailer.name});
  }catch(e){
    console.error("catalog-import",e);
    return res.status(502).json({error:"Catalog import failed.",details:String(e.message||e).slice(0,300)});
  }
}

async function ensureRetailer(base,headers,x){
  const q=new URL(base+"/rest/v1/retailers");
  q.searchParams.set("select","*");q.searchParams.set("name",`eq.${x.name}`);q.searchParams.set("limit","1");
  let r=await fetch(q,{headers});let a=r.ok?await r.json():[];
  if(a[0])return a[0];
  r=await fetch(base+"/rest/v1/retailers",{method:"POST",headers:{...headers,Prefer:"return=representation"},body:JSON.stringify({name:x.name,source:x.source,updated_at:new Date().toISOString()})});
  if(!r.ok)throw Error(await r.text());return (await r.json())[0];
}
async function ensureProduct(base,headers,x){
  const q=new URL(base+"/rest/v1/products");q.searchParams.set("select","*");q.searchParams.set("limit","1");
  if(x.gtin)q.searchParams.set("gtin",`eq.${x.gtin}`);
  else if(x.externalId)q.searchParams.set("sku",`eq.${x.externalId}`);
  else q.searchParams.set("name",`eq.${x.name}`);
  let r=await fetch(q,{headers});let a=r.ok?await r.json():[];
  const row={name:x.name,brand:x.brand,model:x.model,category:x.category,description:x.description,gtin:x.gtin,sku:x.externalId,image_url:x.image,search_query:[x.brand,x.model,x.name].filter(Boolean).join(" "),updated_at:new Date().toISOString()};
  if(a[0]){
    r=await fetch(`${base}/rest/v1/products?id=eq.${a[0].id}`,{method:"PATCH",headers:{...headers,Prefer:"return=representation"},body:JSON.stringify(row)});
    if(!r.ok)throw Error(await r.text());return (await r.json())[0];
  }
  r=await fetch(base+"/rest/v1/products",{method:"POST",headers:{...headers,Prefer:"return=representation"},body:JSON.stringify(row)});
  if(!r.ok)throw Error(await r.text());return (await r.json())[0];
}
async function ensureOffer(base,headers,x){
  const q=new URL(base+"/rest/v1/product_offers");q.searchParams.set("select","*");q.searchParams.set("limit","1");
  q.searchParams.set("product_id",`eq.${x.product_id}`);q.searchParams.set("retailer_id",`eq.${x.retailer_id}`);
  if(x.external_product_id)q.searchParams.set("external_product_id",`eq.${x.external_product_id}`);
  let r=await fetch(q,{headers});let a=r.ok?await r.json():[];
  if(a[0]){
    r=await fetch(`${base}/rest/v1/product_offers?id=eq.${a[0].id}`,{method:"PATCH",headers:{...headers,Prefer:"return=representation"},body:JSON.stringify(x)});
    if(!r.ok)throw Error(await r.text());return (await r.json())[0];
  }
  r=await fetch(base+"/rest/v1/product_offers",{method:"POST",headers:{...headers,Prefer:"return=representation"},body:JSON.stringify(x)});
  if(!r.ok)throw Error(await r.text());return (await r.json())[0];
}
function normalise(r={}){
  const pick=(...k)=>{for(const x of k)if(r[x]!=null&&String(r[x]).trim()!=="")return r[x];return null};
  const price=parsePrice(pick("sale_price","price","current_price","store_price"));
  const old=parsePrice(pick("old_price","product_price_old","rrp_price","original_price"));
  const inStock=pick("in_stock","stock_status","availability","is_for_sale");
  const qty=toInt(pick("stock_quantity","number_available"));
  return {
    externalId:clean(pick("product_id","pid","id","external_product_id"),120),
    name:clean(pick("product_name","name","title"),300),
    brand:clean(pick("brand_name","brand"),160),
    model:clean(pick("model_number","product_model","model"),160),
    category:clean(pick("merchant_category","category","product_type"),180),
    description:clean(pick("description","product_short_description","desc"),2000),
    gtin:clean(pick("product_GTIN","gtin","ean","upc"),80),
    image:clean(pick("image_url","merchant_image_url","merchant_thumb","image_link"),2000),
    url:clean(pick("deep_link","product_url","link","purl"),2500),
    price,originalPrice:old,
    currency:currencyFrom(pick("currency","price_currency","sale_price"))||"ZAR",
    availability:availability(inStock,qty),
    stockQuantity:qty,
    updatedAt:dateVal(pick("last_updated","updated_at","source_updated_at"))
  };
}
function availability(v,qty){
  if(Number.isFinite(qty)) return qty>0?"in_stock":"out_of_stock";
  const s=String(v??"").trim().toLowerCase();
  if(["1","true","yes","in stock","in_stock","available"].includes(s))return "in_stock";
  if(["0","false","no","out of stock","out_of_stock","not available"].includes(s))return "out_of_stock";
  if(s.includes("preorder")||s.includes("pre-order"))return "preorder";
  if(s.includes("backorder")||s.includes("back-order"))return "backorder";
  return s||null;
}
function parsePrice(v){if(v==null)return null;const m=String(v).replace(/,/g,"").match(/-?\d+(?:\.\d+)?/);if(!m)return null;const n=Number(m[0]);return Number.isFinite(n)?n:null}
function currencyFrom(v){const s=String(v||"").toUpperCase();const m=s.match(/\b(ZAR|USD|GBP|EUR|AUD|CAD|NZD)\b/);return m?.[1]||null}
function toInt(v){const n=Number(v);return Number.isInteger(n)?n:null}
function dateVal(v){if(!v)return null;const d=new Date(v);return Number.isNaN(d.getTime())?null:d.toISOString()}
function clean(v,n){return v==null?null:String(v).trim().slice(0,n)}
