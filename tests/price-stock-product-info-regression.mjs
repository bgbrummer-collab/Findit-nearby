import { chromium } from 'playwright';
const BASE=process.env.FINDIT_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1365,height:900}});
await context.addInitScript(()=>localStorage.setItem('findit_premium_beta','1'));
const page=await context.newPage();
const offers=[
 {retailer:{name:'Loot.co.za'},product_name:'Marc Anthony Strictly Curls 3x Moisture Triple Blend Conditioner (250ml)',price:200,currency:'ZAR',availability:null,product_url:'https://www.loot.co.za/product/marc-anthony-conditioner',verified:true,exactProductMatch:true,matchScore:92},
 {retailer:{name:'Dis-Chem'},product_name:'Marc Anthony Strictly Curls 3 x Moisture Triple Blend Conditioner 250ml',price:229.99,currency:'ZAR',availability:null,product_url:'https://www.dischem.co.za/marc-anthony-conditioner',verified:true,exactProductMatch:true,matchScore:92},
 {retailer:{name:'PriceCheck'},product_name:'Marc Anthony Strictly Curls Triple Blend Conditioner',price:null,currency:'ZAR',availability:null,product_url:'https://www.pricecheck.co.za/offers/example',verified:true,exactProductMatch:true,matchScore:96},
 {retailer:{name:'Amazon South Africa'},product_name:'Marc Anthony Strictly Curls Conditioner',price:null,currency:'ZAR',availability:null,product_url:'https://www.amazon.co.za/example',verified:true,exactProductMatch:true,matchScore:92}
];
await page.route('**/api/product-insights?**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({researched:true,whatItDoes:'A moisturising conditioner made for curly hair that adds slip and helps reduce frizz.',pros:['Adds moisture to dry curls.','Provides slip for easier detangling.','Helps improve manageability and shine.'],cons:['Rich conditioning may feel heavy on some fine hair types.'],bestFor:'Dry or frizz-prone curly hair',standOut:'Marula oil, coconut and shea butter blend',sources:[{title:'Marc Anthony',url:'https://marcanthony.com/products/strictly-curls-conditioner'}]})}));
await page.route('**/api/product-intelligence-v2',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,matched:true,exactMatchVerified:true,offers})}));
await page.route('**/api/product-intelligence',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,matched:true,exactMatchVerified:true,offers})}));
await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:35000});
await page.waitForSelector('#finditExactShell',{state:'visible',timeout:15000});
await page.waitForFunction(()=>window.__finditDashboardRetailerRelevance===true&&window.__finditCompareStockReliability===true&&window.__finditProductInfoClickFix===true,{timeout:15000});
await page.evaluate((offers)=>{
 const i={name:'Marc Anthony Strictly Curls Triple Blend Conditioner 250ml',brand:'Marc Anthony',model:'Strictly Curls Triple Blend',object:'conditioner',category:'beauty',retailCategory:'beauty',searchQuery:'Marc Anthony Strictly Curls Triple Blend Conditioner 250ml',summary:'A yellow squeeze tube of Marc Anthony Strictly Curls Triple Blend Conditioner, 250ml.',features:['yellow tube','squeeze tube','hair conditioner'],visibleText:['MARC ANTHONY','STRICTLY CURLS','Triple Blend CONDITIONER','Marula, Coconut + Shea','8.4 fl. oz. | 250 ml'],confidence:.97,exactIdentityVerified:true};
 window.finditState=window.finditState||{};
 window.finditState.result={identification:i};
 window.finditState.offers=offers;
 window.finditState.stores=[
  {name:'Clicks',distanceKm:2.1,address:'Pretoria',branchStockVerified:false,branchPriceVerified:false},
  {name:'Woolworths',distanceKm:2.4,address:'Pretoria',branchStockVerified:false,branchPriceVerified:false},
  {name:'Dis-Chem',distanceKm:5.6,address:'Pretoria',branchStockVerified:false,branchPriceVerified:false},
  {name:'Makro',distanceKm:7.8,address:'Pretoria',branchStockVerified:false,branchPriceVerified:false}
 ];
 window.productIntelligence={offers};
 document.dispatchEvent(new CustomEvent('findit:results-rendered',{detail:{result:window.finditState.result}}));
 document.dispatchEvent(new CustomEvent('findit:dashboard-sync'));
 document.dispatchEvent(new CustomEvent('findit:nearby-updated'));
},offers);
await page.waitForTimeout(350);
const product=page.locator('#finditExactShell [data-fx="product"]').filter({visible:true}).first();
await product.click();
await page.waitForFunction(()=>/What it does/i.test(document.querySelector('#fxStableBody')?.innerText||'')&&/Adds moisture/i.test(document.querySelector('#fxStableBody')?.innerText||''),null,{timeout:7000});
let txt=await page.locator('#fxStableBody').innerText();
if(!/Pros/i.test(txt)||!/Cons \/ considerations/i.test(txt)||!/curly hair/i.test(txt))throw Error(`Product info incomplete: ${txt.slice(0,700)}`);
await page.locator('#fxStableModal .fx-stable-close').click();
const compare=page.locator('#finditExactShell [data-fx="compare"],#finditExactShell [data-fxnav="compare"]').filter({visible:true}).first();
await compare.click();
await page.waitForFunction(()=>/Loot\.co\.za/i.test(document.querySelector('#fxStableBody')?.innerText||''),null,{timeout:7000});
txt=await page.locator('#fxStableBody').innerText();
if(!/R\s?200[,.]00/i.test(txt)||!/R\s?229[,.]99/i.test(txt))throw Error(`Real prices missing: ${txt.slice(0,900)}`);
if(/(^|\n)R\s*0[,.]00(\n|$)/i.test(txt))throw Error(`Unknown price rendered as zero: ${txt.slice(0,900)}`);
if(!/Price not published/i.test(txt)||!/PriceCheck/i.test(txt))throw Error('Unpriced exact listings are not labelled honestly');
if(!/Nearby branches of retailers with the exact product online/i.test(txt)||!/Dis-Chem/i.test(txt))throw Error('Exact-retailer nearby branch grouping missing');
await page.locator('#fxStableModal .fx-stable-close').click();
const stock=page.locator('#finditExactShell [data-fx="stock"],#finditExactShell [data-fx="nearby"]').filter({hasText:'Live Stock'}).first();
await stock.click();
await page.waitForFunction(()=>/Live Stock/i.test(document.querySelector('#fxStableBody')?.innerText||''),null,{timeout:3000});
txt=await page.locator('#fxStableBody').innerText();
if(!/No retailer currently publishes a trustworthy stock signal/i.test(txt))throw Error(`Stock truthfulness missing: ${txt.slice(0,700)}`);
if(/Verified in stock at this branch/i.test(txt))throw Error('Branch stock was fabricated');
await page.locator('#fxStableModal .fx-stable-close').click();
await page.waitForTimeout(200);
const firstStore=await page.locator('#fxStoreList .fx-store b').first().innerText();
if(firstStore!=='Dis-Chem')throw Error(`Dashboard did not prioritize a nearby retailer that actually lists the exact product: ${firstStore}`);
const best=await page.locator('#fxBestPrice').innerText();
if(!/200/.test(best)||/^R\s*0(?:[,.]00)?$/i.test(best.trim()))throw Error(`Best verified price wrong: ${best}`);
console.log('PRICE_STOCK_PRODUCT_INFO_REGRESSION_PASS',JSON.stringify({best,firstStore}));
await browser.close();
