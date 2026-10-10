// Retain independently supported visual details without promoting model guesses.
const norm=v=>String(v??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const families=[['headphones',/\b(headphones?|headsets?|over ear|on ear)\b/],['earbuds',/\b(earbuds?|earphones?)\b/],['microphone',/\b(microphones?|mic)\b/],['speaker',/\bspeakers?\b/],['conditioner',/\bconditioner\b/],['shampoo',/\bshampoo\b/],['shoes',/\b(shoes?|sneakers?|trainers?)\b/],['eyeglasses',/\b(eyeglasses?|eye glasses?|glasses|spectacles?|eyewear)\b/],['drill',/\bdrills?\b/],['toilet paper',/\b(toilet paper|toilet tissue)\b/],['body lotion',/\b(body lotion|body moisturiser|body moisturizer)\b/]];
function objectKey(i){const raw=norm(i.object),text=/^(tube|bottle|box|container|jar|packet|package|packaging|product|item|device|general)$/.test(raw)?norm(i.name):raw;for(const [key,re] of families)if(re.test(text))return key;if(/^(product|item|device|general|consumer product|electronic device|electronics|beauty)$/.test(text))return '';return text;}
function supported(rows,key){const values=rows.map(i=>String(i[key]??'').trim()).filter(v=>v&&!/^(null|unknown|none|n\/a)$/i.test(v)),keys=[...new Set(values.map(norm))];return keys.length===1&&values.length>=2?values[0]:'';}
export function reconcileVision(claims){
 const rows=claims.filter(i=>i&& !i.blocked),groups=new Map();
 for(const i of rows){const key=objectKey(i);if(key)groups.set(key,[...(groups.get(key)||[]),i]);}
 const candidates=[...groups].filter(([,v])=>v.length>=2).sort((a,b)=>b[1].length-a[1].length);
 if(!candidates.length||candidates[1]?.[1].length===candidates[0][1].length)return null;
 const [object,agreed]=candidates[0],brand=supported(agreed,'brand'),model=new Set(agreed.map(i=>norm(i.brand)).filter(Boolean)).size>1?'':supported(agreed,'model'),size=supported(agreed,'size'),color=supported(agreed,'color'),barcode=supported(agreed,'barcode');
 const fullName=supported(agreed,'name'),explicitModelConflict=new Set(agreed.map(i=>norm(i.model)).filter(Boolean)).size>1,brandConflict=new Set(agreed.map(i=>norm(i.brand)).filter(Boolean)).size>1,details=norm(fullName).split(' ').filter(w=>!norm(brand+' '+object).split(' ').includes(w)&&!['wireless','black','white','blue','red','silver','product','with','and'].includes(w)),specificLabel=!!fullName&&(details.length>=2||details.some(w=>/\d/.test(w)));
 const partial=explicitModelConflict||brandConflict||(!model&&!specificLabel),base=agreed[0],name=partial?[brand,object].filter(Boolean).join(' '):(supported(agreed,'name')||[brand,model,object,size,color].filter(Boolean).join(' '));
 return {...base,name,object,brand,model,size,color,barcode:barcode||null,searchQuery:name,confidence:partial?.65:.85,userConfirmed:false,identificationMethod:'independent-vision-consensus',identityScope:partial?'product-family':'model',requiresModelConfirmation:partial,unverifiedDetails:partial?['exact model','variant','specifications']:[],features:[],visibleText:[]};
}
