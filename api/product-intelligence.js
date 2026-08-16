const RESTRICTED_TERMS=[
  "firearm","gun","rifle","pistol","ammunition","ammo","weapon","switchblade","taser","pepper spray",
  "vape","nicotine","cigarette","cigar","alcohol","beer","wine","liquor","cannabis","marijuana","thc",
  "gambling","sports betting","casino","pornography","adult sex toy"
];

// Keep real product nouns (glasses, shoes, phone, etc.) searchable. Only throw
// away filler words that do not help distinguish a product.
const STOP=new Set(["the","and","for","with","from","this","that","pair","clear","black","white","small","large","new","men","women","unisex","featuring","designed","suitable"]);
const norm=v=>String(v||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const tokens=v=>[...new Set(norm(v).split(/\s+/).filter(x=>x.length>1&&!STOP.has(x)))];
const clean=v=>String(v||"").trim();
const safeTerm=v=>clean(v).replace(/[%(),]/g," ").replace(/\s+/g," ").trim().slice(0,120);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function restricted(v){const x=norm(v);return RESTRICTED_TERMS.some(t=>x.includes(t))}
function overlap(a,b){const A=new Set(tokens(a)),B=new Set(tokens(b));if(!A.size||!B.size)return 0;let h=0;for(const x of A)if(B.has(x))h++;return h/Math.max(A.size,B.size)}

const FAMILY_RULES=[
  ["eyewear",/\b(glasses|eyeglasses|sunglasses|spectacles|eyewear|optical|frames?|reading glasses|safety glasses)\b/,["glasses","eyeglasses","sunglasses","spectacles","eyewear","frame","frames","optical"]],
  ["footwear",/\b(shoe|shoes|sneaker|sneakers|trainer|trainers|footwear|boot|boots|sandal|sandals)\b/,["shoe","shoes","sneaker","sneakers","footwear","boot"]],
  ["phones",/\b(phone|smartphone|iphone|android|mobile phone)\b/,["phone","smartphone","iphone","mobile"]],
  ["audio",/\b(headphones?|earbuds?|speaker|microphone|headset|audio)\b/,["headphone","headphones","earbuds","speaker","microphone","audio"]],
  ["clothing",/\b(shirt|t shirt|tshirt|dress|jacket|hoodie|sweater|trousers|pants|jeans|clothing|apparel)\b/,["shirt","dress","jacket","hoodie","sweater","clothing","apparel"]],
  ["bags",/\b(backpack|bag|handbag|wallet|luggage|suitcase)\b/,["backpack","bag","handbag","wallet","luggage","suitcase"]],
  ["watches",/\b(watch|smartwatch|wristwatch)\b/,["watch","smartwatch","wristwatch"]],
  ["computing",/\b(laptop|computer|keyboard|mouse|monitor|router|printer)\b/,["laptop","computer","keyboard","mouse","monitor","router","printer"]],
  ["tools",/\b(drill|tool|tools|saw|grinder|wrench|spanner|hardware)\b/,["drill","tool","tools","hardware"]],
  ["beauty",/\b(perfume|makeup|cosmetic|skincare|lipstick|mascara)\b/,["perfume","makeup","cosmetic","skincare"]],
  ["toys",/\b(toy|lego|puzzle|board game|collectible)\b/,["toy","lego","puzzle","collectible"]]
];
function productFamily(v){const x=norm(v);for(const [name,re,aliases] of FAMILY_RULES)if(re.test(x))return{name,aliases};return null}

function scoreProduct(p,{q,name,brand,model,family}){
  const text=norm([p.name,p.brand,p.model,p.category,p.description,p.search_query,p.sku,p.gtin].join(" "));
  const qTokens=tokens([q,name].filter(Boolean).join(" "));
  let s=0;
  if(model){const m=norm(model);if(m&&text.includes(m))s+=0.46;}
  if(brand){const b=norm(brand);if(b&&text.includes(b))s+=0.30;}
  if(q){const nq=norm(q);if(nq&&text.includes(nq))s+=0.18;}
  if(name){const nn=norm(name);if(nn&&text.includes(nn))s+=0.14;}
  if(family&&family.aliases.some(a=>text.includes(norm(a))))s+=0.34;
  if(qTokens.length){let hit=0;for(const t of qTokens)if(text.includes(t))hit++;s+=0.38*(hit/qTokens.length);}
  s+=0.16*overlap([q,name,brand,model].filter(Boolean).join(" "),text);
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
  const family=productFamily([q,name,b.object,b.category,b.retailCategory].filter(Boolean).join(" "));
  if(!q&&!brand&&!model) return res.status(400).json({error:"Product details required"});
  if(restricted([q,name,brand,model].join(" "))) return res.status(400).json({error:"This product type is not supported by FindIt."});

  const base=u.replace(/\/$/,"");
  const headers={apikey:k,Authorization:`Bearer ${k}`};

  try{
    const searchTokens=[...new Set([...tokens(q),...tokens(name),...tokens(brand),...tokens(model),...(family?.aliases||[])])].slice(0,16);
    const pu=new URL(base+"/rest/v1/products");
    pu.searchParams.set("select","id,name,brand,model,category,description,gtin,sku,image_url,search_query");
    pu.searchParams.set("limit","160");

    const filters=[];
    const phrases=[model,brand,q,name,...(family?.aliases||[])].map(safeTerm).filter(x=>x.length>=2).slice(0,18);
    for(const phrase of phrases){
      filters.push(`name.ilike.%${phrase}%`,`brand.ilike.%${phrase}%`,`model.ilike.%${phrase}%`,`search_query.ilike.%${phrase}%`,`category.ilike.%${phrase}%`,`sku.ilike.%${phrase}%`);
    }
    for(const t of searchTokens.slice(0,12)){
      const s=safeTerm(t);if(!s)continue;
      filters.push(`name.ilike.%${s}%`,`brand.ilike.%${s}%`,`model.ilike.%${s}%`,`search_query.ilike.%${s}%`,`category.ilike.%${s}%`,`description.ilike.%${s}%`);
    }
    if(filters.length)pu.searchParams.set("or",`(${filters.slice(0,110).join(",")})`);

    const pr=await fetch(pu,{headers});
    if(!pr.ok)throw Error(await pr.text());
    let products=await pr.json();
    if(!products.length)return res.json({ok:true,matched:false,offers:[],family:family?.name||null,message:"No verified catalogue match yet."});

    products=products.map(p=>({...p,_score:scoreProduct(p,{q,name,brand,model,family})})).sort((a,b)=>b._score-a._score);
    const bestScore=products[0]?._score||0;
    const minimum=(brand||model)?0.28:(family?0.24:0.30);
    const candidates=products.filter(p=>p._score>=Math.max(minimum,bestScore-0.18)).slice(0,20);
    if(!candidates.length)return res.json({ok:true,matched:false,offers:[],family:family?.name||null,message:"No close verified catalogue match yet."});

    const ids=candidates.map(x=>x.id).join(",");
    const ou=new URL(base+"/rest/v1/product_offers");
    ou.searchParams.set("select","id,product_id,retailer_id,product_name,price,original_price,currency,availability,stock_quantity,product_url,image_url,verified,source,source_updated_at,updated_at");
    ou.searchParams.set("product_id",`in.(${ids})`);
    ou.searchParams.set("order","verified.desc,price.asc.nullslast");
    ou.searchParams.set("limit","160");
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
    offers=offers.map(o=>{
      const p=pm.get(o.product_id);
      return {...o,retailer:rm.get(o.retailer_id)||null,matchScore:p?._score||0,matchedProduct:p?{id:p.id,name:p.name,brand:p.brand,model:p.model,category:p.category,image_url:p.image_url}:null,branchStockVerified:false};
    }).sort((a,b)=>(b.matchScore-a.matchScore)||(Number(a.price??Infinity)-Number(b.price??Infinity))).slice(0,60);

    // Prefer the strongest product, but if that one lacks an offer, use the
    // strongest nearby catalogue candidates that do have real offers.
    const bestProduct=candidates[0];
    const bestOffers=offers.filter(o=>o.product_id===bestProduct.id);
    const chosenOffers=(bestOffers.length?bestOffers:offers).slice(0,16);

    return res.json({
      ok:true,matched:true,family:family?.name||null,
      bestProduct:{...bestProduct,matchScore:bestProduct._score},
      offers:chosenOffers,
      verifiedOfferCount:chosenOffers.filter(x=>x.verified).length,
      branchStockVerified:false,directionsAvailable:false,
      message:chosenOffers.length?"Verified catalogue offers found. Branch-level stock is not supplied by this feed, so FindIt will not claim a nearby store has the item.":"A catalogue product matched, but no current retailer offer is stored."
    });
  }catch(e){
    console.error("product-intelligence",e);
    return res.status(502).json({error:"Product Intelligence lookup failed.",details:String(e.message||e).slice(0,250)});
  }
}
