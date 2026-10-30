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
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:950}}),name='Example A42 headset Blue and Raspberry',url='https://retailer.example/products/a42-blue';
  const photo={name:'A42 headphones',model:'A42',object:'headphones',category:'electronics',identificationMethod:'independent-vision-consensus',userConfirmed:false};
  const exact={product_name:name,product_url:url,retailer:{name:'Example Shop'},price:750,currency:'ZAR',availability:'in_stock',sourcePageVerified:true,exactProductMatch:true,verified:true,branchStockVerified:false};
  await page.route('**/api/**',async route=>{
   const path=new URL(route.request().url()).pathname;let input={};try{input=route.request().postDataJSON()||{};}catch{}let body={offers:[],stores:[],researched:false};
   if(path==='/api/search')body={identification:input.query?{...photo,name:input.query,searchQuery:input.query,color:'Blue and Raspberry',userConfirmed:true,identificationMethod:'typed-user-input'}:photo};
   if(path==='/api/product-intelligence-v2'||path==='/api/product-intelligence')body=(input.identification||input).userConfirmed?{ok:true,offers:[exact]}:{ok:true,offers:[],variantConfirmationRequired:true,possibleOffers:[{...exact,exactProductMatch:false,photoVariantConfirmed:false}]};
   if(path==='/api/product-insights')body={researched:true,whatItDoes:'Designed for listening to audio.',pros:[],cons:[],sources:[{title:name,url}]};
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
  });
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#fxVisiblePhotoPicker').setInputFiles({name:'ui-only.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAKUlEQVR4nO3NMQEAAAjDMED5pGMCvlRA00nqs3m9AwAAAAAAAAAAgMMWvj0BwDVKG0sAAAAASUVORK5CYII=','base64')});
  await page.locator('#fxSearchNow').click();await page.waitForFunction(()=>window.finditState?.result?.identification?.model==='A42');await page.getByRole('button',{name:'ⓘ Product Info',exact:true}).click();
  await page.getByRole('heading',{name:'Model listings — confirm your variant',exact:true}).waitFor({state:'visible',timeout:20000});
  const text=await page.locator('#fxInformationBody').innerText();if(!text.includes(name)||!text.includes('Listing price:')||!text.includes('not used for your best price'))throw Error('Variant review lost its useful listing evidence');
  if(/750/.test(await page.locator('#fxBestPrice').innerText()))throw Error('Unconfirmed photo colour supplied the best price');
  if(await page.locator('#fxInformationModal .fx-info-card').evaluate(el=>el.scrollWidth-el.clientWidth)>3)throw Error('Variant review overflows at '+width);
  const current=await page.evaluate(()=>window.finditState.result.identification);if(current.color||current.userConfirmed)throw Error('Listing colour was silently promoted to the photo');
  await page.getByRole('button',{name:'Check this variant',exact:true}).click();
  // Filling through the visible form is deliberate user confirmation; no request
  // may be sent merely by opening the review form.
  const before=await page.evaluate(()=>window.finditState.result.identification.userConfirmed);if(before)throw Error('Opening variant review confirmed it automatically');
  await page.getByRole('textbox',{name:'Product name, brand + model, or barcode',exact:true}).fill(name);
  await page.getByRole('button',{name:'Find product information',exact:true}).click();
  await page.waitForFunction(()=>window.finditState?.result?.identification?.userConfirmed===true);
  console.log('PHOTO_VARIANT_REVIEW_USER_PASS',width);await page.close();
 }
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:950}}),name='Example A42 Headset',url='https://retailer.example/products/a42';
  const partial={name:'Example headphones',brand:'Example',object:'headphones',requiresModelConfirmation:true};
  const candidate={name,identity:{name,brand:'Example',object:'headphones'},photoMatchConfirmed:false,researched:true,checkedAt:new Date().toISOString(),whatItDoes:'Designed for listening to game audio.',pros:['Adjustable headband.'],cons:[],sources:[{title:name,url}],price:750,currency:'ZAR'};
  await page.route('**/api/**',async route=>{
   const path=new URL(route.request().url()).pathname;let input={};try{input=route.request().postDataJSON()||{};}catch{}
   if(path==='/api/search')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({identification:input.query?{name,searchQuery:name,brand:'Example',object:'headphones',userConfirmed:true}:partial})});
   if(path==='/api/product-insights'&&input.identification?.requiresModelConfirmation)return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({researched:false,possibleProducts:[candidate]})});
   if(path==='/api/product-insights'||path==='/api/product-intelligence-v2'||path==='/api/product-intelligence')return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Source temporarily unavailable'})});
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({offers:[],stores:[]})});
  });
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#fxVisiblePhotoPicker').setInputFiles({name:'ui-only.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAKUlEQVR4nO3NMQEAAAjDMED5pGMCvlRA00nqs3m9AwAAAAAAAAAAgMMWvj0BwDVKG0sAAAAASUVORK5CYII=','base64')});
  await page.locator('#fxSearchNow').click();await page.locator('#fxPhotoRecovery').waitFor({state:'visible',timeout:15000});await page.getByRole('button',{name:'ⓘ Product Info',exact:true}).click();
  await page.getByRole('button',{name:'Yes, this is my product',exact:true}).click();
  await page.getByText('The latest source refresh is temporarily unavailable.',{exact:false}).waitFor({state:'visible',timeout:20000});
  const text=await page.locator('#fxInformationBody').innerText();if(!text.includes(candidate.whatItDoes)||!text.includes('Prices and stock still need a fresh check'))throw Error('Confirmation discarded checked facts or hid the failed refresh');
  if(/750/.test(text)||/750/.test(await page.locator('#fxBestPrice').innerText()))throw Error('Candidate price became a verified price after a failed refresh');
  console.log('CONFIRMED_CANDIDATE_SOURCE_RECOVERY_PASS',width);await page.close();
 }
}finally{await browser.close();}
