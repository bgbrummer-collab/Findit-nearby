import {resolveProduct} from '../lib/product-resolver.js';
import {searchSimilar} from '../lib/similar-search.js';
import {augmentRetailerCoverage} from '../lib/retailer-coverage.js';
import {selectedRetailers,hostMatches} from '../lib/retailers.js';

const BLOCKED=/\b(firearm|gun|rifle|pistol|ammunition|ammo|weapon|knife|machete|sword|switchblade|taser|pepper spray|fireworks|explosive|vape|nicotine|cigarette|alcohol|beer|wine|liquor|cannabis|marijuana|thc|cbd|gambling|casino|pornography)\b/i;
const conditioner={brand:'Marc Anthony',model:'Strictly Curls 3X Moisture Triple Blend Conditioner 250ml',name:'Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml',query:'Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml',searchQuery:'Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml',object:'conditioner',category:'hair care',retailCategory:'beauty',features:['curl conditioner','moisture','detangling','250ml']};
const norm=v=>String(v??'').toLowerCase().replace(/\b(\d+)\s*(ml|mg|g|kg|l|gb|tb|cm|mm|inch|in)\b/g,'$1$2').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const toks=v=>[...new Set(norm(v).split(' ').filter(x=>x.length>2&&!['the','and','for','with','from','this','that','search','product','item','online','shop','buy','men','mens','women','womens'].includes(x)))];
const TYPE_GROUPS=[
  ['footwear',['shoe','shoes','sneaker','sneakers','trainer','trainers','footwear','boot','boots']],
  ['conditioner',['conditioner','hair conditioner']],['shampoo',['shampoo']],
  ['headphones',['headphone','headphones','headset','headsets','earbuds','earphones']],
  ['router',['router','wifi router','wi fi router','range extender','wifi extender','wi fi extender']],
  ['phone',['phone','smartphone','mobile phone']],['laptop',['laptop','notebook']],['tablet',['tablet']],
  ['television',['television','tv','smart tv']],['camera',['camera']],['monitor',['monitor','display']],
  ['keyboard',['keyboard']],['mouse',['mouse']],['speaker',['speaker']],
  ['charger',['charger','charging adapter','power adapter']],['adapter',['adapter','adaptor']],
  ['microwave',['microwave']],['kettle',['kettle']],['toaster',['toaster']],['vacuum',['vacuum','vacuum cleaner']],
  ['drill',['drill']],['hammer',['hammer']],['jacket',['jacket','coat']],['shirt',['shirt','t shirt','tshirt','top']],
  ['jeans',['jeans','denim']],['watch',['watch','smartwatch']],['perfume',['perfume','fragrance']],['serum',['serum']],
  ['mascara',['mascara']],['foundation',['foundation']],['lipstick',['lipstick']],['toothpaste',['toothpaste']],
  ['deodorant',['deodorant']],['detergent',['detergent']],['cleaner',['cleaner','cleaning']]
];
const parsePrice=v=>{if(v==null)return null;let s=String(v).replace(/\s/g,'').replace(/[^0-9.,]/g,'');if(!s)return null;if(s.includes(',')&&s.includes('.'))s=s.replace(/,/g,'');else if(s.includes(',')&&!s.includes('.')){const p=s.split(',');s=p.at(-1).length===2?p.slice(0,-1).join('')+'.'+p.at(-1):p.join('')}const n=Number(s);return Number.isFinite(n)&&n>0&&n<10000000?n:null};
const parseStock=v=>{const s=norm(v);if(/out of stock|sold out|currently unavailable|not available/.test(s))return'out_of_stock';if(/in stock|available online|add to cart|add to basket|delivery available|click collect|click and collect|store pickup|store pick up/.test(s))return'in_stock';if(/pre.?order/.test(s))return'preorder';if(/back.?order/.test(s))return'backorder';return null};
const parseJson=text=>{const s=String(text||'').replace(/^```json\s*/i,'').replace(/```\s*$/,'').trim();try{return JSON.parse(s)}catch{const a=s.indexOf('{'),z=s.lastIndexOf('}');if(a>=0&&z>a){try{return JSON.parse(s.slice(a,z+1))}catch{}}return null}};
const directProductUrl=(url,domain)=>{try{const u=new URL(url),p=u.pathname.toLowerCase();if(!hostMatches(url,domain))return false;if(/\/(search|catalogsearch|browse|category|categories|brands?|collections?|all)(\/|$)/.test(p))return false;if(/[?&](q|text|search|qsearch)=/i.test(u.search))return false;if(domain==='clicks.co.za')return /\/p\/\d+\/?$/.test(p);return p.split('/').filter(Boolean).length>=1}catch{return false}};

