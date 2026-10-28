import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

test('shopping mutations refresh the separate quick-action label and pressed state',()=>{
 const listeners=new Map(),attrs={},button={textContent:'',setAttribute:(k,v)=>attrs[k]=v};
 let list=[{key:'example item'}];
 const document={readyState:'complete',querySelector:s=>s==='#fxQuickAddShopping'?button:null,addEventListener:(n,fn)=>listeners.set(n,fn)};
 const window={finditState:{identification:{name:'Example item'}},addEventListener:()=>{}};
 const localStorage={getItem:k=>JSON.stringify(k==='findit.shoppingList.v2'?list:[])};
 vm.runInNewContext(readFileSync(new URL('../find-actions-settle.js',import.meta.url),'utf8'),{document,window,localStorage,setTimeout:fn=>fn()});
 assert.equal(button.textContent,'✓ In Shopping List');assert.equal(attrs['aria-pressed'],'true');
 list=[];listeners.get('findit:shopping-list-updated')();
 assert.equal(button.textContent,'+ Shopping List');assert.equal(attrs['aria-pressed'],'false');
 list=[{key:'example item'}];listeners.get('findit:shopping-list-updated')();
 assert.equal(button.textContent,'✓ In Shopping List');assert.equal(attrs['aria-pressed'],'true');
});
