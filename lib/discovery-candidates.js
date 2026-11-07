// Strip only known analytics keys; preserve product/variant/region parameters.
export function productCandidateKey(value){
 try{const url=new URL(value);for(const key of [...url.searchParams.keys()])if(/^utm_/i.test(key)||['_pos','_sid','_ss','gclid','fbclid','mc_cid','mc_eid'].includes(key.toLowerCase()))url.searchParams.delete(key);url.searchParams.sort();return url.href;}catch{return String(value||'');}
}

// Keep each source's ranking within a retailer, then give distinct retailers
// a chance before checking further variants from the same domain.
function byRetailer(urls){
 const buckets=new Map();
 for(const url of urls){
  let host;
  try{host=new URL(url).hostname.replace(/^www\./,'');}catch{host=url;}
  if(!buckets.has(host))buckets.set(host,[]);
  buckets.get(host).push(url);
 }
 const ranked=[];
 for(let index=0;ranked.length<urls.length;index++)
  for(const rows of buckets.values())if(index<rows.length)ranked.push(rows[index]);
 return ranked;
}

// Share the existing verification budget between independent discovery paths.
// Exact verification still decides whether any candidate becomes an offer.
export function selectDiscoveryCandidates(known=[],web=[],native=[],limit=12){
 const out=[],seen=new Set(),add=url=>{const key=productCandidateKey(url);if(url&&!seen.has(key)&&out.length<limit){seen.add(key);out.push(url);}};
 for(const url of known)add(url);
 const webRanked=byRetailer(web),nativeRanked=byRetailer(native);
 for(let n=0;n<Math.max(webRanked.length,nativeRanked.length)&&out.length<limit;n++){
  add(nativeRanked[n]);add(webRanked[n]);
 }
 return out;
}
