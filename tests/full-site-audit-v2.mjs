import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const URL=process.env.FINDIT_URL||'https://findit-nearby.vercel.app/';
const OUT=process.env.AUDIT_OUT||'audit-output-v2';
fs.mkdirSync(OUT,{recursive:true});
const checks=[];const failures=[];const warnings=[];
function row(name,status,detail=''){const r={name,status,detail:String(detail||'').slice(0,1200)};checks.push(r);console.log(`[${status}] ${name}${r.detail?` — ${r.detail}`:''}`);if(status==='FAIL')failures.push(r);if(status==='WARN')warnings.push(r)}
async function test(name,fn,{warn=false}={}){try{const d=await fn();row(name,'PASS',d||'');return true}catch(e){row(name,warn?'WARN':'FAIL',e?.message||String(e));return false}}
async function shown(page,sel){try{return await page.locator(sel).first().isVisible({timeout:1000})}catch{return false}}
async function tap(page,sel,name){return test(name,async()=>{const x=page.locator(sel).first();if(!await x.count())throw Error('missing control');await x.scrollIntoViewIfNeeded().catch(()=>{});await x.click({timeout:5000});await page.waitForTimeout(100)})}
async function closeLayers(page){for(const s of ['#finditGuideModal .findit-guide-close','#v10CloseModal','#premiumSavedModal [data-close-tool="saved"]','#premiumCompareModal [data-close-tool="compare"]','#premiumFiltersModal [data-close-tool="filters"]','#settingsModal [data-close-modal]','#challengeModal [data-close-modal]','#closeAssistant','#closePremium','#closePremiumWorkspace','#closeMenu']){try{const e=page.locator(s).first();if(await e.count()&&await e.isVisible())await e.click({timeout:1000})}catch{}}}

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1366,height:768},geolocation:{latitude:-25.7479,longitude:28.2293},permissions:['geolocation','clipboard-read','clipboard-write']});
await context.addInitScript(()=>{
  window.__finditOpened=[];
  window.open=(u)=>{window.__finditOpened.push(String(u||''));return null};
  try{Object.defineProperty(navigator,'share',{configurable:true,value:async d=>{window.__finditShared=d;}})}catch{}
});
await context.route('**/api/feedback',async route=>{if(route.request().method()==='POST')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,delivered:true,qa:true})});return route.continue()});
const page=await context.newPage();page.setDefaultTimeout(6000);page.setDefaultNavigationTimeout(18000);
const pageErrors=[];const consoleErrors=[];const failedRequests=[];
page.on('pageerror',e=>pageErrors.push(String(e)));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});page.on('requestfailed',r=>failedRequests.push(`${r.method()} ${r.url()} ${r.failure()?.errorText||''}`));
page.on('dialog',async d=>{try{if(d.type()==='prompt')await d.accept("Nike Air Force 1 Low White Blue");else await d.accept()}catch{}});

// Create a real PNG fixture in Chromium so the live vision endpoint receives a supported raster image.
const fixture=await context.newPage();
await fixture.setViewportSize({width:900,height:600});
await fixture.setContent(`<!doctype html><style>body{margin:0;background:#f5f5f5;font-family:Arial;display:grid;place-items:center;height:600px}.card{width:820px;height:520px;background:white;border-radius:28px;box-shadow:0 20px 60px #0002;position:relative;overflow:hidden}.shoe{position:absolute;left:120px;top:190px;width:570px;height:150px;background:#f7f7f7;border:8px solid #171717;border-radius:75% 28% 28% 42% / 55% 48% 52% 45%;transform:skewX(-12deg)}.sole{position:absolute;left:105px;top:320px;width:610px;height:38px;border:7px solid #171717;border-radius:30px;background:#fff}.tick{position:absolute;left:370px;top:245px;width:170px;height:42px;background:#1557d4;transform:skewX(-32deg) rotate(-9deg);border-radius:100% 8% 100% 15%}.title{position:absolute;top:55px;left:0;right:0;text-align:center;font-size:34px;font-weight:800}.sub{position:absolute;top:105px;left:0;right:0;text-align:center;font-size:24px;color:#333}</style><div class="card"><div class="title">NIKE AIR FORCE 1 '07 LOW</div><div class="sub">White / Royal Blue</div><div class="shoe"></div><div class="tick"></div><div class="sole"></div></div>`);
const imgPath=path.join(process.cwd(),'tests','qa-product.png');await fixture.screenshot({path:imgPath});await fixture.close();

