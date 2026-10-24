// Conservative price comparison. Different listing names may be the same SKU,
// but that equivalence needs evidence rather than a guessed cheapest variant.
const comparisonText=value=>String(value??'').replace(/[™®©]/g,'').normalize('NFKC').toLowerCase().replace(/&amp;/g,' and ').replace(/[’']/g,'').replace(/\bgray\b/g,'grey').replace(/[^a-z0-9+]+/g,' ').trim().replace(/\s+/g,' ');
export function listingComparisonKey(offer){
 const title=comparisonText(offer?.product_name||offer?.title||offer?.name);
 if(!title)return null;
 const attrs=offer.comparisonAttributes||{};
 return [title,comparisonText(attrs.size),comparisonText(attrs.color)].join('|');
}
export function priceComparisonIssue(offers){
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
export function selectComparablePrice(offers){
 if(priceComparisonIssue(offers))return null;
 return [...offers].filter(o=>o?.price!==null&&o?.price!==undefined&&o?.price!==''&&Number.isFinite(Number(o.price))&&Number(o.price)>0).sort((a,b)=>Number(a.price)-Number(b.price))[0]||null;
}
