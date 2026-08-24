export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const host=req.headers.host;
  const payload={brand:'Marc Anthony',model:'Strictly Curls 3X Moisture Triple Blend Conditioner 250ml',name:'Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml',query:'Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml',searchQuery:'Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml',object:'conditioner',category:'hair care',retailCategory:'beauty'};
  try{
    const r=await fetch(`https://${host}/api/product-intelligence-v2`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(30000)});
    const data=await r.json().catch(()=>({}));
    return res.status(r.status).json({probe:true,status:r.status,data});
  }catch(e){return res.status(500).json({probe:true,error:e.message})}
}
