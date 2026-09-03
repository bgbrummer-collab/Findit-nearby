import { chromium } from 'playwright';

const URL=process.env.FINDIT_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1280,height:900}});
let failures=0;
const pass=m=>console.log('[PASS]',m);
const fail=(m,e='')=>{failures++;console.error('[FAIL]',m,e||'')};
async function check(name,fn){try{await fn();pass(name)}catch(e){fail(name,e?.message||e)}}

await page.route('**/api/product-insights**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({researched:true,whatItDoes:'A low-top lifestyle sneaker.',pros:['Durable leather upper.'],cons:['Can feel firm during break-in.']})}));
await page.route('**/api/product-intelligence-v2',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,offers:[{retailer:{name:'Test Retailer'},product_name:"Nike Air Force 1 '07 Low White",product_url:'https://example.com/nike-air-force-1-07-low-white',price:1999,currency:'ZAR',availability:'in_stock',verified:true,sourcePageVerified:true}]})}));
await page.route('**/api/product-intelligence',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,offers:[]})}));
await page.route('**/api/assistant',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,answer:'This is a test answer.'})}));

await page.goto(URL,{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForSelector('#finditExactShell',{state:'visible',timeout:30000});
await page.waitForFunction(()=>typeof window.finditDashboardAction==='function',{timeout:10000});
await page.evaluate(()=>{
  const s=window.finditState||window.state||{};
  window.finditState=s;
  s.result={identification:{name:"Nike Air Force 1 '07 Low",brand:'Nike',model:"Air Force 1 '07 Low",object:'sneaker',category:'footwear',retailCategory:'footwear',searchQuery:"Nike Air Force 1 '07 Low white"}};
  s.stores=[{name:'Nike',distanceKm:4.7,address:'Pretoria',branchStockVerified:false},{name:'Totalsports',distanceKm:2.5,address:'Pretoria',branchStockVerified:false}];
  s.offers=[];
  document.dispatchEvent(new CustomEvent('findit:dashboard-sync'));
});

await check('settings restores multiple working controls',async()=>{
  await page.locator('#finditExactShell [data-fx="settings"]').click();
  const body=page.locator('#fxStableBody');
  const text=await body.innerText();
  for(const label of ['Search radius','Store sorting','Verified price & stock checks','Refresh current results','Update my location','Reset settings'])if(!text.includes(label))throw Error(`missing ${label}`);
  await page.selectOption('#fxStableRadius','15');
  await page.selectOption('#fxStableSort','closest');
  await page.uncheck('#fxStableAutoVerify');
  await page.click('#fxStableApplySettings');
  const saved=await page.evaluate(()=>({radius:localStorage.getItem('finditRadius'),sort:localStorage.getItem('finditStoreSort'),auto:localStorage.getItem('finditAutoVerify'),stateRadius:(window.finditState||window.state)?.radius}));
  if(saved.radius!=='15'||saved.sort!=='closest'||saved.auto!=='0'||Number(saved.stateRadius)!==15)throw Error(JSON.stringify(saved));
  await page.locator('.fx-stable-close').click();
});

await check('Product Information opens and renders researched content',async()=>{
  await page.locator('#finditExactShell [data-fx="product"]:visible').first().click();
  await page.waitForSelector('#fxStableResearch');
  await page.waitForFunction(()=>document.querySelector('#fxStableResearch')?.textContent?.includes('A low-top lifestyle sneaker.'),{timeout:5000});
  const text=await page.locator('#fxStableBody').innerText();
  if(!text.includes('Product Information')||!text.includes('Pros')||!text.includes('Cons / considerations'))throw Error(text);
  await page.locator('.fx-stable-close').click();
});

await check('Compare Prices can actively verify and render a price',async()=>{
  await page.locator('#finditExactShell [data-fx="compare"]:visible').first().click();
  await page.click('#fxRefreshPrices');
  await page.waitForFunction(()=>document.querySelector('#fxOnlinePrices')?.textContent?.includes('Test Retailer'),{timeout:5000});
  const text=await page.locator('#fxStableBody').innerText();
  if(!/R\s?1[,.]?999/.test(text.replace(/ /g,' ')))throw Error(text);
  await page.locator('.fx-stable-close').click();
});

await check('Live Stock opens the stock tool and renders verified stock',async()=>{
  const live=page.locator('#finditExactShell article').filter({hasText:'Live Stock'}).first();
  await live.click();
  await page.click('#fxRefreshStock');
  await page.waitForFunction(()=>document.querySelector('#fxStockRows')?.textContent?.includes('Test Retailer'),{timeout:5000});
  const text=await page.locator('#fxStableBody').innerText();
  if(!text.includes('Live Stock')||!text.toLowerCase().includes('in stock'))throw Error(text);
  await page.locator('.fx-stable-close').click();
});

await check('Ask FindIt uses the polished primary action and returns an answer',async()=>{
  await page.locator('#finditExactShell [data-fx="assistant"]:visible').first().click();
  const bg=await page.locator('#fxAskSend').evaluate(el=>getComputedStyle(el).backgroundImage);
  if(!/gradient/i.test(bg))throw Error(`button is not styled: ${bg}`);
  await page.fill('#fxAskQuestion','What is this?');
  await page.click('#fxAskSend');
  await page.waitForFunction(()=>document.querySelector('#fxAskAnswer')?.textContent?.includes('test answer'),{timeout:5000});
});

await browser.close();
if(failures)process.exit(1);
console.log('FINDIT_DASHBOARD_TOOLS_REGRESSION_PASS');
