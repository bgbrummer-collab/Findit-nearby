import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare/worker.js';

const endpoint='https://catalogue.example.com/search';
const config={
 ZA:{endpoint,currency:'ZAR',retailers:[{domain:'takealot.com',name:'Takealot'},{domain:'makro.co.za',name:'Makro'}]},
 US:{endpoint,currency:'USD',retailers:[{domain:'bestbuy.com',name:'Best Buy'}]}
};
const env={RETAILER_CATALOGUES_JSON:JSON.stringify(config),RETAILER_CATALOGUE_TOKEN:'test-secret'};
const identity={name:'Example E42 black headphones',brand:'Example',model:'E42',color:'black',object:'headphones'};
function request(body,headers={}){
 return new Request('https://findit.example/api/product-intelligence-v2',{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)});
}

test('Worker accepts fresh exact online offers from multiple authorized retailers in the requested market',async t=>{
 const checkedAt=new Date().toISOString();
 const base={title:identity.name,sku:'E42-BLK',price:1200,currency:'ZAR',country:'ZA',checkedAt,availability:'in_stock',stores:[{inStock:true}]};
 const takealot={...base,url:'https://www.takealot.com/example-e42/PLID123456'};
 const makro={...base,url:'https://www.makro.co.za/example-e42/p/example',price:1100};
 const seen=[];
 t.mock.method(globalThis,'fetch',async(input,opts)=>{
  if(String(input)!==endpoint)return new Response('',{status:404});
  assert.equal(opts.redirect,'error');
  assert.equal(opts.headers.authorization,'Bearer test-secret');
  const query=JSON.parse(opts.body);seen.push(query);
  const products=query.country==='ZA'?[takealot,makro,
   {...takealot,title:'Example E42 Plus black headphones',sku:'plus'},
   {...takealot,title:'Example E42 red headphones',sku:'red'},
   {...takealot,url:'https://takealot.com.evil.example/item'},
   {...takealot,country:'US'},
   {...takealot,checkedAt:'2025-01-01T00:00:00Z'},
   {...takealot,price:2,currency:'USD',availability:null},
   {...takealot,url:'https://takealot.com/search?q=example'},
  ]:[{...base,url:'https://www.bestbuy.com/site/example/123.p',price:99,currency:'USD',country:'US'}];
  return Response.json({products});
 });
 const za=await (await worker.fetch(request({identification:identity,country:'za',lat:-25.7,lon:28.2},{'cf-ipcountry':'US'}),env)).json();
 assert.deepEqual(za.offers.map(x=>x.retailer.name),['Makro','Takealot']);
 assert.equal(za.bestPrice.price,1100);
 assert.equal(za.discoveryDiagnostics.authorizedOffers,2);
 assert.ok(za.offers.every(x=>x.retailerApiVerified&&!x.branchStockVerified&&!x.directionsAvailable));
 const us=await (await worker.fetch(request({identification:identity},{'cf-ipcountry':'US'}),env)).json();
 assert.equal(us.offers[0].retailer.name,'Best Buy');
 assert.equal(us.offers[0].currency,'USD');
 assert.deepEqual(seen.map(x=>x.country),['ZA','US']);
 assert.ok(seen.every(x=>!('lat' in x)&&!('lon' in x)));
 const unconfirmed=await (await worker.fetch(request({identification:{...identity,requiresModelConfirmation:true}}),env)).json();
 assert.equal(unconfirmed.offers.length,0);
 assert.equal(seen.length,2);
});
