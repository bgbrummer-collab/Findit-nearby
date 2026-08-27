const PRIMARY_MODEL='gemini-3.5-flash-lite';
const FALLBACK_MODEL='gemini-2.5-flash';
const CONFIDENCE_MIN=.55;
const GEMINI_TIMEOUT_MS=12000;
const QUOTA_RE=/quota|rate.?limit|resource.?exhausted|too many requests/i;
const RESTRICTED=['firearm','gun','rifle','pistol','ammunition','ammo','weapon','knife','knives','machete','sword','switchblade','taser','stun gun','pepper spray','mace','brass knuckles','fireworks','explosive','vape','nicotine','cigarette','cigar','alcohol','beer','wine','liquor','cannabis','marijuana','thc','cbd','psilocybin','magic mushroom','gambling','sports betting','casino','pornography','adult sex toy'];

const RETAIL_RULES=[
 {test:/\b(tractor|combine harvester|harvester|agricultural machinery|farm machinery|farm equipment|john deere|massey ferguson|new holland|case ih|kubota)\b/i,category:'agricultural machinery',stores:['agricultural equipment dealer','farm machinery dealer','tractor dealer'],dealerBrand:true},
 {test:/\b(car|suv|bakkie|pickup truck|motorcycle|motorbike|vehicle)\b/i,category:'vehicle',stores:['authorised vehicle dealer','motor dealer'],dealerBrand:true},
 {test:/\b(excavator|bulldozer|loader|backhoe|grader|construction machinery|heavy equipment)\b/i,category:'heavy machinery',stores:['heavy equipment dealer','construction machinery dealer'],dealerBrand:true},
 {test:/\b(phone|smartphone|iphone|galaxy|pixel|mobile phone)\b/i,category:'mobile electronics',stores:['mobile phone store','electronics store','authorised brand store']},
 {test:/\b(laptop|computer|desktop|monitor|keyboard|mouse|router|wi fi router|wifi router|headphones|earbuds|speaker|microphone|camera|television|\btv\b)\b/i,category:'electronics',stores:['electronics store','computer store','authorised brand store']},
 {test:/\b(sneaker|sneakers|shoe|shoes|trainer|trainers|running shoe|football boot)\b/i,category:'footwear',stores:['shoe store','sportswear store','authorised brand store']},
 {test:/\b(shirt|t shirt|t-shirt|hoodie|jacket|jeans|dress|clothing|apparel)\b/i,category:'clothing',stores:['clothing store','fashion retailer','authorised brand store']},
 {test:/\b(eyeglasses|glasses|spectacles|sunglasses|eyewear|frames)\b/i,category:'eyewear',stores:['optician','eyewear store']},
 {test:/\b(toiletry bag|wash bag|travel pouch|cosmetic bag|makeup bag|travel bag|luggage|suitcase|backpack|rucksack|duffel|handbag|purse|wallet)\b/i,category:'bags & travel accessories',stores:['luggage store','bag store','department store','travel accessories store']},
 {test:/\b(toilet paper|tissue|detergent|cleaner|soap|shampoo|toothpaste|grocery|food|snack|drink|cereal|milk|bread)\b/i,category:'grocery/household',stores:['supermarket','grocery store','pharmacy']},
 {test:/\b(perfume|fragrance|makeup|cosmetic|skincare|moisturizer|serum|foundation|mascara|lipstick)\b/i,category:'beauty',stores:['beauty store','pharmacy','department store']},
 {test:/\b(fridge|refrigerator|washing machine|dishwasher|microwave|oven|air fryer|kettle|toaster|vacuum)\b/i,category:'home appliances',stores:['appliance store','electronics store','home retailer']},
 {test:/\b(drill|saw|hammer|screwdriver|power tool|toolbox|paint|cement|plumbing|hardware)\b/i,category:'hardware',stores:['hardware store','building supply store','tool retailer']},
 {test:/\b(pencil case|pen|pencil|notebook|stationery|printer paper|school supplies)\b/i,category:'stationery',stores:['stationery store','office supply store','bookstore']},
 {test:/\b(flower|flowers|plant|pot plant|garden plant|seedling)\b/i,category:'garden/florist',stores:['florist','garden centre','nursery']},
 {test:/\b(toy|lego|doll|action figure|board game|puzzle)\b/i,category:'toys',stores:['toy store','department store']}
];

