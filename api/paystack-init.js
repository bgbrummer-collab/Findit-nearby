
export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  const secret=process.env.PAYSTACK_SECRET_KEY;
  if(!secret) return res.status(503).json({error:"Paystack is not configured."});
  const email=String(req.body?.email||"").trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({error:"A valid email is required."});
  try{
    const r=await fetch("https://api.paystack.co/transaction/initialize",{method:"POST",headers:{Authorization:`Bearer ${secret}`,"Content-Type":"application/json"},body:JSON.stringify({
      email,amount:9900,currency:"ZAR",
      callback_url:"https://findit-nearby.vercel.app/?premium_payment=return",
      metadata:{product:"FindIt Premium V10",plan:"premium_beta_test",amount_zar:99}
    })});
    const d=await r.json();
    if(!r.ok||!d.status||!d.data?.authorization_url) return res.status(400).json({error:d.message||"Could not start payment."});
    return res.json({authorization_url:d.data.authorization_url,reference:d.data.reference});
  }catch(e){console.error(e);return res.status(500).json({error:"Payment initialization failed."})}
}
