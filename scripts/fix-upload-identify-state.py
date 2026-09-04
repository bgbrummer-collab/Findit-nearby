from pathlib import Path

p=Path('redesign-v4.js')
s=p.read_text()
old=""" for(const input of [$('#photo'),$('#cameraPhoto')]){if(input&&input!==document.activeElement){try{input.value=''}catch{}}}\n"""
new=""" // Keep the selected file on the native input until identification finishes.\n // The picker is already cleared immediately before opening, so the same file can still be selected again later.\n"""
if old not in s:
    raise SystemExit('post-selection input clear block not found')
s=s.replace(old,new,1)
p.write_text(s)