const ID_SCHEMA={type:'OBJECT',properties:{
 object:{type:'STRING'},name:{type:'STRING'},brand:{type:'STRING',nullable:true},model:{type:'STRING',nullable:true},category:{type:'STRING'},searchQuery:{type:'STRING'},confidence:{type:'NUMBER'},visibleText:{type:'ARRAY',items:{type:'STRING'}},features:{type:'ARRAY',items:{type:'STRING'}},retailCategory:{type:'STRING'},likelyStoreTypes:{type:'ARRAY',items:{type:'STRING'}},summary:{type:'STRING'},
 productKind:{type:'STRING'},scaleClass:{type:'STRING'},brandEvidence:{type:'BOOLEAN'},modelEvidence:{type:'BOOLEAN'},evidence:{type:'ARRAY',items:{type:'STRING'}},verificationNote:{type:'STRING'},draftChanged:{type:'BOOLEAN'}
},required:['object','name','category','searchQuery','confidence','visibleText','features','retailCategory','likelyStoreTypes','summary','productKind','scaleClass','brandEvidence','modelEvidence','evidence','verificationNote','draftChanged']};

export default{async fetch(request){
 if(request.method!=='POST')return json({error:'POST only'},405);
 try{
  const key=process.env.GEMINI_API_KEY;if(!key)return json({error:'GEMINI_API_KEY is missing in Vercel.'},500);
  const form=await request.formData(),image=form.get('image');if(!image||typeof image.arrayBuffer!=='function')return json({error:'No image uploaded.'},400);if(!String(image.type||'').startsWith('image/'))return json({error:'Uploaded file must be an image.'},400);if(image.size>8*1024*1024)return json({error:'Image must be smaller than 8 MB.'},413);
  const lat=num(form.get('lat')),lon=num(form.get('lon')),base64=Buffer.from(await image.arrayBuffer()).toString('base64'),mime=image.type||'image/jpeg';
  const draft=await identifyDraft(key,base64,mime);
  const verified=await verifyDraft(key,base64,mime,draft).catch(()=>({...draft,verificationNote:'Second-pass verification was unavailable; using the first-pass identification with reduced confidence.',draftChanged:false,confidence:Math.min(Number(draft.confidence||0),.78)}));
  const identification=postProcess(verified,draft);
  if(isRestricted(identification))return json({identification,offers:[],blocked:true,verified:false,message:'FindIt cannot help search for restricted, dangerous or age-limited products.'});
  if(Number(identification.confidence||0)<CONFIDENCE_MIN)return json({identification,offers:[],blocked:false,verified:false,message:'The image was not identified confidently enough. Try a clearer photo showing the whole item, logo, packaging or model text.'});
  const products=await loadFeeds(),offers=matchProducts(identification,products,lat,lon);
  const exactOffers=offers.filter(o=>o.exactProductMatch);
  identification.exactProductMatch=exactOffers.length>0;
  identification.matchLevel=exactOffers.length?'exact':(identification.modelEvidence?'model-unverified':identification.brandEvidence?'brand-level':'category-level');
  return json({identification,offers,blocked:false,verified:exactOffers.length>0,visualVerification:true,message:exactOffers.length?'Verified exact retailer offer found from connected authorised product data.':offers.length?'Possible retailer matches found, but FindIt could not verify that they are the exact photographed product.':'The item was identified, but no connected authorised retailer feed returned a verified exact matching offer yet.'});
 }catch(e){console.error('FindIt /api/search error',e);const unavailable=Boolean(e?.fastFail)||QUOTA_RE.test(String(e?.message||''));return json({error:unavailable?'Image identification is temporarily busy. Please try again shortly.':'FindIt image search failed.',message:e.message||'Unknown error',retryable:true},unavailable?503:500)}
}};

async function generateStructured(key,model,prompt,b64,mime){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),GEMINI_TIMEOUT_MS);
 try{
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{parts:[{text:prompt},{inlineData:{mimeType:mime,data:b64}}]}],generationConfig:{responseMimeType:'application/json',responseSchema:ID_SCHEMA,temperature:.1}})});
  const raw=await r.json().catch(()=>({}));
  if(!r.ok){const e=Error(raw?.error?.message||`${model} failed`);e.fastFail=r.status===429||QUOTA_RE.test(e.message);throw e}
  const text=raw?.candidates?.[0]?.content?.parts?.find(p=>typeof p.text==='string')?.text;if(!text)throw Error(`${model} returned no identification text`);return JSON.parse(text);
 }catch(e){if(e?.name==='AbortError'){const x=Error(`${model} timed out after ${GEMINI_TIMEOUT_MS}ms`);x.fastFail=false;throw x}throw e}finally{clearTimeout(timer)}
}

