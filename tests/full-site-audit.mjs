import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL=process.env.FINDIT_URL||'https://findit-nearby.vercel.app/';
const OUT=process.env.AUDIT_OUT||'audit-output';
fs.mkdirSync(OUT,{recursive:true});
const checks=[],failures=[],warnings=[];
function note(name,status='PASS',detail=''){const row={name,status,detail:String(detail||'').slice(0,700)};checks.push(row);console.log(`[${status}] ${name}${detail?` — ${row.detail}`:''}`);if(status==='FAIL')failures.push(row);if(status==='WARN')warnings.push(row)}
async function safe(name,fn,{warn=false}={}){try{const d=await fn();note(name,'PASS',d||'');return true}catch(e){note(name,warn?'WARN':'FAIL',e?.message||String(e));return false}}
async function isVisible(page,sel){try{return await page.locator(sel).first().isVisible({timeout:1200})}catch{return false}}
async function click(page,sel,name,wait=180){return safe(name,async()=>{const el=page.locator(sel).first();if(!await el.isVisible({timeout:2500}))throw Error('control is not visible');await el.click({timeout:5000});if(wait)await page.waitForTimeout(wait)})}
async function expectVisible(page,sel,msg='not visible'){if(!await isVisible(page,sel))throw Error(msg)}
async function closeJourney(page,target='product'){
 const root=page.locator('#finditJourney');
 if(!await root.count()||!await root.isVisible().catch(()=>false))return 'not open';
 const next=page.locator('[data-fj-next]').first();
 if(await next.isVisible().catch(()=>false)){await next.click({timeout:4000});await page.waitForTimeout(120)}
 const go=page.locator(`[data-fj-go="${target}"]`).first();
 if(await go.isVisible().catch(()=>false)){await go.click({timeout:4000});await page.waitForTimeout(220)}
 else {const close=page.locator('[data-fj-close]').first();if(await close.isVisible().catch(()=>false))await close.click({timeout:3000})}
 if(await root.isVisible().catch(()=>false))throw Error('identifying journey did not close');
 return 'closed through real-user flow';
}
async function closeKnown(page){
 try{if(await isVisible(page,'#finditJourney'))await closeJourney(page)}catch{}
 for(const s of ['#v10CloseModal','#premiumSavedModal [data-close-tool="saved"]','#premiumCompareModal [data-close-tool="compare"]','#premiumFiltersModal [data-close-tool="filters"]','#challengeModal [data-close-modal]','#settingsModal [data-close-modal]','#closeAssistant','#closePremium']){try{const e=page.locator(s).first();if(await e.count()&&await e.isVisible())await e.click({timeout:1200})}catch{}}
 try{if(await isVisible(page,'#drawer.open'))await page.locator('#closeMenu').click({timeout:1200})}catch{}
}

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},geolocation:{latitude:-25.7479,longitude:28.2293},permissions:['geolocation','clipboard-read','clipboard-write']});
const imgPath=path.join(process.cwd(),'tests','qa-product.png');
const gen=await context.newPage();
await gen.setContent(`<html><body style="margin:0;background:#ececec"><canvas id="c" width="1200" height="800"></canvas><script>const c=document.getElementById('c'),x=c.getContext('2d');x.fillStyle='#ececec';x.fillRect(0,0,1200,800);x.fillStyle='#fff';x.fillRect(140,120,920,560);x.strokeStyle='#222';x.lineWidth=10;x.beginPath();x.moveTo(250,500);x.quadraticCurveTo(350,350,520,360);x.lineTo(720,410);x.quadraticCurveTo(860,445,920,520);x.lineTo(900,580);x.lineTo(300,580);x.quadraticCurveTo(230,565,250,500);x.closePath();x.fillStyle='#f7f7f7';x.fill();x.stroke();x.beginPath();x.moveTo(390,430);x.quadraticCurveTo(520,520,770,470);x.strokeStyle='#1d5cff';x.lineWidth=28;x.stroke();x.fillStyle='#111';x.font='bold 64px Arial';x.fillText('RUNNING SHOE',350,245);x.font='34px Arial';x.fillText('blue and white sneaker',420,300);</script></body></html>`);
await gen.locator('#c').screenshot({path:imgPath});await gen.close();

const page=await context.newPage(),pageErrors=[],consoleErrors=[],networkFailures=[];
page.on('pageerror',e=>pageErrors.push(String(e)));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});page.on('requestfailed',r=>networkFailures.push(`${r.method()} ${r.url()} ${r.failure()?.errorText||''}`));
page.on('dialog',async d=>{try{if(d.type()==='prompt')await d.accept('blue running shoe');else await d.accept()}catch{}});
context.on('page',async p=>{if(p!==page){try{await p.waitForLoadState('domcontentloaded',{timeout:3000})}catch{};try{await p.close()}catch{}}});

