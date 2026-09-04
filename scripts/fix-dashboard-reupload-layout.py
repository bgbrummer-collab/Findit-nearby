from pathlib import Path

js=Path('redesign-v4.js')
s=js.read_text()
old="""function applySelectedFile(file){
 if(!file)return;
 const st=state();if(st)st.file=file;
 const p=$('#preview');
 if(p){try{if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=URL.createObjectURL(file);p.src=previewUrl;p.classList.remove('hidden')}catch{}}
 const ph=$('#uploadPlaceholder');if(ph)ph.classList.add('hidden');
 const box=$('#fxProductImage');if(box&&p?.src)box.innerHTML=`<img src=\"${esc(p.src)}\" alt=\"Selected product\">`;
 const search=$('#search');if(search)search.disabled=false;
 const fx=$('#fxSearchNow');if(fx)fx.disabled=false;
 const status=st?.coords?'Image and location ready. Identify it now.':'Image ready. You can identify it now.';
 if($('#status'))$('#status').textContent=status;if($('#fxStatus'))$('#fxStatus').textContent=status;
}
"""
new="""function resetForNewPhoto(st){
 if(!st)return;
 st.result=null;st.stores=[];st.offers=[];
 try{window.productIntelligence=null}catch{}
 const results=$('#results');if(results)results.classList.add('hidden');
 const resultName=$('#resultName');if(resultName)resultName.textContent='Item';
 const resultDescription=$('#resultDescription');if(resultDescription)resultDescription.textContent='';
 const resultMeta=$('#resultMeta');if(resultMeta)resultMeta.innerHTML='';
 const resultNote=$('#resultNote');if(resultNote)resultNote.innerHTML='';
 const confidence=$('#confidenceValue');if(confidence)confidence.textContent='—';
 const nearby=$('#nearbyStores');if(nearby)nearby.innerHTML='';
 if($('#fxProductName'))$('#fxProductName').textContent='No item selected';
 if($('#fxProductMeta'))$('#fxProductMeta').textContent='';
 if($('#fxProductDesc'))$('#fxProductDesc').textContent='New photo selected. Ready to identify.';
 if($('#fxConfidence'))$('#fxConfidence').textContent='— Match';
 if($('#fxExactBadge'))$('#fxExactBadge').textContent='Waiting for result';
 if($('#fxBestPrice'))$('#fxBestPrice').textContent='Not verified yet';
 if($('#fxStoreList'))$('#fxStoreList').innerHTML='<div class=\"fx-empty\">Use your location and identify this photo to see nearby stores.</div>';
 if($('#fxTopStores'))$('#fxTopStores').innerHTML='<div class=\"fx-empty\">Nearby stores will appear here after a search.</div>';
}
function applySelectedFile(file){
 if(!file)return;
 const st=state();
 resetForNewPhoto(st);
 if(st)st.file=file;
 const p=$('#preview');
 if(p){try{if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=URL.createObjectURL(file);p.src=previewUrl;p.classList.remove('hidden')}catch{}}
 const ph=$('#uploadPlaceholder');if(ph)ph.classList.add('hidden');
 const box=$('#fxProductImage');if(box&&p?.src)box.innerHTML=`<img src=\"${esc(p.src)}\" alt=\"Selected product\">`;
 const search=$('#search');if(search)search.disabled=false;
 const fx=$('#fxSearchNow');if(fx)fx.disabled=false;
 const status=st?.coords?'New image and location ready. Identify it now.':'New image ready. Identify it now.';
 if($('#status'))$('#status').textContent=status;if($('#fxStatus'))$('#fxStatus').textContent=status;
 for(const input of [$('#photo'),$('#cameraPhoto')]){if(input&&input!==document.activeElement){try{input.value=''}catch{}}}
 try{document.dispatchEvent(new CustomEvent('findit:new-photo-selected',{detail:{name:file.name,type:file.type,size:file.size}}))}catch{}
}
"""
if old not in s:
    raise SystemExit('applySelectedFile block not found')
s=s.replace(old,new,1)
needle="""function createShell(){
 const wrap=document.createElement('div');"""
replacement="""function createShell(){
 try{if('scrollRestoration' in history)history.scrollRestoration='manual'}catch{}
 try{window.scrollTo(0,0);requestAnimationFrame(()=>window.scrollTo(0,0));setTimeout(()=>window.scrollTo(0,0),60)}catch{}
 const wrap=document.createElement('div');"""
if needle not in s:
    raise SystemExit('createShell start not found')
s=s.replace(needle,replacement,1)
js.write_text(s)

css=Path('redesign-v4.css')
c=css.read_text()
append='''\n/* 2026-09-04: keep dashboard anchored to the viewport and prevent restored scroll offsets from clipping the shell. */\nhtml,body.findit-exact-dashboard{max-width:100%;overflow-x:clip!important;scroll-behavior:auto}\nbody.findit-exact-dashboard{position:relative;left:0!important;right:auto!important;transform:none!important}\n#finditExactShell{width:100%;max-width:100vw;margin:0!important;position:relative;left:0!important;right:auto!important;transform:none!important;overflow-x:clip}\n@media(min-width:901px){#finditExactShell{grid-template-columns:minmax(148px,172px) minmax(0,1fr) minmax(252px,304px)}.fx-side{left:0}.fx-main,.fx-right{max-width:100%}}\n'''
if '2026-09-04: keep dashboard anchored' not in c:
    c += append
css.write_text(c)
