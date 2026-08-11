const OVERPASS_ENDPOINTS=[
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter"
];

const GROUPS={
  grocery:["supermarket","convenience","general","department_store"],
  clothing:["clothes","shoes","sports","department_store"],
  electronics:["electronics","computer","mobile_phone","hifi","musical_instrument","department_store"],
  home:["hardware","doityourself","lighting","furniture","houseware","department_store"],
  stationery:["stationery","books","variety_store","department_store"],
  garden:["florist","garden_centre","supermarket"],
  automotive:["car","car_parts","tyres"],
  general:["department_store","mall","general","variety_store","supermarket"]
};

const clean=v=>String(v||"").trim().toLowerCase();

function chooseGroup(i={}){
  const t=clean([i.object,i.name,i.category,i.searchQuery,i.visibleText].join(" "));
  if(/tissue|toilet paper|paper towel|grocery|food|drink|snack|cleaning|soap|shampoo|household/.test(t))return "grocery";
  if(/shoe|sneaker|shirt|sweater|hoodie|jacket|dress|clothing|fashion|apparel/.test(t))return "clothing";
  if(/microphone|headphone|headset|speaker|phone|smartphone|camera|computer|laptop|electronic/.test(t))return "electronics";
  if(/light|lamp|hardware|furniture|chair|appliance|homeware/.test(t))return "home";
  if(/pencil|stationery|book|school/.test(t))return "stationery";
  if(/flower|plant|garden/.test(t))return "garden";
  if(/car|vehicle|automotive|mustang|tyre|tire/.test(t))return "automotive";
  return "general";
}

function distanceKm(a,b,c,d){
  const R=6371,p=Math.PI/180;
  const x=Math.sin((c-a)*p/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin((d-b)*p/2)**2;
  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}

function query(lat,lon,radius,tags){
  const q=tags.map(tag=>`nwr(around:${radius},${lat},${lon})["shop"="${tag}"];`).join("");
  return `[out:json][timeout:18];(${q});out center tags;`;
}

async function fetchOverpass(q){
  let last;
  for(const url of OVERPASS_ENDPOINTS){
    try{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),12000);
      const r=await fetch(url,{
        method:"POST",
        headers:{"content-type":"application/x-www-form-urlencoded;charset=UTF-8"},
        body:"data="+encodeURIComponent(q),
        signal:controller.signal
      });
      clearTimeout(timer);
      if(!r.ok)throw new Error("Overpass "+r.status);
      return await r.json();
    }catch(e){last=e}
  }
  throw last||new Error("Nearby provider unavailable");
}

function normalize(elements,lat,lon,maxKm){
  const seen=new Map();
  for(const x of elements||[]){
    const t=x.tags||{},xlat=x.lat??x.center?.lat,xlon=x.lon??x.center?.lon;
    if(!Number.isFinite(xlat)||!Number.isFinite(xlon))continue;
    const d=distanceKm(lat,lon,xlat,xlon);
    if(d>maxKm+0.1)continue;
    const name=t.name||t.brand||t.operator;
    if(!name)continue;
    const key=clean(name)+"|"+Math.round(xlat*1000)+"|"+Math.round(xlon*1000);
    const store={
      name,type:t.shop||"retail",distanceKm:d,lat:xlat,lon:xlon,
      address:[t["addr:housenumber"],t["addr:street"],t["addr:suburb"],t["addr:city"]].filter(Boolean).join(" "),
      openingHours:t.opening_hours||null
    };
    if(!seen.has(key)||d<seen.get(key).distanceKm)seen.set(key,store);
  }
  return [...seen.values()].sort((a,b)=>a.distanceKm-b.distanceKm);
}

export default async function handler(req,res){
  res.setHeader("Cache-Control","s-maxage=180, stale-while-revalidate=600");
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  try{
    const {lat,lon,identification={}}=req.body||{};
    const a=Number(lat),b=Number(lon);
    if(!Number.isFinite(a)||!Number.isFinite(b))return res.status(400).json({error:"Valid location required"});

    const group=chooseGroup(identification);
    const tags=[...new Set([...(GROUPS[group]||[]),...GROUPS.general])];
    const stages=[5,10,20];
    let stores=[],radiusKm=5;

    for(const r of stages){
      radiusKm=r;
      const data=await fetchOverpass(query(a,b,r*1000,tags));
      stores=normalize(data.elements,a,b,r);
      if(stores.length>=5)break;
    }

    stores=stores.filter(s=>s.distanceKm<=radiusKm).sort((x,y)=>x.distanceKm-y.distanceKm).slice(0,10);

    return res.status(200).json({
      ok:true,source:"OpenStreetMap / Overpass",categoryGroup:group,radiusKm,stores,
      disclaimer:"Nearby stores are relevant retailer types, not proof that the exact item is in stock."
    });
  }catch(e){
    console.error(e);
    return res.status(503).json({ok:false,stores:[],error:"Nearby store search is temporarily unavailable."});
  }
}