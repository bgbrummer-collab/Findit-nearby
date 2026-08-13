const OK=new Set(["search_complete","search_failed","nearby_complete","nearby_failed","feedback_up","feedback_down"]);
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 const u=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
 const k=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SECRET_KEY;
 if(!u||!k)return res.status(503).json({error:"Analytics storage is not configured."});
 const base=u.replace(/\/$/,"");
 if(req.method==="POST"){
  const b=req.body||{}; if(!OK.has(String(b.eventType||"")))return res.status(400).json({error:"Invalid event"});
  const row={event_type:b.eventType,item:s(b.item,160),retail_category:s(b.retailCategory,80),confidence:n(b.confidence),
   exact_offer_count:i(b.exactOfferCount),nearby_store_count:i(b.nearbyStoreCount),
   closest_store_distance_km:n(b.closestStoreDistanceKm),radius_km:n(b.radiusKm),
   success:b.success==null?null:Boolean(b.success),country:s(req.headers["x-vercel-ip-country"],8),created_at:new Date().toISOString()};
  const r=await fetch(base+"/rest/v1/findit_events",{method:"POST",headers:{"Content-Type":"application/json",apikey:k,Authorization:"Bearer "+k,Prefer:"return=minimal"},body:JSON.stringify(row)});
  if(!r.ok)return res.status(502).json({error:"Could not save analytics"});
  return res.json({ok:true});
 }
 if(req.method==="GET"){
  const admin=process.env.FINDIT_ADMIN_KEY;
  if(!admin)return res.status(503).json({error:"FINDIT_ADMIN_KEY is not configured."});
  if(req.headers["x-findit-admin-key"]!==admin)return res.status(401).json({error:"Wrong admin key"});
  const r=await fetch(base+"/rest/v1/findit_events?select=*&order=created_at.desc&limit=5000",{headers:{apikey:k,Authorization:"Bearer "+k}});
  if(!r.ok)return res.status(502).json({error:"Could not read analytics"});
  const a=await r.json(), searches=a.filter(x=>["search_complete","search_failed"].includes(x.event_type)),
   complete=a.filter(x=>x.event_type==="search_complete"), near=a.filter(x=>x.event_type==="nearby_complete"),
   up=a.filter(x=>x.event_type==="feedback_up").length, down=a.filter(x=>x.event_type==="feedback_down").length;
  const pct=(x,y)=>y?Math.round(x/y*1000)/10:null, counts=(f,list)=>{let m={};list.forEach(x=>{let q=x[f]||"Unknown";m[q]=(m[q]||0)+1});return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([name,count])=>({name,count}))};
  let daily={};a.forEach(x=>{let d=String(x.created_at||"").slice(0,10);if(!d)return;daily[d]??={date:d,searches:0,nearby:0,positive:0,negative:0};if(["search_complete","search_failed"].includes(x.event_type))daily[d].searches++;if(x.event_type==="nearby_complete")daily[d].nearby++;if(x.event_type==="feedback_up")daily[d].positive++;if(x.event_type==="feedback_down")daily[d].negative++});
  return res.json({ok:true,totals:{searches:searches.length,searchSuccessRate:pct(complete.length,searches.length),usefulNearbyRate:pct(near.filter(x=>(x.nearby_store_count||0)>0).length,near.length),thumbsUp:up,thumbsDown:down},topItems:counts("item",complete),topCategories:counts("retail_category",complete),countries:counts("country",a.filter(x=>x.country)),daily:Object.values(daily).sort((a,b)=>a.date.localeCompare(b.date)).slice(-30)});
 }
 res.status(405).json({error:"Method not allowed"});
}
function s(v,m){return v==null?null:String(v).slice(0,m)} function n(v){let x=Number(v);return Number.isFinite(x)?x:null} function i(v){let x=Number(v);return Number.isInteger(x)?x:null}
