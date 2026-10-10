import {chromium} from 'playwright';
import fs from 'node:fs';
const base=process.env.FINDIT_URL||'http://127.0.0.1:4173/';
const label='Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner';
const browser=await chromium.launch({headless:true});
try{
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:1000}});const confirmed=[];
  await page.route('**/api/**',async route=>{
   const path=new URL(route.request().url()).pathname;let body={offers:[],stores:[],researched:false};
   if(path==='/api/search'){
    const raw=route.request().postData()||'';
    if(raw.startsWith('{')){const input=JSON.parse(raw);confirmed.push(input.query);body={identification:{name:input.query,searchQuery:input.query,object:'conditioner',userConfirmed:true}};}
    else body={identification:{name:'Marc Anthony conditioner',brand:'Marc Anthony',object:'conditioner',model:'',requiresModelConfirmation:true,suggestedLabel:label},code:'PHOTO_PARTIALLY_IDENTIFIED',message:'Confirm the exact label.'};
   }
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
  });
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('#photo').setInputFiles({name:'conditioner.jpg',mimeType:'image/jpeg',buffer:Buffer.from(fs.readFileSync('tests/user-images/marc-anthony.jpg.b64','utf8').trim(),'base64')});
  await page.locator('#fxSearchNow').click();
  await page.locator('#fxPhotoRecovery').waitFor({state:'visible',timeout:15000});
  await page.locator('#finditExactShell [data-fx="product"]:visible').first().click();
  await page.locator('#fxConfirmModel').waitFor({state:'visible'});
  const text=await page.locator('#fxInformationBody').innerText();
  if(!text.includes('Possible label reading:')||!text.includes(label)||!text.includes('not confirmed'))throw Error('Suggested label was not explicitly marked uncertain');
  if(!text.includes('What this product type does')||!text.includes('General product-type overview'))throw Error('Partial identification lost its truthful product-type information');
  if(confirmed.length)throw Error('An uncertain reading was submitted without user confirmation');
  await page.locator('#fxConfirmModel').click();
  if(await page.locator('#fxRealQuery').inputValue()!==label)throw Error('Label confirmation dropped the available reading');
  await page.locator('#fxRealQuery').fill(label+' 250ml');
  await page.getByRole('button',{name:'Find product information',exact:true}).click();
  await page.waitForFunction(()=>window.finditState?.result?.identification?.userConfirmed===true,{timeout:15000});
  if(confirmed.length!==1||confirmed[0]!==label+' 250ml')throw Error('Human correction did not reach product search exactly once');
  console.log('LABEL_CONFIRMATION_PASS',width);await page.close();
 }
}finally{await browser.close();}
