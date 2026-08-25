import {resolveProduct} from '../lib/product-resolver.js';
import {searchSimilar} from '../lib/similar-search.js';
import {augmentRetailerCoverage} from '../lib/retailer-coverage.js';
import {selectedRetailers,hostMatches} from '../lib/retailers.js';

const BLOCKED=/\b(firearm|gun|rifle|pistol|ammunition|ammo|weapon|knife|machete|sword|switchblade|taser|pepper spray|fireworks|explosive|vape|nicotine|cigarette|alcohol|beer|wine|liquor|cannabis|marijuana|thc|cbd|gambling|casino|pornography)\b/i;
const conditioner={brand:'Marc Anthony',model:'Strictly Curls 3X Moisture Triple Blend Conditioner 250ml',name:'Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml',query:'Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml',searchQuery:'Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml',object:'conditioner',category:'hair care',retailCategory:'beauty',features:['curl conditioner','moisture','detangling','250ml']};
const norm=v=>String(v??'').toLowerCase().replace(/\b(\d+)\s*(ml|mg|g|kg|l|gb|tb|cm|mm|inch|in)\b/g,'$1$2').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const toks=v=>[...new Set(norm(v).split(' ').filter(x=>x.length>2&&!['the','and','for','with','from','this','that','search','product','item','online','shop','buy'].includes(x)))];
const STRICT_TYPES=['conditioner','shampoo','serum','mascara','foundation','lipstick','toothpaste','deodorant','perfume','fragrance','detergent','cleaner','router','range extender','microphone','headphones','headset','earbuds','monitor','keyboard','mouse','camera','television','microwave','kettle','toaster','vacuum','drill','hammer','shoe','sneaker','boot','jacket','shirt','jeans','adapter','charger','speaker','watch','phone','laptop','tablet'];
const parsePrice=v=>{if(v==null)return null;let s=String(v).replace(/\s/g,'').replace(/[^0-9.,]/g,'');if(!s)return null;if(s.includes(',')&&s.includes('.'))s=s.replace(/,/g,'');else if(s.includes(',')&&!s.includes('.')){const p=s.split(',');s=p.at(-1).length===2?p.slice(0,-1).join('')+'.'+p.at(-1):p.join('')}const n=Number(s);return Number.isFinite(n)&&n>0&&n<10000000?n:null};
const parseStock=v=>{const s=norm(v);if(/out of stock|sold out|currently unavailable|not available/.test(s))return'out_of_stock';if(/in stock|available online|add to cart|add to basket|delivery available|click collect|click and collect|store pickup|store pick up/.test(s))return'in_stock';if(/pre.?order/.test(s))return'preorder';if(/back.?order/.test(s))return'backorder';return null};
const parseJson=text=>{const s=String(text||'').replace(/^```json\s*/i,'').replace(/```\s*$/,'').trim();try{return JSON.parse(s)}catch{const a=s.indexOf('{'),z=s.lastIndexOf('}');if(a>=0&&z>a){try{return JSON.parse(s.slice(a,z+1))}catch{}}return null}};
const directProductUrl=(url,domain)=>{try{const u=new URL(url),p=u.pathname.toLowerCase();if(!hostMatches(url,domain))return false;if(/\/(search|catalogsearch|browse|category|categories|brands?|collections?|all)(\/|$)/.test(p))return false;if(/[?&](q|text|search|qsearch)=/i.test(u.search))return false;if(domain==='clicks.co.za')return /\/p\/\d+\/?$/.test(p);return p.split('/').filter(Boolean).length>=2}catch{return false}};

