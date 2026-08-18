import crypto from 'node:crypto';

const PRICE_SUBUNITS = 9900;
const CURRENCY = 'ZAR';
const PLAN_NAME = 'FindIt Premium Monthly';
const API = 'https://api.paystack.co';
const LIVE_PAYMENTS = process.env.FINDIT_ENABLE_LIVE_PAYMENTS === 'true';

function auth(secret){return {Authorization:`Bearer ${secret}`,'Content-Type':'application/json'}}
function safeEmail(v){const email=String(v||'').trim().toLowerCase();return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?email:null}
function makeBetaReference(email){const stamp=Date.now().toString(36);const hash=crypto.createHash('sha256').update(`${email}|${stamp}|findit-beta`).digest('hex').slice(0,18);return `beta_${stamp}_${hash}`}
function isBetaReference(ref){return /^beta_[a-z0-9]+_[a-f0-9]{18}$/i.test(String(ref||''))}

async function paystack(secret,path,options={}){
  const r=await fetch(API+path,{...options,headers:{...auth(secret),...(options.headers||{})}});
  const d=await r.json().catch(()=>({}));
  if(!r.ok||d.status===false)throw new Error(d.message||`Paystack request failed (${r.status})`);
  return d;
}

async function ensureMonthlyPlan(secret){
  const listed=await paystack(secret,'/plan?perPage=100',{method:'GET'});
  const plans=Array.isArray(listed.data)?listed.data:[];
  const existing=plans.find(p=>String(p.name||'')===PLAN_NAME&&String(p.interval||'').toLowerCase()==='monthly'&&Number(p.amount)===PRICE_SUBUNITS&&String(p.currency||CURRENCY).toUpperCase()===CURRENCY);
  if(existing?.plan_code)return existing;
  const created=await paystack(secret,'/plan',{method:'POST',body:JSON.stringify({name:PLAN_NAME,amount:PRICE_SUBUNITS,interval:'monthly',currency:CURRENCY,description:'FindIt Premium — R99/month, billed monthly until cancelled',send_invoices:true,send_sms:false})});
  if(!created.data?.plan_code)throw new Error('Paystack did not return a plan code.');
  return created.data;
}

async function verifyTransaction(secret,reference){
  const d=await paystack(secret,`/transaction/verify/${encodeURIComponent(reference)}`,{method:'GET'});
  return d.data||{};
}

async function subscriptionForTransaction(secret,tx){
  const customerId=tx?.customer?.id;
  if(!customerId)return null;
  const d=await paystack(secret,`/subscription?customer=${encodeURIComponent(customerId)}&perPage=100`,{method:'GET'});
  const list=Array.isArray(d.data)?d.data:[];
  const usable=list.filter(s=>['active','non-renewing','attention','complete'].includes(String(s.status||'').toLowerCase()));
  usable.sort((a,b)=>new Date(b.createdAt||b.created_at||0)-new Date(a.createdAt||a.created_at||0));
  return usable[0]||list[0]||null;
}

async function subscriptionFromReference(secret,reference){
  if(!reference)throw new Error('Payment reference required.');
  const tx=await verifyTransaction(secret,reference);
  const paid=tx.status==='success'&&Number(tx.amount)===PRICE_SUBUNITS&&String(tx.currency||'').toUpperCase()===CURRENCY;
  if(!paid)return {paid:false,tx,subscription:null};
  const subscription=await subscriptionForTransaction(secret,tx).catch(()=>null);
  return {paid:true,tx,subscription};
}

async function init(req,res,secret){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const email=safeEmail(req.body?.email);if(!email)return res.status(400).json({error:'A valid email is required.'});
  if(!LIVE_PAYMENTS){const reference=makeBetaReference(email);const callback=`https://findit-nearby.vercel.app/?premium_payment=return&reference=${encodeURIComponent(reference)}`;return res.json({authorization_url:callback,reference,beta:true,free:true,billing:'beta-test',amount:0,currency:CURRENCY})}
  if(!secret)return res.status(503).json({error:'Payments are not configured yet.'});
  const plan=await ensureMonthlyPlan(secret);
  const d=await paystack(secret,'/transaction/initialize',{method:'POST',body:JSON.stringify({email,amount:PRICE_SUBUNITS,plan:plan.plan_code,currency:CURRENCY,callback_url:'https://findit-nearby.vercel.app/?premium_payment=return',metadata:{product:'FindIt Premium',billing:'monthly',amount_zar:99,cancel_anytime:true}})});
  if(!d.data?.authorization_url)return res.status(502).json({error:'Could not start subscription checkout.'});
  return res.json({authorization_url:d.data.authorization_url,reference:d.data.reference,billing:'monthly',amount:99,currency:CURRENCY,planCode:plan.plan_code});
}