await test('Production homepage HTTP 200',async()=>{const r=await page.goto(URL,{waitUntil:'domcontentloaded'});if(!r||r.status()!==200)throw Error(`HTTP ${r?.status()}`);await page.waitForTimeout(1600);return `HTTP ${r.status()}`});
await page.screenshot({path:path.join(OUT,'01-home-1366.png')});
await test('Desktop has no horizontal page overflow',async()=>{const v=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));if(v.sw>v.cw+4)throw Error(JSON.stringify(v));return JSON.stringify(v)});

// Main navigation + drawer.
for(const [s,n] of [['.desktop-nav a[href="#finder"]','Find'],['.desktop-nav a[href="#how"]','How it works'],['.desktop-nav a[href="#examples"]','Examples'],['.desktop-nav a[href="#feedback"]','Feedback']])await test(`Desktop nav ${n}`,async()=>{if(!await page.locator(s).count())throw Error('missing')});
await tap(page,'#menuBtn','Open main menu');
await test('Desktop main drawer is readable vertical list',async()=>{if(!await shown(page,'#drawer.open'))throw Error('drawer hidden');const b=await page.locator('#drawer .drawer-nav:first-of-type > a,#drawer .drawer-nav:first-of-type > button').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {y:r.y,w:r.width,h:r.height,t:e.textContent.trim()}}));for(let i=1;i<b.length;i++)if(b[i].y<=b[i-1].y)throw Error(`overlap ${b[i-1].t}/${b[i].t}`);if(b.some(x=>x.w<190||x.h<36))throw Error('undersized drawer item');return `${b.length} controls`});
await tap(page,'#closeMenu','Close main menu');

// Examples + challenges + settings.
await test('Example cards render and are clickable',async()=>{const n=await page.locator('#exampleGrid [data-example]').count();if(n<4)throw Error(`${n}`);await page.locator('#exampleGrid [data-example]').first().click();return `${n} example cards`});
await tap(page,'#shuffleExamples','Shuffle examples');
for(const s of ['#challengeBtn','#challengeBtn2']){await tap(page,s,`Open challenge from ${s}`);await test(`Challenge visible from ${s}`,async()=>{if(!await shown(page,'#challengeModal:not(.hidden)'))throw Error('hidden')});await tap(page,'#newChallenge','Generate another challenge');await tap(page,'#challengeModal [data-close-modal]','Close challenge')}
await tap(page,'#menuBtn','Open drawer for settings');await tap(page,'#openSettings','Open settings');
await test('Settings animations toggle',async()=>{const e=page.locator('#animationsToggle'),a=await e.isChecked();await e.click();if(a===await e.isChecked())throw Error('unchanged')});
await test('Settings free radii 3/5/10',async()=>{for(const v of ['3','5','10']){await page.locator('#settingsRadius').selectOption(v);if(await page.locator('#settingsRadius').inputValue()!==v)throw Error(v)}return '3, 5, 10 km'});
await tap(page,'#settingsModal [data-close-modal]','Close settings');

