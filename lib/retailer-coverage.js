import {selectedRetailers,hostMatches} from './retailers.js';

const clean=v=>String(v??'').trim();
const norm=v=>clean(v).toLowerCase().replace(/\b(\d+)\s*(ml|mg|g|kg|l|gb|tb)\b/g,'$1$2').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const toks=v=>[...new Set(norm(v).split(' ').filter(x=>x.length>2&&!['the','and','for','with','from','this','that','search'].includes(x)))];
const price=v=>{if(v==null)return null;let s=String(v).replace(/\s/g,'').replace(/[^0-9.,]/g,'');if(!s)return null;if(s.includes(',')&&s.includes('.'))s=s.replace(/,/g,'');else if(s.includes(',')&&!s.includes('.')){const p=s.split(',');s=p.at(-1).length===2?p.slice(0,-1).join('')+'.'+p.at(-1):p.join('')}const n=Number(s);return Number.isFinite(n)&&n>0&&n<10000000?n:null};
const availability=v=>{const s=norm(v);if(/out of stock|sold out|unavailable|not available/.test(s))return'out_of_stock';if(/in stock|delivered in|delivery within|add to cart|add to basket|click collect|click and collect|store pick up|store pickup/.test(s))return'in_stock';if(/pre.?order/.test(s))return'preorder';return null};
const strictTypes=['conditioner','shampoo','serum','mascara','foundation','lipstick','toothpaste','deodorant','perfume','fragrance','detergent','cleaner','router','range extender','microphone','headphones','earbuds','monitor','keyboard','mouse','camera','television','microwave','kettle','toaster','vacuum','drill','hammer','shoe','sneaker'];
const productType=b=>{const x=norm([b.object,b.category,b.retailCategory,b.name].filter(Boolean).join(' '));return strictTypes.find(t=>x.includes(t))||''};
const directProductUrl=(url,domain)=>{try{const u=new URL(url),p=u.pathname.toLowerCase();if(!hostMatches(url,domain))return false;if(/\/(search|catalogsearch|browse|category|categories|brands?|collections?|all)(\/|$)/.test(p))return false;if(/[?&](q|text|search|qsearch)=/i.test(u.search))return false;if(domain==='clicks.co.za')return /\/p\/\d+\/?$/.test(p);return p.split('/').filter(Boolean).length>=2}catch{return false}};
const parseJson=text=>{const s=String(text||'').replace(/^```json\s*/i,'').replace(/```\s*$/,'').trim();try{return JSON.parse(s)}catch{const a=s.indexOf('{'),z=s.lastIndexOf('}');if(a>=0&&z>a){try{return JSON.parse(s.slice(a,z+1))}catch{}}return null}};
const searchUrl=(p,q)=>{try{return p.search(q)}catch{return`https://www.google.com/search?q=${encodeURIComponent(`site:${p.domain} ${q}`)}`}};
async function read(url){try{const r=await fetch(`https://r.jina.ai/${url}`,{headers:{Accept:'text/plain','User-Agent':'FindItNearby/1.0'},signal:AbortSignal.timeout(10000)});if(!r.ok)return'';return(await r.text()).slice(0,500000)}catch{return''}}
function matchScore(text,body){const n=norm(text),q=toks(body.searchQuery||body.query||body.name||body.model||body.object),brand=norm(body.brand),type=productType(body);if(!n||!q.length)return 0;if(brand&&!n.includes(brand))return 0;if(type&&!n.includes(type))return 0;const hits=q.filter(t=>n.includes(t)).length;return hits/q.length}
function pageOffer(text,url,body,p,source='Discovered retailer product page'){
  if(!text||!directProductUrl(url,p.domain))return null;const title=clean(text.match(/^Title:\s*(.+)$/mi)?.[1]||'');const ctx=`${title} ${text.slice(0,130000)}`,s=matchScore(ctx,body);if(s<.62)return null;
  const pm=ctx.match(/(?:R|ZAR)\s*([0-9][0-9\s,.]{1,12})/i),pv=price(pm?.[1]),av=availability(ctx);if(pv==null&&av==null)return null;
  return{product_name:title||clean(body.searchQuery||body.query||body.name),price:pv,currency:'ZAR',availability:av,product_url:url,verified:true,source,retailer:{name:p.name,country:'ZA',source:'retailer_site'},matchScore:Math.min(.99,.76+s*.22),branchStockVerified:false,branchPriceVerified:false,stockScope:'online',priceScope:'online',directionsAvailable:false,listingType:'retailer_verified',onlineListing:true,checkedAt:new Date().toISOString()};
}
async function duckOffer(body,p){
  const q=clean(body.searchQuery||body.query||body.name||body.model||body.object);if(!q)return null;
  try{
    const u=`https://html.duckduckgo.com/html/?q=${encodeURIComponent(`site:${p.domain} "${q}"`)}`;
    const r=await fetch(u,{headers:{'user-agent':'Mozilla/5.0 (compatible; FindItNearby/1.0)','accept-language':'en-ZA,en;q=0.9'},signal:AbortSignal.timeout(9000)});if(!r.ok)return null;const html=await r.text(),urls=[];
    for(const m of html.matchAll(/href=["']([^"']+)["']/gi)){let x=m[1].replace(/&amp;/g,'&');try{const d=new URL(x,'https://duckduckgo.com');const uddg=d.searchParams.get('uddg');if(uddg)x=decodeURIComponent(uddg)}catch{}if(directProductUrl(x,p.domain)&&!urls.includes(x))urls.push(x);if(urls.length>=4)break}
    for(const x of urls){const t=await read(x),o=pageOffer(t,x,body,p);if(o)return o}
  }catch{}
  return null;
}
async function catalogOffer(body,p){
  const q=clean(body.searchQuery||body.query||body.name||body.model||body.object),url=searchUrl(p,q),text=await read(url);if(!text)return null;
  const lines=text.split(/\r?\n/).map(x=>clean(x)).filter(Boolean);let best=null;
  for(let i=0;i<lines.length;i++){
    const title=lines[i].replace(/^[-*#\s]+/,'').trim();if(title.length<8||title.length>220)continue;
    const ctx=lines.slice(Math.max(0,i-2),Math.min(lines.length,i+8)).join(' '),s=matchScore(`${title} ${ctx}`,body);if(s<.62)continue;
    const pm=ctx.match(/(?:R|ZAR)\s*([0-9][0-9\s,.]{1,12})/i),pv=price(pm?.[1]),av=availability(ctx);if(pv==null&&av==null)continue;
    const urls=[...ctx.matchAll(/https?:\/\/[^\s)\]>"']+/g)].map(m=>m[0].replace(/[.,;:]+$/,''));const direct=urls.find(x=>directProductUrl(x,p.domain));
    const cand={product_name:title,price:pv,currency:'ZAR',availability:av,product_url:direct||url,verified:true,source:direct?'Rendered retailer product result':'Rendered retailer catalog result',retailer:{name:p.name,country:'ZA',source:'retailer_site'},matchScore:Math.min(.96,.72+s*.24),branchStockVerified:false,branchPriceVerified:false,stockScope:'online',priceScope:'online',directionsAvailable:false,listingType:direct?'retailer_verified':'retailer_catalog_verified',onlineListing:true,checkedAt:new Date().toISOString()};
    if(!best||cand.matchScore>best.matchScore||(cand.matchScore===best.matchScore&&(cand.price??1e15)<(best.price??1e15)))best=cand;
  }
  return best;
}
async function askOne(body,p){
  const key=process.env.GEMINI_API_KEY;if(!key)return null;
  const q=clean(body.searchQuery||body.query||body.name||body.model||body.object),type=productType(body),brand=norm(body.brand);
  const prompt=`Use Google Search to check ${p.name} (${p.domain}) in South Africa for this exact product: ${q}. Return ONLY a direct page for the exact same product, not a search/category page and not a substitute. Give the currently published ONLINE price and ONLINE availability if visible. Do not claim physical branch stock. JSON only: {"retailer":"${p.name}","title":"","url":"","price":null,"currency":"ZAR","availability":"in stock|out of stock|unknown","confidence":0}.`;
  try{
    const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],tools:[{google_search:{}}],generationConfig:{temperature:0}}),signal:AbortSignal.timeout(12000)});
    const d=await r.json().catch(()=>({}));if(!r.ok)return null;const x=parseJson((d?.candidates?.[0]?.content?.parts||[]).map(z=>z.text||'').join(''));if(!x)return null;
    const title=clean(x.title),tn=norm(title);if(Number(x.confidence||0)<.72||!directProductUrl(x.url,p.domain))return null;if(brand&&!tn.includes(brand))return null;if(type&&!tn.includes(type))return null;
    const pv=price(x.price),av=availability(x.availability);if(pv==null&&av==null)return null;
    return{product_name:title,price:pv,currency:x.currency||'ZAR',availability:av,product_url:x.url,verified:true,source:'Google-grounded retailer coverage',retailer:{name:p.name,country:'ZA',source:'retailer_site'},matchScore:Number(x.confidence||0),branchStockVerified:false,branchPriceVerified:false,stockScope:'online',priceScope:'online',directionsAvailable:false,listingType:'retailer_verified',onlineListing:true,checkedAt:new Date().toISOString()};
  }catch{return null}
}

