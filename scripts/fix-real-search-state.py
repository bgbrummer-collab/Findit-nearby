from pathlib import Path

# 1) Make the live dashboard sync only after the real search + nearby flow has completed.
p=Path('script.js')
s=p.read_text()
old="setStatus('Search complete.')}catch(e){"
new="setStatus('Search complete.');try{document.dispatchEvent(new CustomEvent('findit:results-rendered'));document.dispatchEvent(new CustomEvent('findit:nearby-updated'))}catch{}}catch(e){"
if old not in s:
    raise SystemExit('search completion marker not found')
s=s.replace(old,new,1)
p.write_text(s)

# 2) Add a stable lower-cost multimodal fallback when the current Gemini model hits quota/demand/timeouts.
p=Path('api/search.js')
s=p.read_text()
old="const FAST_MODEL='gemini-3.5-flash-lite';\n"
new="const FAST_MODEL='gemini-3.5-flash-lite';\nconst FALLBACK_MODEL='gemini-2.5-flash-lite';\n"
if old not in s:
    raise SystemExit('FAST_MODEL marker not found')
s=s.replace(old,new,1)
old="let last;for(const model of [FAST_MODEL,PRIMARY_MODEL]){try{"
new="let last;for(const model of [FAST_MODEL,FALLBACK_MODEL,PRIMARY_MODEL]){try{"
if old not in s:
    raise SystemExit('identify model list not found')
s=s.replace(old,new,1)
old="const x=await generateStructured(key,FAST_MODEL,prompt,b64,mime);x.verifierModel=FAST_MODEL;return x;"
new="let last;for(const model of [FALLBACK_MODEL,FAST_MODEL]){try{const x=await generateStructured(key,model,prompt,b64,mime);x.verifierModel=model;return x}catch(e){last=e}}throw last||Error('Independent verification failed');"
if old not in s:
    raise SystemExit('independent verifier marker not found')
s=s.replace(old,new,1)
p.write_text(s)
