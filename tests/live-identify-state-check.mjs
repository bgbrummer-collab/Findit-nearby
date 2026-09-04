import { chromium } from 'playwright';
const URL='https://findit-nearby.vercel.app/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},geolocation:{latitude:-25.7479,longitude:28.2293},permissions:['geolocation']});
const page=await context.newPage();
await page.route('**/api/search',async route=>{
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({identification:{name:'FindIt Test Microphone',brand:'PROAR',model:'USB Condenser Microphone',object:'microphone',category:'electronics',retailCategory:'electronics',summary:'Test microphone',confidence:.99,searchQuery:'PROAR USB Condenser Microphone',likelyStoreTypes:['electronics']},offers:[]})});
});
await page.route('**/api/nearby',async route=>{
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,stores:[{name:'Test Electronics',distanceKm:1.2,address:'Pretoria'}],radiusKm:10})});
});
await page.route('**/api/product-intelligence*',async route=>{
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({matched:false,offers:[]})});
});
await page.route('**/api/analytics',async route=>{
  await route.fulfill({status:200,contentType:'application/json',body:'{}'});
});
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#finditExactShell',{state:'visible',timeout:30000});
await page.setInputFiles('#photo',{name:'test-microphone.png',mimeType:'image/png',buffer:Buffer.from('89504e470d0a1a0a','hex')});
await page.waitForTimeout(300);
const afterUpload=await page.evaluate(()=>({file:window.finditState?.file?.name||null,inputCount:document.querySelector('#photo')?.files?.length||0,disabled:document.querySelector('#fxSearchNow')?.disabled}));
console.log('AFTER_UPLOAD',JSON.stringify(afterUpload));
if(afterUpload.file!=='test-microphone.png')throw Error('dashboard state lost uploaded file');
if(afterUpload.inputCount!==1)throw Error('native file input was cleared before identification');
await page.click('#fxSearchNow');
await page.waitForFunction(()=>window.finditState?.result?.identification?.name==='FindIt Test Microphone',{timeout:15000});
await page.waitForTimeout(600);
const state=await page.evaluate(()=>({name:window.finditState?.result?.identification?.name||null,fxName:document.querySelector('#fxProductName')?.textContent?.trim()||null,status:document.querySelector('#fxStatus')?.textContent?.trim()||null,stores:(window.finditState?.stores||[]).map(x=>x.name)}));
console.log('AFTER_IDENTIFY',JSON.stringify(state));
if(state.name!=='FindIt Test Microphone')throw Error('identification result missing from current state');
if(state.fxName!=='FindIt Test Microphone')throw Error(`dashboard did not sync identified product: ${state.fxName}`);
await page.locator('#finditExactShell [data-fx="product"]:visible').first().click();
await page.waitForSelector('#fxStableModal:not(.hidden)',{timeout:5000});
const info=await page.locator('#fxStableBody').innerText();
console.log('PRODUCT_INFO',info.replace(/\s+/g,' ').slice(0,400));
if(/No product selected yet|Search for a product first/i.test(info))throw Error('Product Info still thinks no product is selected');
await page.keyboard.press('Escape');
await page.locator('#finditExactShell [data-fx="compare"]:visible').first().click();
await page.waitForSelector('#fxStableModal:not(.hidden)',{timeout:5000});
const compare=await page.locator('#fxStableBody').innerText();
console.log('COMPARE',compare.replace(/\s+/g,' ').slice(0,400));
if(/Search for a product first/i.test(compare))throw Error('Compare Prices still thinks no product is selected');
await browser.close();
console.log('LIVE_IDENTIFY_STATE_CHECK_PASS');