// Finder inputs and live search.
await test('Gallery input accepts PNG and enables Identify',async()=>{await page.locator('#photo').setInputFiles(imgPath);await page.waitForTimeout(250);if(!await page.locator('#search').isEnabled())throw Error('Identify disabled');if(!await shown(page,'#preview:not(.hidden)'))throw Error('preview hidden')});
await tap(page,'#location','Use location');
await test('Location becomes ready',async()=>{await page.waitForTimeout(500);const t=await page.locator('#location').innerText();if(!/ready/i.test(t))throw Error(t);return t});
const searchOK=await test('Live Identify & Find returns a result',async()=>{await page.locator('#search').click();await page.waitForSelector('#results:not(.hidden)',{timeout:55000});await page.waitForTimeout(1800);const t=await page.locator('#resultTitle').innerText();if(!t.trim())throw Error('blank title');return t});
if(!searchOK){await page.evaluate(()=>{try{state.result={identification:{object:'sneaker',name:'Nike Air Force 1 Low White Blue',brand:'Nike',model:'Air Force 1 Low',category:'footwear',retailCategory:'footwear',searchQuery:'Nike Air Force 1 Low White Blue',confidence:.95,likelyStoreTypes:['shoe store','sportswear store']}};state.coords={lat:-25.7479,lon:28.2293};state.stores=[{name:'QA Shoe Retailer A',distanceKm:2.1,address:'Pretoria',lat:-25.74,lon:28.22,type:'shoe store'},{name:'QA Shoe Retailer B',distanceKm:4.8,address:'Pretoria',lat:-25.76,lon:28.24,type:'sportswear store'}];renderIdentification?.(state.result.identification);renderFreeActions?.(state.result.identification);document.getElementById('results')?.classList.remove('hidden');renderStores?.();saveRecent?.(state.result.identification)}catch{}})}
await page.screenshot({path:path.join(OUT,'02-results.png')});
await test('Identification analysis cards render',async()=>{const n=await page.locator('#analysis .analysis-card').count();if(n<4)throw Error(`${n}`);return `${n}`});
await tap(page,'#listViewBtn','Results list view');await tap(page,'#mapViewBtn','Results map view');
await test('Map view class changes',async()=>{if(!(await page.locator('#mapWrap').getAttribute('class'))?.includes('show'))throw Error('map not shown')});await tap(page,'#listViewBtn','Return list view');
for(const v of ['best','price','distance'])await tap(page,`[data-sort="${v}"]`,`Verified-offer sort ${v}`);
await test('Free exact-item link exists',async()=>{const h=await page.locator('#searchOnline').getAttribute('href');if(!/^https?:/.test(h||''))throw Error(String(h));return h});
await test('Free nearby-map link exists',async()=>{const h=await page.locator('#searchNearbyFree').getAttribute('href');if(!/^https?:/.test(h||''))throw Error(String(h));return h});
await tap(page,'#copyQuery','Copy product name');await tap(page,'#shareFind','Share current find');
await test('Share generated payload',async()=>{const s=await page.evaluate(()=>window.__finditShared||null);if(!s)throw Error('no share payload');return JSON.stringify(s)});
for(const [s,r] of [['#thumbUp','5'],['#thumbDown','2']]){await tap(page,s,`Quick feedback ${s}`);await test(`Quick feedback sets ${r} stars`,async()=>{if(await page.locator('#feedbackRating').inputValue()!==r)throw Error(await page.locator('#feedbackRating').inputValue())})}
await test('Product Intelligence displays truthful non-zero-or-unverified state',async()=>{if(!await shown(page,'#productIntelligencePanel:not(.hidden)'))throw Error('panel hidden');const t=(await page.locator('#productIntelligenceResults').innerText()).trim();if(!t)throw Error('blank');if(/(?:ZAR|R)\s*0(?:\.00)?\b/.test(t))throw Error('fake zero price');return t.slice(0,260)});
await test('Recent search card appears',async()=>{const n=await page.locator('#recentList .recent-card').count();if(n<1)throw Error('none');return `${n}`});
await test('Recent cards have individual delete controls',async()=>{const n=await page.locator('#recentList .findit-delete-btn').count();if(n<1)throw Error('none');return `${n}`});

