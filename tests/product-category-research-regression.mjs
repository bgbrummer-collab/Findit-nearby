import handler from '../api/product-insights.js';

const oldFetch=global.fetch,oldKey=process.env.GEMINI_API_KEY;
process.env.GEMINI_API_KEY='test-key';

const cases=[
 {label:'beauty',exactUrl:'https://marcanthony.com/products/strictly-curls-conditioner',identification:{brand:'Marc Anthony',model:'Strictly Curls 3X Moisture Triple Blend Conditioner',name:'Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml',object:'conditioner',retailCategory:'beauty',searchQuery:'Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml'},page:'Title: Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner\nMarc Anthony Strictly Curls conditioner is formulated to moisturize and detangle curly hair while helping reduce frizz. It contains marula oil, coconut and shea butter.',ai:{researched:true,whatItDoes:'Moisturizes and detangles curly hair while helping reduce frizz.',pros:['Helps restore moisture to curls.','Helps improve detangling and manageability.'],cons:['Contains fragrance, which may matter to fragrance-sensitive users.'],bestFor:'Dry or frizz-prone curls.',standOut:'Uses a moisture-focused oil and butter blend.',valueVerdict:''},must:/moistur|detang|frizz/i},
 {label:'household',exactUrl:'https://www.checkers.co.za/product/twinsaver-twin-ply-18-rolls-123',identification:{brand:'Twinsaver',model:'Twin Ply 18 Rolls',name:'Twinsaver Twin Ply 18 Rolls Toilet Paper Pack',object:'toilet paper',retailCategory:'grocery/household',searchQuery:'Twinsaver Twin Ply 18 Rolls Toilet Paper Pack'},page:'Title: Twinsaver Twin Ply 18 Rolls Toilet Paper\nTwinsaver Twin Ply 18 Rolls is a household toilet tissue pack made with two-ply sheets. The product is designed for everyday bathroom use and emphasizes softness, strength and absorbency. The pack contains 18 rolls.',ai:{researched:true,whatItDoes:'A two-ply toilet tissue pack for everyday household bathroom use.',pros:['18-roll pack provides a larger household quantity.','Two-ply construction is designed to balance softness and strength.','Product information highlights absorbency for everyday use.'],cons:[],bestFor:'Households buying toilet tissue in a larger pack.',standOut:'Combines two-ply construction with an 18-roll pack size.',valueVerdict:''},must:/two-ply|toilet|household/i},
 {label:'electronics',exactUrl:'https://www.sony.com/product/wh-1000xm6',identification:{brand:'Sony',model:'WH-1000XM6',name:'Sony WH-1000XM6 Wireless Noise Cancelling Headphones',object:'headphones',retailCategory:'electronics',searchQuery:'Sony WH-1000XM6 headphones'},page:'Title: Sony WH-1000XM6 Wireless Noise Cancelling Headphones\nSony WH-1000XM6 wireless headphones provide active noise cancelling, Bluetooth audio, microphones for calls and a rechargeable battery.',ai:{researched:true,whatItDoes:'Wireless headphones that provide Bluetooth listening, active noise cancellation and hands-free calls.',pros:['Active noise cancellation reduces surrounding noise.','Wireless Bluetooth playback supports cable-free listening.'],cons:['Requires battery power for wireless and active features.'],bestFor:'Travel and everyday wireless listening.',standOut:'Combines wireless audio with active noise cancellation.',valueVerdict:''},must:/noise|wireless|bluetooth/i},
 {label:'footwear',exactUrl:'https://www.nike.com/za/t/air-force-1-07-shoes',identification:{brand:'Nike',model:"Air Force 1 '07",name:"Nike Air Force 1 '07 Shoes",object:'shoes',retailCategory:'footwear',searchQuery:"Nike Air Force 1 '07 shoes"},page:"Title: Nike Air Force 1 '07 Shoes\nNike Air Force 1 '07 shoes use a leather upper, Nike Air cushioning and a rubber outsole. The design is made for everyday casual wear.",ai:{researched:true,whatItDoes:'A casual sneaker designed for everyday wear with cushioning and a rubber outsole.',pros:['Nike Air cushioning supports underfoot comfort.','Leather upper provides a structured construction.'],cons:['Leather construction can require more care than some textile uppers.'],bestFor:'Everyday casual wear.',standOut:'Classic Air Force 1 construction with Nike Air cushioning.',valueVerdict:''},must:/sneaker|cushion|everyday/i},
 {label:'hardware',exactUrl:'https://www.builders.co.za/product/bosch-gsb-13-re-drill',identification:{brand:'Bosch',model:'GSB 13 RE',name:'Bosch GSB 13 RE Impact Drill',object:'drill',retailCategory:'hardware',searchQuery:'Bosch GSB 13 RE Impact Drill'},page:'Title: Bosch GSB 13 RE Impact Drill\nBosch GSB 13 RE is an impact drill for drilling in masonry, wood and metal. It includes variable speed control and forward/reverse rotation.',ai:{researched:true,whatItDoes:'An impact drill for drilling common materials including masonry, wood and metal.',pros:['Variable speed control supports different drilling tasks.','Forward and reverse rotation adds practical control.'],cons:['Corded operation requires access to mains power.'],bestFor:'General DIY and drilling tasks.',standOut:'Compact impact-drill format with variable speed.',valueVerdict:''},must:/drill|masonry|wood|metal/i},
 {label:'stationery',exactUrl:'https://www.pna.co.za/product/casio-fx-82za-plus-ii',identification:{brand:'Casio',model:'fx-82ZA Plus II',name:'Casio fx-82ZA Plus II Scientific Calculator',object:'calculator',retailCategory:'stationery',searchQuery:'Casio fx-82ZA Plus II Scientific Calculator'},page:'Title: Casio fx-82ZA Plus II Scientific Calculator\nThe Casio fx-82ZA Plus II is a scientific calculator for school mathematics and science calculations, with fraction, statistics and scientific functions.',ai:{researched:true,whatItDoes:'A scientific calculator for school mathematics and science calculations.',pros:['Includes scientific calculation functions.','Supports fraction and statistics calculations.'],cons:[],bestFor:'School mathematics and science work.',standOut:'Scientific functions in a school-focused calculator.',valueVerdict:''},must:/calculator|scientific|math/i}
];