async function verify(req,res,secret){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const reference=String(req.query?.reference||'').trim();if(!reference)return res.status(400).json({error:'Reference required.'});
  if(!LIVE_PAYMENTS&&isBetaReference(reference))return res.json({paid:true,active:true,beta:true,free:true,reference,status:'beta_active',billing:'beta-test',amount:0,currency:CURRENCY});
  if(!secret)return res.status(503).json({error:'Payments are not configured yet.'});
  const x=await subscriptionFromReference(secret,reference);const s=x.subscription;
  return res.json({paid:x.paid,active:x.paid&&(!s||['active','attention','non-renewing'].includes(String(s.status||'').toLowerCase())),reference:x.tx?.reference||reference,status:x.paid?(s?.status||'paid'):'not_paid',billing:'monthly',amount:99,currency:CURRENCY,subscriptionCode:s?.subscription_code||null,nextPaymentDate:s?.next_payment_date||null});
}

async function status(req,res,secret){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  if(!LIVE_PAYMENTS)return res.json({active:true,beta:true,free:true,status:'beta_active',billing:'beta-test',amount:0,currency:CURRENCY});
  if(!secret)return res.status(503).json({active:false,error:'Payments are not configured yet.'});
  const reference=String(req.query?.reference||'').trim();if(!reference)return res.status(400).json({active:false,error:'Payment reference required.'});
  const x=await subscriptionFromReference(secret,reference);const s=x.subscription,statusText=String(s?.status||'').toLowerCase();
  return res.json({active:x.paid&&(!s||['active','attention','non-renewing'].includes(statusText)),paid:x.paid,status:s?.status||(x.paid?'paid':'not_paid'),billing:'monthly',amount:99,currency:CURRENCY,subscriptionCode:s?.subscription_code||null,nextPaymentDate:s?.next_payment_date||null,cancelled:statusText==='non-renewing'||statusText==='complete'});
}

async function manage(req,res,secret){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(!LIVE_PAYMENTS)return res.json({ok:true,beta:true,free:true,message:'Premium is free during beta, so there is no paid subscription to cancel.'});
  if(!secret)return res.status(503).json({error:'Payments are not configured yet.'});
  const reference=String(req.body?.reference||'').trim();if(!reference)return res.status(400).json({error:'Payment reference required.'});
  const x=await subscriptionFromReference(secret,reference);if(!x.paid)return res.status(402).json({error:'A paid Premium subscription could not be verified.'});
  const s=x.subscription;if(!s?.subscription_code)return res.status(409).json({error:'Subscription is not available yet. Please try again shortly.'});
  const mode=String(req.body?.mode||'link').toLowerCase();
  if(mode==='cancel'){
    const token=s.email_token;if(!token)return res.status(409).json({error:'Cancellation token is not available yet. Use the manage-subscription link instead.'});
    await paystack(secret,'/subscription/disable',{method:'POST',body:JSON.stringify({code:s.subscription_code,token})});
    return res.json({ok:true,cancelled:true,status:'non-renewing',message:'Premium will not renew on the next billing date.'});
  }
  const d=await paystack(secret,`/subscription/${encodeURIComponent(s.subscription_code)}/manage/link`,{method:'GET'});
  const link=d.data?.link;if(!link)return res.status(502).json({error:'Could not create the subscription management link.'});
  return res.json({ok:true,manage_url:link,subscriptionCode:s.subscription_code,status:s.status||null});
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');const secret=process.env.PAYSTACK_SECRET_KEY;
  try{const action=String(req.query?.action||'init');if(action==='verify')return await verify(req,res,secret);if(action==='status')return await status(req,res,secret);if(action==='manage')return await manage(req,res,secret);return await init(req,res,secret)}catch(e){console.error('FindIt Premium',e);return res.status(500).json({error:e.message||'Premium request failed.'})}
}
