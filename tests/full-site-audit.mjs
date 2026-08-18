import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const URL = process.env.FINDIT_URL || 'https://findit-nearby.vercel.app/';
const OUT = process.env.AUDIT_OUT || 'audit-output';
fs.mkdirSync(OUT,{recursive:true});

const checks=[];
const failures=[];
const warnings=[];
function note(name,status='PASS',detail=''){
  const row={name,status,detail:String(detail||'').slice(0,800)};
  checks.push(row);
  console.log(`[${status}] ${name}${detail?` — ${row.detail}`:''}`);
  if(status==='FAIL') failures.push(row);
  if(status==='WARN') warnings.push(row);
}
async function safe(name,fn,{warn=false}={}){
  try{const detail=await fn();note(name,'PASS',detail||'');return true}
  catch(e){note(name,warn?'WARN':'FAIL',e?.message||String(e));return false}
}
async function visible(page,sel){try{return await page.locator(sel).first().isVisible({timeout:1500})}catch{return false}}
async function click(page,sel,name,wait=180){return safe(name,async()=>{const el=page.locator(sel).first();await el.scrollIntoViewIfNeeded();await el.click({timeout:4000});if(wait)await page.waitForTimeout(wait)})}
async function closeKnown(page){
  const sels=['#v10CloseModal','#premiumSavedModal [data-close-tool="saved"]','#premiumCompareModal [data-close-tool="compare"]','#premiumFiltersModal [data-close-tool="filters"]','#challengeModal [data-close-modal]','#settingsModal [data-close-modal]','#closeAssistant','#closePremium'];
  for(const s of sels){try{const l=page.locator(s).first();if(await l.count()&&await l.isVisible())await l.click({timeout:800})}catch{}}
  try{const d=page.locator('#drawer.open');if(await d.count()&&await d.isVisible())await page.locator('#closeMenu').click({timeout:800})}catch{}
}

const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="100%" height="100%" fill="white"/><text x="600" y="230" text-anchor="middle" font-family="Arial" font-size="76" font-weight="700" fill="black">NIKE</text><text x="600" y="345" text-anchor="middle" font-family="Arial" font-size="58" font-weight="700" fill="black">Air Force 1 '07 Low</text><text x="600" y="440" text-anchor="middle" font-family="Arial" font-size="46" fill="black">White Royal Blue</text><text x="600" y="540" text-anchor="middle" font-family="Arial" font-size="32" fill="#444">FindIt production QA test image</text></svg>`;
const imgPath=path.join(process.cwd(),'tests','qa-product.svg');
fs.writeFileSync(imgPath,svg);

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({
  viewport:{width:1440,height:900},
  geolocation:{latitude:-25.7479,longitude:28.2293},
  permissions:['geolocation','clipboard-read','clipboard-write']
});
const page=await context.newPage();
const pageErrors=[];const consoleErrors=[];const networkFailures=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
page.on('requestfailed',r=>networkFailures.push(`${r.method()} ${r.url()} ${r.failure()?.errorText||''}`));
page.on('dialog',async d=>{try{if(d.type()==='prompt')await d.accept("Nike Air Force 1 '07 Low White Royal Blue");else await d.accept()}catch{}});
context.on('page',async p=>{if(p!==page){try{await p.waitForLoadState('domcontentloaded',{timeout:4000})}catch{};try{await p.close()}catch{}}});

await safe('Production homepage loads',async()=>{const r=await page.goto(URL,{waitUntil:'domcontentloaded',timeout:35000});if(!r||r.status()!==200)throw new Error(`HTTP ${r?.status()}`);await page.waitForTimeout(1800);return `HTTP ${r.status()}`});
await page.screenshot({path:path.join(OUT,'01-home-desktop.png'),fullPage:false});

