export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;

  if(!supabaseUrl || !serviceKey){
    return res.status(500).json({
      ok:false,
      supabaseUrlConfigured:Boolean(supabaseUrl),
      secretConfigured:Boolean(serviceKey),
      message:"Supabase environment variables are missing."
    });
  }

  try{
    const response=await fetch(
      `${supabaseUrl.replace(/\/$/,"")}/rest/v1/feedback?select=id&limit=1`,
      {
        method:"GET",
        headers:{
          "apikey":serviceKey,
          "Authorization":`Bearer ${serviceKey}`
        }
      }
    );

    const details=await response.text().catch(()=> "");

    return res.status(response.ok?200:502).json({
      ok:response.ok,
      supabaseUrlConfigured:true,
      secretConfigured:true,
      feedbackTableReachable:response.ok,
      message:response.ok
        ? "Central feedback storage is ready."
        : "Supabase is connected, but the feedback table could not be reached.",
      details:response.ok?undefined:details.slice(0,300)
    });
  }catch(error){
    return res.status(502).json({
      ok:false,
      supabaseUrlConfigured:true,
      secretConfigured:true,
      feedbackTableReachable:false,
      message:error.message || "Feedback storage check failed."
    });
  }
}
