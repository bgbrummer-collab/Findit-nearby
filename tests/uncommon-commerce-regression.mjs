import { nativeRetailerDiscovery } from '../lib/native-retailer-discovery.js';

const product={brand:'Korg',model:'Pitchclip 2',name:'Korg Pitchclip 2 clip-on tuner',object:'clip-on instrument tuner',category:'musical accessories',searchQuery:'Korg Pitchclip 2 clip-on tuner',lat:-25.7479,lon:28.2293};
const search='https://www.marshallmusic.co.za/?s='+encodeURIComponent('Korg Pitchclip 2')+'&post_type=product';
let searchText='';
try{const r=await fetch(`https://r.jina.ai/${search}`,{headers:{'user-agent':'FindItRegression/3.0'},signal:AbortSignal.timeout(12000)});searchText=r.ok?await r.text():`HTTP ${r.status}`}catch(e){searchText=`ERR ${e.message}`}
console.log('NATIVE_SEARCH_PROBE',JSON.stringify({chars:searchText.length,containsPitchclip:/pitchclip\s*2/i.test(searchText),containsProduct:/korg.{0,60}pitchclip/i.test(searchText)}));

const offers=await nativeRetailerDiscovery(product);
console.log('NATIVE_DISCOVERY_RESULT',JSON.stringify(offers.map(o=>({retailer:o.retailer?.name,title:o.product_name,price:o.price,currency:o.currency,availability:o.availability,url:o.product_url,verified:o.verified,exact:o.exactProductMatch,source:o.sourcePageVerified}))));
const exact=offers.filter(o=>o.exactProductMatch===true&&o.sourcePageVerified===true);
if(!exact.length)throw new Error('uncommon product: no verified exact retailer page discovered');
if(exact.some(o=>/[?&](?:s|q|query|search|text)=|post_type=product|route=product\/search/i.test(o.product_url)))throw new Error('uncommon product: retailer search page was incorrectly treated as an exact product page');
if(exact.some(o=>/page not found|\b404\b/i.test(o.product_name)))throw new Error('uncommon product: not-found page was incorrectly treated as an offer');
if(!exact.some(o=>o.retailer?.name==='Marshall Music'&&/\/product\/korg-pitchclip-2-clip-on-tuner\/?$/i.test(new URL(o.product_url).pathname)))throw new Error('uncommon product: exact Marshall Music product page was not discovered');
const livePriced=exact.filter(o=>o.retailer?.name==='Marshall Music'&&o.currency==='ZAR'&&Number.isFinite(Number(o.price))&&Number(o.price)>0&&Number(o.price)<10000);
if(!livePriced.length)throw new Error(`uncommon product: no positive live ZAR price was verified from the exact Marshall Music page; got ${exact.map(o=>`${o.retailer?.name}:${o.price} ${o.currency}`).join(', ')}`);
if(new Set(livePriced.map(o=>Number(o.price))).size>1)throw new Error(`uncommon product: conflicting prices were extracted from the same exact retailer product identity: ${livePriced.map(o=>o.price).join(', ')}`);
if(!exact.some(o=>o.retailer?.name==='Marshall Music'&&o.availability==='in_stock'))throw new Error('uncommon product: exact Marshall Music online availability was not verified');
if(offers.some(o=>/pitchclip\s*2\s*(?:\+|plus)/i.test(`${o.product_name} ${o.product_url}`)))throw new Error('uncommon product: adjacent Plus variant leaked');
if(offers.some(o=>o.branchStockVerified===true))throw new Error('uncommon product: branch stock was claimed without branch-specific evidence');
console.log('UNCOMMON_COMMERCE_REGRESSION_PASS',JSON.stringify({retailer:'Marshall Music',livePrice:Number(livePriced[0].price),currency:'ZAR'}));
