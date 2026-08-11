const TYPE_RULES=[
  {words:["shoe","sneaker","footwear"],types:["shoe_store"]},
  {words:["clothing","shirt","sweater","jacket","fashion"],types:["clothing_store"]},
  {words:["flower","plant","florist"],types:["florist"]},
  {words:["car","vehicle","automobile"],types:["car_dealer"]},
  {words:["book"],types:["book_store"]},
  {words:["furniture","chair","table","sofa"],types:["furniture_store"]},
  {words:["tool","hardware","ceiling light","lighting"],types:["hardware_store","home_goods_store"]},
  {words:["phone","computer","camera","microphone","headphone","speaker","electronics"],types:["electronics_store"]},
  {words:["home","appliance"],types:["home_goods_store"]}
];

export default{
  async fetch(request){
    if(request.method!=="POST")return json({error:"POST only"},405);
    const apiKey=process.env.GOOGLE_PLACES_API_KEY;
    if(!apiKey)return json({enabled:false,stores:[],message:"Google Places is not connected yet. Add GOOGLE_PLACES_API_KEY in Vercel when ready."});
    try{
      const body=await request.json(),lat=Number(body.lat),lon=Number(body.lon);
      if(!Number.isFinite(lat)||!Number.isFinite(lon))return json({error:"Valid latitude/longitude required"},400);
      const types=mapTypes(`${body.category||""} ${body.object||""}`);
      if(!types.length)return json({enabled:true,stores:[],message:"No safe relevant nearby-store type is configured for this item yet."});
      const response=await fetch("https://places.googleapis.com/v1/places:searchNearby",{method:"POST",headers:{"Content-Type":"application/json","X-Goog-Api-Key":apiKey,"X-Goog-FieldMask":"places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.types"},body:JSON.stringify({includedTypes:types,maxResultCount:12,rankPreference:"DISTANCE",locationRestriction:{circle:{center:{latitude:lat,longitude:lon},radius:15000}}})});
      const raw=await response.json();if(!response.ok)throw new Error(raw?.error?.message||"Google Places request failed");
      const stores=(raw.places||[]).map(p=>({id:p.id,name:p.displayName?.text||"Store",address:p.formattedAddress||"",lat:p.location?.latitude??null,lon:p.location?.longitude??null,distanceKm:p.location?haversine(lat,lon,p.location.latitude,p.location.longitude):null,mapsUrl:p.googleMapsUri||null,types:p.types||[],exactStockVerified:false}));
      return json({enabled:true,stores,message:"Nearby businesses are discovery results only; exact product stock is not verified by Places."});
    }catch(error){console.error("FindIt /api/nearby error",error);return json({error:"Nearby search failed",message:error.message},500)}
  }
};
function mapTypes(text){const s=String(text).toLowerCase();for(const rule of TYPE_RULES)if(rule.words.some(w=>s.includes(w)))return rule.types;return[]}
function haversine(a,b,c,d){const R=6371,p=Math.PI/180,x=Math.sin((c-a)*p/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin((d-b)*p/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}})}
