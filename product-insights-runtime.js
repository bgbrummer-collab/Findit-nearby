(()=>{
'use strict';if(window.__finditAiProductInsightsV1)return;window.__finditAiProductInsightsV1=true;
const $=(s,r=document)=>r.querySelector(s),esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function state(){try{return window.finditState||window.state||null}catch{return null}}
function identification(){return state()?.result?.identification||{}}
function key(i){return [i.brand,i.model,i.name,i.object,i.summary,(i.visibleText||[]).join('|')].join('::')}
let cacheKey='',cache=null,pending=null;
async function getInsights(){const i=identification(),k=key(i);if(!String(i.name||i.model||i.object||'').trim())return null;if(cache&&cacheKey===k)return cache;if(pending&&cacheKey===k)return pending;cacheKey=k;pending=(async()=>{try{const c=new AbortController(),t=setTimeout(()=>c.abort(),20000);const r=await fetch('/api/product-insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identification:i}),signal:c.signal});clearTimeout(t);if(!r.ok)return null;const d=await r.json();if(!d?.whatItDoes||!Array.isArray(d.pros)||!Array.isArray(d.cons))return null;cache=d;return d}catch{return null}finally{pending=null}})();return pending}
function panelOpen(){const b=$('#fxPanelBody');return b&&/^Product Information$/i.test(b.querySelector('.fx-panel-title')?.textContent?.trim()||'')?b:null}
function loading(body){let g=body.querySelector('.fx-insight-grid');if(!g)return;g.innerHTML='<section class="fx-insight full"><h3>Product-specific AI analysis</h3><p>Checking the exact identified product for useful pros, cons and what it does…</p><small>FindIt will avoid unsupported product claims.</small></section>'}
function render(d){const body=panelOpen();if(!body||!d)return;body.querySelector('.fx-insight-grid')?.remove();const g=document.createElement('div');g.className='fx-insight-grid fx-ai-specific-insights';g.innerHTML=`<section class="fx-insight full"><h3>What it does</h3><p>${esc(d.whatItDoes)}</p><small>AI analysis for this specific identified product, limited to supported product details.</small></section><section class="fx-insight"><h3>Pros</h3><ul>${d.pros.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section><section class="fx-insight"><h3>Cons / considerations</h3><ul>${d.cons.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`;body.appendChild(g)}
async function run(){const body=panelOpen();if(!body)return;loading(body);const d=await getInsights();if(panelOpen()&&d)render(d)}
window.addEventListener('click',e=>{if(e.target?.closest?.('#finditExactShell [data-fx="product"]'))setTimeout(run,120)},true);
document.addEventListener('findit:results-rendered',()=>{cache=null;cacheKey='';setTimeout(()=>getInsights(),250)});
document.addEventListener('findit:dashboard-sync',()=>{if(panelOpen())setTimeout(run,100)});
})();
