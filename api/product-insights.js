const PRIMARY_MODEL='gemini-3.6-flash';
const FALLBACK_MODEL='gemini-3.5-flash-lite';

function clean(v,n=3000){return String(v||'').slice(0,n)}
function parseJson(text){
  const raw=String(text||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
  try{return JSON.parse(raw)}catch{}
  const m=raw.match(/\{[\s\S]*\}/);if(m)try{return JSON.parse(m[0])}catch{}
  return null;
}
export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const key=process.env.GEMINI_API_KEY;if(!key)return res.status(503).json({error:'AI insights unavailable'});
  const i=req.body?.identification||req.body||{};
  const evidence={name:clean(i.name),brand:clean(i.brand),model:clean(i.model),object:clean(i.object),category:clean(i.category||i.retailCategory),summary:clean(i.summary),description:clean(i.description),visibleText:Array.isArray(i.visibleText)?i.visibleText.slice(0,30).map(x=>clean(x,300)):[],features:Array.isArray(i.features)?i.features.slice(0,30).map(x=>clean(x,300)):[],searchQuery:clean(i.searchQuery)};
  if(!evidence.name&&!evidence.model&&!evidence.object)return res.status(400).json({error:'Identified product required'});
  const prompt=`You create accurate product information for FindIt Nearby. Analyze the SPECIFIC identified product below, not merely its category. Return ONLY valid JSON with keys whatItDoes, pros, cons. pros and cons must each be arrays of 2-5 concise strings.\n\nRules:\n- Describe this exact product/model/variant when identity evidence supports it.\n- Give useful product-specific purpose, strengths, and drawbacks/considerations a shopper would care about.\n- Use well-established characteristics only when you are confident they belong to this exact named product/model.\n- Prefer supplied visible text/features as evidence.\n- Never turn identity, retailer price, stock, distance, or verification status into a pro or con.\n- Never invent specifications, ingredients, materials, performance claims, compatibility, certifications, sizes, quantities, or features.\n- If exact identity is uncertain, explicitly limit claims to what the evidence supports rather than guessing.\n- Avoid generic filler such as “results vary by person”, “it is a Nike product”, or “fit depends on size” unless it is genuinely important to this exact product.\n- Cons should be actual trade-offs or limitations of the specific product where supportable. If no specific drawback can be supported, say that no specific drawback is confirmed from available evidence.\n\nIdentification evidence:\n${JSON.stringify(evidence)}`;
  let last;
  for(const model of [PRIMARY_MODEL,FALLBACK_MODEL]){
    try{
      const c=new AbortController(),t=setTimeout(()=>c.abort(),18000);
      const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',signal:c.signal,headers:{'content-type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:.15,maxOutputTokens:900,responseMimeType:'application/json'}})});clearTimeout(t);
      const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error?.message||`${model} failed`);
      const text=(d.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('');const out=parseJson(text);
      if(!out||!clean(out.whatItDoes)||!Array.isArray(out.pros)||!Array.isArray(out.cons))throw new Error('Invalid insight response');
      return res.status(200).json({ok:true,whatItDoes:clean(out.whatItDoes,1200),pros:out.pros.slice(0,5).map(x=>clean(x,500)).filter(Boolean),cons:out.cons.slice(0,5).map(x=>clean(x,500)).filter(Boolean),modelUsed:model});
    }catch(e){last=e;console.error('product insights',model,e)}
  }
  return res.status(502).json({error:'Product insights temporarily unavailable',detail:last?.message||''});
}
