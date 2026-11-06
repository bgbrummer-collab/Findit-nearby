import {publicHttpsUrl} from './public-product-page.js';

const MAX_BYTES=262144;
const MAX_AGE_MS=60*60*1000;

async function readCatalogue(response){
 const reader=response.body?.getReader();
 if(!reader)return [];
 const decoder=new TextDecoder();
 let bytes=0,text='';
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   bytes+=value.byteLength;
   if(bytes>MAX_BYTES){await reader.cancel();return [];}
   text+=decoder.decode(value,{stream:true});
  }
  const payload=JSON.parse(text+decoder.decode());
  return Array.isArray(payload.products)?payload.products.slice(0,50):[];
 }finally{reader.releaseLock();}
}

export async function authorizedRetailerCatalogue(env,country,query,barcode,observe){
 if(!env?.RETAILER_CATALOGUES_JSON)return [];
 try{
  const configs=JSON.parse(env.RETAILER_CATALOGUES_JSON);
  const config=Object.hasOwn(configs,country)?configs[country]:null;
  const endpoint=publicHttpsUrl(config?.endpoint);
  if(!endpoint||!Array.isArray(config.retailers)||!/^[A-Z]{3}$/.test(config.currency))return [];
  const token=env.RETAILER_CATALOGUE_TOKEN;
  if(!token)return [];
  const retailers=new Map(config.retailers.filter(row=>typeof row?.domain==='string'&&typeof row.name==='string'&&row.name.trim()).map(row=>[row.domain.toLowerCase().replace(/^www\./,''),row.name.trim()]));
  const response=await fetch(endpoint,{
   method:'POST',redirect:'error',signal:AbortSignal.timeout(5000),
   headers:{authorization:'Bearer '+token,'content-type':'application/json',accept:'application/json'},
   body:JSON.stringify({country,query,barcode:barcode||undefined,limit:50})
  });
  observe({phase:'authorized-catalogue',host:new URL(endpoint).hostname,status:response.status,outcome:response.ok?'read':'http-error'});
  if(!response.ok){await response.body?.cancel();return [];}
  const rows=await readCatalogue(response);
  const now=Date.now();
  return rows.flatMap(row=>{
   const url=publicHttpsUrl(row?.url);
   if(!url||row.country!==country||typeof row.title!=='string'||!row.title.trim()||typeof row.sku!=='string'||!row.sku.trim())return [];
   const domain=new URL(url).hostname.replace(/^www\./,'');
   const retailer=retailers.get(domain);
   const timestamp=typeof row.checkedAt==='string'?Date.parse(row.checkedAt):NaN;
   if(!retailer||!Number.isFinite(timestamp)||timestamp>now||now-timestamp>MAX_AGE_MS)return [];
   const price=row.currency===config.currency&&Number.isFinite(row.price)&&row.price>0&&row.price<1e8?row.price:null;
   const availability=['in_stock','out_of_stock','preorder','backorder'].includes(row.availability)?row.availability:null;
   return [{row,url,domain,retailer,checkedAt:new Date(timestamp).toISOString(),price,currency:price===null?null:config.currency,availability}];
  });
 }catch{
  observe({phase:'authorized-catalogue',outcome:'unavailable'});
  return [];
 }
}
