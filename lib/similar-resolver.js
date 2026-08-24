import {selectedRetailers,hostMatches,familyOf} from './retailers.js';

const clean=v=>String(v??'').trim();
const norm=v=>clean(v).toLowerCase().replace(/&amp;/g,' and ').replace(/\b(\d+)\s*(ml|mg|g|kg|l|gb|tb)\b/g,'$1$2').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const money=v=>{if(v==null)return null;let s=String(v).replace(/\s/g,'').replace(/[^0-9.,]/g,'');if(!s)return null;if(s.includes(',')&&s.includes('.'))s=s.replace(/,/g,'');else if(s.includes(',')&&!s.includes('.')){const p=s.split(',');s=p.at(-1).length===2?p.slice(0,-1).join('')+'.'+p.at(-1):p.join('')}const n=Number(s);return Number.isFinite(n)&&n>0&&n<10000000?n:null};
const stock=v=>{const x=norm(v);if(/out of stock|sold out|currently unavailable/.test(x))return'out_of_stock';if(/preorder|pre order/.test(x))return'preorder';if(/in stock|add to basket|add to cart|available online|available now|delivery|click collect|store pickup|store pick up/.test(x))return'in_stock';return null};
function productUrl(url,domain){try{const u=new URL(url),p=u.pathname.toLowerCase();if(!hostMatches(url,domain))return false;if(/\/(search|catalogsearch|browse|category|categories|brands?|collections?|all)(\/|$)/.test(p))return false;if(/[?&](q|text|search|qsearch)=/i.test(u.search))return false;if(domain==='clicks.co.za')return /\/p\/\d+\/?$/.test(p);if(domain==='nike.com')return /\/t\//.test(p);return p.split('/').filter(Boolean).length>=2}catch{return false}}
function parseJson(text){const s=String(text||'').replace(/^```json\s*/i,'').replace(/```\s*$/,'').trim();try{return JSON.parse(s)}catch{const a=s.indexOf('{'),z=s.lastIndexOf('}');if(a>=0&&z>a){try{return JSON.parse(s.slice(a,z+1))}catch{}}return null}}
async function reader(url){try{const r=await fetch(`https://r.jina.ai/${url}`,{headers:{Accept:'text/plain','User-Agent':'FindItNearby/1.0'},signal:AbortSignal.timeout(11000)});if(!r.ok)return null;return(await r.text()).slice(0,600000)}catch{return null}}
function verifyReader(text,candidate,profile){if(!text)return null;const title=clean(text.match(/^Title:\s*(.+)$/mi)?.[1]||candidate.title),all=norm(`${title} ${text.slice(0,100000)}`),ct=norm(candidate.title);const words=ct.split(' ').filter(x=>x.length>2),hits=words.filter(x=>all.includes(x)).length;if(words.length&&hits<Math.max(2,Math.ceil(words.length*.45)))return null;const p=money(text.match(/(?:R|ZAR)\s*([0-9][0-9\s,.]{1,12})/i)?.[1])??money(candidate.price);const av=stock(text)||stock(candidate.availability);return{title,price:p,currency:candidate.currency||'ZAR',availability:av}}

export async function resolveAlternatives(body={}){
  const original=clean(body.name||body.query||body.searchQuery||body.model||body.object);
  if(!original)return{ok:false,error:'Original product details required',alternatives:[]};
  const features=Array.isArray(body.features)?body.features.map(clean).filter(Boolean).slice(0,10):[];
  const fam=familyOf([body.category,body.retailCategory,body.object,original].join(' '));
  const profiles=selectedRetailers(original,body).filter(p=>p.cats?.includes(fam)||p.cats?.includes('all')).slice(0,7);
  const key=process.env.GEMINI_API_KEY;
  if(!key)return{ok:true,alternatives:[],reason:'AI search unavailable'};
  const allowed=profiles.map(p=>`${p.name} (${p.domain})`).join(', ');
  const prompt=`You are FindIt Nearby's product-alternative resolver. Find up to 4 CURRENT alternatives sold by South African retailers for this original product:\nORIGINAL: ${original}\nCATEGORY: ${clean(body.retailCategory||body.category||body.object)}\nIMPORTANT FEATURES: ${features.join('; ')||'Use the product name/category to infer only obvious functional features.'}\nAllowed retailers: ${allowed}.\nRules: alternatives must be the same functional product type, genuinely similar in purpose/features, but NOT the exact same product. Prefer items currently in stock and reasonably close in size/specification. Use Google Search. Return DIRECT product pages only, never search/category/home pages. Do not invent prices, availability, features, or URLs. Never claim physical branch stock. JSON only: {"alternatives":[{"retailer":"","title":"","url":"","price":null,"currency":"ZAR","availability":"in_stock|out_of_stock|preorder|null","similarity":0,"matchingFeatures":[""],"difference":"","confidence":0}]}. Similarity and confidence are 0 to 1.`;
  let raw=[];
  for(const model of ['gemini-2.5-flash','gemini-3.6-flash','gemini-3.5-flash-lite']){
    try{
      const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],tools:[{googleSearch:{}}],generationConfig:{temperature:0}}),signal:AbortSignal.timeout(14000)});
      const d=await r.json().catch(()=>({}));if(!r.ok)continue;
      const j=parseJson((d?.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join(''));if(j?.alternatives?.length){raw=j.alternatives;break}
    }catch{}
  }
  const originalN=norm(original),out=[],seen=new Set();
  for(const c of raw){
    const profile=profiles.find(p=>norm(p.name)===norm(c.retailer)||hostMatches(c.url,p.domain));
    if(!profile||Number(c.confidence||0)<.72||Number(c.similarity||0)<.62||!productUrl(c.url,profile.domain))continue;
    const titleN=norm(c.title);if(!titleN||titleN===originalN||titleN.includes(originalN)||originalN.includes(titleN))continue;
    const keyUrl=clean(c.url).split('#')[0];if(seen.has(keyUrl))continue;
    const rendered=await reader(keyUrl),verified=verifyReader(rendered,c,profile);
    if(!verified&&money(c.price)==null&&stock(c.availability)==null)continue;
    const info=verified||{title:clean(c.title),price:money(c.price),currency:c.currency||'ZAR',availability:stock(c.availability)};
    seen.add(keyUrl);
    out.push({product_name:info.title,retailer:{name:profile.name,country:'ZA'},product_url:keyUrl,price:info.price,currency:info.currency||'ZAR',availability:info.availability,similarity:Math.round(Math.min(1,Number(c.similarity||0))*100),matchingFeatures:Array.isArray(c.matchingFeatures)?c.matchingFeatures.map(clean).filter(Boolean).slice(0,5):[],difference:clean(c.difference),source:rendered?'Rendered retailer product page':'Google-grounded retailer result',branchStockVerified:false,stockScope:'online',checkedAt:new Date().toISOString()});
    if(out.length>=4)break;
  }
  return{ok:true,original,alternatives:out,checkedAt:new Date().toISOString()};
}
