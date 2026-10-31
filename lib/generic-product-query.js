// A type or brand + type is not an exact model, regardless of how confidently
// the user typed it. Specific codes and multiword model names remain intact.
export function genericProductQuery(value){
 const q=String(value||'').trim().replace(/\s+(?:black|white|blue|red|green|pink|brown|grey|gray|silver|gold)$/i,''),match=q.match(/^(.*?)\b(headphones?|headsets?|earbuds?|earphones?|computer mouse|gaming mouse|mouse ?pads?|mouse|keyboards?|rowing machines?|treadmills?|exercise bikes?|blood pressure monitors?|blood glucose meters?|thermometers?|cameras?(?: body)?|cars?|printers?|shoes?|sneakers?|microphones?)$/i);
 if(!match)return null;const prefix=match[1].trim(),modifiers=/^(?:(?:wireless|wired|gaming|mechanical|bluetooth|optical|digital|automatic|electric|medical|gym|fitness|indoor|upper arm|over ear|on ear|in ear|black|white|blue|red|green|grey|gray|silver|gold)\s*)+$/i;
 if(prefix&&!modifiers.test(prefix)&&(/\d|\s/.test(prefix)||/^(?:pro|plus|max|mini|ultra)$/i.test(prefix)))return null;
 const object=match[2].toLowerCase().replace(/^gaming mouse$/,'mouse').replace(/^cameras? body$/,'camera').replace(/^mousepad$/,'mouse pad');
 return {brand:prefix&&!modifiers.test(prefix)?prefix:'',object};
}
