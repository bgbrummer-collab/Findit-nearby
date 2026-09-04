from pathlib import Path
p=Path('script.js')
s=p.read_text()
old='function esc(v=""){return String(v).replace(/[&<>\'\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\'":"&#39;",\'"\':"&quot;"}[c]))} function safe(v,f="Not detected"){return v==null||v===""?f:String(v)} function clamp(v,a,b){return Math.max(a,Math.min(b,v))} function validUrl(v){try{const u=new URL(v);return /^https?:$/.test(u.protocol)}catch{return false}} function setStatus(t,err=false){status.textContent=t;status.style.color=err?"#ff9da7":""}'
new='function esc(v=""){return String(v).replace(/[&<>\'\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\'":"&#39;",\'"\':"&quot;"}[c]))} function safe(v,f="Not detected"){return v==null||v===""?f:String(v)} function clamp(v,a,b){return Math.max(a,Math.min(b,v))} function validUrl(v){try{const u=new URL(v);return /^https?:$/.test(u.protocol)}catch{return false}} function setStatus(t,err=false){status.textContent=t;status.style.color=err?"#ff9da7":"";const fx=document.getElementById("fxStatus");if(fx){fx.textContent=t;fx.style.color=err?"#ff9da7":""}}'
if old not in s: raise SystemExit('setStatus marker not found')
s=s.replace(old,new,1)
marker='async function finditSearchRequest(fd){'
helper='function syncExactDashboardResult(data){\n  const i=data?.identification||{};\n  const name=i.name||i.model||i.object||"";\n  const nameEl=document.getElementById("fxProductName");if(nameEl&&name)nameEl.textContent=name;\n  const metaEl=document.getElementById("fxProductMeta");if(metaEl)metaEl.textContent=[i.brand,i.model,i.category||i.retailCategory].filter(Boolean).join(" · ");\n  const descEl=document.getElementById("fxProductDesc");if(descEl)descEl.textContent=i.summary||i.description||(name?"Identified from your uploaded photo.":"Upload a photo to identify an item.");\n  const conf=Number(i.confidence);const confEl=document.getElementById("fxConfidence");if(confEl)confEl.textContent=Number.isFinite(conf)?`${Math.round(conf*100)}% Match`:"— Match";\n  const badge=document.getElementById("fxExactBadge");if(badge)badge.textContent=i.exactIdentityVerified===true?"Exact identity verified":(name?"AI identified":"Waiting for result");\n  const rn=document.getElementById("resultName");if(rn&&name)rn.textContent=name;\n  const rd=document.getElementById("resultDescription");if(rd)rd.textContent=i.summary||i.description||"";\n  const cv=document.getElementById("confidenceValue");if(cv&&Number.isFinite(conf))cv.textContent=`${Math.round(conf*100)}%`;\n  try{document.dispatchEvent(new CustomEvent("findit:dashboard-sync",{detail:{result:data}}))}catch{}\n}\n\n'
if helper not in s:
    if marker not in s: raise SystemExit('search request marker not found')
    s=s.replace(marker,helper+marker,1)
old2='state.result=data;renderIdentification(data.identification||{});try{document.dispatchEvent(new CustomEvent(\'findit:results-rendered\',{detail:{result:data}}))}catch{}loadProductIntelligence(data.identification||{});'
new2='state.result=data;renderIdentification(data.identification||{});syncExactDashboardResult(data);try{document.dispatchEvent(new CustomEvent(\'findit:results-rendered\',{detail:{result:data}}))}catch{}loadProductIntelligence(data.identification||{});'
if old2 not in s: raise SystemExit('result assignment marker not found')
s=s.replace(old2,new2,1)
p.write_text(s)
