const ENDPOINTS=["https://overpass-api.de/api/interpreter","https://overpass.kumi.systems/api/interpreter"];

const CHAINS=["checkers","shoprite","pick n pay","pnp","woolworths","spar","food lover","makro","game","dis-chem","clicks","builders","cashbuild","leroy merlin","incredible connection","hi-fi corp","mr price","sportscene","total sports","cape union mart","exclusive books","midas","autozone"];

const T={
grocery:{shops:["supermarket","convenience","general","department_store","variety_store"],amenities:["fuel"]},
clothing:{shops:["clothes","fashion","department_store","variety_store"],amenities:[]},
footwear:{shops:["shoes","clothes","sports","department_store"],amenities:[]},
sports:{shops:["sports","outdoor","bicycle","clothes","shoes","department_store"],amenities:[]},
electronics:{shops:["electronics","hifi","computer","mobile_phone","camera","department_store"],amenities:[]},
music:{shops:["musical_instrument","hifi","electronics","music"],amenities:[]},
hardware:{shops:["hardware","doityourself","trade","department_store"],amenities:[]},
home:{shops:["houseware","doityourself","hardware","furniture","lighting","department_store"],amenities:[]},
stationery:{shops:["stationery","books","variety_store","department_store","office_supplies"],amenities:[]},
books:{shops:["books","stationery","department_store","music"],amenities:[]},
toys:{shops:["toys","variety_store","department_store","hobby"],amenities:[]},
beauty:{shops:["beauty","cosmetics","perfumery","chemist","department_store","hairdresser_supply"],amenities:["pharmacy"]},
pharmacy:{shops:["chemist","medical_supply","beauty"],amenities:["pharmacy"]},
medical:{shops:["medical_supply","chemist","mobility","hearing_aids","optician"],amenities:["pharmacy","clinic"]},
hearing:{shops:["hearing_aids","medical_supply","chemist"],amenities:["clinic"]},
optical:{shops:["optician","chemist","medical_supply"],amenities:["clinic"]},
mobility:{shops:["medical_supply","mobility","chemist"],amenities:["pharmacy"]},
pet:{shops:["pet","pet_grooming","supermarket","aquarium"],amenities:["veterinary"]},
garden:{shops:["florist","garden_centre","agrarian","supermarket"],amenities:[]},
agrarian:{shops:["agrarian","farm","garden_centre","hardware"],amenities:[]},
automotive:{shops:["car","car_parts","tyres","motorcycle","car_repair"],amenities:["fuel"]},
motorcycle:{shops:["motorcycle","car_parts","tyres"],amenities:["fuel"]},
bicycle:{shops:["bicycle","sports","outdoor"],amenities:[]},
jewellery:{shops:["jewelry","watches","department_store"],amenities:[]},
baby:{shops:["baby_goods","clothes","toys","department_store","supermarket","chemist"],amenities:["pharmacy"]},
art:{shops:["art","craft","stationery","variety_store"],amenities:[]},
craft:{shops:["craft","fabric","sewing","stationery","variety_store"],amenities:[]},
fabric:{shops:["fabric","sewing","craft"],amenities:[]},
hobby:{shops:["hobby","toys","model","collector","sports"],amenities:[]},
outdoor:{shops:["outdoor","sports","fishing","hunting","bicycle"],amenities:[]},
office:{shops:["office_supplies","stationery","computer","electronics","furniture"],amenities:[]},
industrial:{shops:["trade","hardware","industrial","electrical","plumbing","safety"],amenities:[]},
electrical:{shops:["electrical","electronics","hardware","doityourself"],amenities:[]},
solar:{shops:["electrical","solar","hardware","electronics"],amenities:[]},
plumbing:{shops:["plumbing","hardware","doityourself"],amenities:[]},
security:{shops:["security","electronics","hardware"],amenities:[]},
party:{shops:["party","gift","variety_store","department_store"],amenities:[]},
gift:{shops:["gift","variety_store","department_store","religion"],amenities:[]},
luggage:{shops:["bag","leather","department_store","clothes"],amenities:[]},
workwear:{shops:["workwear","clothes","safety","hardware"],amenities:[]},
scientific:{shops:["scientific","laboratory","camera","electronics","hobby"],amenities:[]},
pool:{shops:["swimming_pool","hardware","garden_centre"],amenities:[]},
general_retail:{shops:["department_store","mall","general","variety_store","supermarket","convenience"],amenities:[]}
};

