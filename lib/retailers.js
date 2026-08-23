const clean=v=>String(v??'').trim();
const norm=v=>clean(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();

export const RETAILERS=[
 {name:'Takealot',domain:'takealot.com',cats:['all'],priority:1,search:q=>`https://www.takealot.com/all?qsearch=${encodeURIComponent(q)}`,branchMode:'online_only',priceMode:'online'},
 {name:'Makro',domain:'makro.co.za',cats:['all'],priority:1,search:q=>`https://www.makro.co.za/search/?text=${encodeURIComponent(q)}`,branchMode:'pickup_location',priceMode:'online_location'},
 {name:'PriceCheck',domain:'pricecheck.co.za',cats:['all'],priority:4,search:q=>`https://www.pricecheck.co.za/search?search=${encodeURIComponent(q)}`,branchMode:'online_only',priceMode:'online'},
 {name:'Checkers',domain:'checkers.co.za',cats:['grocery','home'],priority:1,search:q=>`https://www.checkers.co.za/search?q=${encodeURIComponent(q)}`,branchMode:'location_required',priceMode:'local'},
 {name:'Pick n Pay',domain:'pnp.co.za',cats:['grocery','home'],priority:1,search:q=>`https://www.pnp.co.za/search?q=${encodeURIComponent(q)}`,branchMode:'location_required',priceMode:'local'},
 {name:'Shoprite',domain:'shoprite.co.za',cats:['grocery','home'],priority:2,search:q=>`https://www.shoprite.co.za/search?q=${encodeURIComponent(q)}`,branchMode:'location_required',priceMode:'local'},
 {name:'Woolworths',domain:'woolworths.co.za',cats:['grocery','home','clothing','beauty'],priority:2,search:q=>`https://www.woolworths.co.za/cat?Ntt=${encodeURIComponent(q)}`,branchMode:'location_required',priceMode:'local_or_online'},
 {name:'Nike',domain:'nike.com',cats:['footwear','clothing','sports'],brand:'nike',priority:1,search:q=>`https://www.nike.com/za/w?q=${encodeURIComponent(q)}`,branchMode:'online_only',priceMode:'online'},
 {name:'adidas',domain:'adidas.co.za',cats:['footwear','clothing','sports'],brand:'adidas',priority:1,search:q=>`https://www.adidas.co.za/search?q=${encodeURIComponent(q)}`,branchMode:'online_only',priceMode:'online'},
 {name:'Sportscene',domain:'sportscene.co.za',cats:['footwear','clothing','sports'],priority:1,search:q=>`https://www.sportscene.co.za/search?q=${encodeURIComponent(q)}`,branchMode:'location_required',priceMode:'local_or_online'},
 {name:'Totalsports',domain:'totalsports.co.za',cats:['footwear','clothing','sports'],priority:1,search:q=>`https://www.totalsports.co.za/search?q=${encodeURIComponent(q)}`,branchMode:'location_required',priceMode:'local_or_online'},
 {name:'Bash',domain:'bash.com',cats:['footwear','clothing','sports'],priority:2,search:q=>`https://bash.com/search?q=${encodeURIComponent(q)}`,branchMode:'location_required',priceMode:'local_or_online'},
 {name:'Superbalist',domain:'superbalist.com',cats:['footwear','clothing'],priority:3,search:q=>`https://superbalist.com/search?q=${encodeURIComponent(q)}`,branchMode:'online_only',priceMode:'online'},
 {name:'Sportsmans Warehouse',domain:'sportsmanswarehouse.co.za',cats:['sports','outdoor','footwear'],priority:3,search:q=>`https://www.sportsmanswarehouse.co.za/catalogsearch/result/?q=${encodeURIComponent(q)}`,branchMode:'location_required',priceMode:'local_or_online'},
 {name:'Incredible Connection',domain:'incredible.co.za',cats:['electronics'],priority:1,search:q=>`https://www.incredible.co.za/catalogsearch/result/?q=${encodeURIComponent(q)}`,branchMode:'location_required',priceMode:'local_or_online'},
 {name:'Game',domain:'game.co.za',cats:['electronics','appliances','home','toys','sports','hardware'],priority:1,search:q=>`https://www.game.co.za/search?q=${encodeURIComponent(q)}`,branchMode:'location_required',priceMode:'local_or_online'},
 {name:'HiFi Corp',domain:'hificorp.co.za',cats:['electronics','appliances'],priority:2,search:q=>`https://www.hificorp.co.za/catalogsearch/result/?q=${encodeURIComponent(q)}`,branchMode:'location_required',priceMode:'local_or_online'},
 {name:'Builders',domain:'builders.co.za',cats:['hardware','home','garden'],priority:1,search:q=>`https://www.builders.co.za/search?q=${encodeURIComponent(q)}`,branchMode:'location_required',priceMode:'local_or_online'},
 {name:'Leroy Merlin',domain:'leroymerlin.co.za',cats:['hardware','home','garden'],priority:2,search:q=>`https://leroymerlin.co.za/search?q=${encodeURIComponent(q)}`,branchMode:'location_required',priceMode:'local_or_online'},
 {name:'Clicks',domain:'clicks.co.za',cats:['beauty','health'],priority:2,search:q=>`https://clicks.co.za/search?text=${encodeURIComponent(q)}`,branchMode:'location_required',priceMode:'local_or_online'},
 {name:'Dis-Chem',domain:'dischem.co.za',cats:['beauty','health'],priority:2,search:q=>`https://www.dischem.co.za/catalogsearch/result/?q=${encodeURIComponent(q)}`,branchMode:'location_required',priceMode:'local_or_online'}
];

export function hostMatches(url,domain){
 try{const h=new URL(url).hostname.replace(/^www\./,'');return h===domain||h.endsWith('.'+domain)}catch{return false}
}

export function familyOf(v){
 const x=norm(v);
 if(/grocery|household|toilet paper|food|drink|supermarket|cleaning|detergent|snack/.test(x))return'grocery';
 if(/electronic|microphone|audio|computer|phone|camera|speaker|headphone|headset|gaming|laptop|monitor|keyboard|mouse|router|charger/.test(x))return'electronics';
 if(/appliance|fridge|washing machine|microwave|air fryer|dishwasher/.test(x))return'appliances';
 if(/shoe|sneaker|footwear|boot|trainer/.test(x))return'footwear';
 if(/clothing|clothes|fashion|shirt|dress|jacket|jeans|pants/.test(x))return'clothing';
 if(/sport|fitness|gym|soccer|rugby|cricket|tennis/.test(x))return'sports';
 if(/hardware|tool|drill|hammer|paint|plumbing|electrical|diy/.test(x))return'hardware';
 if(/garden|plant|flower/.test(x))return'garden';
 if(/beauty|perfume|cosmetic|skincare|makeup|shampoo/.test(x))return'beauty';
 if(/health|vitamin|pharmacy|medicine|personal care/.test(x))return'health';
 if(/sofa|chair|table|bed|home decor|furniture|homeware/.test(x))return'home';
 return'general';
}

export function selectedRetailers(q,b={}){
 const fam=familyOf([b.category,b.retailCategory,b.name,b.object,b.query,q].join(' '));
 const brand=norm(b.brand||q);
 let arr=RETAILERS.filter(r=>r.cats.includes('all')||r.cats.includes(fam));
 for(const r of RETAILERS){if(r.brand&&brand.includes(r.brand)&&!arr.includes(r))arr.unshift(r)}
 return [...new Map(arr.map(r=>[r.name,r])).values()].sort((a,z)=>(a.priority||9)-(z.priority||9));
}

export function capabilitySummary(profile,connected=false){
 if(!profile)return null;
 return {
  retailer:profile.name,
  domain:profile.domain,
  exactProductSearch:true,
  onlinePrice:true,
  onlineAvailability:true,
  branchStock:connected?'connected_feed':profile.branchMode,
  branchPrice:connected?'connected_feed':profile.priceMode,
  directionsAllowedOnlyWhenBranchVerified:true
 };
}

export function retailerByName(name){return RETAILERS.find(r=>norm(r.name)===norm(name))||null}
export function retailerByUrl(url){return RETAILERS.find(r=>hostMatches(url,r.domain))||null}
