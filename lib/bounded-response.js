// Limit bytes while reading, rather than buffering an unlimited response and
// slicing afterwards. Only complete source records may pass later verification.
export async function boundedResponseText(response,maxBytes){
 const reader=response.body?.getReader();if(!reader)return '';
 const decoder=new TextDecoder(),parts=[];let bytes=0;
 try{
  while(bytes<maxBytes){
   const {done,value}=await reader.read();if(done)return parts.join('')+decoder.decode();
   const remaining=maxBytes-bytes,take=value.subarray(0,remaining);bytes+=take.byteLength;parts.push(decoder.decode(take,{stream:true}));
   if(value.byteLength>remaining||bytes===maxBytes){await reader.cancel();break;}
  }
  return parts.join('')+decoder.decode();
 }finally{reader.releaseLock();}
}
