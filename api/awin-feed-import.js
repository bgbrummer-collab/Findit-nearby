
function clean(v,n=2000){return v==null?null:String(v).trim().slice(0,n)}
function num(v){if(v==null||String(v).trim()==="")return null;const n=Number(String(v).replace(/,/g,"").match(/-?\d+(?:\.\d+)?/)?.[0]);return Number.isFinite(n)?n:null}
function iso(v){if(!v)return null;const d=new Date(v);return Number.isNaN(d.getTime())?null:d.toISOString()}

export default async function handler(req,res){
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
