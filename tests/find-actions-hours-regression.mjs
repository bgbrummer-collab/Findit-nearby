import { chromium } from 'playwright';

const URL=process.env.FINDIT_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1365,height:900}});
page.setDefaultTimeout(30000);
const fail=m=>{throw new Error(m)};
let hoursRequests=0,focusedRequests=0;
await page.route('**/api/assistant?action=store-hours',async route=>{
  hoursRequests++;
  const req=route.request();
  const body=req.postDataJSON();
  if(!Array.isArray(body?.stores)||!body.stores.length)fail('Live hours request did not include nearby branches');
  const onlyUnknown=body.stores.length===1&&body.stores[0]?.name==='Unknown Retailer';
  if(onlyUnknown)focusedRequests++;
  const stores=onlyUnknown
    ? [{name:'Unknown Retailer',address:'Brooklyn, Pretoria',status:'closed',opensAt:'09:00',closesAt:'',todayHours:'09:00–17:00',sourceLabel:'Google Search grounded'}]
    : [
      {name:'Computer Mania',address:'Menlyn Park, Pretoria',status:'open',opensAt:'',closesAt:'18:00',todayHours:'09:00–18:00',sourceLabel:'Google Search grounded'},
      {name:'Retailer B',address:'Pretoria',status:'closed',opensAt:'09:00',closesAt:'',todayHours:'09:00–17:00',sourceLabel:'Google Search grounded'},
      {name:'Unknown Retailer',address:'Brooklyn, Pretoria',status:'unknown',opensAt:'',closesAt:'',todayHours:'',sourceLabel:'Google Search grounded'}
    ];
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,researchMode:'google-search-grounded',checkedAt:new Date().toISOString(),timeZone:'Africa/Johannesburg',stores,sources:[{title:'Grounded branch hours',url:'https://example.com/hours'}]})});
});
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#finditExactShell',{state:'visible'});
await page.waitForFunction(()=>window.__finditSmartChoiceUi===true&&window.__finditShoppingAssistantUi===true&&window.__finditFindActionsHours===true&&window.__finditFindActionsSettle===true);
await page.evaluate(()=>{
  localStorage.removeItem('finditSaved');
  localStorage.removeItem('findit.shoppingList.v2');
  localStorage.removeItem('findit.storeHoursGrounded.v1');
  localStorage.removeItem('findit.storeHoursGrounded.v2');
  const s=window.finditState;
  s.result={identification:{name:'Test Headphones',brand:'Test Brand',model:'X1',object:'headphones',confidence:.88,searchQuery:'Test Brand X1 headphones'}};
  s.offers=[{retailer:'Computer Mania',price:999,currency:'ZAR',availability:'in_stock',verified:true,exactProductMatch:true}];
  s.stores=[
    {name:'Computer Mania',address:'Menlyn Park, Pretoria',distanceKm:2.4,lat:-25.783,lon:28.275},
    {name:'Retailer B',address:'Pretoria',distanceKm:4.1,lat:-25.75,lon:28.22},
    {name:'Unknown Retailer',address:'Brooklyn, Pretoria',distanceKm:5.2,lat:-25.77,lon:28.24}
  ];
  window.finditSmartChoiceRefresh?.();
  window.finditShoppingAssistantRefresh?.();
  document.dispatchEvent(new CustomEvent('findit:dashboard-sync'));
  setTimeout(()=>window.finditRefreshStoreHours?.(),80);
});
await page.waitForSelector('#fxQuickAddShopping',{state:'visible'});
await page.waitForSelector('#fxQuickSaveFind',{state:'visible'});
await page.locator('#fxQuickAddShopping').click();
await page.waitForFunction(()=>{try{return JSON.parse(localStorage.getItem('findit.shoppingList.v2')||'[]').some(x=>/test headphones/i.test(x.name||''))}catch{return false}});
await page.waitForFunction(()=>/In Shopping List/i.test(document.querySelector('#fxQuickAddShopping')?.textContent||''));
await page.locator('#fxQuickSaveFind').click();
await page.waitForFunction(()=>{try{return JSON.parse(localStorage.getItem('finditSaved')||'[]').some(x=>/test headphones/i.test(x.name||''))}catch{return false}});
await page.waitForFunction(()=>/Find Saved/i.test(document.querySelector('#fxQuickSaveFind')?.textContent||''));
await page.waitForFunction(()=>{
  const t=document.querySelector('#fxStoreHoursLive')?.innerText||'';
  return /Open now/i.test(t)&&/Closes 18:00/i.test(t)&&/Closed/i.test(t)&&/Opens 09:00/i.test(t);
},null,{timeout:30000});
await page.waitForFunction(()=>{
  const rows=[...document.querySelectorAll('#fxStoreHoursLive .fx-hours-row')];
  const row=rows.find(x=>/Unknown Retailer/i.test(x.innerText||''));
  return row&&/Closed/i.test(row.innerText||'')&&/Opens 09:00/i.test(row.innerText||'');
},null,{timeout:30000});
const hoursText=await page.locator('#fxStoreHoursLive').innerText();
if(!/FindIt AI checked/i.test(hoursText))fail('Store hours did not identify the automatic AI check');
if(/Check Google Maps/i.test(hoursText))fail('FindIt still tells the user to verify store hours themselves');
if(/Google Maps/i.test(hoursText))fail('Live hours panel still sends the user away to Google Maps');
if(hoursRequests<2)fail('FindIt did not automatically retry unresolved exact branch hours');
if(focusedRequests<1)fail('FindIt did not perform the focused AI branch-hours retry');
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
