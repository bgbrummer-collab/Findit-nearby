from pathlib import Path

# 1) Keep the restored exact dashboard, but make result syncing use the actual event payload.
p=Path('redesign-v4.js')
s=p.read_text()
old="function syncAll(){const s=$('#status')?.textContent?.trim()||'Waiting for an image.';if($('#fxStatus'))$('#fxStatus').textContent=s;const src=$('#search'),dst=$('#fxSearchNow');if(dst)dst.disabled=state()?.file?false:!!src?.disabled;syncPremium();syncProduct();syncStores()}"
new="function syncAll(resultOverride){const st=state();if(resultOverride&&st)st.result=resultOverride;const s=$('#status')?.textContent?.trim()||'Waiting for an image.';if($('#fxStatus'))$('#fxStatus').textContent=s;const src=$('#search'),dst=$('#fxSearchNow');if(dst)dst.disabled=st?.file?false:!!src?.disabled;syncPremium();syncProduct();syncStores()}"
if old in s:s=s.replace(old,new,1)
elif new not in s:raise SystemExit('redesign syncAll marker missing')
old="document.addEventListener('findit:results-rendered',()=>{syncAll();suppressPostIdentifyJourney()});"
new="document.addEventListener('findit:results-rendered',e=>{syncAll(e.detail?.result);suppressPostIdentifyJourney()});"
if old in s:s=s.replace(old,new,1)
elif new not in s:raise SystemExit('redesign result listener marker missing')
p.write_text(s)

# 2) Keep searches from hanging indefinitely if an upstream AI request is slow.
p=Path('script.js')
s=p.read_text()
marker="searchBtn.onclick=async()=>{"
helper="async function finditSearchRequest(fd){const c=new AbortController(),t=setTimeout(()=>c.abort(),36000);try{return await fetch('/api/search',{method:'POST',body:fd,signal:c.signal})}catch(e){if(e?.name==='AbortError')throw Error('Image identification took too long. Please try again in a moment.');throw e}finally{clearTimeout(t)}}\n\n"
if helper not in s:
    if marker not in s:raise SystemExit('search handler marker missing')
    s=s.replace(marker,helper+marker,1)
old="const r=await fetch('/api/search',{method:'POST',body:fd});"
new="const r=await finditSearchRequest(fd);"
if old in s:s=s.replace(old,new,1)
elif new not in s:raise SystemExit('search fetch marker missing')
p.write_text(s)

# 3) Reduce long-tail wait per Gemini model while preserving the existing fallback chain and safety rules.
p=Path('api/search.js')
s=p.read_text()
old="const GEMINI_TIMEOUT_MS=14000;"
new="const GEMINI_TIMEOUT_MS=10000;"
if old in s:s=s.replace(old,new,1)
elif new not in s:raise SystemExit('Gemini timeout marker missing')
p.write_text(s)
