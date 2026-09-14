import { chromium } from 'playwright';

const URL=process.env.FINDIT_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1365,height:900}});
page.setDefaultTimeout(40000);
const fail=m=>{throw new Error(m)};
let nearbyCalls=0;
await page.route('**/api/nearby',async route=>{
  const body=route.request().postDataJSON();
  if(body?.mode!=='likely')return route.continue();
  nearbyCalls++;
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,reliable:true,stores:[
    {name:'Sportscene Menlyn',address:'Menlyn Park, Pretoria',distanceKm:2.1,lat:-25.783,lon:28.275,openingHours:'Mo-Su 09:00-20:00',openNow:true,exactProductMatch:false,stockVerified:false,branchStockVerified:false},
    {name:'Totalsports Brooklyn',address:'Brooklyn Mall, Pretoria',distanceKm:5.3,lat:-25.771,lon:28.236,openingHours:'Mo-Su 09:00-18:00',openNow:false,exactProductMatch:false,stockVerified:false,branchStockVerified:false}
  ]})});
});
await page.route('**/api/assistant?action=store-hours',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,checkedAt:new Date().toISOString(),stores:[
  {name:'Sportscene Menlyn',address:'Menlyn Park, Pretoria',status:'open',closesAt:'20:00',todayHours:'09:00–20:00'},
  {name:'Totalsports Brooklyn',address:'Brooklyn Mall, Pretoria',status:'closed',opensAt:'09:00',todayHours:'09:00–18:00'}
]})}));
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#finditExactShell',{state:'visible'});
await page.waitForFunction(()=>window.__finditUserPovHardening===true&&window.__finditUserFirstPolish===true&&window.__finditSmartChoiceUi===true);
await page.evaluate(()=>{
  localStorage.setItem('findit_premium_beta','1');
  localStorage.setItem('findit.shoppingList.v2',JSON.stringify([{key:'mic',name:'PROAR USB Condenser Microphone with Stand and Adapters',offers:[{retailer:'Amazon',price:54.03,currency:'ZAR',availability:'in_stock',url:'https://www.amazon.com/example',lat:0,lon:0}],stores:[]}]))
  const s=window.finditState;
  s.coords={lat:-25.7479,lon:28.2293};
  s.radius=10;
  s.result={identification:{name:'Nike Air Force 1 Low',brand:'Nike',model:'Air Force 1 Low',object:'sneakers',category:'footwear',retailCategory:'footwear',searchQuery:'Nike Air Force 1 Low',confidence:.88}};
  s.offers=[{retailer:'Co',product_name:'Sneakers - Nike Air Force 1 Low &quot;Yohood&quot; for sale in South Africa',price:1400,currency:'ZAR',availability:'in_stock',verified:true,sourcePageVerified:true,exactProductMatch:true,url:'https://www.bobshop.co.za/item/694444494'}];
  s.stores=[];
  document.dispatchEvent(new CustomEvent('findit:results-rendered',{detail:{result:s.result}}));
});

await page.waitForFunction(()=>window.finditState?.offers?.[0]?.retailer==='Bob Shop');
await page.waitForFunction(()=>Array.isArray(window.finditState?.stores)&&window.finditState.stores.length===2,null,{timeout:35000});
if(nearbyCalls<1)fail('Nearby recovery did not run');
await page.waitForFunction(()=>/Bob Shop/i.test(document.querySelector('#fxSmartChoice')?.innerText||''));
const smart=await page.locator('#fxSmartChoice').innerText();
if(/\bCo\b/.test(smart))fail('Smart Choice still exposes broken retailer label Co');
if(!/Bob Shop/i.test(smart))fail('Smart Choice did not show repaired retailer name');
if(/Location results have not loaded|No nearby store yet/i.test(smart))fail('Smart Choice kept stale nearby loading copy after stores loaded');

await page.waitForFunction(()=>/Sportscene Menlyn/i.test(document.querySelector('#fxTopStores')?.innerText||''),null,{timeout:15000});
const top=await page.locator('#fxTopStores').innerText();
if(!/Sportscene Menlyn/.test(top)||!/Totalsports Brooklyn/.test(top))fail('Top Stores did not populate from recovered nearby retailers');
if(/Nearby stores will appear|not loaded/i.test(top))fail('Top Stores still shows an empty/loading placeholder after data loaded');

await page.waitForFunction(()=>{
  try{const x=JSON.parse(localStorage.getItem('findit.shoppingList.v2')||'[]')[0]?.offers?.[0];return x&&x.lat===null&&x.lon===null}catch{return false}
});
await page.evaluate(()=>window.finditShoppingAssistantRefresh?.());
await page.waitForFunction(()=>/Online-only plan/i.test(document.querySelector('#fxShoppingListBody')?.innerText||''),null,{timeout:15000});
const plan=await page.locator('#fxShoppingListBody').innerText();
if(!/no physical branch coordinates are verified/i.test(plan))fail('Online-only offer is still presented as a physical shopping trip');
if(/approx\.\s*0(?:\.0)?\s*km route/i.test(plan))fail('Missing coordinates are still presented as a zero-distance route');
const maps=await page.locator('#fxShoppingListBody a.fx-route-link').count();
if(maps)fail('Online-only plan still exposes a fake Maps trip');
const shortestVisible=await page.locator('#fxShoppingListBody [data-plan-mode="shortest"]').evaluate(el=>getComputedStyle(el).display!=='none').catch(()=>false);
if(shortestVisible)fail('Shortest trip remains available for an online-only plan');

await page.locator('#finditExactShell [data-fx="compare"]').first().click({noWaitAfter:true});
await page.waitForSelector('#fxCommerceSafeModal:not([hidden])',{state:'visible'});
const compare=await page.locator('#fxCommerceSafeBody').innerText();
if(/\bCo\b/.test(compare))fail('Compare Prices still exposes broken retailer label Co');
if(/&quot;|&#x27;|&amp;/.test(compare))fail('Compare Prices still leaks encoded HTML entities');
if(!/Bob Shop/.test(compare))fail('Compare Prices does not show the repaired retailer');
await page.locator('.fx-commerce-safe-close').click();

await page.evaluate(()=>{
  document.querySelector('#fxStableModal')?.remove();
  const m=document.createElement('div');m.id='fxStableModal';m.className='fx-stable-modal';m.innerHTML='<div id="fxStableBody"><h2 class="fx-stable-title">Product Information</h2><h4>Pros</h4><ul><li>Nike Air Force 1 Patent Leather White</li><li>Uses durable rubber traction underfoot for everyday wear.</li></ul></div>';document.body.appendChild(m);window.finditUserPovHarden?.();
});
await page.waitForTimeout(100);
const product=await page.locator('#fxStableBody').innerText();
if(/Patent Leather White/i.test(product))fail('A product/variant title is still shown as a Pro');
if(!/durable rubber traction/i.test(product))fail('A meaningful user benefit was incorrectly removed from Pros');

await page.waitForFunction(()=>/Open now/i.test(document.querySelector('#fxStoreHoursLive')?.innerText||''),null,{timeout:15000});
const hours=await page.locator('#fxStoreHoursLive').innerText();
if(!/Open now/.test(hours)||!/Closes 20:00/.test(hours))fail('Store hours do not show the useful open/close result');
if(/check google|verify.*yourself/i.test(hours))fail('Store hours still tells users to verify on their own');

await page.setViewportSize({width:390,height:844});
await page.waitForTimeout(150);
const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
if(overflow>4)fail(`User POV hardening causes mobile overflow: ${overflow}px`);
console.log('USER_POV_HARDENING_PASS');
await browser.close();