// Feedback UI, including mocked send so no real submission is created.
await test('Feedback star controls',async()=>{await page.locator('.star-btn[data-rating="4"]').click();if(await page.locator('#feedbackRating').inputValue()!=='4')throw Error('rating')});
await test('Feedback topic selector',async()=>{await page.locator('#feedbackTopic').selectOption('bug');if(await page.locator('#feedbackTopic').inputValue()!=='bug')throw Error('topic')});
await test('Feedback technical checkbox',async()=>{const e=page.locator('#includeTechnical'),a=await e.isChecked();await e.click();if(a===await e.isChecked())throw Error('unchanged')});
await test('Feedback send button completes UI flow without real delivery',async()=>{await page.locator('#feedbackMessage').fill('Automated QA interaction test');await page.locator('#feedbackForm').evaluate(f=>f.requestSubmit());await page.waitForTimeout(250);const t=await page.locator('#feedbackStatus').innerText();if(!/thank|saved|sent/i.test(t))throw Error(t);return t});
await test('Copy feedback button works',async()=>{await page.locator('#feedbackMessage').fill('Automated QA copy test');await page.locator('#copyFeedback').click();await page.waitForTimeout(80);return await page.locator('#feedbackStatus').innerText()});

// Free/Premium separation.
await test('Free 25 km radius is Premium-gated',async()=>{await page.locator('#radiusSelect').selectOption('25');await page.waitForTimeout(120);if(!await shown(page,'#premiumModal:not(.hidden)'))throw Error('no upgrade modal');if(Number(await page.locator('#radiusSelect').inputValue())>10)throw Error('free radius exceeded 10')});await closeLayers(page);
await tap(page,'#saveFind','Free Save interaction');await test('Free Save opens Premium gate',async()=>{if(!await shown(page,'#premiumModal:not(.hidden)'))throw Error('not gated')});await closeLayers(page);
await tap(page,'#premiumButton','Open Premium comparison');await test('Premium comparison has Free and Premium lists',async()=>{const t=await page.locator('#premiumModal').innerText();if(!/FindIt Free/.test(t)||!/FindIt Premium/.test(t))throw Error('comparison incomplete')});
await tap(page,'#activatePremiumTester','Activate Premium Beta');await test('Premium Beta active without payment/email',async()=>{if(await page.evaluate(()=>localStorage.getItem('findit_premium_beta'))!=='1')throw Error('key not active');if(!await shown(page,'#v10CommandCentre:not(.hidden)'))throw Error('centre hidden')});
await page.screenshot({path:path.join(OUT,'03-premium-1366.png')});
await test('Premium command centre no horizontal overflow',async()=>{const v=await page.locator('#v10CommandCentre').evaluate(e=>({sw:e.scrollWidth,cw:e.clientWidth}));if(v.sw>v.cw+3)throw Error(JSON.stringify(v));return JSON.stringify(v)});
await test('Premium heading fits 1366 desktop',async()=>{const b=await page.locator('#v10CommandCentre .v10-top h2').boundingBox();if(!b||b.width<600||b.x<0||b.x+b.width>1366)throw Error(JSON.stringify(b));return JSON.stringify(b)});
await test('Every V10 tile has visible How guidance',async()=>{const bs=page.locator('#v10CommandCentre [data-v10]'),n=await bs.count(),miss=[];for(let i=0;i<n;i++){const b=bs.nth(i),key=await b.getAttribute('data-v10');if(!await b.locator('.v10-how').count())miss.push(key)}if(miss.length)throw Error(miss.join(','));return `${n} guided tiles`});
await tap(page,'#finditOpenGuide','Open full Premium guide');await test('Full guide covers all Premium tools',async()=>{const n=await page.locator('#finditGuideModal .findit-guide-grid article').count();if(n<13)throw Error(`${n}`);return `${n}`});await closeLayers(page);

