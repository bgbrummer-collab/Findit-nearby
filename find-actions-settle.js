/* Keep FindIt's visible quick-action labels synced with persisted user state. */
(()=>{
'use strict';
if(window.__finditFindActionsSettle)return;window.__finditFindActionsSettle=true;
const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v??f}catch{return f}};
const product=()=>{const s=window.finditState||window.state||{},i=s.result?.identification||s.identification||{};return{name:String(i.name||i.product||i.object||s.query||'Current Find').trim(),brand:String(i.brand||'').trim(),model:String(i.model||'').trim(),query:String(i.searchQuery||i.query||s.query||i.name||i.model||i.object||'').trim()}};
const shoppingKey=p=>norm([p.brand,p.model,p.name].filter(Boolean).join(' '))||'current-item';
const saveKey=p=>norm([p.brand,p.model,p.name,p.query].filter(Boolean).join(' '))||shoppingKey(p);
function sync(){const p=product(),a=document.querySelector('#fxQuickAddShopping'),b=document.querySelector('#fxQuickSaveFind');if(a){const list=read('findit.shoppingList.v2',[]),has=Array.isArray(list)&&list.some(x=>x?.key===shoppingKey(p));a.textContent=has?'✓ In Shopping List':'+ Shopping List';a.setAttribute('aria-pressed',has?'true':'false')}if(b){const rows=read('finditSaved',[]),k=saveKey(p),has=Array.isArray(rows)&&rows.some(x=>(x?.key||saveKey(x||{}))===k);b.textContent=has?'✓ Find Saved':'Save Find';b.setAttribute('aria-pressed',has?'true':'false')}}
function settle(times=[0,40,100,220,450]){for(const ms of times)setTimeout(sync,ms)}
document.addEventListener('click',e=>{if(e.target?.closest?.('#fxQuickAddShopping,#fxQuickSaveFind'))settle()},true);
for(const ev of ['findit:results-rendered','findit:nearby-updated','findit:dashboard-sync'])document.addEventListener(ev,()=>settle([0,80,250]));
window.addEventListener('storage',sync);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>settle(),{once:true});else settle();
})();