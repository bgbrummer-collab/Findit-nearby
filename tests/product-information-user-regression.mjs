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
}finally{await browser.close();}