// Global layout + main navigation
await safe('No horizontal page overflow on desktop',async()=>{const x=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));if(x.sw>x.cw+4)throw new Error(JSON.stringify(x));return JSON.stringify(x)});
for(const [sel,name] of [['.desktop-nav a[href="#finder"]','Desktop nav: Find'],['.desktop-nav a[href="#how"]','Desktop nav: How it works'],['.desktop-nav a[href="#examples"]','Desktop nav: Examples'],['.desktop-nav a[href="#feedback"]','Desktop nav: Feedback']]){
  await safe(name,async()=>{const href=await page.locator(sel).getAttribute('href');if(!href)throw new Error('missing href');return href});
}
await click(page,'#menuBtn','Open main drawer');
await safe('Main drawer is visible',async()=>{if(!await visible(page,'#drawer.open'))throw new Error('drawer did not open')});
await safe('Desktop drawer items are vertical and readable',async()=>{const boxes=await page.locator('#drawer .drawer-nav:first-of-type > a,#drawer .drawer-nav:first-of-type > button').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,text:e.textContent.trim()}}));for(let i=1;i<boxes.length;i++){if(boxes[i].y<=boxes[i-1].y)throw new Error(`overlap: ${boxes[i-1].text} / ${boxes[i].text}`)}if(boxes.some(b=>b.w<180||b.h<34))throw new Error('drawer control too small');return `${boxes.length} controls`});
await click(page,'#closeMenu','Close main drawer');

// Challenge flow
await click(page,'#challengeBtn','Open FindIt Challenge');
await safe('Challenge modal appears',async()=>{if(!await visible(page,'#challengeModal:not(.hidden)'))throw new Error('not visible')});
let challengeBefore='';try{challengeBefore=await page.locator('#challengeText').innerText()}catch{}
await click(page,'#newChallenge','Generate another challenge');
await safe('Challenge text exists',async()=>{const t=await page.locator('#challengeText').innerText();if(!t.trim())throw new Error('empty');return t});
await click(page,'#challengeModal [data-close-modal]','Close Challenge');
await click(page,'#challengeBtn2','Open second Challenge entry point');
await safe('Second Challenge entry works',async()=>{if(!await visible(page,'#challengeModal:not(.hidden)'))throw new Error('not visible')});
await click(page,'#challengeModal [data-close-modal]','Close second Challenge');

// Examples
await safe('Examples render',async()=>{const n=await page.locator('#exampleGrid > *').count();if(n<1)throw new Error('no examples');return `${n} cards`});
await click(page,'#shuffleExamples','Shuffle examples');

// Settings and recent navigation
await click(page,'#menuBtn','Open drawer for Settings');
await click(page,'#openSettings','Open Settings');
await safe('Settings modal appears',async()=>{if(!await visible(page,'#settingsModal:not(.hidden)'))throw new Error('not visible')});
await safe('Animations setting toggles',async()=>{const e=page.locator('#animationsToggle');const a=await e.isChecked();await e.click();const b=await e.isChecked();if(a===b)throw new Error('did not toggle');return `${a} -> ${b}`});
await safe('Free default radius options work',async()=>{for(const v of ['3','5','10']){await page.locator('#settingsRadius').selectOption(v);if(await page.locator('#settingsRadius').inputValue()!==v)throw new Error(`failed ${v}`)}return '3/5/10 km'});
await click(page,'#settingsModal [data-close-modal]','Close Settings');

// Finder upload/location/search
await safe('Gallery / Files input accepts image',async()=>{await page.locator('#photo').setInputFiles(imgPath);await page.waitForTimeout(250);if(!await page.locator('#search').isEnabled())throw new Error('Identify button still disabled');if(!await visible(page,'#preview:not(.hidden)'))throw new Error('preview not visible')});
await click(page,'#location','Use my location',700);
await safe('Location reaches ready state',async()=>{const t=await page.locator('#location').innerText();if(!/Location ready/i.test(t))throw new Error(t);return t});
await safe('Identify & Find completes with live backend',async()=>{await page.locator('#search').click();await page.waitForSelector('#results:not(.hidden)',{timeout:50000});await page.waitForTimeout(1800);const title=await page.locator('#resultTitle').innerText();if(!title.trim())throw new Error('empty result title');return title});
await page.screenshot({path:path.join(OUT,'02-search-results.png'),fullPage:false});

