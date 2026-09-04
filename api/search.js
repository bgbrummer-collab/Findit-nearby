const PRIMARY_MODEL='gemini-3.1-flash-lite';
const FAST_MODEL='gemini-3.5-flash-lite';
const FALLBACK_MODEL='gemini-2.5-flash-lite';
const CONFIDENCE_MIN=.58;
const GEMINI_TIMEOUT_MS=10000;
const QUOTA_RE=/quota|rate.?limit|resource.?exhausted|too many requests/i;
const RESTRICTED=['firearm','gun','rifle','pistol','ammunition','ammo','weapon','knife','knives','machete','sword','switchblade','taser','stun gun','pepper spray','mace','brass knuckles','fireworks','explosive','vape','nicotine','cigarette','cigar','alcohol','beer','wine','liquor','cannabis','marijuana','thc','cbd','psilocybin','magic mushroom','gambling','sports betting','casino','pornography','adult sex toy'];

const RETAIL_RULES=[
 {test:/\b(tractor|combine harvester|harvester|agricultural machinery|farm machinery|farm equipment|john deere|massey ferguson|new holland|case ih|kubota)\b/i,category:'agricultural machinery',stores:['agricultural equipment dealer','farm machinery dealer','tractor dealer'],dealerBrand:true},
 {test:/\b(car|cars|suv|bakkie|pickup truck|motorcycle|motorbike|vehicle|sedan|coupe|hatchback|mercedes|benz|toyota|ford|bmw|audi|volkswagen)\b/i,category:'vehicle',stores:['authorised vehicle dealer','motor dealer'],dealerBrand:true},
 {test:/\b(excavator|bulldozer|loader|backhoe|grader|construction machinery|heavy equipment)\b/i,category:'heavy machinery',stores:['heavy equipment dealer','construction machinery dealer'],dealerBrand:true},
 {test:/\b(phone|smartphone|iphone|galaxy|pixel|mobile phone)\b/i,category:'mobile electronics',stores:['mobile phone store','electronics store','authorised brand store']},
 {test:/\b(laptop|computer|desktop|monitor|keyboard|mouse|router|wi fi router|wifi router|headphones|earbuds|speaker|microphone|camera|television|tv|bluetooth)\b/i,category:'electronics',stores:['electronics store','computer store','authorised brand store']},
 {test:/\b(sneaker|sneakers|shoe|shoes|trainer|trainers|running shoe|football boot|samba|footwear)\b/i,category:'footwear',stores:['shoe store','sportswear store','authorised brand store']},
 {test:/\b(shirt|t shirt|t-shirt|hoodie|jacket|jeans|dress|clothing|apparel)\b/i,category:'clothing',stores:['clothing store','fashion retailer','authorised brand store']},
 {test:/\b(eyeglasses|glasses|spectacles|sunglasses|eyewear|frames)\b/i,category:'eyewear',stores:['optician','eyewear store']},
 {test:/\b(toiletry bag|wash bag|travel pouch|cosmetic bag|makeup bag|travel bag|luggage|suitcase|backpack|rucksack|duffel|handbag|purse|wallet)\b/i,category:'bags & travel accessories',stores:['luggage store','bag store','department store','travel accessories store']},
 {test:/\b(toilet paper|toilet roll|tissue|detergent|cleaner|soap|grocery|food|snack|drink|cereal|milk|bread|household)\b/i,category:'grocery/household',stores:['supermarket','grocery store','department store']},
 {test:/\b(conditioner|shampoo|hair care|perfume|fragrance|makeup|cosmetic|skincare|moisturizer|serum|foundation|mascara|lipstick)\b/i,category:'beauty',stores:['beauty store','pharmacy','department store']},
 {test:/\b(fridge|refrigerator|washing machine|dishwasher|microwave|oven|air fryer|kettle|toaster|vacuum)\b/i,category:'home appliances',stores:['appliance store','electronics store','home retailer']},
 {test:/\b(drill|saw|hammer|screwdriver|wrench|spanner|pliers|socket set|power tool|toolbox|paint|cement|plumbing|hardware)\b/i,category:'hardware',stores:['hardware store','building supply store','tool retailer']},
 {test:/\b(plug adaptor|plug adapter|multi plug|multi-plug|power strip|extension lead|extension cord|socket adaptor|socket adapter|electrical accessory)\b/i,category:'electrical',stores:['electrical retailer','hardware store','home improvement store']},
 {test:/\b(salt shaker|pepper shaker|salt and pepper|pepper mill|salt mill|cookware|kitchenware|tableware|cutlery|utensil|mug|plate|pan|pot)\b/i,category:'kitchenware',stores:['homeware store','department store','supermarket']},
 {test:/\b(pencil case|pen|pencil|notebook|stationery|printer paper|school supplies)\b/i,category:'stationery',stores:['stationery store','office supply store','bookstore']},
 {test:/\b(flower|flowers|plant|pot plant|garden plant|seedling)\b/i,category:'garden/florist',stores:['florist','garden centre','nursery']},
 {test:/\b(toy|lego|doll|action figure|board game|puzzle)\b/i,category:'toys',stores:['toy store','department store']}
];

