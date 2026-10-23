import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
for(const file of ['dashboard-commerce-status.js','local-market-commerce-fix.js'])test(file+' labels online prices on physical branch cards explicitly',()=>{
 const source=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),name=file.startsWith('dashboard')?'sync':'syncNearby',start=source.indexOf('function '+name+'(){'),end=source.indexOf('\nfunction ',start+1);
 const right={textContent:'→'},em={textContent:'',classList:{toggle(){},remove(){}}},row={dataset:{}};
 const offer={price:230,currency:'ZAR',availability:'in_stock'},map=new Map([['clicks menlyn park',offer]]),list={appendChild(){}};
 const context={ensureIdentityScope(){},persistOffers(){},offers:()=>map,offerMap:()=>map,inSouthAfrica:()=>true,findOfferForName:()=>offer,stock:()=> 'Online in stock',stockText:()=> 'Online in stock',money:()=> 'R230',clean:v=>String(v||''),positive:()=>true,key:v=>v.toLowerCase(),sanitizeModal(){},$: (s,r)=>r===row?(s==='b'?{textContent:'Clicks Menlyn Park'}:s==='em'?em:right):s==='#fxStoreList'?list:null,$$:s=>s==='#fxStoreList .fx-store'?[row]:[]};
 if(file.startsWith('local'))context.$$=(s,r)=>r===list?[row]:[];
 vm.runInNewContext(source.slice(start,end)+';'+name+'()',context);assert.equal(right.textContent,'Online R230 ›');assert.match(em.textContent,/Branch stock not published/);
});
