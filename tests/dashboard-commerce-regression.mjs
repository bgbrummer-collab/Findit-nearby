const BASE = process.env.BASE_URL || 'https://findit-nearby.vercel.app';
const failures=[];
const notes=[];
const ok=(condition,message)=>{if(condition) console.log('PASS',message); else {console.error('FAIL',message);failures.push(message)}};
const timed=async(label,fn,limitMs=45000)=>{const started=Date.now();const out=await fn();const ms=Date.now()-started;ok(ms<limitMs,`${label} finishes without hanging (${ms}ms)`);return out};
const get=async(path)=>{let last;for(let attempt=0;attempt<4;attempt++){try{const r=await fetch(BASE+path,{headers:{accept:'application/json,text/plain,*/*'},cache:'no-store'});if(r.status<500)return r;last=new Error(`${path} ${r.status}`)}catch(e){last=e}await new Promise(r=>setTimeout(r,2500*(attempt+1)))}throw last};
const post=async(path,body)=>{let last;for(let attempt=0;attempt<3;attempt++){try{const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),50000);const r=await fetch(BASE+path,{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},body:JSON.stringify(body),signal:ctl.signal,cache:'no-store'});clearTimeout(timer);if(r.status<500)return r;last=new Error(`${path} ${r.status}`)}catch(e){last=e}await new Promise(r=>setTimeout(r,3000*(attempt+1)))}throw last};
const textOf=o=>`${o?.product_name||o?.title||''} ${o?.product_url||o?.url||''}`.toLowerCase();
const genericPage=o=>{try{const p=new URL(o?.product_url||o?.url||'').pathname.toLowerCase();return /\/(search|category|categories|collections?|brands?|browse)(\/|$)/.test(p)||/\/shop\/c\//.test(p)}catch{return true}};
const priceValid=o=>o?.price==null||(Number.isFinite(Number(o.price))&&Number(o.price)>0);

try{
  const home=await get('/'); const html=await home.text();
  ok(home.status===200,'Production homepage loads');
  for(const asset of ['product-info-enhance.js','redesign-v4.js','findit-core-reliability.js']) ok(html.includes(asset),`Homepage loads ${asset}`);

  const assets=['/product-info-enhance.js','/product-info-click-fix.js','/commerce-ui-v4.js','/commerce-exactness-guard.js','/dashboard-audit-controls.js','/dashboard-runtime-v8.js'];
  const loaded={};
  for(const asset of assets){const r=await get(asset);loaded[asset]=await r.text();ok(r.status===200,`${asset} loads`)}
  const loader=loaded['/product-info-enhance.js']||'';
  ok(loader.includes('commerce-exactness-guard.js'),'Exactness guard is loaded');
  ok(loader.includes('dashboard-audit-controls.js'),'Dashboard audit controls are loaded');
  const compareJs=loaded['/commerce-ui-v4.js']||'';
  ok(compareJs.includes('AbortController'),'Compare Prices has request cancellation/timeout protection');
  ok(!/characterData\s*:\s*true/.test(compareJs),'Compare Prices does not observe its own text mutations');
  const controls=loaded['/dashboard-audit-controls.js']||'';
  for(const action of ['home','search','nearby','compare','deals','saved','history','alerts','feedback']) ok(controls.includes(`'${action}'`)||controls.includes(`===\"${action}\"`)||controls.includes(`=== '${action}'`),`Dashboard ${action} action is wired`);

  const insights=await timed('Product Information research',async()=>{
    const r=await get('/api/product-insights?name=Logitech%20G%20Pro%20Gaming%20Headset&brand=Logitech&model=G%20Pro&category=electronics&searchQuery=Logitech%20G%20Pro%20gaming%20headset');
    const d=await r.json().catch(()=>({})); return {r,d};
  },35000);
  ok(insights.r.status===200&&insights.d.researched===true,'Product Information research succeeds for Logitech G Pro headset');
  const researchText=JSON.stringify(insights.d).toLowerCase();
  ok(/headset|headphones/.test(researchText),'Product research stays about the headset product type');
  ok(!/gaming mouse with esports grade performance/.test(researchText),'Product research does not substitute the G Pro mouse');
  for(const field of ['whatItDoes','bestFor','standOut','valueVerdict']) ok(Boolean(insights.d[field]),`Product Information includes ${field}`);
  ok(Array.isArray(insights.d.pros)&&insights.d.pros.length>=2,'Product Information has useful pros');

  const commerceCases=[
    {label:'headset',body:{name:'Logitech G Pro Gaming Headset',brand:'Logitech',model:'G Pro',object:'gaming headset',category:'electronics',retailCategory:'electronics',searchQuery:'Logitech G Pro gaming headset'},reject:[/\bmouse\b/,/\bkeyboard\b/]},
    {label:'headphones',body:{name:'Sony WH-1000XM5 headphones',brand:'Sony',model:'WH-1000XM5',object:'headphones',category:'electronics',retailCategory:'electronics',searchQuery:'Sony WH-1000XM5 headphones'},reject:[/\bmouse\b/,/\bkeyboard\b/]},
    {label:'footwear',body:{name:'Nike Air Force 1',brand:'Nike',model:'Air Force 1',object:'shoe',category:'footwear',retailCategory:'footwear',searchQuery:'Nike Air Force 1'},reject:[/headphones?/,/conditioner/]},
    {label:'conditioner',body:{name:'Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml',brand:'Marc Anthony',model:'Strictly Curls 3X Moisture Triple Blend Conditioner 250ml',object:'hair conditioner',category:'beauty',retailCategory:'beauty',searchQuery:'Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml'},reject:[/\bshampoo\b(?!.*conditioner)/]},
    {label:'hardware',body:{name:'Bosch GSB 185-LI cordless drill',brand:'Bosch',model:'GSB 185-LI',object:'cordless drill',category:'hardware',retailCategory:'hardware',searchQuery:'Bosch GSB 185-LI cordless drill'},reject:[/headphones?/,/conditioner/]}
  ];
  for(const t of commerceCases){
    const {r,d}=await timed(`${t.label} commerce search`,async()=>{const r=await post('/api/product-intelligence-v2',t.body);return {r,d:await r.json().catch(()=>({}))}},50000);
    ok(r.status===200&&d.ok===true,`${t.label}: commerce API succeeds`);
    const offers=Array.isArray(d.offers)?d.offers:[];
    ok(offers.every(priceValid),`${t.label}: no invalid numeric prices`);
    ok(offers.every(o=>!genericPage(o)),`${t.label}: generic category/search pages are rejected`);
    for(const re of t.reject) ok(offers.every(o=>!re.test(textOf(o))),`${t.label}: wrong product type ${re} is rejected`);
    ok(offers.every(o=>o.branchStockVerified!==true||o.stockScope==='branch-specific'),`${t.label}: online offers do not pretend to verify branch stock`);
    const priced=offers.filter(o=>Number.isFinite(Number(o.price))&&Number(o.price)>0);
    if(priced.length) ok(priced.every(o=>o.sourcePageVerified===true||o.priceComparisonVerified===true||o.verified===true),`${t.label}: shown prices have verification evidence`);
    else notes.push(`${t.label}: no live price was available; UI must show this honestly.`);
  }

  const nearby=await timed('Nearby retailer search',async()=>{const r=await post('/api/nearby',{lat:-25.7479,lon:28.2293,radiusKm:10,mode:'likely',identification:{name:'Sony WH-1000XM5 headphones',object:'headphones',category:'electronics',retailCategory:'electronics'}});return {r,d:await r.json().catch(()=>({}))}},35000);
  ok(nearby.r.status===200&&nearby.d.ok===true&&Array.isArray(nearby.d.stores),'Nearby search responds with stores');
  const distances=(nearby.d.stores||[]).map(s=>Number(s.distanceKm)).filter(Number.isFinite);
  ok(distances.every((v,i,a)=>i===0||a[i-1]<=v+0.05),'Nearby stores are ordered closest first');
  ok((nearby.d.stores||[]).every(s=>s.branchStockVerified!==true&&s.stockVerified!==true&&s.directionsAvailable!==true),'Likely nearby retailers do not fake branch inventory or exact-product directions');

  const unknown=await timed('Unknown-product failure case',async()=>{const r=await post('/api/product-intelligence-v2',{name:'zzqv impossible unknown product 918273',object:'unknown object',category:'general',retailCategory:'general',searchQuery:'zzqv impossible unknown product 918273'});return {r,d:await r.json().catch(()=>({}))}},45000);
  ok(unknown.r.status===200,'Unknown product returns a controlled response instead of crashing');
  const unknownOffers=Array.isArray(unknown.d.offers)?unknown.d.offers:[];
  ok(unknownOffers.every(o=>!(Number(o.price)>0&&o.sourcePageVerified!==true&&o.priceComparisonVerified!==true)),'Unknown product never invents an unverified price');

  const feedback=await get('/api/feedback-health'); const fj=await feedback.json().catch(()=>({}));
  ok(feedback.status===200&&fj.ok===true,'Feedback service health passes');
  const health=await get('/api/health'); const hj=await health.json().catch(()=>({}));
  ok(health.status===200&&hj.ok===true,'Core health passes');
}catch(e){failures.push(`Regression suite crashed: ${e?.stack||e}`)}

if(notes.length){console.log('\nNOTES');notes.forEach(x=>console.log('-',x))}
if(failures.length){console.error(`\n${failures.length} regression failure(s)`);failures.forEach(x=>console.error('-',x));process.exit(1)}
console.log('\nFindIt dashboard + commerce regression suite passed.');