const ID_SCHEMA={type:'OBJECT',properties:{
 object:{type:'STRING'},name:{type:'STRING'},brand:{type:'STRING',nullable:true},model:{type:'STRING',nullable:true},category:{type:'STRING'},searchQuery:{type:'STRING'},confidence:{type:'NUMBER'},visibleText:{type:'ARRAY',items:{type:'STRING'}},features:{type:'ARRAY',items:{type:'STRING'}},retailCategory:{type:'STRING'},likelyStoreTypes:{type:'ARRAY',items:{type:'STRING'}},summary:{type:'STRING'},productKind:{type:'STRING'},scaleClass:{type:'STRING'},brandEvidence:{type:'BOOLEAN'},modelEvidence:{type:'BOOLEAN'},evidence:{type:'ARRAY',items:{type:'STRING'}},verificationNote:{type:'STRING'},draftChanged:{type:'BOOLEAN'}
},required:['object','name','category','searchQuery','confidence','visibleText','features','retailCategory','likelyStoreTypes','summary','productKind','scaleClass','brandEvidence','modelEvidence','evidence','verificationNote','draftChanged']};

export default{async fetch(request){
 if(request.method!=='POST')return json({error:'POST only'},405);
 const started=Date.now();
 try{
  const key=process.env.GEMINI_API_KEY;if(!key)return json({error:'GEMINI_API_KEY is missing in Vercel.'},500);
  const form=await request.formData(),image=form.get('image');
  if(!image||typeof image.arrayBuffer!=='function')return json({error:'No image uploaded.'},400);
  if(!String(image.type||'').startsWith('image/'))return json({error:'Uploaded file must be an image.'},400);
  if(image.size>8*1024*1024)return json({error:'Image must be smaller than 8 MB.'},413);
  const lat=num(form.get('lat')),lon=num(form.get('lon')),base64=Buffer.from(await image.arrayBuffer()).toString('base64'),mime=image.type||'image/jpeg';

  // Quota-safe path: one current stable multimodal pass first. A second pass is only used
  // when the first result is genuinely uncertain, instead of spending 2-3 requests per photo.
  let draft=await identifyDraft(key,base64,mime);
  let checker=null,verificationMode='single-pass-quota-safe';
  const draftConfidence=Number(draft?.confidence||0);
  const needsChecker=draftConfidence<.72||(!draft?.object&&!draft?.name)||(draft?.modelEvidence===true&&draft?.brandEvidence!==true);
  if(needsChecker){
   checker=await independentCheck(key,base64,mime).catch(()=>null);
   if(checker)verificationMode='selective-two-pass';
  }
  let verified=mergeIndependent(draft,checker);
  if(checker&&needsTieBreak(draft,checker)){
   const adjudicated=await tieBreak(key,base64,mime,draft,checker).catch(()=>null);
   if(adjudicated){verified=adjudicated;verificationMode='selective-plus-tiebreak'}
  }
  const identification=postProcess(verified,draft);
  identification.analysisMs=Date.now()-started;
  identification.verificationMode=verificationMode;

  if(isRestricted(identification))return json({identification,offers:[],blocked:true,verified:false,message:'FindIt cannot help search for restricted, dangerous or age-limited products.'});
  if(Number(identification.confidence||0)<CONFIDENCE_MIN)return json({identification,offers:[],blocked:false,verified:false,message:'The image was not identified confidently enough. Try a clearer photo showing the whole item, logo, package label or model text.'});

  const products=await loadFeeds(),offers=matchProducts(identification,products,lat,lon),exactOffers=offers.filter(o=>o.exactProductMatch);
  identification.exactProductMatch=exactOffers.length>0;
  identification.matchLevel=exactOffers.length?'exact':identification.modelEvidence?'model-unverified':identification.brandEvidence?'brand-level':'category-level';
  return json({identification,offers,blocked:false,verified:exactOffers.length>0,visualVerification:true,verificationStrength:identification.identityStrength,message:exactOffers.length?'Verified exact retailer offer found from connected authorised product data.':offers.length?'Relevant retailer matches found, but FindIt could not verify an exact product match yet.':'The item was identified, but no connected authorised retailer feed returned a verified exact match yet.'});
 }catch(e){console.error('FindIt /api/search error',e);const unavailable=Boolean(e?.fastFail)||QUOTA_RE.test(String(e?.message||''));return json({error:unavailable?'Image identification is temporarily busy. Please try again shortly.':'FindIt image search failed.',message:e.message||'Unknown error',retryable:true},unavailable?503:500)}
}};

