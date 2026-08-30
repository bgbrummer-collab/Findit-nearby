const PRIMARY_MODEL='gemini-3.6-flash';
const FALLBACK_MODEL='gemini-3.5-flash-lite';

function clean(v,n=3000){return String(v||'').slice(0,n)}
function parseJson(text){const raw=String(text||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');try{return JSON.parse(raw)}catch{}const m=raw.match(/\{[\s\S]*\}/);if(m)try{return JSON.parse(m[0])}catch{}return null}
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const key=process.env.GEMINI_API_KEY;if(!key)return res.status(503).json({error:'AI insights unavailable'});
 const body=req.body||{},i=body.identification||body;
 const evidence={name:clean(i.name),brand:clean(i.brand),model:clean(i.model),object:clean(i.object),category:clean(i.category||i.retailCategory),summary:clean(i.summary),description:clean(i.description),visibleText:Array.isArray(i.visibleText)?i.visibleText.slice(0,30).map(x=>clean(x,300)):[],features:Array.isArray(i.features)?i.features.slice(0,30).map(x=>clean(x,300)):[],searchQuery:clean(i.searchQuery)};
 const offers=Array.isArray(body.offers)?body.offers.slice(0,15).map(o=>({retailer:clean(o?.retailer?.name||o?.retailer,120),price:Number.isFinite(Number(o?.price))?Number(o.price):null,verified:o?.verified===true||o?.sourcePageVerified===true,url:clean(o?.product_url||o?.url,500)})):[];
 if(!evidence.name&&!evidence.model&&!evidence.object)return res.status(400).json({error:'Identified product required'});
 const prompt=`You are FindIt's expert shopping analyst. Give genuinely useful buyer advice about the SPECIFIC identified product, not generic category filler. Return ONLY JSON with keys: whatItDoes, bestFor, standOut, pros, cons, valueVerdict. pros and cons are arrays of 2-5 concise strings.

Rules:
- Focus on how the exact product performs in real use: e.g. image quality, comfort, build, speed, battery, gaming/work suitability, durability, ease of use, pack value, ingredients, etc — only where appropriate for THIS product.
- Use well-established characteristics of an exact named model only when you are confident they are correct. Do not invent specs.
- If an exact model is not known, make useful conclusions only from visible/identified evidence and clearly avoid unsupported details.
- Explain what makes this product better or worse than typical alternatives when supportable.
- Use verified retailer prices below to comment on value ONLY when there are verified prices. Never call it expensive/cheap without price evidence or a defensible comparison.
- If multiple verified prices exist, you may say a better price/value is available at another listed retailer and name it.
- Do NOT use identity verification, stock status, retailer distance, or 'it is a Nike/Acer product' as a pro.
- Avoid weak filler like 'fit depends on size' unless it is a meaningful product-specific limitation.
- For displays/monitors, discuss likely work/gaming/media suitability only from supported model knowledge or evidence; never invent refresh rate, resolution, panel type, HDR, ports or response time.
- valueVerdict should be a short buyer-oriented judgment based on verified price evidence when available; otherwise say price/value cannot yet be judged.

Identification:
${JSON.stringify(evidence)}

Verified offer evidence:
${JSON.stringify(offers.filter(o=>o.verified&&o.price!=null))}`;
 let last;
 for(const model of [PRIMARY_MODEL,FALLBACK_MODEL]){try{const c=new AbortController(),t=setTimeout(()=>c.abort(),18000);const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',signal:c.signal,headers:{'content-type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:.18,maxOutputTokens:1200,responseMimeType:'application/json'}})});clearTimeout(t);const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error?.message||`${model} failed`);const text=(d.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('');const out=parseJson(text);if(!out||!clean(out.whatItDoes)||!Array.isArray(out.pros)||!Array.isArray(out.cons))throw new Error('Invalid insight response');return res.status(200).json({ok:true,whatItDoes:clean(out.whatItDoes,1200),bestFor:clean(out.bestFor,700),standOut:clean(out.standOut,900),pros:out.pros.slice(0,5).map(x=>clean(x,500)).filter(Boolean),cons:out.cons.slice(0,5).map(x=>clean(x,500)).filter(Boolean),valueVerdict:clean(out.valueVerdict,800),modelUsed:model})}catch(e){last=e;console.error('product insights',model,e)}}
 return res.status(502).json({error:'Product insights temporarily unavailable',detail:last?.message||''});
}
