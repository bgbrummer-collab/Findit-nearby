import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL=process.env.FINDIT_URL||'https://findit-nearby.vercel.app/';
const OUT=process.env.AUDIT_OUT||'audit-output';
fs.mkdirSync(OUT,{recursive:true});
const checks=[],failures=[],warnings=[];
function note(name,status='PASS',detail=''){const row={name,status,detail:String(detail||'').slice(0,700)};checks.push(row);console.log(`[${status}] ${name}${detail?` — ${row.detail}`:''}`);if(status==='FAIL')failures.push(row);if(status==='WARN')warnings.push(row)}
async function safe(name,fn,{warn=false}={}){try{const d=await fn();note(name,'PASS',d||'');return true}catch(e){note(name,warn?'WARN':'FAIL',e?.message||String(e));return false}}
async function visible(page,sel){try{return await page.locator(sel).first().isVisible({timeout:1800})}catch{return false}}
async function modalText(page){return (await page.locator('#fxStableBody,#fxCompleteBody').filter({visible:true}).first().innerText().catch(()=>''))||''}
async function closeModal(page){for(const s of ['#fxStableModal .fx-stable-close','#fxCompleteModal .fx-complete-x','#premiumModal [data-close-modal]','#closePremium']){const e=page.locator(s).first();if(await e.count()&&await e.isVisible().catch(()=>false)){await e.click({force:true}).catch(()=>{});await page.waitForTimeout(80)}}}
async function clickVisible(page,sel){const all=page.locator(sel);for(let i=0;i<await all.count();i++){const e=all.nth(i);if(await e.isVisible().catch(()=>false)){await e.click({timeout:5000});await page.waitForTimeout(150);return e}}throw Error(`no visible control: ${sel}`)}

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},geolocation:{latitude:-25.7479,longitude:28.2293},permissions:['geolocation','clipboard-read','clipboard-write']});
const imgPath=path.join(process.cwd(),'tests','qa-product.png');
const gen=await context.newPage();
await gen.setContent(`<canvas id="c" width="1000" height="700"></canvas><script>const c=document.querySelector('#c'),x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,1000,700);x.fillStyle='#111';x.font='bold 64px Arial';x.fillText('NIKE AIR FORCE 1',190,160);x.strokeStyle='#222';x.lineWidth=9;x.beginPath();x.moveTo(180,480);x.quadraticCurveTo(300,310,500,350);x.lineTo(760,420);x.quadraticCurveTo(830,450,850,520);x.lineTo(220,540);x.closePath();x.stroke();x.strokeStyle='#1d5cff';x.lineWidth=25;x.beginPath();x.moveTo(350,420);x.quadraticCurveTo(500,500,700,440);x.stroke();</script>`);
await gen.locator('#c').screenshot({path:imgPath});await gen.close();

const page=await context.newPage(),pageErrors=[],consoleErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
page.on('dialog',async d=>{try{if(d.type()==='prompt')await d.accept('Nike Air Force 1 Low');else await d.accept()}catch{}});

await page.route('**/api/search',async r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({identification:{object:'sneaker',name:'Nike Air Force 1 Low',brand:'Nike',model:'Air Force 1 Low',category:'footwear',retailCategory:'footwear',searchQuery:'Nike Air Force 1 Low',confidence:.98,visibleText:['NIKE','AIR','AIR FORCE 1'],features:['white leather low-top','blue swoosh'],summary:'A white low-top Nike Air Force 1 sneaker with blue accents.'}})}));
await page.route('**/api/official-brand-intelligence?action=exact',async r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({exactFound:true,confidence:.97,productName:'Nike Air Force 1 Low',brand:'Nike',model:'Air Force 1 Low',searchQuery:'Nike Air Force 1 Low',evidence:['photo silhouette','visible Nike/AIR text']})}));
const offer={retailer:{name:'Nike'},product_name:'Nike Air Force 1 Low',price:2199.95,currency:'ZAR',availability:'in_stock',product_url:'https://www.nike.com/za/t/air-force-1-low-shoes-test',verified:true,sourcePageVerified:true,matchScore:.99,branchStockVerified:false,research:{whatItDoes:'A low-top lifestyle sneaker designed for everyday wear.',pros:['Durable leather upper','Cushioned Air sole'],cons:['Leather can require break-in'],source:'https://www.nike.com/za/t/air-force-1-low-shoes-test'}};
await page.route('**/api/product-intelligence-v2',async r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,offers:[offer],webRetailers:[{name:'Nike',searchUrl:'https://www.nike.com/za/w?q=air%20force%201'}]})}));
await page.route('**/api/product-intelligence',async r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,matched:true,offers:[offer]})}));
await page.route('**/api/product-insights',async r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({researched:true,whatItDoes:'A low-top lifestyle sneaker designed for everyday wear.',pros:['Durable leather upper','Cushioned Air sole'],cons:['Leather can require break-in'],sources:[{title:'Nike',url:'https://www.nike.com/za/t/air-force-1-low-shoes-test'}]})}));
await page.route('**/api/nearby',async r=>{let body={};try{body=JSON.parse(r.request().postData()||'{}')}catch{};const likely=body.mode==='likely';return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({stores:likely?[{name:'Nike',distanceKm:4.7,address:'Menlyn, Pretoria',lat:-25.782,lng:28.275,website:'https://www.nike.com/za/',exactProductMatch:false,stockVerified:false,branchStockVerified:false}]:[]})})});

