import {chromium} from 'playwright';
const base=process.env.FINDIT_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
try{
 for(const width of [1440,390])for(const product of [
  {name:'Example A2 Headset',object:'headset',color:'Black',purpose:'Designed for listening to game audio.',strength:'Includes a detachable microphone.',compatibility:'Connects to Windows computers using USB.',field:'Care instructions',value:'Wipe with a dry cloth.'},
  {name:'Example D1 Drill Kit',object:'drill',color:'Blue',purpose:'Designed for drilling in wood.',strength:'Includes a charger and two batteries.',compatibility:'Compatible with the Example 18V battery platform.',field:'How to use',value:'Read the supplied operating manual before use.'}
 ]){
  const page=await browser.newPage({viewport:{width,height:950}}),url='https://retailer.example/products/'+product.object;
  const evidence=text=>({text,sourceUrl:url,sourceTitle:product.name});
  await page.route('**/api/**',async route=>{
   const path=new URL(route.request().url()).pathname;let body={offers:[],stores:[],researched:false};
   if(path==='/api/search')body={identification:{name:product.name,searchQuery:product.name,object:product.object,color:product.color,userConfirmed:true,requiresModelConfirmation:false}};
   if(path==='/api/product-insights')body={researched:true,whatItDoes:product.purpose,pros:[product.strength],cons:[],compatibility:[product.compatibility],includedItems:[product.strength],specifications:[{name:product.field,value:product.value,sourceUrl:url},{name:'Model',value:product.name,sourceUrl:url}],claimEvidence:{whatItDoes:evidence(product.purpose),pros:[evidence(product.strength)],compatibility:[evidence(product.compatibility)],includedItems:[evidence(product.strength)]},sources:[{title:product.name,url}],checkedAt:'2026-10-26T10:00:00Z'};
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
  });
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
  await page.getByRole('button',{name:'⌕ Search Product',exact:true}).click();
  await page.getByRole('textbox',{name:'Product name, brand + model, or barcode',exact:true}).fill(product.name);
  await page.getByRole('button',{name:'Find product information',exact:true}).click();
  const modal=page.locator('#fxInformationBody');
  await modal.getByRole('heading',{name:'Published included items',exact:true}).waitFor({state:'visible',timeout:15000});
  const text=await modal.innerText();
  for(const wanted of ['Identity and evidence','You confirmed or supplied',product.color,'manufacturer colourway',product.purpose,product.strength,product.compatibility,'Published use, care and contents',product.value,'Details to verify for this product'])if(!text.includes(wanted))throw Error(`Missing ${wanted} for ${product.name} at ${width}`);
  if(await modal.getByRole('link',{name:'Source',exact:true}).count()<5)throw Error('Individual claims lost source links');
  const overflow=await page.locator('#fxInformationModal .fx-info-card').evaluate(el=>el.scrollWidth-el.clientWidth);
  if(overflow>3)throw Error('Product information overflows on '+width);
  console.log('PRODUCT_INFORMATION_USER_PASS',width,product.name);await page.close();
 }
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:950}});
  const partial={name:'headphones',object:'headphones',brand:'',model:'',requiresModelConfirmation:true,visualHypotheses:[{name:'Example Audio A2',brand:'Example Audio',model:'A2',object:'headphones',confirmed:false,source:'single-visual-model-hypothesis'}]};
  await page.route('**/api/**',async route=>{
   const path=new URL(route.request().url()).pathname;let body={offers:[],stores:[],researched:false};
   if(path==='/api/search')body={identification:partial,code:'PHOTO_PARTIALLY_IDENTIFIED',message:'Confirm the exact model.'};
   if(path==='/api/product-insights')body={researched:false,possibleProducts:[{name:'Example Audio A2 Headset',photoMatchConfirmed:false,whatItDoes:'Designed for game audio.'}]};
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
  });
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#fxVisiblePhotoPicker').setInputFiles({name:'ui-only.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAKUlEQVR4nO3NMQEAAAjDMED5pGMCvlRA00nqs3m9AwAAAAAAAAAAgMMWvj0BwDVKG0sAAAAASUVORK5CYII=','base64')});
  await page.locator('#fxSearchNow').click();await page.locator('#fxPhotoRecovery').waitFor({state:'visible',timeout:15000});
  await page.waitForFunction(()=>window.__finditProductInfoClickFixReady===true,null,{timeout:15000});
  await page.locator('#finditExactShell button[data-fx="product"]:visible').first().click();
  await page.locator('#fxStableModal:not(.hidden)').waitFor({state:'visible',timeout:10000});
  const text=await page.locator('#fxStableBody').innerText();
  for(const wanted of ['Exact model not confirmed yet','general product-type overview only','headphones','Confirm the exact model'])if(!text.includes(wanted))throw Error('Partial identity notice lost '+wanted);
  if(text.includes('Possible product: Example Audio A2 Headset')||text.includes('Listing price:')||text.includes('750'))throw Error('Unconfirmed visual hypothesis was presented as a product listing');
  const selected=await page.evaluate(()=>window.finditState.result.identification);
  if(selected.brand||selected.model||selected.userConfirmed||!selected.requiresModelConfirmation)throw Error('A visual hypothesis became a confirmed identity');
  console.log('UNCONFIRMED_MODEL_SAFE_FALLBACK_PASS',width);await page.close();
 }
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:950}});
  const photo={name:'A42 headphones',model:'A42',object:'headphones',category:'electronics',identificationMethod:'independent-vision-consensus',userConfirmed:false,requiresModelConfirmation:true};
  await page.route('**/api/**',async route=>{
   const path=new URL(route.request().url()).pathname;let input={};try{input=route.request().postDataJSON()||{}}catch{}let body={offers:[],stores:[],researched:false};
   if(path==='/api/search')body={identification:photo};
   if(path==='/api/product-intelligence-v2'||path==='/api/product-intelligence')body={ok:true,offers:[],variantConfirmationRequired:true,possibleOffers:[{product_name:'Example A42 Headset Blue and Raspberry',price:750,currency:'ZAR',exactProductMatch:false,photoVariantConfirmed:false}]};
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
  });
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#fxVisiblePhotoPicker').setInputFiles({name:'ui-only.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAKUlEQVR4nO3NMQEAAAjDMED5pGMCvlRA00nqs3m9AwAAAAAAAAAAgMMWvj0BwDVKG0sAAAAASUVORK5CYII=','base64')});
  await page.locator('#fxSearchNow').click();await page.locator('#fxPhotoRecovery').waitFor({state:'visible',timeout:15000});
  await page.waitForFunction(()=>window.__finditProductInfoClickFixReady===true,null,{timeout:15000});
  await page.locator('#finditExactShell button[data-fx="product"]:visible').first().click();
  await page.locator('#fxStableModal:not(.hidden)').waitFor({state:'visible',timeout:10000});
  const text=await page.locator('#fxStableBody').innerText();
  if(!text.includes('Exact model not confirmed yet')||text.includes('Model listings — confirm your variant')||text.includes('Listing price:')||text.includes('750'))throw Error('Unconfirmed photo colour exposed a product listing or price');
  if(/750/.test(await page.locator('#fxBestPrice').innerText()))throw Error('Unconfirmed photo colour supplied the best price');
  const current=await page.evaluate(()=>window.finditState.result.identification);
  if(current.color||current.userConfirmed||!current.requiresModelConfirmation)throw Error('Variant uncertainty was silently promoted to the photo');
  console.log('PHOTO_VARIANT_SAFE_FALLBACK_PASS',width);await page.close();
 }
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:950}});
  const partial={name:'Example headphones',brand:'Example',object:'headphones',requiresModelConfirmation:true};
  await page.route('**/api/**',async route=>{
   const path=new URL(route.request().url()).pathname;let body={offers:[],stores:[],researched:false};
   if(path==='/api/search')body={identification:partial};
   if(path==='/api/product-insights')body={researched:false,possibleProducts:[{name:'Example A42 Headset',photoMatchConfirmed:false,whatItDoes:'Designed for listening to game audio.',price:750,currency:'ZAR'}]};
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
  });
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#fxVisiblePhotoPicker').setInputFiles({name:'ui-only.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAKUlEQVR4nO3NMQEAAAjDMED5pGMCvlRA00nqs3m9AwAAAAAAAAAAgMMWvj0BwDVKG0sAAAAASUVORK5CYII=','base64')});
  await page.locator('#fxSearchNow').click();await page.locator('#fxPhotoRecovery').waitFor({state:'visible',timeout:15000});
  await page.waitForFunction(()=>window.__finditProductInfoClickFixReady===true,null,{timeout:15000});
  await page.locator('#finditExactShell button[data-fx="product"]:visible').first().click();
  await page.locator('#fxStableModal:not(.hidden)').waitFor({state:'visible',timeout:10000});
  const text=await page.locator('#fxStableBody').innerText();
  if(!text.includes('Exact model not confirmed yet')||text.includes('Yes, this is my product')||text.includes('750')||text.includes('The latest source refresh is temporarily unavailable.'))throw Error('Unconfirmed candidate was promoted or exposed stale commerce data');
  if(!text.includes('general product-type overview only'))throw Error('Safe fallback information was missing');
  console.log('UNCONFIRMED_CANDIDATE_SAFE_FALLBACK_PASS',width);await page.close();
 }
}finally{await browser.close();}