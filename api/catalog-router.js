
async function catalogImportHandler(req,res){
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


function clean(v,n=2000){return v==null?null:String(v).trim().slice(0,n)}
function num(v){if(v==null||String(v).trim()==="")return null;const n=Number(String(v).replace(/,/g,"").match(/-?\d+(?:\.\d+)?/)?.[0]);return Number.isFinite(n)?n:null}
function iso(v){if(!v)return null;const d=new Date(v);return Number.isNaN(d.getTime())?null:d.toISOString()}

async function awinImportHandler(req,res){
  res.setHeader("Cache-Control","no-store");
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});

  const admin=process.env.FINDIT_ADMIN_KEY;
  if(!admin || req.headers["x-findit-admin-key"]!==admin) return res.status(401).json({error:"Unauthorized"});

  const u=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
  const k=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SECRET_KEY;
  if(!u||!k) return res.status(503).json({error:"Supabase is not configured."});

  const rows=Array.isArray(req.body?.rows)?req.body.rows:[];
  if(!rows.length) return res.status(400).json({error:"No rows supplied"});
  if(rows.length>500) return res.status(400).json({error:"Maximum 500 rows per batch"});

  const retailerName="SmartBuyGlasses ZA";
  const source="awin-smartbuyglasses-za";
  const base=u.replace(/\/$/,"");
  const headers={"Content-Type":"application/json",apikey:k,Authorization:`Bearer ${k}`};
  const now=new Date().toISOString();

  try{
    // Ensure retailer exists.
    let rq=new URL(base+"/rest/v1/retailers");
    rq.searchParams.set("select","id,name");
    rq.searchParams.set("name",`eq.${retailerName}`);
    rq.searchParams.set("limit","1");
    let rr=await fetch(rq,{headers});
    let ra=rr.ok?await rr.json():[];
    let retailer=ra[0];

    if(!retailer){
      rr=await fetch(base+"/rest/v1/retailers",{
        method:"POST",
        headers:{...headers,Prefer:"return=representation"},
        body:JSON.stringify({name:retailerName,country:"ZA",source,updated_at:now})
      });
      if(!rr.ok) throw Error(await rr.text());
      retailer=(await rr.json())[0];
    }

    const mapped=rows.map(r=>({
      sku:clean(r.merchant_product_id||r.aw_product_id,120),
      name:clean(r.product_name,300),
      description:clean(r.description,2000),
      category:clean(r.merchant_category||r.category_name,250),
      image_url:clean(r.merchant_image_url||r.aw_image_url,2500),
      price:num(r.search_price||r.store_price),
      store_price:num(r.store_price),
      currency:clean(r.currency||"ZAR",12)||"ZAR",
      external_product_id:clean(r.aw_product_id||r.merchant_product_id,120),
      product_url:clean(r.aw_deep_link||r.merchant_deep_link,3000),
      merchant_url:clean(r.merchant_deep_link,3000),
      source_updated_at:iso(r.last_updated),
      brand:clean((r.product_name||"").split(/\s+/).slice(0,2).join(" "),160)
    })).filter(x=>x.sku&&x.name&&x.product_url);

    if(!mapped.length) return res.json({ok:true,imported:0,skipped:rows.length});

    // Fetch existing offer prices in this batch for price-history changes.
    const extIds=mapped.map(x=>x.external_product_id).filter(Boolean);
    const existingMap=new Map();
    if(extIds.length){
      const eq=new URL(base+"/rest/v1/product_offers");
      eq.searchParams.set("select","id,external_product_id,price,currency,availability");
      eq.searchParams.set("retailer_id",`eq.${retailer.id}`);
      eq.searchParams.set("external_product_id",`in.(${extIds.map(x=>`"${String(x).replace(/"/g,'')}"`).join(",")})`);
      const er=await fetch(eq,{headers});
      if(er.ok){
        const ea=await er.json();
        for(const x of ea) existingMap.set(String(x.external_product_id),x);
      }
    }

    // Upsert products by SKU.
    const productRows=mapped.map(x=>({
      name:x.name,
      brand:null,
      model:null,
      category:x.category,
      description:x.description,
      sku:x.sku,
      image_url:x.image_url,
      search_query:x.name,
      updated_at:now
    }));

    const pr=await fetch(base+"/rest/v1/products?on_conflict=sku",{
      method:"POST",
      headers:{...headers,Prefer:"resolution=merge-duplicates,return=representation"},
      body:JSON.stringify(productRows)
    });
    if(!pr.ok) throw Error("Product upsert failed: "+await pr.text());
    const products=await pr.json();
    const pmap=new Map(products.map(p=>[String(p.sku),p.id]));

    const offerRows=mapped.map(x=>({
      product_id:pmap.get(String(x.sku)),
      retailer_id:retailer.id,
      external_product_id:x.external_product_id,
      product_name:x.name,
      price:x.price,
      original_price:(x.store_price!=null&&x.price!=null&&x.store_price>x.price)?x.store_price:null,
      currency:x.currency,
      availability:null,
      stock_quantity:null,
      product_url:x.product_url,
      image_url:x.image_url,
      verified:true,
      source,
      source_updated_at:x.source_updated_at,
      updated_at:now
    })).filter(x=>x.product_id);

    const or=await fetch(base+"/rest/v1/product_offers?on_conflict=retailer_id,external_product_id",{
      method:"POST",
      headers:{...headers,Prefer:"resolution=merge-duplicates,return=representation"},
      body:JSON.stringify(offerRows)
    });
    if(!or.ok) throw Error("Offer upsert failed: "+await or.text());
    const offers=await or.json();

    // Record price history only for new/changed prices.
    const history=[];
    for(const o of offers){
      const before=existingMap.get(String(o.external_product_id));
      if(o.price!=null && (!before || Number(before.price)!==Number(o.price))){
        history.push({offer_id:o.id,price:o.price,currency:o.currency||"ZAR",availability:o.availability||null,recorded_at:now});
      }
    }
    if(history.length){
      const hr=await fetch(base+"/rest/v1/price_history",{
        method:"POST",
        headers:{...headers,Prefer:"return=minimal"},
        body:JSON.stringify(history)
      });
      if(!hr.ok) console.warn("Price history insert failed",await hr.text());
    }

    return res.json({
      ok:true,
      imported:offerRows.length,
      skipped:rows.length-mapped.length,
      priceChanges:history.length,
      retailer:retailerName,
      availabilitySupplied:false
    });
  }catch(e){
    console.error("awin-feed-import",e);
    return res.status(502).json({error:"Awin feed import failed.",details:String(e.message||e).slice(0,350)});
  }
}

export default async function handler(req,res){const action=String(req.query?.action||"catalog");return action==="awin"?awinImportHandler(req,res):catalogImportHandler(req,res)}
