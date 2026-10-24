/* Shared evidence rules for every FindIt price renderer. */
(()=>{'use strict';
// Same conservative rules as lib/offer-comparison.js; parity tests cover both runtimes.
const comparisonText=value=>String(value??'').replace(/[™®©]/g,'').normalize('NFKC').toLowerCase().replace(/&amp;/g,' and ').replace(/[’']/g,'').replace(/\bgray\b/g,'grey').replace(/(\d)\s*x\b/g,'$1 x').replace(/(\d)\s*(ml|cl|l|mg|kg|g|mm|cm)\b/g,'$1 $2').replace(/[^a-z0-9+]+/g,' ').trim().replace(/\s+/g,' ');
function listingComparisonKey(offer){
 const title=comparisonText(offer?.product_name||offer?.title||offer?.name);
 if(!title)return null;
 const attrs=offer.comparisonAttributes||{};
 return [title,comparisonText(attrs.size),comparisonText(attrs.color)].join('|');
}
function priceComparisonIssue(offers){
 const rows=(Array.isArray(offers)?offers:[]).filter(o=>o?.price!==null&&o?.price!==undefined&&o?.price!==''&&Number.isFinite(Number(o.price))&&Number(o.price)>0);
 if(!rows.length)return 'no-prices';
 const currency=String(rows[0].currency||'').toUpperCase();
 if(!/^[A-Z]{3}$/.test(currency)||rows.some(o=>String(o.currency||'').toUpperCase()!==currency))return 'currencies';
 if(rows.some(o=>o.comparisonAmbiguous===true))return 'variants';
 if(rows.length>1){
  const key=listingComparisonKey(rows[0]);
  if(!key||rows.some(o=>listingComparisonKey(o)!==key))return 'variants';
  const terms=comparisonText(rows[0].priceConditions);
  if(rows.some(o=>comparisonText(o.priceConditions)!==terms))return 'conditions';
 }
 return null;
}
function selectComparablePrice(offers){
 if(priceComparisonIssue(offers))return null;
 return [...offers].filter(o=>o?.price!==null&&o?.price!==undefined&&o?.price!==''&&Number.isFinite(Number(o.price))&&Number(o.price)>0).sort((a,b)=>Number(a.price)-Number(b.price))[0]||null;
}

const amount=o=>o?.price!==null&&o?.price!==undefined&&o?.price!==''&&Number.isFinite(Number(o.price))&&Number(o.price)>0?Number(o.price):null;
const currency=o=>/^[A-Z]{3}$/.test(String(o?.currency||'').toUpperCase())?String(o.currency).toUpperCase():null;
const supported=o=>o?.exactProductMatch===true&&(o.sourcePageVerified===true||o.priceComparisonVerified===true||o.verified===true);
const priceNote=o=>String(o?.priceConditions||'').trim()?(/\+more/i.test(o.priceConditions)?'+more price — check eligibility':'price conditions apply'):'';
function format(o){const n=amount(o);if(n===null)return 'Price not verified';const c=currency(o),note=priceNote(o),suffix=note?' · '+note:'';if(!c)return n.toFixed(2)+' (currency unverified)'+suffix;try{return new Intl.NumberFormat('en-ZA',{style:'currency',currency:c}).format(n)+suffix}catch{return c+' '+n.toFixed(2)+suffix}}

function cheapest(offers){const rows=(Array.isArray(offers)?offers:[]).filter(o=>supported(o)&&amount(o)!==null);return selectComparablePrice(rows)}
function comparisonIssue(offers){return priceComparisonIssue((Array.isArray(offers)?offers:[]).filter(o=>supported(o)&&amount(o)!==null))}
function comparisonMessage(offers){const issue=comparisonIssue(offers);return issue==='currencies'?'Currencies differ or are unverified — compare listings separately':issue==='variants'?'Confirm the listing variant before comparing prices':issue==='conditions'?'Price conditions differ — compare listings separately':''}
function headline(offers){const best=cheapest(offers);return best?format(best):comparisonMessage(offers)||'Not verified yet'}

function confidence(i={}){if(i.catalogueSource)return'Barcode catalogue match';if(i.userConfirmed)return'Search confirmed';if(i.confidence===null||i.confidence===undefined||i.confidence==='')return'Confidence not supplied';const n=Number(i.confidence);return Number.isFinite(n)?Math.round(Math.max(0,Math.min(1,n))*100)+'%':'Confidence not supplied'}
window.finditOfferEvidence={amount,currency,supported,format,cheapest,confidence,priceNote,comparisonIssue,comparisonMessage,headline,listingComparisonKey,listingComparisonIssue:priceComparisonIssue};
})();