await safe('Production homepage loads',async()=>{const r=await page.goto(BASE_URL,{waitUntil:'domcontentloaded',timeout:35000});if(!r||r.status()!==200)throw Error(`HTTP ${r?.status()}`);await page.waitForTimeout(1800);return `HTTP ${r.status()}`});
await page.screenshot({path:path.join(OUT,'01-home-desktop.png')});
await safe('Desktop has no horizontal overflow',async()=>{const x=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));if(x.sw>x.cw+4)throw Error(JSON.stringify(x));return JSON.stringify(x)});
for(const [sel,name] of [['.desktop-nav a[href="#finder"]','Desktop nav Find'],['.desktop-nav a[href="#how"]','Desktop nav How'],['.desktop-nav a[href="#examples"]','Desktop nav Examples'],['.desktop-nav a[href="#feedback"]','Desktop nav Feedback']])await safe(name,async()=>{if(!await page.locator(sel).count())throw Error('missing')});
await click(page,'#menuBtn','Open main drawer');await safe('Main drawer opens',()=>expectVisible(page,'#drawer.open'));await safe('Main drawer controls do not overlap',async()=>{const b=await page.locator('#drawer .drawer-nav:first-of-type > a,#drawer .drawer-nav:first-of-type > button').evaluateAll(es=>es.filter(e=>getComputedStyle(e).display!=='none').map(e=>{const r=e.getBoundingClientRect();return {y:r.y,h:r.height,w:r.width,t:e.textContent.trim()}}));for(let i=1;i<b.length;i++)if(b[i].y<b[i-1].y+b[i-1].h-2)throw Error(`${b[i-1].t}/${b[i].t}`);return `${b.length} visible controls`});await click(page,'#closeMenu','Close main drawer');
await click(page,'#challengeBtn','Open Challenge');await safe('Challenge modal visible',()=>expectVisible(page,'#challengeModal:not(.hidden)'));await click(page,'#newChallenge','New challenge');await safe('Challenge text populated',async()=>{const t=await page.locator('#challengeText').innerText();if(!t.trim())throw Error('empty');return t});await closeKnown(page);
await safe('Examples render',async()=>{const n=await page.locator('#exampleGrid > *').count();if(n<4)throw Error(`${n}`);return `${n} cards`});await click(page,'#shuffleExamples','Shuffle examples');
await click(page,'#menuBtn','Open drawer for settings');await click(page,'#openSettings','Open Settings');await safe('Settings visible',()=>expectVisible(page,'#settingsModal:not(.hidden)'));await safe('Animations toggle works',async()=>{const e=page.locator('#animationsToggle');const a=await e.isChecked();await e.click();if(a===await e.isChecked())throw Error('no change')});await safe('Free radius settings 3/5/10 work',async()=>{for(const v of ['3','5','10']){await page.locator('#settingsRadius').selectOption(v);if(await page.locator('#settingsRadius').inputValue()!==v)throw Error(v)}return '3,5,10'});await closeKnown(page);

