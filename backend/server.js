import express from "express";
import multer from "multer";
import cors from "cors";
const app=express();
app.use(cors());
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:8*1024*1024}});
async function searchLiveCatalogue(){return []}
app.post("/api/search",upload.single("image"),async(req,res)=>{
  try{
    if(!req.file)return res.status(400).json({error:"image_required"});
    const products=await searchLiveCatalogue();
    res.json(products.length?{live:true,products}:{live:false,products:[],reason:"no_verified_catalogue_data"});
  }catch(e){console.error(e);res.status(500).json({error:"search_failed"})}
});
app.get("/health",(req,res)=>res.json({ok:true,service:"findit-v10"}));
app.listen(process.env.PORT||8787,()=>console.log("FindIt V10 backend running"));