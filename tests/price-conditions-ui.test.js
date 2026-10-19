import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
for(const file of ['ui-cleanup.js','dashboard-audit-controls.js'])test(file+' keeps source price conditions beside the listing and escapes markup',()=>{
 const s=readFileSync(new URL('../'+file,import.meta.url),'utf8'),start=s.indexOf('function offerRow('),end=s.indexOf('\nfunction ',start+1);let fn=s.slice(start,end<0?undefined:end);
 if(file==='ui-cleanup.js')fn=s.slice(start,s.indexOf('\n  function ',start+1));
 const context={retailer:()=> 'Example',esc:v=>String(v).replaceAll('<','&lt;').replaceAll('>','&gt;'),state:()=>({}),st:()=>({}),stock:()=> 'In stock online',money:()=> 'R75',validUrl:()=>true};
 const render=vm.runInNewContext(fn+';offerRow',context),html=render({product_name:'Example cream',product_url:'https://retailer.example/cream',price:75,currency:'ZAR',priceConditions:'Price excludes dispensing fee. <script>bad</script>'});
 assert.match(html,/excludes dispensing fee/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.match(html,/View product/);
});
