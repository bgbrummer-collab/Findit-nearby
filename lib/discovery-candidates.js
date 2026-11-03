// Strip only known analytics keys; preserve product/variant/region parameters.
export function productCandidateKey(value){
 try{const url=new URL(value);for(const key of [...url.searchParams.keys()])if(/^utm_/i.test(key)||['_pos','_sid','_ss','gclid','fbclid','mc_cid','mc_eid'].includes(key.toLowerCase()))url.searchParams.delete(key);url.searchParams.sort();return url.href;}catch{return String(value||'');}
}

// Share the existing verification budget between independent discovery paths.
// Exact verification still decides whether any candidate becomes an offer.
export function selectDiscoveryCandidates(known=[],web=[],native=[],limit=12){
 const out=[],seen=new Set(),add=url=>{const key=productCandidateKey(url);if(url&&!seen.has(key)&&out.length<limit){seen.add(key);out.push(url);}};
 for(const url of known)add(url);
 for(let n=0;n<Math.max(web.length,native.length)&&out.length<limit;n++){add(native[n]);add(web[n]);}
 return out;
}
