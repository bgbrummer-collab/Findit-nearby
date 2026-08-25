import {resolveProduct} from '../lib/product-resolver.js';
import {searchSimilar} from '../lib/similar-search.js';
import {augmentRetailerCoverage} from '../lib/retailer-coverage.js';

const BLOCKED=/\b(firearm|gun|rifle|pistol|ammunition|ammo|weapon|knife|machete|sword|switchblade|taser|pepper spray|fireworks|explosive|vape|nicotine|cigarette|alcohol|beer|wine|liquor|cannabis|marijuana|thc|cbd|gambling|casino|pornography)\b/i;
const conditioner={brand:'Marc Anthony',model:'Strictly Curls 3X Moisture Triple Blend Conditioner 250ml',name:'Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml',query:'Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml',searchQuery:'Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml',object:'conditioner',category:'hair care',retailCategory:'beauty',features:['curl conditioner','moisture','detangling','250ml']};
const norm=v=>String(v??'').toLowerCase().replace(/\b(\d+)\s*(ml|mg|g|kg|l|gb|tb)\b/g,'$1$2').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const toks=v=>[...new Set(norm(v).split(' ').filter(x=>x.length>2&&!['the','and','for','with','from','this','that','search'].includes(x)))];
const STRICT_TYPES=['conditioner','shampoo','serum','mascara','foundation','lipstick','toothpaste','deodorant','perfume','fragrance','detergent','cleaner','router','range extender','microphone','headphones','earbuds','monitor','keyboard','mouse','camera','television','microwave','kettle','toaster','vacuum','drill','hammer'];
function urlLooksExact(o,body){
  if(o?.listingType!=='retailer_search_verified'&&o?.source!=='Exact retailer search result')return true;
  try{
    const path=norm(decodeURIComponent(new URL(o.product_url).pathname));
    const strict=STRICT_TYPES.find(x=>norm(body.object).includes(x));
    if(strict&&!path.includes(strict))return false;
    const brand=norm(body.brand);if(brand&&!path.includes(brand))return false;
    const q=toks(body.searchQuery||body.query||body.name||body.model||body.object),hits=q.filter(t=>path.includes(t)).length;
    return hits>=Math.min(4,Math.max(2,Math.ceil(q.length*.45)));
  }catch{return false}
}
function sanitizeExact(result,body){
  if(!result?.offers?.length)return result;
  const object=norm(body.object),strict=STRICT_TYPES.find(x=>object.includes(x));
  let offers=result.offers.filter(o=>urlLooksExact(o,body));
  offers=offers.filter(o=>!strict||norm(o.product_name).includes(strict));
  if(body.brand){const brand=norm(body.brand);offers=offers.filter(o=>norm(o.product_name).includes(brand));}
  result.offers=offers;
  result.matched=offers.length>0;
  result.verifiedOfferCount=offers.length;
  result.verifiedSellerCount=new Set(offers.map(o=>o.retailer?.name).filter(Boolean)).size;
  result.bestProduct=offers[0]?{name:offers[0].product_name}:null;
  const priced=offers.filter(o=>o.price!=null).sort((a,b)=>a.price-b.price);
  result.bestPrice=priced[0]||null;
  return result;
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  let body=req.body||{};
  if(req.method==='GET'&&req.query?.test==='conditioner') body={...conditioner};
  else if(req.method==='GET'&&req.query?.test==='alternatives') body={...conditioner,action:'alternatives'};
  else if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  if(BLOCKED.test([body.query,body.searchQuery,body.name,body.object,body.category,body.retailCategory].filter(Boolean).join(' ')))return res.status(403).json({error:'Unsupported product type'});
  try{
    if(body.action==='alternatives'){
      const result=await searchSimilar(body);
      if(!result.ok&&result.error)return res.status(400).json(result);
      return res.status(200).json(result);
    }
    let result=await resolveProduct(body);
    if(!result.ok&&result.error)return res.status(400).json(result);
    result=await augmentRetailerCoverage(result,body);
    result=sanitizeExact(result,body);
    return res.status(200).json(result);
  }catch(error){
    console.error('FindIt product resolver error',error);
    return res.status(500).json({ok:false,error:'Product lookup failed',message:error?.message||'Unknown error'});
  }
}
