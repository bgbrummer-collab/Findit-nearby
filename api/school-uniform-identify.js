const MODELS=['gemini-3.6-flash','gemini-3.5-flash-lite'];
export default {async fetch(request){
 if(request.method!=='POST')return out({error:'POST only'},405);
 try{
  const key=process.env.GEMINI_API_KEY;if(!key)return out({error:'AI unavailable'},500);
  const form=await request.formData(),image=form.get('image');
  if(!image||typeof image.arrayBuffer!=='function')return out({error:'No image'},400);
  if(!String(image.type||'').startsWith('image/'))return out({error:'Image required'},400);
  if(Number(image.size||0)>8*1024*1024)return out({error:'Image too large'},413);
  const b64=Buffer.from(await image.arrayBuffer()).toString('base64'),mime=image.type||'image/jpeg';
  const prompt=`You are FindIt Nearby's specialist SCHOOL UNIFORM verifier. Inspect the image from scratch.

Goal: identify the physical school-uniform item and, only when visually justified, the exact school.

Rules:
1. First decide whether the physical item is genuinely a school uniform item (blazer, jersey, tie, shirt, dress, skirt, trousers, tracksuit, sports top, cap, badge or similar). Do not call ordinary formal clothing a school uniform unless there is school evidence.
2. Read the crest/badge, embroidered text, initials, motto, school name, distinctive monogram and any readable labels. Colours alone are NEVER enough to identify a school.
3. schoolName may be non-null only when there is direct readable or uniquely identifying evidence in the image. Never infer a school from city, colour scheme or generic crest shape.
4. schoolConfidence is confidence in the SCHOOL identity, not confidence that the item is a blazer.
5. visibleSchoolEvidence must contain only evidence actually visible in the image. Do not invent text.
6. uniformItem must be specific but truthful: e.g. "navy school blazer", "school tie", "school rugby jersey". Do not invent gender, size or year group.
7. searchQuery must be optimized for finding the exact purchasable uniform item. If schoolName is verified, use "<school name> <uniform item> official uniform supplier". If schoolName is unknown, use the physical item plus any readable initials/text, but never add a guessed school.
8. likelyStoreTypes should prioritize official school shop / approved uniform supplier when schoolName is verified, otherwise school uniform retailer / uniform supplier.
9. If the badge is too blurry, partially hidden or ambiguous, set schoolName=null even if you have a hunch.

Return JSON only.`;
  const schema={type:'OBJECT',properties:{
    isSchoolUniform:{type:'BOOLEAN'},uniformItem:{type:'STRING'},schoolName:{type:'STRING',nullable:true},schoolConfidence:{type:'NUMBER'},
    visibleSchoolEvidence:{type:'ARRAY',items:{type:'STRING'}},searchQuery:{type:'STRING'},likelyStoreTypes:{type:'ARRAY',items:{type:'STRING'}},note:{type:'STRING'}
  },required:['isSchoolUniform','uniformItem','schoolConfidence','visibleSchoolEvidence','searchQuery','likelyStoreTypes','note']};
  let last;
  for(const model of MODELS){
   try{
    const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{parts:[{text:prompt},{inlineData:{mimeType:mime,data:b64}}]}],generationConfig:{responseMimeType:'application/json',responseSchema:schema,temperature:.02}})});
    const raw=await r.json().catch(()=>({}));if(!r.ok)throw Error(raw?.error?.message||'AI failed');
    const text=raw?.candidates?.[0]?.content?.parts?.find(p=>typeof p.text==='string')?.text;if(!text)throw Error('No result');
    const d=JSON.parse(text);
    d.schoolConfidence=Math.max(0,Math.min(1,Number(d.schoolConfidence||0)));
    d.visibleSchoolEvidence=Array.isArray(d.visibleSchoolEvidence)?d.visibleSchoolEvidence.filter(Boolean).map(String).slice(0,8):[];
    d.likelyStoreTypes=Array.isArray(d.likelyStoreTypes)?d.likelyStoreTypes.filter(Boolean).map(String).slice(0,5):[];
    if(!d.isSchoolUniform){d.schoolName=null;d.schoolConfidence=Math.min(d.schoolConfidence,.35)}
    if(d.schoolConfidence<0.82||d.visibleSchoolEvidence.length===0)d.schoolName=null;
    if(d.schoolName){
      const item=String(d.uniformItem||'school uniform').trim();
      d.searchQuery=`${String(d.schoolName).trim()} ${item} official uniform supplier`;
      d.likelyStoreTypes=[`${String(d.schoolName).trim()} official school shop`,'approved school uniform supplier','school uniform shop'];
    }
    return out(d);
   }catch(e){last=e}
  }
  throw last||Error('Recognition failed');
 }catch(e){return out({error:'School uniform recognition failed',message:e.message},500)}
}};
function out(x,s=200){return new Response(JSON.stringify(x),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}})}