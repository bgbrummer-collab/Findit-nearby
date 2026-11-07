// Live retailer regression through the same commerce Worker handler used in production.
import worker from '../cloudflare/worker.js';

const identification={brand:'Korg',model:'Pitchclip 2',name:'Korg Pitchclip 2 clip-on tuner',object:'clip-on instrument tuner',category:'musical accessories'};
const base=process.env.FINDIT_URL;
const request=new Request(new URL('/api/product-intelligence-v2',base||'https://findit.example'),{
 method:'POST',headers:{'content-type':'application/json'},
 body:JSON.stringify({identification,country:'ZA'})
});
const response=base?await fetch(request,{signal:AbortSignal.timeout(50000)}):await worker.fetch(request,{});
const {offers=[],discoveryDiagnostics}=await response.json();
const exact=offers.filter(o=>o.exactProductMatch===true&&o.sourcePageVerified===true);
const priced=exact.filter(o=>o.currency==='ZAR'&&Number.isFinite(o.price)&&o.price>0);
console.log('UNCOMMON_COMMERCE_RESULT',JSON.stringify({offers:exact,discoveryDiagnostics}));
if(response.status!==200||!priced.length)throw new Error('uncommon product: no verified exact retailer listing with a live ZAR price');
if(offers.some(o=>/page not found|pitchclip\s*2\s*(?:\+|plus)/i.test(`${o.product_name} ${o.product_url}`)))throw new Error('uncommon product: invalid page or adjacent Plus variant leaked');
if(offers.some(o=>o.branchStockVerified||o.directionsAvailable))throw new Error('uncommon product: physical stock or directions claimed without branch evidence');