async function generateStructured(key,model,prompt,b64,mime){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),GEMINI_TIMEOUT_MS);
 try{
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{parts:[{text:prompt},{inlineData:{mimeType:mime,data:b64}}]}],generationConfig:{responseMimeType:'application/json',responseSchema:ID_SCHEMA,temperature:.05}})});
  const raw=await r.json().catch(()=>({}));
  if(!r.ok){const e=Error(raw?.error?.message||`${model} failed`);e.fastFail=r.status===429||QUOTA_RE.test(e.message);throw e}
  const text=raw?.candidates?.[0]?.content?.parts?.find(p=>typeof p.text==='string')?.text;if(!text)throw Error(`${model} returned no identification text`);return JSON.parse(text);
 }catch(e){if(e?.name==='AbortError'){const x=Error(`${model} timed out after ${GEMINI_TIMEOUT_MS}ms`);x.fastFail=false;throw x}throw e}finally{clearTimeout(timer)}
}

async function identifyDraft(key,b64,mime){
 const prompt=`You are FindIt Nearby's precision product-vision engine. Identify the ACTUAL physical purchasable item in the image.
Accuracy is more important than specificity. Never invent a brand, model, size, pack count, flavour, colour name, capacity, generation or variant.
First decide what physical object the user could actually pick up or purchase. Never confuse artwork, a logo, a picture printed on an item, a screen image, packaging artwork, a toy, miniature or accessory with the real object.
Read visible text carefully. Treat text as evidence only when it visibly belongs to the physical product. Preserve useful readable label text in visibleText.
brandEvidence=true only when the product brand is directly readable or visually unmistakable. modelEvidence=true only when the exact model/variant is directly readable or uniquely diagnostic. For groceries, toiletries, cosmetics, hair care and packaged household goods, exact variant, size and pack count must be supported by readable label text. For tools, exact dimensions or sizes must be readable; never infer them from appearance.
Use multiple signals together: object shape, materials, construction, scale, packaging, label text, logos, model numbers, ports, controls, distinctive geometry and context.
productKind must be one of real_product,toy,miniature,replica,packaging,image_of_product,accessory,unknown. scaleClass must be one of full_size,handheld,wearable,tabletop,miniature,unknown.
searchQuery must be the strongest truthful shopping query supported by the image. Include brand/model/size only when supported. retailCategory and likelyStoreTypes must match stores that genuinely sell the physical item.
If uncertain between two objects, choose the broader truthful object and lower confidence. Return structured JSON only.`;
 let last;for(const model of [PRIMARY_MODEL,FALLBACK_MODEL,FAST_MODEL]){try{const x=await generateStructured(key,model,prompt,b64,mime);x.modelUsed=model;return x}catch(e){last=e}}throw last||Error('Gemini request failed');
}

async function independentCheck(key,b64,mime){
 const prompt=`Independently inspect this product photo for FindIt Nearby. Do not rely on any previous answer. Identify the real physical purchasable object, brand only when visibly supported, exact model/variant only when genuinely supported, and readable size/pack count only when visible. Be especially strict about packaged goods, vehicles, tools, artwork printed on products, toys/replicas and accessories. Choose the broader truthful answer rather than guessing. Return the complete structured JSON schema only.`;
 let last;for(const model of [FALLBACK_MODEL,FAST_MODEL]){try{const x=await generateStructured(key,model,prompt,b64,mime);x.verifierModel=model;return x}catch(e){last=e}}throw last||Error('Independent verification failed');
}