// V10 tool-by-tool.
await tap(page,'[data-v10="scan"]','Vision+');await test('Vision+ goes to finder',async()=>{const y=await page.locator('#finder').evaluate(e=>Math.abs(e.getBoundingClientRect().top));if(y>300)throw Error(String(y))});
await tap(page,'[data-v10="manual"]','Manual Search');await test('Manual Search modal and action',async()=>{if(!await page.locator('#v10ManualQuery').count())throw Error('input missing');await page.locator('#v10ManualQuery').fill('Nike Air Force 1 Low');await page.locator('#v10ManualGo').click();const a=await page.evaluate(()=>window.__finditOpened);if(!a.length)throw Error('no search opened');return a.at(-1)});await closeLayers(page);
await tap(page,'[data-v10="exact"]','Exact Match');await test('Exact Match opens exact-query search',async()=>{const a=await page.evaluate(()=>window.__finditOpened);if(!a.length)throw Error('no exact search');return a.at(-1)});
await tap(page,'[data-v10="assistant"]','AI Search');await test('AI Search builds retailer query and action',async()=>{if(!await shown(page,'#v10UniversalModal:not(.hidden)'))throw Error('modal hidden');const b=page.locator('#v10AssistantGo');if(!await b.count())throw Error('Search retailers missing');await b.click();return (await page.evaluate(()=>window.__finditOpened)).at(-1)});await closeLayers(page);
await tap(page,'[data-v10="collections"]','Collections');await test('Collections create and add current Find',async()=>{await page.locator('#v10CollectionName').fill('QA Collection');await page.locator('#v10AddCollection').click();await page.waitForTimeout(80);const t=await page.locator('#v10ModalBody').innerText();if(!t.includes('QA Collection'))throw Error('create failed');const b=page.locator('[data-col-add]').last();if(!await b.count())throw Error('add missing');await b.click();return 'created + added'});await closeLayers(page);
await tap(page,'[data-v10="watchlist"]','Watchlist');await test('Watchlist add current product',async()=>{const b=page.locator('#watchAddCurrent2,#watchAddCurrent').first();if(!await b.count())throw Error('add missing');await b.click();await page.waitForTimeout(100);const a=await page.evaluate(()=>JSON.parse(localStorage.getItem('findit_v10_watchlist')||'[]'));if(!a.length)throw Error('not saved');return a[0].name});
await test('Watchlist target price persists',async()=>{const e=page.locator('[data-watch-target2],[data-watch-target]').first();if(!await e.count())throw Error('target missing');await e.fill('1500');await e.dispatchEvent('change');const a=await page.evaluate(()=>JSON.parse(localStorage.getItem('findit_v10_watchlist')||'[]'));if(Number(a[0]?.targetPrice)!==1500)throw Error(JSON.stringify(a[0]));return '1500'});
await test('Watchlist Check now completes',async()=>{const b=page.locator('[data-watch-check2],[data-watch-check]').first();if(!await b.count())throw Error('check missing');await b.click();await page.waitForTimeout(8500);const a=await page.evaluate(()=>JSON.parse(localStorage.getItem('findit_v10_watchlist')||'[]'));if(!a[0]?.lastCheckedAt)throw Error('no check timestamp');return `${a[0].lastAlert||''}; price=${a[0].lastPrice??'unverified'}; stock=${a[0].lastStock??'unverified'}`});
await test('Watchlist never shows fake R0 price',async()=>{const t=await page.locator('#v10ModalBody').innerText();if(/(?:ZAR|R)\s*0(?:\.00)?\b/.test(t))throw Error('fake zero')});await page.screenshot({path:path.join(OUT,'04-watchlist.png')});await closeLayers(page);
await tap(page,'[data-v10="favourites"]','Favourite Stores');await test('Favourite Stores save and delete controls',async()=>{const add=page.locator('[data-qa-fav-add],[data-fav-store]').first();if(!await add.count())throw Error('no retailer to save');await add.click();await page.waitForTimeout(80);if(!(await page.evaluate(()=>JSON.parse(localStorage.getItem('findit_v10_favourite_stores')||'[]'))).length)throw Error('not saved');const del=page.locator('[data-qa-fav-del]').first();if(!await del.count())throw Error('delete missing');return 'save + delete available'});await closeLayers(page);
await tap(page,'[data-v10="stats"]','My Stats');await test('My Stats shows four local counters',async()=>{const t=await page.locator('#v10ModalBody').innerText();for(const x of ['Recent finds','Saved items','Watchlist','Favourite stores'])if(!t.includes(x))throw Error(`missing ${x}`);return t.slice(0,180)});await closeLayers(page);
await tap(page,'[data-v10="history"]','History+');await test('History+ search and per-item delete',async()=>{const q=page.locator('#qaHistorySearch,#v10HistorySearch').first();if(!await q.count())throw Error('search missing');await q.fill('nike');const d=page.locator('[data-qa-history-delete],[data-history-delete]').first();if(!await d.count())throw Error('delete missing');return 'search + delete available'});await closeLayers(page);