async function identifyDraft(key,b64,mime){
 const prompt=`You are FindIt Nearby's first-pass product vision engine. Identify the ACTUAL physical item in the image, not merely words, artwork, branding, or another object depicted on it.
Accuracy is more important than being specific. Never invent a brand or exact model. If an exact model is not visually supported, set model to null and use a broader truthful name.
CRITICAL OBJECT RULE: decide what the user could physically pick up and buy. If a toiletry bag has a vintage map printed on it, the item is a toiletry bag, NOT a map. If a shirt has a car printed on it, the item is a shirt, NOT a car. If packaging shows a product, distinguish the package from the product. Decorative artwork, logos and printed subjects are evidence/features, not the physical item unless the image actually shows that object itself.
Before answering, explicitly distinguish the real photographed object from a toy, miniature, model, replica, packaging image, poster, screen image, accessory or branded merchandise.
Use object scale, surroundings, seams, zippers, handles, straps, openings, wheels, cabin, controls, proportions, material, packaging, labels, visible logos/text, model numbers, ports and distinctive geometry.
brandEvidence=true only when the PRODUCT brand is directly visible or unmistakably supported by strong visual evidence. A printed place name, artwork label, map text, character or decorative logo must not automatically become the product brand. modelEvidence=true only when the exact model name/number is directly visible or the visual design is uniquely diagnostic; otherwise model must be null. For packaged consumables, groceries, cosmetics, toiletries, hair-care and other label-driven products, an exact variant or model name must come from clearly readable label text. Never substitute a remembered product variant from packaging colour, shape or brand familiarity. For hand tools, dimensions, sizes and model numbers must be directly readable before they are placed in model, name or searchQuery; never infer a size from appearance.
productKind should be one of: real_product, toy, miniature, replica, packaging, image_of_product, accessory, unknown. scaleClass should be one of: full_size, handheld, wearable, tabletop, miniature, unknown.
Retail relevance is critical. Bags, toiletry bags, wash bags and travel pouches map to luggage/bag/travel-accessory retailers. A printed map on a bag does not make it a map/poster product. Phones map to mobile/electronics. Shoes to footwear/sportswear. Groceries to supermarkets. Eyewear to opticians.
When a specialist branded product is recognised, likelyStoreTypes should prioritise an authorised dealer for that brand.
Do not call ordinary eyeglasses safety/PPE without direct certification evidence.
searchQuery must describe the physical purchasable item itself. Include brand/model only when supported. Return structured JSON only.`;
 let last;for(const model of [PRIMARY_MODEL,FALLBACK_MODEL]){try{const x=await generateStructured(key,model,prompt,b64,mime);x.modelUsed=model;return x}catch(e){last=e}}throw last||Error('Gemini request failed');
}

async function verifyDraft(key,b64,mime,draft){
 const prompt=`You are FindIt Nearby's independent visual verifier. You are given a first-pass identification below. DO NOT rubber-stamp it. Inspect the image again from scratch and correct any mistake.

FIRST-PASS DRAFT:
${JSON.stringify(draft)}

Your job is to protect users from confident wrong matches. Check especially:
1. What is the actual physical purchasable object? Do not mistake artwork, a map print, photo, logo, character, vehicle picture or other decoration ON the item for the item itself.
2. Look for construction clues such as zippers, seams, handles, straps, fabric edges, packaging and scale. Example: a pouch with map artwork is a pouch/toiletry bag, not a map.
3. Is this the actual product, or a toy/miniature/replica/accessory/package/photo of a product?
4. Is the brand truly the product brand? If not, set brand=null and brandEvidence=false.
5. Is the exact model truly supported? If no readable model text or uniquely diagnostic design exists, set model=null and modelEvidence=false. Never guess. For packaged/label-driven products, exact variant wording must be present in readable visible text; brand familiarity is not enough. For tools, never invent a size, length or model number that is not readable in the image.
6. Does searchQuery describe the actual physical item rather than its decoration?
7. Are retailCategory and likelyStoreTypes places that genuinely sell this physical product type?
8. If the first pass was too specific, become less specific and lower confidence. Uncertainty is better than a wrong answer.

Use evidence[] to list the strongest visible reasons for the final answer. Set draftChanged=true if you corrected any meaningful field. verificationNote should briefly explain what you checked. Return structured JSON only.`;
 let last;for(const model of [PRIMARY_MODEL,FALLBACK_MODEL]){try{const x=await generateStructured(key,model,prompt,b64,mime);x.verifierModel=model;return x}catch(e){last=e}}throw last||Error('Verification failed');
}

