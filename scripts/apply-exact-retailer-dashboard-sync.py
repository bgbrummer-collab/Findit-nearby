from pathlib import Path
p=Path('exact-retailer-fix.js')
s=p.read_text()
old="  const status=(txt,bad=false)=>{const e=$('#status');if(e){e.textContent=txt;e.style.color=bad?'#ff9da7':''}};"
new="  const status=(txt,bad=false)=>{const e=$('#status');if(e){e.textContent=txt;e.style.color=bad?'#ff9da7':''}const fx=$('#fxStatus');if(fx){fx.textContent=txt;fx.style.color=bad?'#ff9da7':''}};"
if old not in s: raise SystemExit('status marker missing')
s=s.replace(old,new,1)
marker="  function ensureSellerRoot(){"
helper="  function syncExactDashboard(i,data){const name=i?.name||i?.model||i?.object||'';const set=(sel,v)=>{const el=$(sel);if(el&&v!==undefined&&v!==null)el.textContent=String(v)};set('#fxProductName',name||'No item selected');set('#fxProductMeta',[i?.brand,i?.model,i?.category||i?.retailCategory].filter(Boolean).join(' · '));set('#fxProductDesc',i?.summary||i?.description||(name?'Identified from your uploaded photo.':'Upload a photo to identify an item.'));const conf=Number(i?.confidence);set('#fxConfidence',Number.isFinite(conf)?`${Math.round(conf*100)}% Match`:'— Match');set('#fxExactBadge',i?.exactIdentityVerified===true?'Exact identity verified':(name?'AI identified':'Waiting for result'));try{document.dispatchEvent(new CustomEvent('findit:results-rendered',{detail:{result:data||S()?.result||null}}))}catch{}}\n"
if helper not in s:
    if marker not in s: raise SystemExit('seller root marker missing')
    s=s.replace(marker,helper+marker,1)
old2="if(id!==runId)return;s.result=data;const raw=data?.identification;const i=(raw&&typeof raw==='object'&&!Array.isArray(raw))?raw:{object:'Item',name:'Item identified',category:'general',retailCategory:'general',searchQuery:'item',confidence:.55,visibleText:[],features:[],summary:'FindIt analysed the uploaded image.'};i.exactIdentityVerified=false;try{renderIdentification(i)}catch(err){console.warn('Identification UI render skipped',err)}$('#results')?.classList.remove('hidden');"
new2="if(id!==runId)return;s.result=data;const raw=data?.identification;const i=(raw&&typeof raw==='object'&&!Array.isArray(raw))?raw:{object:'Item',name:'Item identified',category:'general',retailCategory:'general',searchQuery:'item',confidence:.55,visibleText:[],features:[],summary:'FindIt analysed the uploaded image.'};i.exactIdentityVerified=false;try{renderIdentification(i)}catch(err){console.warn('Identification UI render skipped',err)}syncExactDashboard(i,data);$('#results')?.classList.remove('hidden');"
if old2 not in s: raise SystemExit('successful result marker missing')
s=s.replace(old2,new2,1)
old3="try{document.dispatchEvent(new CustomEvent('findit:results-rendered'))}catch{}"
new3="try{document.dispatchEvent(new CustomEvent('findit:results-rendered',{detail:{result:S()?.result||null}}))}catch{}"
if old3 in s:s=s.replace(old3,new3,1)
p.write_text(s)
