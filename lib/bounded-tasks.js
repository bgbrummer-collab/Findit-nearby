// Keep a small number of publisher response bodies alive at once. Retain the
// input order and individual failures, as Promise.allSettled does.
export async function boundedSettled(items,task,concurrency=4){
 const results=new Array(items.length);let cursor=0;
 await Promise.all(Array.from({length:Math.min(concurrency,items.length)},async()=>{
  while(cursor<items.length){const index=cursor++;try{results[index]={status:'fulfilled',value:await task(items[index],index)};}catch(reason){results[index]={status:'rejected',reason};}}
 }));return results;
}
