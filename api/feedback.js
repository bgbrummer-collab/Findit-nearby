const MAX_MESSAGE=1200;
const ALLOWED_TOPICS=new Set([
  "general",
  "wrong_item",
  "nearby",
  "missing_product",
  "mobile",
  "desktop",
  "bug",
  "idea"
]);

export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");

  if(req.method!=="POST"){
    return res.status(405).json({error:"Method not allowed"});
  }

  try{
    const body=req.body||{};
    const rating=Number(body.rating);
    const topic=ALLOWED_TOPICS.has(String(body.topic))
      ? String(body.topic)
      : "general";
    const message=String(body.message||"").trim();

    if(!Number.isInteger(rating)||rating<1||rating>5){
      return res.status(400).json({error:"Rating must be from 1 to 5."});
    }

    if(message.length<3||message.length>MAX_MESSAGE){
      return res.status(400).json({
        error:"Feedback message must be between 3 and 1200 characters."
      });
    }

    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SECRET_KEY;

    if(!supabaseUrl||!serviceKey){
      return res.status(200).json({
        ok:true,
        delivered:false,
        message:"Central feedback storage is not configured yet. Supabase environment variables were not found."
      });
    }

    const technical=sanitizeTechnical(body.technical);

    const row={
      rating,
      topic,
      message,
      technical,
      source:"FindIt Nearby",
      created_at:new Date().toISOString()
    };

    const response=await fetch(
      `${supabaseUrl.replace(/\/$/,"")}/rest/v1/feedback`,
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "apikey":serviceKey,
          "Authorization":`Bearer ${serviceKey}`,
          "Prefer":"return=minimal"
        },
        body:JSON.stringify(row)
      }
    );

    if(!response.ok){
      const details=await response.text().catch(()=>"");
      console.error("Supabase feedback insert failed",response.status,details);
      throw new Error("Central feedback storage rejected the submission.");
    }

    return res.status(200).json({
      ok:true,
      delivered:true,
      message:"Feedback saved."
    });

  }catch(error){
    console.error("feedback error",error);
    return res.status(502).json({
      error:"Feedback could not be delivered."
    });
  }
}

function sanitizeTechnical(value){
  if(!value||typeof value!=="object")return null;

  const identification=
    value.lastIdentification&&typeof value.lastIdentification==="object"
      ? {
          object:clean(value.lastIdentification.object,100),
          name:clean(value.lastIdentification.name,150),
          brand:clean(value.lastIdentification.brand,100),
          model:clean(value.lastIdentification.model,120),
          confidence:finiteOrNull(value.lastIdentification.confidence)
        }
      : null;

  return {
    viewport:clean(value.viewport,30),
    language:clean(value.language,30),
    online:Boolean(value.online),
    lastIdentification:identification
  };
}

function clean(value,max){
  if(value==null)return null;
  return String(value).slice(0,max);
}

function finiteOrNull(value){
  const n=Number(value);
  return Number.isFinite(n)?n:null;
}
