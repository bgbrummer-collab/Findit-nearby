// Retain independently supported visual details without promoting model guesses.
const norm=v=>String(v??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const families=[['headphones',/\b(headphones?|headsets?|over ear|on ear)\b/],['earbuds',/\b(earbuds?|earphones?)\b/],['microphone',/\b(microphones?|mic)\b/],['speaker',/\bspeakers?\b/],['conditioner',/\bconditioner\b/],['shampoo',/\bshampoo\b/],['shoes',/\b(shoes?|sneakers?|trainers?)\b/],['eyeglasses',/\b(eyeglasses?|eye glasses?|glasses|spectacles?|eyewear)\b/],['drill',/\bdrills?\b/],['toilet paper',/\b(toilet paper|toilet tissue)\b/],['body lotion',/\b(body lotion|body moisturiser|body moisturizer)\b/]];
function objectKey(i){const raw=norm(i.object),text=/^(tube|bottle|box|container|jar|packet|package|packaging|product|item|device|general)$/.test(raw)?norm(i.name):raw;for(const [key,re] of families)if(re.test(text))return key;if(/^(product|item|device|general|consumer product|electronic device|electronics|beauty)$/.test(text))return '';return text;}
function metricSize(v){const match=String(v||'').toLowerCase().match(/(\d+(?:\.\d+)?)\s*(ml|millilit(?:re|er)s?|lit(?:re|er)s?|l|kg|kilograms?|g|grams?)\b/);if(!match)return '';const unit=match[2],volume=/^(ml|millilit|l)/.test(unit),large=/^(l|lit|kg|kilogram)/.test(unit);return Number(match[1])*(large?1000:1)+' '+(volume?'ml':'g');}
function fieldKey(v,key){if(key==='size'&&metricSize(v))return metricSize(v);const text=norm(v);if(key==='model'||key==='size'||key==='barcode')return text.replace(/ /g,'');return key==='color'?text.replace(/\bgray\b/g,'grey'):text;}
function values(rows,key){return rows.map(i=>String(i[key]??'').trim()).filter(v=>v&&!/^(null|unknown|none|n\/a)$/i.test(v));}
function supported(rows,key){const vs=values(rows,key),keys=[...new Set(vs.map(v=>fieldKey(v,key)))];return keys.length===1&&vs.length>=2?(key==='size'&&metricSize(vs[0])||vs[0]):'';}
function conflicts(rows,key){return new Set(values(rows,key).map(v=>fieldKey(v,key))).size>1;}
function brandKey(v){const key=norm(v);return /^(beats(?: by (?:dr )?dre)?|apple beats)$/.test(key)?'beats':key;}
function corroboratedBrand(rows){const groups=new Map();for(const i of rows){const value=String(i.brand??'').trim(),key=brandKey(value);if(!key||/^(unknown|null|none|n a)$/.test(key))continue;groups.set(key,[...(groups.get(key)||[]),value]);}const ranked=[...groups.values()].sort((a,b)=>b.length-a.length);return ranked[0]?.length>=2&&ranked[0].length>(ranked[1]?.length||0)?(brandKey(ranked[0][0])==='beats'?'Beats':ranked[0][0]):'';}
// A single label reading is a suggestion for human review, never an exact identity.
function labelSuggestion(rows,brand){
 if(!brand)return '';
 for(const row of rows){
  if(brandKey(row.brand)!==brandKey(brand)||!row.model||!Array.isArray(row.visibleText))continue;
  const text=norm(row.visibleText.join(' ')),words=norm(row.model).split(' ').filter(Boolean);
  if(words.length<3||!words.every(word=>text.split(' ').includes(word)))continue;
  return [brand,String(row.model).trim()].join(' ');
 }
 return '';
}
export function reconcileVision(claims){
 const rows=claims.filter(i=>i&& !i.blocked),groups=new Map();
 for(const i of rows){const key=objectKey(i);if(key)groups.set(key,[...(groups.get(key)||[]),i]);}
 const candidates=[...groups].filter(([,v])=>v.length>=2).sort((a,b)=>b[1].length-a[1].length);
 if(!candidates.length||candidates[1]?.[1].length===candidates[0][1].length)return null;
 const [object,agreed]=candidates[0],brand=corroboratedBrand(agreed),model=new Set(agreed.map(i=>brandKey(i.brand)).filter(Boolean)).size>1?'':supported(agreed,'model'),size=supported(agreed,'size'),color=supported(agreed,'color'),barcode=supported(agreed,'barcode');
 const fullName=supported(agreed,'name'),explicitModelConflict=conflicts(agreed,'model'),brandConflict=new Set(agreed.map(i=>brandKey(i.brand)).filter(Boolean)).size>1,details=norm(fullName).split(' ').filter(w=>!norm(brand+' '+object).split(' ').includes(w)&&!['wireless','black','white','blue','red','silver','product','with','and'].includes(w)),specificLabel=!!fullName&&(details.length>=2||details.some(w=>/\d/.test(w)));
 const partial=explicitModelConflict||brandConflict||conflicts(agreed,'size')||conflicts(agreed,'color')||conflicts(agreed,'barcode')||(!model&&!specificLabel),base=agreed[0],name=partial?[brand,object].filter(Boolean).join(' '):(fullName&&(!model||fieldKey(fullName,'model').includes(fieldKey(model,'model')))?fullName:[brand,model,object,size,color].filter(Boolean).join(' '));
 return {...base,name,object,brand,model,size,color,suggestedLabel:partial?labelSuggestion(agreed,brand):'',barcode:barcode||null,searchQuery:name,confidence:partial?.65:.85,userConfirmed:false,identificationMethod:'independent-vision-consensus',identityScope:partial?'product-family':'model',requiresModelConfirmation:partial,unverifiedDetails:partial?['exact model','variant','specifications']:[],features:[],visibleText:[]};
}