function typeAliases(body){const source=norm([body.object,body.category,body.retailCategory,body.name].filter(Boolean).join(' '));for(const [,aliases] of TYPE_GROUPS)if(aliases.some(a=>source.includes(norm(a))))return aliases.map(norm);return[]}
function typeCompatible(hay,body){const a=typeAliases(body);return !a.length||a.some(x=>hay.includes(x))}
function profileFor(url,retailerName,body){const q=body.searchQuery||body.query||body.name||body.model||body.object||'';const profiles=selectedRetailers(q,body);return profiles.find(p=>hostMatches(url,p.domain))||profiles.find(p=>norm(p.name)===norm(retailerName))||null}
function brandCompatible(hay,url,retailerName,body){const brand=norm(body.brand);if(!brand)return true;if(hay.includes(brand))return true;const p=profileFor(url,retailerName,body),pb=norm(p?.brand);return Boolean(pb&&(brand.includes(pb)||pb.includes(brand)))}

function exactEnough(title,url,body,profile){
  const hay=norm(`${title||''} ${url||''}`),brand=norm(body.brand),pb=norm(profile?.brand);
  if(brand&&!hay.includes(brand)&&!(pb&&(brand.includes(pb)||pb.includes(brand))))return false;
  if(!typeCompatible(hay,body))return false;
  const wanted=toks(body.searchQuery||body.query||body.name||body.model||body.object),model=toks(body.model),sizes=wanted.filter(t=>/^\d+(?:\.\d+)?(?:ml|mg|g|kg|l|gb|tb|cm|mm|inch|in)$/.test(t));
  if(sizes.length&&!sizes.every(x=>hay.includes(x)))return false;
  const typeSet=new Set(typeAliases(body));const meaningfulModel=model.filter(t=>!typeSet.has(t)&&t!==brand);
  if(meaningfulModel.length&&meaningfulModel.filter(t=>hay.includes(t)).length<Math.min(2,meaningfulModel.length))return false;
  const hits=wanted.filter(t=>hay.includes(t)).length;
  return hits>=Math.min(4,Math.max(2,Math.ceil(wanted.length*.32)));
}
function urlLooksExact(o,body){
  if(o?.listingType!=='retailer_search_verified'&&o?.source!=='Exact retailer search result')return true;
  try{
    const url=o.product_url||'',path=norm(decodeURIComponent(new URL(url).pathname)),hay=norm(`${o.product_name||''} ${path}`);
    if(!typeCompatible(hay,body))return false;
    if(!brandCompatible(hay,url,o?.retailer?.name,body))return false;
    const q=toks(body.searchQuery||body.query||body.name||body.model||body.object),hits=q.filter(t=>hay.includes(t)).length;
    return hits>=Math.min(4,Math.max(2,Math.ceil(q.length*.32)));
  }catch{return false}
}
function sanitizeExact(result,body){
  if(!result?.offers?.length)return result;
  let offers=result.offers.filter(o=>urlLooksExact(o,body));
  offers=offers.filter(o=>typeCompatible(norm(`${o.product_name||''} ${o.product_url||''}`),body));
  offers=offers.filter(o=>brandCompatible(norm(`${o.product_name||''} ${o.product_url||''}`),o.product_url,o?.retailer?.name,body));
  result.offers=offers;result.matched=offers.length>0;result.verifiedOfferCount=offers.length;
  result.verifiedSellerCount=new Set(offers.map(o=>o.retailer?.name).filter(Boolean)).size;
  result.bestProduct=offers[0]?{name:offers[0].product_name}:null;
  const priced=offers.filter(o=>o.price!=null).sort((a,b)=>a.price-b.price);result.bestPrice=priced[0]||null;return result;
}
function mergeOffers(result,extra){
  const seen=new Set(),rows=[];for(const o of [...(result.offers||[]),...(extra||[])]){const k=norm(`${o.retailer?.name||''}|${o.product_url||''}`);if(!k||seen.has(k))continue;seen.add(k);rows.push(o)}
  rows.sort((a,b)=>Number(b.matchScore||0)-Number(a.matchScore||0)||((a.price??1e15)-(b.price??1e15)));
  result.offers=rows.slice(0,30);result.matched=rows.length>0;result.verifiedOfferCount=rows.length;result.verifiedSellerCount=new Set(rows.map(o=>o.retailer?.name).filter(Boolean)).size;result.bestProduct=rows[0]?{name:rows[0].product_name}:null;const priced=rows.filter(o=>o.price!=null).sort((a,b)=>a.price-b.price);result.bestPrice=priced[0]||null;return result;
}

