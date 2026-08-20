const MODELS=['gemini-3.6-flash','gemini-3.5-flash-lite'];
const RESTRICTED=['firearm','gun','rifle','pistol','ammunition','ammo','weapon','knife','knives','machete','sword','switchblade','taser','stun gun','pepper spray','mace','brass knuckles','fireworks','explosive','vape','nicotine','cigarette','cigar','alcohol','beer','wine','liquor','cannabis','marijuana','thc','cbd','psilocybin','magic mushroom','gambling','sports betting','casino','pornography','adult sex toy'];
const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const blocked=v=>RESTRICTED.some(x=>norm(v).includes(x));
const clean=v=>String(v??'').trim();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

function out(x,s=200){return new Response(JSON.stringify(x),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}})}
function parseJson(text=''){
 const s=String(text).trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
 try{return JSON.parse(s)}catch{}
 const a=s.indexOf('{'),b=s.lastIndexOf('}');if(a>=0&&b>a)try{return JSON.parse(s.slice(a,b+1))}catch{}
 return null;
}
function groundingSources(raw){
 const chunks=raw?.candidates?.[0]?.groundingMetadata?.groundingChunks||[];
 const seen=new Set(),out=[];
 for(const c of chunks){const w=c?.web;if(!w?.uri)continue;const k=String(w.uri);if(seen.has(k))continue;seen.add(k);out.push({title:clean(w.title)||'Web source',url:k});if(out.length>=8)break}
 return out;
}

export default{async fetch(request){
 if(request.method!=='POST')return out({error:'POST only'},405);
 try{
  const key=process.env.GEMINI_API_KEY;if(!key)return out({error:'AI unavailable'},500);
  const form=await request.formData(),image=form.get('image');if(!image||typeof image.arrayBuffer!=='function')return out({error:'No image'},400);
  if(!String(image.type||'').startsWith('image/'))return out({error:'Image required'},400);
  if(image.size>8*1024*1024)return out({error:'Image too large'},413);
  const base=clean(form.get('baseIdentification')||'');if(blocked(base))return out({exactFound:false,blocked:true});
  const b64=Buffer.from(await image.arrayBuffer()).toString('base64'),mime=image.type||'image/jpeg';
  const prompt=`You are FindIt Nearby's exact-product web verifier. Inspect the uploaded product photo and use Google Search to try to identify the EXACT purchasable product, not merely its category.

Existing vision result (may be incomplete): ${base||'none'}

Rules:
- Search using visible text, logo, shape, colour pattern, construction, packaging, distinctive components and model markings.
- Do not call something exact just because the category matches. A pencil case is not an exact match to every pencil case.
- exactFound=true only if web evidence supports the same product or a uniquely matching retail listing. Prefer brand + model/SKU/product-title evidence. For unbranded products, require a very distinctive matching product title/design and at least two independent matching clues.
- If the photo does not contain enough evidence to safely identify an exact product, exactFound=false. Never invent brand, model, SKU, retailer, price or stock.
- productName should be the most precise truthful retail product name.
- searchQuery should target that exact product when exactFound=true; otherwise it should be a detailed descriptive query for the photographed item, not a broad category.
- Return JSON only with: exactFound, confidence (0-1), productName, brand, model, sku, searchQuery, evidence (array), note.
`;
  let last;
  for(const model of MODELS){
   try{
    const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{parts:[{text:prompt},{inlineData:{mimeType:mime,data:b64}}]}],tools:[{google_search:{}}],generationConfig:{temperature:.05}})});
    const raw=await r.json();if(!r.ok)throw Error(raw?.error?.message||`${model} failed`);
    const text=raw?.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('\n')||'';const d=parseJson(text);if(!d)throw Error('Grounded exact-product response was not valid JSON');
    const sources=groundingSources(raw);const confidence=clamp(Number(d.confidence||0),0,1);const exactFound=Boolean(d.exactFound)&&confidence>=.76&&sources.length>0;
    const result={exactFound,confidence,productName:clean(d.productName),brand:clean(d.brand)||null,model:clean(d.model)||null,sku:clean(d.sku)||null,searchQuery:clean(d.searchQuery),evidence:Array.isArray(d.evidence)?d.evidence.map(clean).filter(Boolean).slice(0,8):[],note:clean(d.note),sources,modelUsed:model};
    if(blocked([result.productName,result.brand,result.model,result.searchQuery].join(' ')))return out({exactFound:false,blocked:true});
    if(!exactFound){result.brand=null;result.model=null;result.sku=null}
    return out(result);
   }catch(e){last=e}
  }
  throw last||Error('Exact-product verification failed');
 }catch(e){console.error('exact-product-identify',e);return out({error:'Exact-product verification unavailable',message:e.message},503)}
}};