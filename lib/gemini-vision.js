// Optional use of the project's existing Gemini configuration; no key, no call.
export async function geminiVision(image,key,timeoutMs=16000){
 if(!key)return{reason:'GEMINI_KEY_MISSING',provider:'google-gemini'};
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{const bytes=new Uint8Array(await image.arrayBuffer());let binary='';for(let n=0;n<bytes.length;n+=0x8000)binary+=String.fromCharCode(...bytes.subarray(n,n+0x8000));
  const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',{method:'POST',signal:controller.signal,headers:{'content-type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{role:'user',parts:[{text:'Read the retail product in this image. Return only JSON with name, brand, model, object, category, retailCategory, searchQuery, size, color, barcode, visibleText, confidence. Copy only text actually visible in the photo. Identify the item inside its packaging. Leave unknown details empty. Do not infer a hidden model, size or barcode from appearance.'},{inlineData:{mimeType:image.type||'image/jpeg',data:btoa(binary)}}]}],generationConfig:{temperature:0,responseMimeType:'application/json',maxOutputTokens:800,thinkingConfig:{thinkingBudget:0}}})});
  const data=await response.json().catch(()=>({}));if(!response.ok)return{reason:'GEMINI_REQUEST_FAILED',provider:'google-gemini',status:response.status,providerError:String(data.error?.status||'provider request failed')};
  const text=(data.candidates?.[0]?.content?.parts||[]).filter(p=>!p.thought).map(p=>p.text||'').join('');return{text,provider:'google-gemini'};
 }catch(error){return{reason:error?.name==='AbortError'?'GEMINI_TIMEOUT':'GEMINI_REQUEST_FAILED',provider:'google-gemini'};}finally{clearTimeout(timer);}
}

// Reuse this project's already configured public identification service. Its
// internal Gemini passes count as one claim; independent vision is still required.
export async function existingGeminiVision(image,timeoutMs=16000){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const body=new FormData();body.append('image',image,image.name||'product.jpg');
  const response=await fetch('https://findit-nearby.vercel.app/api/search',{method:'POST',body,signal:controller.signal,redirect:'manual'});
  const data=await response.json().catch(()=>null);
  if(!response.ok)return{reason:'GEMINI_SERVICE_FAILED',provider:'google-gemini',status:response.status};
  if(data?.blocked)return{blocked:true,provider:'google-gemini'};
  if(!data?.identification||typeof data.identification!=='object')return{reason:'GEMINI_SERVICE_NO_IDENTITY',provider:'google-gemini'};
  return{text:JSON.stringify(data.identification),provider:'google-gemini'};
 }catch(error){return{reason:error?.name==='AbortError'?'GEMINI_TIMEOUT':'GEMINI_SERVICE_FAILED',provider:'google-gemini',providerError:/redirect/i.test(String(error?.message))?'redirect unsupported':error?.name==='TypeError'?'invalid input':null};}finally{clearTimeout(timer);}
}