async function universalGroundedRecovery(body,result){
  const key=process.env.GEMINI_API_KEY;if(!key)return result;
  const q=String(body.searchQuery||body.query||body.name||body.model||body.object||'').trim();if(!q)return result;
  const profiles=selectedRetailers(q,body).slice(0,24),existing=new Set((result.offers||[]).map(o=>norm(o.retailer?.name)).filter(Boolean));
  const missing=profiles.filter(p=>!existing.has(norm(p.name))||!(result.offers||[]).some(o=>norm(o.retailer?.name)===norm(p.name)&&o.price!=null));
  if(!missing.length)return result;
  const allowed=missing.map(p=>`${p.name} (${p.domain})${p.brand?` [official ${p.brand} store]`:''}`).join(', ');
  const prompt=`Use Google Search to find the EXACT current product "${q}" at these South African retailers: ${allowed}. Match the actual product, brand, model/variant and important size/capacity identifiers. Retailers can use equivalent wording such as sneaker/shoe/trainer, TV/television, headset/headphones/earbuds, adapter/adaptor. On an official brand website the product title may omit the brand because the domain itself proves it. Never substitute a different model. Return only a DIRECT retailer product page, never a search/category page. For each exact product page return current published ONLINE price and ONLINE availability when supported. Do not guess physical branch stock. JSON only: {"offers":[{"retailer":"","title":"","url":"","price":null,"currency":"ZAR","availability":"in stock|out of stock|preorder|backorder|unknown","confidence":0}]}.`;
  let parsed=null;
  for(const model of ['gemini-2.5-flash','gemini-2.5-flash-lite']){
    try{const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],tools:[{google_search:{}}],generationConfig:{temperature:0}}),signal:AbortSignal.timeout(22000)});const d=await r.json().catch(()=>({}));if(!r.ok)continue;parsed=parseJson((d?.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join(''));if(parsed?.offers?.length)break}catch{}
  }
  if(!parsed?.offers?.length)return result;
  const out=[];
  for(const x of parsed.offers){
    const p=missing.find(y=>norm(y.name)===norm(x.retailer)||hostMatches(x.url,y.domain));
    if(!p||Number(x.confidence||0)<.62||!directProductUrl(x.url,p.domain)||!exactEnough(x.title,x.url,body,p))continue;
    const pv=parsePrice(x.price),av=parseStock(x.availability);if(pv==null&&av==null)continue;
    out.push({product_name:String(x.title||q),price:pv,currency:x.currency||'ZAR',availability:av,product_url:x.url,verified:true,source:'Universal Google-grounded exact retailer recovery',retailer:{name:p.name,country:'ZA',source:'retailer_site'},matchScore:Number(x.confidence||0),branchStockVerified:false,branchPriceVerified:false,stockScope:'online',priceScope:'online',directionsAvailable:false,listingType:'retailer_verified',onlineListing:true,checkedAt:new Date().toISOString()});
  }
  return mergeOffers(result,out);
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  let body=req.body||{};
  if(req.method==='GET'&&req.query?.test==='conditioner')body={...conditioner};
  else if(req.method==='GET'&&req.query?.test==='alternatives')body={...conditioner,action:'alternatives'};
  else if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(BLOCKED.test([body.query,body.searchQuery,body.name,body.object,body.category,body.retailCategory].filter(Boolean).join(' ')))return res.status(403).json({error:'Unsupported product type'});
  try{
    if(body.action==='alternatives'){const result=await searchSimilar(body);if(!result.ok&&result.error)return res.status(400).json(result);return res.status(200).json(result)}
    let result=await resolveProduct(body);if(!result.ok&&result.error)return res.status(400).json(result);
    result=await augmentRetailerCoverage(result,body);result=sanitizeExact(result,body);
    result=await universalGroundedRecovery(body,result);result=sanitizeExact(result,body);
    return res.status(200).json(result);
  }catch(error){console.error('FindIt product resolver error',error);return res.status(500).json({ok:false,error:'Product lookup failed',message:error?.message||'Unknown error'})}
}
