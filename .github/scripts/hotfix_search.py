from pathlib import Path

# Keep image search alive if one parallel Gemini pass times out.
p=Path('api/search.js')
s=p.read_text()
s=s.replace("const GEMINI_TIMEOUT_MS=10000;", "const GEMINI_TIMEOUT_MS=14000;")
old="""  const primaryPromise=identifyDraft(key,base64,mime);\n  const checkerPromise=independentCheck(key,base64,mime).catch(()=>null);\n  const [draft,checker]=await Promise.all([primaryPromise,checkerPromise]);\n  let verified=mergeIndependent(draft,checker),verificationMode=checker?'parallel-two-pass':'single-pass-degraded';\n"""
new="""  const primaryPromise=identifyDraft(key,base64,mime);\n  const checkerPromise=independentCheck(key,base64,mime);\n  const [primaryResult,checkerResult]=await Promise.allSettled([primaryPromise,checkerPromise]);\n  let draft=primaryResult.status==='fulfilled'?primaryResult.value:null;\n  let checker=checkerResult.status==='fulfilled'?checkerResult.value:null;\n  if(!draft&&checker){draft={...checker,modelUsed:checker.verifierModel||FAST_MODEL,verificationNote:'Primary identification timed out; independent vision result used safely.',draftChanged:false};checker=null}\n  if(!draft)throw (primaryResult.reason||checkerResult.reason||Error('Gemini request failed'));\n  let verified=mergeIndependent(draft,checker),verificationMode=checker?'parallel-two-pass':'single-pass-degraded';\n"""
if old not in s:
    raise SystemExit('Could not find parallel search block')
s=s.replace(old,new,1)
# Try the fast model first on phones; if it fails, still fall back to the stronger model.
s=s.replace("for(const model of [PRIMARY_MODEL,FAST_MODEL])", "for(const model of [FAST_MODEL,PRIMARY_MODEL])", 1)
p.write_text(s)

# Give the browser enough time for the server-side fallback path.
p=Path('exact-retailer-fix.js')
s=p.read_text()
s=s.replace("setTimeout(()=>c.abort(),55000)", "setTimeout(()=>c.abort(),75000)")
s=s.replace("setTimeout(()=>c.abort(),65000)", "setTimeout(()=>c.abort(),75000)")
p.write_text(s)

# Force phones to fetch the newest search controller.
p=Path('index.html')
s=p.read_text()
import re
s=re.sub(r'script\\.js(?:\\?v=[^\"\\']+)?', 'script.js?v=20260828-mobile-timeout', s)
s=re.sub(r'exact-retailer-fix\\.js(?:\\?v=[^\"\\']+)?', 'exact-retailer-fix.js?v=20260828-mobile-timeout', s)
p.write_text(s)