function needsTieBreak(a,b){
 const wholeA=norm([a.object,a.name,a.brand,a.model].join(' ')),wholeB=norm([b.object,b.name,b.brand,b.model].join(' '));
 const agreement=overlap(wholeA,wholeB),brandA=norm(a.brand),brandB=norm(b.brand),modelA=norm(a.model),modelB=norm(b.model);
 const brandConflict=Boolean(brandA&&brandB&&brandA!==brandB),modelConflict=Boolean(modelA&&modelB&&modelA!==modelB),objectConflict=overlap(a.object||a.name,b.object||b.name)<.35;
 return agreement<.52||brandConflict||modelConflict||objectConflict;
}

function mergeIndependent(primary,checker){
 if(!checker)return {...primary,verificationNote:'Independent verification was unavailable; strong primary result retained with conservative evidence rules.',draftChanged:false,confidence:Math.min(Number(primary.confidence||0),.88)};
 const agreement=overlap([primary.object,primary.name,primary.brand,primary.model].join(' '),[checker.object,checker.name,checker.brand,checker.model].join(' '));
 return {...primary,visibleText:[...new Set([...(primary.visibleText||[]),...(checker.visibleText||[])])].slice(0,14),evidence:[...new Set([...(primary.evidence||[]),...(checker.evidence||[])])].slice(0,10),verificationNote:`Independent parallel verifier agreement ${Math.round(agreement*100)}%. ${checker.verificationNote||''}`.trim(),draftChanged:false,confidence:Math.min(1,Math.max(Number(primary.confidence||0),agreement>=.7?Number(checker.confidence||0)*.98:0))};
}

async function tieBreak(key,b64,mime,primary,checker){
 const prompt=`You are the final adjudicator for FindIt Nearby. Two independent vision passes disagree. Inspect the image yourself and return the most defensible product identity. Never average guesses. Remove unsupported brand/model/variant/size claims and use a broader truthful identity when evidence is insufficient.
PRIMARY: ${JSON.stringify(primary)}
INDEPENDENT CHECKER: ${JSON.stringify(checker)}
For packaged products exact label details must be readable. For vehicles an exact model needs strong badge/design evidence. For tools exact size must be readable. Return complete structured JSON only.`;
 const x=await generateStructured(key,PRIMARY_MODEL,prompt,b64,mime);x.verifierModel=PRIMARY_MODEL;x.draftChanged=true;return x;
}

