
async function paystackInitHandler(req,res){
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


async function paystackVerifyHandler(req,res){
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

export default async function handler(req,res){const action=String(req.query?.action||"init");return action==="verify"?paystackVerifyHandler(req,res):paystackInitHandler(req,res)}
