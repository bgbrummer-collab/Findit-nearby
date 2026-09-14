/* FindIt store-hours settle — ensure a store list that arrives during another check still gets checked. */
(()=>{
'use strict';
if(window.__finditStoreHoursSettle)return;window.__finditStoreHoursSettle=true;
const state=()=>window.finditState||window.state||{};
const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
let last='',timer=0;
function sig(){const rows=Array.isArray(state().stores)?state().stores:[];return rows.slice(0,8).map(s=>norm(`${s?.name}|${s?.address}|${s?.lat}|${s?.lon}`)).join('||')}
function settle(){const next=sig();if(!next||next===last)return;last=next;clearTimeout(timer);timer=setTimeout(()=>{try{window.finditRefreshStoreHours?.()}catch{}},900)}
for(const ev of ['findit:nearby-updated','findit:dashboard-sync','findit:results-rendered'])document.addEventListener(ev,settle);
setTimeout(settle,1200);setTimeout(settle,2600);
})();