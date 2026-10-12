// Public catalogue endpoints only; no merchant credentials or cart mutations.
const DOMAINS=new Set(['marshallmusic.co.za','bothners.co.za','musicconnection.co.za','pna.co.za']);
const host=u=>new URL(u).hostname.replace(/^www\./,'');
export async function wooProductData(url){
 let u;try{u=new URL(url);if(u.protocol!=='https:'||!DOMAINS.has(host(u))||u.username||u.password||u.port)return null;}catch{return null;}
 const slug=u.pathname.match(/^\/product\/([^/]+)\/?$/)?.[1];if(!slug)return null;
 const endpoint=new URL('/wp-json/wc/store/v1/products',u);endpoint.searchParams.set('slug',decodeURIComponent(slug));endpoint.searchParams.set('per_page','10');
 try{const r=await fetch(endpoint.href,{redirect:'manual',headers:{accept:'application/json','user-agent':'FindItNearby/42.0'},signal:AbortSignal.timeout(8000)});if(!r.ok)return null;const data=await r.json();if(!Array.isArray(data))return null;
  const p=data.slice(0,10).find(p=>{try{const link=new URL(p.permalink);return p.name&&!p.is_password_protected&&link.protocol==='https:'&&host(link)===host(u)&&link.pathname.replace(/\/$/,'')===u.pathname.replace(/\/$/,'');}catch{return false;}});if(!p)return null;
  const unit=p.prices?.currency_minor_unit,currency=p.prices?.currency_code,minor=p.prices?.price,valid=Number.isInteger(unit)&&unit>=0&&unit<=6&&/^[A-Z]{3}$/.test(currency||'')&&/^\d+$/.test(String(minor||''))&&!p.prices?.price_range;
  const price=valid?Number(minor)/10**unit:null;
  const node={'@type':'Product',name:p.name,sku:p.sku||'',description:[p.short_description,p.description].filter(Boolean).join(' '),offers:{'@type':'Offer',...(price>0&&price<1e8?{price,priceCurrency:currency}:{}),...(typeof p.is_in_stock==='boolean'?{availability:'https://schema.org/'+(p.is_in_stock?'InStock':'OutOfStock')}:{} )}};
  return {node,evidenceUrl:endpoint.href};
 }catch{return null;}
}