export async function augmentRetailerCoverage(result,body={}){
  if(!result?.ok)return result;
  const q=clean(body.searchQuery||body.query||body.name||body.object),all=selectedRetailers(q,body).slice(0,8),existingNames=new Set((result.offers||[]).map(o=>norm(o.retailer?.name||o.retailer)).filter(Boolean));
  const missing=all.filter(p=>!existingNames.has(norm(p.name))).slice(0,5);if(!missing.length)return result;
  const first=await Promise.allSettled(missing.map(async p=>(await duckOffer(body,p))||(await catalogOffer(body,p)))),found=first.filter(x=>x.status==='fulfilled'&&x.value).map(x=>x.value),foundNames=new Set(found.map(o=>norm(o.retailer?.name))),still=missing.filter(p=>!foundNames.has(norm(p.name))).slice(0,3);
  const aiSettled=await Promise.allSettled(still.map(p=>askOne(body,p))),ai=aiSettled.filter(x=>x.status==='fulfilled'&&x.value).map(x=>x.value),extra=[...found,...ai];if(!extra.length)return result;
  const rows=[...(result.offers||[]),...extra],seen=new Set(),offers=[];for(const o of rows){const k=norm(`${o.retailer?.name||o.retailer}|${o.product_url}`);if(!k||seen.has(k))continue;seen.add(k);offers.push(o)}
  offers.sort((a,b)=>Number(b.verified)-Number(a.verified)||Number(b.matchScore||0)-Number(a.matchScore||0)||((a.price??1e15)-(b.price??1e15)));
  result.offers=offers.slice(0,12);result.matched=offers.length>0;result.verifiedOfferCount=offers.length;result.verifiedSellerCount=new Set(offers.map(o=>o.retailer?.name).filter(Boolean)).size;result.bestProduct=offers[0]?{name:offers[0].product_name}:null;const priced=offers.filter(o=>o.price!=null).sort((a,b)=>a.price-b.price);result.bestPrice=priced[0]||null;
  if(Array.isArray(result.retailerStatus))for(const s of result.retailerStatus){const f=extra.find(o=>norm(o.retailer?.name)===norm(s.name));if(f){s.exactListingFound=true;s.verifiedOfferFound=true;s.error='';s.coverageFallback=f.source}}
  return result;
}
