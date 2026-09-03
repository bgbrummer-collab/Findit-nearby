const MODELS=['gemini-3.6-flash','gemini-3.5-flash-lite'];
const BLOCKED=/\b(firearm|gun|rifle|pistol|ammunition|ammo|weapon|knife|knives|machete|sword|switchblade|taser|stun gun|pepper spray|mace|brass knuckles|fireworks|explosive|vape|nicotine|cigarette|cigar|alcohol|beer|wine|liquor|cannabis|marijuana|thc|cbd|psilocybin|magic mushroom|gambling|sports betting|casino|betting|pornography|adult sex toy)\b/i;
const SCHEMA={type:'OBJECT',properties:{researched:{type:'BOOLEAN'},whatItDoes:{type:'STRING'},pros:{type:'ARRAY',items:{type:'STRING'}},cons:{type:'ARRAY',items:{type:'STRING'}},bestFor:{type:'STRING'},standOut:{type:'STRING'},valueVerdict:{type:'STRING'}},required:['researched','whatItDoes','pros','cons','bestFor','standOut','valueVerdict']};
const clean=(v,n=1200)=>String(v??'').replace(/\s+/g,' ').trim().slice(0,n);
const norm=v=>clean(v,14000).toLowerCase().replace(/&amp;/g,' and ').replace(/\b(\d+)\s*(ml|mg|g|kg|l|gb|tb|oz|rolls?|pack|ply)\b/g,'$1$2').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const STOP=new Set(['the','and','for','with','from','this','that','new','product','item','online','shop','buy','model','official','pack','packs','piece','pieces']);
const toks=v=>[...new Set(norm(v).split(' ').filter(x=>x.length>2&&!STOP.has(x)))];
const JUNK=/\b(shipping|delivery|refund|return policy|returns policy|checkout|seller review|trustpilot|customer service|terms conditions|cookie policy|privacy policy|sign in|log in|newsletter|rewards programme|loyalty programme)\b/i;

function identity(b={}){const i=b.identification||b;return{brand:clean(i.brand,120),model:clean(i.model,260),name:clean(i.name||i.object,300),object:clean(i.object,140),category:clean(i.retailCategory||i.category,140),searchQuery:clean(i.searchQuery||i.query||i.name||i.model||i.object,380)}}
function exactName(i){const out=[];for(const p of [i.brand,i.model||i.name,i.searchQuery].filter(Boolean)){const n=norm(p);if(!n||out.some(x=>norm(x).includes(n)||n.includes(norm(x))))continue;out.push(p)}return clean(out.join(' '),460)}

function family(i){
 const x=norm(`${i.category} ${i.object} ${i.name} ${i.model}`);
 if(/conditioner|shampoo|serum|mascara|foundation|lipstick|beauty|cosmetic|hair care|skin care|curl cream|moisturizer|moisturiser/.test(x))return'beauty';
 if(/vitamin|pharmacy|health|toothpaste|deodorant|oral care|sanitary|personal care/.test(x))return'health';
 if(/shoe|sneaker|footwear|trainer|boot|sandal/.test(x))return'footwear';
 if(/shirt|jacket|jeans|dress|hoodie|clothing|trousers|pants|shorts|jersey|sweater/.test(x))return'clothing';
 if(/fridge|microwave|washing machine|air fryer|kettle|toaster|appliance|dishwasher|vacuum|iron/.test(x))return'appliances';
 if(/phone|headphone|earbud|microphone|monitor|keyboard|mouse|camera|laptop|electronics|tablet|speaker|television|tv|charger|power bank/.test(x))return'electronics';
 if(/toilet paper|tissue|paper towel|cleaning|detergent|dishwashing|laundry|household|bin bag|foil|cling wrap/.test(x))return'household';
 if(/food|grocery|drink|snack|cereal|coffee|tea|milk|bread|sauce|pasta|rice/.test(x))return'grocery';
 if(/drill|hardware|tool|paint|screw|electrical|hammer|spanner|wrench|saw|adhesive/.test(x))return'hardware';
 if(/pencil|pen|stationery|notebook|calculator|school supplies|marker|highlighter|eraser|ruler|file folder|binder/.test(x))return'stationery';
 if(/toy|lego|doll|puzzle|board game|kids toy/.test(x))return'toys';
 if(/kitchen|cookware|pan|pot|knife set|cutlery|bottle|mug|plate|homeware/.test(x))return'home';
 return'all'
}

