const PRIMARY_MODEL='gemini-3.6-flash';
const FALLBACK_MODEL='gemini-3.5-flash-lite';

function clean(v,n=3000){return String(v||'').slice(0,n)}
function parseJson(text){const raw=String(text||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');try{return JSON.parse(raw)}catch{}const m=raw.match(/\{[\s\S]*\}/);if(m)try{return JSON.parse(m[0])}catch{}return null}
function sourceList(candidate){
 const chunks=candidate?.groundingMetadata?.groundingChunks||[];
 const out=[];
 for(const c of chunks){const w=c?.web;if(!w?.uri)continue;const item={title:clean(w.title||'Web source',180),url:clean(w.uri,900)};if(!out.some(x=>x.url===item.url))out.push(item)}
 return out.slice(0,8);
}

export default async function handler(req,res){
 const action=String(req.query?.action||'assistant');
 if(action==='product-insights')return productInsights(req,res);
 return assistant(req,res);
}

async function assistant(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const key=process.env.GEMINI_API_KEY;if(!key)return res.status(503).json({error:'FindIt Assistant is not configured.'});
 const {message,context={},history=[]}=req.body||{};const text=String(message||'').trim();if(!text)return res.status(400).json({error:'Message required'});
 const safeHistory=Array.isArray(history)?history.slice(-10).map(x=>({role:x?.role==='assistant'?'assistant':'user',text:String(x?.text||'').slice(0,2000)})):[];
 const system=`You are FindIt Assistant, a capable general-purpose AI assistant built into FindIt Nearby.
You can answer normal everyday questions, explain concepts, help write and plan, compare options, and help with FindIt products, stores, prices, saved finds, search results and app features.
Use the supplied FindIt context whenever the question concerns the current item or nearby results.
Do not invent live facts such as a retailer price, branch stock, quantity remaining, exact location, product match or availability. Only call these verified when the context explicitly proves them.
If the user asks a general question unrelated to FindIt, answer it normally and helpfully.
Keep answers clear and useful. For simple questions be concise; for harder questions explain enough to be useful.
Never claim you checked a website unless the supplied context contains the result of that check.`;
 const contents=[{role:'user',parts:[{text:`${system}\n\nCurrent FindIt context:\n${JSON.stringify(context).slice(0,16000)}`}]},{role:'model',parts:[{text:'Understood. I will answer broadly while keeping FindIt live-data claims evidence-based.'}]},...safeHistory.map(x=>({role:x.role==='assistant'?'model':'user',parts:[{text:x.text}]})),{role:'user',parts:[{text}]}];
 let lastError;
 for(const model of [PRIMARY_MODEL,FALLBACK_MODEL]){try{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),18000);const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',signal:controller.signal,headers:{'content-type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents,generationConfig:{temperature:.45,maxOutputTokens:1200}})});clearTimeout(timer);const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error?.message||`${model} failed`);const answer=(d.candidates?.[0]?.content?.parts||[]).map(part=>part.text||'').join('').trim();if(!answer)throw new Error(`${model} returned no answer`);return res.status(200).json({ok:true,answer,modelUsed:model})}catch(error){console.error(`FindIt Assistant ${model}`,error);lastError=error}}
 console.error('FindIt Assistant unavailable',lastError);return res.status(502).json({error:'FindIt Assistant is temporarily unavailable. Please try again.'});
}

