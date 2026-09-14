import { chromium } from 'playwright';
const base=process.env.FINDIT_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});const page=await browser.newPage();
try{
 await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.__finditUserPovRelevanceGuard===true,{timeout:20000});
 await page.evaluate(()=>{const s=window.finditState||window.state;s.result={identification:{object:'self-balancing scooter',name:'self-balancing scooter',category:'Personal Electric Vehicles',retailCategory:'personal electric mobility',searchQuery:'self-balancing scooter',confidence:.88,brandEvidence:false,modelEvidence:false,exactProductMatch:false,matchLevel:'category-level'}};s.coords={lat:-25.75,lon:28.2};s.offers=[];s.stores=[{name:'Mercedes Benz Menlyn',distanceKm:3.2,address:'Pretoria'},{name:'Electronics Store',distanceKm:4.1,address:'Pretoria'}];document.dispatchEvent(new CustomEvent('findit:nearby-updated'));});
 await page.waitForTimeout(300);
 const result=await page.evaluate(()=>({stores:(window.finditState||window.state).stores.map(x=>x.name),confidence:document.querySelector('.fx-match-confidence')?.textContent||'',notice:document.querySelector('#fxIdentityTruth')?.textContent||''}));
 if(result.stores.some(x=>/mercedes/i.test(x)))throw Error('Hoverboard Find still recommends a motor-vehicle dealer.');
 if(!result.stores.some(x=>/electronics/i.test(x)))throw Error('Relevant non-motor retailer was incorrectly removed.');
 if(result.confidence&&!/Object match/i.test(result.confidence))throw Error(`Confidence still overstates exactness: ${result.confidence}`);
 if(result.notice&&!/Store, price and stock recommendations remain separate/i.test(result.notice))throw Error('Missing identity-vs-commerce truth notice.');
 console.log('Current Find relevance regression passed.');
}finally{await browser.close();}