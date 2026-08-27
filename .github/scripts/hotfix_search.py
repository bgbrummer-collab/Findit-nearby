from pathlib import Path
p=Path('api/search.js')
s=p.read_text()
# Use a lighter model first and keep a second-model fallback when one model hits its own quota.
s=s.replace("const PRIMARY_MODEL='gemini-3.6-flash';", "const PRIMARY_MODEL='gemini-3.5-flash-lite';")
s=s.replace("const FALLBACK_MODEL='gemini-3.5-flash-lite';", "const FALLBACK_MODEL='gemini-2.5-flash';")
s=s.replace("catch(e){last=e;if(e?.fastFail)throw e}}throw last||Error('Gemini request failed');", "catch(e){last=e}}throw last||Error('Gemini request failed');")
s=s.replace("catch(e){last=e;if(e?.fastFail)throw e}}throw last||Error('Verification failed');", "catch(e){last=e}}throw last||Error('Verification failed');")
# Keep anti-hang protection without making normal mobile searches fail too quickly.
s=s.replace('const GEMINI_TIMEOUT_MS=5000;', 'const GEMINI_TIMEOUT_MS=12000;')
p.write_text(s)
