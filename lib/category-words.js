// Category cues are words or phrases, never arbitrary fragments of a product
// name (e.g. bass in bassinet, synth in synthetic, or pan in Panasonic).
const patterns=new Map();
export function categoryWords(pattern,value){
 const flags=pattern.flags.replace(/[gy]/g,''),key=flags+'|'+pattern.source;
 let bounded=patterns.get(key);
 if(!bounded){bounded=new RegExp('(?:^|[^A-Za-z0-9])(?:'+pattern.source+')(?:s|es)?(?=$|[^A-Za-z0-9])',flags);patterns.set(key,bounded);}
 return bounded.test(String(value||''));
}
