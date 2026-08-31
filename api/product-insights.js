const PRIMARY_MODEL='gemini-3.6-flash';
const FALLBACK_MODEL='gemini-3.5-flash-lite';

function clean(v,n=3000){return String(v||'').slice(0,n)}
function parseJson(text){const raw=String(text||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');try{return JSON.parse(raw)}catch{}const m=raw.match(/\{[\s\S]*\}/);if(m)try{return JSON.parse(m[0])}catch{}return null}
function sourceList(candidate){
 const chunks=candidate?.groundingMetadata?.groundingChunks||[];
 const out=[];
 for(const c of chunks){
  const w=c?.web;if(!w?.uri)continue;
  const item={title:clean(w.title||'Web source',180),url:clean(w.uri,900)};
  if(!out.some(x=>x.url===item.url))out.push(item);
 }
 return out.slice(0,8);
}

export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const key=process.env.GEMINI_API_KEY;if(!key)return res.status(503).json({error:'AI insights unavailable'});
 const body=req.body||{},i=body.identification||body;
 const evidence={name:clean(i.name),brand:clean(i.brand),model:clean(i.model),object:clean(i.object),category:clean(i.category||i.retailCategory),summary:clean(i.summary),description:clean(i.description),visibleText:Array.isArray(i.visibleText)?i.visibleText.slice(0,30).map(x=>clean(x,300)):[],features:Array.isArray(i.features)?i.features.slice(0,30).map(x=>clean(x,300)):[],searchQuery:clean(i.searchQuery)};
 const offers=Array.isArray(body.offers)?body.offers.slice(0,15).map(o=>({retailer:clean(o?.retailer?.name||o?.retailer,120),price:Number.isFinite(Number(o?.price))?Number(o.price):null,verified:o?.verified===true||o?.sourcePageVerified===true,url:clean(o?.product_url||o?.url,500)})):[];
 if(!evidence.name&&!evidence.model&&!evidence.object)return res.status(400).json({error:'Identified product required'});

 const prompt=`You are FindIt's web-research product analyst. BEFORE answering, use Google Search to research the identified product/item on the public internet. The visible image identification is only the starting identity; it is NOT enough by itself for What it does, Pros or Cons.

Return ONLY JSON with keys: whatItDoes, bestFor, standOut, pros, cons, valueVerdict. pros and cons are arrays of 2-5 concise strings.

RESEARCH RULES:
- Search the internet for EVERY identified product/item before writing the answer.
- Prefer the official manufacturer/brand product page, official manual/specification page, and reputable retailers. Use reputable independent reviews when available for real-world strengths/weaknesses.
- Research the exact brand + model/variant when the identification supports one. If the exact model is not supported, research only the truthful broader item/category and clearly avoid pretending exact-model facts are known.
- Cross-check important claims. Do not rely on a single weak page when stronger sources are available.
- Do not invent specifications, ingredients, compatibility, performance, dimensions, warranty, certifications, claims or drawbacks.
- If trustworthy web evidence is sparse, say that clearly and give only conclusions supported by the available research.
- whatItDoes must explain the product's real purpose/function from web research, not merely restate what is visible in the photo.
- pros must be meaningful product-specific strengths supported by researched facts or reputable review consensus.
- cons must be meaningful product-specific drawbacks, limitations, missing features, trade-offs, or well-supported review concerns. Do not manufacture a con just to fill the list.
- For cosmetics, toiletries, hair care, food and household products: verify claims/ingredients from official or reputable product pages when possible and distinguish marketing claims from independently established facts.
- For electronics/appliances/tools: verify specifications from official documentation or reputable product pages before using them.
- For clothing/footwear: prefer official product materials/features and reputable fit/durability review evidence; do not guess personal fit.
- Use verified retailer prices below to comment on value ONLY when there are verified prices. Never call it expensive/cheap without price evidence or a defensible comparison.
- Do NOT use identity verification, stock status, retailer distance, or simply being a known brand as a pro.
- Keep the wording concise enough for a product card.

Identified item:
${JSON.stringify(evidence)}

Verified offer evidence:
${JSON.stringify(offers.filter(o=>o.verified&&o.price!=null))}`;

 let last;
 for(const model of [PRIMARY_MODEL,FALLBACK_MODEL]){
  try{
   const c=new AbortController(),t=setTimeout(()=>c.abort(),22000);
   const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{
    method:'POST',signal:c.signal,headers:{'content-type':'application/json','x-goog-api-key':key},
    body:JSON.stringify({
     contents:[{role:'user',parts:[{text:prompt}]}],
     tools:[{googleSearch:{}}],
     generationConfig:{temperature:.12,maxOutputTokens:1400,responseMimeType:'application/json'}
    })
   });
   clearTimeout(t);
   const d=await r.json().catch(()=>({}));
   if(!r.ok)throw new Error(d?.error?.message||`${model} failed`);
   const candidate=d.candidates?.[0];
   const text=(candidate?.content?.parts||[]).map(p=>p.text||'').join('');
   const out=parseJson(text);
   if(!out||!clean(out.whatItDoes)||!Array.isArray(out.pros)||!Array.isArray(out.cons))throw new Error('Invalid insight response');
   const sources=sourceList(candidate);
   return res.status(200).json({
    ok:true,
    researchMode:'google-search-grounded',
    researched:true,
    whatItDoes:clean(out.whatItDoes,1200),
    bestFor:clean(out.bestFor,700),
    standOut:clean(out.standOut,900),
    pros:out.pros.slice(0,5).map(x=>clean(x,500)).filter(Boolean),
    cons:out.cons.slice(0,5).map(x=>clean(x,500)).filter(Boolean),
    valueVerdict:clean(out.valueVerdict,800),
    sources,
    modelUsed:model
   });
  }catch(e){last=e;console.error('product insights',model,e)}
 }
 return res.status(502).json({error:'Product web research temporarily unavailable',detail:last?.message||''});
}
