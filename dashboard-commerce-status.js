/* FindIt dashboard commerce status v1 — show exact online evidence without pretending it is branch inventory. */
(()=>{
'use strict';
if(window.__finditDashboardCommerceStatus)return;window.__finditDashboardCommerceStatus=true;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const state=()=>{try{return window.finditState||window.state||{}}catch{return{}}};
const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const positive=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))&&Number(v)>0;
const money=(n,c='ZAR')=>{if(!positive(n))return'';try{return new Intl.NumberFormat('en-ZA',{style:'currency',currency:c||'ZAR'}).format(Number(n))}catch{return`${c||'ZAR'} ${Number(n).toFixed(2)}`}};
const stock=v=>{const x=String(v||'').toLowerCase();if(x==='in_stock')return'In stock online';if(x==='out_of_stock')return'Out of stock online';if(x==='preorder')return'Pre-order online';if(x==='backorder')return'Back-order online';return''};
function key(v){const n=norm(v);if(/\bdis chem\b|\bdischem\b/.test(n))return'dischem';if(/\bpick n pay\b|\bpnp\b/.test(n))return'pick n pay';if(/\bincredible connection\b/.test(n))return'incredible connection';if(/\bhifi corp\b|\bhificorp\b/.test(n))return'hifi corp';return n}
function validOffer(o){return !!(o&&(o.verified===true||o.sourcePageVerified===true||o.searchGroundedVerified===true)&&o.exactProductMatch!==false&&(positive(o.price)||/^(in_stock|out_of_stock|preorder|backorder)$/i.test(String(o.availability||''))));}
function offers(){const a=[];if(Array.isArray(state()?.offers))a.push(...state().offers);if(Array.isArray(window.productIntelligence?.offers))a.push(...window.productIntelligence.offers);const m=new Map();for(const o of a){if(!validOffer(o))continue;const k=key(o?.retailer?.name||o?.retailer);if(!k)continue;const old=m.get(k),score=(o.sourcePageVerified===true?100:0)+(positive(o.price)?20:0)+(o.availability?10:0)+Number(o.matchScore||0);const oldScore=old?((old.sourcePageVerified===true?100:0)+(positive(old.price)?20:0)+(old.availability?10:0)+Number(old.matchScore||0)):-1;if(score>oldScore)m.set(k,o)}return m}
function sync(){const map=offers();for(const row of $$('#fxStoreList .fx-store')){const name=$('b',row)?.textContent||'',o=map.get(key(name)),em=$('em',row),right=$('strong',row);if(!em)continue;if(o){const bits=['Exact product online'];const st=stock(o.availability);if(st)bits.push(st);bits.push('Branch stock not published');const text=bits.join(' • ');if(em.textContent!==text)em.textContent=text;em.classList.toggle('ok',o.availability==='in_stock');const p=money(o.price,o.currency||'ZAR');if(right&&p&&right.textContent!==`${p} ›`)right.textContent=`${p} ›`;}else{const text='Relevant nearby retailer • exact item not confirmed';if(em.textContent!==text)em.textContent=text;em.classList.remove('ok')}}
 for(const row of $$('#fxTopStores > button')){const name=$('b',row)?.textContent||'',o=map.get(key(name)),badge=$('.fx-star',row);if(!badge)continue;const text=o?(o.availability==='in_stock'?'Exact online • In stock':'Exact product online'):'Nearby';if(badge.textContent!==text)badge.textContent=text}
 const priced=[...map.values()].filter(o=>positive(o.price)).sort((a,b)=>Number(a.price)-Number(b.price));const best=$('#fxBestPrice');if(best&&priced.length){const text=money(priced[0].price,priced[0].currency||'ZAR');if(text&&best.textContent!==text)best.textContent=text}
}
let timer=0;function queue(){clearTimeout(timer);timer=setTimeout(sync,60)}
['findit:dashboard-sync','findit:results-rendered','findit:stores-updated'].forEach(n=>document.addEventListener(n,queue));
window.addEventListener('load',()=>{queue();setTimeout(sync,800);setTimeout(sync,2500)});
const mo=new MutationObserver(m=>{if(m.some(x=>x.target?.closest?.('#fxStoreList,#fxTopStores')||x.target?.id==='fxStoreList'||x.target?.id==='fxTopStores'))queue()});
mo.observe(document.documentElement,{subtree:true,childList:true});
})();
