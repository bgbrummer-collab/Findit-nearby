/* FindIt release polish: robust copy fallback + truthful exact-product fallback actions. */
(()=>{
 const $=s=>document.querySelector(s);
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 async function copyText(text){
   try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return true}}catch{}
   try{const ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();ta.setSelectionRange(0,ta.value.length);const ok=document.execCommand('copy');ta.remove();return ok}catch{return false}
 }
 function wireFeedbackCopy(){
   const b=$('#copyFeedback');if(!b||b.dataset.releaseCopy==='1')return;b.dataset.releaseCopy='1';
   b.addEventListener('click',async e=>{
     e.preventDefault();e.stopImmediatePropagation();
     const rating=$('#feedbackRating')?.value||'0',topic=$('#feedbackTopic')?.value||'general',msg=$('#feedbackMessage')?.value?.trim()||'';
     const ok=await copyText(`FindIt rating: ${rating}/5\nTopic: ${topic}\n\n${msg}`);
     const st=$('#feedbackStatus');if(st)st.textContent=ok?'✓ Feedback copied.':'Copy unavailable.';
   },true);
 }
 function exactFallback(){
   const panel=$('#productIntelligenceResults');if(!panel)return;
   let i;try{i=state?.result?.identification}catch{return}if(!i)return;
   const q=String(i.searchQuery||i.name||i.object||'').trim();if(!q||$('#finditExactFallback'))return;
   const brand=String(i.brand||'').trim(),school=String(i.schoolName||'').trim();
   const exact=`https://www.google.com/search?q=${encodeURIComponent('"'+q+'"')}`;
   const retailerTerm=school?`${school} uniform supplier`:brand?`${brand} official store`:`${q} retailer`;
   const maps=new URL('https://www.google.com/maps/search/');maps.searchParams.set('api','1');maps.searchParams.set('query',retailerTerm);
   const d=document.createElement('div');d.id='finditExactFallback';d.className='empty-state';
   d.innerHTML=`<b>Keep searching for the exact item</b><br><small>These links help you continue when verified price or branch stock is not connected yet.</small><div class="pi-actions" style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><a href="${esc(exact)}" target="_blank" rel="noopener noreferrer">Search exact product →</a><a href="${esc(maps.toString())}" target="_blank" rel="noopener noreferrer">Find relevant retailer →</a></div>`;
   panel.appendChild(d);
 }
 function observePI(){const el=$('#productIntelligenceResults');if(!el)return;new MutationObserver(()=>setTimeout(exactFallback,0)).observe(el,{childList:true,subtree:true});setTimeout(exactFallback,500)}
 function init(){wireFeedbackCopy();observePI()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();