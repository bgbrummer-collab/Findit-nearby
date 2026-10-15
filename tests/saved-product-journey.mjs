import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.FINDIT_URL||'https://findit-nearby.bgbrummer.workers.dev/';
const name='Logitech PRO X Gaming Headset 981-000818';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(60000);
 await page.goto(base,{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Upgrade Now',exact:true}).click();
 await page.getByRole('button',{name:'Activate Premium Beta — Free',exact:true}).click();
 await page.getByRole('button',{name:'⌕ Search Product',exact:true}).click();
 await page.getByRole('textbox',{name:'Product name, brand + model, or barcode',exact:true}).fill(name);
 await page.getByRole('button',{name:'Find product information',exact:true}).click();
 await page.locator('#fxInformationModal.open').getByRole('heading',{name:'Product Information',exact:true}).waitFor();
 assert.match(await page.locator('#fxInformationBody').innerText(),/981-000818/);
 await page.locator('#fxInformationModal.open').getByRole('button',{name:'Close',exact:true}).click();
 await page.locator('.fx-result-strip').getByRole('button',{name:'♡ Save',exact:true}).click();
 await page.locator('#fxStableBody').getByRole('button',{name:'Open product',exact:true}).waitFor();
 await page.reload({waitUntil:'networkidle'});
 await page.getByRole('button',{name:'♡ Saved',exact:true}).click();
 assert.match(await page.locator('#fxStableBody').innerText(),/Logitech PRO X Gaming Headset 981-000818/);
 await page.locator('#fxStableBody').getByRole('button',{name:'Open product',exact:true}).click();
 await page.locator('#fxInformationModal.open').getByRole('heading',{name:'Product Information',exact:true}).waitFor();
 assert.equal(await page.locator('#fxProductName').innerText(),name);
 assert.match(await page.locator('#fxInformationBody').innerText(),/981-000818/);
 await page.locator('#fxInformationModal.open').getByRole('button',{name:'Close',exact:true}).click();
 await page.getByRole('button',{name:'+ Add current item',exact:true}).click();
 // A settled shopping plan must not trigger its own MutationObservers forever.
 await page.waitForTimeout(1000);
 const mutations=await page.evaluate(async()=>{const root=document.querySelector('#fxShoppingListBody');let count=0;const observer=new MutationObserver(records=>{count+=records.length});observer.observe(root,{childList:true,subtree:true});await new Promise(resolve=>setTimeout(resolve,800));observer.disconnect();return count;});
 assert.ok(mutations<25,'Shopping plan continuously rewrites its own DOM: '+mutations);
 console.log('SHOPPING_PLAN_SETTLES_PASS',mutations);
 await page.getByRole('button',{name:'Watch item',exact:true}).click();
 await page.getByRole('button',{name:'♧ Alerts',exact:true}).click();
 assert.match(await page.locator('#fxStableBody').innerText(),/Logitech PRO X Gaming Headset 981-000818/);
 console.log('WATCHLIST_ALERTS_CONNECTED_PASS');
 console.log('SAVED_PRODUCT_JOURNEY_PASS',JSON.stringify({name,persistedAcrossReload:true,reopenedForFreshResearch:true}));
}finally{await browser.close();}
