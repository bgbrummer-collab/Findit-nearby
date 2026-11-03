// A fetched SKU or product title is identity evidence, not useful product research.
const norm=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function hasUsefulProductResearch(data){
 if(data?.researched!==true)return false;
 const sources=(data.sources||[]).filter(s=>/^https:\/\//.test(s?.url||''));
 if(!sources.length)return false;
 const titles=new Set(sources.map(s=>norm(s.title)));
 const substantial=claim=>claim&&String(claim.text||'').trim().length>=40&&sources.some(s=>s.url===claim.sourceUrl)&&!titles.has(norm(claim.text));
 const evidence=data.claimEvidence||{};
 if([evidence.whatItDoes,...(evidence.pros||[]),...(evidence.compatibility||[]),...(evidence.includedItems||[])].some(substantial))return true;
 const identityOnly=/^(?:brand|model|size|colou?r|barcode|gtin\d*|ean|sku(?: \/ product code)?|retailer product code|manufacturer part number|pack quantity)$/i;
 return (data.specifications||[]).filter(row=>row.name&&row.value&&!identityOnly.test(row.name)&&sources.some(s=>s.url===row.sourceUrl)).length>=2;
}
