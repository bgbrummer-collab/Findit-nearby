import { chromium } from 'playwright';

const URL=process.env.FINDIT_URL||'https://findit-nearby.vercel.app/';
const browser=await chromium.launch({headless:true});
const failures=[];
const check=async(name,fn)=>{try{await fn();console.log('[PASS]',name)}catch(e){failures.push(`${name}: ${e.message}`);console.error('[FAIL]',name,e.message)}};

async function baseAudit(viewport){
 const ctx=await browser.newContext({viewport,geolocation:{latitude:-25.7479,longitude:28.2293},permissions:['geolocation']});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e.message||e)));
 await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForTimeout(1000);
 await check(`${viewport.width}px page loads`,async()=>{for(const id of ['finder','photo','location','search','results','nearbyStores'])if(!await page.locator(`#${id}`).count())throw Error(`${id} missing`)});
 await check(`${viewport.width}px one current results controller`,async()=>{const txt=await page.locator('script[src*="exact-retailer-fix.js"]').count();if(txt!==1)throw Error(`expected one results controller script, got ${txt}`)});
 await check(`${viewport.width}px no duplicate ids`,async()=>{const d=await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);return[...new Set(ids.filter((x,i)=>ids.indexOf(x)!==i))]});if(d.length)throw Error(d.join(','))});
 await check(`${viewport.width}px no uncaught JS errors`,async()=>{if(errors.length)throw Error(errors.join(' | '))});
 await ctx.close();
}

async function mockedProductFlow(){
 const ctx=await browser.newContext({viewport:{width:390,height:844},geolocation:{latitude:-25.7479,longitude:28.2293},permissions:['geolocation']});
 const page=await ctx.newPage();
 await page.route('**/api/search',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({identification:{object:'sneaker',brand:'Nike',model:'Air Force 1 Low',name:'Nike Air Force 1 Low',category:'footwear',retailCategory:'footwear',searchQuery:'Nike Air Force 1 Low white blue',summary:'White and blue Nike Air Force 1 Low.',confidence:.98,visibleText:['AIR','NIKE']}})}));
 await page.route('**/api/product-intelligence-v2',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,offers:[{product_name:'Nike Air Force 1 Low White Blue',price:2399.95,currency:'ZAR',availability:'in_stock',product_url:'https://www.sportscene.co.za/product/nike-air-force-1-low-test',verified:true,source:'Retailer structured product data',retailer:{name:'Sportscene'},matchScore:.96}],webRetailers:[{name:'Sportscene',searchUrl:'https://www.sportscene.co.za/search?q=Nike%20Air%20Force%201%20Low'}]})}));
 await page.route('**/api/nearby',async r=>{const body=r.request().postDataJSON?.()||{};if(body.mode==='likely')return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,stores:[{id:'sportscene-1',name:'Sportscene Menlyn',address:'Menlyn Park, Pretoria',lat:-25.782,lon:28.275,distanceKm:5.9,phone:'+27123456789',website:'https://www.sportscene.co.za',exactProductMatch:false,stockVerified:false,branchStockVerified:false,directionsAvailable:true}],message:'Found 1 relevant nearby store.'})});return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,stores:[],branchStockVerified:false})})});
 await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('#photo').setInputFiles({name:'shoe.jpg',mimeType:'image/jpeg',buffer:Buffer.from([255,216,255,217])});await page.waitForTimeout(300);
 await page.locator('#search').click();await page.locator('#resultName').waitFor({state:'visible',timeout:8000});await page.waitForTimeout(700);
 await check('mock flow keeps accurate identification',async()=>{if(!/Nike Air Force 1 Low/i.test(await page.locator('#resultName').innerText()))throw Error('identification missing')});
 await check('mock flow shows live price',async()=>{const t=await page.locator('#exactSellerResults').innerText();if(!/2.?399|2399/i.test(t))throw Error(t)});
 await check('mock flow shows online stock separately',async()=>{const t=await page.locator('#nearbyStores').innerText();if(!/In stock online/i.test(t))throw Error(t);if(!/branch (stock )?(has )?not (been )?confirmed|Branch stock not confirmed/i.test(t))throw Error('branch disclaimer missing')});
 await check('mock flow pairs nearest same retailer',async()=>{const t=await page.locator('#nearbyStores').innerText();if(!/Sportscene Menlyn/i.test(t)||!/5\.9 km/i.test(t))throw Error(t)});
 await check('mock flow gives directions to real store without faking stock',async()=>{const t=await page.locator('#nearbyStores').innerText();if(!/Directions to store/i.test(t))throw Error(t);if(/✓ Branch stock confirmed/i.test(t))throw Error('fake branch stock claim')});
 await ctx.close();
}

async function apiAudit(){
 const post=async(path,body)=>{const r=await fetch(new URL(path,URL),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const d=await r.json().catch(()=>({}));return{r,d}};
 const samples=[
  {label:'shoe',body:{brand:'Nike',model:'Air Force 1 Low',name:'Nike Air Force 1 Low',query:'Nike Air Force 1 Low',category:'footwear',retailCategory:'footwear'},wanted:['Nike','Sportscene','Totalsports']},
  {label:'electronics',body:{brand:'Sony',model:'WH-1000XM5',name:'Sony WH-1000XM5 headphones',query:'Sony WH-1000XM5',category:'electronics',retailCategory:'electronics'},wanted:['Incredible Connection','Game']},
  {label:'grocery',body:{brand:'Twinsaver',name:'Twinsaver toilet paper',query:'Twinsaver toilet paper',category:'grocery',retailCategory:'grocery'},wanted:['Checkers','Pick n Pay']},
  {label:'hardware',body:{brand:'Bosch',model:'GSB 185-LI',name:'Bosch GSB 185-LI drill',query:'Bosch GSB 185-LI',category:'hardware',retailCategory:'hardware'},wanted:['Builders']}
 ];
 for(const s of samples)await check(`${s.label} commerce API is safe and relevant`,async()=>{const {r,d}=await post('/api/product-intelligence-v2',s.body);if(!r.ok||!d.ok)throw Error(`status ${r.status}`);const names=(d.retailerStatus||[]).map(x=>x.name);if(!s.wanted.some(x=>names.includes(x)))throw Error(`wrong retailers: ${names.join(', ')}`);for(const o of d.offers||[])if(o.branchStockVerified||o.directionsAvailable)throw Error('online offer faked branch data')});
 await check('nearby category lookup responds with real coordinates or clean empty state',async()=>{const {r,d}=await post('/api/nearby',{lat:-25.7479,lon:28.2293,radiusKm:10,mode:'likely',identification:{brand:'Nike',name:'Nike Air Force 1 Low',object:'sneaker',category:'footwear',retailCategory:'footwear'}});if(!r.ok||!d.ok||!Array.isArray(d.stores))throw Error(`status ${r.status}`);for(const s of d.stores){if(!Number.isFinite(Number(s.lat))||!Number.isFinite(Number(s.lon))||!Number.isFinite(Number(s.distanceKm)))throw Error('invalid store coordinates');if(s.exactProductMatch||s.stockVerified||s.branchStockVerified)throw Error('likely store faked exact stock')}});
}

await baseAudit({width:1440,height:900});
await baseAudit({width:390,height:844});
await mockedProductFlow();
await apiAudit();
await browser.close();
if(failures.length){console.error('\nFAILURES\n'+failures.join('\n'));process.exit(1)}
console.log('\nFINDIT_STABLE_PIPELINE_SMOKE_PASS');
