import {selectedRetailers,hostMatches} from './retailers.js';

const clean=v=>String(v??'').trim();
const norm=v=>clean(v).toLowerCase().replace(/\b(\d+)\s*(ml|mg|g|kg|l|gb|tb)\b/g,'$1$2').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const price=v=>{if(v==null)return null;let s=String(v).replace(/\s/g,'').replace(/[^0-9.,]/g,'');if(!s)return null;if(s.includes(',')&&s.includes('.'))s=s.replace(/,/g,'');else if(s.includes(',')&&!s.includes('.')){const p=s.split(',');s=p.at(-1).length===2?p.slice(0,-1).join('')+'.'+p.at(-1):p.join('')}const n=Number(s);return Number.isFinite(n)&&n>0&&n<10000000?n:null};
const availability=v=>{const s=norm(v);if(/out of stock|sold out|unavailable|not available/.test(s))return'out_of_stock';if(/in stock|available|add to cart|add to basket|click collect|click and collect/.test(s))return'in_stock';if(/pre.?order/.test(s))return'preorder';return null};
const strictTypes=['conditioner','shampoo','serum','mascara','foundation','lipstick','toothpaste','deodorant','perfume','fragrance','detergent','cleaner','router','range extender','microphone','headphones','earbuds','monitor','keyboard','mouse','camera','television','microwave','kettle','toaster','vacuum','drill','hammer','shoe','sneaker'];
const productType=b=>{const x=norm([b.object,b.category,b.retailCategory,b.name].filter(Boolean).join(' '));return strictTypes.find(t=>x.includes(t))||''};
const directProductUrl=(url,domain)=>{try{const u=new URL(url),p=u.pathname.toLowerCase();if(!hostMatches(url,domain))return false;if(/\/(search|catalogsearch|browse|category|categories|brands?|collections?|all)(\/|$)/.test(p))return false;if(/[?&](q|text|search|qsearch)=/i.test(u.search))return false;if(domain==='clicks.co.za')return /\/p\/\d+\/?$/.test(p);return p.split('/').filter(Boolean).length>=2}catch{return false}};
const parseJson=text=>{const s=String(text||'').replace(/^```json\s*/i,'').replace(/```\s*$/,'').trim();try{return JSON.parse(s)}catch{const a=s.indexOf('{'),z=s.lastIndexOf('}');if(a>=0&&z>a){try{return JSON.parse(s.slice(a,z+1))}catch{}}return null}};

async function askGoogle(body,profiles){
  const key=process.env.GEMINI_API_KEY;if(!key||!profiles.length)return[];
  const q=clean(body.searchQuery||body.query||body.name||body.model||body.object);
  const type=productType(body),brand=norm(body.brand);
  const allowed=profiles.slice(0,5).map(p=>`${p.name} (${p.domain})`).join(', ');
  const prompt=`Search Google for the exact product: ${q}. Check ONLY these South African retailers: ${allowed}. For every retailer where an exact product page exists, return the direct product-page URL, current published online price, and current online availability. Do not substitute a different product type, size, model or variant. Do not claim physical branch stock. Return JSON only: {"offers":[{"retailer":"","title":"","url":"","price":null,"currency":"ZAR","availability":"in stock|out of stock|unknown","confidence":0}]}.`;
  for(const model of ['gemini-2.5-flash','gemini-2.5-flash-lite']){
    try{
      const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],tools:[{google_search:{}}],generationConfig:{temperature:0}}),signal:AbortSignal.timeout(14000)});
      const d=await r.json().catch(()=>({}));if(!r.ok)continue;
      const j=parseJson((d?.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join(''));if(!j)continue;
      const out=[];
      for(const x of j.offers||[]){
        const p=profiles.find(y=>norm(y.name)===norm(x.retailer)||hostMatches(x.url,y.domain));if(!p)continue;
        const title=clean(x.title),tn=norm(title);if(Number(x.confidence||0)<.74||!directProductUrl(x.url,p.domain))continue;
        if(brand&&!tn.includes(brand))continue;if(type&&!tn.includes(type))continue;
        const pv=price(x.price),av=availability(x.availability);if(pv==null&&av==null)continue;
        out.push({product_name:title,price:pv,currency:x.currency||'ZAR',availability:av,product_url:x.url,verified:true,source:'Google-grounded missing-retailer lookup',retailer:{name:p.name,country:'ZA',source:'retailer_site'},matchScore:Number(x.confidence||0),branchStockVerified:false,branchPriceVerified:false,stockScope:'online',priceScope:'online',directionsAvailable:false,listingType:'retailer_verified',onlineListing:true,checkedAt:new Date().toISOString()});
      }
      if(out.length)return out;
    }catch{}
  }
  return[];
}

export async function augmentRetailerCoverage(result,body={}){
  if(!result?.ok)return result;
  const q=clean(body.searchQuery||body.query||body.name||body.object),all=selectedRetailers(q,body).slice(0,8);
  const existingNames=new Set((result.offers||[]).map(o=>norm(o.retailer?.name||o.retailer)).filter(Boolean));
  const missing=all.filter(p=>!existingNames.has(norm(p.name))).slice(0,5);
  if(!missing.length)return result;
  const extra=await askGoogle(body,missing);if(!extra.length)return result;
  const rows=[...(result.offers||[]),...extra],seen=new Set(),offers=[];
  for(const o of rows){const k=norm(`${o.retailer?.name||o.retailer}|${o.product_url}`);if(!k||seen.has(k))continue;seen.add(k);offers.push(o)}
  offers.sort((a,b)=>Number(b.verified)-Number(a.verified)||Number(b.matchScore||0)-Number(a.matchScore||0)||((a.price??1e15)-(b.price??1e15)));
  result.offers=offers.slice(0,12);result.matched=offers.length>0;result.verifiedOfferCount=offers.length;result.verifiedSellerCount=new Set(offers.map(o=>o.retailer?.name).filter(Boolean)).size;
  result.bestProduct=offers[0]?{name:offers[0].product_name}:null;const priced=offers.filter(o=>o.price!=null).sort((a,b)=>a.price-b.price);result.bestPrice=priced[0]||null;
  if(Array.isArray(result.retailerStatus))for(const s of result.retailerStatus){const found=extra.some(o=>norm(o.retailer?.name)===norm(s.name));if(found){s.exactListingFound=true;s.verifiedOfferFound=true;s.error='';s.coverageFallback='google_grounded'}}
  return result;
}