function postProcess(i,draft={}){
 i.confidence=clamp(Number(i.confidence||0),0,1);i.brand=clean(i.brand);i.model=clean(i.model);i.visibleText=Array.isArray(i.visibleText)?i.visibleText.filter(Boolean).slice(0,12):[];i.features=Array.isArray(i.features)?i.features.filter(Boolean).slice(0,12):[];i.evidence=Array.isArray(i.evidence)?i.evidence.filter(Boolean).slice(0,10):[];i.likelyStoreTypes=Array.isArray(i.likelyStoreTypes)?i.likelyStoreTypes.filter(Boolean).map(String).slice(0,5):[];
 i.productKind=clean(i.productKind)||'unknown';i.scaleClass=clean(i.scaleClass)||'unknown';i.brandEvidence=Boolean(i.brandEvidence);i.modelEvidence=Boolean(i.modelEvidence);
 if(i.brand&&!i.brandEvidence){i.brand=null;i.confidence=Math.min(i.confidence,.72);i.brandRemovedForEvidence=true}
 if(i.model&&!i.modelEvidence){i.model=null;i.confidence=Math.min(i.confidence,.68);i.modelRemovedForEvidence=true}
 const labelFamily=norm([i.category,i.retailCategory,i.object].join(' '));
 const labelDriven=/grocery|food|bread|beverage|beauty|personal care|conditioner|shampoo|hair care|skincare|cosmetic|toiletr|household|cleaner|detergent/.test(labelFamily);
 const readableLabel=norm((i.visibleText||[]).join(' '));
 if(labelDriven&&readableLabel&&i.name){const brandText=norm(i.brand),objectText=norm(i.object);const generic=new Set(['product','item','pack','bottle','tube','loaf','hair','care','beauty','personal','food','white','black','conditioner','shampoo','bread']);const unsupported=norm(i.name).split(' ').filter(t=>t.length>3&&!generic.has(t)&&!readableLabel.includes(t)&&!brandText.includes(t)&&!objectText.includes(t));if(unsupported.length){i.name=[i.brand,i.object].filter(Boolean).join(' ')||i.object||i.name;i.searchQuery=i.name;i.model=null;i.modelEvidence=false;i.confidence=Math.min(i.confidence,.82);i.labelVariantReduced=true;i.verificationNote=(i.verificationNote?i.verificationNote+' ':'')+'FindIt removed unsupported variant wording that was not present in readable label text.'}}
 const draftName=norm([draft.object,draft.name,draft.brand,draft.model].join(' ')),finalName=norm([i.object,i.name,i.brand,i.model].join(' '));
 if(draftName&&finalName&&overlap(draftName,finalName)<.45){i.confidence=Math.min(i.confidence,.66);i.verifierDisagreement=true}
 if(/^(unknown|image_of_product|packaging)$/i.test(i.productKind))i.confidence=Math.min(i.confidence,.62);
 const all=norm([i.object,i.name,i.brand,i.model,i.category,i.searchQuery,i.summary,i.productKind,i.scaleClass,...i.visibleText,...i.features,...i.evidence].join(' '));
 const eyewear=/\b(glasses|eyeglasses|sunglasses|spectacles|eyewear|frames?)\b/.test(all),safetyClaim=/\b(safety|protective|ppe|industrial|laboratory|workshop)\b/.test(all),proof=/\b(ansi|z87|en166|en 166|ce marked|ppe|safety standard|impact rated|protective eyewear)\b/.test(norm(i.visibleText.join(' ')));
 if(eyewear&&safetyClaim&&!proof){const side=/side shield|side guard|wraparound/.test(all);i.object='eyeglasses';i.name=side?'Eyeglasses with Side Shields':'Eyeglasses';i.category='Eyewear';i.retailCategory='eyewear';i.likelyStoreTypes=['optician','eyewear store'];i.searchQuery=side?'eyeglasses with side shields':'eyeglasses';i.summary=side?'Eyeglasses with side-shield styling. No visible safety certification was detected, so FindIt is treating them as eyewear rather than confirmed PPE.':'Eyeglasses. No visible evidence supports classifying them as industrial safety equipment.';i.confidence=Math.min(i.confidence,.82);i.classificationAdjusted=true}
 const rule=RETAIL_RULES.find(r=>r.test.test(all));
 if(rule){i.retailCategory=rule.category;const brand=i.brand?String(i.brand).trim():'';const priority=[];if(rule.dealerBrand&&brand)priority.push(`${brand} dealer`);for(const s of rule.stores)if(!priority.some(x=>norm(x)===norm(s)))priority.push(s);i.likelyStoreTypes=priority.slice(0,5);i.retailRuleApplied=true}
 i.exactProductMatch=false;
 i.matchLevel=i.modelEvidence?'model-unverified':i.brandEvidence?'brand-level':'category-level';
 return i;
}