function exactEnough(title,url,body){
  const hay=norm(`${title||''} ${url||''}`),brand=norm(body.brand),type=STRICT_TYPES.find(x=>norm([body.object,body.category,body.retailCategory,body.name].filter(Boolean).join(' ')).includes(x));
  if(brand&&!hay.includes(brand))return false;
  if(type&&!hay.includes(type))return false;
  const wanted=toks(body.searchQuery||body.query||body.name||body.model||body.object),model=toks(body.model),sizes=wanted.filter(t=>/^\d+(?:\.\d+)?(?:ml|mg|g|kg|l|gb|tb|cm|mm|inch|in)$/.test(t));
  if(sizes.length&&!sizes.every(x=>hay.includes(x)))return false;
  if(model.length&&model.filter(t=>hay.includes(t)).length<Math.min(2,model.length))return false;
  const hits=wanted.filter(t=>hay.includes(t)).length;
  return hits>=Math.min(5,Math.max(2,Math.ceil(wanted.length*.42)));
}
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
function mergeOffers(result,extra){
  const seen=new Set(),rows=[];
  for(const o of [...(result.offers||[]),...(extra||[])]){const k=norm(`${o.retailer?.name||''}|${o.product_url||''}`);if(!k||seen.has(k))continue;seen.add(k);rows.push(o)}
  rows.sort((a,b)=>Number(b.matchScore||0)-Number(a.matchScore||0)||((a.price??1e15)-(b.price??1e15)));
  result.offers=rows.slice(0,30);result.matched=rows.length>0;result.verifiedOfferCount=rows.length;result.verifiedSellerCount=new Set(rows.map(o=>o.retailer?.name).filter(Boolean)).size;result.bestProduct=rows[0]?{name:rows[0].product_name}:null;const priced=rows.filter(o=>o.price!=null).sort((a,b)=>a.price-b.price);result.bestPrice=priced[0]||null;return result;
}

async function universalGroundedRecovery(body,result){
  const key=process.env.GEMINI_API_KEY;if(!key)return result;
  const q=String(body.searchQuery||body.query||body.name||body.model||body.object||'').trim();if(!q)return result;
  const profiles=selectedRetailers(q,body).slice(0,16),existing=new Set((result.offers||[]).map(o=>norm(o.retailer?.name)).filter(Boolean));
  const missing=profiles.filter(p=>!existing.has(norm(p.name))||!(result.offers||[]).some(o=>norm(o.retailer?.name)===norm(p.name)&&o.price!=null));
  if(!missing.length)return result;
  const allowed=missing.map(p=>`${p.name} (${p.domain})`).join(', ');
  const prompt=`Use Google Search to find the EXACT current product "${q}" at these South African retailers: ${allowed}. This is a universal product lookup, so match brand, exact model/variant, product type, size/capacity and important numeric identifiers. Never substitute a similar product. Return a DIRECT retailer product page, not search/category pages. For each exact product page, return the current published ONLINE price and ONLINE availability only when supported by the page. Do not guess physical branch stock. JSON only: {"offers":[{"retailer":"","title":"","url":"","price":null,"currency":"ZAR","availability":"in stock|out of stock|preorder|backorder|unknown","confidence":0}]}.`;
  let parsed=null;
  for(const model of ['gemini-2.5-flash','gemini-2.5-flash-lite']){
    try{const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],tools:[{google_search:{}}],generationConfig:{temperature:0}}),signal:AbortSignal.timeout(18000)});const d=await r.json().catch(()=>({}));if(!r.ok)continue;parsed=parseJson((d?.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join(''));if(parsed)break}catch{}
  }
  if(!parsed?.offers?.length)return result;
  const out=[];
  for(const x of parsed.offers){
    const p=missing.find(y=>norm(y.name)===norm(x.retailer)||hostMatches(x.url,y.domain));if(!p||Number(x.confidence||0)<.72||!directProductUrl(x.url,p.domain)||!exactEnough(x.title,x.url,body))continue;
    const pv=parsePrice(x.price),av=parseStock(x.availability);if(pv==null&&av==null)continue;
    out.push({product_name:String(x.title||q),price:pv,currency:x.currency||'ZAR',availability:av,product_url:x.url,verified:true,source:'Universal Google-grounded exact retailer recovery',retailer:{name:p.name,country:'ZA',source:'retailer_site'},matchScore:Number(x.confidence||0),branchStockVerified:false,branchPriceVerified:false,stockScope:'online',priceScope:'online',directionsAvailable:false,listingType:'retailer_verified',onlineListing:true,checkedAt:new Date().toISOString()});
  }
  return mergeOffers(result,out);
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
    result=await universalGroundedRecovery(body,result);
    result=sanitizeExact(result,body);
    return res.status(200).json(result);
  }catch(error){
    console.error('FindIt product resolver error',error);
    return res.status(500).json({ok:false,error:'Product lookup failed',message:error?.message||'Unknown error'});
  }
}