// Saved items and Premium Home controls.
await tap(page,'#saveFind','Premium save current Find');await test('Saved Items storage has item',async()=>{const a=await page.evaluate(()=>JSON.parse(localStorage.getItem('finditSaved')||'[]'));if(!a.length)throw Error('empty');return `${a.length}`});
await tap(page,'[data-premium-action="saved"]','Premium Home Saved Items');await test('Saved Items individual delete exists',async()=>{const d=page.locator('[data-premium-saved-delete],[data-qa-saved-delete],#premiumSavedList .findit-delete-btn').first();if(!await d.count())throw Error('delete missing');return 'delete exists'});await closeLayers(page);
await tap(page,'[data-premium-action="compare"]','Premium Home Compare Stores');await test('Compare Stores modal opens',async()=>{if(!await shown(page,'#premiumCompareModal:not(.hidden)'))throw Error('hidden')});await closeLayers(page);
await tap(page,'[data-premium-action="map"]','Premium Home Nearby Map');
for(const n of [5,10,15,25])await tap(page,`[data-premium-radius="${n}"]`,`Premium radius ${n} km`);
await test('Premium 25 km radius retained',async()=>{const n=await page.evaluate(()=>Number(state?.radius||localStorage.getItem('finditRadius')));if(n!==25)throw Error(String(n));return '25 km'});
for(const s of ['closest','name','original'])await tap(page,`[data-store-sort="${s}"]`,`Store sort ${s}`);

// Premium Tools workspace all options.
await tap(page,'#premiumWorkspaceButton','Open Premium Tools workspace');await test('Premium workspace visible',async()=>{if(!await shown(page,'#premiumWorkspace:not(.hidden)'))throw Error('hidden')});
for(const a of ['find','saved','compare','map','radius','filters','history','challenge','alerts']){await test(`Premium workspace ${a}`,async()=>{if(!await shown(page,'#premiumWorkspace:not(.hidden)'))await page.locator('#premiumWorkspaceButton').click();const b=page.locator(`[data-pw="${a}"]`);if(!await b.count())throw Error('missing');if(await b.isDisabled())throw Error('disabled');await b.click();await page.waitForTimeout(100);return 'usable'});await closeLayers(page)}

// Premium drawer every control.
const drawerTests=[['#premiumDrawerNav a[href="#v10CommandCentre"],#premiumDrawerNav a[href="#premiumHome"]','Premium Home'],['#premiumDrawerNav a[href="#finder"]','Advanced Find'],['#premiumSavedMenu','Saved Items'],['#premiumCompareMenu','Compare Stores'],['#premiumDrawerNav a[href="#results"],#premiumDrawerNav a[href="#nearbyPanel"]','Nearby Map'],['#premiumRadiusMenu','Search Radius'],['#premiumFiltersMenu','Smart Filters'],['#premiumHistoryMenu','Extended History'],['#premiumChallengeMenu','Premium Challenge'],['#premiumDrawerNav button:has-text("Price & Stock"),#premiumDrawerNav button:has-text("Price Alerts")','Price & Stock Watchlist'],['#openSettingsPremium','Premium Settings']];
for(const [sel,label] of drawerTests){await test(`Premium drawer ${label}`,async()=>{if(!await shown(page,'#drawer.open'))await page.locator('#menuBtn').click();const b=page.locator(sel).first();if(!await b.count())throw Error('missing');if(await b.evaluate(e=>e.tagName==='BUTTON'&&e.disabled))throw Error('disabled');await b.click();await page.waitForTimeout(100);return 'usable'});await closeLayers(page)}
await test('Premium drawer remains vertical on desktop',async()=>{await page.locator('#menuBtn').click();const b=await page.locator('#premiumDrawerNav > a,#premiumDrawerNav > button').evaluateAll(es=>es.filter(e=>getComputedStyle(e).display!=='none').map(e=>{const r=e.getBoundingClientRect();return {y:r.y,w:r.width,h:r.height,t:e.textContent.trim()}}));for(let i=1;i<b.length;i++)if(b[i].y<=b[i-1].y)throw Error(`overlap ${b[i-1].t}/${b[i].t}`);if(b.some(x=>x.w<190||x.h<34))throw Error('undersized');return `${b.length}`});await closeLayers(page);

