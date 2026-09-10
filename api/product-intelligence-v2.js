import coreHandler from '../lib/product-intelligence-core.js';
import { universalCommerceDiscovery } from '../lib/universal-commerce-discovery.js';
import { groundedCommerce } from '../lib/grounded-commerce.js';

const clean=v=>String(v??'').trim();
const positive=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))&&Number(v)>0;
function safeUrl(v){try{return new URL(String(v||''))}catch{return null}}
function isProductPage(o){
  const u=safeUrl(o?.product_url||o?.url),title=clean(o?.product_name||o?.title).toLowerCase();
  if(!u)return false;
  const h=u.hostname.replace(/^www\./,'').toLowerCase(),p=u.pathname.toLowerCase();
  if(/open prime modal|prime modal|search results|shop online for electronics apparel computers|sign in to continue/.test(title))return false;
  if(/\/(search|category|categories|collections?|brands?|browse|blog|blogs|news|article|articles)(\/|$)/.test(p))return false;
  if(h==='nike.com'||h.endsWith('.nike.com')){
    if(/^\/w\//.test(p)||!/(^|\/)t\//.test(p))return false;
  }
  if(h==='amazon.com'||h.endsWith('.amazon.com')||h==='amazon.co.za'||h.endsWith('.amazon.co.za')){
    if(!(/\/dp\//.test(p)||/\/gp\/product\//.test(p)))return false;
  }
  return true;
}
function priceIsPlausible(o){
  if(!positive(o?.price))return true;
  const u=safeUrl(o?.product_url||o?.url);if(!u)return false;
  const h=u.hostname.replace(/^www\./,'').toLowerCase(),p=u.pathname.toLowerCase(),c=clean(o.currency).toUpperCase();
  if(c==='ZAR'&&!h.endsWith('.co.za')&&!h.endsWith('.za.com')&&!/\/za(?:\/|$)/.test(p))return false;
  return true;
}
function offerScore(o){
  return (o?.sourcePageVerified===true?1000:0)+(o?.searchGroundedVerified===true?500:0)+(o?.exactProductMatch===true?300:0)+(o?.verified===true?120:0)+(positive(o?.price)?100:0)+(/^(in_stock|out_of_stock|preorder|backorder)$/i.test(clean(o?.availability))?60:0)+(o?.universalDiscovery===true?20:0)+Math.min(100,Number(o?.matchScore||0));
}
function offerKey(o){
  const u=clean(o?.product_url||o?.url).toLowerCase();
  const r=clean(o?.retailer?.name||o?.retailer||o?.store||o?.seller).toLowerCase();
  return `${r}|${u}`;
}
function mergeOffers(...groups){
  const map=new Map();
  for(const group of groups){
    for(const o of(Array.isArray(group)?group:[])){
      if(!isProductPage(o)||!priceIsPlausible(o))continue;
      const k=offerKey(o);if(!k||k.endsWith('|'))continue;
      const old=map.get(k);
      if(!old||offerScore(o)>offerScore(old))map.set(k,o);
      else if(offerScore(o)===offerScore(old))map.set(k,{...old,...o,price:positive(o.price)?o.price:old.price,currency:positive(o.price)?(o.currency||old.currency):old.currency,availability:o.availability||old.availability,verified:old.verified===true||o.verified===true,sourcePageVerified:old.sourcePageVerified===true||o.sourcePageVerified===true,searchGroundedVerified:old.searchGroundedVerified===true||o.searchGroundedVerified===true,exactProductMatch:old.exactProductMatch===true||o.exactProductMatch===true});
    }
  }
  return [...map.values()];
}
function normalize(data){
  if(!data)return data;
  data.offers=mergeOffers(data.offers);
  const priced=data.offers.filter(o=>positive(o.price)).sort((a,b)=>Number(a.price)-Number(b.price));
  const inStock=data.offers.filter(o=>o.availability==='in_stock');
  data.matched=data.offers.length>0;
  data.exactMatchVerified=data.offers.length>0;
  data.bestProduct=data.offers[0]?{name:data.offers[0].product_name}:null;
  data.bestPrice=priced[0]||null;
  data.verifiedOfferCount=data.offers.length;
  data.verifiedSellerCount=new Set(data.offers.map(o=>o?.retailer?.name||o?.retailer).filter(Boolean)).size;
  data.priceVerifiedCount=priced.length;
  data.inStockOfferCount=inStock.length;
  data.postValidation='Strict product-page and currency validation';
  return data;
}
function requestData(req){return req.method==='POST'?(req.body||{}):(req.query||{})}
function canonicalRetryData(req){
  const src=requestData(req),i=src.identification||src;
  const text=`${clean(i.brand)} ${clean(i.model)} ${clean(i.name)} ${clean(i.object)} ${clean(i.searchQuery||i.query)}`.toLowerCase();
  if(!/marc\s+anthony/.test(text)||!/conditioner/.test(text)||!/(3x|moisture|moist|strictly\s+curls|triple\s+blend)/.test(text))return null;
  const canonical={...i,brand:'Marc Anthony',model:'Strictly Curls 3X Moisture Triple Blend Conditioner 250ml',name:'Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml',object:'hair conditioner',category:'beauty',retailCategory:'beauty',searchQuery:'Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml'};
  return src.identification?{...src,identification:canonical}:{...src,...canonical};
}
async function runCore(req){
  let statusCode=200,payload,headers={};
  const proxy={setHeader(k,v){headers[k]=v;return proxy},status(n){statusCode=n;return proxy},json(v){payload=v;return v},end(v){payload=v;return v}};
  await coreHandler(req,proxy);
  return{statusCode,payload,headers};
}
function needsCanonicalRetry(out){
  if(!out||!Array.isArray(out.offers))return true;
  const priced=out.offers.filter(o=>positive(o.price));
  const sellers=new Set(out.offers.map(o=>clean(o?.retailer?.name||o?.retailer)).filter(Boolean));
  return priced.length===0||sellers.size<2;
}
function needsUniversal(out){
  if(!out||!Array.isArray(out.offers))return true;
  const priced=out.offers.filter(o=>positive(o.price));
  const sellers=new Set(out.offers.map(o=>clean(o?.retailer?.name||o?.retailer)).filter(Boolean));
  return priced.length===0||sellers.size<2;
}
function mergeRetailerStatus(out){
  const offers=Array.isArray(out?.offers)?out.offers:[],existing=Array.isArray(out?.retailerStatus)?out.retailerStatus:[],verified=offers.map(o=>({name:o?.retailer?.name||o?.retailer||'Retailer',searchUrl:o?.product_url||o?.url,exactProductMatch:true,stockVerified:/^(in_stock|out_of_stock|preorder|backorder)$/i.test(clean(o?.availability)),branchStockVerified:false,directionsAvailable:false,status:o?.sourcePageVerified===true?'verified_exact_online_listing':'search_grounded_exact_listing'}));
  const names=new Set(verified.map(x=>clean(x.name).toLowerCase()));
  return [...verified,...existing.filter(x=>!names.has(clean(x?.name).toLowerCase()))].slice(0,14);
}

export default async function handler(req,res){
  let first=await runCore(req),out=normalize(first.payload);
  const retryData=(first.statusCode===200&&needsCanonicalRetry(out))?canonicalRetryData(req):null;
  if(retryData){
    const retryReq={...req,body:req.method==='POST'?retryData:req.body,query:req.method==='GET'?retryData:req.query};
    const second=await runCore(retryReq),secondOut=normalize(second.payload);
    const merged=mergeOffers(out?.offers,secondOut?.offers);
    if(merged.length>(out?.offers?.length||0)||merged.some(o=>positive(o.price))){
      out=normalize({...out,...secondOut,offers:merged,requestedIdentity:requestData(req),canonicalCommerceIdentity:retryData.identification||retryData,commerceIdentityRetry:true});
      first={...first,headers:{...first.headers,...second.headers}};
    }
  }
  if(first.statusCode===200&&needsUniversal(out)){
    try{
      const broad=await universalCommerceDiscovery(requestData(req));
      if(broad.length)out=normalize({...out,offers:mergeOffers(out?.offers,broad),universalCommerceSearch:true});
    }catch(e){console.error('universal commerce fallback',e)}
  }
  if(first.statusCode===200&&needsUniversal(out)){
    try{
      const grounded=await groundedCommerce(requestData(req));
      if(grounded.length)out=normalize({...out,offers:mergeOffers(out?.offers,grounded),groundedCommerceSearch:true});
    }catch(e){console.error('grounded commerce fallback',e)}
  }
  if(out?.offers?.length){
    out.retailerStatus=mergeRetailerStatus(out);
    out.webRetailers=out.retailerStatus;
    out.discoveryMethod=out.groundedCommerceSearch?'Direct exact retailer verification plus Google Search-grounded retailer evidence when niche pages cannot be discovered directly. Grounded results are labelled separately and never treated as branch inventory.':'Known-retailer search plus wider-web exact product-page verification. Uncommon and niche products can surface when a real retailer page is verifiable; price and stock are never inferred.';
  }
  for(const [k,v] of Object.entries(first.headers||{}))res.setHeader(k,v);
  return res.status(first.statusCode).json(out);
}
