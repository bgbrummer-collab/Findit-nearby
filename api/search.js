const PRIMARY_MODEL="gemini-3.6-flash";
const FALLBACK_MODEL="gemini-3.5-flash-lite";
const CONFIDENCE_MIN=0.55;

const RESTRICTED_TERMS=[
  "firearm","gun","rifle","pistol","ammunition","ammo","weapon","switchblade","taser","pepper spray",
  "vape","nicotine","cigarette","cigar","alcohol","beer","wine","liquor","cannabis","marijuana","thc",
  "gambling","sports betting","casino","pornography","adult sex toy"
];

export default{
  async fetch(request){
    if(request.method!=="POST")return json({error:"POST only"},405);
    try{
      const apiKey=process.env.GEMINI_API_KEY;
      if(!apiKey)return json({error:"GEMINI_API_KEY is missing in Vercel."},500);

      const form=await request.formData();
      const image=form.get("image");
      if(!image||typeof image.arrayBuffer!=="function")return json({error:"No image uploaded."},400);
      if(!String(image.type||"").startsWith("image/"))return json({error:"Uploaded file must be an image."},400);
      if(image.size>8*1024*1024)return json({error:"Image must be smaller than 8 MB."},413);

      const lat=toNumber(form.get("lat")),lon=toNumber(form.get("lon"));
      const base64=Buffer.from(await image.arrayBuffer()).toString("base64");

      const identification=await identifyWithGemini(apiKey,base64,image.type||"image/jpeg");
      const blocked=isRestricted(identification);
      if(blocked)return json({identification,offers:[],blocked:true,verified:false,message:"FindIt cannot help search for restricted or age-limited products."});

      const confidence=Number(identification.confidence||0);
      if(confidence<CONFIDENCE_MIN)return json({identification,offers:[],blocked:false,verified:false,message:"The image was not identified confidently enough. Try a clearer photo showing the whole item, logo or model text."});

      const products=await loadAuthorisedRetailerProducts();
      const offers=matchProducts(identification,products,lat,lon);
      return json({identification,offers,blocked:false,verified:offers.length>0,message:offers.length?"Verified retailer offers found from connected authorised product data.":"The item was identified, but no connected authorised retailer feed returned a verified matching offer yet."});
    }catch(error){
      console.error("FindIt /api/search error",error);
      return json({error:"FindIt image search failed.",message:error.message||"Unknown error"},500);
    }
  }
};

