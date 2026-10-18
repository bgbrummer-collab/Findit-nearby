import {nativeRetailerUrls} from './native-retailer-discovery.js';
import {ident, retailerCandidateUrls, structuredProductNodes, structuredProduct} from './product-intelligence-core.js';
const words=v=>String(v||'').toLowerCase().replace(/&amp;|&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim().split(' ').filter(Boolean);
const clean=v=>String(v||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
function oneEdit(a,b){if(a===b)return true;if(a.length<4||b.length<4||/\d/.test(a+b)||Math.abs(a.length-b.length)>1)return false;let x=0,y=0,edits=0;while(x<a.length&&y<b.length){if(a[x]===b[y]){x++;y++;continue}if(++edits>1)return false;if(a.length>=b.length)x++;if(b.length>=a.length)y++;}return edits+(x<a.length||y<b.length?1:0)<=1;}
// OCR corrections only propose a candidate. They never confirm the photo identity.
export function candidateLabelMatches(name,i){
 const target=words(name),brand=words(i.brand),label=words(i.suggestedLabel);
 if(!brand.length||!brand.every(w=>target.includes(w)))return false;
 const tokens=[...new Set(label.filter(w=>!brand.includes(w)))];
 if(tokens.length<2&&!tokens.some(w=>/[a-z]/.test(w)&&/\d/.test(w)))return false;
 let corrections=0;for(const token of tokens){if(target.includes(token))continue;if(!target.some(w=>oneEdit(token,w))||++corrections>1)return false;}
 const colors=['black','white','blue','red','green','pink','brown','grey','gray','silver','gold','purple'];
 const wanted=words([i.color,i.suggestedLabel].join(' ')).filter(w=>colors.includes(w));
 if(wanted.length&&colors.some(c=>target.includes(c)&&!wanted.includes(c)))return false;
 if(/conditioner/i.test(i.object)&&/shampoo/i.test(name)&&!/conditioner/i.test(name))return false;
 if(i.size){const normalize=v=>String(v||'').toLowerCase().replace(/(\d)\s+(ml|g|kg|l)\b/g,'$1$2');if(!normalize(name).includes(normalize(i.size)))return false;}
 return true;
}
export async function visualProductCandidates(input){
 const printed=(Array.isArray(input.labelCandidates)?input.labelCandidates:[]).filter(x=>x?.confirmed===false&&x?.source==='printed-label-hypothesis'&&typeof x.name==='string'&&typeof x.brand==='string');
 // The alternate brand belongs only to an explicitly unconfirmed page lookup.
 // It never mutates or confirms the photographed identity.
 const candidate=printed.length===1?printed[0]:null;
 const i=ident(candidate?{...input,name:candidate.name,brand:candidate.brand,size:candidate.size||input.size,model:'',color:'',requiresModelConfirmation:true}:input),label=String(candidate?.name||input.suggestedLabel||'');i.suggestedLabel=label;
 if(!i.requiresModelConfirmation||!i.brand||(!label&&/^(product|item|unknown)$/i.test(i.object)))return [];
 const hypotheses=(Array.isArray(input.suggestedModels)?input.suggestedModels:[]).filter(x=>x?.confirmed===false&&x?.source==='visual-model-hypothesis'&&typeof x.name==='string').slice(0,3);const labels=label?[label]:hypotheses.map(x=>x.name);const familyOnly=!labels.length;const candidateMatches=name=>familyOnly?words(i.brand).every(w=>words(name).includes(w))&&words(i.object).every(w=>words(name).includes(w)):labels.some(suggestedLabel=>candidateLabelMatches(name,{...i,suggestedLabel}));
 // Research more than the first visual hypothesis, within a fixed request budget.
 const queries=[...new Set(labels.length?labels:[i.name])].slice(0,2);
 const discovered=await Promise.all(queries.map(async query=>{
  const candidateSearch={...i,name:query,searchQuery:query,model:''};
  let found=retailerCandidateUrls(candidateSearch);if(!found.length)found=await nativeRetailerUrls(candidateSearch);
  const color=clean(i.color);const searchQuery=[query,color].filter(Boolean).join(' ');
  try{const r=await fetch('https://www.bing.com/search?format=rss&q='+encodeURIComponent(searchQuery),{signal:AbortSignal.timeout(3500)});if(r.ok){for(const m of (await r.text()).matchAll(/<item>([\s\S]*?)<\/item>/gi)){const title=clean((m[1].match(/<title>([\s\S]*?)<\/title>/i)||[])[1]);if(candidateMatches(title))found.push(clean((m[1].match(/<link>([\s\S]*?)<\/link>/i)||[])[1]));}}}catch{}
  return found;
 }));
 // Interleave hypotheses so one search cannot consume every page check.
 let urls=[];for(let n=0;n<Math.max(...discovered.map(x=>x.length));n++)for(const list of discovered)if(list[n])urls.push(list[n]);
 urls=[...new Set(urls)].filter(v=>{try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!/^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname)&&!/^\[|^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)&&u.hostname.includes('.')&&!u.hostname.endsWith('.local');}catch{return false}}).slice(0,4);
 const checks=[];const pages=await Promise.all(urls.map(async url=>{try{let r;const signal=AbortSignal.timeout(6500);let target=url;for(let hop=0;hop<3;hop++){r=await fetch(target,{redirect:'manual',headers:{accept:'text/html','user-agent':'FindItNearby/42.0','accept-language':'en-ZA,en;q=0.9'},signal});if(![301,302,303,307,308].includes(r.status))break;const next=new URL(r.headers.get('location')||'',target);if(next.protocol!=='https:'||next.hostname.replace(/^www\./,'')!==new URL(url).hostname.replace(/^www\./,''))break;target=next.href;}checks.push({host:new URL(url).hostname,status:r?.status});if(!r.ok)return null;const raw=(await r.text()).slice(0,2000000);
 for(const x of structuredProductNodes(raw)){if(![x['@type']].flat().some(t=>String(t).toLowerCase()==='product'))continue;const brand=clean(x.brand?.name||x.brand),name=clean(clean(x.name)===brand?x.description:x.name);
 if(!candidateMatches(name))continue;
 if(i.barcode&&![x.gtin,x.gtin8,x.gtin12,x.gtin13,x.gtin14].map(String).includes(i.barcode))continue;
 const identity={...i,name,model:'',searchQuery:name,requiresModelConfirmation:false,suggestedLabel:'',userConfirmed:false};
 const p=structuredProduct(raw,identity);if(!p)continue;
 return {name,url,identity,raw,price:p.priceConflict?null:p.price,currency:p.currency,availability:p.availability,photoMatchConfirmed:false};
 }return null;}catch(e){checks.push({host:new URL(url).hostname,error:e.name||'FetchError'});return null}}));
 const result=pages.filter(Boolean).filter((p,n,a)=>a.findIndex(x=>x.name.toLowerCase()===p.name.toLowerCase())===n).slice(0,2);Object.defineProperty(result,'checks',{value:checks});return result;
}
