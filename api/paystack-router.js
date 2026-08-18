import crypto from 'node:crypto';

const PRICE_SUBUNITS = 9900;
const CURRENCY = 'ZAR';
const PLAN_NAME = 'FindIt Premium Monthly';
const API = 'https://api.paystack.co';
const LIVE_PAYMENTS = process.env.FINDIT_ENABLE_LIVE_PAYMENTS === 'true';

function auth(secret){
  return {Authorization:`Bearer ${secret}`,'Content-Type':'application/json'};
}

function safeEmail(v){
  const email=String(v||'').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?email:null;
}

function makeBetaReference(email){
  const stamp=Date.now().toString(36);
  const hash=crypto.createHash('sha256').update(`${email}|${stamp}|findit-beta`).digest('hex').slice(0,18);
  return `beta_${stamp}_${hash}`;
}

function isBetaReference(ref){
  return /^beta_[a-z0-9]+_[a-f0-9]{18}$/i.test(String(ref||''));
}

async function paystack(secret,path,options={}){
  const r=await fetch(API+path,{...options,headers:{...auth(secret),...(options.headers||{})}});
  const d=await r.json().catch(()=>({}));
  if(!r.ok||d.status===false)throw new Error(d.message||`Paystack request failed (${r.status})`);
  return d;
}

async function ensureMonthlyPlan(secret){
  const listed=await paystack(secret,'/plan?perPage=100',{method:'GET'});
  const plans=Array.isArray(listed.data)?listed.data:[];
  const existing=plans.find(p=>
    String(p.name||'')===PLAN_NAME&&
    String(p.interval||'').toLowerCase()==='monthly'&&
    Number(p.amount)===PRICE_SUBUNITS&&
    String(p.currency||CURRENCY).toUpperCase()===CURRENCY
  );
  if(existing?.plan_code)return existing;

  const created=await paystack(secret,'/plan',{
    method:'POST',
    body:JSON.stringify({
      name:PLAN_NAME,
      amount:PRICE_SUBUNITS,
      interval:'monthly',
      currency:CURRENCY,
      description:'FindIt Premium — R99/month, billed monthly until cancelled',
      send_invoices:true,
      send_sms:false
    })
  });
  if(!created.data?.plan_code)throw new Error('Paystack did not return a plan code.');
  return created.data;
}

async function init(req,res,secret){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const email=safeEmail(req.body?.email);
  if(!email)return res.status(400).json({error:'A valid email is required.'});

  // During beta, Premium is deliberately free. This prevents accidental charges
  // while the product is still being tested.
  if(!LIVE_PAYMENTS){
    const reference=makeBetaReference(email);
    const callback=`https://findit-nearby.vercel.app/?premium_payment=return&reference=${encodeURIComponent(reference)}`;
    return res.json({
      authorization_url:callback,
      reference,
      beta:true,
      free:true,
      billing:'beta-test',
      amount:0,
      currency:CURRENCY
    });
  }

  if(!secret)return res.status(503).json({error:'Payments are not configured yet.'});
  const plan=await ensureMonthlyPlan(secret);
  const d=await paystack(secret,'/transaction/initialize',{
    method:'POST',
    body:JSON.stringify({
      email,
      amount:PRICE_SUBUNITS,
      plan:plan.plan_code,
      currency:CURRENCY,
      callback_url:'https://findit-nearby.vercel.app/?premium_payment=return',
      metadata:{
        product:'FindIt Premium',
        billing:'monthly',
        amount_zar:99,
        cancel_anytime:true
      }
    })
  });
  if(!d.data?.authorization_url)return res.status(502).json({error:'Could not start subscription checkout.'});
  return res.json({authorization_url:d.data.authorization_url,reference:d.data.reference,billing:'monthly',amount:99,currency:CURRENCY});
}

async function verify(req,res,secret){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const reference=String(req.query?.reference||'').trim();
  if(!reference)return res.status(400).json({error:'Reference required.'});

  if(!LIVE_PAYMENTS&&isBetaReference(reference)){
    return res.json({
      paid:true,
      active:true,
      beta:true,
      free:true,
      reference,
      status:'beta_active',
      billing:'beta-test',
      amount:0,
      currency:CURRENCY
    });
  }

  if(!secret)return res.status(503).json({error:'Payments are not configured yet.'});
  const d=await paystack(secret,`/transaction/verify/${encodeURIComponent(reference)}`,{method:'GET'});
  const tx=d.data||{};
  const paid=tx.status==='success'&&Number(tx.amount)===PRICE_SUBUNITS&&String(tx.currency||'').toUpperCase()===CURRENCY;
  return res.json({
    paid,
    active:paid,
    reference:tx.reference||reference,
    status:paid?'active':'not_paid',
    billing:'monthly',
    amount:99,
    currency:CURRENCY
  });
}

async function status(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  if(!LIVE_PAYMENTS)return res.json({active:true,beta:true,free:true,status:'beta_active',billing:'beta-test',amount:0,currency:CURRENCY});
  return res.status(501).json({active:false,error:'Live subscription status is not enabled in this beta build.'});
}

async function manage(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(!LIVE_PAYMENTS)return res.json({ok:true,beta:true,free:true,message:'Premium is free during beta, so there is no paid subscription to cancel.'});
  return res.status(501).json({error:'Live subscription management is not enabled in this beta build.'});
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const secret=process.env.PAYSTACK_SECRET_KEY;
  try{
    const action=String(req.query?.action||'init');
    if(action==='verify')return await verify(req,res,secret);
    if(action==='status')return await status(req,res);
    if(action==='manage')return await manage(req,res);
    return await init(req,res,secret);
  }catch(e){
    console.error('FindIt Premium',e);
    return res.status(500).json({error:e.message||'Premium request failed.'});
  }
}
