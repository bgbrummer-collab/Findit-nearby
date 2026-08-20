(()=>{
 const nativeFetch=window.fetch.bind(window);
 const clean=v=>String(v??'').trim();
 window.fetch=async function(input,init){
  const url=typeof input==='string'?input:(input?.url||'');
  if(!url.includes('/api/search')||!init?.body||!(init.body instanceof FormData))return nativeFetch(input,init);
  const original=await nativeFetch(input,init);let base;try{base=await original.clone().json()}catch{return original}
  const id=base?.identification;if(!id||base?.blocked)return original;
  try{
   const img=init.body.get('image');if(!img)return original;
   const form=new FormData();form.append('image',img);form.append('baseIdentification',JSON.stringify({object:id.object,name:id.name,brand:id.brand,model:id.model,category:id.category,searchQuery:id.searchQuery,visibleText:id.visibleText,features:id.features}));
   const r=await nativeFetch('/api/exact-product-identify',{method:'POST',body:form});const g=await r.json().catch(()=>({}));if(!r.ok||g?.blocked)return original;
   id.exactWebChecked=true;id.exactWebConfidence=Number(g.confidence||0);id.exactWebSources=Array.isArray(g.sources)?g.sources:[];id.exactWebEvidence=Array.isArray(g.evidence)?g.evidence:[];id.exactCandidates=Array.isArray(g.candidates)?g.candidates:[];
   if(g.exactFound){
    id.name=clean(g.productName)||id.name;id.brand=clean(g.brand)||id.brand||null;id.model=clean(g.model)||id.model||null;id.searchQuery=clean(g.searchQuery)||[id.brand,id.model,id.name].filter(Boolean).join(' ');id.matchLevel='web-verified-exact';id.exactIdentityVerified=true;id.summary=`Exact product identity was cross-checked against live web sources: ${id.name}.`;base.message=`Exact product identity verified on the web as ${id.name}. FindIt will now look only for retailer listings that match this product.`;
   }else{
    const detailed=clean(g.searchQuery);if(detailed&&detailed.length>clean(id.searchQuery).length)id.searchQuery=detailed;id.matchLevel=id.modelEvidence?'model-unverified':id.brandEvidence?'brand-level':'descriptive-unverified';id.exactIdentityVerified=false;base.message=id.exactCandidates.length?'FindIt could not prove one exact identity automatically. It found grounded product candidates for you to confirm before retailer results are trusted.':'FindIt identified the physical item, but could not verify an exact product identity from live web evidence. It will not pretend a generic category match is the exact item.';
   }
   return new Response(JSON.stringify(base),{status:original.status,statusText:original.statusText,headers:{'content-type':'application/json','cache-control':'no-store'}});
  }catch(e){console.warn('Exact product grounding unavailable',e);return original}
 };
})();