const RESTRICTED=['firearm','gun','rifle','pistol','ammunition','weapon','knife','switchblade','taser','pepper spray','vape','nicotine','cigarette','alcohol','beer','wine','liquor','cannabis','marijuana','thc','gambling','casino','betting','pornography','adult sex toy'];
const STOP=new Set(['the','and','for','with','from','this','that','pair','clear','black','white','small','large','new','men','women','unisex','featuring','including']);
const clean=v=>String(v||'').trim();
const norm=v=>clean(v).toLowerCase().replace(/&amp;/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const toks=v=>[...new Set(norm(v).split(' ').filter(x=>x.length>1&&!STOP.has(x)))];
const blocked=v=>RESTRICTED.some(x=>norm(v).includes(x));
const abs=(href,base)=>{try{return new URL(href,base).href}catch{return null}};
const strip=s=>clean(String(s||'').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&amp;/gi,'&').replace(/\s+/g,' '));
function queryFrom(b){
 const src=[b.brand,b.model,b.name||b.object,b.query].filter(Boolean).join(' '),seen=new Set(),out=[];
 for(const raw of src.split(/\s+/)){const k=norm(raw);if(!k||seen.has(k)||STOP.has(k))continue;seen.add(k);out.push(raw)}
 return out.join(' ').replace(/\s+/g,' ').trim().slice(0,140);
}
function identity(q,b){
 const all=toks(q),brand=toks(b.brand||''),model=toks(b.model||''),name=toks(b.name||b.object||'');
 const must=[...new Set([...brand,...model])];
 const core=[...new Set([...must,...name,...all])].slice(0,12);
 return {all,brand,model,name,must,core};
}
function scoreText(text,id){
 const n=norm(text);if(!n)return 0;
 let hits=0;for(const t of id.core)if(n.includes(t))hits++;
 let s=id.core.length?hits/id.core.length:0;
 if(id.brand.length&&id.brand.every(t=>n.includes(t)))s+=.20;
 if(id.model.length&&id.model.every(t=>n.includes(t)))s+=.32;
 return Math.min(1,s);
}
function strongMatch(text,id){
 const n=norm(text);if(!n)return false;
 if(id.must.length&&id.must.some(t=>!n.includes(t)))return false;
 const meaningful=id.core.filter(t=>t.length>=3);
 const hits=meaningful.filter(t=>n.includes(t)).length;
 const needed=Math.min(3,Math.max(2,Math.ceil(meaningful.length*.45)));
 return hits>=needed&&scoreText(n,id)>=.58;
}
function parsePrice(v){if(v==null)return null;let s=String(v).replace(/\s/g,'').replace(/[^0-9.,]/g,'');if(!s)return null;if(s.includes(',')&&s.includes('.'))s=s.replace(/,/g,'');else if(s.includes(',')&&!s.includes('.')){const p=s.split(',');s=p.at(-1).length===2?p.slice(0,-1).join('')+'.'+p.at(-1):p.join('')}const n=Number(s);return Number.isFinite(n)&&n>0&&n<10000000?n:null}
function stock(v){const x=norm(v);if(/out of stock|unavailable|sold out/.test(x))return'out_of_stock';if(/in stock|available|add to cart|buy now/.test(x))return'in_stock';if(/pre order|preorder/.test(x))return'preorder';return null}
function walk(node,out=[]){if(!node)return out;if(Array.isArray(node)){node.forEach(x=>walk(x,out));return out}if(typeof node!=='object')return out;const t=Array.isArray(node['@type'])?node['@type'].join(' '):node['@type'];if(/product/i.test(String(t||'')))out.push(node);for(const k of ['@graph','itemListElement','item'])if(node[k])walk(node[k],out);return out}
function parseProducts(html,base,id,retailer){
 const out=[];const re=/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;let m;
 while((m=re.exec(html))){try{const d=JSON.parse(m[1].trim().replace(/&quot;/g,'"'));for(const p of walk(d)){const name=clean(p.name||p.item?.name);if(!name||!strongMatch([name,p.brand?.name||p.brand,p.model,p.sku].join(' '),id))continue;const off=Array.isArray(p.offers)?p.offers[0]:(p.offers||{}),u=abs(p.url||off.url||'',base)||base;out.push({product_name:name,price:parsePrice(off.price||off.lowPrice),currency:clean(off.priceCurrency||'ZAR')||'ZAR',availability:stock(off.availability),product_url:u,verified:true,source:'Verified retailer product data',retailer:{name:retailer.name,country:'ZA',source:'retailer_site'},matchScore:scoreText(name,id),branchStockVerified:false,listingType:'retailer_verified',onlineListing:true})}}catch{}}
 return out;
}
function parseAnchors(html,base,id){
 const out=[];const re=/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;let m;
 while((m=re.exec(html))&&out.length<200){const label=strip(m[2]);if(!label||label.length>240||!strongMatch(label,id))continue;const u=abs(m[1],base);if(!u||!/https?:/i.test(u))continue;out.push({url:u,label,score:scoreText(label,id)})}
 return out.sort((a,b)=>b.score-a.score);
}
async function fetchHtml(url,timeout=6000){try{const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 (compatible; FindItNearby/3.0)','Accept':'text/html,application/xhtml+xml','Accept-Language':'en-ZA,en;q=0.9'},redirect:'follow',signal:AbortSignal.timeout(timeout)});if(!r.ok)return null;const type=r.headers.get('content-type')||'';if(!type.includes('text/html'))return null;return {url:r.url||url,html:(await r.text()).slice(0,1800000)}}catch{return null}}
const RETAILERS=[
 {name:'PriceCheck',domain:'pricecheck.co.za',cats:['all'],search:q=>`https://www.pricecheck.co.za/search?search=${encodeURIComponent(q)}`},
 {name:'Takealot',domain:'takealot.com',cats:['all'],search:q=>`https://www.takealot.com/all?qsearch=${encodeURIComponent(q)}`},
 {name:'Makro',domain:'makro.co.za',cats:['all'],search:q=>`https://www.makro.co.za/search/?text=${encodeURIComponent(q)}`},
 {name:'Clicks',domain:'clicks.co.za',cats:['beauty','health'],search:q=>`https://clicks.co.za/search?text=${encodeURIComponent(q)}`},
 {name:'Dis-Chem',domain:'dischem.co.za',cats:['beauty','health'],search:q=>`https://www.dischem.co.za/catalogsearch/result/?q=${encodeURIComponent(q)}`},
 {name:'Incredible Connection',domain:'incredible.co.za',cats:['electronics'],search:q=>`https://www.incredible.co.za/catalogsearch/result/?q=${encodeURIComponent(q)}`},
 {name:'HiFi Corp',domain:'hificorp.co.za',cats:['electronics','appliances'],search:q=>`https://www.hificorp.co.za/catalogsearch/result/?q=${encodeURIComponent(q)}`},
 {name:'Game',domain:'game.co.za',cats:['electronics','appliances','home','toys','sports','hardware'],search:q=>`https://www.game.co.za/search?q=${encodeURIComponent(q)}`},
 {name:'Sportscene',domain:'sportscene.co.za',cats:['footwear','clothing','sports'],search:q=>`https://www.sportscene.co.za/search?q=${encodeURIComponent(q)}`},
 {name:'Totalsports',domain:'totalsports.co.za',cats:['footwear','clothing','sports'],search:q=>`https://www.totalsports.co.za/search?q=${encodeURIComponent(q)}`},
 {name:'Bash',domain:'bash.com',cats:['footwear','clothing','sports'],search:q=>`https://bash.com/search?q=${encodeURIComponent(q)}`},
 {name:'Superbalist',domain:'superbalist.com',cats:['footwear','clothing'],search:q=>`https://superbalist.com/search?q=${encodeURIComponent(q)}`},
 {name:'Cape Union Mart',domain:'capeunionmart.co.za',cats:['outdoor','clothing','footwear'],search:q=>`https://www.capeunionmart.co.za/search?q=${encodeURIComponent(q)}`},
 {name:'Sportsmans Warehouse',domain:'sportsmanswarehouse.co.za',cats:['sports','outdoor','footwear'],search:q=>`https://www.sportsmanswarehouse.co.za/catalogsearch/result/?q=${encodeURIComponent(q)}`},
 {name:'Woolworths',domain:'woolworths.co.za',cats:['grocery','clothing','beauty','home'],search:q=>`https://www.woolworths.co.za/cat?Ntt=${encodeURIComponent(q)}`},
 {name:'Pick n Pay',domain:'pnp.co.za',cats:['grocery','home'],search:q=>`https://www.pnp.co.za/search?q=${encodeURIComponent(q)}`},
 {name:'Checkers',domain:'checkers.co.za',cats:['grocery','home'],search:q=>`https://www.checkers.co.za/search?q=${encodeURIComponent(q)}`},
 {name:'Builders',domain:'builders.co.za',cats:['hardware','home','garden'],search:q=>`https://www.builders.co.za/search?q=${encodeURIComponent(q)}`},
 {name:'Leroy Merlin',domain:'leroymerlin.co.za',cats:['hardware','home','garden'],search:q=>`https://leroymerlin.co.za/search?q=${encodeURIComponent(q)}`},
 {name:'Pet Heaven',domain:'petheaven.co.za',cats:['pet'],search:q=>`https://www.petheaven.co.za/catalogsearch/result/?q=${encodeURIComponent(q)}`},
 {name:'Absolute Pets',domain:'absolutepets.com',cats:['pet'],search:q=>`https://www.absolutepets.com/search?q=${encodeURIComponent(q)}`},
 {name:'Loot',domain:'loot.co.za',cats:['books','electronics','toys','home'],search:q=>`https://www.loot.co.za/search?cat=&terms=${encodeURIComponent(q)}`}
];
function familyOf(v){const x=norm(v);if(/perfume|fragrance|eau de parfum|eau de toilette|cologne|makeup|cosmetic|skincare|shampoo/.test(x))return'beauty';if(/medicine|vitamin|health|personal care/.test(x))return'health';if(/microphone|headphone|headset|speaker|audio|laptop|computer|monitor|keyboard|mouse|router|wifi|electronics|charger|camera|phone|smartphone/.test(x))return'electronics';if(/fridge|washing machine|dishwasher|microwave|air fryer|appliance/.test(x))return'appliances';if(/shoe|sneaker|footwear|boot|trainer/.test(x))return'footwear';if(/shirt|jacket|pants|jeans|dress|clothing|fashion/.test(x))return'clothing';if(/tent|camping|hiking|backpack|outdoor/.test(x))return'outdoor';if(/soccer|football|rugby|cricket|tennis|gym|sports/.test(x))return'sports';if(/food|drink|grocery|coffee|tea|snack|detergent|toilet paper/.test(x))return'grocery';if(/drill|hammer|screw|paint|hardware|plumbing|tool/.test(x))return'hardware';if(/plant|garden|flower/.test(x))return'garden';if(/dog|cat|pet|pet food/.test(x))return'pet';if(/book|novel|textbook/.test(x))return'books';if(/toy|lego|puzzle/.test(x))return'toys';if(/sofa|chair|table|bed|home decor|furniture/.test(x))return'home';return'general'}
async function verifyRetailer(retailer,q,id){
 const searchUrl=retailer.search(q),page=await fetchHtml(searchUrl);if(!page)return null;
 const products=parseProducts(page.html,page.url,id,retailer).sort((a,b)=>b.matchScore-a.matchScore);if(products[0])return {card:{name:retailer.name,searchUrl:products[0].product_url,status:'verified_direct_product',query:q,direct:true},offer:products[0]};
 const anchors=parseAnchors(page.html,page.url,id).filter(a=>{try{return new URL(a.url).hostname.includes(retailer.domain)}catch{return false}}).slice(0,4);
 for(const a of anchors){const productPage=await fetchHtml(a.url,4500);if(!productPage)continue;const productData=parseProducts(productPage.html,productPage.url,id,retailer).sort((x,y)=>y.matchScore-x.matchScore)[0];if(productData)return {card:{name:retailer.name,searchUrl:productData.product_url,status:'verified_direct_product',query:q,direct:true},offer:productData};
 const text=strip(productPage.html).slice(0,160000);if(strongMatch(text,id)){const priceMatch=text.match(/(?:R|ZAR)\s*([0-9][0-9\s,.]{1,12})/i);const offer={product_name:a.label||q,price:parsePrice(priceMatch?.[1]),currency:'ZAR',availability:stock(text),product_url:productPage.url,verified:true,source:'Verified retailer product page',retailer:{name:retailer.name,country:'ZA',source:'retailer_site'},matchScore:a.score,branchStockVerified:false,listingType:'retailer_verified',onlineListing:true};return {card:{name:retailer.name,searchUrl:productPage.url,status:'verified_direct_product',query:q,direct:true},offer}}
 }
 return null;
}
async function groundedCandidates(q){const key=process.env.GEMINI_API_KEY;if(!key)return[];const prompt=`Find direct current South African retailer product pages for the exact product: ${q}. Return pages that clearly refer to this exact product, not homepages, category pages or unrelated products.`;for(const model of ['gemini-3.6-flash','gemini-3.5-flash-lite']){try{const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],tools:[{google_search:{}}],generationConfig:{temperature:.05}}),signal:AbortSignal.timeout(10000)});const d=await r.json();if(!r.ok)continue;const chunks=d?.candidates?.[0]?.groundingMetadata?.groundingChunks||[];return chunks.map(c=>({url:c?.web?.uri,title:c?.web?.title||''})).filter(x=>x.url).slice(0,10)}catch{}}return[]}
async function verifyGrounded(c,q,id){const page=await fetchHtml(c.url,4500);if(!page)return null;const host=new URL(page.url).hostname.replace(/^www\./,'');const retailer={name:c.title||host,domain:host};const products=parseProducts(page.html,page.url,id,retailer).sort((a,b)=>b.matchScore-a.matchScore);if(products[0])return {card:{name:products[0].retailer.name,searchUrl:products[0].product_url,status:'verified_direct_product',query:q,direct:true},offer:products[0]};const text=strip(page.html).slice(0,160000);if(!strongMatch(text,id))return null;return {card:{name:retailer.name,searchUrl:page.url,status:'verified_direct_product',query:q,direct:true},offer:{product_name:q,price:null,currency:'ZAR',availability:stock(text),product_url:page.url,verified:true,source:'Verified grounded retailer page',retailer:{name:retailer.name,country:'ZA',source:'grounded_web'},matchScore:scoreText(text,id),branchStockVerified:false,listingType:'grounded_verified',onlineListing:true}}}
async function supabase(b,q,id){const u=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SECRET_KEY;if(!u||!k)return[];try{const base=u.replace(/\/$/,''),headers={apikey:k,Authorization:`Bearer ${k}`},ts=toks(q).slice(0,6),pu=new URL(base+'/rest/v1/products');pu.searchParams.set('select','id,name,brand,model,category,search_query');pu.searchParams.set('limit','60');if(ts.length)pu.searchParams.set('or','('+ts.flatMap(t=>[`name.ilike.%${t}%`,`brand.ilike.%${t}%`,`model.ilike.%${t}%`,`search_query.ilike.%${t}%`]).join(',')+')');let r=await fetch(pu,{headers});if(!r.ok)return[];let ps=await r.json();ps=ps.filter(p=>strongMatch([p.name,p.brand,p.model,p.search_query].join(' '),id)).slice(0,8);if(!ps.length)return[];const ids=ps.map(p=>p.id).join(','),ou=new URL(base+'/rest/v1/product_offers');ou.searchParams.set('select','product_id,retailer_id,product_name,price,original_price,currency,availability,product_url,verified,source');ou.searchParams.set('product_id',`in.(${ids})`);ou.searchParams.set('limit','40');r=await fetch(ou,{headers});if(!r.ok)return[];const os=await r.json();return os.filter(o=>o.verified&&o.product_url&&strongMatch(o.product_name||q,id)).map(o=>({...o,retailer:{name:'Connected retailer',country:'ZA',source:'connected_feed'},matchScore:scoreText(o.product_name||q,id),branchStockVerified:false,listingType:'connected_feed',onlineListing:true}))}catch{return[]}}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const b=req.body||{},q=queryFrom(b);if(!q)return res.status(400).json({error:'Product details required'});if(blocked([q,b.category,b.retailCategory].join(' ')))return res.status(403).json({error:'FindIt cannot search for restricted or age-limited products.'});
 try{
  const id=identity(q,b),fam=familyOf([q,b.category,b.retailCategory].join(' '));
  const pool=RETAILERS.filter(r=>r.cats.includes('all')||r.cats.includes(fam)).slice(0,8);
  const [db,grounded,retailerChecks]=await Promise.all([supabase(b,q,id),groundedCandidates(q),Promise.all(pool.map(r=>verifyRetailer(r,q,id)))]);
  const groundedChecks=await Promise.all((grounded||[]).slice(0,6).map(c=>verifyGrounded(c,q,id)));
  const verified=[...retailerChecks,...groundedChecks].filter(Boolean),cards=[],offers=[...db],seenCard=new Set(),seenOffer=new Set();
  for(const x of verified){const ck=norm(x.card.name+'|'+x.card.searchUrl);if(!seenCard.has(ck)){seenCard.add(ck);cards.push(x.card)}const ok=norm((x.offer?.retailer?.name||'')+'|'+(x.offer?.product_url||''));if(x.offer&&!seenOffer.has(ok)){seenOffer.add(ok);offers.push(x.offer)}}
  offers.sort((a,b)=>Number(b.matchScore||0)-Number(a.matchScore||0));
  return res.json({ok:true,matched:offers.length>0,bestProduct:offers[0]?{name:offers[0].product_name}:null,offers:offers.slice(0,16),verifiedOfferCount:offers.length,branchStockVerified:false,directionsAvailable:false,webRetailers:cards.slice(0,8),normalizedQuery:q,sources:{supabase:true,retailerSiteVerification:true,groundedWeb:true},message:cards.length?'Only retailers where FindIt verified the exact product are shown.':'FindIt could not verify the exact product on the retailers checked, so no retailer cards are shown.'});
 }catch(e){console.error('product-intelligence',e);return res.status(502).json({error:'Product Intelligence lookup failed.'})}
}