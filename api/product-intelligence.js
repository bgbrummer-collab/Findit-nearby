const RESTRICTED_TERMS=[
  "firearm","gun","rifle","pistol","ammunition","ammo","weapon","switchblade","taser","pepper spray",
  "vape","nicotine","cigarette","cigar","alcohol","beer","wine","liquor","cannabis","marijuana","thc",
  "gambling","sports betting","casino","pornography","adult sex toy"
];

const STOP=new Set(["the","and","for","with","from","this","that","pair","clear","black","white","small","large","new","men","women","unisex","glasses","sunglasses","eyeglasses","frame","frames"]);
const norm=v=>String(v||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const tokens=v=>[...new Set(norm(v).split(/\s+/).filter(x=>x.length>2&&!STOP.has(x)))];
const clean=v=>String(v||"").trim();
const safeTerm=v=>clean(v).replace(/[%(),]/g," ").replace(/\s+/g," ").trim().slice(0,120);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function restricted(v){const x=norm(v);return RESTRICTED_TERMS.some(t=>x.includes(t))}
function overlap(a,b){const A=new Set(tokens(a)),B=new Set(tokens(b));if(!A.size||!B.size)return 0;let h=0;for(const x of A)if(B.has(x))h++;return h/Math.max(A.size,B.size)}
function scoreProduct(p,{q,name,brand,model}){
  const text=norm([p.name,p.brand,p.model,p.category,p.description,p.search_query,p.sku,p.gtin].join(" "));
  const qTokens=tokens([q,name].filter(Boolean).join(" "));
  let s=0;
  if(model){const m=norm(model);if(m&&text.includes(m))s+=0.42;}
  if(brand){const b=norm(brand);if(b&&text.includes(b))s+=0.28;}
  if(q){const nq=norm(q);if(nq&&text.includes(nq))s+=0.24;}
  if(name){const nn=norm(name);if(nn&&text.includes(nn))s+=0.18;}
  if(qTokens.length){let hit=0;for(const t of qTokens)if(text.includes(t))hit++;s+=0.5*(hit/qTokens.length);}
  s+=0.18*overlap([q,name,brand,model].filter(Boolean).join(" "),text);
  return clamp(s,0,1);
}

export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});

  const u=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
  const k=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SECRET_KEY;
  if(!u||!k) return res.status(503).json({error:"Product Intelligence is not configured."});

  const b=req.body||{};
  const q=clean(b.query||b.name), name=clean(b.name), brand=clean(b.brand), model=clean(b.model);
  if(!q&&!brand&&!model) return res.status(400).json({error:"Product details required"});
  if(restricted([q,name,brand,model].join(" "))) return res.status(400).json({error:"This product type is not supported by FindIt."});

  const base=u.replace(/\/$/,"");
  const headers={apikey:k,Authorization:`Bearer ${k}`};

  try{
    const searchTokens=[...new Set([
      ...tokens(q),...tokens(name),...tokens(brand),...tokens(model)
    ])].slice(0,10);

    const pu=new URL(base+"/rest/v1/products");
    pu.searchParams.set("select","id,name,brand,model,category,description,gtin,sku,image_url,search_query");
    pu.searchParams.set("limit","100");

    const filters=[];
    const phrases=[model,brand,q,name].map(safeTerm).filter(x=>x.length>=3).slice(0,4);
    for(const phrase of phrases){
      filters.push(`name.ilike.%${phrase}%`,`brand.ilike.%${phrase}%`,`model.ilike.%${phrase}%`,`search_query.ilike.%${phrase}%`,`sku.ilike.%${phrase}%`);
    }
    for(const t of searchTokens){
      const s=safeTerm(t);if(!s)continue;
      filters.push(`name.ilike.%${s}%`,`brand.ilike.%${s}%`,`model.ilike.%${s}%`,`search_query.ilike.%${s}%`,`description.ilike.%${s}%`);
    }
    if(filters.length)pu.searchParams.set("or",`(${filters.slice(0,80).join(",")})`);

    const pr=await fetch(pu,{headers});
    if(!pr.ok)throw Error(await pr.text());
    let products=await pr.json();
    if(!products.length)return res.json({ok:true,matched:false,offers:[],message:"No verified catalogue match yet."});

    products=products
      .map(p=>({...p,_score:scoreProduct(p,{q,name,brand,model})}))
      .sort((a,b)=>b._score-a._score);

    const bestScore=products[0]?._score||0;
    const minimum=(brand||model)?0.30:0.20;
    const candidates=products.filter(p=>p._score>=Math.max(minimum,bestScore-0.14)).slice(0,12);
    if(!candidates.length)return res.json({ok:true,matched:false,offers:[],message:"No close verified catalogue match yet."});

    const ids=candidates.map(x=>x.id).join(",");
    const ou=new URL(base+"/rest/v1/product_offers");
    ou.searchParams.set("select","id,product_id,retailer_id,product_name,price,original_price,currency,availability,stock_quantity,product_url,image_url,verified,source,source_updated_at,updated_at");
    ou.searchParams.set("product_id",`in.(${ids})`);
    ou.searchParams.set("order","verified.desc,price.asc.nullslast");
    ou.searchParams.set("limit","100");
    const or=await fetch(ou,{headers});
    if(!or.ok)throw Error(await or.text());
    let offers=await or.json();

    const retailerIds=[...new Set(offers.map(x=>x.retailer_id).filter(Boolean))];
    let retailers=[];
    if(retailerIds.length){
      const ru=new URL(base+"/rest/v1/retailers");
      ru.searchParams.set("select","id,name,website,logo_url,country,retailer_type,source,external_id");
      ru.searchParams.set("id",`in.(${retailerIds.join(",")})`);
      const rr=await fetch(ru,{headers});
      if(rr.ok)retailers=await rr.json();
    }
    const rm=new Map(retailers.map(x=>[x.id,x]));
    const pm=new Map(candidates.map(x=>[x.id,x]));

    offers=offers
      .map(o=>{
        const p=pm.get(o.product_id);
        return {...o,retailer:rm.get(o.retailer_id)||null,matchScore:p?._score||0,matchedProduct:p?{id:p.id,name:p.name,brand:p.brand,model:p.model,category:p.category,image_url:p.image_url}:null,branchStockVerified:false};
      })
      .sort((a,b)=>(b.matchScore-a.matchScore)||(Number(a.price??Infinity)-Number(b.price??Infinity)))
      .slice(0,40);

    const bestProduct=candidates[0];
    const bestOffers=offers.filter(o=>o.product_id===bestProduct.id);
    const chosenOffers=bestOffers.length?bestOffers:offers.slice(0,12);

    return res.json({
      ok:true,
      matched:true,
      bestProduct:{...bestProduct,matchScore:bestProduct._score},
      offers:chosenOffers,
      verifiedOfferCount:chosenOffers.filter(x=>x.verified).length,
      branchStockVerified:false,
      directionsAvailable:false,
      message:chosenOffers.length?"Verified catalogue offers found. Branch-level stock is not supplied by this feed, so FindIt will not claim a nearby store has the item.":"A catalogue product matched, but no current retailer offer is stored."
    });
  }catch(e){
    console.error("product-intelligence",e);
    return res.status(502).json({error:"Product Intelligence lookup failed.",details:String(e.message||e).slice(0,250)});
  }
}
