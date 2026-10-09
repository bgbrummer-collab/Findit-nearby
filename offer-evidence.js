/* Shared evidence rules for every FindIt price renderer. */
(()=>{'use strict';
const amount=o=>o?.price!==null&&o?.price!==undefined&&o?.price!==''&&Number.isFinite(Number(o.price))&&Number(o.price)>0?Number(o.price):null;
const currency=o=>/^[A-Z]{3}$/.test(String(o?.currency||'').toUpperCase())?String(o.currency).toUpperCase():null;
const supported=o=>o?.exactProductMatch===true&&(o.sourcePageVerified===true||o.priceComparisonVerified===true||o.verified===true);
function format(o){const n=amount(o);if(n===null)return 'Price not verified';const c=currency(o);if(!c)return n.toFixed(2)+' (currency unverified)';try{return new Intl.NumberFormat('en-ZA',{style:'currency',currency:c}).format(n)}catch{return c+' '+n.toFixed(2)}}
function cheapest(offers){const rows=(Array.isArray(offers)?offers:[]).filter(o=>supported(o)&&amount(o)!==null);if(!rows.length||!currency(rows[0])||rows.some(o=>currency(o)!==currency(rows[0])))return null;return [...rows].sort((a,b)=>amount(a)-amount(b))[0]}
function confidence(i={}){if(i.userConfirmed)return'Search confirmed';if(i.confidence===null||i.confidence===undefined||i.confidence==='')return'Confidence not supplied';const n=Number(i.confidence);return Number.isFinite(n)?Math.round(Math.max(0,Math.min(1,n))*100)+'%':'Confidence not supplied'}
window.finditOfferEvidence={amount,currency,supported,format,cheapest,confidence};
})();