async function identifyWithGemini(apiKey,imageBase64,mimeType){
  const prompt=`You are FindIt Nearby's product-identification engine.
Analyse the ACTUAL physical item in the uploaded photo.
Prioritise visible brand logos, brand names, model numbers, product codes, labels, distinctive shape, colour and design.
Do not force the item into a broad category when more specific evidence exists.
Never invent a brand or model. Lower confidence when uncertain.
If it is footwear, identify the brand only when supported by visible evidence.
If it is a microphone, do not call it headphones.
If it is a flower or plant, identify it as such.
If it is a car, identify make/model only when reasonably supported.
searchQuery should be the best concise phrase for finding this exact item.
features should list short visual clues useful for product matching.
retailCategory should describe the broad retail channel most likely to sell the item.
likelyStoreTypes should list 1 to 5 realistic store types that could sell it.
Examples: energy drink -> supermarket/convenience/fuel-stop shop; tissues -> supermarket; microphone -> electronics/music store; sneakers -> footwear/sportswear; flower -> florist/garden centre/supermarket; car battery -> auto parts; pencil case -> stationery; ceiling light -> lighting/hardware; smartphone -> mobile/electronics; dog food -> pet store/supermarket; perfume -> beauty/department store.
Never invent exact stock or a retailer name.

Specialist-item guidance:
- hearing aid -> audiology / hearing-aid clinic / medical supply
- eyeglasses / sunglasses -> optician / eyewear
- contact lenses -> optician / pharmacy
- wheelchair / crutches / mobility aid -> medical supply / mobility store
- stethoscope / blood pressure monitor -> medical supply / pharmacy
- musical instrument accessories -> music store
- sewing / knitting / craft supplies -> craft / fabric / haberdashery
- art supplies -> art / craft / stationery
- fishing gear -> outdoor / fishing / sports
- camping gear -> outdoor / camping / sports
- aquarium supplies -> pet / aquarium
- bird supplies -> pet
- horse tack -> equestrian / farm supply
- farm tools / animal feed -> agrarian / farm supply
- printer ink / toner -> computer / office supply
- projector / AV gear -> electronics / office equipment
- 3D printer / maker parts -> electronics / computer / specialty
- batteries / chargers / cables -> electronics / hardware depending on item
- security camera / alarm / smart-home sensor -> electronics / security
- locks / door hardware -> hardware / locksmith
- plumbing fittings -> hardware / plumbing supply
- electrical components -> electrical supply / hardware
- welding gear -> industrial / hardware
- power tools -> hardware / industrial supply
- motorcycle helmet / parts -> motorcycle / automotive
- bicycle parts -> bicycle / sports
- tyres / rims -> tyre / automotive
- car audio -> automotive / electronics
- detailing products -> automotive / general retail
- kitchen knives / utensils -> homeware / department store
- baking supplies -> grocery / homeware
- cookware -> homeware
- mattresses -> furniture / bedding
- curtains / blinds -> homeware / interior
- office chair / filing cabinet -> office / furniture
- school uniform -> clothing / schoolwear
- uniforms / workwear / PPE -> workwear / industrial
- jewellery tools -> jewellery / craft specialty
- watches -> jewellery / watch store
- luggage / suitcase -> luggage / department store
- handbags / wallets -> fashion / leather goods / department store
- camera drone / hobby drone -> electronics / hobby specialty
- RC cars / hobby kits -> hobby / toy
- board-game accessories -> toy / hobby
- collectibles / trading cards -> hobby / toy / specialty
- cosplay / costume items -> costume / party / clothing
- party supplies -> party / gift / general retail
- candles / decor -> gift / homeware
- religious items -> specialty / gift
- hearing protection / earplugs -> safety / hardware / pharmacy depending type
- safety boots / hard hats -> workwear / industrial / hardware
- laboratory glassware -> scientific / industrial specialty
- microscope / telescope -> scientific / camera / hobby specialty
- binoculars -> outdoor / camera / sports
- pool supplies -> pool / hardware / garden
- irrigation parts -> garden / hardware / agrarian
- compost / fertilizer -> garden / agrarian
- solar panels / inverters -> electrical / solar / hardware
- generators -> hardware / industrial
- UPS / surge protector -> electronics / electrical
- router / networking gear -> computer / electronics
- server parts -> computer / specialist IT
- barcode scanner / POS gear -> office / business equipment
- label printer -> office / computer
- packaging supplies -> office / industrial / general retail
- cleaning machines -> appliance / industrial cleaning
- vacuum parts -> appliance / home
- coffee machine accessories -> appliance / home / specialty
- baby formula / nappies -> supermarket / pharmacy / baby
- maternity products -> pharmacy / baby
- orthopaedic brace -> medical / pharmacy
- skincare device -> beauty / electronics
- hair clippers / trimmers -> beauty / electronics
- salon tools -> beauty / salon supply
- tattoo aftercare / studio supplies -> beauty / specialty
- pet medication -> veterinary / pet / pharmacy
- gardening power tools -> garden / hardware
- bonsai / hydroponics -> garden / specialty
- sewing machine -> appliance / craft / specialty
- fabric -> fabric / haberdashery
- yarn -> craft / haberdashery
- baking moulds -> homeware / baking specialty
- cake decorations -> grocery / baking specialty
- musical sheet books -> music / books
- vinyl records -> music / specialty
- turntable -> audio / electronics
- hearing-aid batteries -> audiology / pharmacy / medical supply

If an item is rare or unusual, do not force it into general retail immediately.
Use the item's function, likely buyer, and realistic retail channel to infer specialist store types.

Return structured JSON only.`;

  const responseSchema={
    type:"OBJECT",
    properties:{
      object:{type:"STRING"},name:{type:"STRING"},
      brand:{type:"STRING",nullable:true},model:{type:"STRING",nullable:true},
      category:{type:"STRING"},searchQuery:{type:"STRING"},confidence:{type:"NUMBER"},
      visibleText:{type:"ARRAY",items:{type:"STRING"}},
      features:{type:"ARRAY",items:{type:"STRING"}},retailCategory:{type:"STRING"},likelyStoreTypes:{type:"ARRAY",items:{type:"STRING"}},summary:{type:"STRING"}
    },
    required:["object","name","category","searchQuery","confidence","visibleText","features","retailCategory","likelyStoreTypes","summary"]
  };

  let lastError=null;
  for(const model of [PRIMARY_MODEL,FALLBACK_MODEL]){
    const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{
      method:"POST",
      headers:{"Content-Type":"application/json","x-goog-api-key":apiKey},
      body:JSON.stringify({
        contents:[{parts:[{text:prompt},{inlineData:{mimeType,data:imageBase64}}]}],
        generationConfig:{responseMimeType:"application/json",responseSchema}
      })
    });
    const raw=await response.json().catch(()=>({}));
    if(response.ok){
      const text=raw?.candidates?.[0]?.content?.parts?.find(p=>typeof p.text==="string")?.text;
      if(!text)throw new Error(`${model} returned no identification text`);
      const parsed=JSON.parse(text);
      parsed.confidence=clamp(Number(parsed.confidence||0),0,1);
      parsed.brand=cleanNullable(parsed.brand);parsed.model=cleanNullable(parsed.model);
      parsed.visibleText=Array.isArray(parsed.visibleText)?parsed.visibleText.filter(Boolean).slice(0,12):[];
      parsed.features=Array.isArray(parsed.features)?parsed.features.filter(Boolean).slice(0,12):[];parsed.retailCategory=String(parsed.retailCategory||"general_retail").trim().toLowerCase();parsed.likelyStoreTypes=Array.isArray(parsed.likelyStoreTypes)?parsed.likelyStoreTypes.filter(Boolean).map(String).slice(0,5):[];
      parsed.modelUsed=model;
      return parsed;
    }
    lastError=new Error(raw?.error?.message||`${model} request failed`);
    const msg=String(raw?.error?.message||"").toLowerCase();
    if(!(response.status===404||response.status===400||msg.includes("model")||msg.includes("available")))break;
  }
  throw lastError||new Error("Gemini request failed");
}

