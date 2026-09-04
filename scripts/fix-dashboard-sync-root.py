from pathlib import Path
p=Path('script.js')
s=p.read_text()
old="state.result=data;renderIdentification(data.identification||{});try{document.dispatchEvent(new CustomEvent('findit:results-rendered'))}catch{}loadProductIntelligence(data.identification||{});"
new="state.result=data;renderIdentification(data.identification||{});try{document.dispatchEvent(new CustomEvent('findit:results-rendered',{detail:{result:data}}))}catch{}loadProductIntelligence(data.identification||{});"
if old not in s: raise SystemExit('immediate result marker not found')
s=s.replace(old,new,1)
# Dashboard sync must use the event payload, not a different closure's private state.
old2="function syncAll(){const i=state.result?.identification||{};"
new2="function syncAll(resultOverride){const i=(resultOverride||state.result)?.identification||{};"
if old2 not in s: raise SystemExit('syncAll marker not found')
s=s.replace(old2,new2,1)
old3="document.addEventListener('findit:results-rendered',syncAll);"
new3="document.addEventListener('findit:results-rendered',e=>syncAll(e.detail?.result));"
if old3 not in s: raise SystemExit('results listener marker not found')
s=s.replace(old3,new3,1)
p.write_text(s)
