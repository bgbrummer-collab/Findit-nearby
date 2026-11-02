// Shorter catalogue queries are discovery only. The untouched requested
// identity still verifies every candidate's model, quantity and colour.
export function catalogueDiscoveryTerms(i={}){
 const full=String(i.query||i.searchQuery||i.name||'').trim(),short=full
 .replace(/\b(?:upper arm blood pressure monitor|blood pressure monitor|blood glucose meter|wireless mechanical keyboard|mechanical keyboard|wireless keyboard|gaming mouse|computer mouse|mouse pad|mousepad|rowing machine|camera body|air fryer|dog food|cat food)\b/gi,' ')
 .replace(/\b(?:headphones?|headsets?|keyboards?|mouse|sneakers?|printers?|cameras?|calculators?|backpacks?)\b/gi,' ')
 .replace(/\b(?:black|white|blue|red|green|pink|brown|grey|gray|silver|gold)\b/gi,' ')
 .replace(/\b\d+(?:\.\d+)?\s*(?:ml|kg|mg|gb|tb|cm|mm|g|l)\b/gi,' ').replace(/\s+/g,' ').trim();
 return short!==full&&short.split(' ').length>=2?[full,short]:[full];
}
export function catalogueQueryUrl(page,term){
 const u=new URL(page);for(const key of ['q','s','search','text'])if(u.searchParams.has(key))u.searchParams.set(key,key==='q'&&u.searchParams.get(key).endsWith(':relevance')?term+':relevance':term);return u.href;
}

// A final model-focused query can find catalogues that split an alphanumeric
// brand differently. It is retrieval only; full identity still verifies results.
export function catalogueModelTerm(i={}){
 const terms=catalogueDiscoveryTerms(i),tokens=(terms[1]||terms[0]||'').split(/\s+/).filter(Boolean);if(tokens.length<2)return '';
 const model=tokens.slice(1).join(' ');if(/^(?:original|classic|large|small|medium|adult|black|white|pro|plus|mini)$/i.test(model)||model.length<2)return '';return model;
}
