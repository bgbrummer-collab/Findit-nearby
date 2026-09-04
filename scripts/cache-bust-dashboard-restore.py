from pathlib import Path
p=Path('index.html')
s=p.read_text()
old='redesign-v4.js?v=20260829-dashboard4'
new='redesign-v4.js?v=20260904-dashboardrestore1'
if old not in s and new not in s: raise SystemExit('dashboard script tag not found')
if old in s: s=s.replace(old,new,1)
p.write_text(s)
