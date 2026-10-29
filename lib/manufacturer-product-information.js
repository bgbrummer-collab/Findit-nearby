import {fetchPublicProductPage} from './public-product-page.js';

const plain=v=>String(v||'').replace(/<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();
function shureModel(i){
 const text=[i.suggestedLabel,i.searchQuery,i.name].filter(Boolean).join(' ');
 const explicit=String(i.brand||'').toLowerCase()==='shure'?String(i.model||'').trim():'';
 const model=explicit||text.match(/\bShure\s+([a-z]{1,8}\d[a-z0-9-]{0,24})\b/i)?.[1]||'';
 return /^[a-z]{1,8}\d[a-z0-9-]{0,24}$/i.test(model)?model.toUpperCase():'';
}

// Catalogue adapters discover live manufacturer documents, not stored product
// specifications. Each response must independently match the requested model.
export function manufacturerResearchUrls(i={}){
 const urls=[],text=[i.brand,i.model,i.name,i.searchQuery,i.suggestedLabel].join(' ');
 const model=shureModel(i);if(model)urls.push('https://www.shure.com/en-US/docs/guide/'+encodeURIComponent(model));
 if(/\blogitech\b/i.test(text)&&/\bg\s+pro\b/i.test(text)&&/headphones?|headset/i.test(i.object+' '+text)&&! /\b(?:pro x|wireless)\b/i.test(text))urls.push('https://www.logitechg.com/en-sg/shop/p/pro-gaming-headset');
 if(/\blogitech\b/i.test(text)&&/\bg435\b/i.test(text)&&/headphones?|headset/i.test(i.object+' '+text))urls.push('https://www.logitechg.com/en-eu/shop/p/g435-wireless-bluetooth-gaming-headset');
 return urls;
}

// A primary product record may abbreviate its name to just the model. Expand
// it only from the same page's title, with an exact canonical URL and brand.
// Recommendation nodes, missing URLs and a different product type are excluded.
export function expandedPrimaryProduct(raw,url,matches){
 const title=plain(String(raw||'').match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
 if(!title||!matches(title))return null;
 const tokens=v=>plain(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().split(' ').filter(Boolean),wanted=tokens(title);
 for(const block of String(raw||'').matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
  let data;try{data=JSON.parse(block[1]);}catch{continue;}
  const nodes=[data].flat().flatMap(x=>Array.isArray(x?.['@graph'])?x['@graph']:[x]);
  for(const node of nodes){
   if(![node?.['@type']].flat().includes('Product')||!node.name||matches(plain(node.name)))continue;
   const brand=plain(node.brand?.name||node.brand);if(!brand||!tokens(brand).every(w=>wanted.includes(w))||!tokens(node.name).every(w=>wanted.includes(w)))continue;
   try{const actual=new URL(node.url||node['@id']);const expected=new URL(url);if(actual.protocol!=='https:'||actual.hostname!==expected.hostname||actual.pathname.replace(/\/$/,'')!==expected.pathname.replace(/\/$/,''))continue;}catch{continue;}
   let description=plain(node.description);
   if(!description){for(const meta of String(raw).matchAll(/<meta\b[^>]*>/gi)){if(!/\bname=["']description["']/i.test(meta[0]))continue;description=plain(meta[0].match(/\bcontent=["']([^"']*)["']/i)?.[1]);}}
   return '<script type="application/ld+json">'+JSON.stringify({...node,name:title,description}).replace(/</g,'\\u003c')+'</script>'+raw;
  }
 }
 return null;
}

export function shureGuideMetadata(raw,i,url){
 const model=shureModel(i);if(!model||!manufacturerResearchUrls(i).includes(url)||new URL(url).hostname!=='www.shure.com')return null;
 const script=String(raw||'').match(/<script\b(?=[^>]*\bid=["']__NEXT_DATA__["'])[^>]*>([\s\S]*?)<\/script>/i);
 try{
  const p=JSON.parse(script?.[1]||'null')?.props?.pageProps;
  if(!p||String(p.model||'').toUpperCase()!==model||!Number.isSafeInteger(p.docId)||p.docId<1||p.docId>1e9||p.helperLang?.[p.docId]!=='English')return null;
  return {model,docId:p.docId,description:plain(p.description),name:['Shure',model,plain(p.helperpubName?.[p.docId]?.[0])].filter(Boolean).join(' ')};
 }catch{return null;}
}

export function shureGuideProduct(metadata,manual){
 if(!metadata||typeof manual!=='string'||manual.length>1500000||!manual.includes('id="pub-content"'))return null;
 const sections=[...manual.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>([\s\S]*?)(?=<h1\b|$)/gi)];
 const overview=sections.filter(s=>/^(?:General Description|Overview|Features)$|\b(?:Outputs?|Connections?|Microphone|Headphones)$/i.test(plain(s[1]))).map(s=>s[2]).join('\n');
 if(!new RegExp('\\b'+metadata.model.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i').test(plain(overview)))return null;
 const specSection=sections.find(s=>/^Specifications$/i.test(plain(s[1])))?.[2]||'',properties=[];
 for(const pair of specSection.matchAll(/<h3\b[^>]*class=["'][^"']*\bspec1_title\b[^"']*["'][^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3\b|$)/gi)){
  const name=plain(pair[1]),value=plain(pair[2].match(/<p\b[^>]*class=["'][^"']*\bspec1_value\b[^"']*["'][^>]*>([\s\S]*?)<\/p>/i)?.[1]);
  const condition=plain(pair[2].match(/<p\b[^>]*class=["'][^"']*\bspectext_cond\b[^"']*["'][^>]*>([\s\S]*?)<\/p>/i)?.[1]);
  if(name&&value&&name.length<100&&value.length+condition.length<240)properties.push({name,value:[value,condition].filter(Boolean).join(' ')});
 }
 const notes=[...specSection.matchAll(/<p\b[^>]*class=["'][^"']*\bspec1_fn\b[^"']*["'][^>]*>([\s\S]*?)<\/p>/gi)].map(m=>plain(m[1])).filter(Boolean).join(' ');
 if(notes&&notes.length<240)properties.push({name:'Specification notes',value:notes});
 const node={'@type':'Product',name:metadata.name,brand:'Shure',model:metadata.model,description:overview,additionalProperty:properties};
 return '<script type="application/ld+json">'+JSON.stringify(node).replace(/</g,'\\u003c')+'</script>';
}

export async function manufacturerProductData(url,i,raw,report=()=>{}){
 if(raw!==undefined){const product=logitechPublishedProduct(raw,i,url);if(product)return product;}
 const failure=(stage,status,extra={})=>report({url,status,resource:'manufacturer-document',stage,...extra});
 let metadata=raw===undefined?null:shureGuideMetadata(raw,i,url);
 if(raw===undefined){
  const model=shureModel(i);if(!model||!manufacturerResearchUrls(i).includes(url)||new URL(url).hostname!=='www.shure.com')return null;
  try{
   // The manufacturer's own document reader uses this public, read-only lookup.
   // It avoids depending on server-rendered website metadata being present.
   const response=await fetchPublicProductPage('https://pubs2-api.prod.shureweb.eu/documents/public/product',{method:'POST',headers:{'content-type':'application/json',accept:'application/json'},body:JSON.stringify({docTypeShortCode:'guide',prodId:model,lang:'en-US'}),signal:AbortSignal.timeout(5000)});
   if(!response.ok){failure('metadata','http-error',{httpStatus:response.status});return null;}const result=await response.json(),p=result?.data;
   if(result.status!=='success'||!p||p.public!==true||p.language!==1||p.document_type!==1||String(p.model).toUpperCase()!==model||String(p.product_id).toUpperCase()!==model||!Number.isSafeInteger(p.id)||p.id<1||p.id>1e9){failure('metadata','identity-mismatch',{reason:'metadata-validation-failed'});return null;}
   metadata={model,docId:p.id,description:plain(p.description),name:['Shure',model,plain(p.pub_name)].filter(Boolean).join(' ')};
  }catch(error){failure('metadata',/Timeout|Abort/.test(error?.name)?'timeout':'fetch-error');return null;}
 }
 if(!metadata)return null;
 try{
  // This public rendering endpoint is linked by Shure's own document reader.
  // Only the validated numeric document ID is sent, never arbitrary page data.
  const response=await fetchPublicProductPage('https://pubs2-api.prod.shureweb.eu/documents/public/render/'+metadata.docId+'.html.twig',{headers:{accept:'text/html'},signal:AbortSignal.timeout(8000)});
  if(!response.ok){failure('content','http-error',{httpStatus:response.status});return null;}const product=shureGuideProduct(metadata,(await response.text()).slice(0,1500001));
  if(!product)failure('content','identity-mismatch',{reason:'document-content-model-mismatch'});return product;
 }catch(error){failure('content',/Timeout|Abort/.test(error?.name)?'timeout':'fetch-error');return null;}
}

// Read string literals from the publisher's primary product payload. Never
// evaluate serialized JavaScript, or scan recommendations for specifications.
function objectLiteral(raw,key,opening='{'){
 const closing=opening==='{'?'}':']',start=raw.indexOf(key+':'+opening);if(start<0)return '';
 const offset=start+key.length+1;let depth=0,quoted=false,escaped=false;
 for(let n=offset;n<raw.length;n++){
  const c=raw[n];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;continue;}
  if(c==='"')quoted=true;else if(c===opening)depth++;else if(c===closing&&!--depth)return raw.slice(offset,n+1);
 }
 return '';
}
export function logitechPublishedProduct(raw,i={},url){
 let u;try{u=new URL(url);if(u.hostname!=='www.logitechg.com'||u.protocol!=='https:'||u.username||u.password||u.port)return null;}catch{return null;}
 const data=objectLiteral(String(raw||'').slice(0,2000000),'productData'),base=objectLiteral(data,'baseData');if(!base)return null;
 const literal='"(?:\\\\.|[^"\\\\])*"';
 const read=(text,key)=>{try{return JSON.parse(text.match(new RegExp('(?:[,{])'+key+':('+literal+')'))?.[1]||'null');}catch{return null;}};
 const id=read(base,'productIdentifier'),canonical=read(base,'c_url'),brand=read(base,'brand'),model=read(base,'title');
 if(!id||u.pathname.split('/').at(-1)!==id||canonical!==url||!/^Logitech(?: G)?$/i.test(brand||'')||!model)return null;
 const words=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().split(' ').filter(Boolean);
 const request=words([i.brand,i.model,i.name,i.searchQuery].join(' '));
 if(!request.includes('logitech')||!words(model).every(w=>request.includes(w)))return null;
 const name=[brand,model,read(base,'subtitle')].filter(Boolean).join(' ');let description=plain(read(base,'description'));
 const specs=objectLiteral(data,'specsAndRequirements'),properties=[];
 for(const pair of specs.matchAll(new RegExp('facet:('+literal+'),value:('+literal+')','g'))){
  try{const name=plain(JSON.parse(pair[1])),value=plain(JSON.parse(pair[2]));if(name&&value&&name.length<100&&value.length<240)properties.push({name,value});}catch{}
 }
 // Universal facts apply across colour variants. Variant-only values are not
 // promoted to the requested product without a matching SKU.
 const technical=objectLiteral(data,'inRiverTechSpecs');
 for(const group of ['headphone','earbuds','microphone','battery','connectivity','systemrequirements']){
  const section=objectLiteral(technical,group,'[');
  for(const pair of section.matchAll(new RegExp('facet:('+literal+'),values:\\[\\{value:('+literal+'),variants:\\[\\],universal:true\\}','g'))){
   try{let name=plain(JSON.parse(pair[1]));const value=plain(JSON.parse(pair[2]));if(/^Frequency Response$/i.test(name))name=(group==='microphone'?'Microphone':'Headphone')+' '+name;if(group==='battery')name='Battery '+name;if(name&&value&&name.length<100&&value.length<240)properties.push({name,value});}catch{}
  }
 }
 const contents=objectLiteral(data,'packageContents'),items=[];
 for(const entry of contents.matchAll(new RegExp('(?:[,{])item:('+literal+')','g'))){try{const item=plain(JSON.parse(entry[1]));if(item&&item.length<180)items.push(item);}catch{}}
 if(items.length)description+=' Package includes '+items.slice(0,12).join('; ')+'.';
 if(!description&&!properties.length)return null;
 const unique=properties.filter((p,n,a)=>a.findIndex(x=>x.name===p.name&&x.value===p.value)===n).slice(0,32);
 return '<script type="application/ld+json">'+JSON.stringify({'@type':'Product',name,brand,model,description,additionalProperty:unique,url}).replace(/</g,'\\u003c')+'</script>';
}
