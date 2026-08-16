const norm=v=>String(v||"").trim().toLowerCase();

export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});

  try{
    const {lat,lon,identification={},radiusKm:requested}=req.body||{};
    const a=Number(lat),b=Number(lon);
    if(!Number.isFinite(a)||!Number.isFinite(b)) return res.status(400).json({error:"Valid location required"});

    const radiusKm=Math.min(25,Math.max(3,Number(requested)||10));
    const item=identification.name||identification.model||identification.object||"this product";
    const brand=identification.brand||null;

    /*
      IMPORTANT PRODUCT-TRUTH RULE
      ----------------------------
      FindIt must not turn a product search into directions to a random shop that
      merely sells the same CATEGORY. A shoe shop is not proof that it has the
      exact Nike shoe; an optician is not proof that it has the exact frame.

      This endpoint therefore returns map/direction stores ONLY when branch-level
      product availability is verified by an authorised retailer source.

      The current imported Awin/SmartBuyGlasses catalogue contains product-level
      prices/listings, but does not provide reliable physical branch coordinates
      plus branch stock. Until a retailer feed supplies that data, exact-store
      directions stay hidden instead of being invented.
    */

    return res.status(200).json({
      ok:true,
      retailGroup:norm(identification.retailCategory||identification.category||"product"),
      radiusKm,
      stores:[],
      reliable:true,
      exactProductOnly:true,
      branchStockVerified:false,
      item,
      brand,
      message:`${brand?brand+" ":""}${item}: no verified physical branch with confirmed stock is connected yet. FindIt will not send you to a random category store.`,
      disclaimer:"Directions are shown only when an authorised retailer source confirms the exact product at a specific physical branch."
    });
  }catch(e){
    console.error("nearby",e);
    return res.status(503).json({ok:false,reliable:false,stores:[],error:"Exact-store availability is temporarily unavailable."});
  }
}
