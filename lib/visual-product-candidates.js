import {manufacturerResearchUrls,manufacturerProductData,expandedPrimaryProduct} from './manufacturer-product-information.js';
import {visualObjectFamily} from './vision-consensus.js';
import {productPagePriceConditions} from './product-description-specs.js';
import {nativeRetailerUrls} from './native-retailer-discovery.js';
import {ident, retailerCandidateUrls, structuredProductNodes, structuredProduct} from './product-intelligence-core.js';
const words=v=>String(v||'').toLowerCase().replace(/&amp;|&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim().split(' ').filter(Boolean);
const clean=v=>String(v||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
// Quantities are checked separately from label words. Removing them from a
// discovery query never confirms a pack size or converts fluid ounces to ml.
const quantityPattern=/\b\d+(?:[.,]\d+|\s+\d+)?\s*(?:fl\.?\s*oz\.?|fluid ounces?|millilit(?:re|er)s?|ml|kilograms?|kg|grams?|g|lit(?:re|er)s?|l|ounces?|oz)\b\.?/gi;
export const labelSearchName=v=>String(v||'').replace(quantityPattern,' ').replace(/\s+/g,' ').trim();
function labelQuantity(v){
 const hit=String(v||'').match(quantityPattern)?.[0];if(!hit)return '';
 const amount=hit.match(/^\d+(?:[.,]\d+)?/)?.[0],unit=hit.replace(/^[\d.,\s]+/,'').toLowerCase().replace(/[.\s]/g,'');
 if(!amount||/^\d+\s+\d/.test(hit))return hit.toLowerCase().replace(/(fl|oz)\./g,'$1').replace(/\s+/g,' ').trim();
 const volume=/^(ml|millilitres?|milliliters?|l|litres?|liters?)$/.test(unit),weight=/^(kg|kilograms?|g|grams?)$/.test(unit),large=/^(l|litres?|liters?|kg|kilograms?)$/.test(unit);
 return Number(amount.replace(',','.'))*(large?1000:1)+(volume?'ml':weight?'g':/^(floz|fluidounces?)$/.test(unit)?'floz':unit);
}

function oneEdit(a,b){if(a===b)return true;if(a.length<4||b.length<4||/\d/.test(a+b)||Math.abs(a.length-b.length)>1)return false;let x=0,y=0,edits=0;while(x<a.length&&y<b.length){if(a[x]===b[y]){x++;y++;continue}if(++edits>1)return false;if(a.length>=b.length)x++;if(b.length>=a.length)y++;}return edits+(x<a.length||y<b.length?1:0)<=1;}
// OCR corrections only propose a candidate. They never confirm the photo identity.
export function candidateLabelMatches(name,i){
 const target=words(labelSearchName(name)),brand=words(i.brand),label=words(labelSearchName(i.suggestedLabel));
 if(!brand.length?!(i.printedLabelOnly&&(i.size||labelQuantity(i.suggestedLabel))):!brand.every(w=>target.includes(w)))return false;
 const tokens=[...new Set(label.filter(w=>!brand.includes(w)))];
 if(tokens.length+(labelQuantity(i.suggestedLabel)?1:0)<2&&!tokens.some(w=>/[a-z]/.test(w)&&/\d/.test(w)))return false;
 let corrections=0;for(const token of tokens){if(target.includes(token))continue;if(!target.some(w=>oneEdit(token,w))||++corrections>1)return false;}
 const colors=['black','white','blue','red','green','pink','brown','grey','gray','silver','gold','purple'];
 const wanted=words([i.color,i.suggestedLabel].join(' ')).filter(w=>colors.includes(w));
 if(wanted.length&&colors.some(c=>target.includes(c)&&!wanted.includes(c)))return false;
 if(/conditioner/i.test(i.object)&&/shampoo/i.test(name)&&!/conditioner/i.test(name))return false;
 if(i.size){const selected=labelQuantity(i.size),listed=labelQuantity(name);if(selected?selected!==listed:!(' '+words(name).join(' ')+' ').includes(' '+words(i.size).join(' ')+' '))return false;}
 // An explicit same-unit disagreement is a different pack, even for a proposal.
 const desiredQuantity=labelQuantity(i.suggestedLabel),givenQuantity=labelQuantity(name);
 if(desiredQuantity&&givenQuantity&&((/ml$/.test(desiredQuantity)&&/g$/.test(givenQuantity))||(/g$/.test(desiredQuantity)&&/ml$/.test(givenQuantity))))return false;
 if(desiredQuantity&&givenQuantity&&desiredQuantity.replace(/[\d,.\s]/g,'')===givenQuantity.replace(/[\d,.\s]/g,'')&&desiredQuantity.replace(/(?<=\d)\s+(?=[a-z])/g,'')!==givenQuantity.replace(/(?<=\d)\s+(?=[a-z])/g,''))return false;
 return true;
}
// A product-family phrase is not a visual model hypothesis. Retain catalogue
// browsing when no hypotheses exist, but never use generic words to outrank a model.
export function specificVisualModel(name,i){
 const generic=new Set([...words(i.brand),...words(i.object),...words(i.category),'gaming','game','headset','headsets','headphone','headphones','wireless','wired','bluetooth','stereo','over','ear','ears','audio','product','item','black','white','silver','grey','gray']);
 const terms=words(name).filter(w=>!generic.has(w));
 return terms.some(w=>w.length>=2&&/[a-z]/.test(w));
}
export async function visualProductCandidates(input){
 const uncertain=(Array.isArray(input.visualHypotheses)?input.visualHypotheses:[]).filter(h=>h?.confirmed===false&&h?.source==='single-visual-model-hypothesis'&&typeof h.brand==='string'&&typeof h.model==='string'&&typeof h.name==='string'&&h.brand.trim()&&h.model.trim()&&visualObjectFamily(h)===visualObjectFamily(input));
 if(input.requiresModelConfirmation&&!input.brand&&uncertain.length===1){
  const h=uncertain[0];if(!specificVisualModel(h.name,{...input,brand:h.brand}))return [];
  const rows=await visualProductCandidates({...input,brand:h.brand,visualHypotheses:[],suggestedLabel:'',labelCandidates:[],suggestedModels:[{name:h.name,confirmed:false,source:'visual-model-hypothesis'}]});
  for(const row of rows)row.hypothesisNote='This possible product comes from one image reader’s suggestion. Its brand and model are not independently confirmed in your photo.';
  return rows;
 }

 const printed=(Array.isArray(input.labelCandidates)?input.labelCandidates:[]).filter(x=>x?.confirmed===false&&x?.source==='printed-label-hypothesis'&&typeof x.name==='string'&&typeof x.brand==='string');
 // The alternate brand belongs only to an explicitly unconfirmed page lookup.
 // It never mutates or confirms the photographed identity.
 const candidate=printed.length===1?printed[0]:null;
 const i=ident(candidate?{...input,name:candidate.name,brand:candidate.brand,size:input.size||'',model:'',color:'',requiresModelConfirmation:true}:input),label=String(candidate?.name||input.suggestedLabel||'');i.suggestedLabel=label;
 i.printedLabelOnly=Boolean(candidate&&!candidate.brand&&candidate.manufacturer&&candidate.size);
 if(!i.requiresModelConfirmation||(!i.brand&&!i.printedLabelOnly)||(!label&&/^(product|item|unknown)$/i.test(i.object)))return [];
 const suggested=(Array.isArray(input.suggestedModels)?input.suggestedModels:[]).filter(x=>x?.confirmed===false&&x?.source==='visual-model-hypothesis'&&typeof x.name==='string').slice(0,3),hypotheses=suggested.filter(x=>specificVisualModel(x.name,i));if(!label&&suggested.length&&!hypotheses.length)return [];const labels=label?[label]:hypotheses.map(x=>x.name);const familyOnly=!labels.length;const candidateMatches=name=>familyOnly?words(i.brand).every(w=>words(name).includes(w))&&words(i.object).every(w=>words(name).includes(w)):labels.some(suggestedLabel=>candidateLabelMatches(name,{...i,suggestedLabel}));
 // Research more than the first visual hypothesis, within a fixed request budget.
 const queries=[...new Set((labels.length?labels:[i.name]).map(labelSearchName))].slice(0,2);
 const discovered=await Promise.all(queries.map(async query=>{
  const candidateSearch={...i,name:query,searchQuery:query,model:''};
  let found=[...retailerCandidateUrls(candidateSearch),...manufacturerResearchUrls(candidateSearch)];if(!found.length)found=await nativeRetailerUrls(candidateSearch);
  const color=clean(i.color);const searchQuery=[query,color].filter(Boolean).join(' ');
  try{const r=await fetch('https://www.bing.com/search?format=rss&q='+encodeURIComponent(searchQuery),{signal:AbortSignal.timeout(3500)});if(r.ok){for(const m of (await r.text()).matchAll(/<item>([\s\S]*?)<\/item>/gi)){const title=clean((m[1].match(/<title>([\s\S]*?)<\/title>/i)||[])[1]);if(candidateMatches(title))found.push(clean((m[1].match(/<link>([\s\S]*?)<\/link>/i)||[])[1]));}}}catch{}
  return found;
 }));
 // Interleave hypotheses so one search cannot consume every page check.
 let urls=[];for(let n=0;n<Math.max(...discovered.map(x=>x.length));n++)for(const list of discovered)if(list[n])urls.push(list[n]);
 urls=[...new Set(urls)].filter(v=>{try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!/^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname)&&!/^\[|^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)&&u.hostname.includes('.')&&!u.hostname.endsWith('.local');}catch{return false}}).slice(0,4);
 const checks=[];const pages=await Promise.all(urls.map(async url=>{try{let r;const documentRaw=await manufacturerProductData(url,i,undefined,check=>checks.push(check));const signal=AbortSignal.timeout(6500);let target=url;if(documentRaw)r=new Response(documentRaw);else for(let hop=0;hop<3;hop++){r=await fetch(target,{redirect:'manual',headers:{accept:'text/html','user-agent':'FindItNearby/42.0','accept-language':'en-ZA,en;q=0.9'},signal});if(![301,302,303,307,308].includes(r.status))break;const next=new URL(r.headers.get('location')||'',target);if(next.protocol!=='https:'||next.hostname.replace(/^www\./,'')!==new URL(url).hostname.replace(/^www\./,''))break;target=next.href;}checks.push({host:new URL(url).hostname,status:r?.status});if(!r.ok)return null;const originalRaw=(await r.text()).slice(0,2000000),sourceRaw=await manufacturerProductData(url,i,originalRaw)||originalRaw,raw=expandedPrimaryProduct(sourceRaw,url,title=>candidateMatches(title)&&visualObjectFamily({name:title,object:''})===visualObjectFamily(i))||sourceRaw;
 for(const x of structuredProductNodes(raw)){if(![x['@type']].flat().some(t=>String(t).toLowerCase()==='product'))continue;const brand=clean(x.brand?.name||x.brand),name=clean(clean(x.name)===brand?x.description:x.name);
 if(!candidateMatches(name))continue;
 if(i.barcode&&![x.gtin,x.gtin8,x.gtin12,x.gtin13,x.gtin14].map(String).includes(i.barcode))continue;
 if(i.printedLabelOnly&&brand&&!words(brand).every(w=>words(name).includes(w)))continue;
 const identity={...i,name,brand:i.printedLabelOnly?brand:i.brand,model:'',searchQuery:name,requiresModelConfirmation:false,suggestedLabel:'',userConfirmed:false};
 const p=structuredProduct(raw,identity);if(!p)continue;
 return {name,url,identity,raw,quantityNote:labelQuantity(label)&&labelQuantity(label)!==labelQuantity(name)?'The photo label and this listing use different or incomplete quantity text. Confirm the pack size on your item; no unit conversion or size match has been assumed.':'',price:p.priceConflict?null:p.price,currency:p.currency,availability:p.availability,priceConditions:productPagePriceConditions(raw),photoMatchConfirmed:false};
 }return null;}catch(e){checks.push({host:new URL(url).hostname,error:e.name||'FetchError'});return null}}));
 const result=pages.filter(Boolean).filter((p,n,a)=>a.findIndex(x=>x.name.toLowerCase()===p.name.toLowerCase())===n).slice(0,2);Object.defineProperty(result,'checks',{value:checks});return result;
}
