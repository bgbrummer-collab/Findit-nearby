const PRIMARY_MODEL='gemini-2.5-flash-lite';
const FALLBACK_MODEL='gemini-2.5-flash';
const clean=(v,n=3000)=>String(v||'').slice(0,n);
function parseJson(text){const raw=String(text||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');try{return JSON.parse(raw)}catch{}const m=raw.match(/\{[\s\S]*\}/);if(m)try{return JSON.parse(m[0])}catch{}return null}
function sources(candidate){const out=[];for(const c of candidate?.groundingMetadata?.groundingChunks||[]){const w=c?.web;if(!w?.uri)continue;const x={title:clean(w.title||'Web source',180),url:clean(w.uri,900)};if(!out.some(y=>y.url===x.url))out.push(x)}return out.slice(0,8)}
async function gemini(key,model,body,timeout=24000){const c=new AbortController(),t=setTimeout(()=>c.abort(),timeout);try{const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',signal:c.signal,headers:{'content-type':'application/json','x-goog-api-key':key},body:JSON.stringify(body)});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d?.error?.message||`${model} failed`);return d}finally{clearTimeout(t)}}

export default async function handler(req,res){const action=String(req.query?.action||'assistant');if(action==='product-insights')return productInsights(req,res);return assistant(req,res)}

async function assistant(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const key=process.env.GEMINI_API_KEY;if(!key)return res.status(503).json({error:'FindIt Assistant is not configured.'});
 const {message,context={},history=[]}=req.body||{},text=String(message||'').trim();if(!text)return res.status(400).json({error:'Message required'});
 const safe=Array.isArray(history)?history.slice(-10).map(x=>({role:x?.role==='assistant'?'model':'user',parts:[{text:clean(x?.text,2000)}]})):[];
 const system=`You are FindIt Assistant. Help with normal questions and with FindIt products, nearby stores, prices and app features. Use supplied FindIt context for current-item questions. Never invent retailer prices, branch stock, exact location or exact product matches. Keep simple answers concise.`;
 const contents=[{role:'user',parts:[{text:`${system}\n\nCurrent FindIt context:\n${JSON.stringify(context).slice(0,16000)}`}]},{role:'model',parts:[{text:'Understood.'}]},...safe,{role:'user',parts:[{text}]}];
 let last;for(const model of [PRIMARY_MODEL,FALLBACK_MODEL]){try{const d=await gemini(key,model,{contents,generationConfig:{temperature:.45,maxOutputTokens:1200}},18000);const answer=(d.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('').trim();if(!answer)throw Error('No answer');return res.status(200).json({ok:true,answer,modelUsed:model})}catch(e){last=e;console.error('assistant',model,e)}}return res.status(502).json({error:'FindIt Assistant is temporarily unavailable.',detail:last?.message||''})
}

async function productInsights(req,res){
 const selftest=req.method==='GET'&&String(req.query?.selftest||'')==='1';
 if(req.method!=='POST'&&!selftest)return res.status(405).json({error:'Method not allowed'});
 const key=process.env.GEMINI_API_KEY;if(!key)return res.status(503).json({error:'AI insights unavailable'});
 const body=selftest?{identification:{name:'Apple AirPods Pro (2nd generation)',brand:'Apple',model:'AirPods Pro (2nd generation)',object:'wireless earbuds',category:'audio',searchQuery:'Apple AirPods Pro 2nd generation'},offers:[]}:(req.body||{}),i=body.identification||body;
 const evidence={name:clean(i.name),brand:clean(i.brand),model:clean(i.model),object:clean(i.object),category:clean(i.category||i.retailCategory),summary:clean(i.summary),description:clean(i.description),visibleText:Array.isArray(i.visibleText)?i.visibleText.slice(0,30).map(x=>clean(x,300)):[],features:Array.isArray(i.features)?i.features.slice(0,30).map(x=>clean(x,300)):[],searchQuery:clean(i.searchQuery)};
 const offers=Array.isArray(body.offers)?body.offers.slice(0,15).map(o=>({retailer:clean(o?.retailer?.name||o?.retailer,120),price:Number.isFinite(Number(o?.price))?Number(o.price):null,verified:o?.verified===true||o?.sourcePageVerified===true,url:clean(o?.product_url||o?.url,500)})):[];
 if(!evidence.name&&!evidence.model&&!evidence.object)return res.status(400).json({error:'Identified product required'});
 const prompt=`You are FindIt's product research engine. Research the identified product/item on the public internet BEFORE writing anything. The photo is identity evidence only; do not use visible photo features as buyer Pros/Cons.

Return ONLY JSON with keys: whatItDoes, bestFor, standOut, pros, cons, valueVerdict. pros and cons are arrays of 2-5 concise strings.

MANDATORY RULES:
- Use Google Search for EVERY item/product.
- Prefer official manufacturer pages/manuals/spec sheets and reputable retailers; use reputable independent reviews for real-world strengths, drawbacks and common complaints.
- Cross-check important claims. Never invent specs, ingredients, compatibility, performance, durability, warranty, dimensions, certifications, fit, battery life, sound/image quality or complaints.
- Never use visible-only features such as a stand, knob, button, cable, colour, logo or packaging as a pro or con.
- Never use filler such as “results may vary”, “no drawback verified”, “information is limited”, or “FindIt cannot verify a con”. Return fewer bullets if necessary.
- What it does must explain real purpose/function from web research, not repeat the image description.
- Pros must be meaningful researched strengths: category-appropriate performance, quality, build, ease of use, compatibility, durability, comfort, value, etc.
- Cons must be meaningful researched drawbacks: common complaints, limitations, weaker performance, compatibility issues, durability concerns, missing features, ownership trade-offs, etc.
- Electronics/audio/computers: research performance, sound/image quality, latency, comfort, software, compatibility, build, setup, battery/features, limitations, complaints and alternatives.
- Appliances/tools: research performance, build, ease of use, reliability, maintenance, accessories and limitations.
- Beauty/hair/skincare: research intended use, verified ingredients/claims, application, reputable review positives/negatives, packaging/value and meaningful limitations; distinguish marketing claims.
- Clothing/footwear: research materials, comfort, durability, evidence-backed fit tendencies, intended use and common complaints.
- Food/household: research actual use, ingredients/materials, verified pack/value/effectiveness and trade-offs.
- Vehicles/machinery: research verified specifications/performance, practicality, reliability themes, usability/comfort, ownership considerations and reported drawbacks.
- For any other category, adapt the same standard: useful real-world strengths, drawbacks, use cases and comparisons.
- Search exact brand/model only when identification supports it. If model is uncertain, research the strongest truthful broader identity instead of guessing.
- Judge value only when verified price evidence is supplied below.

Identified item:\n${JSON.stringify(evidence)}\n\nVerified price evidence:\n${JSON.stringify(offers.filter(o=>o.verified&&o.price!=null))}`;
 let last;for(const model of [PRIMARY_MODEL,FALLBACK_MODEL]){try{const d=await gemini(key,model,{contents:[{role:'user',parts:[{text:prompt}]}],tools:[{googleSearch:{}}],generationConfig:{temperature:.08,maxOutputTokens:1500,responseMimeType:'application/json'}});const candidate=d.candidates?.[0],text=(candidate?.content?.parts||[]).map(p=>p.text||'').join(''),out=parseJson(text);if(!out||!clean(out.whatItDoes)||!Array.isArray(out.pros)||!Array.isArray(out.cons))throw Error('Invalid insight response');const src=sources(candidate);if(!src.length)throw Error('No grounded web sources returned');return res.status(200).json({ok:true,selftest,researchMode:'google-search-grounded-required',researched:true,whatItDoes:clean(out.whatItDoes,1200),bestFor:clean(out.bestFor,700),standOut:clean(out.standOut,900),pros:out.pros.slice(0,5).map(x=>clean(x,500)).filter(Boolean),cons:out.cons.slice(0,5).map(x=>clean(x,500)).filter(Boolean),valueVerdict:clean(out.valueVerdict,800),sources:src,modelUsed:model})}catch(e){last=e;console.error('product insights',model,e)}}return res.status(502).json({error:'Product web research temporarily unavailable',detail:last?.message||''})
}
