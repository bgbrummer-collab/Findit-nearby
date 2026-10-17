import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
test('dialog keyboard journey enters, wraps focus, closes with Escape and restores its opener',()=>{
 const handlers={},attrs={},classes=new Set();let observe;const document={activeElement:null,body:{}};const opener={isConnected:true,focus(){document.activeElement=this}};opener.focus();
 const control=()=>({disabled:false,tabIndex:0,getClientRects:()=>[{}],focus(){document.activeElement=this}}),close=control(),field=control(),send=control(),items=[close,field,send];
 const modal={setAttribute:(k,v)=>attrs[k]=v,classList:{contains:x=>classes.has(x)},querySelector:s=>s==='[autofocus]'?field:close,querySelectorAll:()=>items,contains:x=>items.includes(x),addEventListener:(k,fn)=>handlers[k]=fn};close.click=()=>{classes.add('hidden');observe()};
 const context={window:{},document,getComputedStyle:()=>({display:classes.has('hidden')?'none':'grid'}),MutationObserver:class{constructor(fn){observe=fn}observe(){}}};
 vm.runInNewContext(readFileSync(new URL('../dialog-accessibility.js',import.meta.url),'utf8'),context);context.window.finditAccessibleDialog(modal,'Search a product');assert.equal(attrs.role,'dialog');assert.equal(attrs['aria-modal'],'true');assert.equal(document.activeElement,field);
 const key=(k,shift=false)=>handlers.keydown({key:k,shiftKey:shift,preventDefault(){},stopImmediatePropagation(){}});
 close.focus();key('Tab',true);assert.equal(document.activeElement,send);key('Tab');assert.equal(document.activeElement,close);key('Escape');assert.equal(document.activeElement,opener);
});
