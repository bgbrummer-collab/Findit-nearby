async function healthHandler(req,res){
  res.setHeader('Cache-Control','no-store');
  const key=process.env.GEMINI_API_KEY;
  if(!key)return res.status(500).json({ok:false,geminiKeyConfigured:false,message:'GEMINI_API_KEY is missing.'});

  const models=['gemini-3.6-flash','gemini-3.5-flash-lite'];
  let lastMessage='Gemini model check failed.';
  for(const model of models){
    try{
      const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}`,{headers:{'x-goog-api-key':key}});
      const data=await r.json().catch(()=>({}));
      if(r.ok)return res.status(200).json({ok:true,geminiKeyConfigured:true,model,modelReachable:true,message:'Gemini connection is ready.'});
      lastMessage=data?.error?.message||`${model} model check failed.`;
    }catch(error){
      lastMessage=error?.message||lastMessage;
    }
  }
  return res.status(502).json({ok:false,geminiKeyConfigured:true,modelReachable:false,message:lastMessage});
}

async function feedbackHealthHandler(req,res){
  res.setHeader('Cache-Control','no-store');
  const endpoint=String(process.env.FORMSPREE_ENDPOINT||'').trim();
  const supabaseUrl=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SECRET_KEY;

  if(endpoint){
    let valid=false;
    try{
      const u=new URL(endpoint);
      valid=u.protocol==='https:' && (u.hostname==='formspree.io'||u.hostname==='www.formspree.io') && u.pathname.startsWith('/f/');
    }catch{}
    return res.status(valid?200:500).json({ok:valid,provider:'formspree',formspreeConfigured:true,message:valid?'Formspree feedback delivery is configured.':'FORMSPREE_ENDPOINT is present but does not look like a valid Formspree form endpoint.'});
  }

  if(!supabaseUrl||!serviceKey){
    return res.status(500).json({ok:false,provider:null,formspreeConfigured:false,supabaseConfigured:false,message:'No central feedback destination is configured.'});
  }

  try{
    const base=String(supabaseUrl).replace(/\/$/,'');
    const response=await fetch(`${base}/rest/v1/feedback?select=id&limit=1`,{method:'GET',headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`}});
    return res.status(response.ok?200:502).json({ok:response.ok,provider:'supabase',formspreeConfigured:false,supabaseConfigured:true,feedbackTableReachable:response.ok,message:response.ok?'Supabase feedback storage is ready.':'Supabase is configured, but the feedback table could not be reached.'});
  }catch(error){
    return res.status(502).json({ok:false,provider:'supabase',formspreeConfigured:false,supabaseConfigured:true,feedbackTableReachable:false,message:error?.message||'Feedback storage check failed.'});
  }
}

const QA={
 mercedes:{accept:/\b(car|vehicle|suv|automotive|mercedes)\b/i,brand:/mercedes/i,must:['AutoTrader','Cars.co.za','WeBuyCars','Mercedes-Benz South Africa'],not:['Clicks','Dis-Chem','PriceCheck']},
 jbl:{accept:/\b(speaker|audio|bluetooth|electronics?)\b/i,brand:/\bjbl\b/i,must:['Incredible Connection','Game'],not:['AutoTrader','Clicks']},
 albany:{accept:/\b(bread|grocery|food)\b/i,brand:/\balbany\b/i,must:['Checkers','Pick n Pay','Shoprite','Woolworths'],not:['AutoTrader']},
 samba:{accept:/\b(shoe|sneaker|footwear|trainer|samba)\b/i,brand:/adidas/i,model:/samba/i,must:['adidas','Sportscene','Totalsports'],not:['Clicks','AutoTrader']},
 wrench:{accept:/\b(wrench|spanner|tool|hardware)\b/i,must:['Builders','Game','Leroy Merlin'],not:['Clicks','AutoTrader']},
 toaster:{accept:/\b(toaster|appliance)\b/i,must:['Game','HiFi Corp'],not:['AutoTrader','Clicks']},
 salt_pepper:{accept:/\b(salt|pepper|shaker|kitchenware|tableware)\b/i,must:['Game','Woolworths'],not:['AutoTrader','Clicks']},
 conditioner:{accept:/\b(conditioner|hair care|beauty|strictly curls)\b/i,brand:/marc anthony/i,must:['Clicks','Dis-Chem'],not:['AutoTrader']},
 multiplug:{accept:/\b(plug|adaptor|adapter|power strip|electrical|socket)\b/i,must:['Builders','Game','Leroy Merlin'],not:['AutoTrader','Clicks']}
};

