from pathlib import Path
import re

# Align the browser's shared search state with every controller script.
p=Path('script.js')
s=p.read_text()
needle='const state={file:null,coords:null,result:null,offers:[],stores:[],sort:"best",radius:Number(localStorage.getItem("finditRadius")||10),map:null,markers:[],diagnostics:'
if needle in s and 'window.finditState=state;' not in s:
    # Add the export immediately after the complete state declaration.
    start=s.index(needle)
    end=s.find('\n', start)
    if end!=-1:
        s=s[:end+1]+'window.finditState=state;\n'+s[end+1:]
p.write_text(s)

# Make all secondary controllers read the same exported state instead of relying on
# a top-level const becoming a window property (it does not).
for name in ['mobile-menu-fix.js','exact-retailer-fix.js']:
    p=Path(name)
    s=p.read_text()
    if name=='mobile-menu-fix.js':
        s=s.replace('window.state?.result?.identification', 'window.finditState?.result?.identification')
        s=s.replace('window.state?.stores', 'window.finditState?.stores')
        s=s.replace('window.state?.offers', 'window.finditState?.offers')
    else:
        s=s.replace("const S=()=>{try{return state}catch{return null}};", "const S=()=>window.finditState||null;")
    p.write_text(s)

# Force every phone/browser to fetch this exact controller set.
p=Path('index.html')
s=p.read_text()
stamp='20260830-searchlineup1'
s=re.sub(r'script\.js(?:\?v=[^\"]+)?', f'script.js?v={stamp}', s)
s=re.sub(r'exact-retailer-fix\.js(?:\?v=[^\"]+)?', f'exact-retailer-fix.js?v={stamp}', s)
s=re.sub(r'mobile-menu-fix\.js(?:\?v=[^\"]+)?', f'mobile-menu-fix.js?v={stamp}', s)
p.write_text(s)
