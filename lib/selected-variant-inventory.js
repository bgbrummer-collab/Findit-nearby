// A buyable Shopify variant can have zero inventory and allow backorders.
// Only downgrade schema stock when the primary rendered variant and SKU agree.
const attr=(tag,name)=>tag.match(new RegExp('\\b'+name+'\\s*=\\s*["\']([^"\']*)["\']','i'))?.[1];
export function selectedVariantInventory(raw,url,sku){
 let variant;try{variant=new URL(url).searchParams.get('variant');}catch{return undefined;}
 if(!/^\d+$/.test(variant||'')||!sku)return undefined;
 const html=String(raw||'').slice(0,2000000),scopes=new Set();
 for(const m of html.matchAll(/<input\b[^>]*>/gi)){
  const tag=m[0],scope=attr(tag,'data-dynamic-variant-content')?.match(/^(.+__main)-.+-input-id$/)?.[1];
  if(scope&&attr(tag,'name')==='id'&&attr(tag,'value')===variant)scopes.add(scope);
 }
 if(scopes.size!==1)return undefined;
 const scope=[...scopes][0];
 const skuTag=[...html.matchAll(/<div\b[^>]*>/gi)].find(m=>(attr(m[0],'data-dynamic-variant-content')||'').startsWith(scope+'-vendor_sku'));
 if(!skuTag)return undefined;
 const skuBody=html.slice(skuTag.index+skuTag[0].length).split('</div>')[0];
 if(skuBody.match(/class=["']product-sku__value["'][^>]*>\s*([^<]+)/)?.[1]?.trim()!==String(sku))return undefined;
 const blocks=[...html.matchAll(/<product-inventory\b[^>]*>([\s\S]*?)<\/product-inventory>/gi)].filter(m=>[...m[1].matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].some(s=>(attr(s[1],'data-dynamic-variant-content')||'').startsWith(scope+'-inventory_status')));
 if(blocks.length!==1)return undefined;
 const tag=blocks[0][0].slice(0,blocks[0][0].indexOf('>')+1),quantity=attr(tag,'data-inventory-quantity'),available=attr(tag,'data-variant-available'),policy=attr(tag,'data-inventory-policy');
 if(!/^-?\d+$/.test(quantity||'')||Number(quantity)>0)return undefined;
 if(available==='false')return 'out_of_stock';
 if(available==='true'&&policy==='continue')return 'backorder';
 return null; // contradictory zero-stock metadata cannot support in-stock
}