// Assistant interactions.
await tap(page,'#assistantFab','Open Ask FindIt');await test('Assistant panel visible',async()=>{if(!await shown(page,'#assistantPanel:not(.hidden)'))throw Error('hidden')});
for(const q of ['What did FindIt identify?','Why are there no nearby stores?','Explain the price and stock information.'])await test(`Assistant quick: ${q}`,async()=>{const before=await page.locator('#assistantMessages .assistant-msg').count();await page.locator(`[data-assistant-quick="${q}"]`).click();await page.waitForTimeout(4500);const after=await page.locator('#assistantMessages .assistant-msg').count();if(after<=before)throw Error(`${before}->${after}`);return `${after} messages`},{warn:true});
await test('Assistant custom question',async()=>{await page.locator('#assistantInput').fill('How do I use the Premium Watchlist?');const before=await page.locator('#assistantMessages .assistant-msg').count();await page.locator('#assistantForm button').click();await page.waitForTimeout(4500);const after=await page.locator('#assistantMessages .assistant-msg').count();if(after<=before)throw Error('no response');return (await page.locator('#assistantMessages .assistant-msg').last().innerText()).slice(0,180)},{warn:true});await closeLayers(page);

// Return-to-Free test and reactivation.
await tap(page,'#premiumButton','Reopen Premium plan while active');await test('Return to Free testing control exists',async()=>{if(!await page.locator('#finditReturnFree').count())throw Error('missing')});await tap(page,'#finditReturnFree','Return to Free');await test('Premium deactivates cleanly',async()=>{if(await page.evaluate(()=>localStorage.getItem('findit_premium_beta'))==='1')throw Error('still active');if(await shown(page,'#v10CommandCentre:not(.hidden)'))throw Error('Premium centre visible')});
await tap(page,'#premiumButton','Open Premium plan again');await tap(page,'#activatePremiumTester','Reactivate Premium Beta');

// Main drawer shortcuts.
await tap(page,'#menuBtn','Open main drawer for shortcuts');await tap(page,'#drawerAskFindIt','Drawer Ask FindIt');await test('Drawer Ask FindIt opens assistant',async()=>{if(!await shown(page,'#assistantPanel:not(.hidden)'))throw Error('hidden')});await closeLayers(page);
await tap(page,'#menuBtn','Open main drawer for Recent');await tap(page,'#openRecent','Drawer Recent finds');await test('Recent section reached',async()=>{const y=await page.locator('#recent').evaluate(e=>Math.abs(e.getBoundingClientRect().top));if(y>350)throw Error(String(y))});

