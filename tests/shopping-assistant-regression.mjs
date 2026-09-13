import { chromium } from 'playwright';

const URL=process.env.FINDIT_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1365,height:900}});
page.setDefaultTimeout(30000);
const fail=m=>{throw new Error(m)};
await page.route('**/api/product-intelligence',async route=>{
  const req=route.request();
  let body={};try{body=JSON.parse(req.postData()||'{}')}catch{}
  if(body.barcode||/^\d{6,18}$/.test(String(body.query||''))){
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({matched:true,bestProduct:{name:'Barcode Test Product',barcode:body.barcode||body.query},offers:[]})});return;
  }
  await route.continue();
});
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#finditExactShell',{state:'visible'});
await page.waitForFunction(()=>window.__finditShoppingAssistantUi===true&&window.__finditShoppingAssistantCurrentOfferGuard===true&&typeof window.finditShoppingAssistantRefresh==='function'&&typeof window.finditShoppingPlan==='function'&&window.__finditDashboardV8Loader===true);
await page.evaluate(()=>{
 const s=window.finditState;
 s.coords={lat:-25.747,lon:28.188};
 s.result={identification:{name:'Test Headphones',brand:'TestBrand',model:'X1',confidence:.95}};
 s.offers=[
  {retailer:'Retailer A',price:899,currency:'ZAR',availability:'in_stock',verified:true,exactProductMatch:true},
  {retailer:'Retailer B',price:799,currency:'ZAR',availability:'in_stock',verified:true,exactProductMatch:true}
 ];
 window.productIntelligence={offers:[{retailer:'Stale Retailer',price:1,currency:'ZAR',availability:'in_stock',verified:true,exactProductMatch:true}]};
 s.stores=[
  {name:'Retailer A',distanceKm:1.2,address:'1 Test Road',phone:'+27123456789',website:'https://example.com/a',openingHours:'Mo-Su 08:00-18:00',openNow:true,lat:-25.75,lon:28.19},
  {name:'Retailer B',distanceKm:3.4,address:'2 Test Road',phone:'+27987654321',website:'https://example.com/b',openingHours:'Mo-Su 09:00-17:00',openNow:true,lat:-25.76,lon:28.20}
 ];
 const list=document.querySelector('#nearbyStores')||document.querySelector('#finditExactShell');
 list.innerHTML='<article data-store="0">Retailer A</article><article data-store="1">Retailer B</article>';
 ['findit.shoppingList.v1','findit.watchList.v1','findit.shoppingList.v2','findit.watchList.v2','findit.watchAlerts.v1','findit.priceHistory.v1','findit.shoppingPlanMode.v1'].forEach(k=>localStorage.removeItem(k));
 document.dispatchEvent(new CustomEvent('findit:results-rendered'));
});
await page.waitForSelector('#fxShoppingAssistant',{state:'visible'});
await page.waitForTimeout(80);

await page.locator('#fxAddCurrentItem').click();
let listText=await page.locator('#fxShoppingListBody').innerText();
if(!/Test Headphones/i.test(listText))fail('Shopping List did not add the current item');
const plan=await page.evaluate(()=>window.finditShoppingPlan());
if(!plan||plan.stops.length!==1||plan.stops[0].name!=='Retailer B'||Number(plan.total)!==799){
  fail(`Balanced plan did not use the current verified R799 retailer. plan=${JSON.stringify(plan)} ui=${JSON.stringify(listText)}`);
}
if(plan.chosen.some(x=>x.offer?.retailer==='Stale Retailer'))fail('A stale prior-search offer contaminated the plan data');
if(!/Retailer B/i.test(listText)||!/799(?:[.,]00)?/i.test(listText))fail(`Shopping List did not render the verified plan. ui=${JSON.stringify(listText)} plan=${JSON.stringify(plan)}`);
if(/Stale Retailer/i.test(listText))fail('A stale prior-search retailer contaminated the current Shopping List plan');
if(!/Optimised verified shopping plan/i.test(listText))fail('Trip planner is missing');
if(!plan.url||!plan.url.includes('google.com/maps/dir'))fail('Trip planner did not create a directions route');
await page.locator('[data-plan-mode="shortest"]').click();
listText=await page.locator('#fxShoppingListBody').innerText();
if(!/Shortest trip/i.test(listText))fail('Shortest-trip planning mode did not activate');

await page.locator('#fxWatchCurrentItem').click();
let watchText=await page.locator('#fxWatchBody').innerText();
if(!/Test Headphones/i.test(watchText)||!/Retailer B/i.test(watchText)){
  const watchState=await page.evaluate(()=>({stored:localStorage.getItem('findit.watchList.v2'),offers:window.finditState?.offers,product:window.finditState?.result?.identification}));
  fail(`Watch Item did not persist the current product. ui=${JSON.stringify(watchText)} state=${JSON.stringify(watchState)}`);
}
await page.evaluate(()=>{
  window.finditState.offers=[
   {retailer:'Retailer A',price:899,currency:'ZAR',availability:'in_stock',verified:true,exactProductMatch:true},
   {retailer:'Retailer B',price:699,currency:'ZAR',availability:'in_stock',verified:true,exactProductMatch:true}
  ];
  document.dispatchEvent(new CustomEvent('findit:results-rendered'));
});
await page.waitForTimeout(100);
watchText=await page.locator('#fxWatchBody').innerText();
if(!/Price drop/i.test(watchText)||!/699/.test(watchText))fail(`Watch Item did not create a persistent price-drop alert. ui=${JSON.stringify(watchText)}`);
if(!/low/i.test(watchText)||!/high/i.test(watchText))fail(`Watch Item did not preserve price-history summary. ui=${JSON.stringify(watchText)}`);

await page.waitForSelector('[data-store="0"] [data-check-store]',{state:'visible'});
await page.locator('[data-store="0"] [data-check-store]').click();
await page.waitForSelector('#fxShopModal',{state:'visible'});
const storeText=await page.locator('#fxShopModal').innerText();
if(!/Retailer A/i.test(storeText)||!storeText.includes('+27123456789')||!/Call to confirm stock/i.test(storeText)||!/Directions/i.test(storeText)||!/Opening hours/i.test(storeText))fail('Check Store did not show contact, hours and directions actions');
await page.locator('#fxShopModal [data-close-shop]').click();

await page.locator('#fxBarcodeScan').click();
await page.waitForSelector('#fxBarcodeManual',{state:'visible'});
await page.locator('#fxBarcodeManual').fill('6001234567890');
await page.locator('#fxUseBarcode').click();
await page.waitForFunction(()=>window.finditLastBarcodeProduct?.name==='Barcode Test Product');
const code=await page.evaluate(()=>window.finditLastBarcode);
if(code!=='6001234567890')fail('Barcode manual fallback did not capture the barcode');
const barcodeText=await page.locator('#fxBarcodeStatus').innerText();
if(!/Barcode Test Product/i.test(barcodeText))fail('Barcode lookup did not feed connected product identification back into the UI');

await page.setViewportSize({width:390,height:844});
await page.waitForTimeout(100);
const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
if(overflow>4)fail(`Shopping Assistant caused mobile horizontal overflow: ${overflow}px`);
console.log('SHOPPING_ASSISTANT_COMPLETE_PASS');
await browser.close();
