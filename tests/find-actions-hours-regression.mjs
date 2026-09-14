import { chromium } from 'playwright';

const URL=process.env.FINDIT_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1365,height:900}});
page.setDefaultTimeout(30000);
const fail=m=>{throw new Error(m)};
let hoursRequests=0;
await page.route('**/api/assistant?action=store-hours',async route=>{
  hoursRequests++;
  const req=route.request();
  const body=req.postDataJSON();
  if(!Array.isArray(body?.stores)||!body.stores.some(x=>x.name==='Computer Mania'))fail('Live hours request did not include the exact nearby branch');
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,researchMode:'google-search-grounded',checkedAt:new Date().toISOString(),timeZone:'Africa/Johannesburg',stores:[
    {name:'Computer Mania',address:'Menlyn Park, Pretoria',status:'open',opensAt:'',closesAt:'18:00',todayHours:'09:00–18:00',sourceLabel:'Google Search grounded'},
    {name:'Retailer B',address:'Pretoria',status:'closed',opensAt:'09:00',closesAt:'',todayHours:'09:00–17:00',sourceLabel:'Google Search grounded'}
  ],sources:[{title:'Computer Mania branch hours',url:'https://example.com/hours'}]})});
});
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#finditExactShell',{state:'visible'});
await page.waitForFunction(()=>window.__finditSmartChoiceUi===true&&window.__finditShoppingAssistantUi===true&&window.__finditFindActionsHours===true);
await page.evaluate(()=>{
  localStorage.removeItem('finditSaved');
  localStorage.removeItem('findit.shoppingList.v2');
  localStorage.removeItem('findit.storeHoursGrounded.v1');
  const s=window.finditState;
  s.result={identification:{name:'Test Headphones',brand:'Test Brand',model:'X1',object:'headphones',confidence:.88,searchQuery:'Test Brand X1 headphones'}};
  s.offers=[{retailer:'Computer Mania',price:999,currency:'ZAR',availability:'in_stock',verified:true,exactProductMatch:true}];
  s.stores=[
    {name:'Computer Mania',address:'Menlyn Park, Pretoria',distanceKm:2.4,lat:-25.783,lon:28.275},
    {name:'Retailer B',address:'Pretoria',distanceKm:4.1,lat:-25.75,lon:28.22}
  ];
  window.finditSmartChoiceRefresh?.();
  window.finditShoppingAssistantRefresh?.();
  document.dispatchEvent(new CustomEvent('findit:dashboard-sync'));
});
await page.waitForSelector('#fxQuickAddShopping',{state:'visible'});
await page.waitForSelector('#fxQuickSaveFind',{state:'visible'});
await page.locator('#fxQuickAddShopping').click();
await page.waitForFunction(()=>{try{return JSON.parse(localStorage.getItem('findit.shoppingList.v2')||'[]').some(x=>/test headphones/i.test(x.name||''))}catch{return false}});
if(!/In Shopping List/i.test(await page.locator('#fxQuickAddShopping').innerText()))fail('Shopping List button did not show saved state');
await page.locator('#fxQuickSaveFind').click();
await page.waitForFunction(()=>{try{return JSON.parse(localStorage.getItem('finditSaved')||'[]').some(x=>/test headphones/i.test(x.name||''))}catch{return false}});
if(!/Find Saved/i.test(await page.locator('#fxQuickSaveFind').innerText()))fail('Save Find button did not show saved state');
await page.waitForFunction(()=>/Open now/i.test(document.querySelector('#fxStoreHoursLive')?.innerText||'')&&/Closes 18:00/i.test(document.querySelector('#fxStoreHoursLive')?.innerText||'')&&/Closed/i.test(document.querySelector('#fxStoreHoursLive')?.innerText||'')&&/Opens 09:00/i.test(document.querySelector('#fxStoreHoursLive')?.innerText||''),null,{timeout:30000});
const hoursText=await page.locator('#fxStoreHoursLive').innerText();
if(!/Google checked/i.test(hoursText))fail('Store hours did not identify the live grounded check');
if(hoursRequests<1)fail('FindIt did not request live branch hours');
await page.evaluate(()=>window.finditDashboardAuditAction?.('saved'));
await page.waitForSelector('#fxStableModal:not(.hidden)',{state:'visible'});
if(!/Test Headphones/i.test(await page.locator('#fxStableBody').innerText()))fail('Saved Items did not show the saved Find');
await page.locator('.fx-stable-close').click();
await page.setViewportSize({width:390,height:844});
await page.waitForTimeout(100);
const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
if(overflow>4)fail(`Find actions/store hours caused mobile overflow: ${overflow}px`);
console.log('FIND_ACTIONS_HOURS_PASS');
await browser.close();
