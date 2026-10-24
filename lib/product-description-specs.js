// Parse only an already verified product's description, never the whole page.
export function descriptionTableSpecifications(html){
 const rows=[],seen=new Set(),text=v=>String(v||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();
 for(const table of String(html||'').slice(0,250000).matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)){
  for(const row of table[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
   const cells=[...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(x=>text(x[1]));if(cells.length!==2)continue;
   const [name,value]=cells,key=(name+'|'+value).toLowerCase();
   if(!name||!value||name.length>100||value.length>240||seen.has(key)||/^(specifications?|features?|name|attribute|property)$/i.test(name)||/shipping|delivery|payment|returns?|review|price|discount/i.test(name))continue;
   seen.add(key);rows.push({name,value});if(rows.length>=24)return rows;
  }
 }
 // Some verified descriptions use a technical heading and bold labels with
 // line breaks instead of a table. Require both structures, so marketing,
 // footer contact details and arbitrary colon-separated prose stay excluded.
 for(const section of String(html||'').slice(0,250000).matchAll(/<h[2-4]\b[^>]*>\s*(?:Tech(?:nical)?\s+Specs?|Technical\s+Specifications?|Specifications?)\s*<\/h[2-4]>\s*((?:<p\b[^>]*>[\s\S]*?<\/p>\s*){1,3})/gi)){
  for(const line of section[1].split(/<br\s*\/?\s*>|<\/p>/gi)){
   const pair=line.replace(/^\s*<p\b[^>]*>/i,'').trim().match(/^((?:<(?:strong|b)\b[^>]*>[^<]+<\/(?:strong|b)>\s*)+):\s*([\s\S]+)$/i);
   if(!pair)continue;
   const name=text(pair[1]),value=text(pair[2]),key=(name+'|'+value).toLowerCase();
   if(!name||!value||name.length>100||value.length>240||seen.has(key)||/shipping|delivery|payment|returns?|review|price|discount|contact|phone|email|address/i.test(name))continue;
   seen.add(key);rows.push({name,value});if(rows.length>=24)return rows;
  }
 }
 return rows;
}

// These blocks are product-specific on Magento pages; never scan arbitrary tables.
export function additionalProductSpecifications(raw){
 const table=String(raw||'').match(/<table\b[^>]*\bid=["']product-attribute-specs-table["'][^>]*>[\s\S]*?<\/table>/i);
 return table?descriptionTableSpecifications(table[0]):[];
}
function divWithClass(raw,name){
 const opening=[...String(raw||'').matchAll(/<div\b[^>]*>/gi)].find(tag=>(tag[0].match(/\sclass\s*=\s*["']([^"']*)["']/i)?.[1]||'').split(/\s+/).includes(name));
 if(!opening)return '';
 const rest=raw.slice(opening.index+opening[0].length);let depth=1;
 for(const tag of rest.matchAll(/<\/?div\b[^>]*>/gi)){depth+=/^<\//.test(tag[0])?-1:1;if(!depth)return rest.slice(0,tag.index);}
 return '';
}
export function productPagePriceConditions(raw){
 const text=value=>String(value||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();
 const conditions=[],block=String(raw||'').match(/<div\b[^>]*class=["'][^"']*\bproduct-nappi-disclaimer\b[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/i);
 if(block)conditions.push(text(block[1]).replace(/^disclaimer:\s*/i,''));
 // Magento's primary product block excludes header/search templates and
 // recommendation prices. A global loyalty logo is not a price condition.
 const html=String(raw||'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi,'');
 const main=divWithClass(html,'product-info-main'),price=divWithClass(main,'price-box')||divWithClass(divWithClass(html,'product-info-right-row-shop'),'price-box');
 if(/class=["'][^"']*\bplusmore-price\b[^"']*\bspecial\b/i.test(price)&&/class=["'][^"']*\bplusmore-text\b/i.test(price)){
  conditions.push('Retailer marks this as a +more price. Check eligibility and sale terms on the product page.');
  const expiry=text(price).match(/Sale ends\s+(?:[A-Za-z]+,\s+)?\d{1,2}\s+[A-Za-z]+\s+\d{4}/i);if(expiry)conditions.push(expiry[0]+'.');
 }
 return conditions.filter(Boolean).join(' ').slice(0,600);
}

// Preserve published values and provenance while collapsing synonymous catalogue
// fields. A number without a unit must never acquire one from a different field.
export function normalizePublishedSpecifications(rows){
 const aliases=new Map([['sku','Retailer product code'],['sku / product code','Retailer product code'],['product main barcode','Barcode'],['product drugschedule','Drug schedule'],['product nappi code','NAPPI code'],['product bmc value','Retailer BMC code'],['product reference number','Retailer reference number']]);
 const result=[],seen=new Set();
 for(const row of rows||[]){
  let name=aliases.get(String(row.name||'').toLowerCase())||row.name;
  if(/^pack size$/i.test(name)&&/^\d+(?:[.,]\d+)?$/.test(String(row.value).trim()))name='Pack size (unit not supplied by source)';
  const key=[name,String(row.value).trim(),row.sourceUrl||''].join('|');
  if(seen.has(key))continue;
  seen.add(key);result.push({...row,name});
 }
 // Some shops mirror their SKU into schema.org mpn. Keep that provenance
 // explicit rather than presenting the same number as an independently known MPN.
 for(const row of result){
  if(row.name!=='Manufacturer part number')continue;
  const sku=result.find(s=>s.name==='Retailer product code'&&s.value===row.value&&(s.sourceUrl||'')===(row.sourceUrl||''));
  if(sku){sku.sourceAlsoListsAsMpn=true;row._duplicate=true;}
 }
 return result.filter(row=>!row._duplicate);
}
