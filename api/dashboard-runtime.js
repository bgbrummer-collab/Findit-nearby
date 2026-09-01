export default async function handler(req,res){
  try{
    const r=await fetch('https://raw.githubusercontent.com/bgbrummer-collab/Findit-nearby/main/dashboard-runtime-stable.js',{headers:{'user-agent':'FindIt-Nearby'}});
    if(!r.ok)throw new Error(`Base dashboard runtime ${r.status}`);
    const base=await r.text();
    const addon=`\n;(()=>{if(document.querySelector('script[data-findit-complete]'))return;const s=document.createElement('script');s.src='/dashboard-completeness-fix.js?v=20260901-complete1';s.defer=true;s.dataset.finditComplete='1';document.head.appendChild(s)})();\n`;
    res.setHeader('content-type','application/javascript; charset=utf-8');
    res.setHeader('cache-control','public, max-age=0, must-revalidate');
    return res.status(200).send(base+addon);
  }catch(e){
    res.setHeader('content-type','application/javascript; charset=utf-8');
    return res.status(200).send(`console.error(${JSON.stringify('FindIt dashboard runtime could not load')});`);
  }
}
