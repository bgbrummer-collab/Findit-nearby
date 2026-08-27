from pathlib import Path

# 1) Keep the image API resilient when one Gemini model is rate-limited.
p=Path('api/search.js')
s=p.read_text()
s=s.replace("const PRIMARY_MODEL='gemini-3.6-flash';", "const PRIMARY_MODEL='gemini-3.5-flash-lite';")
s=s.replace("const FALLBACK_MODEL='gemini-3.5-flash-lite';", "const FALLBACK_MODEL='gemini-2.5-flash';")
s=s.replace("catch(e){last=e;if(e?.fastFail)throw e}}throw last||Error('Gemini request failed');", "catch(e){last=e}}throw last||Error('Gemini request failed');")
s=s.replace("catch(e){last=e;if(e?.fastFail)throw e}}throw last||Error('Verification failed');", "catch(e){last=e}}throw last||Error('Verification failed');")
s=s.replace('const GEMINI_TIMEOUT_MS=5000;', 'const GEMINI_TIMEOUT_MS=12000;')
p.write_text(s)

# 2) The browser search controller must allow enough time for the API's model fallback.
p=Path('exact-retailer-fix.js')
s=p.read_text()
s=s.replace("setTimeout(()=>c.abort(),55000)", "setTimeout(()=>c.abort(),75000)")
p.write_text(s)

# 3) Force phones to load the newest search code instead of a cached old bundle.
p=Path('index.html')
s=p.read_text()
s=s.replace('<script src="script.js" defer></script>', '<script src="script.js?v=20260827-search4" defer></script>')
s=s.replace('<script src="exact-retailer-fix.js" defer></script>', '<script src="exact-retailer-fix.js?v=20260827-search4" defer></script>')
p.write_text(s)

# 4) Do not burn the free image quota on every code push. Keep the nine-image audit manual.
p=Path('.github/workflows/real-world-nine-item-audit.yml')
if p.exists():
    s=p.read_text()
    old="""on:\n  push:\n    branches: [main]\n    paths-ignore:\n      - '.github/qa-results/**'\n  workflow_dispatch:\n"""
    new="""on:\n  workflow_dispatch:\n"""
    s=s.replace(old,new)
    p.write_text(s)
