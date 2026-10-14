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
   return{viewport:innerWidth,scroll:document.documentElement.scrollWidth,main:rect('#finditExactShell>.fx-main'),side:rect('#finditExactShell>.fx-side'),finder:rect('#finditExactShell .fx-search-card'),cards:Array.from(document.querySelectorAll('#finditExactShell .fx-feature-row article')).map(e=>({width:e.getBoundingClientRect().width,textWidth:e.querySelector('div')?.getBoundingClientRect().width||0,visible:e.getClientRects().length>0}))};
  });
  assert.ok(geometry.scroll<=geometry.viewport+4,`${width}: horizontal overflow ${JSON.stringify(geometry)}`);
  assert.ok(geometry.main.right<=geometry.viewport+4,`${width}: main panel is clipped`);
  if(width>900){assert.ok(Math.abs(geometry.main.x-geometry.side.right-10)<=3,`${width}: empty column before main panel`);assert.ok(geometry.finder.width>=geometry.main.width-70,`${width}: finder is squeezed into a narrow column`);}
  assert.ok(geometry.cards.length>=6,`${width}: a feature disappeared`);
  assert.ok(geometry.cards.every(c=>c.visible&&c.width>=110&&c.textWidth>=55),`${width}: unreadable feature cards ${JSON.stringify(geometry.cards)}`);
  if(process.env.LAYOUT_SCREENSHOTS){await fs.mkdir(process.env.LAYOUT_SCREENSHOTS,{recursive:true});await page.screenshot({path:`${process.env.LAYOUT_SCREENSHOTS}/layout-${width}.png`});}
  console.log('DASHBOARD_LAYOUT_PASS',width,JSON.stringify(geometry));await page.close();
 }
}finally{await browser.close();}
