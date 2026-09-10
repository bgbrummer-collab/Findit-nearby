import { chromium } from 'playwright';
import fs from 'node:fs';

const URL=process.env.FINDIT_URL||'https://findit-nearby.vercel.app/';
const img='/tmp/findit-marc-user-value.jpg';
fs.writeFileSync(img,Buffer.from(fs.readFileSync('tests/user-images/marc-anthony.jpg.b64','utf8').trim(),'base64'));

const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({viewport:{width:1440,height:900},geolocation:{latitude:-25.7479,longitude:28.2293},permissions:['geolocation']});
const page=await ctx.newPage();
page.setDefaultTimeout(120000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const api=[];page.on('response',r=>{if(/\/api\/(product-insights|product-intelligence-v2)/.test(r.url()))api.push([r.status(),r.url()])});
const fail=m=>{throw new Error(m)};
async function closeModal(){const x=page.locator('#fxStableModal .fx-stable-close').first();if(await x.count()&&await x.isVisible().catch(()=>false))await x.click({force:true}).catch(()=>{});await page.keyboard.press('Escape').catch(()=>{});await page.waitForTimeout(100)}
async function openAction(a){await closeModal();const el=page.locator(`#finditExactShell [data-fx="${a}"]:visible,#finditExactShell [data-fxnav="${a}"]:visible`).first();if(!await el.count())fail(`missing ${a} action`);await el.click({force:true});await page.waitForTimeout(250)}

await page.goto(URL,{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#finditExactShell',{state:'visible'});
await page.evaluate(()=>localStorage.setItem('findit_premium_beta','1'));
await page.reload({waitUntil:'domcontentloaded'});
await page.waitForSelector('#finditExactShell',{state:'visible'});
await page.locator('#finditExactShell [data-location-direct]').click();
await page.waitForFunction(()=>Number.isFinite(Number(window.finditState?.coords?.lat)));
await page.locator('#photo').setInputFiles(img);
await page.waitForTimeout(300);
await page.locator('#fxSearchNow').click();
await page.waitForFunction(()=>/Search complete\./i.test(document.querySelector('#fxStatus')?.textContent||''),null,{timeout:120000});
const ident=await page.evaluate(()=>window.finditState?.result?.identification||{});
if(!/marc anthony/i.test(`${ident.brand} ${ident.name} ${ident.model}`))fail(`wrong product identity ${JSON.stringify(ident)}`);
console.log('REAL_IDENTITY_OK',JSON.stringify({name:ident.name,brand:ident.brand,model:ident.model,query:ident.searchQuery}));

await openAction('product');
await page.waitForFunction(()=>/Exact-product web research loaded\./i.test(document.querySelector('#fxStableResearch')?.textContent||''),null,{timeout:70000});
const product=await page.locator('#fxStableResearch').innerText();
if(!/What it does/i.test(product)||!/\bPros\b/i.test(product)||!/Cons|considerations/i.test(product))fail(`missing product sections: ${product}`);
if(!/moist|curl|detang|frizz/i.test(product))fail(`product information is still generic: ${product}`);
if(!/Best for/i.test(product)||!/Stand-out point/i.test(product))fail(`product information lacks useful buying context: ${product}`);
if(/Exact-product research could not be loaded|conservative guidance/i.test(product))fail(`fallback shown despite live research: ${product}`);
console.log('REAL_PRODUCT_INFO_OK',product.replace(/\s+/g,' ').slice(0,900));

await openAction('compare');
await page.waitForFunction(()=>{const t=document.querySelector('#fxOnlinePrices')?.textContent||'';return /Clicks|Dis-Chem/i.test(t)&&/R\s*\d+/i.test(t)},null,{timeout:90000});
let compare=await page.locator('#fxStableBody').innerText();
if(/R\s*0(?:[,.]00)?\b/i.test(compare))fail(`zero price shown: ${compare}`);
if(!/Clicks|Dis-Chem/i.test(compare))fail(`no verified retailer in comparison: ${compare}`);
if(!/R\s*2\d\d/i.test(compare))fail(`no realistic verified ZAR price in comparison: ${compare}`);
console.log('REAL_COMPARE_OK',compare.replace(/\s+/g,' ').slice(0,1000));

await openAction('stock');
await page.waitForFunction(()=>/In stock online/i.test(document.querySelector('#fxStableBody')?.textContent||''),null,{timeout:90000});
const stock=await page.locator('#fxStableBody').innerText();
if(!/Clicks|Takealot/i.test(stock))fail(`no exact retailer stock evidence: ${stock}`);
if(!/branch stock/i.test(stock))fail(`branch-vs-online stock distinction missing: ${stock}`);
if(/verified in stock at this branch/i.test(stock))fail(`branch stock was invented: ${stock}`);
console.log('REAL_STOCK_OK',stock.replace(/\s+/g,' ').slice(0,1000));

const state=await page.evaluate(()=>({offers:(window.finditState?.offers||[]).map(o=>({retailer:o.retailer?.name||o.retailer,price:o.price,availability:o.availability,verified:o.verified,sourcePageVerified:o.sourcePageVerified,exact:o.exactProductMatch,branch:o.branchStockVerified,url:o.product_url||o.url})),stores:(window.finditState?.stores||[]).map(s=>({name:s.name,distance:s.distanceKm,branch:s.branchStockVerified,stock:s.stockStatus||s.stock||s.availability||null}))}));
const priced=state.offers.filter(o=>Number(o.price)>0&&o.verified===true&&o.sourcePageVerified===true&&o.exact!==false);
if(!priced.length)fail(`no verified positive price reached actual UI state: ${JSON.stringify(state)}`);
if(state.stores.some(s=>s.branch!==true&&/^(in_stock|out_of_stock|preorder|backorder)$/i.test(String(s.stock||''))))fail(`unverified branch stock reached UI state: ${JSON.stringify(state.stores)}`);
if(errors.length)fail(`page errors: ${errors.join(' | ')}`);
if(api.some(([s])=>s>=500))fail(`5xx product API response: ${JSON.stringify(api)}`);
console.log('LIVE_USER_VALUE_PASS',JSON.stringify({url:URL,verifiedPrices:priced.length,offers:state.offers.length,stores:state.stores.length,apiCalls:api.length}));
await browser.close();
