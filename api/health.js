export default{
  async fetch(){
    const configured=Boolean(process.env.GEMINI_API_KEY);
    if(!configured)return Response.json({ok:false,geminiKeyConfigured:false,message:"GEMINI_API_KEY is missing."},{status:500});
    try{
      const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash",{headers:{"x-goog-api-key":process.env.GEMINI_API_KEY}});
      const data=await r.json().catch(()=>({}));
      return Response.json({ok:r.ok,geminiKeyConfigured:true,model:"gemini-3.6-flash",modelReachable:r.ok,message:r.ok?"Gemini connection is ready.":(data?.error?.message||"Gemini model check failed.")},{status:r.ok?200:502});
    }catch(e){
      return Response.json({ok:false,geminiKeyConfigured:true,model:"gemini-3.6-flash",modelReachable:false,message:e.message},{status:502});
    }
  }
};