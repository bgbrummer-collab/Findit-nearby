(()=>{
'use strict';
if(window.__finditAiProductInsightsV4)return;window.__finditAiProductInsightsV4=true;
const $=(s,r=document)=>r.querySelector(s);
const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
function state(){try{return window.finditState||window.state||null}catch{return null}}
function identification(){return state()?.result?.identification||{}}
function panel(){const b=$('#fxPanelBody');return b&&/^Product Information$/i.test(b.querySelector('.fx-panel-title')?.textContent?.trim()||'')?b:null}
function key(i){return [i.brand,i.model,i.name,i.object,i.searchQuery,(i.visibleText||[]).join('|')].join('::')}
let cachedKey='',cached=null,pending=null;
function researchBox(body){let g=body.querySelector('.fx-insight-grid');if(!g){g=document.createElement('div');g.className='fx-insight-grid';body.appendChild(g)}return g}
function showLoading(body){researchBox(body).innerHTML='<section class="fx-insight full"><h3>Researching this product online…</h3><p>Checking public product pages and reviews for real strengths, drawbacks and use cases.</p></section>'}
function showUnavailable(body){researchBox(body).innerHTML='<section class="fx-insight full"><h3>Online product research temporarily unavailable</h3><p>FindIt will not replace researched Pros and Cons with guesses or visible photo features. Try this product again when web research is available.</p></section>'}
function render(body,d){const src=Array.isArray(d.sources)?d.sources.slice(0,5):[];researchBox(body).innerHTML=`<section class="fx-insight full"><h3>What it does</h3><p>${esc(d.whatItDoes)}</p></section>${d.bestFor?`<section class="fx-insight"><h3>Best for</h3><p>${esc(d.bestFor)}</p></section>`:''}${d.standOut?`<section class="fx-insight"><h3>What makes it stand out</h3><p>${esc(d.standOut)}</p></section>`:''}<section class="fx-insight"><h3>Pros</h3>${d.pros?.length?`<ul>${d.pros.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p>No researched strengths were strong enough to show.</p>'}</section><section class="fx-insight"><h3>Cons / trade-offs</h3>${d.cons?.length?`<ul>${d.cons.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p>No well-supported product-specific drawbacks were found.</p>'}</section>${d.valueVerdict?`<section class="fx-insight full"><h3>Value verdict</h3><p>${esc(d.valueVerdict)}</p></section>`:''}${src.length?`<section class="fx-insight full"><h3>Research sources</h3><ul>${src.map(x=>`<li><a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.title||'Source')}</a></li>`).join('')}</ul></section>`:''}`}
async function getResearch(){const i=identification(),k=key(i);if(!String(i.name||i.model||i.object||'').trim())return null;if(cached&&cachedKey===k)return cached;if(pending&&cachedKey===k)return pending;cachedKey=k;pending=(async()=>{try{const c=new AbortController(),t=setTimeout(()=>c.abort(),26000);const r=await fetch('/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification:i,offers:state()?.offers||[]}),signal:c.signal});clearTimeout(t);if(!r.ok)return null;const d=await r.json();if(!d?.researched||!d?.whatItDoes||!Array.isArray(d.pros)||!Array.isArray(d.cons)||!Array.isArray(d.sources)||!d.sources.length)return null;cached=d;return d}catch{return null}finally{pending=null}})();return pending}
async function run(){const b=panel();if(!b)return;showLoading(b);const d=await getResearch();const current=panel();if(!current)return;if(d)render(current,d);else showUnavailable(current)}
function reset(){cached=null;cachedKey='';pending=null}
window.addEventListener('click',e=>{if(e.target?.closest?.('#finditExactShell [data-fx="product"]'))setTimeout(run,80)},true);
document.addEventListener('findit:results-rendered',()=>{reset();setTimeout(()=>getResearch(),180)});
document.addEventListener('findit:nearby-updated',()=>{reset();if(panel())setTimeout(run,100)});
document.addEventListener('findit:dashboard-sync',()=>{if(panel())setTimeout(run,80)});
})();
