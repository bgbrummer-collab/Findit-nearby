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
export function productPagePriceConditions(raw){
 const block=String(raw||'').match(/<div\b[^>]*class=["'][^"']*\bproduct-nappi-disclaimer\b[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/i);
 if(!block)return '';
 return block[1].replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim().replace(/^disclaimer:\s*/i,'').slice(0,600);
}
