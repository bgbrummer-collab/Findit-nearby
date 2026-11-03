import {normalizeProductQuantities} from './product-quantities.js';

const text=value=>String(value||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const words=value=>text(value).toLowerCase().replace(/[^a-z0-9]+/g,' ').split(' ').filter(Boolean);
function onPrimaryPage(record,pageUrl){
 const address=record?.url||record?.['@id'];if(typeof address!=='string')return false;
 try{
  const actual=new URL(address,pageUrl),expected=new URL(pageUrl);
  const host=u=>u.hostname.toLowerCase().replace(/^www\./,''),path=u=>u.pathname.replace(/%[0-9a-f]{2}/gi,c=>c.toUpperCase()).replace(/\/$/,'');
  if(!/^https?:$/.test(actual.protocol)||host(actual)!==host(expected)||path(actual)!==path(expected))return false;
  const wanted=expected.searchParams.get('variant'),given=actual.searchParams.get('variant');
  return !wanted||!given||wanted===given;
 }catch{return false;}
}
function purchaseQuantities(value){
 return new Set([...text(value).matchAll(/\b\d+(?:[.,]\d+)?\s*(?:millilit(?:er|re)s?|ml|lit(?:er|re)s?|l|kilograms?|kg|grams?|g)\b/gi)].map(m=>normalizeProductQuantities(m[0]).toLowerCase()));
}

// Research only: a ProductGroup's common description is not a new offer, SKU,
// barcode or source of identity. The caller must match the child independently.
export function primaryGroupDescription(record,records,pageUrl){
 if(record.description||!onPrimaryPage(record,pageUrl))return '';
 for(const group of records){
  if(![group?.['@type']].flat().some(t=>String(t).toLowerCase()==='productgroup')||!group.description||!Array.isArray(group.hasVariant)||!group.hasVariant.includes(record)||!onPrimaryPage(group,pageUrl))continue;
  const parent=words(group.name),child=words(record.name);
  if(!parent.length||!parent.every(w=>child.includes(w)))continue;
  const groupBrand=words(group.brand?.name||group.brand),childBrand=words(record.brand?.name||record.brand);
  if(childBrand.length&&groupBrand.length&&groupBrand.join(' ')!==childBrand.join(' '))continue;
  const quantities=purchaseQuantities(group.description),childQuantities=purchaseQuantities([record.name,record.size?.value||record.size].filter(Boolean).join(' '));
  if([...quantities].some(q=>!childQuantities.has(q)))continue;
  // Some catalogues append a pipe/bullet pack annotation after the final
  // sentence. Validate it above, then keep it out of prose/strength extraction;
  // otherwise the sentence reader mistakes the preceding complete fact for a
  // truncated sentence. The child's published name/size still carries quantity.
  return String(group.description).slice(0,12000).replace(/\s*\|\s*[*•]\s*(?:weight|pack(?:\s+size)?|volume)\s*:[^|]*$/i,'');
 }
 return '';
}
