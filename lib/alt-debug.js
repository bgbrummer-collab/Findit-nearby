async function reader(url){try{const r=await fetch(`https://r.jina.ai/${url}`,{headers:{Accept:'text/plain','User-Agent':'FindItNearby/1.0'},signal:AbortSignal.timeout(12000)});const t=await r.text();return{status:r.status,text:t.slice(0,20000)}}catch(e){return{status:0,error:e.message,text:''}}}
export async function debugAlternatives(){
 const q='curl conditioner moisture detangling 250ml';
 const urls=[
  `https://clicks.co.za/search?text=${encodeURIComponent(q)}`,
  `https://www.google.com/search?q=${encodeURIComponent('site:clicks.co.za curl conditioner 250ml')}`,
  `https://www.bing.com/search?q=${encodeURIComponent('site:clicks.co.za curl conditioner 250ml')}`
 ];
 const out=[];
 for(const url of urls){const r=await reader(url);const links=(r.text.match(/https?:\/\/[^\s)\]>"']+/g)||[]).filter(x=>x.includes('clicks.co.za')).slice(0,20);out.push({url,status:r.status,length:r.text.length,links,sample:r.text.slice(0,1500)})}
 return{ok:true,out};
}
