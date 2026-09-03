import handler from '../api/product-insights.js';

const oldKey=process.env.GEMINI_API_KEY;
delete process.env.GEMINI_API_KEY;

async function runCase(label,identification,must,reject){
  let status=200,payload=null;
  const req={method:'POST',query:{},body:{identification,offers:[]}};
  const res={setHeader(){},status(n){status=n;return this},json(v){payload=v;return this}};
  await handler(req,res);
  console.log(`\n--- ${label} ---`);
  console.log(JSON.stringify(payload,null,2));
  if(status!==200)throw new Error(`${label}: status ${status}`);
  if(!payload?.researched)throw new Error(`${label}: live web research returned no exact-product research`);
  const summary=[payload.whatItDoes,...(payload.pros||[]),...(payload.cons||[])].join(' ');
  if(!must.test(summary))throw new Error(`${label}: live research is not useful product evidence: ${summary}`);
  if(reject?.test(summary))throw new Error(`${label}: live research accepted junk/noise: ${summary}`);
  if(!(payload.sources||[]).length)throw new Error(`${label}: live web research missing source pages`);
  return payload;
}

await runCase(
  'Marc Anthony conditioner',
  {brand:'Marc Anthony',model:'Strictly Curls 3X Moisture Triple Blend Conditioner',name:'Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml',object:'conditioner',retailCategory:'beauty',searchQuery:'Marc Anthony Strictly Curls 3X Moisture Triple Blend Conditioner 250ml'},
  /conditioner|curl|hair|moistur|detang|frizz|marula|shea/i,
  /bibliographic|marc standards|pharmacy fresh savings|marcus|captcha|robot or human/i
);

await runCase(
  'PROAAR USB microphone',
  {brand:'PROAAR',model:'USB microphone',name:'PROAAR USB microphone',object:'microphone',retailCategory:'electronics',searchQuery:'PROAAR USB microphone'},
  /microphone|record|stream|podcast|plug.?and.?play|usb|cardioid|voice/i,
  /amazon\.com b microphone microphone|robot or human|captcha|access denied|search result evidence$/i
);

if(oldKey!==undefined)process.env.GEMINI_API_KEY=oldKey;
console.log('\nPRODUCT_WEB_LIVE_INTEGRATION_PASS');
