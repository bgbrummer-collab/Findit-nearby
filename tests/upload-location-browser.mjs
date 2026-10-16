import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.FINDIT_URL||'https://findit-nearby.bgbrummer.workers.dev/';
const bytes=Buffer.from((await fs.readFile(new URL('./user-images/nike.jpg.b64',import.meta.url),'utf8')).trim(),'base64');
const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'networkidle'});
  if(process.env.FINDIT_EXPECTED_COMMIT)assert.equal(await page.locator('meta[name="findit-build"]').getAttribute('content'),process.env.FINDIT_EXPECTED_COMMIT);
  await page.locator('#finditManualLocation summary').click();
  await page.getByLabel('Latitude',{exact:true}).fill('-25.7479');await page.getByLabel('Longitude',{exact:true}).fill('28.2293');
  await page.getByRole('button',{name:'Use selected location',exact:true}).click();
  assert.match(await page.locator('#fxStatus').innerText(),/-25.7479, 28.2293/);
  await page.getByLabel('Latitude',{exact:true}).fill('91');await page.getByRole('button',{name:'Use selected location',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.finditState.coords.lat),-25.7479,'Invalid latitude replaced the selected location');
  const geometry=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth,form:document.querySelector('#finditLocationForm').getBoundingClientRect().right}));
  assert.ok(geometry.scroll<=width+4&&geometry.form<=width+4,'Manual form overflows at '+width);
  await page.locator('#finditManualLocation summary').click();
  await page.locator('#fxVisiblePhotoPicker').setInputFiles({name:'not-a-photo.txt',mimeType:'text/plain',buffer:Buffer.from('invalid')});
  assert.match(await page.locator('#fxStatus').innerText(),/choose an image file/i);assert.equal(await page.evaluate(()=>window.finditState.file),null);
  for(const input of ['#fxVisiblePhotoPicker','#cameraPhoto']){
   await page.locator(input).setInputFiles({name:'original-shoe.jpg',mimeType:'image/jpeg',buffer:bytes});
   assert.equal(await page.evaluate(()=>window.finditState.file?.name),'original-shoe.jpg');
   await page.locator(input).setInputFiles({name:'too-large.jpg',mimeType:'image/jpeg',buffer:Buffer.alloc(8*1024*1024+1)});
   assert.match(await page.locator('#fxStatus').innerText(),/smaller than 8 MB/);
   assert.equal(await page.evaluate(()=>window.finditState.file?.name),'original-shoe.jpg','Invalid file replaced valid photo');
  }
  await page.locator('.fx-drop').evaluate((target,base64)=>{
   const binary=atob(base64),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0)),dataTransfer=new DataTransfer();
   dataTransfer.items.add(new File([bytes],'dropped-original-shoe.jpg',{type:'image/jpeg'}));
   target.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer}));
  },bytes.toString('base64'));
  assert.equal(await page.evaluate(()=>window.finditState.file?.name),'dropped-original-shoe.jpg');
  assert.equal(await page.locator('#fxSearchNow').isEnabled(),true);assert.deepEqual(errors,[]);
  console.log('UPLOAD_LOCATION_BROWSER_PASS',JSON.stringify({width,manualCoordinates:true,invalidCoordinateRejected:true,invalidUploadRejected:true,oversizeUploadRejected:true,galleryTransport:true,cameraInputTransport:true,dropEventTransport:true,physicalCamera:false}));
  await page.close();
 }
}finally{await browser.close();}
