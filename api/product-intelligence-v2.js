import coreHandler from '../lib/product-intelligence-core.js';

const clean=v=>String(v??'').trim();
const positive=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))&&Number(v)>0;
function safeUrl(v){try{return new URL(String(v||''))}catch{return null}}
function isProductPage(o){
  const u=safeUrl(o?.product_url||o?.url),title=clean(o?.product_name||o?.title).toLowerCase();
  if(!u)return false;
  const h=u.hostname.replace(/^www\./,'').toLowerCase(),p=u.pathname.toLowerCase();
  if(/open prime modal|prime modal|search results|shop online for electronics apparel computers|sign in to continue/.test(title))return false;
  if(/\/(search|category|categories|collections?|brands?|browse)(\/|$)/.test(p))return false;
  if(h==='nike.com'||h.endsWith('.nike.com')){
    if(/^\/w\//.test(p)||!/(^|\/)t\//.test(p))return false;
  }
  if(h==='amazon.com'||h.endsWith('.amazon.com')||h==='amazon.co.za'||h.endsWith('.amazon.co.za')){
    if(!(/\/dp\//.test(p)||/\/gp\/product\//.test(p)))return false;
  }
  return true;
}
function priceIsPlausible(o){
  if(!positive(o?.price))return true;
  const u=safeUrl(o?.product_url||o?.url);if(!u)return false;
  const h=u.hostname.replace(/^www\./,'').toLowerCase(),p=u.pathname.toLowerCase(),c=clean(o.currency).toUpperCase();
  if(c==='ZAR'&&!h.endsWith('.co.za')&&!h.endsWith('.za.com')&&!/\/za(?:\/|$)/.test(p))return false;
  return true;
}
function normalize(data){
  if(!data||!Array.isArray(data.offers))return data;
  data.offers=data.offers.filter(o=>isProductPage(o)&&priceIsPlausible(o));
  const priced=data.offers.filter(o=>positive(o.price)).sort((a,b)=>Number(a.price)-Number(b.price));
  const inStock=data.offers.filter(o=>o.availability==='in_stock');
  data.matched=data.offers.length>0;
  data.exactMatchVerified=data.offers.length>0;
  data.bestProduct=data.offers[0]?{name:data.offers[0].product_name}:null;
  data.bestPrice=priced[0]||null;
  data.verifiedOfferCount=data.offers.length;
  data.verifiedSellerCount=new Set(data.offers.map(o=>o?.retailer?.name||o?.retailer).filter(Boolean)).size;
  data.priceVerifiedCount=priced.length;
  data.inStockOfferCount=inStock.length;
  data.postValidation='Strict product-page and currency validation';
  return data;
}

export default async function handler(req,res){
  let statusCode=200,payload,headers={};
  const proxy={
    setHeader(k,v){headers[k]=v;return proxy},
    status(n){statusCode=n;return proxy},
    json(v){payload=v;return v},
    end(v){payload=v;return v}
  };
  await coreHandler(req,proxy);
  for(const [k,v] of Object.entries(headers))res.setHeader(k,v);
  return res.status(statusCode).json(normalize(payload));
}