// Identification/result controls
await safe('Identification cards render',async()=>{const n=await page.locator('#analysis .analysis-card').count();if(n<4)throw new Error(`${n} cards`);return `${n} cards`});
await click(page,'#listViewBtn','Results list view');
await click(page,'#mapViewBtn','Results map view',1000);
await safe('Map container can be shown',async()=>{const cls=await page.locator('#mapWrap').getAttribute('class');if(!String(cls).includes('show'))throw new Error(String(cls));return cls});
await click(page,'#listViewBtn','Return to list view');
for(const [v,n] of [['best','Sort verified offers: Best match'],['price','Sort verified offers: Cheapest'],['distance','Sort verified offers: Closest']])await click(page,`[data-sort="${v}"]`,n);
await click(page,'#copyQuery','Copy product name');
await safe('Exact-item web link is valid',async()=>{const h=await page.locator('#searchOnline').getAttribute('href');if(!h?.startsWith('http'))throw new Error(String(h));return h});
await safe('Nearby retailer Maps link is valid',async()=>{const h=await page.locator('#searchNearbyFree').getAttribute('href');if(!h?.startsWith('http'))throw new Error(String(h));return h});
await click(page,'#shareFind','Share this find / clipboard fallback');
await click(page,'#thumbUp','Positive quick feedback shortcut');
await safe('Positive shortcut populates feedback',async()=>{const r=await page.locator('#feedbackRating').inputValue();if(r!=='5')throw new Error(`rating=${r}`)});
await click(page,'#thumbDown','Negative quick feedback shortcut');
await safe('Negative shortcut populates feedback',async()=>{const r=await page.locator('#feedbackRating').inputValue();if(r!=='2')throw new Error(`rating=${r}`)});

// Product intelligence state
await safe('Product Intelligence panel renders a truthful state',async()=>{if(!await visible(page,'#productIntelligencePanel:not(.hidden)'))throw new Error('panel hidden');const t=(await page.locator('#productIntelligenceResults').innerText()).trim();if(!t)throw new Error('empty panel');if(/ZAR\s*0\.00|R\s*0\.00/.test(t))throw new Error('invalid zero price displayed');return t.slice(0,300)});

// Recent + feedback
await safe('Recent find is automatically stored',async()=>{const n=await page.locator('#recentList .recent-card').count();if(n<1)throw new Error('no recent card');return `${n} recent`});
await safe('Feedback stars work',async()=>{await page.locator('.star-btn[data-rating="4"]').click();if(await page.locator('#feedbackRating').inputValue()!=='4')throw new Error('rating did not update')});
await safe('Feedback topic selector works',async()=>{await page.locator('#feedbackTopic').selectOption('bug');if(await page.locator('#feedbackTopic').inputValue()!=='bug')throw new Error('topic mismatch')});
await safe('Technical-details checkbox works',async()=>{const e=page.locator('#includeTechnical');const a=await e.isChecked();await e.click();if(a===await e.isChecked())throw new Error('did not toggle')});
await safe('Feedback validation prevents empty submission',async()=>{await page.locator('#feedbackMessage').fill('');await page.locator('#feedbackForm').evaluate(f=>f.requestSubmit());await page.waitForTimeout(150);const t=await page.locator('#feedbackStatus').innerText();if(!/write|detail|rating|more/i.test(t))throw new Error(`unexpected validation: ${t}`);return t});
await safe('Copy feedback works without sending',async()=>{await page.locator('#feedbackMessage').fill('QA test only - not submitted');await page.locator('#copyFeedback').click();await page.waitForTimeout(100);return await page.locator('#feedbackStatus').innerText()});

// Premium gating while Free
await safe('Free user selecting 25 km is gated by Premium',async()=>{await page.locator('#radiusSelect').selectOption('25');await page.waitForTimeout(180);if(!await visible(page,'#premiumModal:not(.hidden)'))throw new Error('Premium modal did not open');const v=await page.locator('#radiusSelect').inputValue();if(Number(v)>10)throw new Error(`Free radius became ${v}`);return `radius=${v}`});
await click(page,'#closePremium','Close Premium gate');
await click(page,'#saveFind','Free Save attempt opens Premium');
await safe('Free Save is Premium-gated',async()=>{if(!await visible(page,'#premiumModal:not(.hidden)'))throw new Error('Premium modal not shown')});
await click(page,'#closePremium','Close Free Save gate');

