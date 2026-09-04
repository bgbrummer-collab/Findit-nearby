from pathlib import Path
p=Path('script.js')
s=p.read_text()
old="state.result=data;renderIdentification(data.identification||{});try{document.dispatchEvent(new CustomEvent('findit:results-rendered'))}catch{}loadProductIntelligence(data.identification||{});"
new="state.result=data;renderIdentification(data.identification||{});try{document.dispatchEvent(new CustomEvent('findit:results-rendered',{detail:{result:data}}))}catch{}loadProductIntelligence(data.identification||{});"
if old in s:s=s.replace(old,new,1)
elif new not in s:raise SystemExit('immediate result marker not found')
p.write_text(s)

p=Path('redesign-v4.js')
s=p.read_text()
old="function syncAll(){const s=$('#status')?.textContent?.trim()||'Waiting for an image.';if($('#fxStatus'))$('#fxStatus').textContent=s;const src=$('#search'),dst=$('#fxSearchNow');if(dst)dst.disabled=state()?.file?false:!!src?.disabled;syncPremium();syncProduct();syncStores()}"
new="function syncAll(resultOverride){const st=state();if(resultOverride&&st)st.result=resultOverride;const s=$('#status')?.textContent?.trim()||'Waiting for an image.';if($('#fxStatus'))$('#fxStatus').textContent=s;const src=$('#search'),dst=$('#fxSearchNow');if(dst)dst.disabled=st?.file?false:!!src?.disabled;syncPremium();syncProduct();syncStores()}"
if old in s:s=s.replace(old,new,1)
elif new not in s:raise SystemExit('dashboard syncAll marker not found')
old2="document.addEventListener('findit:results-rendered',()=>{syncAll();suppressPostIdentifyJourney()});"
new2="document.addEventListener('findit:results-rendered',e=>{syncAll(e.detail?.result);suppressPostIdentifyJourney()});"
if old2 in s:s=s.replace(old2,new2,1)
elif new2 not in s:raise SystemExit('dashboard results listener marker not found')
p.write_text(s)
