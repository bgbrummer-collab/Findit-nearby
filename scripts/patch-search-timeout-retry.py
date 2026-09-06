from pathlib import Path
p=Path('api/search.js')
s=p.read_text()
old="let last;for(const model of [PRIMARY_MODEL,FALLBACK_MODEL,FAST_MODEL]){try{const x=await generateStructured(key,model,prompt,b64,mime);x.modelUsed=model;return x}catch(e){last=e}}throw last||Error('Gemini request failed');"
new="let last;for(const model of [PRIMARY_MODEL,FALLBACK_MODEL,FAST_MODEL]){try{const x=await generateStructured(key,model,prompt,b64,mime);x.modelUsed=model;return x}catch(e){last=e}}\n // A single transient model timeout should not turn an otherwise valid photo into a hard failure.\n // Retry the primary vision model once after the normal model rotation; never fabricate an identity.\n try{await new Promise(r=>setTimeout(r,180));const x=await generateStructured(key,PRIMARY_MODEL,prompt,b64,mime);x.modelUsed=PRIMARY_MODEL;x.retriedAfterProviderFailure=true;return x}catch(e){last=e}\n if(last)last.fastFail=true;throw last||Error('Gemini request failed');"
if old not in s: raise SystemExit('identifyDraft target not found')
s=s.replace(old,new,1)
p.write_text(s)
print('patched image identification provider retry')