function searchSites(i){
 const f=family(i);
 const map={
  beauty:['clicks.co.za','dischem.co.za','woolworths.co.za','takealot.com'],
  health:['clicks.co.za','dischem.co.za','woolworths.co.za','takealot.com'],
  electronics:['incredible.co.za','makro.co.za','game.co.za','takealot.com','hificorp.co.za'],
  appliances:['game.co.za','makro.co.za','hirschs.co.za','takealot.com','hificorp.co.za'],
  footwear:['sportscene.co.za','totalsports.co.za','jdsports.co.za','nike.com','adidas.co.za','bash.com'],
  clothing:['sportscene.co.za','totalsports.co.za','bash.com','superbalist.com','woolworths.co.za'],
  household:['checkers.co.za','pnp.co.za','shoprite.co.za','woolworths.co.za','makro.co.za','game.co.za','takealot.com','dischem.co.za'],
  grocery:['checkers.co.za','pnp.co.za','shoprite.co.za','woolworths.co.za','makro.co.za'],
  hardware:['builders.co.za','makro.co.za','leroymerlin.co.za','buco.co.za','mica.co.za'],
  stationery:['pna.co.za','waltons.co.za','makro.co.za','takealot.com'],
  toys:['toysrus.co.za','game.co.za','makro.co.za','takealot.com'],
  home:['mrphome.com','woolworths.co.za','makro.co.za','game.co.za','takealot.com'],
  all:['makro.co.za','takealot.com','game.co.za','woolworths.co.za']
 };
 return map[f]||map.all
}

function directSearches(i,q){
 const x=encodeURIComponent(q),f=family(i),map={
  beauty:[`https://clicks.co.za/search?text=${x}`,`https://www.dischem.co.za/catalogsearch/result/?q=${x}`,`https://www.woolworths.co.za/cat?Ntt=${x}`],
  health:[`https://clicks.co.za/search?text=${x}`,`https://www.dischem.co.za/catalogsearch/result/?q=${x}`],
  electronics:[`https://www.incredible.co.za/search?q=${x}`,`https://www.makro.co.za/search/?text=${x}`,`https://www.game.co.za/search?text=${x}`],
  appliances:[`https://www.game.co.za/search?text=${x}`,`https://www.makro.co.za/search/?text=${x}`],
  footwear:[`https://www.sportscene.co.za/search?q=${x}`,`https://www.totalsports.co.za/search?q=${x}`,`https://www.nike.com/za/w?q=${x}`],
  clothing:[`https://www.sportscene.co.za/search?q=${x}`,`https://www.totalsports.co.za/search?q=${x}`,`https://www.woolworths.co.za/cat?Ntt=${x}`],
  household:[`https://www.woolworths.co.za/cat?Ntt=${x}`,`https://www.makro.co.za/search/?text=${x}`,`https://www.game.co.za/search?text=${x}`],
  grocery:[`https://www.woolworths.co.za/cat?Ntt=${x}`,`https://www.makro.co.za/search/?text=${x}`],
  hardware:[`https://www.builders.co.za/search?text=${x}`,`https://www.makro.co.za/search/?text=${x}`],
  stationery:[`https://www.makro.co.za/search/?text=${x}`],
  toys:[`https://www.game.co.za/search?text=${x}`,`https://www.makro.co.za/search/?text=${x}`],
  home:[`https://www.woolworths.co.za/cat?Ntt=${x}`,`https://www.makro.co.za/search/?text=${x}`,`https://www.game.co.za/search?text=${x}`],
  all:[`https://www.makro.co.za/search/?text=${x}`]
 };
 return map[f]||map.all
}

function htmlToText(s=''){return String(s).replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&nbsp;/gi,' ').replace(/\s+/g,' ').trim()}
async function direct(url,timeout=8500){try{const r=await fetch(url,{headers:{'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36','accept':'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8','accept-language':'en-ZA,en;q=0.9'},redirect:'follow',signal:AbortSignal.timeout(timeout)});if(!r.ok)return null;return{url:r.url||url,text:(await r.text()).slice(0,700000)}}catch{return null}}
async function reader(url,timeout=8500){try{const r=await fetch(`https://r.jina.ai/${url}`,{headers:{Accept:'text/plain','User-Agent':'FindItNearby/13.0'},signal:AbortSignal.timeout(timeout)});if(!r.ok)return null;return{url,text:(await r.text()).slice(0,650000)}}catch{return null}}
async function searchDoc(url){const j=await reader(url,6500);if(j&&extractLinks(j.text,url).length)return j;return direct(url,6500)}

