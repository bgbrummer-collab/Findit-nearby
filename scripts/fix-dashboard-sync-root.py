from pathlib import Path
p=Path('script.js')
s=p.read_text()
old="state.result=data;renderIdentification(data.identification||{});try{document.dispatchEvent(new CustomEvent('findit:results-rendered'))}catch{}loadProductIntelligence(data.identification||{});"
new="state.result=data;renderIdentification(data.identification||{});try{document.dispatchEvent(new CustomEvent('findit:results-rendered',{detail:{result:data}}))}catch{}loadProductIntelligence(data.identification||{});"
if old not in s: raise SystemExit('immediate result marker not found')
s=s.replace(old,new,1)
p.write_text(s)

p=Path('redesign-v4.js')
s=p.read_text()
old="function syncAll(){const s=$('#status')?.textContent?.trim()||'Waiting for an image.';if($('#fxStatus'))$('#fxStatus').textContent=s;const src=$('#search'),dst=$('#fxSearchNow');if(dst)dst.disabled=state()?.file?false:!!src?.disabled;syncPremium();syncProduct();syncStores()}"
new="function syncAll(resultOverride){const st=state();if(resultOverride&&st)st.result=resultOverride;const s=$('#status')?.textContent?.trim()||'Waiting for an image.';if($('#fxStatus'))$('#fxStatus').textContent=s;const src=$('#search'),dst=$('#fxSearchNow');if(dst)dst.disabled=st?.file?false:!!src?.disabled;syncPremium();syncProduct();syncStores()}"
if old not in s: raise SystemExit('dashboard syncAll marker not found')
s=s.replace(old,new,1)
old2="document.addEventListener('findit:results-rendered',()=>{syncAll();suppressPostIdentifyJourney()});"
new2="document.addEventListener('findit:results-rendered',e=>{syncAll(e.detail?.result);suppressPostIdentifyJourney()});"
if old2 not in s: raise SystemExit('dashboard results listener marker not found')
s=s.replace(old2,new2,1)
p.write_text(s)
