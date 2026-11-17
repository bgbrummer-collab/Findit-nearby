import {chromium} from 'playwright';
import fs from 'node:fs';
const base=process.env.FINDIT_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
try{
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:1000}});
  const typedQueries=[];
  await page.route('**/api/**',async route=>{
   const path=new URL(route.request().url()).pathname;
   let body={offers:[],stores:[],researched:false};
   if(path==='/api/search'){
    const headers=route.request().headers();
    const raw=route.request().postData()||'';
    if(String(headers['content-type']||'').includes('application/json')){
     const input=JSON.parse(raw||'{}');typedQueries.push(input.query||'');
     body={identification:{name:input.query,searchQuery:input.query,object:'conditioner',userConfirmed:true}};
    }else{
     body={identification:{name:'Marc Anthony conditioner',brand:'Marc Anthony',object:'conditioner',color:'Yellow packaging',visibleText:['Yellow packaging'],model:'',requiresModelConfirmation:true,confidence:0.58,suggestedLabel:'Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner'},code:'PHOTO_PARTIALLY_IDENTIFIED',message:'Confirm the exact label.'};
    }
   }
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
  });
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('#photo').setInputFiles({name:'conditioner.jpg',mimeType:'image/jpeg',buffer:Buffer.from(fs.readFileSync('tests/user-images/marc-anthony.jpg.b64','utf8').trim(),'base64')});
  await page.locator('#fxSearchNow').click();
  await page.locator('#fxPhotoRecovery').waitFor({state:'visible',timeout:15000});
  await page.locator('#finditExactShell button[data-fx="product"]:visible').first().click();
  await page.locator('#fxStableModal:not(.hidden)').waitFor({state:'visible',timeout:10000});
  const text=await page.locator('#fxStableBody').innerText();
  if(!text.includes('Exact model not confirmed yet')||!text.includes('general product-type overview only'))throw Error('Partial identity was not clearly marked as unconfirmed');
  if(!text.includes('Marc Anthony')||!text.includes('conditioner')||!text.includes('Yellow packaging'))throw Error('Supported brand, product type or visible evidence was lost');
  if(!text.includes('What it does')||!text.includes('General product-type overview'))throw Error('Useful general product-type information was not shown');
  if(text.includes('Best verified online price')||text.includes('Verified online availability'))throw Error('Unconfirmed identity exposed exact-product commerce claims');
  const state=await page.evaluate(()=>({userConfirmed:window.finditState?.result?.identification?.userConfirmed,requiresModelConfirmation:window.finditState?.result?.identification?.requiresModelConfirmation}));
  if(state.userConfirmed===true||state.requiresModelConfirmation!==true)throw Error('Partial photo identity was incorrectly marked as confirmed');
  if(typedQueries.length)throw Error('An uncertain label was submitted without user confirmation');
  console.log('PARTIAL_IDENTITY_PRODUCT_INFO_PASS',width);
  await page.close();
 }
}finally{await browser.close()}