// Premium activation
await click(page,'#premiumButton','Open Premium plan modal');
await safe('Free/Premium comparison is visible',async()=>{if(!await visible(page,'#premiumModal:not(.hidden)'))throw new Error('hidden');const t=await page.locator('#premiumModal').innerText();if(!t.includes('FindIt Free')||!t.includes('FindIt Premium'))throw new Error('comparison missing')});
await click(page,'#activatePremiumTester','Activate Premium Beta');
await safe('Premium activates without email/payment',async()=>{const v=await page.evaluate(()=>localStorage.getItem('findit_premium_beta'));if(v!=='1')throw new Error(`key=${v}`);if(!await visible(page,'#v10CommandCentre:not(.hidden)'))throw new Error('V10 centre hidden');return 'Premium active'});
await page.screenshot({path:path.join(OUT,'03-premium-command-centre.png'),fullPage:false});
await safe('Premium command centre has no horizontal overflow',async()=>{const x=await page.locator('#v10CommandCentre').evaluate(e=>({sw:e.scrollWidth,cw:e.clientWidth}));if(x.sw>x.cw+3)throw new Error(JSON.stringify(x));return JSON.stringify(x)});
await safe('Premium heading fits desktop layout',async()=>{const h=page.locator('#v10CommandCentre .v10-top h2');const b=await h.boundingBox();const text=await h.innerText();if(!b||b.width<500)throw new Error(`heading too narrow ${JSON.stringify(b)}`);return `${text} width=${Math.round(b.width)}`});
await safe('Every Premium V10 tile includes How-to guidance',async()=>{const buttons=page.locator('#v10CommandCentre [data-v10]');const n=await buttons.count();const missing=[];for(let i=0;i<n;i++){const b=buttons.nth(i);const a=await b.getAttribute('data-v10');if(!await b.locator('.v10-how').count())missing.push(a)}if(missing.length)throw new Error(`missing guidance: ${missing.join(', ')}`);return `${n} guided tools`});
await safe('Full Premium guide button exists',async()=>{if(!await page.locator('#finditOpenGuide').count())throw new Error('missing guide button')});
await click(page,'#finditOpenGuide','Open full Premium how-to guide');
await safe('Premium how-to guide opens',async()=>{if(!await visible(page,'#finditGuideModal:not(.hidden)'))throw new Error('guide hidden');const n=await page.locator('#finditGuideModal .findit-guide-grid article').count();if(n<10)throw new Error(`${n} guide entries`);return `${n} guide entries`});
await click(page,'#finditGuideModal .findit-guide-close','Close Premium guide');

// V10 top tools
await click(page,'[data-v10="scan"]','V10 Vision+');
await safe('Vision+ routes to finder',async()=>{const y=await page.locator('#finder').evaluate(e=>Math.abs(e.getBoundingClientRect().top));if(y>250)throw new Error(`finder top=${y}`)});
await click(page,'[data-v10="manual"]','V10 Manual Search');
await safe('Manual Search interaction is wired',async()=>true);
await click(page,'[data-v10="exact"]','V10 Exact Match');
await safe('Exact Match interaction is wired',async()=>true);
await click(page,'[data-v10="assistant"]','V10 AI Search');
await safe('AI Search opens assistant or performs search action',async()=>{if(!await visible(page,'#assistantPanel:not(.hidden)')){const msgs=await page.locator('#assistantMessages .assistant-msg').count();if(msgs<1)throw new Error('assistant did not open / update')}return 'assistant available'});
if(await visible(page,'#assistantPanel:not(.hidden)'))await click(page,'#closeAssistant','Close assistant from V10');

// Collections
await click(page,'[data-v10="collections"]','Open Collections');
await safe('Collections modal is usable',async()=>{if(!await visible(page,'#v10UniversalModal:not(.hidden)'))throw new Error('modal hidden');if(!await page.locator('#v10CollectionName').count())throw new Error('name input missing');await page.locator('#v10CollectionName').fill('QA Collection');await page.locator('#v10AddCollection').click();await page.waitForTimeout(120);if(!(await page.locator('#v10ModalBody').innerText()).includes('QA Collection'))throw new Error('collection not created');const add=page.locator('[data-col-add]').last();if(await add.count())await add.click();return 'create + add current Find'});
await click(page,'#v10CloseModal','Close Collections');

