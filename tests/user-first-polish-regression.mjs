import { chromium } from 'playwright';

const URL=process.env.FINDIT_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1365,height:900}});
page.setDefaultTimeout(35000);
const fail=m=>{throw new Error(m)};
let nearbyCalls=0;
await page.route('**/api/nearby',async route=>{
  const req=route.request();
  const body=req.postDataJSON();
  if(body?.mode!=='likely')return route.continue();
  nearbyCalls++;
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,reliable:true,stores:[
    {name:'Sportscene Menlyn',address:'Menlyn Park, Pretoria',distanceKm:2.1,lat:-25.783,lon:28.275,exactProductMatch:false,stockVerified:false,branchStockVerified:false},
    {name:'Totalsports Brooklyn',address:'Brooklyn Mall, Pretoria',distanceKm:5.3,lat:-25.771,lon:28.236,exactProductMatch:false,stockVerified:false,branchStockVerified:false}
  ]})});
});
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#finditExactShell',{state:'visible'});
await page.waitForFunction(()=>window.__finditUserFirstPolish===true&&window.__finditSmartChoiceUi===true);
await page.evaluate(()=>{
  localStorage.setItem('findit_premium_beta','1');
  localStorage.setItem('findit.shoppingList.v2',JSON.stringify([{key:'mic',name:'PROAR USB Condenser Microphone with Stand and Adapters',offers:[{retailer:'Amazon',price:54.03,currency:'ZAR',availability:'in_stock',url:'https://www.amazon.com/example',lat:null,lon:null}],stores:[]}]))
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
if(nearbyCalls<1)fail('FindIt did not automatically recover missing nearby retailers');
const nearbyText=await page.locator('#nearbyStores').innerText().catch(()=> '');
if(!/Sportscene Menlyn/i.test(nearbyText))fail('Recovered nearby retailers were not shown to the user');
if(/nearby stores have not loaded|location results have not loaded/i.test(await page.locator('body').innerText()))fail('Stale nearby loading copy remained after recovery');

await page.locator('#finditExactShell [data-fx="compare"]').first().click({noWaitAfter:true});
await page.waitForSelector('#fxCommerceSafeModal:not([hidden])',{state:'visible'});
const compare=await page.locator('#fxCommerceSafeBody').innerText();
if(/\bCo\b/.test(compare))fail('Broken retailer label Co is still visible');
if(!/Bob Shop/i.test(compare))fail('Retailer was not repaired from the product URL');
if(/&quot;|&amp;|&#39;/.test(compare))fail('HTML entities are leaking into user-visible compare text');
if(!/Sportscene Menlyn/i.test(compare))fail('Compare Prices did not include recovered nearby retailers');
await page.locator('.fx-commerce-safe-close').click();

await page.evaluate(()=>{
  window.finditShoppingAssistantRefresh?.();
  const m=document.createElement('div');m.id='fxStableModal';m.className='fx-stable-modal';m.innerHTML='<div id="fxStableBody"><h2 class="fx-stable-title">Product Information</h2><h4>Pros</h4><ul><li>Offers low top, mid top, and high top style variations depending on user preference</li><li>Nike Air Force 1 &amp;#x27;07 Patent Leather</li></ul><h4>Cons / considerations</h4><small>No trustworthy product-specific downsides were found in the sources checked.</small></div>';document.body.appendChild(m);window.finditUserFirstPolish?.();
});
await page.waitForTimeout(100);
const productInfo=await page.locator('#fxStableBody').innerText();
if(/offers low top|patent leather/i.test(productInfo))fail('Low-value product-title/style text is still presented as a Pro');
if(!/still verifying meaningful strengths/i.test(productInfo))fail('Empty cleaned Pros did not get a truthful user-facing state');
if(/No trustworthy product-specific downsides/i.test(productInfo))fail('Old awkward cons fallback copy remained');

await page.waitForFunction(()=>/Online-only plan/i.test(document.querySelector('#fxShoppingListBody')?.innerText||''),null,{timeout:15000});
const planner=await page.locator('#fxShoppingListBody').innerText();
if(!/no physical branch coordinates are verified/i.test(planner))fail('Online-only shopping plan is still presented like a physical store trip');
const shortestVisible=await page.locator('#fxShoppingListBody [data-plan-mode="shortest"]').evaluate(el=>getComputedStyle(el).display!=='none').catch(()=>false);
if(shortestVisible)fail('Shortest trip is still offered when there are no verified physical store coordinates');

await page.setViewportSize({width:390,height:844});
await page.waitForTimeout(100);
const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
if(overflow>4)fail(`User-first fixes caused mobile overflow: ${overflow}px`);
console.log('USER_FIRST_POLISH_PASS');
await browser.close();
