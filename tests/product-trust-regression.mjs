import { chromium } from 'playwright';

const URL=process.env.FINDIT_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
let failures=0;
const pass=m=>console.log('[PASS]',m);
const fail=(m,e='')=>{failures++;console.error('[FAIL]',m,e||'')};
async function check(name,fn){try{await fn();pass(name)}catch(e){fail(name,e?.message||e)}}

const page=await browser.newPage({viewport:{width:390,height:844}});
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForSelector('#finditExactShell',{state:'visible',timeout:30000});
await page.waitForFunction(()=>window.finditTrustAudit?.filterOffers,{timeout:10000});

const nike={name:"Nike Air Force 1 '07 Low",brand:'Nike',model:"Air Force 1 '07 Low",object:'sneaker',category:'footwear',retailCategory:'footwear',searchQuery:"Nike Air Force 1 '07 Low white"};
const wrong={retailer:{name:'Ubuy'},product_name:"Nike Women's Modern Classic Basketball Shoe",product_url:'https://www.ubuy.co.za/product/WRONG/nike-womens-modern-classic-basketball-shoe',price:27240,currency:'ZAR',availability:'in_stock',verified:true,sourcePageVerified:true,matchScore:.99};
const exactLow={retailer:{name:'Ubuy'},product_name:"Nike Men's Air Force 1 '07 Low White",product_url:'https://www.ubuy.co.za/product/RIGHT/nike-air-force-1-07-low-white',price:4684,currency:'ZAR',availability:'in_stock',verified:true,sourcePageVerified:true,matchScore:.96};
const exactStrong={retailer:{name:'Ubuy'},product_name:"Nike Air Force 1 '07 Low White",product_url:'https://www.ubuy.co.za/product/BEST/nike-air-force-1-07-low-white',price:4599,currency:'ZAR',availability:'in_stock',verified:true,sourcePageVerified:true,matchScore:.99};

await check('wrong Nike variant is rejected',async()=>{
  const rows=await page.evaluate(({offers,i})=>window.finditTrustAudit.filterOffers(offers,i),{offers:[wrong,exactLow],i:nike});
  if(rows.length!==1)throw Error(`expected 1 exact offer, got ${rows.length}`);
  if(!/air force 1/i.test(rows[0].product_name))throw Error(rows[0].product_name||'wrong product kept');
});

await check('duplicate retailer offers collapse to strongest exact result',async()=>{
  const rows=await page.evaluate(({offers,i})=>window.finditTrustAudit.filterOffers(offers,i),{offers:[exactLow,exactStrong],i:nike});
  if(rows.length!==1)throw Error(`expected 1 Ubuy result, got ${rows.length}`);
  if(!/BEST/.test(rows[0].product_url))throw Error(`weaker duplicate kept: ${rows[0].product_url}`);
});

await check('branch stock is never inferred from online stock',async()=>{
  const rows=await page.evaluate(({offers,i})=>window.finditTrustAudit.filterOffers(offers,i),{offers:[exactStrong],i:nike});
  if(rows[0]?.branchStockVerified===true)throw Error('online offer promoted to branch stock');
});

await check('visible dashboard receives only filtered exact offers after lookup',async()=>{
  await page.route('**/api/product-intelligence-v2',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,offers:[wrong,exactLow,exactStrong]})}));
  await page.route('**/api/product-insights**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({researched:false})}));
  await page.evaluate(i=>{const s=window.finditState||window.state||{};window.finditState=s;s.result={identification:i};s.offers=[wrong,exactLow,exactStrong];document.dispatchEvent(new CustomEvent('findit:results-rendered'));document.dispatchEvent(new CustomEvent('findit:dashboard-sync'))},nike);
  await page.waitForTimeout(300);
  const filtered=await page.evaluate(()=>window.finditTrustAudit.filterOffers((window.finditState||window.state)?.offers||[],(window.finditState||window.state)?.result?.identification||{}));
  if(filtered.length!==1||!/air force 1/i.test(filtered[0].product_name))throw Error(JSON.stringify(filtered));
});

await check('Product Information does not display shipping/reviewer junk',async()=>{
  await page.unroute('**/api/product-intelligence-v2').catch(()=>{});
  await page.unroute('**/api/product-insights**').catch(()=>{});
  await page.route('**/api/product-intelligence-v2',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,offers:[{...exactStrong,research:{whatItDoes:"Nike Air Force 1 '07 Low is a low-top lifestyle sneaker with the Air Force 1 cupsole design.",pros:["Nike Air Force 1 '07 Low has a durable leather upper."],cons:['Got the product fast early and in good condition','18 July 2026 · via Trustpilot','Gerhardt','Nike Air Force 1 07 Low can feel firm during break-in.'],source:exactStrong.product_url}}]})}));
  await page.route('**/api/product-insights**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({researched:false})}));
  const button=page.locator('#finditExactShell [data-fx="product"]:visible').first();
  await button.click({timeout:5000});
  await page.waitForTimeout(700);
  const body=(await page.locator('#fxCompleteBody,#fxStableBody').allInnerTexts()).join('\n');
  if(/trustpilot|got the product fast|gerhardt|18 july 2026/i.test(body))throw Error(body);
});

await browser.close();
if(failures)process.exit(1);
console.log('FINDIT_PRODUCT_TRUST_REGRESSION_PASS');
