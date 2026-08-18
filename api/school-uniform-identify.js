const MODELS=['gemini-3.6-flash','gemini-3.5-flash-lite'];
export default {async fetch(request){
 if(request.method!=='POST')return out({error:'POST only'},405);
 try{
  const key=process.env.GEMINI_API_KEY;if(!key)return out({error:'AI unavailable'},500);
  const form=await request.formData(),image=form.get('image');if(!image||typeof image.arrayBuffer!=='function')return out({error:'No image'},400);
  const b64=Buffer.from(await image.arrayBuffer()).toString('base64'),mime=image.type||'image/jpeg';
  const prompt=`Inspect this image specifically for a SCHOOL UNIFORM item such as a blazer, jersey, tie, shirt, dress or sports uniform. Read the crest/badge, embroidered text, initials, motto and other visible school identifiers. Never guess a school from colours alone. If the school is confidently identifiable, return schoolName and make searchQuery the school name plus the exact uniform item (for example "Pretoria Boys High School blazer"). If the badge/text is insufficient, schoolName must be null and schoolConfidence must be low. Also return the physical uniformItem and visibleSchoolEvidence. Return JSON only.`;
  const schema={type:'OBJECT',properties:{isSchoolUniform:{type:'BOOLEAN'},uniformItem:{type:'STRING'},schoolName:{type:'STRING',nullable:true},schoolConfidence:{type:'NUMBER'},visibleSchoolEvidence:{type:'ARRAY',items:{type:'STRING'}},searchQuery:{type:'STRING'},likelyStoreTypes:{type:'ARRAY',items:{type:'STRING'}},note:{type:'STRING'}},required:['isSchoolUniform','uniformItem','schoolConfidence','visibleSchoolEvidence','searchQuery','likelyStoreTypes','note']};
  let last;for(const model of MODELS){try{const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{parts:[{text:prompt},{inlineData:{mimeType:mime,data:b64}}]}],generationConfig:{responseMimeType:'application/json',responseSchema:schema,temperature:.05}})});const raw=await r.json();if(!r.ok)throw Error(raw?.error?.message||'AI failed');const text=raw?.candidates?.[0]?.content?.parts?.find(p=>p.text)?.text;if(!text)throw Error('No result');const d=JSON.parse(text);if(d.schoolConfidence<0.72)d.schoolName=null;return out(d)}catch(e){last=e}}
  throw last||Error('Recognition failed');
 }catch(e){return out({error:'School uniform recognition failed',message:e.message},500)}
}};
function out(x,s=200){return new Response(JSON.stringify(x),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}})}