let current=null;
global.fetch=async(url)=>{
 const u=String(url);
 if(!current)throw new Error('No active case');
 if(u===`https://r.jina.ai/${current.exactUrl}`||u===current.exactUrl)return new Response(current.page,{status:200,headers:{'content-type':'text/plain'}});
 if(u.includes('generativelanguage.googleapis.com'))return new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(current.ai)}]}}]}),{status:200,headers:{'content-type':'application/json'}});
 if(u.startsWith('https://r.jina.ai/'))return new Response(`Title: Product Search\n\n[Exact ${current.label} product](${current.exactUrl})`,{status:200,headers:{'content-type':'text/plain'}});
 if(/google\.com\/search|bing\.com\/search|duckduckgo\.com\/html|\/search\?|catalogsearch|\/cat\?Ntt=/i.test(u))return new Response(`<html><body><a href="${current.exactUrl}">Exact product</a></body></html>`,{status:200,headers:{'content-type':'text/html'}});
 return new Response('Not found',{status:404});
};

for(const c of cases){
 current=c;let status=200,payload=null;
 const req={method:'POST',query:{},body:{identification:c.identification,offers:[]}};
 const res={setHeader(){},status(n){status=n;return this},json(v){payload=v;return this}};
 await handler(req,res);
 if(status!==200)throw new Error(`${c.label}: status ${status}`);
 if(!payload?.researched)throw new Error(`${c.label}: research not produced`);
 if(!c.must.test(payload.whatItDoes||''))throw new Error(`${c.label}: bad whatItDoes ${payload.whatItDoes}`);
 if((payload.pros||[]).length<2)throw new Error(`${c.label}: pros missing ${JSON.stringify(payload.pros)}`);
 if(payload.researchMethod!=='Web search + source-grounded AI summary')throw new Error(`${c.label}: wrong method ${payload.researchMethod}`);
 if((payload.sources||[]).length<1)throw new Error(`${c.label}: sources missing`);
 console.log(`[PASS] ${c.label} exact-product research`);
}

global.fetch=oldFetch;if(oldKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=oldKey;
console.log('PRODUCT_CATEGORY_RESEARCH_REGRESSION_PASS');
