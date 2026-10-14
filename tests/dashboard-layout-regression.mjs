import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.FINDIT_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,768,901,1024,1180,1273,1440,1920]){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.goto(base,{waitUntil:'networkidle',timeout:60000});
  await page.waitForSelector('#fxSmartChoice',{state:'visible'});
  const geometry=await page.evaluate(()=>{
   const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return{x:r.x,right:r.right,width:r.width};};
   return{build:document.querySelector('meta[name="findit-build"]')?.content,styles:Array.from(document.styleSheets).map(s=>({href:s.href,tail:(()=>{try{return Array.from(s.cssRules).slice(-2).map(r=>r.cssText).join(' ').slice(0,350)}catch{return 'unreadable'}})()})),viewport:innerWidth,scroll:document.documentElement.scrollWidth,main:rect('#finditExactShell>.fx-main'),side:rect('#finditExactShell>.fx-side'),finder:rect('#finditExactShell .fx-search-card'),badgesClear:Array.from(document.querySelectorAll('#finditExactShell .fx-feature-row article')).every(e=>{const badge=e.querySelector('.fx-plan-lock'),title=e.querySelector('b');if(!badge||!title)return true;const a=badge.getBoundingClientRect(),b=title.getBoundingClientRect();return a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top;}),cards:Array.from(document.querySelectorAll('#finditExactShell .fx-feature-row article')).map(e=>({width:e.getBoundingClientRect().width,textWidth:e.querySelector('div')?.getBoundingClientRect().width||0,visible:e.getClientRects().length>0,inline:e.getAttribute('style'),display:getComputedStyle(e).display}))};
  });
  if(process.env.FINDIT_EXPECTED_COMMIT)assert.equal(geometry.build,process.env.FINDIT_EXPECTED_COMMIT,'Frontend assets must come from this deployment');
  assert.ok(geometry.scroll<=geometry.viewport+4,`${width}: horizontal overflow ${JSON.stringify(geometry)}`);
  assert.ok(geometry.main.right<=geometry.viewport+4,`${width}: main panel is clipped`);
  if(width>900){assert.ok(Math.abs(geometry.main.x-geometry.side.right-10)<=3,`${width}: empty column before main panel`);assert.ok(geometry.finder.width>=geometry.main.width-70,`${width}: finder is squeezed into a narrow column`);}
  assert.ok(geometry.badgesClear,`${width}: Premium badge obscures a feature name`);
  assert.ok(geometry.cards.length>=6,`${width}: a feature disappeared`);
  assert.ok(geometry.cards.every(c=>c.visible&&c.width>=110&&c.textWidth>=55),`${width}: unreadable feature cards ${JSON.stringify(geometry.cards)}`);
  if(process.env.LAYOUT_SCREENSHOTS){await fs.mkdir(process.env.LAYOUT_SCREENSHOTS,{recursive:true});await page.screenshot({path:`${process.env.LAYOUT_SCREENSHOTS}/layout-${width}.png`});}
  console.log('DASHBOARD_LAYOUT_PASS',width,JSON.stringify(geometry));await page.close();
 }
}finally{await browser.close();}
