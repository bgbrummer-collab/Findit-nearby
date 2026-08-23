export function normalizeText(value=''){
  return String(value||'').toLowerCase().replace(/&amp;/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}

export function parseMoney(value){
  if(value==null)return null;
  let s=String(value).replace(/\s/g,'').replace(/[^0-9.,]/g,'');
  if(!s)return null;
  if(s.includes(',')&&s.includes('.'))s=s.replace(/,/g,'');
  else if(s.includes(',')&&!s.includes('.')){
    const p=s.split(',');
    s=p.at(-1).length===2?p.slice(0,-1).join('')+'.'+p.at(-1):p.join('');
  }
  const n=Number(s);
  return Number.isFinite(n)&&n>0&&n<10000000?n:null;
}

export function makroAvailabilityFromText(text=''){
  const n=normalizeText(text);
  if(/available online only/.test(n))return {online:true,pickup:false,branchStockVerified:false,status:'online_only'};
  if(/unavailable near you|out of stock|sold out|not available/.test(n))return {online:false,pickup:false,branchStockVerified:false,status:'unavailable'};
  if(/pickup|store pickup|store collection/.test(n))return {online:/delivery|add to cart|available online/.test(n),pickup:true,branchStockVerified:false,status:'pickup_possible'};
  if(/delivery|add to cart|available online|in stock/.test(n))return {online:true,pickup:false,branchStockVerified:false,status:'online_available'};
  return {online:null,pickup:null,branchStockVerified:false,status:'unknown'};
}

export function exactProductScore({query='',brand='',model=''}, candidate=''){
  const q=normalizeText(query);
  const c=normalizeText(candidate);
  if(!q||!c)return 0;
  const stop=new Set(['the','and','for','with','from','this','that','pair','new','white','black','small','large','men','women','unisex','pack','set']);
  const terms=[...new Set(q.split(' ').filter(x=>x.length>1&&!stop.has(x)))];
  const hits=terms.filter(t=>c.includes(t)).length;
  let score=terms.length?hits/terms.length:0;
  const b=normalizeText(brand),m=normalizeText(model);
  if(b){if(!c.includes(b))return 0;score+=0.18;}
  if(m){if(!c.includes(m))return 0;score+=0.28;}
  return Math.min(1,score);
}

export function canShowDirections(offer){
  return Boolean(
    offer &&
    offer.exactProductMatch===true &&
    offer.branchStockVerified===true &&
    Number.isFinite(Number(offer.lat)) &&
    Number.isFinite(Number(offer.lon))
  );
}

export const RETAILER_CAPABILITIES={
  Makro:{
    priceScope:'online',
    onlineAvailability:true,
    pickupSignal:true,
    branchStockRequiresLocationVerification:true,
    directionsRequiresVerifiedBranch:true,
    note:'Makro web price is not automatically a physical-store price. Pickup can indicate store fulfilment, but branch stock must still be verified.'
  },
  Checkers:{priceScope:'location_dependent',onlineAvailability:true,pickupSignal:true,branchStockRequiresLocationVerification:true,directionsRequiresVerifiedBranch:true},
  'Pick n Pay':{priceScope:'location_dependent',onlineAvailability:true,pickupSignal:true,branchStockRequiresLocationVerification:true,directionsRequiresVerifiedBranch:true},
  Shoprite:{priceScope:'location_dependent',onlineAvailability:true,pickupSignal:true,branchStockRequiresLocationVerification:true,directionsRequiresVerifiedBranch:true},
  Woolworths:{priceScope:'location_dependent',onlineAvailability:true,pickupSignal:true,branchStockRequiresLocationVerification:true,directionsRequiresVerifiedBranch:true},
  Builders:{priceScope:'online',onlineAvailability:true,pickupSignal:true,branchStockRequiresLocationVerification:true,directionsRequiresVerifiedBranch:true},
  Game:{priceScope:'online',onlineAvailability:true,pickupSignal:true,branchStockRequiresLocationVerification:true,directionsRequiresVerifiedBranch:true},
  'Incredible Connection':{priceScope:'online',onlineAvailability:true,pickupSignal:true,branchStockRequiresLocationVerification:true,directionsRequiresVerifiedBranch:true},
  Takealot:{priceScope:'online',onlineAvailability:true,pickupSignal:false,branchStockRequiresLocationVerification:false,directionsRequiresVerifiedBranch:false}
};
