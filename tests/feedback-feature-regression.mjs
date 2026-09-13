import { chromium } from 'playwright';

const URL=process.env.FINDIT_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
page.setDefaultTimeout(30000);
const posts=[];
await page.route('**/api/feedback',async route=>{
  const req=route.request();
  let body={};
  try{body=JSON.parse(req.postData()||'{}')}catch{}
  posts.push(body);
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,delivered:true,destination:'test'})});
});
function fail(msg){throw new Error(msg)}
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#finditExactShell',{state:'visible'});
await page.waitForFunction(()=>typeof window.finditOpenFeedback==='function'&&typeof window.finditOpenFeatureSuggestion==='function',null,{timeout:30000});

const feedbackNav=page.locator('#finditExactShell [data-fxnav="feedback"]');
if(!await feedbackNav.isVisible())fail('Feedback dashboard option is not visible');
await feedbackNav.click();
await page.waitForSelector('#fxFeedbackModal:not(.hidden)',{state:'visible'});
await page.fill('#fxFeedbackMessage','The nearby results are useful, but this is a feedback test.');
await page.selectOption('#fxFeedbackRating','4');
await page.locator('#fxFeedbackForm button[type="submit"]').click();
await page.waitForFunction(()=>/Feedback sent/i.test(document.querySelector('#fxFeedbackStatus')?.textContent||''));
if(posts.length<1)fail('Feedback form did not call the feedback endpoint');
if(posts[0]?.topic!=='general')fail(`Feedback used wrong topic: ${posts[0]?.topic}`);
if(!/nearby results are useful/i.test(posts[0]?.message||''))fail('Feedback message was not delivered');
console.log('FEEDBACK_PASS');

await page.locator('#fxFeedbackModal .fx-stable-close').click();
await page.waitForSelector('#fxFeedbackModal',{state:'hidden'});
const suggestNav=page.locator('#finditExactShell [data-fx="suggest-feature"]').first();
if(!await suggestNav.isVisible())fail('Suggest a Feature dashboard option is not visible');
await suggestNav.click();
await page.waitForSelector('#fxFeatureSuggestionModal:not(.hidden)',{state:'visible'});
await page.fill('#fxFeatureTitle','Store opening-hours filter');
await page.fill('#fxFeatureDetails','Let me only show nearby stores that are open when I want to go shopping.');
await page.selectOption('#fxFeatureRating','5');
await page.locator('#fxFeatureSuggestionForm button[type="submit"]').click();
await page.waitForFunction(()=>/Feature suggestion sent/i.test(document.querySelector('#fxFeatureStatus')?.textContent||''));
if(posts.length<2)fail('Feature suggestion did not call the feedback endpoint');
const idea=posts.at(-1);
if(idea?.topic!=='idea')fail(`Feature suggestion used wrong topic: ${idea?.topic}`);
if(!/Store opening-hours filter/i.test(idea?.message||'')||!/only show nearby stores/i.test(idea?.message||''))fail('Feature suggestion title/details were not delivered');
console.log('FEATURE_SUGGESTION_PASS');

await page.setViewportSize({width:390,height:844});
await page.waitForTimeout(100);
const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
if(overflow>4)fail(`Feedback feature caused mobile horizontal overflow: ${overflow}px`);
console.log('FEEDBACK_FEATURE_REGRESSION_PASS',JSON.stringify({url:URL,posts:posts.length}));
await browser.close();