const n=v=>String(v||"").trim().toLowerCase();

function group(i={}){
  const declared=n(i.retailCategory).replace(/\s+/g,"_");
  if(T[declared])return declared;

  const x=n([i.object,i.name,i.category,i.searchQuery,i.brand,...(i.visibleText||[]),...(i.likelyStoreTypes||[])].join(" "));

  const rules=[
    ["hearing",/hearing aid|hearing-aid|hearing aid battery|audiology|ear mould|earmold/],
    ["optical",/eyeglass|glasses|spectacle|sunglasses|contact lens|optician|eyewear/],
    ["mobility",/wheelchair|crutch|walking frame|walker|mobility aid/],
    ["medical",/stethoscope|blood pressure monitor|thermometer|orthopaedic|brace|medical supply|first aid/],
    ["grocery",/energy drink|soft drink|soda|beverage|juice|monster|red bull|tissue|toilet paper|grocery|snack|food|drink|cleaning|soap|shampoo|household|baby formula|nappy|diaper/],
    ["footwear",/shoe|sneaker|boot|sandal|footwear/],
    ["clothing",/shirt|sweater|hoodie|jacket|dress|jeans|clothing|fashion|apparel|uniform|schoolwear/],
    ["workwear",/safety boot|hard hat|ppe|workwear|protective clothing|hearing protection/],
    ["sports",/football|soccer|rugby|cricket|tennis|gym|fitness|sports/],
    ["bicycle",/bicycle|bike part|cycling|helmet bicycle/],
    ["outdoor",/camping|fishing|binocular|outdoor|tent|sleeping bag/],
    ["music",/microphone|guitar|piano|music|audio interface|mixer|vinyl|turntable|sheet music/],
    ["office",/printer ink|toner|label printer|barcode scanner|pos terminal|office chair|filing cabinet|office supply/],
    ["security",/security camera|alarm|smart home sensor|cctv|doorbell camera/],
    ["electrical",/electrical component|switchgear|breaker|ups|surge protector|inverter|solar panel/],
    ["plumbing",/plumbing|pipe fitting|tap fitting|valve/],
    ["industrial",/welding|industrial|trade tool|generator|packaging supply/],
    ["electronics",/headphone|headset|speaker|phone|smartphone|camera|computer|laptop|television|tv|earbud|electronics|charger|power bank|router|networking|projector|drone|3d printer/],
    ["hardware",/tool|drill|hammer|screwdriver|hardware|paint|lock|door hardware/],
    ["home",/ceiling light|lamp|bulb|lighting|chair|table|sofa|furniture|fridge|microwave|kettle|appliance|cookware|bedding|curtain|mattress|vacuum|coffee machine/],
    ["stationery",/pencil|pen|pencil case|stationery|notebook|school/],
    ["books",/book|novel|textbook|magazine/],
    ["craft",/craft|knitting|yarn|sewing|haberdashery|cake decoration|baking mould/],
    ["fabric",/fabric|cloth roll|textile/],
    ["art",/art supply|canvas|paint brush|easel/],
    ["hobby",/rc car|model kit|trading card|collectible|board game accessory|hobby|cosplay/],
    ["toys",/toy|lego|doll|puzzle|board game/],
    ["pharmacy",/medicine|medication|tablet|capsule|pharmacy|pet medication/],
    ["beauty",/perfume|fragrance|makeup|cosmetic|skincare|hair clipper|trimmer|salon tool|tattoo aftercare/],
    ["pet",/dog food|cat food|pet|aquarium|bird supply/],
    ["agrarian",/horse tack|animal feed|farm tool|agrarian|farm supply/],
    ["garden",/flower|plant|seed|garden|bonsai|hydroponic|fertilizer|compost|irrigation/],
    ["motorcycle",/motorcycle helmet|motorcycle part|motorbike/],
    ["automotive",/car battery|tyre|tire|car part|vehicle part|automotive|mustang|motor oil|car audio|detailing/],
    ["jewellery",/ring|necklace|bracelet|earring|watch|jewelry|jewellery/],
    ["baby",/baby|stroller|pram|maternity/],
    ["party",/party supply|costume|balloon/],
    ["gift",/gift|souvenir|religious item|candle|decor/],
    ["luggage",/luggage|suitcase|handbag|wallet|leather goods/],
    ["scientific",/microscope|telescope|laboratory|lab glassware/],
    ["pool",/pool supply|pool chemical|swimming pool/]
  ];

  for(const [k,re] of rules) if(re.test(x)) return k;
  return "general_retail";
}

