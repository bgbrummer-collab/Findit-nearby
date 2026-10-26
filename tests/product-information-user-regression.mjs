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
  const page=await browser.newPage({viewport:{width,height:950}}),name='Example Audio A2 Headset',source='https://retailer.example/products/a2';
  const i={name:'headphones',object:'headphones',brand:'',model:'',requiresModelConfirmation:true,visualHypotheses:[{name:'Example Audio A2',brand:'Example Audio',model:'A2',object:'headphones',confirmed:false,source:'single-visual-model-hypothesis'}]};
  await page.route('**/api/**',async route=>{
   const path=new URL(route.request().url()).pathname;let body={offers:[],stores:[],researched:false};
   if(path==='/api/search')body={identification:i,code:'PHOTO_PARTIALLY_IDENTIFIED',message:'Confirm the exact model.'};
   if(path==='/api/product-insights')body={researched:false,possibleProducts:[{name,productUrl:source,photoMatchConfirmed:false,whatItDoes:'Designed for game audio.',hypothesisNote:'Its brand and model are not independently confirmed in your photo.'}]};
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
  });
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#fxVisiblePhotoPicker').setInputFiles({name:'ui-only.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAKUlEQVR4nO3NMQEAAAjDMED5pGMCvlRA00nqs3m9AwAAAAAAAAAAgMMWvj0BwDVKG0sAAAAASUVORK5CYII=','base64')});
  await page.locator('#fxSearchNow').click();await page.locator('#fxPhotoRecovery').waitFor({state:'visible',timeout:15000});
  await page.getByRole('button',{name:'ⓘ Product Info',exact:true}).click();
  await page.getByRole('heading',{name:'Possible product: '+name,exact:true}).waitFor({state:'visible',timeout:15000});
  const text=await page.locator('#fxInformationBody').innerText();
  for(const wanted of ['Possible model from the photo','One image reader suggested','not independently confirmed','Designed for game audio.','brand is not confirmed'])if(!text.includes(wanted))throw Error('Uncertain model lost '+wanted);
  const selected=await page.evaluate(()=>window.finditState.result.identification);
  if(selected.brand||selected.model||!selected.requiresModelConfirmation)throw Error('A suggestion became a confirmed identity');
  console.log('UNCONFIRMED_MODEL_INFORMATION_USER_PASS',width);await page.close();
 }
}finally{await browser.close();}
