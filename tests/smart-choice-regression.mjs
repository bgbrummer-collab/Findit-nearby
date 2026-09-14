import { chromium } from 'playwright';

const URL=process.env.FINDIT_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1365,height:900}});
page.setDefaultTimeout(30000);
const fail=m=>{throw new Error(m)};
await page.route('**/api/assistant?action=store-hours',async route=>{
  const body=route.request().postDataJSON();
  const rows=(body?.stores||[]).map(s=>({
    name:s.name,
    address:s.address||'',
    status:s.name==='Retailer A'?'closed':'open',
    opensAt:s.name==='Retailer A'?'09:00':'',
    closesAt:s.name==='Retailer A'?'':'18:00',
    todayHours:'09:00–18:00',
    sourceLabel:'Google Search grounded'
  }));
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,researchMode:'google-search-grounded',checkedAt:new Date().toISOString(),stores:rows,sources:[{title:'Test grounded hours',url:'https://example.com'}]})});
});
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#finditExactShell',{state:'visible'});
await page.waitForFunction(()=>window.__finditSmartChoiceUi===true&&typeof window.finditSmartChoiceRefresh==='function'&&window.__finditDashboardV8Loader===true);
const text=await page.evaluate(()=>{
  localStorage.removeItem('findit.storeHoursGrounded.v1');
  const s=window.finditState;
  s.result={identification:{name:'Test Headphones',confidence:.92,exactProductMatch:true,modelEvidence:true,matchLevel:'exact'}};
  s.offers=[
    {retailer:'Retailer A',price:900,currency:'ZAR',availability:'in_stock',verified:true,exactProductMatch:true},
    {retailer:'Retailer B',price:800,currency:'ZAR',availability:'in_stock',verified:true,exactProductMatch:true}
  ];
  s.stores=[
    {name:'Retailer A',distanceKm:1,openNow:false,address:'One Street'},
    {name:'Retailer B',distanceKm:4,openNow:true,address:'Two Street'},
    {name:'Retailer C',distanceKm:.5,openNow:true,address:'Three Street'}
  ];
  const list=document.querySelector('#nearbyStores')||document.querySelector('#finditExactShell');
  list.innerHTML='<article data-store="0">Retailer A</article><article data-store="1">Retailer B</article><article data-store="2">Retailer C</article>';
  window.finditSmartChoiceRefresh();
  return document.querySelector('#fxSmartChoice')?.innerText||'';
});
if(!/BEST OVERALL[\s\S]*Retailer B/i.test(text))fail('Smart Choice did not rank the best overall retailer');
if(!/CHEAPEST[\s\S]*Retailer B/i.test(text))fail('Smart Choice did not identify the cheapest verified retailer');
if(!/CLOSEST[\s\S]*Retailer C/i.test(text))fail('Smart Choice did not identify the closest retailer');
if(!/High confidence · 92%/i.test(text))fail('Smart Choice did not show exact-match confidence');
await page.locator('#fxOpenNowToggle').click();
const aHidden=await page.locator('[data-store="0"]').evaluate(el=>el.classList.contains('fx-open-filter-hidden'));
const bHidden=await page.locator('[data-store="1"]').evaluate(el=>el.classList.contains('fx-open-filter-hidden'));
const cHidden=await page.locator('[data-store="2"]').evaluate(el=>el.classList.contains('fx-open-filter-hidden'));
if(!aHidden||bHidden||cHidden)fail('Open Now did not filter closed stores correctly');
const status=await page.locator('#fxOpenNowStatus').innerText();
if(!/2 of 3 stores with published hours are open now/i.test(status))fail('Open Now status is not truthful');
await page.setViewportSize({width:390,height:844});
await page.waitForTimeout(100);
const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
if(overflow>4)fail(`Smart Choice caused mobile horizontal overflow: ${overflow}px`);
console.log('SMART_CHOICE_OPEN_NOW_PASS');
await browser.close();