function unwrap(raw,base){try{let u=new URL(String(raw).replace(/&amp;/g,'&'),base),h=u.hostname.toLowerCase();if(h.includes('duckduckgo.com')){const t=u.searchParams.get('uddg');if(t)u=new URL(decodeURIComponent(t))}h=u.hostname.toLowerCase();if(h==='google.com'||h.endsWith('.google.com')||/\.google\.[a-z.]+$/.test(h)){const t=u.searchParams.get('q')||u.searchParams.get('url')||u.searchParams.get('u');if(t)u=new URL(decodeURIComponent(t));else return null}const host=u.hostname.toLowerCase();if(!/^https?:$/.test(u.protocol)||host.includes('google.')||host.includes('bing.com')||host.includes('duckduckgo.com')||host.includes('youtube.')||host.includes('facebook.')||host.includes('instagram.')||host.includes('tiktok.')||host.includes('pinterest.')||host.includes('reddit.'))return null;return u.href}catch{return null}}
function extractLinks(doc,base){const s=String(doc||''),out=[],seen=new Set(),add=v=>{const u=unwrap(v,base);if(u&&!seen.has(u)){seen.add(u);out.push(u)}};for(const m of s.matchAll(/\]\(([^)\s]+)\)/g)){add(m[1]);if(out.length>=40)return out}for(const m of s.matchAll(/href\s*=\s*["']([^"']+)["']/gi)){add(m[1]);if(out.length>=40)return out}for(const m of s.matchAll(/https?:\/\/[^\s)\]>"']+/g)){add(m[0].replace(/[.,;:]+$/,''));if(out.length>=40)return out}return out}
function likelyProductUrl(v){try{const u=new URL(v),p=u.pathname.toLowerCase();if(/\/(search|catalogsearch|browse|category|categories|brands?|collections?|all)(\/|$)/.test(p))return false;if(/[?&](q|text|search)=/i.test(u.search))return false;if(u.hostname.includes('clicks.co.za'))return /\/p\/\d+\/?$/.test(p);return p.split('/').filter(Boolean).length>=1}catch{return false}}

function identityMatch(text,i,title=''){
 const hay=norm(`${title} ${String(text||'').slice(0,100000)}`),brand=norm(i.brand);
 if(brand&&!hay.includes(brand))return false;
 const generic=new Set(toks(`${i.object} ${i.category}`));
 const rawKeys=toks(`${i.model||''} ${i.name||''}`).filter(x=>!generic.has(x)&&x!==brand);
 const keys=rawKeys.filter(x=>!/^\d+$/.test(x)).slice(0,12);
 const numberKeys=(norm(`${i.model||''} ${i.name||''}`).match(/\b\d+(?:ml|mg|g|kg|l|oz|rolls?|ply)?\b/g)||[]).slice(0,4);
 const keyHits=keys.filter(x=>hay.includes(x)).length;
 const numberHits=numberKeys.filter(x=>hay.includes(x)).length;
 if(keys.length>=3&&keyHits<2)return false;
 if(keys.length>0&&keys.length<3&&keyHits<Math.min(1,keys.length))return false;
 if(numberKeys.length&&numberHits===0&&keys.length<3)return false;
 return !!brand||keyHits>0||numberHits>0
}

function titleOf(raw,url){const s=String(raw||''),m=s.match(/^Title:\s*(.+)$/mi)||s.match(/<title[^>]*>([^<]+)<\/title>/i);return clean(m?.[1]||(()=>{try{return new URL(url).hostname}catch{return'Product source'}})(),180)}
async function productPage(url,i){let d=await reader(url,8000);if(!d)d=await direct(url,8000);if(!d)return null;const title=titleOf(d.text,d.url||url),text=/<[a-z][\s\S]*>/i.test(d.text)?htmlToText(d.text):d.text.replace(/\s+/g,' ').trim();if(!identityMatch(text,i,title))return null;return{title,url:d.url||url,text:text.slice(0,26000)}}

function queryVariants(i){
 const q=exactName(i),core=clean([i.brand,i.model||i.name].filter(Boolean).join(' '),360);
 const variants=[`"${q}"`,core,`${core} ${i.object||i.category||''}`.trim(),`${i.brand||''} ${i.model||i.name||''} specifications features`.trim()];
 return [...new Set(variants.filter(Boolean))]
}

async function discoverPages(i,offers=[]){
 const candidates=[],seen=new Set(),add=u=>{const x=unwrap(u);if(x&&!seen.has(x)&&likelyProductUrl(x)){seen.add(x);candidates.push(x)}};
 for(const o of offers)add(o.url);
 const variants=queryVariants(i),searchUrls=[];
 for(const v of variants.slice(0,3)){
  searchUrls.push(...directSearches(i,v));
  searchUrls.push(`https://www.google.com/search?num=12&hl=en&q=${encodeURIComponent(v)}`);
  searchUrls.push(`https://www.bing.com/search?q=${encodeURIComponent(v)}`);
  searchUrls.push(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(v)}`);
 }
 for(const site of searchSites(i).slice(0,8)){
  const sq=`site:${site} "${clean([i.brand,i.model||i.name].filter(Boolean).join(' '),300)}"`;
  searchUrls.push(`https://www.google.com/search?num=10&hl=en&q=${encodeURIComponent(sq)}`);
  searchUrls.push(`https://www.bing.com/search?q=${encodeURIComponent(sq)}`);
 }
 for(const s of [...new Set(searchUrls)]){if(candidates.length>=36)break;const d=await searchDoc(s);if(!d)continue;for(const u of extractLinks(d.text,d.url||s)){add(u);if(candidates.length>=36)break}}
 const pages=[];for(const u of candidates.slice(0,36)){const p=await productPage(u,i);if(!p)continue;if(pages.some(x=>x.url===p.url))continue;pages.push(p);if(pages.length>=5)break}
 return pages
}

function point(v){const x=clean(String(v||'').replace(/^[-*•#>]+\s*/,'').replace(/\[[^\]]*\]\([^)]*\)/g,'').replace(/https?:\/\/\S+/g,'').replace(/\*\*/g,''),560);return x.length>=18&&!JUNK.test(x)?x:''}
function list(v){const out=[];for(const x of Array.isArray(v)?v:[]){const c=point(x);if(c&&!out.some(y=>norm(y)===norm(c)))out.push(c);if(out.length>=4)break}return out}
function sources(pages){return pages.map(p=>({title:p.title||'Product source',url:p.url})).slice(0,5)}

function fallback(i,pages){
 const sentences=[],bullets=[];
 for(const p of pages){
  const raw=String(p.text||'');
  for(const s of raw.split(/(?<=[.!?])\s+/)){const x=point(s);if(x&&x.length>=30&&x.length<=460&&!sentences.some(y=>norm(y)===norm(x)))sentences.push(x)}
  for(const m of raw.matchAll(/(?:^|\n)\s*[-*]\s+(.{18,340})/g)){const x=point(m[1]);if(x&&!bullets.some(y=>norm(y)===norm(x)))bullets.push(x)}
 }
 const all=[...bullets,...sentences];
 const purpose=/designed|helps?|provides?|formulated|made to|used to|ideal for|suitable for|features?|contains?|includes?|offers?|made from|made with|absor|soft|strong|durab|clean|protect|reduce|improve|support|cushion|performance|battery|connect|record|display|remove|restore|smooth|strength|comfort|capacity|layers?|ply|rolls?|sheets?|recycl|biodegrad|septic/i;
 const positive=/soft|strong|absorb|comfort|durab|lightweight|fast|easy|support|performance|battery|quality|cushion|reliable|moistur|hydrat|detang|smooth|shine|reduce|protect|strength|capacity|long lasting|efficient|recycl|biodegrad|septic|hypoallergenic/i;
 const negative=/however|limitation|drawback|requires?|not included|sold separately|may not|cannot|only compatible|fragrance|sensitive|heavy|bulky|short|limited|warning|not suitable|single use|disposable/i;
 const what=all.find(x=>purpose.test(x))||all.find(x=>identityMatch(x,i,''))||'';
 const pros=all.filter(x=>positive.test(x)&&!negative.test(x)).slice(0,4);
 const cons=all.filter(x=>negative.test(x)).slice(0,3);
 return{researched:!!(what||pros.length||cons.length),whatItDoes:what,pros,cons,bestFor:'',standOut:'',valueVerdict:'',sources:sources(pages),researchMethod:'Exact product web pages',checkedAt:new Date().toISOString()}
}

function parseJson(v){const s=String(v||'').replace(/^```json\s*/i,'').replace(/```\s*$/,'').trim();try{return JSON.parse(s)}catch{return null}}
async function summarize(key,i,pages){
 if(!key||!pages.length)return null;
 const evidence=pages.map((p,n)=>`SOURCE ${n+1}: ${p.title}\nURL: ${p.url}\nCONTENT: ${p.text}`).join('\n\n').slice(0,70000);
 const prompt=`Summarize WEB RESEARCH for this exact product: ${exactName(i)}. The photo was used only to identify the product and is not evidence. Use only the supplied web pages. Give a concise factual what-it-does summary, 2-4 source-supported pros, and 0-4 genuine source-supported cons/considerations. This may be any ordinary retail category including household goods, groceries, electronics, clothing, footwear, tools, stationery, appliances, beauty or health. For simple household/grocery products, useful pros can be concrete source-supported attributes such as absorbency, softness, strength, quantity, material, compatibility or convenience; do not force a con when none is supported. Never use visual appearance, price, stock, shipping or seller service as pros/cons. Set researched=false if the pages are not clearly about this exact product.\n\n${evidence}`;
 for(const model of MODELS){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);try{const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',signal:ctl.signal,headers:{'content-type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',responseSchema:SCHEMA,temperature:.06}})});const raw=await r.json().catch(()=>({}));if(!r.ok)continue;const d=parseJson((raw?.candidates?.[0]?.content?.parts||[]).map(p=>p?.text||'').join('\n'));if(!d?.researched)continue;const what=point(d.whatItDoes),pros=list(d.pros),cons=list(d.cons);if(!what&&!pros.length&&!cons.length)continue;return{researched:true,whatItDoes:what,pros,cons,bestFor:point(d.bestFor),standOut:point(d.standOut),valueVerdict:point(d.valueVerdict),sources:sources(pages),researchMethod:'Web search + source-grounded AI summary',checkedAt:new Date().toISOString()}}catch{}finally{clearTimeout(timer)}}
 return null
}

function offerSources(body){const out=[];for(const o of Array.isArray(body?.offers)?body.offers:[]){const u=unwrap(o?.product_url||o?.url);if(u)out.push({url:u})}return out.slice(0,6)}
async function fx(req,res){res.setHeader('Cache-Control','public, s-maxage=21600, stale-while-revalidate=86400');const base=String(req.query?.base||'ZAR').toUpperCase(),symbol=String(req.query?.symbols||'USD').toUpperCase();if(!/^[A-Z]{3}$/.test(base)||!/^[A-Z]{3}$/.test(symbol))return res.status(400).json({error:'Invalid currency'});if(base===symbol)return res.json({base,symbol,rate:1});try{const r=await fetch(`https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}&to=${encodeURIComponent(symbol)}`),d=await r.json(),rate=Number(d?.rates?.[symbol]);if(!r.ok||!Number.isFinite(rate))throw Error();return res.json({base,symbol,rate,date:d.date||null,estimated:true})}catch{return res.status(502).json({error:'Exchange rate unavailable'})}}
export default async function handler(req,res){if(String(req.query?.action||'')==='fx')return fx(req,res);res.setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=86400');if(req.method!=='POST'&&req.method!=='GET')return res.status(405).json({error:'Method not allowed'});const body=req.method==='POST'?(req.body||{}):(req.query||{}),i=identity(body),id=exactName(i);if(!id)return res.status(200).json({researched:false,whatItDoes:'',pros:[],cons:[],sources:[]});if(BLOCKED.test(id))return res.status(403).json({error:'Unsupported product type'});try{const pages=await discoverPages(i,offerSources(body));if(!pages.length)return res.status(200).json({researched:false,whatItDoes:'',pros:[],cons:[],sources:[],researchMethod:'No exact-product web pages verified',checkedAt:new Date().toISOString()});return res.status(200).json(await summarize(process.env.GEMINI_API_KEY,i,pages)||fallback(i,pages))}catch(e){console.error('product insights error',e);return res.status(200).json({researched:false,whatItDoes:'',pros:[],cons:[],sources:[],error:'Exact-product research temporarily unavailable'})}}