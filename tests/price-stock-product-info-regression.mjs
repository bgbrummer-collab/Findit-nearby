import { chromium } from 'playwright';
const BASE=process.env.FINDIT_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1365,height:900}});
await context.addInitScript(()=>localStorage.setItem('findit_premium_beta','1'));
const page=await context.newPage();
let researchPayload=null;
await page.route('**/api/product-insights',async route=>{
  if(route.request().method()==='POST'){
    try{researchPayload=JSON.parse(route.request().postData()||'{}')}catch{}
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({researched:true,whatItDoes:'A low-top lifestyle sneaker for everyday wear.',pros:['Leather upper offers durable everyday construction.'],cons:['Leather may require a short break-in period.'],bestFor:'Everyday casual wear',standOut:'Air cushioning',sources:[{title:'Nike',url:'https://www.nike.com/za/test'}]})});
  }
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({researched:false})});
});
await page.route('**/api/product-intelligence-v2',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,offers:[]})}));
await page.route('**/api/product-intelligence',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,offers:[]})}));
await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:35000});
await page.waitForSelector('#finditExactShell',{state:'visible',timeout:15000});
await page.waitForFunction(()=>typeof window.finditDashboardAction==='function',{timeout:15000});
await page.waitForFunction(()=>window.__finditCompareStockReliability===true,{timeout:15000});
await page.evaluate(()=>{
 const i={name:'Nike Air Force 1 Low',brand:'Nike',model:'Air Force 1 Low',object:'sneaker',category:'footwear',retailCategory:'footwear',searchQuery:'Nike Air Force 1 Low sneaker',summary:'A white Nike Air Force 1 Low sneaker with blue accents.',features:['low-top leather sneaker','Air cushioning'],visibleText:['NIKE','AIR'],confidence:.96,exactIdentityVerified:true};
 const mk=(price,url,availability='in_stock')=>({retailer:{name:'Nike'},product_name:'Nike Air Force 1 Low',price,currency:'ZAR',availability,product_url:url,verified:true,sourcePageVerified:true,matchScore:.98});
 window.finditState=window.finditState||{};
 window.finditState.result={identification:i};
 window.finditState.offers=[mk(1399.95,'https://www.nike.com/za/t/air-force-1-a'),mk(1399.95,'https://www.nike.com/za/t/air-force-1-b'),mk(2399.95,'https://www.nike.com/za/t/air-force-1-c'),{retailer:{name:'Totalsports'},product_name:'Nike Air Force 1 Low',price:1899.95,currency:'ZAR',availability:'in_stock',product_url:'https://www.totalsports.co.za/product/nike-air-force-1',verified:true,sourcePageVerified:true,matchScore:.96}];
 window.finditState.stores=[{name:'Nike',distanceKm:4.4,address:'Pretoria',branchStockVerified:false,branchPriceVerified:false},{name:'Totalsports',distanceKm:2.2,address:'Pretoria',branchStockVerified:false,branchPriceVerified:false}];
 window.productIntelligence={offers:window.finditState.offers};
 document.dispatchEvent(new CustomEvent('findit:dashboard-sync'));
});
const compare=page.locator('#finditExactShell [data-fx="compare"],#finditExactShell [data-fxnav="compare"]').filter({visible:true}).first();
await compare.click();
await page.waitForSelector('#fxOnlinePrices');
const retailerNames=await page.locator('#fxOnlinePrices .fx-stable-row > div:first-child > b').allTextContents();
if(retailerNames.filter(x=>x.trim()==='Nike').length!==1)throw Error(`Compare Prices duplicate Nike rows: ${JSON.stringify(retailerNames)}`);
if(!retailerNames.includes('Totalsports'))throw Error(`Compare Prices missing Totalsports: ${JSON.stringify(retailerNames)}`);
const compareText=await page.locator('#fxStableBody').innerText();
if(!/Nearby stores to check/i.test(compareText)||!/Price not verified for this branch/i.test(compareText))throw Error('Compare Prices does not expose nearby stores truthfully when branch prices are unavailable');
await page.locator('#fxStableModal .fx-stable-close').click();
const stock=page.locator('#finditExactShell [data-fx="stock"]').filter({visible:true}).first();
await stock.click();await page.waitForTimeout(100);
const stockText=await page.locator('#fxStableBody').innerText();
if(!/Nike/i.test(stockText)||!/Totalsports/i.test(stockText)||!/In stock online/i.test(stockText))throw Error(`Live Stock missing online retailer evidence: ${stockText.slice(0,500)}`);
if(!/Branch availability not published\/verified/i.test(stockText))throw Error('Live Stock falsely omits truthful unknown branch status');
await page.locator('#fxStableModal .fx-stable-close').click();
const product=page.locator('#finditExactShell [data-fx="product"],#finditExactShell [data-stable-action="product"]').filter({visible:true}).first();
await product.click();
await page.waitForFunction(()=>/low-top lifestyle sneaker/i.test(document.querySelector('#fxStableResearch')?.innerText||''),null,{timeout:5000});
if(!researchPayload?.identification?.model)throw Error('Product Information did not POST the current identification');
if(!Array.isArray(researchPayload?.offers)||researchPayload.offers.length<2)throw Error('Product Information did not pass verified retailer offers to research backend');
console.log('PRICE_STOCK_PRODUCT_INFO_REGRESSION_PASS',JSON.stringify({retailerNames,researchOfferCount:researchPayload.offers.length}));
await browser.close();