async function qaImageHandler(req,res){
  res.setHeader('Cache-Control','no-store');
  const k=String(req.query?.key||'');
  const spec=QA[k];
  if(!spec)return res.status(400).json({ok:false,error:'Unknown QA key'});
  const origin='https://findit-nearby.vercel.app';
  const failures=[];
  try{
    const fr=await fetch(`https://raw.githubusercontent.com/bgbrummer-collab/Findit-nearby/main/.github/qa-fixtures/${k}.b64`,{signal:AbortSignal.timeout(8000)});
    if(!fr.ok)throw Error(`fixture ${fr.status}`);
    const b64=(await fr.text()).trim();
    const fd=new FormData();
    fd.append('image',new Blob([Buffer.from(b64,'base64')],{type:'image/jpeg'}),`${k}.jpg`);
    fd.append('lat','-25.7479');fd.append('lon','28.2293');
    const sr=await fetch(`${origin}/api/search`,{method:'POST',body:fd,signal:AbortSignal.timeout(25000)});
    const sd=await sr.json().catch(()=>({}));
    const id=sd.identification||{};
    const text=[id.object,id.name,id.brand,id.model,id.category,id.retailCategory,id.searchQuery,id.summary,...(id.visibleText||[]),...(id.features||[]),...(id.evidence||[])].filter(Boolean).join(' ');
    if(!(sr.ok&&sd.blocked!==true&&Number(id.confidence||0)>=.55))failures.push('image identification unusable');
    if(!spec.accept.test(text))failures.push('wrong product family');
    if(spec.brand&&!spec.brand.test([id.brand,id.name,(id.visibleText||[]).join(' ')].filter(Boolean).join(' ')))failures.push('visible brand not retained');
    if(spec.model&&!spec.model.test([id.model,id.name,id.searchQuery,(id.visibleText||[]).join(' ')].filter(Boolean).join(' ')))failures.push('visible model/family not retained');

    const pr=await fetch(`${origin}/api/product-intelligence-v2`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...id,query:id.searchQuery||id.name||id.object}),signal:AbortSignal.timeout(25000)});
    const pd=await pr.json().catch(()=>({}));
    const names=(pd.retailerStatus||[]).map(x=>x.name);
    if(!(pr.ok&&pd.ok))failures.push('retailer intelligence failed');
    for(const n of spec.must)if(!names.includes(n))failures.push(`missing retailer: ${n}`);
    for(const n of spec.not)if(names.includes(n))failures.push(`irrelevant retailer: ${n}`);
    if(!(pd.offers||[]).every(o=>o.branchStockVerified!==true&&o.directionsAvailable!==true))failures.push('online offer faked branch stock/directions');

    const nr=await fetch(`${origin}/api/nearby`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({lat:-25.7479,lon:28.2293,radiusKm:10,mode:'likely',identification:id}),signal:AbortSignal.timeout(20000)});
    const nd=await nr.json().catch(()=>({}));
    if(!(nr.ok&&nd.ok&&Array.isArray(nd.stores)))failures.push('nearby category lookup failed');
    if(!(nd.stores||[]).every(x=>x.exactProductMatch===false&&x.stockVerified===false&&x.directionsAvailable===false))failures.push('unverified nearby result got Directions');

    return res.status(200).json({ok:failures.length===0,key:k,failures,identification:{object:id.object||null,name:id.name||null,brand:id.brand||null,model:id.model||null,category:id.category||null,retailCategory:id.retailCategory||null,confidence:Number(id.confidence||0),searchQuery:id.searchQuery||null,verificationNote:id.verificationNote||null},retailers:names,offers:(pd.offers||[]).map(o=>({name:o.product_name,retailer:o.retailer?.name,price:o.price,source:o.source,branchStockVerified:o.branchStockVerified,directionsAvailable:o.directionsAvailable})).slice(0,6),nearby:(nd.stores||[]).slice(0,8).map(x=>({name:x.name,distanceKm:x.distanceKm,type:x.type,directionsAvailable:x.directionsAvailable}))});
  }catch(error){return res.status(200).json({ok:false,key:k,failures:[...failures,error?.message||'QA probe failed']})}
}

export default async function handler(req,res){
  const action=String(req.query?.action||'health');
  if(action==='feedback')return feedbackHealthHandler(req,res);
  if(action==='qa-image')return qaImageHandler(req,res);
  return healthHandler(req,res);
}
