import { chromium } from 'playwright';

const URL=process.env.FINDIT_URL||'https://findit-nearby.vercel.app/';
let failed=0,passed=0;
const pass=m=>{passed++;console.log('PASS:',m)};
const fail=(m,e='')=>{failed++;console.error('FAIL:',m,e||'')};
async function check(name,fn){try{await fn();pass(name)}catch(e){fail(name,e?.message||e)}}
async function modalHidden(page,sel){return page.locator(sel).evaluate(el=>el.classList.contains('hidden')||el.hidden||el.getAttribute('aria-hidden')==='true'||getComputedStyle(el).display==='none').catch(()=>true)}
async function closeFx(page){for(const sel of ['#fxStableModal .fx-stable-close','#fxPanelModal .fx-modal-close','#fxSettingsModal .fx-modal-close','#v10UniversalModal [data-v10-close]','#closePremium','#closeAssistant']){const x=page.locator(sel);if(await x.count()&&await x.isVisible().catch(()=>false))await x.click().catch(()=>{})}await page.keyboard.press('Escape').catch(()=>{});await page.waitForTimeout(80)}
async function stableBody(page){await page.waitForSelector('#fxStableModal:not(.hidden)',{timeout:4000});return page.locator('#fxStableBody').innerText()}

async function run(viewport,label){
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport,geolocation:{latitude:-25.7479,longitude:28.2293},permissions:['geolocation']});
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{localStorage.setItem('findit_premium_beta','1');localStorage.setItem('finditPremium','true')});
 await page.goto(URL,{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForSelector('#finditExactShell',{state:'visible',timeout:30000});
 await page.waitForTimeout(1800);
 await check(`${label} shell is visible`,async()=>{if(!await page.locator('#finditExactShell').isVisible())throw Error('dashboard hidden')});
 await check(`${label} active Premium overlay cannot block dashboard`,async()=>{if(!(await modalHidden(page,'#premiumModal')))throw Error('premiumModal is visible/intercepting')});
 await check(`${label} old journey stays hidden`,async()=>{for(const s of ['#finditJourneyV5','#finditJourney','#journeyOverlay','#journeyScreen'])if(await page.locator(s).count()&&!(await modalHidden(page,s)))throw Error(`${s} visible`)});
 await check(`${label} unique element ids`,async()=>{const d=await page.evaluate(()=>{const a=[...document.querySelectorAll('[id]')].map(x=>x.id),m=new Map();for(const id of a)m.set(id,(m.get(id)||0)+1);return [...m].filter(([,n])=>n>1)});if(d.length)throw Error(JSON.stringify(d))});
 await page.evaluate(()=>{const st=window.finditState||window.state||{};window.finditState=st;st.result={identification:{name:'Nike Air Force 1 Low',brand:'Nike',model:'Air Force 1 Low',object:'sneaker',category:'footwear',summary:'Nike Air Force 1 Low sneaker',confidence:.98,exactIdentityVerified:true,searchQuery:'Nike Air Force 1 Low',visibleText:['AIR']}};st.stores=[{name:'Nike',distanceKm:2.4,address:'Pretoria',exactProductMatch:true,branchStockVerified:false},{name:'Totalsports',distanceKm:3.1,address:'Pretoria',exactProductMatch:true,branchStockVerified:false}];st.offers=[{retailer:{name:'Nike'},price:1399.95,currency:'ZAR',verified:true,sourcePageVerified:true,product_url:'https://www.nike.com/'}];document.dispatchEvent(new CustomEvent('findit:results-rendered'));document.dispatchEvent(new CustomEvent('findit:nearby-updated'));document.dispatchEvent(new CustomEvent('findit:dashboard-sync'))});
 await page.waitForTimeout(500);
 await check(`${label} product result mirrors into dashboard`,async()=>{if(!/Nike Air Force 1 Low/i.test(await page.locator('#fxProductName').innerText()))throw Error('product not synced')});
 await check(`${label} nearby store list has no duplicate retailer rows`,async()=>{const n=await page.locator('#fxStoreList .fx-store b').allInnerTexts();if(new Set(n.map(x=>x.toLowerCase())).size!==n.length)throw Error(`duplicates: ${n.join(', ')}`)});
 await check(`${label} Product Info opens`,async()=>{await closeFx(page);await page.locator('#finditExactShell [data-fx="product"]:visible').first().click({timeout:5000});if(!/Product Information/i.test(await stableBody(page)))throw Error('wrong panel');await closeFx(page)});
 await check(`${label} Compare Prices opens`,async()=>{await closeFx(page);await page.locator('#finditExactShell [data-fx="compare"]:visible').first().click({timeout:5000});if(!/Compare Prices|Verified Deals/i.test(await stableBody(page)))throw Error('wrong panel');await closeFx(page)});
 await check(`${label} Settings responds`,async()=>{await closeFx(page);const b=page.locator('#finditExactShell [data-fx="settings"]:visible');if(!await b.count())return;await b.click({timeout:5000});await page.waitForTimeout(200);const visibleStable=await page.locator('#fxStableModal').isVisible().catch(()=>false),visibleSettings=await page.locator('#fxSettingsModal').isVisible().catch(()=>false);if(!visibleStable&&!visibleSettings)throw Error('settings did not open');await closeFx(page)});
 await check(`${label} Ask FindIt entry point responds`,async()=>{await closeFx(page);const b=page.locator('#finditExactShell [data-fx="assistant"]:visible').last();if(!await b.count())throw Error('assistant action missing');let dialogSeen=false;page.once('dialog',async d=>{dialogSeen=true;await d.dismiss()});await b.click({timeout:5000});await page.waitForTimeout(300);const visible=await page.locator('#assistantPanel:not(.hidden),#fxStableModal:not(.hidden),#v10UniversalModal:not(.hidden)').count();if(!dialogSeen&&!visible)throw Error('assistant/search entry point produced no usable UI');await closeFx(page)});
 await check(`${label} Saved navigation stores current product`,async()=>{await closeFx(page);const b=page.locator('#finditExactShell [data-fxnav="saved"]:visible').first();if(!await b.count())return;await b.click({timeout:5000});await page.waitForSelector('#fxStableModal:not(.hidden)',{timeout:4000});const save=page.locator('#fxStableSaveCurrent');if(await save.count()){await save.click({timeout:5000});const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('finditSaved')||'[]'));if(!saved.some(x=>/Nike Air Force 1 Low/i.test(x.name||'')))throw Error('save did not persist')}await closeFx(page)});
 for(const [name,sel] of [['Home','#finditExactShell [data-fxnav="home"]'],['Search','#finditExactShell [data-fxnav="search"]'],['Nearby','#finditExactShell [data-fxnav="nearby"]'],['Compare nav','#finditExactShell [data-fxnav="compare"]'],['Deals','#finditExactShell [data-fxnav="deals"]'],['History','#finditExactShell [data-fxnav="history"]'],['Alerts','#finditExactShell [data-fxnav="alerts"]'],['Feedback','#finditExactShell [data-fxnav="feedback"]']]){await check(`${label} ${name} responds without blocked click`,async()=>{await closeFx(page);const x=page.locator(`${sel}:visible`).first();if(!await x.count())return;await x.click({timeout:5000});await page.waitForTimeout(120);if(!(await modalHidden(page,'#premiumModal')))throw Error('Premium overlay reopened and blocked UI');await closeFx(page)})}
 await check(`${label} feature shortcuts are interactive`,async()=>{const cards=page.locator('.fx-feature-row article:visible');const n=Math.min(5,await cards.count());if(n<1)throw Error('feature cards missing');for(let i=0;i<n;i++){await closeFx(page);await cards.nth(i).click({timeout:5000});await page.waitForTimeout(100);if(!(await modalHidden(page,'#premiumModal')))throw Error(`feature ${i+1} triggered blocking premium modal`)}await closeFx(page)});
 await check(`${label} bottom-card buttons respond`,async()=>{const buttons=page.locator('.fx-bottom-row button:visible');const n=await buttons.count();if(n<1)throw Error('bottom actions missing');for(let i=0;i<n;i++){await closeFx(page);await buttons.nth(i).click({timeout:5000});await page.waitForTimeout(100);if(!(await modalHidden(page,'#premiumModal')))throw Error(`bottom action ${i+1} blocked by premium modal`)}await closeFx(page)});
 await check(`${label} no uncaught JS errors`,async()=>{if(errors.length)throw Error(errors.join(' | '))});
 await browser.close();
}
await run({width:1440,height:900},'desktop');
await run({width:390,height:844},'mobile');
console.log(`CURRENT_DASHBOARD_REAL_USER_RESULT ${passed} PASS / ${failed} FAIL`);
if(failed)process.exit(1);
console.log('FINDIT_CURRENT_DASHBOARD_REAL_USER_PASS');