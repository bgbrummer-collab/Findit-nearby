from pathlib import Path
p=Path('api/product-insights.js')
s=p.read_text()
needle="function isNegativeEvidence(x) {\n"
insert="function isNegativeEvidence(x) {\n  if (/\\b(septic(?: tank)? safe|breaks down easily in water|biodegradable|recyclable)\\b/i.test(String(x || ''))) return false;\n"
if insert not in s:
    if needle not in s:
        raise SystemExit('isNegativeEvidence function not found')
    s=s.replace(needle,insert,1)
p.write_text(s)
