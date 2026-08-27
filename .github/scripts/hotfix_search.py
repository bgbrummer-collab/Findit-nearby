from pathlib import Path
p=Path('api/search.js')
s=p.read_text()
if 'const GEMINI_TIMEOUT_MS=5000;' not in s:
    s=s.replace("const CONFIDENCE_MIN=.55;", "const CONFIDENCE_MIN=.55;\nconst GEMINI_TIMEOUT_MS=5000;\nconst QUOTA_RE=/quota|rate.?limit|resource.?exhausted|too many requests/i;")
old="""async function generateStructured(key,model,prompt,b64,mime){
 const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{parts:[{text:prompt},{inlineData:{mimeType:mime,data:b64}}]}],generationConfig:{responseMimeType:'application/json',responseSchema:ID_SCHEMA,temperature:.1}})});
 const raw=await r.json().catch(()=>({}));if(!r.ok)throw Error(raw?.error?.message||`${model} failed`);const text=raw?.candidates?.[0]?.content?.parts?.find(p=>typeof p.text==='string')?.text;if(!text)throw Error(`${model} returned no identification text`);return JSON.parse(text);
}"""
new="""async function generateStructured(key,model,prompt,b64,mime){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),GEMINI_TIMEOUT_MS);
 try{
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{parts:[{text:prompt},{inlineData:{mimeType:mime,data:b64}}]}],generationConfig:{responseMimeType:'application/json',responseSchema:ID_SCHEMA,temperature:.1}})});
  const raw=await r.json().catch(()=>({}));
  if(!r.ok){const e=Error(raw?.error?.message||`${model} failed`);e.fastFail=r.status===429||QUOTA_RE.test(e.message);throw e}
  const text=raw?.candidates?.[0]?.content?.parts?.find(p=>typeof p.text==='string')?.text;if(!text)throw Error(`${model} returned no identification text`);return JSON.parse(text);
 }catch(e){if(e?.name==='AbortError'){const x=Error(`${model} timed out after ${GEMINI_TIMEOUT_MS}ms`);x.fastFail=false;throw x}throw e}finally{clearTimeout(timer)}
}"""
if old in s:
    s=s.replace(old,new)
s=s.replace("catch(e){last=e}}throw last||Error('Gemini request failed');", "catch(e){last=e;if(e?.fastFail)throw e}}throw last||Error('Gemini request failed');", 1)
s=s.replace("catch(e){last=e}}throw last||Error('Verification failed');", "catch(e){last=e;if(e?.fastFail)throw e}}throw last||Error('Verification failed');", 1)
oldcatch=" }catch(e){console.error('FindIt /api/search error',e);return json({error:'FindIt image search failed.',message:e.message||'Unknown error'},500)}"
newcatch=" }catch(e){console.error('FindIt /api/search error',e);const unavailable=Boolean(e?.fastFail)||QUOTA_RE.test(String(e?.message||''));return json({error:unavailable?'Image identification is temporarily busy. Please try again shortly.':'FindIt image search failed.',message:e.message||'Unknown error',retryable:true},unavailable?503:500)}"
if oldcatch in s:
    s=s.replace(oldcatch,newcatch,1)
p.write_text(s)
