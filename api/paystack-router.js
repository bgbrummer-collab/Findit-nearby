const PRICE_SUBUNITS=9900;
const CURRENCY="ZAR";
const PLAN_NAME="FindIt Premium Monthly";
const API="https://api.paystack.co";

function auth(secret){return {Authorization:`Bearer ${secret}`,"Content-Type":"application/json"}}

async function paystack(secret,path,options={}){
  const r=await fetch(API+path,{...options,headers:{...auth(secret),...(options.headers||{})}});
  const d=await r.json().catch(()=>({}));
  if(!r.ok||d.status===false)throw new Error(d.message||`Paystack request failed (${r.status})`);
  return d;
}

async function ensureMonthlyPlan(secret){
  const listed=await paystack(secret,"/plan?perPage=100",{method:"GET"});
  const plans=Array.isArray(listed.data)?listed.data:[];
  const existing=plans.find(p=>
    String(p.name||"")===PLAN_NAME&&
    String(p.interval||"").toLowerCase()==="monthly"&&
    Number(p.amount)===PRICE_SUBUNITS&&
    String(p.currency||CURRENCY).toUpperCase()===CURRENCY
  );
  if(existing?.plan_code)return existing;

  const created=await paystack(secret,"/plan",{
    method:"POST",
    body:JSON.stringify({
      name:PLAN_NAME,
      amount:PRICE_SUBUNITS,
      interval:"monthly",
      currency:CURRENCY,
      description:"FindIt Premium — billed monthly until cancelled",
      send_invoices:true,
      send_sms:false
    })
  });
  if(!created.data?.plan_code)throw new Error("Paystack did not return a plan code.");
  return created.data;
}

async function paystackInitHandler(req,res){
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  const secret=process.env.PAYSTACK_SECRET_KEY;
  if(!secret)return res.status(503).json({error:"Paystack is not configured."});
  const email=String(req.body?.email||"").trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:"A valid email is required."});

  try{
    const plan=await ensureMonthlyPlan(secret);
    const d=await paystack(secret,"/transaction/initialize",{
      method:"POST",
      body:JSON.stringify({
        email,
        plan:plan.plan_code,
        currency:CURRENCY,
        callback_url:"https://findit-nearby.vercel.app/?premium_payment=return",
        metadata:{
          product:"FindIt Premium",
          billing:"monthly",
          amount_zar:99,
          cancel_anytime:true
        }
      })
    });
    if(!d.data?.authorization_url)return res.status(400).json({error:"Could not start subscription checkout."});
    return res.json({
      authorization_url:d.data.authorization_url,
      reference:d.data.reference,
      billing:"monthly",
      amount:99,
      currency:CURRENCY,
      planCode:plan.plan_code
    });
  }catch(e){
    console.error("Paystack subscription init",e);
    return res.status(500).json({error:e.message||"Subscription initialization failed."});
  }
}

async function paystackVerifyHandler(req,res){
  if(req.method!=="GET")return res.status(405).json({error:"Method not allowed"});
  const secret=process.env.PAYSTACK_SECRET_KEY;
  if(!secret)return res.status(503).json({error:"Paystack is not configured."});
  const reference=String(req.query?.reference||"").trim();
  if(!reference)return res.status(400).json({error:"Reference required."});

  try{
    const d=await paystack(secret,`/transaction/verify/${encodeURIComponent(reference)}`,{method:"GET"});
    const tx=d.data||{};
    const paid=tx.status==="success"&&Number(tx.amount)===PRICE_SUBUNITS&&String(tx.currency||"").toUpperCase()===CURRENCY;
    return res.json({
      paid,
      reference:tx.reference,
      email:tx.customer?.email||null,
      customerCode:tx.customer?.customer_code||null,
      billing:"monthly"
    });
  }catch(e){
    console.error("Paystack verify",e);
    return res.status(500).json({error:e.message||"Verification failed."});
  }
}

async function paystackManageHandler(req,res){
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  const secret=process.env.PAYSTACK_SECRET_KEY;
  if(!secret)return res.status(503).json({error:"Paystack is not configured."});
  const email=String(req.body?.email||"").trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:"A valid subscription email is required."});

  try{
    const plan=await ensureMonthlyPlan(secret);
    const customerData=await paystack(secret,`/customer/${encodeURIComponent(email)}`,{method:"GET"});
    const customer=customerData.data;
    if(!customer?.id)return res.status(404).json({error:"No Paystack customer was found for that email."});

    const subscriptionsData=await paystack(secret,`/subscription?customer=${encodeURIComponent(customer.id)}&perPage=50`,{method:"GET"});
    const subscriptions=Array.isArray(subscriptionsData.data)?subscriptionsData.data:[];
    const subscription=subscriptions.find(s=>
      String(s.plan?.plan_code||s.plan?.plan_code||"")===String(plan.plan_code)&&
      !["complete","cancelled"].includes(String(s.status||"").toLowerCase())
    )||subscriptions.find(s=>String(s.plan?.plan_code||"")===String(plan.plan_code));

    if(!subscription?.subscription_code)return res.status(404).json({error:"No FindIt Premium subscription was found for that email."});

    const manage=await paystack(secret,`/subscription/${encodeURIComponent(subscription.subscription_code)}/manage/link`,{method:"GET"});
    if(!manage.data?.link)return res.status(502).json({error:"Could not create the subscription management link."});

    return res.json({
      ok:true,
      management_url:manage.data.link,
      status:subscription.status||null,
      nextPaymentDate:subscription.next_payment_date||null,
      message:"Use this secure Paystack page to manage or cancel renewal."
    });
  }catch(e){
    console.error("Paystack manage",e);
    return res.status(500).json({error:e.message||"Could not open subscription management."});
  }
}

export default async function handler(req,res){
  const action=String(req.query?.action||"init");
  if(action==="verify")return paystackVerifyHandler(req,res);
  if(action==="manage")return paystackManageHandler(req,res);
  return paystackInitHandler(req,res);
}
