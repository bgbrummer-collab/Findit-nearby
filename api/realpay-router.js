const CURRENCY='ZAR';
const AMOUNT=99;

function safeEmail(v){
  const email=String(v||'').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?email:null;
}

function configured(){
  return Boolean(process.env.REALPAY_API_BASE_URL&&process.env.REALPAY_API_KEY&&process.env.REALPAY_MERCHANT_ID);
}

function notReady(res){
  return res.status(503).json({
    provider:'RealPay',
    configured:false,
    error:'RealPay merchant onboarding/API credentials are still required before FindIt can start a checkout.',
    next:'Add the RealPay sandbox API base URL, API key and merchant ID supplied during onboarding.',
    amount:AMOUNT,
    currency:CURRENCY,
    billing:'monthly'
  });
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const action=String(req.query?.action||'status').toLowerCase();

  if(action==='status'){
    return res.json({provider:'RealPay',configured:configured(),amount:AMOUNT,currency:CURRENCY,billing:'monthly'});
  }

  if(!configured())return notReady(res);

  // RealPay provides merchant-specific sandbox credentials and integration details
  // during onboarding. We intentionally do not guess undocumented endpoint paths or
  // payload fields. Once the supplied API documentation is available, this router
  // becomes the single FindIt payment integration point for checkout, verification,
  // subscription status and cancellation. This file also sits in the production-audit
  // trigger set so payment-flow changes re-run the complete Free/Premium QA harness.
  if(action==='init'){
    if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
    const email=safeEmail(req.body?.email);if(!email)return res.status(400).json({error:'A valid email is required.'});
    return res.status(501).json({provider:'RealPay',error:'RealPay API mapping is awaiting the merchant sandbox documentation issued during onboarding.'});
  }
  if(action==='verify'||action==='manage'){
    return res.status(501).json({provider:'RealPay',error:'RealPay API mapping is awaiting the merchant sandbox documentation issued during onboarding.'});
  }
  return res.status(404).json({error:'Unknown RealPay action'});
}