await safe('Homepage loads',async()=>{const r=await page.goto(BASE_URL,{waitUntil:'domcontentloaded',timeout:35000});if(!r||r.status()!==200)throw Error(`HTTP ${r?.status()}`);await page.waitForTimeout(1800);return `HTTP ${r.status()}`});
await safe('Visible dashboard shell loads',async()=>{if(!await visible(page,'#finditExactShell'))throw Error('dashboard missing');return 'dashboard visible'});
await safe('Desktop has no horizontal overflow',async()=>{const x=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));if(x.sw>x.cw+4)throw Error(JSON.stringify(x));return JSON.stringify(x)});
await safe('Legacy engine is hidden from users',async()=>{const e=page.locator('#home.fx-engine');if(!await e.count())return 'legacy engine not present';if(await e.isVisible())throw Error('legacy engine is visible');return 'hidden'});
await safe('Dashboard navigation is complete',async()=>{const n=await page.locator('#finditExactShell .fx-nav [data-fxnav]').count();if(n<9)throw Error(`${n} nav controls`);return `${n} controls`});
await page.screenshot({path:path.join(OUT,'01-dashboard-desktop.png')});

for(const [nav,expected] of [['compare','Compare Prices'],['deals','Verified Deals'],['saved','Saved Items'],['history','History'],['alerts','Price & Stock Alerts'],['feedback','Feedback']]){
 await closeModal(page);
 await safe(`Visible ${nav} tool opens`,async()=>{await clickVisible(page,`#finditExactShell [data-fxnav="${nav}"]`);if(!await visible(page,'#fxStableModal:not(.hidden)'))throw Error('visible modal did not open');const t=await modalText(page);if(!t.includes(expected))throw Error(t.slice(0,140));return expected});
}
await closeModal(page);
await safe('Settings / nearby filters work',async()=>{await clickVisible(page,'#finditExactShell [data-fx="settings"]');const modal=page.locator('#fxStableModal:not(.hidden)');if(!await modal.isVisible())throw Error('filters modal missing');const sel=page.locator('#fxStableRadius');for(const v of ['3','5','10']){await sel.selectOption(v);if(await sel.inputValue()!==v)throw Error(`radius ${v}`)}return '3/5/10 km'});
await closeModal(page);

await safe('Dashboard image upload works',async()=>{await page.locator('#photo').setInputFiles(imgPath);await page.waitForTimeout(250);if(await page.locator('#fxSearchNow').isDisabled())throw Error('Identify remains disabled');if(!await visible(page,'#fxProductImage img'))throw Error('dashboard preview missing');return 'image ready'});
await safe('Dashboard location works',async()=>{await clickVisible(page,'#finditExactShell [data-location-direct]');await page.waitForFunction(()=>/Location ready/i.test(document.querySelector('#fxStatus')?.textContent||''),null,{timeout:5000});return (await page.locator('#fxStatus').innerText()).trim()});
await safe('Identify & Find completes on visible dashboard',async()=>{await clickVisible(page,'#fxSearchNow');await page.waitForFunction(()=>/Nike Air Force 1/i.test(document.querySelector('#fxProductName')?.textContent||''),null,{timeout:12000});const n=(await page.locator('#fxProductName').innerText()).trim();if(!/Nike Air Force 1/i.test(n))throw Error(n);return n});
await safe('Exact identity reaches dashboard',async()=>{const b=(await page.locator('#fxExactBadge').innerText()).trim();if(!/exact identity verified/i.test(b))throw Error(b);return b});
await safe('Verified price reaches dashboard',async()=>{const p=(await page.locator('#fxBestPrice').innerText()).trim();if(!/2.?199/i.test(p.replace(/\s/g,'')))throw Error(p);return p});
await safe('Nearby store stays truthful',async()=>{const t=(await page.locator('#fxStoreList').innerText()).trim();if(!/Nike/i.test(t))throw Error('nearby retailer missing');if(/Stock verified|Branch stock verified/i.test(t))throw Error('unverified branch falsely marked verified');if(!/Stock not verified/i.test(t))throw Error(t);return 'branch remains unverified'});
await safe('Top Stores does not invent branch stock',async()=>{const t=(await page.locator('#fxTopStores').innerText()).trim();if(/Stock verified/i.test(t))throw Error(t);return t.slice(0,120)});
await page.screenshot({path:path.join(OUT,'02-dashboard-results.png')});

