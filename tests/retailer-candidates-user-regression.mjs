import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 let query='';
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  let body={offers:[],stores:[],researched:false};
  if(path==='/api/search')body={identification:{name:query,object:query,category:'product',retailCategory:'general',searchQuery:query,userConfirmed:true},offers:[]};
  if(path.includes('product-intelligence'))body={offers:query.startsWith('Sony')?[{retailer:{name:'Incredible Connection'},product_url:'https://www.incredible.co.za/sony-wh-1000xm5-wireless-noise-cancelling-headphones-black',price:5999,currency:'ZAR',availability:'in_stock',exactProductMatch:true,sourcePageVerified:true}]:[],retailerStatus:query.startsWith('Nivea')?[{name:'Clicks',searchUrl:'https://www.clicks.co.za/',exactProductMatch:false}]:[]};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
 });
 await page.goto(process.env.FINDIT_URL||'http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:60000});
 for(const [name,host,width] of [['Nivea body lotion 250ml','clicks.co.za',1440],['Nike Air Force 1 white','sportscene.co.za',390]]){
  query=name;await page.setViewportSize({width,height:1000});
  await page.getByRole('button',{name:'⌕ Search Product',exact:true}).click();
  await page.locator('#fxRealQuery').fill(query);
  await page.getByRole('button',{name:'Find product information',exact:true}).click();
  await page.waitForFunction(()=>/Product search complete/.test(document.querySelector('#fxStatus')?.textContent||''),null,{timeout:20000});
  await page.waitForTimeout(1000);
  const links=await page.locator('#fxTopStores a').evaluateAll(els=>els.map(el=>el.href));
  assert(links.some(url=>{const q=new URL(url).searchParams.get('q');return q?.includes(host)&&q.includes(name)}),`Missing retailer search for ${name}: ${links}`);
  assert(links.every(url=>new URL(url).searchParams.get('q')?.includes(name)),'Stale product in retailer links');
  assert.match(await page.locator('#fxTopStores').innerText(),/Price and stock not verified/);
  assert.doesNotMatch(await page.locator('#fxProductDesc').innerText(),/still being checked|Checking retailer evidence/);
  const close=page.getByRole('button',{name:'Close',exact:true});if(await close.count())await close.click();
 }
 query='Sony WH-1000XM5 black';await page.setViewportSize({width:1440,height:1000});
 await page.getByRole('button',{name:'⌕ Search Product',exact:true}).click();await page.locator('#fxRealQuery').fill(query);await page.getByRole('button',{name:'Find product information',exact:true}).click();
 await page.waitForFunction(()=>/Product search complete/.test(document.querySelector('#fxStatus')?.textContent||''),null,{timeout:20000});await page.waitForTimeout(1000);
 const verified=await page.locator('#fxTopStores').innerText();assert.match(verified,/Verified product listings/);assert.match(verified,/Online in stock/);assert.match(verified,/Branch stock not verified/);assert.doesNotMatch(verified,/No exact listing verified/);
 assert.equal(await page.locator('#fxTopStores a').first().getAttribute('href'),'https://www.incredible.co.za/sony-wh-1000xm5-wireless-noise-cancelling-headphones-black');
 console.log('RETAILER_CANDIDATES_DESKTOP_MOBILE_PASS');console.log('VERIFIED_PRODUCT_RETAILER_CARD_PASS');
} finally {await browser.close();}