function postProcess(i,draft={}){
 i.confidence=clamp(Number(i.confidence||0),0,1);i.brand=clean(i.brand);i.model=clean(i.model);
 i.visibleText=arr(i.visibleText,14);i.features=arr(i.features,12);i.evidence=arr(i.evidence,10);i.likelyStoreTypes=arr(i.likelyStoreTypes,6);
 i.productKind=clean(i.productKind)||'unknown';i.scaleClass=clean(i.scaleClass)||'unknown';i.brandEvidence=Boolean(i.brandEvidence);i.modelEvidence=Boolean(i.modelEvidence);
 if(i.brand&&!i.brandEvidence){i.brand=null;i.confidence=Math.min(i.confidence,.72);i.brandRemovedForEvidence=true}
 if(i.model&&!i.modelEvidence){i.model=null;i.confidence=Math.min(i.confidence,.68);i.modelRemovedForEvidence=true}

 const labelFamily=norm([i.category,i.retailCategory,i.object].join(' ')),labelDriven=/grocery|food|bread|beverage|beauty|personal care|conditioner|shampoo|hair care|skincare|cosmetic|toiletr|household|cleaner|detergent|tissue|toilet paper/.test(labelFamily),readableLabel=norm(i.visibleText.join(' '));
 if(labelDriven&&i.name){const brandText=norm(i.brand),objectText=norm(i.object),generic=new Set(['product','item','pack','bottle','tube','loaf','hair','care','beauty','personal','food','white','black','conditioner','shampoo','bread','toilet','paper','rolls','twin','ply']);const unsupported=terms(i.name).filter(t=>t.length>3&&!generic.has(t)&&!readableLabel.includes(t)&&!brandText.includes(t)&&!objectText.includes(t));if(unsupported.length>1){i.name=[i.brand,i.object].filter(Boolean).join(' ')||i.object||i.name;i.searchQuery=i.name;i.model=null;i.modelEvidence=false;i.confidence=Math.min(i.confidence,.80);i.labelVariantReduced=true}}

 const draftName=norm([draft.object,draft.name,draft.brand,draft.model].join(' ')),finalName=norm([i.object,i.name,i.brand,i.model].join(' ')),agreement=draftName&&finalName?overlap(draftName,finalName):0;
 if(draftName&&finalName&&agreement<.45){i.confidence=Math.min(i.confidence,.64);i.verifierDisagreement=true}
 if(/^(unknown|image_of_product)$/i.test(i.productKind))i.confidence=Math.min(i.confidence,.60);

 const all=norm([i.object,i.name,i.brand,i.model,i.category,i.searchQuery,i.summary,i.productKind,i.scaleClass,...i.visibleText,...i.features,...i.evidence].join(' '));
 const rule=RETAIL_RULES.find(r=>r.test.test(all));if(rule){i.retailCategory=rule.category;const priority=[];if(rule.dealerBrand&&i.brand)priority.push(`${i.brand} dealer`);for(const s of rule.stores)if(!priority.some(x=>norm(x)===norm(s)))priority.push(s);i.likelyStoreTypes=priority.slice(0,6);i.retailRuleApplied=true}

 const canonicalParts=[];if(i.brandEvidence&&i.brand)canonicalParts.push(i.brand);if(i.modelEvidence&&i.model)canonicalParts.push(i.model);canonicalParts.push(i.object||i.name);const labelSpecific=extractLabelSpecific(i.visibleText);for(const x of labelSpecific)if(!norm(canonicalParts.join(' ')).includes(norm(x)))canonicalParts.push(x);
 i.canonicalQuery=canonicalParts.filter(Boolean).join(' ').replace(/\s+/g,' ').trim()||i.searchQuery||i.name||i.object;
 i.searchQuery=i.canonicalQuery;
 i.queryVariants=[i.canonicalQuery,[i.brand,i.object].filter(Boolean).join(' '),i.object||i.name].filter(Boolean).filter((x,n,a)=>a.findIndex(y=>norm(y)===norm(x))===n).slice(0,3);
 const signals={object:Boolean(i.object),brand:Boolean(i.brandEvidence&&i.brand),model:Boolean(i.modelEvidence&&i.model),labelTokens:labelSpecific.length,evidenceCount:i.evidence.length,passAgreement:Math.round(agreement*100)};
 let strength=.34+.22*Number(signals.brand)+.22*Number(signals.model)+Math.min(.12,labelSpecific.length*.03)+Math.min(.08,i.evidence.length*.015)+Math.min(.12,agreement*.12);strength*=Math.max(.45,i.confidence);i.identityStrength=Math.round(clamp(strength,0,1)*100);i.identitySignals=signals;
 i.exactProductMatch=false;i.matchLevel=i.modelEvidence?'model-unverified':i.brandEvidence?'brand-level':'category-level';
 return i;
}