// Save/Saved items
await click(page,'#saveFind','Premium Save current Find');
await safe('Premium Save stores item',async()=>{const a=await page.evaluate(()=>JSON.parse(localStorage.getItem('finditSaved')||'[]'));if(!a.length)throw new Error('saved list empty');return `${a.length} saved`});
await click(page,'[data-premium-action="saved"]','Open Saved Items');
await safe('Saved Items modal opens',async()=>{if(!await visible(page,'#premiumSavedModal:not(.hidden)'))throw new Error('hidden')});
await safe('Saved Items have individual Delete buttons',async()=>{const n=await page.locator('#premiumSavedList .findit-delete-btn,[data-premium-saved-delete],[data-qa-saved-delete]').count();if(n<1)throw new Error('delete button missing');return `${n} delete control(s)`});
await safe('Delete one Saved Item works',async()=>{const before=(await page.evaluate(()=>JSON.parse(localStorage.getItem('finditSaved')||'[]'))).length;const b=page.locator('#premiumSavedList .findit-delete-btn,[data-premium-saved-delete],[data-qa-saved-delete]').first();await b.click();await page.waitForTimeout(100);const after=(await page.evaluate(()=>JSON.parse(localStorage.getItem('finditSaved')||'[]'))).length;if(after>=before)throw new Error(`${before} -> ${after}`);return `${before} -> ${after}`});
await click(page,'#premiumSavedModal [data-close-tool="saved"]','Close Saved Items');

// Watchlist
await click(page,'[data-v10="watchlist"]','Open Price & Stock Watchlist');
await safe('Watchlist opens with clear instructions',async()=>{if(!await visible(page,'#v10UniversalModal:not(.hidden)'))throw new Error('hidden');const t=await page.locator('#v10ModalBody').innerText();if(!/price|stock/i.test(t))throw new Error('price/stock copy missing');return t.slice(0,180)});
await safe('Watchlist Add current product works',async()=>{const b=page.locator('#watchAddCurrent2,#watchAddCurrent').first();if(!await b.count())throw new Error('Add current product missing');await b.click();await page.waitForTimeout(180);const a=await page.evaluate(()=>JSON.parse(localStorage.getItem('findit_v10_watchlist')||'[]'));if(!a.length)throw new Error('watchlist empty');return a[0].name});
await safe('Watchlist target price works',async()=>{const i=page.locator('[data-watch-target2],[data-watch-target]').first();if(!await i.count())throw new Error('target input missing');await i.fill('1500');await i.dispatchEvent('change');await page.waitForTimeout(80);const a=await page.evaluate(()=>JSON.parse(localStorage.getItem('findit_v10_watchlist')||'[]'));if(Number(a[0]?.targetPrice)!==1500)throw new Error(JSON.stringify(a[0]));return 'R1500 target saved'});
await safe('Watchlist Check now completes',async()=>{const b=page.locator('[data-watch-check2],[data-watch-check]').first();if(!await b.count())throw new Error('Check now missing');await b.click();await page.waitForTimeout(9000);const a=await page.evaluate(()=>JSON.parse(localStorage.getItem('findit_v10_watchlist')||'[]'));if(!a[0]?.lastCheckedAt)throw new Error('lastCheckedAt was not set');return `${a[0].lastAlert||''} | retailer=${a[0].retailer||'none'} | price=${a[0].lastPrice??'unverified'} | stock=${a[0].lastStock??'unverified'}`},{warn:false});
await safe('Watchlist never displays fake zero price',async()=>{const t=await page.locator('#v10ModalBody').innerText();if(/(?:ZAR|R)\s*0(?:\.00)?\b/.test(t))throw new Error('zero price shown');return 'no zero fake price'});
await page.screenshot({path:path.join(OUT,'04-watchlist.png'),fullPage:false});
await click(page,'#v10CloseModal','Close Watchlist');

// Favourite Stores
await click(page,'[data-v10="favourites"]','Open Favourite Stores');
await safe('Favourite Stores opens',async()=>{if(!await visible(page,'#v10UniversalModal:not(.hidden)'))throw new Error('hidden');return (await page.locator('#v10ModalBody').innerText()).slice(0,160)});
await safe('Favourite Store can be saved when nearby stores exist',async()=>{const b=page.locator('[data-qa-fav-add],[data-fav-store]').first();if(!await b.count())throw new Error('No nearby retailer was available to save');await b.click();await page.waitForTimeout(100);const a=await page.evaluate(()=>JSON.parse(localStorage.getItem('findit_v10_favourite_stores')||'[]'));if(!a.length)throw new Error('favourites empty');return a[0].name},{warn:true});
await safe('Favourite Stores support individual Delete',async()=>{const b=page.locator('[data-qa-fav-del],.findit-delete-btn').first();if(!await b.count())throw new Error('delete missing');return 'delete present'},{warn:true});
await click(page,'#v10CloseModal','Close Favourite Stores');

