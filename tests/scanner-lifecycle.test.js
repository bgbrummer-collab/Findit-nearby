import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

function scanner(){
  let modal=null,resolveCamera,stops=0,plays=0,lookups=0;
  const opener={isConnected:true,focus(){document.activeElement=this}};
  const close={},field={value:'5449000000996'},find={},status={},video={async play(){plays++}};
  const section={};
  const document={readyState:'loading',activeElement:opener,addEventListener(){},body:{appendChild(e){modal=e},contains(e){return Boolean(modal)&&e===video}},createElement(){return {querySelector(s){return s==='h2'?{textContent:'Scan exact product barcode'}:s==='.fx-shop-modal'?section:close},contains(e){return e===field||e===close},remove(){modal=null}}},querySelector(s){return s==='#fxShopModal'?modal:s==='#fxBarcodeVideo'?video:s==='#fxBarcodeStatus'?status:s==='#fxBarcodeManual'?field:s==='#fxUseBarcode'?find:null}};
  const window={BarcodeDetector:class{},finditAccessibleDialog(e){assert.equal(e,section);document.activeElement=field},async finditRunProductSearch(){lookups++},finditState:{}};
  const c={window,document,navigator:{mediaDevices:{getUserMedia:()=>new Promise(r=>resolveCamera=r)}},setTimeout(){},clearTimeout(){},Intl};
  // Expose only the UI entry/close functions in this isolated test context.
  const source=readFileSync(new URL('../shopping-assistant-ui.js',import.meta.url),'utf8').replace('window.finditUseBarcode=useBarcode;','window.finditUseBarcode=useBarcode;window.openScanner=barcodeModal;window.closeScanner=closeModal;');
  vm.runInNewContext(source,c);
  return {window,document,opener,field,find,open(){window.openScanner()},resolve(){resolveCamera({getTracks:()=>[{stop(){stops++}}]})},counts:()=>({stops,plays,lookups})};
}

test('scanner puts focus inside and restores its opener on close',()=>{
  const s=scanner();s.open();assert.equal(s.document.activeElement,s.field);s.window.closeScanner();assert.equal(s.document.activeElement,s.opener);
});
test('closing while camera permission is pending stops late media without playing it',async()=>{
  const s=scanner();s.open();s.window.closeScanner();s.resolve();await new Promise(r=>setImmediate(r));assert.deepEqual(s.counts(),{stops:1,plays:0,lookups:0});
});
test('a camera request from a closed dialog cannot attach to a reopened scanner',async()=>{
  const s=scanner();s.open();const firstResolve=s.resolve; // Capture the first promise resolver before reopening.
  s.window.closeScanner();
  // Resolve first request before reopening; its continuation runs after the new dialog mounts.
  firstResolve();s.open();await new Promise(r=>setImmediate(r));assert.deepEqual(s.counts(),{stops:1,plays:0,lookups:0});
});