function extractLabelSpecific(xs=[]){const out=[];for(const raw of xs){const s=String(raw||'').trim();if(!s)continue;if(/\b\d+(?:\.\d+)?\s?(?:ml|l|g|kg|mg|gb|tb|cm|mm|inch|in|pack|packs|roll|rolls|ply)\b/i.test(s)||/\b(classic|luxury|superior|strictly curls|triple blend|twin ply|2-ply|3-ply)\b/i.test(s))out.push(s)}return [...new Set(out)].slice(0,5)}
async function loadFeeds(){let cfg=[];try{cfg=JSON.parse(process.env.RETAILER_FEEDS_JSON||'[]')}catch{}if(!Array.isArray(cfg))return[];const settled=await Promise.allSettled(cfg.filter(x=>x?.url&&x?.name).map(fetchFeed));return settled.flatMap(x=>x.status==='fulfilled'?x.value:[])}
async function fetchFeed(c){const h={Accept:'application/json'};if(c.tokenEnv&&process.env[c.tokenEnv])h.Authorization=`Bearer ${process.env[c.tokenEnv]}`;const r=await fetch(c.url,{headers:h,signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error(`${c.name} feed returned ${r.status}`);const d=await r.json(),a=Array.isArray(d)?d:Array.isArray(d.products)?d.products:[];return a.map(p=>({id:String(p.id||p.sku||p.url||p.name),name:String(p.name||''),brand:clean(p.brand),model:clean(p.model||p.sku),category:clean(p.category),keywords:Array.isArray(p.keywords)?p.keywords.map(String):[],image:clean(p.image),url:clean(p.url),retailer:c.name,price:num(p.price),currency:p.currency||'ZAR',stock:p.stock||null,stores:Array.isArray(p.stores)?p.stores:[]})).filter(p=>p.name)}
function matchProducts(i,products,lat,lon){const out=[];for(const p of products){const m=score(i,p);if(m<.64)continue;const exact=isExact(i,p,m);if(p.stores?.length){for(const s of p.stores)out.push(make(p,s,m,lat,lon,exact))}else out.push(make(p,null,m,lat,lon,exact))}return out.sort((a,b)=>(Number(b.exactProductMatch)-Number(a.exactProductMatch))||b.match-a.match).slice(0,20)}
function isExact(i,p,m){const hay=norm([p.name,p.brand,p.model,p.category,p.keywords?.join(' ')].join(' ')),brand=norm(i.brand),model=norm(i.model),q=terms(i.canonicalQuery||i.searchQuery||i.name||i.object),sizes=q.filter(isSizeToken);
 if(i.brandEvidence&&brand&&!hay.includes(brand))return false;
 if(i.modelEvidence&&model){if(!hay.includes(model))return false;return m>=.74}
 if(sizes.length&&!sizes.every(x=>hay.includes(x)))return false;
 const visible=terms(i.visibleText.join(' ')).filter(x=>x.length>3),hits=q.filter(x=>hay.includes(x)).length,labelHits=visible.filter(x=>hay.includes(x)).length;
 return Boolean(i.brandEvidence&&brand&&m>=.78&&hits>=Math.min(5,Math.max(3,Math.ceil(q.length*.55)))&&labelHits>=Math.min(2,visible.length||2));}
function score(i,p){const a=norm([i.canonicalQuery,i.name,i.object,i.brand,i.model,...i.visibleText].join(' ')),b=norm([p.name,p.brand,p.model,p.category,p.keywords?.join(' ')].join(' '));let s=overlap(a,b)*.52;if(i.brand&&p.brand)s+=norm(i.brand)===norm(p.brand)?.24:-.18;if(i.model&&p.model)s+=norm(i.model)===norm(p.model)?.34:-.08;const q=terms(i.canonicalQuery||i.searchQuery),hits=q.filter(t=>b.includes(t)).length;s+=Math.min(.18,hits*.035);const realMachine=/\b(tractor|harvester|excavator|bulldozer|loader|backhoe|grader)\b/.test(a)&&i.productKind==='real_product';if(realMachine&&/\b(toy|miniature|replica|model kit|ride on)\b/.test(b))s-=.8;return clamp(s,0,1)}
function make(p,s,m,lat,lon,exact=false){const d=s&&lat!=null&&lon!=null&&num(s.lat)!=null&&num(s.lon)!=null?haversine(lat,lon,num(s.lat),num(s.lon)):null;return{id:`${p.id}:${s?.name||'online'}`,name:p.name,brand:p.brand,model:p.model,image:p.image,url:p.url,retailer:p.retailer,price:p.price,currency:p.currency,match:m,exactProductMatch:exact,stock:s?.stock||p.stock,store:s||null,distanceKm:d}}
function terms(v){return [...new Set(norm(v).replace(/(\d+)\s+(ml|mg|g|kg|l|gb|tb|cm|mm|inch|in|pack|rolls?|ply)\b/g,'$1$2').split(/[^a-z0-9.-]+/).filter(x=>x.length>1&&!['the','and','for','with','from','this','that','product','item'].includes(x)))]}
function isSizeToken(t){return /^\d+(?:\.\d+)?(?:ml|mg|g|kg|l|gb|tb|cm|mm|inch|in|pack|rolls?|ply)$/.test(t)}
function overlap(a,b){const A=new Set(terms(a)),B=new Set(terms(b));if(!A.size||!B.size)return 0;let h=0;for(const x of A)if(B.has(x))h++;return h/Math.max(A.size,B.size)}
function isRestricted(i){const x=norm([i.object,i.name,i.brand,i.model,i.category,i.searchQuery,...(i.visibleText||[])].join(' '));return RESTRICTED.some(t=>x.includes(t))}
function arr(v,n){return Array.isArray(v)?v.filter(Boolean).map(String).slice(0,n):[]}
function clean(v){const s=String(v??'').trim();return !s||/^(null|unknown|not detected|n\/a)$/i.test(s)?null:s}
function norm(v){return String(v||'').toLowerCase().replace(/[^a-z0-9. -]+/g,' ').replace(/\s+/g,' ').trim()}
function num(v){const n=Number(v);return Number.isFinite(n)?n:null}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function haversine(a,b,c,d){const R=6371,p=Math.PI/180,x=Math.sin((c-a)*p/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin((d-b)*p/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}})}