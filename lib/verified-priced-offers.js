export function verifiedPricedOffers(offers){
 return (Array.isArray(offers)?offers:[]).filter(offer=>{
  if(!offer||typeof offer!=='object'||offer.verified!==true||offer.sourcePageVerified!==true)return false;
  const price=Number(offer.price);
  return Number.isFinite(price)&&price>0;
 });
}
