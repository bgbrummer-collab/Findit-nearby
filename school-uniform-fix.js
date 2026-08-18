(()=>{
 const nativeFetch=window.fetch.bind(window);
 window.fetch=async function(input,init){
  const url=typeof input==='string'?input:(input?.url||'');
  if(!url.includes('/api/search')||!init?.body||!(init.body instanceof FormData))return nativeFetch(input,init);
  const original=await nativeFetch(input,init);let base;try{base=await original.clone().json()}catch{return original}
  const id=base?.identification;if(!id)return original;
  const hay=[id.object,id.name,id.category,id.searchQuery,id.summary,...(id.visibleText||[]),...(id.features||[])].filter(Boolean).join(' ');
  if(!/\b(school|uniform|blazer|school blazer|school jersey|school tie)\b/i.test(hay))return original;
  try{
   const form=new FormData();const img=init.body.get('image');if(img)form.append('image',img);const r=await nativeFetch('/api/school-uniform-identify',{method:'POST',body:form});const s=await r.json();if(!r.ok||!s?.isSchoolUniform)return original;
   id.uniformItem=s.uniformItem||id.object||'school uniform';id.schoolName=s.schoolName||null;id.schoolConfidence=Number(s.schoolConfidence||0);id.schoolEvidence=s.visibleSchoolEvidence||[];
   id.retailCategory='school uniforms';id.likelyStoreTypes=s.schoolName?[`${s.schoolName} uniform shop`,'school uniform shop','official school uniform supplier']:['school uniform shop','uniform supplier'];
   if(s.schoolName){id.name=`${s.schoolName} ${s.uniformItem||'school uniform'}`;id.searchQuery=s.searchQuery||`${s.schoolName} ${s.uniformItem||'school uniform'}`;id.summary=`School uniform identified for ${s.schoolName}. FindIt will prioritise official/approved uniform suppliers.`;id.matchLevel='school-identified'}
   else{id.name=s.uniformItem||id.name;id.searchQuery=s.searchQuery||`${s.uniformItem||'school uniform'} uniform shop`;id.summary='School uniform detected, but the school badge/text was not clear enough to identify the school safely.';id.matchLevel='school-unverified'}
   base.message=s.schoolName?`School identified as ${s.schoolName}. Searching for the exact uniform item and relevant uniform suppliers.`:'School uniform detected, but the school could not be verified from the visible badge/text.';
   return new Response(JSON.stringify(base),{status:original.status,statusText:original.statusText,headers:{'content-type':'application/json','cache-control':'no-store'}});
  }catch(e){console.warn('School uniform enhancement unavailable',e);return original}
 };
})();