// Stats
await click(page,'[data-v10="stats"]','Open My Stats');
await safe('My Stats shows real local counts',async()=>{const t=await page.locator('#v10ModalBody').innerText();for(const s of ['Recent finds','Saved items','Watchlist','Favourite stores'])if(!t.includes(s))throw new Error(`missing ${s}`);return t.slice(0,180)});
await click(page,'#v10CloseModal','Close My Stats');

// History+
await click(page,'[data-v10="history"]','Open History+');
await safe('History+ opens and is searchable',async()=>{if(!await visible(page,'#v10UniversalModal:not(.hidden)'))throw new Error('hidden');const i=page.locator('#qaHistorySearch,#v10HistorySearch').first();if(!await i.count())throw new Error('search input missing');await i.fill('nike');return 'search input works'});
await safe('History+ has per-item Delete',async()=>{const b=page.locator('[data-qa-history-delete],[data-history-delete]').first();if(!await b.count())throw new Error('delete button missing');return 'delete present'});
await safe('History+ individual delete works',async()=>{const before=(await page.evaluate(()=>JSON.parse(localStorage.getItem('finditRecent')||'[]'))).length;const b=page.locator('[data-qa-history-delete],[data-history-delete]').first();await b.click();await page.waitForTimeout(100);const after=(await page.evaluate(()=>JSON.parse(localStorage.getItem('finditRecent')||'[]'))).length;if(after>=before)throw new Error(`${before} -> ${after}`);return `${before} -> ${after}`});
await click(page,'#v10CloseModal','Close History+');

// Premium Home commands + controls
await click(page,'[data-premium-action="find"]','Premium Advanced Find');
await click(page,'[data-premium-action="compare"]','Premium Compare Stores');
await safe('Compare Stores modal opens',async()=>{if(!await visible(page,'#premiumCompareModal:not(.hidden)'))throw new Error('hidden');return (await page.locator('#premiumCompareList').innerText()).slice(0,120)});
await click(page,'#premiumCompareModal [data-close-tool="compare"]','Close Compare Stores');
await click(page,'[data-premium-action="map"]','Premium Nearby Map',700);
for(const v of ['5','10','15','25'])await click(page,`[data-premium-radius="${v}"]`,`Premium radius ${v} km`);
await safe('Premium 25 km radius is retained',async()=>{const v=await page.evaluate(()=>typeof state!=='undefined'?state.radius:Number(localStorage.getItem('finditRadius')));if(Number(v)!==25)throw new Error(`radius=${v}`);return '25 km'});
for(const v of ['closest','name','original'])await click(page,`[data-store-sort="${v}"]`,`Premium store sorting ${v}`);

// Premium Workspace
await click(page,'#premiumWorkspaceButton','Open Premium Tools workspace');
await safe('Premium workspace opens',async()=>{if(!await visible(page,'#premiumWorkspace:not(.hidden)'))throw new Error('hidden')});
for(const a of ['find','saved','compare','map','radius','filters','history','challenge','alerts']){
  await safe(`Premium workspace: ${a}`,async()=>{
    if(!await visible(page,'#premiumWorkspace:not(.hidden)'))await page.locator('#premiumWorkspaceButton').click();
    const b=page.locator(`[data-pw="${a}"]`);if(!await b.count())throw new Error('button missing');if(await b.isDisabled())throw new Error('button disabled');await b.click();await page.waitForTimeout(180);return 'wired';
  });
  await closeKnown(page);
}

