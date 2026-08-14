
export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  const u=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
  const k=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SECRET_KEY;
  if(!u||!k) return res.status(503).json({error:"Product Intelligence is not configured."});
  const b=req.body||{}, q=String(b.query||b.name||"").trim(), brand=String(b.brand||"").trim(), model=String(b.model||"").trim();
  if(!q&&!brand&&!model) return res.status(400).json({error:"Product details required"});
  const base=u.replace(/\/$/,""), headers={apikey:k,Authorization:`Bearer ${k}`};
  try{
    const compact=q.split(/\s+/).filter(x=>x.length>2).slice(0,5).join(" ");const terms=[q,compact,brand,model].filter(Boolean);
    const pu=new URL(base+"/rest/v1/products");
    pu.searchParams.set("select","id,name,brand,model,category,description,gtin,sku,image_url,search_query");
    pu.searchParams.set("limit","20");
    const fs=[];
    for(const t of terms){
      const s=t.replace(/[%(),]/g," ").trim();
      if(s) fs.push(`name.ilike.%${s}%`,`brand.ilike.%${s}%`,`model.ilike.%${s}%`,`search_query.ilike.%${s}%`);
    }
    if(fs.length) pu.searchParams.set("or",`(${fs.join(",")})`);
    const pr=await fetch(pu,{headers}); if(!pr.ok) throw Error(await pr.text());
    const products=await pr.json();
    if(!products.length) return res.json({ok:true,matched:false,offers:[],message:"No verified product data yet."});

    const ids=products.map(x=>x.id).join(",");
    const ou=new URL(base+"/rest/v1/product_offers");
    ou.searchParams.set("select","id,product_id,retailer_id,product_name,price,original_price,currency,availability,stock_quantity,product_url,image_url,verified,source,source_updated_at,updated_at");
    ou.searchParams.set("product_id",`in.(${ids})`); ou.searchParams.set("order","verified.desc,price.asc.nullslast"); ou.searchParams.set("limit","50");
    const or=await fetch(ou,{headers}); if(!or.ok) throw Error(await or.text());
    let offers=await or.json();

    const retailerIds=[...new Set(offers.map(x=>x.retailer_id).filter(Boolean))];
    let retailers=[];
    if(retailerIds.length){
      const ru=new URL(base+"/rest/v1/retailers");
      ru.searchParams.set("select","id,name,website,logo_url,country,retailer_type,source,external_id");
      ru.searchParams.set("id",`in.(${retailerIds.join(",")})`);
      const rr=await fetch(ru,{headers}); if(rr.ok) retailers=await rr.json();
    }
    const rm=new Map(retailers.map(x=>[x.id,x]));
    offers=offers.map(o=>({...o,retailer:rm.get(o.retailer_id)||null}));
    const score=p=>{
      const text=[p.name,p.brand,p.model,p.search_query].join(" ").toLowerCase(); let s=0;
      if(q&&text.includes(q.toLowerCase()))s+=50; if(brand&&text.includes(brand.toLowerCase()))s+=25; if(model&&text.includes(model.toLowerCase()))s+=30; return s;
    };
    products.sort((a,b)=>score(b)-score(a));
    const bestProduct=products[0], bestOffers=offers.filter(o=>o.product_id===bestProduct.id);
    res.json({ok:true,matched:true,bestProduct,offers:bestOffers,verifiedOfferCount:bestOffers.filter(x=>x.verified).length});
  }catch(e){console.error("product-intelligence",e);res.status(502).json({error:"Product Intelligence lookup failed."})}
}
