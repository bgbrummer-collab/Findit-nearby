from pathlib import Path
p=Path('script.js')
s=p.read_text()
old="state.result=data;renderIdentification(data.identification||{});loadProductIntelligence(data.identification||{});"
new="state.result=data;renderIdentification(data.identification||{});try{document.dispatchEvent(new CustomEvent('findit:results-rendered'))}catch{}loadProductIntelligence(data.identification||{});"
if old not in s: raise SystemExit('result assignment marker not found')
s=s.replace(old,new,1)
old2="if(state.coords&&conf>=.55&&!data.blocked)await loadNearby(data.identification||{},state.radius);else showNothing('Allow location to see nearby retailers.');saveRecent"
new2="if(state.coords&&conf>=.55&&!data.blocked){await loadNearby(data.identification||{},state.radius);try{document.dispatchEvent(new CustomEvent('findit:nearby-updated'))}catch{}}else showNothing('Allow location to see nearby retailers.');saveRecent"
if old2 not in s: raise SystemExit('nearby completion marker not found')
s=s.replace(old2,new2,1)
# Avoid delaying the first dashboard result update until the entire nearby flow is done.
s=s.replace("setStatus('Search complete.');try{document.dispatchEvent(new CustomEvent('findit:results-rendered'));document.dispatchEvent(new CustomEvent('findit:nearby-updated'))}catch{}}catch(e){", "setStatus('Search complete.')}catch(e){",1)
p.write_text(s)