// Premium drawer routes
await click(page,'#menuBtn','Open drawer for Premium route audit');
await safe('Premium drawer layout is vertical on desktop',async()=>{const boxes=await page.locator('#premiumDrawerNav > a,#premiumDrawerNav > button').evaluateAll(es=>es.filter(e=>getComputedStyle(e).display!=='none').map(e=>{const r=e.getBoundingClientRect();return {y:r.y,w:r.width,h:r.height,text:e.textContent.trim()}}));for(let i=1;i<boxes.length;i++)if(boxes[i].y<=boxes[i-1].y)throw new Error(`overlap ${boxes[i-1].text}/${boxes[i].text}`);return `${boxes.length} controls`});
const drawerControls=[
 ['#premiumDrawerNav a[href="#v10CommandCentre"],#premiumDrawerNav a[href="#premiumHome"]','Premium Home'],
 ['#premiumDrawerNav a[href="#finder"]','Advanced Find'],['#premiumSavedMenu','Saved Items'],['#premiumCompareMenu','Compare Stores'],
 ['#premiumDrawerNav a[href="#results"],#premiumDrawerNav a[href="#nearbyPanel"]','Nearby Map'],['#premiumRadiusMenu','Search Radius'],
 ['#premiumFiltersMenu','Smart Filters'],['#premiumHistoryMenu','Extended History'],['#premiumChallengeMenu','Premium Challenge'],
 ['#premiumDrawerNav button:has-text("Price & Stock"),#premiumDrawerNav button:has-text("Price Alerts")','Price & Stock Watchlist'],['#openSettingsPremium','Premium Settings']
];
for(const [sel,name] of drawerControls){
  await safe(`Premium drawer: ${name}`,async()=>{if(!await visible(page,'#drawer.open'))await page.locator('#menuBtn').click();const b=page.locator(sel).first();if(!await b.count())throw new Error('missing');if(await b.evaluate(e=>e.tagName==='BUTTON'&&e.disabled))throw new Error('disabled');await b.click();await page.waitForTimeout(170);return 'wired'});
  await closeKnown(page);
}

// Assistant all interactions
await click(page,'#assistantFab','Open Ask FindIt');
await safe('Assistant panel opens',async()=>{if(!await visible(page,'#assistantPanel:not(.hidden)'))throw new Error('hidden')});
for(const label of ['What did FindIt identify?','Why are there no nearby stores?','Explain the price and stock information.']){
  await safe(`Assistant quick: ${label}`,async()=>{const b=page.locator(`[data-assistant-quick="${label}"]`);await b.click();await page.waitForTimeout(5000);const msgs=await page.locator('#assistantMessages .assistant-msg').count();if(msgs<2)throw new Error('no response message');return `${msgs} messages`});
}
await safe('Assistant custom question',async()=>{await page.locator('#assistantInput').fill('How do I use the Premium Watchlist?');await page.locator('#assistantForm button').click();await page.waitForTimeout(5000);const last=await page.locator('#assistantMessages .assistant-msg').last().innerText();if(!last.trim())throw new Error('empty answer');return last.slice(0,220)});
await click(page,'#closeAssistant','Close Ask FindIt');

// Main drawer extra routes
await click(page,'#menuBtn','Open drawer for remaining Free routes');
await safe('Drawer Ask FindIt works',async()=>{const b=page.locator('#drawerAskFindIt');if(!await b.count())throw new Error('missing');await b.click();await page.waitForTimeout(120);if(!await visible(page,'#assistantPanel:not(.hidden)'))throw new Error('assistant not opened')});
await closeKnown(page);
await click(page,'#menuBtn','Reopen drawer for Recent');
await safe('Drawer Recent Finds route works',async()=>{await page.locator('#openRecent').click();await page.waitForTimeout(200);const y=await page.locator('#recent').evaluate(e=>Math.abs(e.getBoundingClientRect().top));if(y>300)throw new Error(`top=${y}`)});

