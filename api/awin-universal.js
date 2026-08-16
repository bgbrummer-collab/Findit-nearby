const clean=(v,n=2000)=>v==null?null:String(v).trim().slice(0,n);
const num=v=>{if(v==null||String(v).trim()==="")return null;const m=String(v).replace(/,/g,"").match(/-?\d+(?:\.\d+)?/);if(!m)return null;const n=Number(m[0]);return Number.isFinite(n)?n:null};
const iso=v=>{if(!v)return null;const d=new Date(v);return Number.isNaN(d.getTime())?null:d.toISOString()};
const slug=v=>String(v||"awin-retailer").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80)||"awin-retailer";

export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type, x-findit-admin-key");
  if(req.method==="OPTIONS")return res.status(204).end();
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});

  const admin=process.env.FINDIT_ADMIN_KEY;
  if(!admin||req.headers["x-findit-admin-key"]!==admin)return res.status(401).json({error:"Unauthorized"});
  const u=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
  const k=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SECRET_KEY;
  if(!u||!k)return res.status(503).json({error:"Supabase is not configured."});

  const rows=Array.isArray(req.body?.rows)?req.body.rows:[];
  if(!rows.length)return res.status(400).json({error:"No rows supplied"});
  if(rows.length>500)return res.status(400).json({error:"Maximum 500 rows per batch"});

  const retailerName=clean(req.body?.retailerName||"Imported Awin retailer",160);
  const country=clean(req.body?.country||"ZA",8)?.toUpperCase();
  const source=clean(req.body?.source||`awin-${slug(retailerName)}`,100);
  const verified=req.body?.verified!==false;
  const base=u.replace(/\/$/,"");
  const headers={"Content-Type":"application/json",apikey:k,Authorization:`Bearer ${k}`};
  const now=new Date().toISOString();

  try{
    let q=new URL(base+"/rest/v1/retailers");q.searchParams.set("select","id,name");q.searchParams.set("name",`eq.${retailerName}`);q.searchParams.set("limit","1");
    let r=await fetch(q,{headers});let a=r.ok?await r.json():[];let retailer=a[0];
    if(!retailer){r=await fetch(base+"/rest/v1/retailers",{method:"POST",headers:{...headers,Prefer:"return=representation"},body:JSON.stringify({name:retailerName,country,source,updated_at:now})});if(!r.ok)throw Error(await r.text());retailer=(await r.json())[0];}

    const mapped=rows.map(x=>({
      sku:clean(x.merchant_product_id||x.aw_product_id||x.product_id,120),
      externalId:clean(x.aw_product_id||x.merchant_product_id||x.product_id,120),
      name:clean(x.product_name||x.name||x.title,300),
      brand:clean(x.brand_name||x.brand,160),
      model:clean(x.model_number||x.model,160),
      category:clean(x.merchant_category||x.category_name||x.category,250),
      description:clean(x.description||x.product_short_description,2000),
      image:clean(x.merchant_image_url||x.aw_image_url||x.image_url,2500),
      url:clean(x.aw_deep_link||x.merchant_deep_link||x.product_url,3000),
      price:num(x.search_price||x.sale_price||x.store_price||x.price),
      originalPrice:num(x.store_price||x.rrp_price||x.original_price),
      currency:clean(x.currency||"ZAR",12)||"ZAR",
      updatedAt:iso(x.last_updated||x.updated_at)
    })).filter(x=>x.sku&&x.name&&x.url);
    if(!mapped.length)return res.json({ok:true,imported:0,skipped:rows.length,retailer:retailerName});

    const productRows=mapped.map(x=>({name:x.name,brand:x.brand,model:x.model,category:x.category,description:x.description,sku:x.sku,image_url:x.image,search_query:[x.brand,x.model,x.name].filter(Boolean).join(" "),updated_at:now}));
    r=await fetch(base+"/rest/v1/products?on_conflict=sku",{method:"POST",headers:{...headers,Prefer:"resolution=merge-duplicates,return=representation"},body:JSON.stringify(productRows)});
    if(!r.ok)throw Error("Product upsert failed: "+await r.text());
    const products=await r.json();const pmap=new Map(products.map(p=>[String(p.sku),p.id]));

    const offerRows=mapped.map(x=>({product_id:pmap.get(String(x.sku)),retailer_id:retailer.id,external_product_id:x.externalId,product_name:x.name,price:x.price,original_price:(x.originalPrice!=null&&x.price!=null&&x.originalPrice>x.price)?x.originalPrice:null,currency:x.currency,availability:null,stock_quantity:null,product_url:x.url,image_url:x.image,verified,source,source_updated_at:x.updatedAt||now,updated_at:now})).filter(x=>x.product_id);
    r=await fetch(base+"/rest/v1/product_offers?on_conflict=retailer_id,external_product_id",{method:"POST",headers:{...headers,Prefer:"resolution=merge-duplicates,return=representation"},body:JSON.stringify(offerRows)});
    if(!r.ok)throw Error("Offer upsert failed: "+await r.text());
    const offers=await r.json();

    const history=offers.filter(o=>o.price!=null).map(o=>({offer_id:o.id,price:o.price,currency:o.currency||"ZAR",availability:o.availability||null,recorded_at:now}));
    if(history.length){const hr=await fetch(base+"/rest/v1/price_history",{method:"POST",headers:{...headers,Prefer:"return=minimal"},body:JSON.stringify(history)});if(!hr.ok)console.warn("Price history insert failed",await hr.text());}

    return res.json({ok:true,retailer:retailerName,country,source,imported:offerRows.length,skipped:rows.length-mapped.length,verified,availabilitySupplied:false});
  }catch(e){console.error("awin-universal",e);return res.status(502).json({error:"Universal Awin import failed.",details:String(e.message||e).slice(0,350)});}
}