async function productInsights(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const key=process.env.GEMINI_API_KEY;if(!key)return res.status(503).json({error:'AI insights unavailable'});
 const body=req.body||{},i=body.identification||body;
 const evidence={name:clean(i.name),brand:clean(i.brand),model:clean(i.model),object:clean(i.object),category:clean(i.category||i.retailCategory),summary:clean(i.summary),description:clean(i.description),visibleText:Array.isArray(i.visibleText)?i.visibleText.slice(0,30).map(x=>clean(x,300)):[],features:Array.isArray(i.features)?i.features.slice(0,30).map(x=>clean(x,300)):[],searchQuery:clean(i.searchQuery)};
 const offers=Array.isArray(body.offers)?body.offers.slice(0,15).map(o=>({retailer:clean(o?.retailer?.name||o?.retailer,120),price:Number.isFinite(Number(o?.price))?Number(o.price):null,verified:o?.verified===true||o?.sourcePageVerified===true,url:clean(o?.product_url||o?.url,500)})):[];
 if(!evidence.name&&!evidence.model&&!evidence.object)return res.status(400).json({error:'Identified product required'});
 const prompt=`You are FindIt's product research engine. Your job is NOT to describe the photo. Your job is to research the identified product/item on the public internet and return genuinely useful buyer information.

MANDATORY: USE GOOGLE SEARCH FOR EVERY SINGLE ITEM OR PRODUCT BEFORE WRITING WHAT IT DOES, PROS OR CONS.

Return ONLY JSON with keys: whatItDoes, bestFor, standOut, pros, cons, valueVerdict. pros and cons are arrays of 2-5 concise strings.

ABSOLUTE RULES:
- Never use the visible photo features themselves as Pros or Cons. Examples of BAD pros: desktop stand, volume knob, mute button, black colour, visible cable, logo, packaging. Those are just visible features, not researched strengths.
- Never output filler such as 'results may vary', 'depends on the user', 'no drawback verified', 'information is limited', or 'FindIt cannot verify a con' as a con unless that limitation itself is the researched product issue.
- Never merely repeat the description in What it does.
- Search the exact brand + model/variant when supported by the identification. If the exact model is uncertain, search the strongest truthful product name/category instead and do not invent model-specific facts.
- Prefer official manufacturer pages, official manuals/spec sheets, major reputable retailers, and reputable independent reviews. For subjective strengths/weaknesses, prefer review consensus over a single source.
- Cross-check important claims. Do not invent specs, ingredients, performance, compatibility, durability, warranty, dimensions, certifications, fit, battery life, sound quality, image quality, materials, or complaints.
- If trustworthy web evidence is too weak to support real Pros/Cons, return fewer items rather than filling the list with photo observations or generic statements.

WHAT TO RESEARCH BY PRODUCT TYPE:
- Electronics/audio/computers: real-world performance, sound/image quality, latency, comfort, software, compatibility, build quality, durability, setup, battery, ports/features, known limitations, common complaints, and how it compares with similar alternatives.
- Appliances/tools: performance, power, build quality, ease of use, reliability, maintenance, accessories, safety-relevant limitations, and common complaints.
- Beauty/hair/skincare: intended use, verified ingredients/claims, texture/application, suitability, common positives/negatives from reputable reviews, packaging/value, and meaningful limitations. Distinguish marketing claims from independently supported facts.
- Clothing/footwear: materials, comfort, durability, fit tendencies only when review evidence supports them, intended use, care, and common complaints.
- Food/household: actual use, ingredients/materials, pack/value information where verified, effectiveness claims, and meaningful trade-offs.
- Vehicles/machinery: verified performance/specifications, practicality, reliability themes, comfort/usability, ownership considerations, and common reported drawbacks.
- Any other item: adapt the research to the product category and find the most useful real-world strengths, drawbacks, limitations, use cases, and comparison points.

OUTPUT REQUIREMENTS:
- whatItDoes = concise explanation of the product's real purpose/function based on web research.
- pros = meaningful researched strengths such as sound quality, build quality, ease of use, compatibility, performance, durability, comfort, value, or category-appropriate benefits.
- cons = meaningful researched drawbacks such as common complaints, limitations, weaker performance areas, compatibility problems, durability concerns, missing features, or category-appropriate trade-offs.
- bestFor = who/what use case it suits based on research.
- standOut = what differentiates it from typical alternatives, only when supportable.
- valueVerdict = judge value only when verified price evidence is available; otherwise say price/value cannot yet be judged.
- Do NOT use identity verification, stock status, retailer distance, or merely being a known brand as a pro.
- Keep wording concise enough for a product card.

Identified item:\n${JSON.stringify(evidence)}\n\nVerified offer evidence:\n${JSON.stringify(offers.filter(o=>o.verified&&o.price!=null))}`;
 let last;
 for(const model of [PRIMARY_MODEL,FALLBACK_MODEL]){try{const c=new AbortController(),t=setTimeout(()=>c.abort(),24000);const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',signal:c.signal,headers:{'content-type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],tools:[{googleSearch:{}}],generationConfig:{temperature:.08,maxOutputTokens:1500,responseMimeType:'application/json'}})});clearTimeout(t);const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error?.message||`${model} failed`);const candidate=d.candidates?.[0];const text=(candidate?.content?.parts||[]).map(p=>p.text||'').join('');const out=parseJson(text);if(!out||!clean(out.whatItDoes)||!Array.isArray(out.pros)||!Array.isArray(out.cons))throw new Error('Invalid insight response');const sources=sourceList(candidate);if(!sources.length)throw new Error('No grounded web sources returned');return res.status(200).json({ok:true,researchMode:'google-search-grounded-required',researched:true,whatItDoes:clean(out.whatItDoes,1200),bestFor:clean(out.bestFor,700),standOut:clean(out.standOut,900),pros:out.pros.slice(0,5).map(x=>clean(x,500)).filter(Boolean),cons:out.cons.slice(0,5).map(x=>clean(x,500)).filter(Boolean),valueVerdict:clean(out.valueVerdict,800),sources,modelUsed:model})}catch(e){last=e;console.error('product insights',model,e)}}
 return res.status(502).json({error:'Product web research temporarily unavailable',detail:last?.message||''});
}
