// Read-only public food catalogue. Catalogue identity never establishes retailer stock.
const clean=(v,n=300)=>String(v??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,n);
export function validGtin(code){if(!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(code))return false;let sum=0;for(let i=code.length-2,n=0;i>=0;i--,n++)sum+=Number(code[i])*(n%2?1:3);return (10-sum%10)%10===Number(code.at(-1));}
export async function foodBarcode(code){code=String(code||'');if(!validGtin(code))return null;
 const endpoint=`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=code,product_name,product_name_en,generic_name_en,brands,quantity`;
 try{const r=await fetch(endpoint,{headers:{accept:'application/json','user-agent':'FindItNearby/1.0 (https://findit-nearby.bgbrummer.workers.dev/)'},signal:AbortSignal.timeout(4500)});if(!r.ok)return null;const d=await r.json(),p=d.product;if(d.status!==1||!p||String(p.code||d.code).padStart(14,'0')!==code.padStart(14,'0'))return null;const name=clean(p.product_name_en||p.product_name),brand=clean(p.brands,120),size=clean(p.quantity,80);if(!name)return null;return {name,size,brand,description:clean(p.generic_name_en,700),barcode:code,source:{title:'Open Food Facts — '+name,url:`https://world.openfoodfacts.org/product/${code}`},evidenceUrl:endpoint};}catch{return null;}
}
