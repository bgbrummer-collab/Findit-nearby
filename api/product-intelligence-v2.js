import {resolveProduct} from '../lib/product-resolver.js';

const BLOCKED=/\b(firearm|gun|rifle|pistol|ammunition|ammo|weapon|knife|machete|sword|switchblade|taser|pepper spray|fireworks|explosive|vape|nicotine|cigarette|alcohol|beer|wine|liquor|cannabis|marijuana|thc|cbd|gambling|casino|pornography)\b/i;

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  let body=req.body||{};
  if(req.method==='GET'&&req.query?.test==='conditioner'){
    body={
      brand:'Marc Anthony',
      model:'Strictly Curls 3X Moisture Triple Blend Conditioner 250ml',
      name:'Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml',
      query:'Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml',
      searchQuery:'Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml',
      object:'conditioner',
      category:'hair care',
      retailCategory:'beauty'
    };
  }else if(req.method!=='POST'){
    return res.status(405).json({error:'Method not allowed'});
  }
  if(BLOCKED.test([body.query,body.searchQuery,body.name,body.object,body.category,body.retailCategory].filter(Boolean).join(' '))){
    return res.status(403).json({error:'Unsupported product type'});
  }
  try{
    const result=await resolveProduct(body);
    if(!result.ok&&result.error)return res.status(400).json(result);
    return res.status(200).json(result);
  }catch(error){
    console.error('FindIt product resolver error',error);
    return res.status(500).json({ok:false,error:'Product lookup failed',message:error?.message||'Unknown error'});
  }
}