await safe('Image picker accepts a real raster image',async()=>{await page.locator('#photo').setInputFiles(imgPath);await page.waitForTimeout(300);if(!await page.locator('#search').isEnabled())throw Error('Identify disabled');await expectVisible(page,'#preview:not(.hidden)')});
await click(page,'#location','Use my location',700);await safe('Location becomes ready',async()=>{const t=await page.locator('#location').innerText();if(!/Location ready/i.test(t))throw Error(t);return t});
await safe('Identify & Find completes',async()=>{await page.locator('#search').click({timeout:5000});await page.waitForSelector('#results:not(.hidden)',{timeout:55000});await page.waitForFunction(()=>{const n=document.querySelector('#resultName')?.textContent?.trim();return n&&n!=='Item'},null,{timeout:8000});const t=(await page.locator('#resultName').innerText()).trim();return t});
await safe('Identifying journey reaches success and can be exited',async()=>{if(await isVisible(page,'#finditJourney')){await page.waitForSelector('[data-fj-next],[data-fj-close]',{state:'visible',timeout:8000});return await closeJourney(page,'product')}return 'journey already closed'});
await page.screenshot({path:path.join(OUT,'02-search-results.png')});
await safe('Identification analysis cards render',async()=>{const n=await page.locator('#resultMeta .analysis-card').count();if(n<2)throw Error(`${n}`);return `${n}`});
await safe('Search completes without user-facing search error',async()=>{const s=(await page.locator('#status').innerText()).trim();const n=(await page.locator('#resultNote').innerText()).trim();if(/search failed|search error|took too long/i.test(`${s} ${n}`))throw Error(`${s} ${n}`);return s});
await safe('Exact-seller section never shows fake zero price',async()=>{const e=page.locator('#exactSellerResults');if(!await e.count())return 'no exact-seller section';const t=await e.innerText();if(/(?:ZAR|R)\s*0(?:[.,]00)?\b/.test(t))throw Error('fake zero price');return t.slice(0,180)});
await safe('Retailer links use real HTTP(S) destinations',async()=>{const links=page.locator('#exactSellerResults a[href],#finditV3Actions a[href]');let good=0;for(let i=0;i<await links.count();i++){const h=await links.nth(i).getAttribute('href');if(h&&/^https?:\/\//i.test(h))good++}if(!good)throw Error('no usable retailer/search links');return `${good} usable links`});
await safe('Nearby cards are truthful about Directions',async()=>{const cards=page.locator('#nearbyStores .store-card');for(let i=0;i<await cards.count();i++){const c=cards.nth(i),exact=await c.getAttribute('data-exact-branch'),dirs=await c.locator('.exact-directions').count();if(exact!=='1'&&dirs)throw Error(`unverified card ${i} has Directions`);if(exact==='1'&&!dirs)throw Error(`verified card ${i} missing Directions`)}return `${await cards.count()} nearby cards checked`});
await safe('Map button is clickable and does not get blocked',async()=>{const b=page.locator('#mapViewBtn').first();if(!await b.isVisible())return 'not applicable: map control not visible';await b.click({timeout:5000});await page.waitForTimeout(900);const m=page.locator('#map');return `map visible=${await m.isVisible().catch(()=>false)}`});

await safe('Feedback star rating works',async()=>{await page.locator('#feedback').scrollIntoViewIfNeeded();const star=page.locator('.star-btn[data-rating="4"]');if(!await star.isVisible())throw Error('4-star control missing');await star.click();const v=await page.locator('#feedbackRating').inputValue();if(v!=='4')throw Error(`rating=${v}`);return '4 stars selected'});
await safe('Feedback form has empty-message validation',async()=>{await page.locator('#feedbackMessage').fill('');const invalid=await page.locator('#feedbackMessage').evaluate(e=>!e.checkValidity());if(!invalid)throw Error('required validation inactive');return 'browser required validation active'});
await safe('Feedback copy works',async()=>{await page.locator('#feedbackMessage').fill('QA test only - not submitted');await page.locator('#copyFeedback').click({timeout:4000});await page.waitForTimeout(180);const t=await page.locator('#feedbackStatus').innerText();if(!/copied/i.test(t))throw Error(t||'no copied confirmation');return t});

await safe('Free 25 km radius is Premium-gated',async()=>{await page.locator('#radiusSelect').selectOption('25');await page.waitForTimeout(250);await expectVisible(page,'#premiumModal:not(.hidden)');if(Number(await page.locator('#radiusSelect').inputValue())>10)throw Error('free radius exceeded 10');return 'gated'});await closeKnown(page);
await safe('Free Save opens Premium gate',async()=>{const b=page.locator('#saveFind');await b.scrollIntoViewIfNeeded();await b.click({timeout:4000});await page.waitForTimeout(150);await expectVisible(page,'#premiumModal:not(.hidden)');return 'gated'});await closeKnown(page);
await click(page,'#premiumButton','Open Premium modal');await safe('Free/Premium comparison visible',async()=>{const t=await page.locator('#premiumModal').innerText();if(!t.includes('FindIt Free')||!t.includes('FindIt Premium'))throw Error('comparison missing');return 'comparison visible'});
await click(page,'#activatePremiumTester','Activate Premium Beta');await safe('Premium activates',async()=>{if(await page.evaluate(()=>localStorage.getItem('findit_premium_beta'))!=='1')throw Error('local premium flag missing');await expectVisible(page,'#v10CommandCentre:not(.hidden)');return 'active'});
await page.screenshot({path:path.join(OUT,'03-premium.png')});
await safe('Premium command centre fits desktop',async()=>{const x=await page.locator('#v10CommandCentre').evaluate(e=>({sw:e.scrollWidth,cw:e.clientWidth}));if(x.sw>x.cw+3)throw Error(JSON.stringify(x));return JSON.stringify(x)});
await safe('Premium heading is visible',async()=>{const b=await page.locator('#v10CommandCentre .v10-top h2').boundingBox();if(!b||b.width<200||b.height<20)throw Error(JSON.stringify(b));return `${Math.round(b.width)}x${Math.round(b.height)}`});
await safe('Visible Premium V10 tools include guidance',async()=>{const bs=page.locator('#v10CommandCentre [data-v10]'),miss=[];for(let i=0;i<await bs.count();i++){const b=bs.nth(i);if(await b.isVisible()&&!await b.locator('.v10-how').count())miss.push(await b.getAttribute('data-v10'))}if(miss.length)throw Error(miss.join(','));return `${await bs.count()} tools checked`});

for(const tool of ['scan','manual','exact','assistant','collections','watchlist','favourites','stats','history']){
 await closeKnown(page);
 await safe(`V10 ${tool} opens`,async()=>{const b=page.locator(`[data-v10="${tool}"]`).first();if(!await b.isVisible())throw Error('tool not visible');await b.scrollIntoViewIfNeeded();await b.click({timeout:5000});await page.waitForTimeout(260);if(tool==='scan'){const f=page.locator('#finder');if(!await f.isVisible())throw Error('finder not visible');return 'routed to finder'}if(tool==='exact'&&!await isVisible(page,'#v10UniversalModal:not(.hidden)'))return 'external exact-match action executed';if(tool==='assistant'&&!await isVisible(page,'#v10UniversalModal:not(.hidden)')&&await isVisible(page,'#assistantPanel:not(.hidden)'))return 'assistant opened';await expectVisible(page,'#v10UniversalModal:not(.hidden)');return (await page.locator('#v10ModalBody').innerText()).trim().slice(0,100)});
 if(tool==='collections'&&await isVisible(page,'#v10CollectionName'))await safe('Collections create control works',async()=>{await page.locator('#v10CollectionName').fill('QA collection');await page.locator('#v10AddCollection').click();const t=await page.locator('#v10ModalBody').innerText();if(!t.includes('QA collection'))throw Error('collection not created');return 'created'});
}
await closeKnown(page);
await safe('Premium drawer has visible vertical controls',async()=>{await page.locator('#menuBtn').click({timeout:5000});await page.waitForTimeout(150);const b=await page.locator('#premiumDrawerNav a,#premiumDrawerNav button').evaluateAll(es=>es.filter(e=>getComputedStyle(e).display!=='none').map(e=>{const r=e.getBoundingClientRect();return {y:r.y,h:r.height,t:e.textContent.trim()}}));if(b.length<7)throw Error(`${b.length}`);for(let i=1;i<b.length;i++)if(b[i].y<b[i-1].y+b[i-1].h-2)throw Error(`overlap ${b[i-1].t}/${b[i].t}`);return `${b.length} controls`});
const premiumRoutes=[['#premiumSavedMenu','Saved Items'],['#premiumCompareMenu','Compare Stores'],['#premiumFiltersMenu','Smart Filters'],['#premiumRadiusMenu','Search Radius'],['#premiumHistoryMenu','Extended History'],['#premiumChallengeMenu','Premium Challenge'],['#openSettingsPremium','Premium Settings']];
for(const [sel,name] of premiumRoutes){await closeKnown(page);await page.locator('#menuBtn').click({timeout:4000});await page.waitForTimeout(90);await safe(`Premium drawer route: ${name}`,async()=>{const e=page.locator(sel).first();if(!await e.isVisible())throw Error('not visible');await e.click({timeout:4000});await page.waitForTimeout(180);return 'wired'});}
await closeKnown(page);
await safe('Price & Stock Watchlist is either active or honestly absent',async()=>{await page.locator('#menuBtn').click({timeout:4000});const e=page.locator('#premiumDrawerNav button').filter({hasText:/Price|Stock/}).first();if(!await e.count()||!await e.isVisible())return 'not advertised in drawer';if(await e.isDisabled())return 'clearly disabled/coming soon';await e.click({timeout:4000});await page.waitForTimeout(180);return 'active route wired'});await closeKnown(page);

await click(page,'#assistantFab','Open Ask FindIt');await safe('Assistant opens',()=>expectVisible(page,'#assistantPanel:not(.hidden)'));await safe('Assistant quick prompt responds',async()=>{const before=await page.locator('#assistantMessages .assistant-msg').count();await page.locator('[data-assistant-quick]').first().click();await page.waitForTimeout(5000);const after=await page.locator('#assistantMessages .assistant-msg').count();if(after<=before)throw Error(`${before}->${after}`);return `${after} messages`},{warn:true});await closeKnown(page);

const mobile=await browser.newContext({viewport:{width:390,height:844},geolocation:{latitude:-25.7479,longitude:28.2293},permissions:['geolocation']});
const mp=await mobile.newPage(),mobileErrors=[];mp.on('pageerror',e=>mobileErrors.push(String(e)));
await safe('Mobile homepage loads',async()=>{const r=await mp.goto(BASE_URL,{waitUntil:'domcontentloaded',timeout:35000});if(!r||r.status()!==200)throw Error(String(r?.status()));await mp.waitForTimeout(1400);return `HTTP ${r.status()}`});
await safe('Mobile has no horizontal overflow',async()=>{const x=await mp.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));if(x.sw>x.cw+3)throw Error(JSON.stringify(x));return JSON.stringify(x)});
await click(mp,'#menuBtn','Mobile menu opens');await safe('Mobile drawer controls vertical',async()=>{const b=await mp.locator('#drawer .drawer-nav:first-of-type > a,#drawer .drawer-nav:first-of-type > button').evaluateAll(es=>es.filter(e=>getComputedStyle(e).display!=='none').map(e=>{const r=e.getBoundingClientRect();return {y:r.y,h:r.height,w:r.width}}));for(let i=1;i<b.length;i++)if(b[i].y<b[i-1].y+b[i-1].h-2)throw Error('overlap');if(b.some(x=>x.w<250))throw Error('too narrow');return `${b.length}`});
await safe('Mobile bottom nav visible',async()=>{const n=await mp.locator('.mobile-nav button,.mobile-nav a').count();if(n<4)throw Error(`${n}`);return `${n}`});await closeKnown(mp);await click(mp,'#mobileMore','Mobile More');await safe('Mobile More opens drawer',()=>expectVisible(mp,'#drawer.open'));await closeKnown(mp);
await safe('Mobile image picker and camera controls are present',async()=>{if(!await mp.locator('#photo[accept*="image"]').count())throw Error('gallery input missing');if(!await mp.locator('#cameraPhoto[capture="environment"]').count())throw Error('camera input missing');return 'gallery + camera'});
await mobile.close();

for(const [pathName,name] of [['api/health','Health API'],['api/feedback-health','Feedback health API']])await safe(`${name} live`,async()=>{const u=new globalThis.URL(pathName,BASE_URL).href;const r=await context.request.get(u);if(!r.ok())throw Error(`HTTP ${r.status()}`);const d=await r.json();if(!d.ok)throw Error(JSON.stringify(d));return JSON.stringify(d).slice(0,180)});
await safe('Built-in FindIt QA report passes',async()=>{const r=await page.evaluate(()=>window.finditRunQA?.());if(!r)return 'built-in QA not exposed';if(!r.ok)throw Error(JSON.stringify(r));return JSON.stringify(r)});
await safe('No uncaught desktop JavaScript errors',async()=>{if(pageErrors.length)throw Error(pageErrors.join(' | '));return 'none'});
await safe('No uncaught mobile JavaScript errors',async()=>{if(mobileErrors.length)throw Error(mobileErrors.join(' | '));return 'none'});
await safe('No meaningful console errors',async()=>{const bad=consoleErrors.filter(x=>!/favicon|third-party|Failed to load resource|leaflet|tile/i.test(x));if(bad.length)throw Error(bad.slice(0,5).join(' | '));return 'none'});
await safe('No unexpected network failures',async()=>{const bad=networkFailures.filter(x=>!/tile|analytics|fonts|google|jsdelivr|unpkg/i.test(x));if(bad.length)throw Error(bad.slice(0,5).join(' | '));return 'none'});

const report={generatedAt:new Date().toISOString(),url:BASE_URL,summary:{passes:checks.filter(x=>x.status==='PASS').length,warnings:warnings.length,failures:failures.length},checks};
fs.writeFileSync(path.join(OUT,'findit-full-audit.json'),JSON.stringify(report,null,2));
fs.writeFileSync(path.join(OUT,'findit-full-audit.md'),`# FindIt Full Production Audit\n\nGenerated: ${report.generatedAt}\n\n**Passes:** ${report.summary.passes}  \n**Warnings:** ${report.summary.warnings}  \n**Failures:** ${report.summary.failures}\n\n${checks.map(x=>`- ${x.status==='PASS'?'✅':x.status==='WARN'?'⚠️':'❌'} **${x.name}**${x.detail?` — ${x.detail}`:''}`).join('\n')}\n`);
await context.close();await browser.close();console.log(`AUDIT_SUMMARY=${JSON.stringify(report.summary)}`);if(failures.length)process.exit(1);
