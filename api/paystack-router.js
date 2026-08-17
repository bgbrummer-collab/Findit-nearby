import crypto from 'node:crypto';

const PRICE_SUBUNITS = 9900;
const CURRENCY = 'ZAR';
const PLAN_NAME = 'FindIt Premium Monthly';
const API = 'https://api.paystack.co';
const TOKEN_VERSION = 1;

function auth(secret){return {Authorization:`Bearer ${secret}`,'Content-Type':'application/json'}}
function b64url(input){return Buffer.from(input).toString('base64url')}
function timingSafeEqual(a,b){const A=Buffer.from(a),B=Buffer.from(b);return A.length===B.length&&crypto.timingSafeEqual(A,B)}
function signPayload(payload,secret){const body=b64url(JSON.stringify(payload));const sig=crypto.createHmac('sha256',secret).update(body).digest('base64url');return `${body}.${sig}`}
function verifyToken(token,secret){
  const [body,sig]=String(token||'').split('.');
  if(!body||!sig)return null;
  const expected=crypto.createHmac('sha256',secret).update(body).digest('base64url');
  if(!timingSafeEqual(sig,expected))return null;
  try{const p=JSON.parse(Buffer.from(body,'base64url').toString('utf8'));if(p.v!==TOKEN_VERSION||!p.customerCode||!p.exp||Date.now()>p.exp)return null;return p}catch{return null}
}
function bearer(req){const h=String(req.headers?.authorization||'');return h.startsWith('Bearer ')?h.slice(7).trim():String(req.query?.token||req.body?.token||'').trim()}

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

async function findSubscription(secret,customerCode,planCode){
  const d=await paystack(secret,`/subscription?customer=${encodeURIComponent(customerCode)}&perPage=50`,{method:'GET'});
  const all=Array.isArray(d.data)?d.data:[];
  return all.find(s=>String(s.plan?.plan_code||'')===String(planCode)&&['active','non-renewing','attention'].includes(String(s.status||'').toLowerCase()))
    || all.find(s=>String(s.plan?.plan_code||'')===String(planCode))
    || null;
}
function entitlementStatus(subscription){
  const status=String(subscription?.status||'').toLowerCase();
  return {status,active:status==='active'||status==='non-renewing'||status==='attention'};
}

async function init(req,res,secret){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const email=String(req.body?.email||'').trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:'A valid email is required.'});
  const plan=await ensureMonthlyPlan(secret);
  const d=await paystack(secret,'/transaction/initialize',{method:'POST',body:JSON.stringify({
    email,plan:plan.plan_code,currency:CURRENCY,callback_url:'https://findit-nearby.vercel.app/?premium_payment=return',
    metadata:{product:'FindIt Premium',billing:'monthly',amount_zar:99,cancel_anytime:true,cancel_action:'https://findit-nearby.vercel.app/?premium_payment=cancelled'}
  })});
  if(!d.data?.authorization_url)return res.status(502).json({error:'Could not start subscription checkout.'});
  return res.json({authorization_url:d.data.authorization_url,reference:d.data.reference,billing:'monthly',amount:99,currency:CURRENCY});
}

async function verify(req,res,secret){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const reference=String(req.query?.reference||'').trim();
  if(!reference)return res.status(400).json({error:'Reference required.'});
  const d=await paystack(secret,`/transaction/verify/${encodeURIComponent(reference)}`,{method:'GET'});
  const tx=d.data||{};
  const paid=tx.status==='success'&&Number(tx.amount)===PRICE_SUBUNITS&&String(tx.currency||'').toUpperCase()===CURRENCY;
  if(!paid)return res.json({paid:false});
  const customerCode=tx.customer?.customer_code;
  const email=tx.customer?.email||null;
  if(!customerCode)return res.status(502).json({error:'Paystack did not return a customer code.'});
  const plan=await ensureMonthlyPlan(secret);
  const subscription=await findSubscription(secret,customerCode,plan.plan_code);
  const ent=entitlementStatus(subscription);
  if(!ent.active)return res.status(409).json({error:'Payment succeeded but the recurring subscription is not active yet. Please refresh shortly.'});
  const token=signPayload({v:TOKEN_VERSION,customerCode,email,iat:Date.now(),exp:Date.now()+1000*60*60*24*365},secret);
  return res.json({paid:true,token,email,reference:tx.reference,status:ent.status||'active',active:true,billing:'monthly',amount:99,currency:CURRENCY});
}

async function status(req,res,secret){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const payload=verifyToken(bearer(req),secret);
  if(!payload)return res.status(401).json({active:false,error:'Premium session is missing or invalid.'});
  const plan=await ensureMonthlyPlan(secret);
  const subscription=await findSubscription(secret,payload.customerCode,plan.plan_code);
  const ent=entitlementStatus(subscription);
  return res.json({active:ent.active,status:ent.status||'not_found',email:payload.email||null,nextPaymentDate:subscription?.next_payment_date||null,amount:99,currency:CURRENCY,billing:'monthly'});
}

async function manage(req,res,secret){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const payload=verifyToken(bearer(req),secret);
  if(!payload)return res.status(401).json({error:'Premium session is missing or invalid.'});
  const plan=await ensureMonthlyPlan(secret);
  const subscription=await findSubscription(secret,payload.customerCode,plan.plan_code);
  if(!subscription?.subscription_code)return res.status(404).json({error:'No FindIt Premium subscription was found.'});
  const d=await paystack(secret,`/subscription/${encodeURIComponent(subscription.subscription_code)}/manage/link`,{method:'GET'});
  if(!d.data?.link)return res.status(502).json({error:'Could not create the subscription management link.'});
  const ent=entitlementStatus(subscription);
  return res.json({ok:true,management_url:d.data.link,status:ent.status,nextPaymentDate:subscription.next_payment_date||null});
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const secret=process.env.PAYSTACK_SECRET_KEY;
  if(!secret)return res.status(503).json({error:'Payments are not configured yet.'});
  try{
    const action=String(req.query?.action||'init');
    if(action==='verify')return await verify(req,res,secret);
    if(action==='status')return await status(req,res,secret);
    if(action==='manage')return await manage(req,res,secret);
    return await init(req,res,secret);
  }catch(e){console.error('Paystack',e);return res.status(500).json({error:e.message||'Payment request failed.'})}
}
