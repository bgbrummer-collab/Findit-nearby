import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import{readFileSync}from'node:fs';
test('legacy Premium dialogs move outside the nearly transparent legacy page before opening',()=>{
 const source=readFileSync(new URL('../script.js',import.meta.url),'utf8'),line=source.split('\n').find(x=>x.startsWith('function v10Open('));const content={},close={setAttribute(k,v){this[k]=v}},modal={parentElement:{id:'home'},classList:{remove(n){assert.equal(n,'hidden')}},removeAttribute(){}},body={appendChild(el){el.parentElement=this}};let named;
 const ctx={document:{body,getElementById:id=>({v10UniversalModal:modal,v10ModalBody:content,v10CloseModal:close}[id])},window:{finditAccessibleDialog:(el,title)=>{assert.equal(el.parentElement,body);named=title}},esc:x=>x};vm.runInNewContext(line+';v10Open("Collections","<p>1 item</p>")',ctx);assert.equal(modal.parentElement,body);assert.equal(named,'Collections');assert.equal(close['aria-label'],'Close');assert.match(content.innerHTML,/1 item/);
});

test('collections show their saved products and adding the same Find twice does not duplicate it',()=>{
 const source=readFileSync(new URL('../script.js',import.meta.url),'utf8'),start=source.indexOf('function v10Collections(){'),end=source.indexOf('function v10Watchlist(){',start);let saved=[{name:'Test',items:[]}],markup='';const add={},create={},input={value:''};const current={name:'Example <item>',query:'Example item'};
 const ctx={V10KEYS:{collections:'collections'},v10Read:()=>JSON.parse(JSON.stringify(saved)),v10Write:(key,value)=>{saved=JSON.parse(JSON.stringify(value))},v10Current:()=>current,v10Open:(title,html)=>{markup=html},esc:x=>String(x).replaceAll('<','&lt;').replaceAll('>','&gt;'),document:{getElementById:id=>id==='v10AddCollection'?create:input,querySelectorAll:()=>[Object.assign(add,{dataset:{colAdd:'0'}})]}};
 vm.runInNewContext(source.slice(start,end)+';this.open=v10Collections;',ctx);ctx.open();add.onclick();assert.equal(saved[0].items.length,1);assert.match(markup,/Example &lt;item&gt;/);assert.match(markup,/1 item</);add.onclick();assert.equal(saved[0].items.length,1);current.query='';ctx.open();assert.match(markup,/data-col-add="0" disabled/);
});

test('History+ reopens the selected stored query inside FindIt and supports filtering and removal',()=>{
 const source=readFileSync(new URL('../script.js',import.meta.url),'utf8'),start=source.indexOf('function v10History(){'),end=source.indexOf('function v10Share(){',start);let records=[{name:'Example headphones',query:'Example X1 headphones'},{name:'Example drill',query:'Example D2 drill'}],opened,closed=0;const input={value:''},rows={},reopen={dataset:{historyReopen:records[0].query}},remove={dataset:{historyRemove:records[0].query}};
 const ctx={localStorage:{getItem:()=>JSON.stringify(records),setItem:(k,v)=>{records=JSON.parse(v)}},v10Open(){},v10Close(){closed++},window:{finditRunProductSearch:q=>{opened=q}},esc:x=>String(x),document:{getElementById:id=>id==='v10HistorySearch'?input:rows,querySelectorAll:s=>s==='[data-history-reopen]'?[reopen]:[remove]}};
 vm.runInNewContext(source.slice(start,end)+';v10History();',ctx);assert.doesNotMatch(rows.innerHTML,/google.com/);reopen.onclick();assert.equal(opened,'Example X1 headphones');assert.equal(closed,1);input.value='drill';input.oninput();assert.match(rows.innerHTML,/Example drill/);assert.doesNotMatch(rows.innerHTML,/Example headphones/);remove.onclick();assert.equal(records.length,1);assert.equal(records[0].query,'Example D2 drill');
});

test('Premium workspace navigation is installed eagerly and loader does not install a second copy',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.match(html,/<script[^>]*src="big-clean-fix\.js"[^>]*data-findit-big-clean="1"[^>]*defer/);const loader=readFileSync(new URL('../dashboard-runtime-stable.js',import.meta.url),'utf8');assert.match(loader,/script\[data-findit-big-clean\]/);
});

test('Premium saved-item counts include collection contents without counting collection headings or duplicates',()=>{
 const source=readFileSync(new URL('../script.js',import.meta.url),'utf8'),start=source.indexOf('function getPremiumSaved(){'),end=source.indexOf('function premiumHistoryLimit()',start),values={finditSaved:[{name:'Paper',query:'Paper'}],findit_favourites:[{item:'Paper'}],findit_v10_collections:[{name:'Collection heading',items:[{name:'Conditioner',query:'Conditioner'}]}]};const c={localStorage:{getItem:key=>JSON.stringify(values[key]||[])}};vm.runInNewContext(source.slice(start,end)+';this.items=getPremiumSaved();',c);assert.equal(c.items.length,2);assert.ok(c.items.some(x=>x.name==='Conditioner'));assert.ok(!c.items.some(x=>x.name==='Collection heading'));
});
