const words=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

// A confirmed visual model does not establish an uncorroborated retail colour
// or clothing size. Keep those priced pages available for explicit review.
export function photoVariantNeedsConfirmation(offer,i,family){
 if(i.userConfirmed===true||!/(?:vision|printed-label|label-reading)/i.test(i.identificationMethod||'')||i.barcode)return false;
 const code=words(offer.sku).replace(/ /g,'');
 if(code&&words(i.model).replace(/ /g,'')===code)return false;
 const attrs=offer.comparisonAttributes||{},brand=words(i.brand),title=brand?(' '+words(offer.product_name)+' ').replace(' '+brand+' ',' ').trim():words(offer.product_name);
 const colourSensitive=['electronics','music','clothing','footwear','bags','furniture','home','vehicle'].includes(family);
 const colours=/\b(?:black|white|blue|red|green|pink|brown|grey|gray|silver|gold|beige|purple|orange|yellow|lilac|raspberry|navy|ivory)\b/;
 if(colourSensitive&&!String(i.color||'').trim()&&(String(attrs.color||'').trim()||colours.test(title)))return true;
 return ['clothing','footwear'].includes(family)&&!String(i.size||'').trim()&&(offer.comparisonAmbiguous===true||Boolean(String(attrs.size||'').trim())||/\b(?:uk|us|eu)\s*\d{1,2}(?:\s*\d)?\b/.test(title));
}