async function loadAuthorisedRetailerProducts(){
  const configs=parseFeedConfigs();if(!configs.length)return[];
  const settled=await Promise.allSettled(configs.map(fetchRetailerFeed));
  return settled.flatMap(r=>r.status==="fulfilled"?r.value:[]);
}
function parseFeedConfigs(){try{const value=JSON.parse(process.env.RETAILER_FEEDS_JSON||"[]");return Array.isArray(value)?value.filter(x=>x&&x.url&&x.name):[]}catch{return[]}}
async function fetchRetailerFeed(config){
  const headers={Accept:"application/json"};
  if(config.tokenEnv&&process.env[config.tokenEnv])headers.Authorization=`Bearer ${process.env[config.tokenEnv]}`;
  const response=await fetch(config.url,{headers});if(!response.ok)throw new Error(`${config.name} feed returned ${response.status}`);
  const data=await response.json();const products=Array.isArray(data)?data:Array.isArray(data.products)?data.products:[];
  return products.map(p=>normalizeProduct(p,config.name)).filter(Boolean);
}
function normalizeProduct(p,retailerName){
  if(!p?.name)return null;
  return{id:String(p.id||p.sku||p.url||p.name),name:String(p.name),brand:cleanNullable(p.brand),model:cleanNullable(p.model||p.sku),category:cleanNullable(p.category),keywords:Array.isArray(p.keywords)?p.keywords.map(String):[],features:Array.isArray(p.features)?p.features.map(String):[],image:cleanNullable(p.image),url:cleanNullable(p.url),retailer:retailerName,price:toNumber(p.price),currency:p.currency||"ZAR",stock:normalizeStock(p.stock),stores:Array.isArray(p.stores)?p.stores.map(normalizeStore).filter(Boolean):[]};
}
function normalizeStock(stock){
  if(stock&&typeof stock==="object")return{status:stock.status||"UNKNOWN",quantity:toNumber(stock.quantity),updatedAt:stock.updatedAt||null};
  if(typeof stock==="string")return{status:stock,quantity:null,updatedAt:null};
  return{status:"UNKNOWN",quantity:null,updatedAt:null};
}
function normalizeStore(s){if(!s?.name)return null;return{name:String(s.name),address:s.address||"",lat:toNumber(s.lat),lon:toNumber(s.lon),stock:normalizeStock(s.stock)}}
function matchProducts(i,products,userLat,userLon){
  const matches=[];
  for(const p of products){
    const match=productScore(i,p);if(match<0.55)continue;
    if(p.stores.length){for(const store of p.stores)matches.push(makeOffer(p,store,match,userLat,userLon))}
    else matches.push(makeOffer(p,null,match,userLat,userLon));
  }
  return matches.filter(x=>x.price!=null||x.url||x.store).sort((a,b)=>(b.match-a.match)||(valueOrInfinity(a.distanceKm)-valueOrInfinity(b.distanceKm))).slice(0,20);
}
function makeOffer(p,store,match,userLat,userLon){
  const distanceKm=store&&userLat!=null&&userLon!=null&&store.lat!=null&&store.lon!=null?haversine(userLat,userLon,store.lat,store.lon):null;
  return{id:`${p.id}:${store?.name||"online"}`,name:p.name,brand:p.brand,model:p.model,image:p.image,url:p.url,retailer:p.retailer,price:p.price,currency:p.currency,match,stock:store?.stock?.status&&store.stock.status!=="UNKNOWN"?store.stock:p.stock,store,distanceKm};
}
function productScore(i,p){
  const brandI=norm(i.brand),brandP=norm(p.brand),modelI=norm(i.model),modelP=norm(p.model);let score=0;
  if(brandI&&brandP)score+=brandI===brandP?0.28:-0.18;
  if(modelI&&modelP)score+=modelI===modelP?0.42:tokenOverlap(modelI,modelP)*0.18;
  score+=tokenOverlap(norm(`${i.name} ${i.searchQuery} ${i.object}`),norm(`${p.name} ${p.keywords.join(" ")}`))*0.22;
  score+=tokenOverlap(norm(i.category),norm(p.category))*0.05;
  score+=tokenOverlap(norm((i.features||[]).join(" ")),norm(p.features.join(" ")))*0.08;
  return clamp(score,0,1);
}
function isRestricted(i){const text=norm([i.object,i.name,i.brand,i.model,i.category,i.searchQuery,...(i.visibleText||[])].join(" "));return RESTRICTED_TERMS.some(term=>text.includes(term))}
function tokenOverlap(a,b){const A=new Set(tokenize(a)),B=new Set(tokenize(b));if(!A.size||!B.size)return 0;let hit=0;for(const x of A)if(B.has(x))hit++;return hit/new Set([...A,...B]).size}
function tokenize(s){return norm(s).split(/[^a-z0-9]+/).filter(x=>x.length>1)}
function norm(v){return String(v||"").toLowerCase().trim()}
function cleanNullable(v){const s=String(v??"").trim();return !s||/^(null|unknown|not detected|n\/a)$/i.test(s)?null:s}
function toNumber(v){const n=Number(v);return Number.isFinite(n)?n:null}
function valueOrInfinity(v){return v==null?Infinity:Number(v)}
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function haversine(a,b,c,d){const R=6371,p=Math.PI/180,x=Math.sin((c-a)*p/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin((d-b)*p/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}})}