function dist(a,b,c,d){
  const R=6371,p=Math.PI/180;
  const x=Math.sin((c-a)*p/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin((d-b)*p/2)**2;
  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}

function q(lat,lon,r,key){
  const c=T[key]||T.general_retail;
  const shops=c.shops.map(v=>`nwr(around:${r},${lat},${lon})["shop"="${v}"];`).join("");
  const amenities=(c.amenities||[]).map(v=>`nwr(around:${r},${lat},${lon})["amenity"="${v}"];`).join("");
  const chains=CHAINS.map(v=>`nwr(around:${r},${lat},${lon})["name"~"${v}",i];`).join("");
  return `[out:json][timeout:18];(${shops}${amenities}${chains});out center tags;`;
}

async function fetchO(query){
  let last;
  for(const u of ENDPOINTS){
    try{
      const c=new AbortController(),tm=setTimeout(()=>c.abort(),12000);
      const r=await fetch(u,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded;charset=UTF-8"},body:"data="+encodeURIComponent(query),signal:c.signal});
      clearTimeout(tm);
      if(!r.ok) throw Error("Overpass "+r.status);
      return await r.json();
    }catch(e){last=e}
  }
  throw last||Error("Nearby unavailable");
}

function norm(elements,lat,lon,max){
  const map=new Map();
  for(const x of elements||[]){
    const t=x.tags||{},a=x.lat??x.center?.lat,b=x.lon??x.center?.lon;
    if(!Number.isFinite(a)||!Number.isFinite(b))continue;
    const d=dist(lat,lon,a,b);
    if(d>max+.05)continue;
    const name=t.name||t.brand||t.operator;
    if(!name)continue;
    const k=n(name)+"|"+Math.round(a*1000)+"|"+Math.round(b*1000);
    const v={name,type:t.shop||t.amenity||"retail",distanceKm:d,lat:a,lon:b,address:[t["addr:housenumber"],t["addr:street"],t["addr:suburb"],t["addr:city"]].filter(Boolean).join(" ")};
    if(!map.has(k)||d<map.get(k).distanceKm)map.set(k,v);
  }
  return [...map.values()].sort((a,b)=>a.distanceKm-b.distanceKm);
}

export default async function handler(req,res){
  res.setHeader("Cache-Control","s-maxage=180, stale-while-revalidate=600");
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  try{
    const {lat,lon,identification={}}=req.body||{},a=Number(lat),b=Number(lon);
    if(!Number.isFinite(a)||!Number.isFinite(b))return res.status(400).json({error:"Valid location required"});

    const g=group(identification);
    let stores=[],radiusKm=3;

    for(const r of [3,5,10]){
      radiusKm=r;
      const data=await fetchO(q(a,b,r*1000,g));
      stores=norm(data.elements,a,b,r);
      if(stores.length>=4)break;
    }

    stores=stores.filter(x=>x.distanceKm<=10).slice(0,8);

    return res.status(200).json({
      ok:true,
      retailGroup:g,
      radiusKm,
      stores,
      reliable:stores.length>0,
      message:stores.length?`Showing closest relevant stores within ${radiusKm} km.`:"No reliable nearby mapped stores were found within 10 km.",
      disclaimer:"Nearby store type only. Exact product stock is not verified."
    });
  }catch(e){
    console.error(e);
    return res.status(503).json({ok:false,reliable:false,stores:[],error:"Nearby store search is temporarily unavailable."});
  }
}