// Mobile independent audit.
const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,geolocation:{latitude:-25.7479,longitude:28.2293},permissions:['geolocation']});await mobile.addInitScript(()=>{window.open=()=>null});const mp=await mobile.newPage();mp.setDefaultTimeout(6000);const mobileErrors=[];mp.on('pageerror',e=>mobileErrors.push(String(e)));
await test('Mobile homepage HTTP 200',async()=>{const r=await mp.goto(URL,{waitUntil:'domcontentloaded'});if(!r||r.status()!==200)throw Error(`HTTP ${r?.status()}`);await mp.waitForTimeout(1200);return `HTTP ${r.status()}`});
await test('Mobile no horizontal page overflow',async()=>{const v=await mp.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));if(v.sw>v.cw+4)throw Error(JSON.stringify(v));return JSON.stringify(v)});
await tap(mp,'#menuBtn','Mobile main menu');await test('Mobile drawer controls stack vertically',async()=>{const b=await mp.locator('#drawer .drawer-nav:first-of-type > a,#drawer .drawer-nav:first-of-type > button').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {y:r.y,w:r.width,h:r.height}}));for(let i=1;i<b.length;i++)if(b[i].y<=b[i-1].y)throw Error('overlap');if(b.some(x=>x.w<280||x.h<42))throw Error(JSON.stringify(b));return `${b.length}`});await closeLayers(mp);
await test('Mobile bottom nav has Home, Find, Recent, More',async()=>{if(!await shown(mp,'.mobile-nav'))throw Error('hidden');const n=await mp.locator('.mobile-nav a,.mobile-nav button').count();if(n!==4)throw Error(String(n));return `${n}`});await tap(mp,'#mobileMore','Mobile More');await test('Mobile More opens drawer',async()=>{if(!await shown(mp,'#drawer.open'))throw Error('hidden')});await mp.screenshot({path:path.join(OUT,'05-mobile.png')});await mobile.close();

// Live API smoke checks.
for(const [p,label,validate] of [['/api/health','Health API',j=>j.ok&&j.modelReachable],['/api/feedback-health','Feedback health API',j=>j.ok&&j.formspreeConfigured],['/api/fx?base=ZAR&symbols=USD','FX API',j=>Number(j.rate)>0]])await test(label,async()=>{const r=await context.request.get(new URL(p,URL).href);if(r.status()!==200)throw Error(`HTTP ${r.status()}`);const j=await r.json();if(!validate(j))throw Error(JSON.stringify(j));return JSON.stringify(j)});
await test('Built-in browser QA reports no missing elements/functions',async()=>{const r=await page.evaluate(()=>typeof finditRunQA==='function'?finditRunQA():null);if(!r)throw Error('finditRunQA missing');if(!r.ok)throw Error(JSON.stringify(r));return JSON.stringify(r)});

if(pageErrors.length)row('No uncaught desktop JavaScript errors','FAIL',pageErrors.join(' | '));else row('No uncaught desktop JavaScript errors','PASS');
if(mobileErrors.length)row('No uncaught mobile JavaScript errors','FAIL',mobileErrors.join(' | '));else row('No uncaught mobile JavaScript errors','PASS');
const c=consoleErrors.filter(x=>!/favicon|ERR_BLOCKED_BY_CLIENT/i.test(x));if(c.length)row('No meaningful console errors','WARN',c.slice(0,15).join(' | '));else row('No meaningful console errors','PASS');
const f=failedRequests.filter(x=>!/(google\.com|maps|doubleclick|analytics)/i.test(x));if(f.length)row('No unexpected network failures','WARN',f.slice(0,15).join(' | '));else row('No unexpected network failures','PASS');
await page.screenshot({path:path.join(OUT,'06-final-full.png'),fullPage:true});
const report={url:URL,runAt:new Date().toISOString(),summary:{pass:checks.filter(x=>x.status==='PASS').length,warn:warnings.length,fail:failures.length},checks,pageErrors,mobileErrors,consoleErrors,failedRequests};fs.writeFileSync(path.join(OUT,'latest.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(OUT,'latest.md'),`# FindIt exhaustive production audit v2\n\n- PASS: ${report.summary.pass}\n- WARN: ${report.summary.warn}\n- FAIL: ${report.summary.fail}\n\n${checks.map(x=>`- **${x.status}** ${x.name}${x.detail?` — ${x.detail.replace(/\n/g,' ')}`:''}`).join('\n')}\n`);
await browser.close();console.log(`AUDIT_V2_SUMMARY=${JSON.stringify(report.summary)}`);if(failures.length)process.exit(1);
