import {categoryWords} from './category-words.js';
const text=i=>[i.name,i.object,i.category,i.retailCategory,i.brand,i.model,i.searchQuery,i.query].filter(Boolean).join(' ').toLowerCase();
export function specializedProductFamily(i={}){
 const s=text(i);
 if(categoryWords(/blood pressure|sphygmomanometer|blood glucose|glucose meter|glucometer|pulse oximeter|nebuliser|nebulizer|medical device|medical equipment|medicine|medication|pharmaceutical|first aid|wound dressing|bandage|wheelchair|crutches|paracetamol|ibuprofen|thermometer/,s))return 'medical';
 if(categoryWords(/gym machine|gym equipment|fitness equipment|rowing machine|indoor rower|rowerg|treadmill|elliptical|exercise bike|stationary bike|weight bench|leg press|lat pulldown|smith machine|dumbbell|barbell|kettlebell|weight plates/,s))return 'fitness';
 const vehicle=categoryWords(/car|vehicle|sedan|coupe|hatchback|suv|bakkie|pickup|automobile|motorcycle|toyota|ford|bmw|audi|volkswagen|mercedes|hyundai|kia|renault|nissan|honda|suzuki|mazda|isuzu|volvo|subaru/,s);
 const part=categoryWords(/car parts|car mat|car cover|bumper|headlight|wiper|tyre|tire|brake pad|spark plug|engine oil|oil filter|generator|lawn mower|outboard/,s);
 if(vehicle&&!part)return 'vehicle';
 if(categoryWords(/light bulb|smart bulb|led bulb|e27 bulb|pruning shears|secateurs|garden tool|garden hose/,s))return 'hardware';
 return null;
}
export function specializedShopTags(i={}){
 const family=specializedProductFamily(i);return family==='medical'?['medical_supply','chemist']:family==='fitness'?['sports']:family==='vehicle'?['car']:null;
}
