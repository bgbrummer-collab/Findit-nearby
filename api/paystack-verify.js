
export default async function handler(req,res){
  if(req.method!=="GET") return res.status(405).json({error:"Method not allowed"});
  const secret=process.env.PAYSTACK_SECRET_KEY;
  if(!secret) return res.status(503).json({error:"Paystack is not configured."});
  const reference=String(req.query?.reference||"").trim();
  if(!reference) return res.status(400).json({error:"Reference required."});
  try{
    const r=await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,{headers:{Authorization:`Bearer ${secret}`}});
    const d=await r.json();
    if(!r.ok||!d.status||!d.data) return res.status(400).json({error:"Verification failed."});
    const paid=d.data.status==="success"&&Number(d.data.amount)===9900&&d.data.currency==="ZAR";
    return res.json({paid,reference:d.data.reference,email:d.data.customer?.email||null});
  }catch(e){console.error(e);return res.status(500).json({error:"Verification failed."})}
}