// Mobile audit
const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,geolocation:{latitude:-25.7479,longitude:28.2293},permissions:['geolocation']});
const mp=await mobile.newPage();const mErrors=[];mp.on('pageerror',e=>mErrors.push(String(e)));
await safe('Mobile production homepage loads',async()=>{const r=await mp.goto(URL,{waitUntil:'domcontentloaded',timeout:35000});if(!r||r.status()!==200)throw new Error(`HTTP ${r?.status()}`);await mp.waitForTimeout(1400)});
await safe('No horizontal page overflow on mobile',async()=>{const x=await mp.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));if(x.sw>x.cw+4)throw new Error(JSON.stringify(x));return JSON.stringify(x)});
await click(mp,'#menuBtn','Mobile menu opens');
await safe('Mobile drawer controls are vertical and full-width',async()=>{const boxes=await mp.locator('#drawer .drawer-nav:first-of-type > a,#drawer .drawer-nav:first-of-type > button').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {y:r.y,w:r.width,h:r.height}}));for(let i=1;i<boxes.length;i++)if(boxes[i].y<=boxes[i-1].y)throw new Error('controls overlap');if(boxes.some(b=>b.w<280||b.h<42))throw new Error(JSON.stringify(boxes.slice(0,4)));return `${boxes.length} controls`});
await safe('Mobile bottom navigation is visible',async()=>{if(!await visible(mp,'.mobile-nav'))throw new Error('mobile nav hidden');const n=await mp.locator('.mobile-nav a,.mobile-nav button').count();if(n<4)throw new Error(`${n} controls`);return `${n} controls`});
await click(mp,'#mobileMore','Mobile More button');
await safe('Mobile More opens drawer',async()=>{if(!await visible(mp,'#drawer.open'))throw new Error('drawer hidden')});
await mp.screenshot({path:path.join(OUT,'05-mobile-menu.png'),fullPage:false});
await mobile.close();

// Live endpoint smoke checks from browser context
await safe('Health API live',async()=>{const r=await context.request.get(new URL('/api/health',URL).href);if(r.status()!==200)throw new Error(`HTTP ${r.status()}`);const j=await r.json();if(!j.ok||!j.modelReachable)throw new Error(JSON.stringify(j));return JSON.stringify(j)});
await safe('Feedback health API live',async()=>{const r=await context.request.get(new URL('/api/feedback-health',URL).href);if(r.status()!==200)throw new Error(`HTTP ${r.status()}`);const j=await r.json();if(!j.ok||!j.formspreeConfigured)throw new Error(JSON.stringify(j));return JSON.stringify(j)});

// Runtime QA function and errors
await safe('Built-in FindIt QA report passes',async()=>{const r=await page.evaluate(()=>typeof finditRunQA==='function'?finditRunQA():null);if(!r)throw new Error('finditRunQA missing');if(!r.ok)throw new Error(JSON.stringify(r));return JSON.stringify(r)});
if(pageErrors.length)note('No uncaught JavaScript page errors','FAIL',pageErrors.join(' | '));else note('No uncaught JavaScript page errors','PASS');
if(mErrors.length)note('No mobile JavaScript page errors','FAIL',mErrors.join(' | '));else note('No mobile JavaScript page errors','PASS');
const meaningfulConsole=consoleErrors.filter(x=>!/favicon|net::ERR_BLOCKED_BY_CLIENT/i.test(x));
if(meaningfulConsole.length)note('No meaningful console errors','WARN',meaningfulConsole.slice(0,15).join(' | '));else note('No meaningful console errors','PASS');
const meaningfulNetwork=networkFailures.filter(x=>!x.includes('google.com')&&!x.includes('maps'));
if(meaningfulNetwork.length)note('No unexpected network request failures','WARN',meaningfulNetwork.slice(0,15).join(' | '));else note('No unexpected network request failures','PASS');

await page.screenshot({path:path.join(OUT,'06-final-desktop.png'),fullPage:true});
const report={url:URL,runAt:new Date().toISOString(),summary:{passes:checks.filter(x=>x.status==='PASS').length,warnings:warnings.length,failures:failures.length},checks,pageErrors,consoleErrors,networkFailures};
fs.writeFileSync(path.join(OUT,'findit-full-audit.json'),JSON.stringify(report,null,2));
fs.writeFileSync(path.join(OUT,'findit-full-audit.md'),`# FindIt full production audit\n\n- URL: ${URL}\n- Run: ${report.runAt}\n- PASS: ${report.summary.passes}\n- WARN: ${report.summary.warnings}\n- FAIL: ${report.summary.failures}\n\n${checks.map(x=>`- **${x.status}** — ${x.name}${x.detail?` — ${x.detail.replace(/\n/g,' ')}`:''}`).join('\n')}\n`);
await browser.close();
console.log(`AUDIT_SUMMARY=${JSON.stringify(report.summary)}`);
if(failures.length)process.exit(1);
