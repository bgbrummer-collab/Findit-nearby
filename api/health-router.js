const CLIENT_ENHANCEMENTS=`
;(()=>{
  const cleanWords=v=>String(v||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim().split(/\s+/).filter(Boolean);
  function compactProductQuery(i){
    const out=[],seen=new Set();
    const add=v=>{for(const w of cleanWords(v)){if(!seen.has(w)){seen.add(w);out.push(w)}}};
    add(i?.brand);add(i?.model);add(i?.name||i?.object);add(i?.searchQuery);
    return out.slice(0,16).join(" ")||"product";
  }
  async function addRetailerSearches(i){
    if(!i||Number(i.confidence||0)<.55)return;
    const host=document.getElementById("productIntelligenceResults")||document.getElementById("freeActions");
    if(!host)return;
    let box=document.getElementById("finditRetailerSearches");
    if(!box){box=document.createElement("div");box.id="finditRetailerSearches";box.className="findit-retailer-searches";host.parentNode.insertBefore(box,host.nextSibling)}
    try{
      const r=await fetch("/api/retailer-links",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({brand:i.brand,model:i.model,name:i.name||i.object,object:i.object,query:compactProductQuery(i),category:i.category,retailCategory:i.retailCategory})});
      const d=await r.json();if(!r.ok||!Array.isArray(d.links))throw Error();
      box.innerHTML='<div class="findit-retailer-head"><strong>Search this product at retailers</strong><small>These links search retailer websites. Stock is only confirmed when FindIt has verified data.</small></div><div class="findit-retailer-grid">'+d.links.map(x=>'<a target="_blank" rel="noopener noreferrer" href="'+esc(x.url)+'">'+esc(x.name)+' <span>Search →</span></a>').join("")+'</div>';
    }catch{box.innerHTML=""}
  }
  window.finditCompactProductQuery=compactProductQuery;
  const oldRender=typeof renderIdentification==="function"?renderIdentification:null;
  if(oldRender){renderIdentification=function(i){const out=oldRender(i);setTimeout(()=>addRetailerSearches(i),0);return out}}
  const style=document.createElement("style");style.textContent=`
    .findit-retailer-searches{margin:18px 0;padding:16px;border:1px solid rgba(120,130,255,.24);border-radius:18px;background:rgba(15,23,42,.72)}
    .findit-retailer-head strong,.findit-retailer-head small{display:block}.findit-retailer-head small{margin-top:5px;color:#8d9ab0;font-size:11px;line-height:1.5}
    .findit-retailer-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px}.findit-retailer-grid a{padding:11px 12px;border:1px solid rgba(255,255,255,.09);border-radius:12px;text-decoration:none;background:#111a2d;font-size:11px;font-weight:800}.findit-retailer-grid a span{float:right;color:#9b8fff}
    @media(max-width:700px){.findit-retailer-grid{grid-template-columns:1fr}.premium-fab{right:10px!important;bottom:88px!important;padding:9px 13px!important;font-size:13px!important}.assistant-fab{right:10px!important;bottom:22px!important;padding:9px 13px!important;font-size:13px!important}.mobile-nav{padding-right:145px!important}.results-shell{padding-bottom:110px!important}}
    @media(max-width:430px){.premium-fab,.assistant-fab{max-width:138px!important}.assistant-fab{font-size:12px!important}.mobile-nav{padding-right:140px!important}}
  `;document.head.appendChild(style);
})();
`;

async function healthHandler(req,res){
  res.setHeader("Cache-Control","no-store");
  const key=process.env.GEMINI_API_KEY;
  if(!key)return res.status(500).json({ok:false,geminiKeyConfigured:false,message:"GEMINI_API_KEY is missing."});
  const models=["gemini-3.6-flash","gemini-3.5-flash-lite"];
  let lastMessage="Gemini model check failed.";
  for(const model of models){
    try{
      const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}`,{headers:{"x-goog-api-key":key}});
      const data=await r.json().catch(()=>({}));
      if(r.ok)return res.status(200).json({ok:true,geminiKeyConfigured:true,model,modelReachable:true,message:"Gemini connection is ready."});
      lastMessage=data?.error?.message||`${model} model check failed.`;
    }catch(error){lastMessage=error?.message||lastMessage}
  }
  return res.status(502).json({ok:false,geminiKeyConfigured:true,modelReachable:false,message:lastMessage});
}

async function feedbackHealthHandler(req,res){
  res.setHeader("Cache-Control","no-store");
  const endpoint=String(process.env.FORMSPREE_ENDPOINT||"").trim();
  const supabaseUrl=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SECRET_KEY;
  if(endpoint){
    let valid=false;try{const u=new URL(endpoint);valid=u.protocol==="https:"&&/^(formspree\.io|www\.formspree\.io)$/i.test(u.hostname)&&/^\/f\/[A-Za-z0-9_-]+\/?$/.test(u.pathname)}catch{}
    return res.status(valid?200:500).json({ok:valid,provider:"formspree",formspreeConfigured:true,message:valid?"Formspree feedback delivery is configured.":"FORMSPREE_ENDPOINT is present but does not look like a valid Formspree form endpoint."});
  }
  if(!supabaseUrl||!serviceKey)return res.status(500).json({ok:false,provider:null,formspreeConfigured:false,supabaseConfigured:false,message:"No central feedback destination is configured."});
  try{
    const response=await fetch(`${supabaseUrl.replace(/\/$/,"")}/rest/v1/feedback?select=id&limit=1`,{method:"GET",headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`}});
    return res.status(response.ok?200:502).json({ok:response.ok,provider:"supabase",formspreeConfigured:false,supabaseConfigured:true,feedbackTableReachable:response.ok,message:response.ok?"Supabase feedback storage is ready.":"Supabase is configured, but the feedback table could not be reached."});
  }catch(error){return res.status(502).json({ok:false,provider:"supabase",formspreeConfigured:false,supabaseConfigured:true,feedbackTableReachable:false,message:error?.message||"Feedback storage check failed."})}
}

async function clientHandler(req,res){
  try{
    const origin=`${req.headers['x-forwarded-proto']||'https'}://${req.headers.host}`;
    const r=await fetch(origin+"/api/client-script",{headers:{Accept:"text/plain"}});
    if(!r.ok)throw Error("Base client script failed: "+r.status);
    const core=await r.text();
    res.setHeader("Content-Type","application/javascript; charset=utf-8");
    res.setHeader("Cache-Control","no-store, max-age=0");
    return res.status(200).send(core+CLIENT_ENHANCEMENTS);
  }catch(e){console.error("client enhancements",e);return res.status(500).send("console.error("+JSON.stringify(String(e.message||e))+");")}
}

export default async function handler(req,res){
  const action=String(req.query?.action||"health");
  if(action==="feedback")return feedbackHealthHandler(req,res);
  if(action==="client")return clientHandler(req,res);
  return healthHandler(req,res);
}
