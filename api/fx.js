
export default async function handler(req,res){
  res.setHeader("Cache-Control","public, s-maxage=21600, stale-while-revalidate=86400");
  const base=String(req.query?.base||"ZAR").toUpperCase();
  const symbol=String(req.query?.symbols||"USD").toUpperCase();
  if(!/^[A-Z]{3}$/.test(base)||!/^[A-Z]{3}$/.test(symbol)) return res.status(400).json({error:"Invalid currency"});
  if(base===symbol)return res.json({base,symbol,rate:1});
  try{
    const r=await fetch(`https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}&to=${encodeURIComponent(symbol)}`);
    const d=await r.json();
    const rate=Number(d?.rates?.[symbol]);
    if(!r.ok||!Number.isFinite(rate))throw Error("rate unavailable");
    res.json({base,symbol,rate,date:d.date||null,estimated:true});
  }catch(e){res.status(502).json({error:"Exchange rate unavailable"})}
}
