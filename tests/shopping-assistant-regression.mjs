import { chromium } from 'playwright';

const URL=process.env.FINDIT_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1365,height:900}});
page.setDefaultTimeout(30000);
const fail=m=>{throw new Error(m)};
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#finditExactShell',{state:'visible'});
await page.waitForFunction(()=>window.__finditShoppingAssistantUi===true&&typeof window.finditShoppingAssistantRefresh==='function');
await page.evaluate(()=>{
 const s=window.finditState;
 s.result={identification:{name:'Test Headphones',brand:'TestBrand',model:'X1',confidence:.95}};
 s.offers=[
  {retailer:'Retailer A',price:899,currency:'ZAR',availability:'in_stock',verified:true,exactProductMatch:true},
  {retailer:'Retailer B',price:799,currency:'ZAR',availability:'in_stock',verified:true,exactProductMatch:true}
 ];
 s.stores=[
  {name:'Retailer A',distanceKm:1.2,address:'1 Test Road',phone:'+27123456789',website:'https://example.com/a',openingHours:'Mo-Su 08:00-18:00',lat:-25.75,lon:28.19},
  {name:'Retailer B',distanceKm:3.4,address:'2 Test Road',phone:'+27987654321',website:'https://example.com/b',openingHours:'Mo-Su 09:00-17:00',lat:-25.76,lon:28.20}
 ];
 const list=document.querySelector('#nearbyStores')||document.querySelector('#finditExactShell');
 list.innerHTML='<article data-store="0">Retailer A</article><article data-store="1">Retailer B</article>';
 localStorage.removeItem('findit.shoppingList.v1');
 localStorage.removeItem('findit.watchList.v1');
 window.finditShoppingAssistantRefresh();
});
await page.waitForSelector('#fxShoppingAssistant',{state:'visible'});
await page.locator('#fxAddCurrentItem').click();
let listText=await page.locator('#fxShoppingListBody').innerText();
if(!/Test Headphones/i.test(listText))fail('Shopping List did not add the current item');
if(!/Retailer B/i.test(listText)||!/R\s?799|799\.00/i.test(listText))fail('Shopping List did not calculate a verified cheapest plan');
await page.locator('#fxWatchCurrentItem').click();
const watchText=await page.locator('#fxWatchBody').innerText();
if(!/Test Headphones/i.test(watchText)||!/Retailer B/i.test(watchText))fail('Watch Item did not persist the current product');
await page.waitForSelector('[data-store="0"] [data-check-store]',{state:'visible'});
await page.locator('[data-store="0"] [data-check-store]').click();
await page.waitForSelector('#fxShopModal',{state:'visible'});
const storeText=await page.locator('#fxShopModal').innerText();
if(!/Retailer A/i.test(storeText)||!/+27123456789/.test(storeText)||!/Call to confirm stock/i.test(storeText)||!/Directions/i.test(storeText))fail('Check Store did not show contact and directions actions');
await page.locator('#fxShopModal [data-close-shop]').click();
await page.locator('#fxBarcodeScan').click();
await page.waitForSelector('#fxBarcodeManual',{state:'visible'});
await page.locator('#fxBarcodeManual').fill('6001234567890');
await page.locator('#fxUseBarcode').click();
const code=await page.evaluate(()=>window.finditLastBarcode);
if(code!=='6001234567890')fail('Barcode manual fallback did not capture the barcode');
await page.setViewportSize({width:390,height:844});
await page.waitForTimeout(100);
const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
if(overflow>4)fail(`Shopping Assistant caused mobile horizontal overflow: ${overflow}px`);
console.log('SHOPPING_ASSISTANT_PASS');
await browser.close();
