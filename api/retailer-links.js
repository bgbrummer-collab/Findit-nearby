const BLOCKED=["firearm","gun","rifle","pistol","ammunition","ammo","weapon","switchblade","taser","pepper spray","vape","nicotine","cigarette","cigar","alcohol","beer","wine","liquor","cannabis","marijuana","thc","gambling","sports betting","casino","pornography","adult sex toy"];

const RETAILERS=[
  {name:"Takealot",domain:"takealot.com",all:true},
  {name:"Makro",domain:"makro.co.za",all:true},
  {name:"Game",domain:"game.co.za",all:true},
  {name:"Builders",domain:"builders.co.za",cats:["hardware","tools","diy","garden","home","electrical","plumbing","automotive"]},
  {name:"Sportsmans Warehouse",domain:"sportsmanswarehouse.co.za",cats:["sports","footwear","shoes","sneaker","fitness","outdoor","cycling"]},
  {name:"Cape Union Mart",domain:"capeunionmart.co.za",cats:["outdoor","camping","travel","footwear","clothing"]},
  {name:"Clicks",domain:"clicks.co.za",cats:["health","beauty","personal care","baby"]},
  {name:"Dis-Chem",domain:"dischem.co.za",cats:["health","beauty","personal care","baby"]},
  {name:"Woolworths",domain:"woolworths.co.za",cats:["clothing","fashion","home","food","grocery"]},
  {name:"Incredible Connection",domain:"incredible.co.za",cats:["electronics","computer","computing","phone","mobile","gaming","audio"]},
  {name:"HiFi Corp",domain:"hificorp.co.za",cats:["electronics","audio","tv","appliance","computer","gaming"]}
];

function norm(v){return String(v||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim()}
function blocked(v){const s=norm(v);return BLOCKED.some(x=>s.includes(x))}
function queryFrom(b){
  const words=[],seen=new Set();
  for(const value of [b.brand,b.model,b.name,b.object,b.query]){
    for(const w of norm(value).split(/\s+/).filter(Boolean)){
      if(!seen.has(w)){seen.add(w);words.push(w)}
    }
  }
  return words.slice(0,16).join(" ").slice(0,180)
}
function retailerUrl(domain,q){return `https://www.google.com/search?q=${encodeURIComponent(`site:${domain} "${q}"`)}`}

export default function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  const b=req.body||{};
  const q=queryFrom(b);
  if(!q)return res.status(400).json({error:"Product details required"});
  if(blocked(q))return res.status(400).json({error:"This product type is not supported."});
  const cat=norm([b.category,b.retailCategory,b.name,b.object].join(" "));
  const links=RETAILERS.filter(r=>r.all||r.cats?.some(c=>cat.includes(c))).slice(0,7).map(r=>({name:r.name,url:retailerUrl(r.domain,q),verifiedExact:false,verifiedStock:false,label:`Search ${r.name}`}));
  return res.json({ok:true,query:q,links,message:"These links search retailer sites for the identified product. They do not claim verified exact stock unless FindIt separately has connected catalogue or branch-stock evidence."});
}
