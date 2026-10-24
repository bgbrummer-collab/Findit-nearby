// Validate each destination before following a retailer redirect. No credentials,
// arbitrary ports, IP literals or local-network names are valid product sources.
export function publicHttpsUrl(value){
 try{
  const u=new URL(String(value||'')),host=u.hostname.toLowerCase().replace(/\.$/,'');
  if(u.protocol!=='https:'||u.username||u.password||u.port||!host.includes('.')||host.startsWith('[')||/^(?:\d+\.){3}\d+$/.test(host)||/(?:^|\.)(?:localhost|local|internal|home|lan)$/.test(host))return null;
  u.hash='';return u.href;
 }catch{return null;}
}
const publisher=value=>new URL(value).hostname.toLowerCase().replace(/\.$/,'').replace(/^www\./,'');
function unsafe(){return Object.assign(new Error('Invalid public product-page destination'),{code:'UNSAFE_PUBLIC_PAGE'});}
export async function fetchPublicProductPage(value,options={},validateUrl=()=>true){
 let url=publicHttpsUrl(value);if(!url||!validateUrl(url))throw unsafe();
 const originalPublisher=publisher(url);
 for(let redirects=0;redirects<=4;redirects++){
  const response=await fetch(url,{...options,redirect:'manual'});
  // Also reject an unexpectedly followed redirect from an injected transport.
  if(response.url){const actual=publicHttpsUrl(response.url);if(!actual||publisher(actual)!==originalPublisher||!validateUrl(actual)){await response.body?.cancel().catch(()=>{});throw unsafe();}}
  if(![301,302,303,307,308].includes(response.status))return response;
  const location=response.headers.get('location');await response.body?.cancel().catch(()=>{});
  let next;try{next=location&&publicHttpsUrl(new URL(location,url).href);}catch{}
  if(!next||publisher(next)!==originalPublisher||!validateUrl(next))throw unsafe();
  if(redirects===4)throw Object.assign(new Error('Product-page redirect limit exceeded'),{code:'PUBLIC_PAGE_REDIRECT_LIMIT'});
  url=next;
 }
}