await closeModal(page);
await safe('Product Information is clean and researched',async()=>{await clickVisible(page,'#finditExactShell [data-fx="product"]');await page.waitForTimeout(350);const t=await modalText(page);if(!/Product Information|What it does/i.test(t))throw Error(t.slice(0,180));if(/Verified buyer|Trustpilot|Got the product fast/i.test(t))throw Error('review junk leaked into research');return t.slice(0,180)});
await closeModal(page);
await safe('Compare Prices uses verified offer',async()=>{await clickVisible(page,'#finditExactShell [data-fx="compare"]');const t=await modalText(page);if(!/Nike/i.test(t)||!/2.?199/.test(t.replace(/\s/g,'')))throw Error(t.slice(0,220));return 'Nike verified price shown'});
await closeModal(page);
await safe('Nearby action uses visible section',async()=>{await clickVisible(page,'#finditExactShell [data-fx="nearby"]');if(!await visible(page,'#fxNearbySection'))throw Error('nearby section missing');return 'nearby section visible'});
await safe('Premium entry opens from visible dashboard',async()=>{await clickVisible(page,'#finditExactShell [data-fx="premium"]');if(!await visible(page,'#premiumModal:not(.hidden)')&&!await visible(page,'#fxStableModal:not(.hidden)'))throw Error('Premium UI did not open');return 'Premium UI visible'});
await closeModal(page);

await safe('No uncaught JavaScript errors',async()=>{if(pageErrors.length)throw Error(pageErrors.slice(0,3).join(' | '));return '0 page errors'});
await safe('No critical console errors',async()=>{const bad=consoleErrors.filter(x=>!/favicon|Failed to load resource.*404/i.test(x));if(bad.length)throw Error(bad.slice(0,3).join(' | '));return `${consoleErrors.length} console errors (${bad.length} critical)`});

const mobile=await context.newPage();
await mobile.setViewportSize({width:390,height:844});
await safe('Mobile dashboard loads',async()=>{await mobile.goto(BASE_URL,{waitUntil:'domcontentloaded',timeout:35000});await mobile.waitForTimeout(1200);if(!await visible(mobile,'#finditExactShell'))throw Error('dashboard missing');return 'visible'});
await safe('Mobile has no horizontal overflow',async()=>{const x=await mobile.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));if(x.sw>x.cw+4)throw Error(JSON.stringify(x));return JSON.stringify(x)});
await safe('Mobile upload and Identify controls are visible',async()=>{if(!await visible(mobile,'#finditExactShell [data-upload-picker="photo"]'))throw Error('upload missing');if(!await visible(mobile,'#fxSearchNow'))throw Error('identify missing');return 'controls visible'});
await mobile.screenshot({path:path.join(OUT,'03-dashboard-mobile.png'),fullPage:true});

const report={generatedAt:new Date().toISOString(),url:BASE_URL,summary:{checks:checks.length,passed:checks.filter(x=>x.status==='PASS').length,failed:failures.length,warnings:warnings.length},checks,failures,warnings};
fs.writeFileSync(path.join(OUT,'audit-report.json'),JSON.stringify(report,null,2));
fs.writeFileSync(path.join(OUT,'audit-summary.txt'),`FindIt dashboard audit\nChecks: ${report.summary.checks}\nPassed: ${report.summary.passed}\nFailed: ${report.summary.failed}\nWarnings: ${report.summary.warnings}\n`);
await context.close();await browser.close();console.log(`AUDIT_SUMMARY=${JSON.stringify(report.summary)}`);if(failures.length)process.exit(1);
