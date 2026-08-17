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

export default async function handler(req,res){
  const action=String(req.query?.action||'health');
  if(action==='feedback')return feedbackHealthHandler(req,res);
  return healthHandler(req,res);
}
