const words=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

// A confirmed visual model does not establish an uncorroborated retail colour
// or clothing size. Keep those priced pages available for explicit review.
export function photoVariantNeedsConfirmation(offer,i,family){
 if(i.userConfirmed===true||!/(?:vision|printed-label|label-reading)/i.test(i.identificationMethod||'')||i.barcode)return false;
 const code=words(offer.sku).replace(/ /g,'');
 if(code&&words(i.model).replace(/ /g,'')===code)return false;
 const attrs=offer.comparisonAttributes||{},brand=words(i.brand),title=brand?(' '+words(offer.product_name)+' ').replace(' '+brand+' ',' ').trim():words(offer.product_name);
 // Model agreement cannot establish an unread bottle volume or pack quantity.
 // Keep the source listing visible for review without assigning its price/stock
 // to the photographed variant. Typed confirmation and exact codes above remain.
 const packaged=['beauty','household','pet','medical'].includes(family);
 const purchaseQuantity=/\b\d+(?:[.,]\d+)?\s*(?:ml|cl|l|fl\s*oz|oz|g|kg|rolls?|sheets?|tablets?|capsules?|sachets?|pieces?|pack)\b|\b(?:pack|box|case|set)\s+of\s+\d+\b/i;
 if(packaged&&!String(i.size||'').trim()&&(String(attrs.size||'').trim()||purchaseQuantity.test(offer.product_name||'')))return true;
 const colourSensitive=['electronics','music','clothing','footwear','bags','furniture','home','vehicle'].includes(family);
 const colours=/\b(?:black|white|blue|red|green|pink|brown|grey|gray|silver|gold|beige|purple|orange|yellow|lilac|raspberry|navy|ivory)\b/;
 if(colourSensitive&&!String(i.color||'').trim()&&(String(attrs.color||'').trim()||colours.test(title)))return true;
 return ['clothing','footwear'].includes(family)&&!String(i.size||'').trim()&&(offer.comparisonAmbiguous===true||Boolean(String(attrs.size||'').trim())||/\b(?:uk|us|eu)\s*\d{1,2}(?:\s*\d)?\b/.test(title));
}