async function loadFeeds(){let cfg=[];try{cfg=JSON.parse(process.env.RETAILER_FEEDS_JSON||'[]')}catch{}if(!Array.isArray(cfg))return[];const settled=await Promise.allSettled(cfg.filter(x=>x?.url&&x?.name).map(fetchFeed));return settled.flatMap(x=>x.status==='fulfilled'?x.value:[])}
async function fetchFeed(c){const h={Accept:'application/json'};if(c.tokenEnv&&process.env[c.tokenEnv])h.Authorization=`Bearer ${process.env[c.tokenEnv]}`;const r=await fetch(c.url,{headers:h});if(!r.ok)throw Error(`${c.name} feed returned ${r.status}`);const d=await r.json(),a=Array.isArray(d)?d:Array.isArray(d.products)?d.products:[];return a.map(p=>({id:String(p.id||p.sku||p.url||p.name),name:String(p.name||''),brand:clean(p.brand),model:clean(p.model||p.sku),category:clean(p.category),keywords:Array.isArray(p.keywords)?p.keywords.map(String):[],image:clean(p.image),url:clean(p.url),retailer:c.name,price:num(p.price),currency:p.currency||'ZAR',stock:p.stock||null,stores:Array.isArray(p.stores)?p.stores:[]})).filter(p=>p.name)}
function matchProducts(i,products,lat,lon){const out=[];for(const p of products){const m=score(i,p);if(m<.62)continue;const exact=isExact(i,p);if(p.stores?.length){for(const s of p.stores)out.push(make(p,s,m,lat,lon,exact))}else out.push(make(p,null,m,lat,lon,exact))}return out.sort((a,b)=>(Number(b.exactProductMatch)-Number(a.exactProductMatch))||b.match-a.match).slice(0,20)}
function isExact(i,p){if(!i.modelEvidence||!i.model||!p.model)return false;if(norm(i.model)!==norm(p.model))return false;if(i.brandEvidence&&i.brand){if(!p.brand||norm(i.brand)!==norm(p.brand))return false}return true}
function score(i,p){const a=norm([i.name,i.object,i.searchQuery,i.brand,i.model,i.productKind,i.scaleClass].join(' ')),b=norm([p.name,p.brand,p.model,p.category,p.keywords?.join(' ')].join(' '));let s=overlap(a,b)*.55;if(i.brand&&p.brand)s+=norm(i.brand)===norm(p.brand)?.25:-.15;if(i.model&&p.model)s+=norm(i.model)===norm(p.model)?.35:0;const realMachine=/\b(tractor|harvester|excavator|bulldozer|loader|backhoe|grader)\b/.test(a)&&i.productKind==='real_product';if(realMachine&&/\b(toy|miniature|replica|model kit|build a|ride on)\b/.test(b))s-=.8;return clamp(s,0,1)}
function make(p,s,m,lat,lon,exact=false){const d=s&&lat!=null&&lon!=null&&num(s.lat)!=null&&num(s.lon)!=null?haversine(lat,lon,num(s.lat),num(s.lon)):null;return{id:`${p.id}:${s?.name||'online'}`,name:p.name,brand:p.brand,model:p.model,image:p.image,url:p.url,retailer:p.retailer,price:p.price,currency:p.currency,match:m,exactProductMatch:exact,stock:s?.stock||p.stock,store:s||null,distanceKm:d}}
function overlap(a,b){const A=new Set(norm(a).split(/\W+/).filter(x=>x.length>1)),B=new Set(norm(b).split(/\W+/).filter(x=>x.length>1));if(!A.size||!B.size)return 0;let h=0;for(const x of A)if(B.has(x))h++;return h/Math.max(A.size,B.size)}
function isRestricted(i){const x=norm([i.object,i.name,i.brand,i.model,i.category,i.searchQuery,...(i.visibleText||[])].join(' '));return RESTRICTED.some(t=>x.includes(t))}
function clean(v){const s=String(v??'').trim();return !s||/^(null|unknown|not detected|n\/a)$/i.test(s)?null:s}function norm(v){return String(v||'').toLowerCase().trim()}function num(v){const n=Number(v);return Number.isFinite(n)?n:null}function clamp(v,a,b){return Math.max(a,Math.min(b,v))}function haversine(a,b,c,d){const R=6371,p=Math.PI/180,x=Math.sin((c-a)*p/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin((d-b)*p/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}})}