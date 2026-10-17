const clean=(v,n)=>v==null?null:String(v).slice(0,n);
const topics=new Set(['general','wrong_item','nearby','missing_product','mobile','desktop','bug','idea']);
export function feedbackPayload(body={}){
 const rating=Number(body.rating),message=String(body.message||'').trim();
 if(!Number.isInteger(rating)||rating<1||rating>5)return{error:'Rating must be from 1 to 5.'};
 if(message.length<3||message.length>1200)return{error:'Feedback message must be between 3 and 1200 characters.'};
 const raw=body.technical;let technical=null;
 if(raw&&typeof raw==='object'&&!Array.isArray(raw)){
  technical={};for(const [key,max]of Object.entries({page:100,viewport:30,platform:80,language:30,item:160,searchQuery:220,retailCategory:80,lastError:240,lastSearchCompletedAt:50}))technical[key]=clean(raw[key],max);
  for(const key of ['online','hasLocation','exactProductMatch'])technical[key]=Boolean(raw[key]);
  for(const key of ['recognitionConfidence','closestStoreDistanceKm','nearbyRadiusKm'])technical[key]=raw[key]!=null&&Number.isFinite(Number(raw[key]))?Number(raw[key]):null;
  for(const key of ['exactOfferCount','nearbyStoreCount'])technical[key]=raw[key]!=null&&Number.isInteger(Number(raw[key]))&&Number(raw[key])>=0?Number(raw[key]):null;
 }
 return{rating,message,topic:topics.has(body.topic)?body.topic:'general',technical,source:'FindIt Nearby',createdAt:new Date().toISOString()};
}
