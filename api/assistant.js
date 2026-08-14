
export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  const key=process.env.GEMINI_API_KEY;
  if(!key) return res.status(503).json({error:"FindIt Assistant is not configured."});
  const {message,context={}}=req.body||{}; const text=String(message||"").trim();
  if(!text) return res.status(400).json({error:"Message required"});
  const prompt=`You are FindIt Assistant inside the FindIt Nearby app.
Help the user with identified items, FindIt features, nearby results, search tips, prices, stock labels, Premium tools, saved items and comparisons.
Be concise and practical.
Never invent a store, price, exact branch stock, product match or availability.
Only call a price/stock verified if the supplied context explicitly says it is verified.
If data is unavailable, say so clearly.

Current FindIt context:
${JSON.stringify(context).slice(0,12000)}

User:
${text}`;
  try{
    const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`,{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:.35,maxOutputTokens:500}})
    });
    const d=await r.json(); if(!r.ok) throw Error(d?.error?.message||"Assistant failed");
    const answer=(d.candidates?.[0]?.content?.parts||[]).map(x=>x.text||"").join("").trim();
    res.json({ok:true,answer:answer||"I couldn't answer that just now."});
  }catch(e){console.error("assistant",e);res.status(502).json({error:"FindIt Assistant is temporarily unavailable."})}
}
