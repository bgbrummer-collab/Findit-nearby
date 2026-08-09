// V11 authorised retailer connector template.
// The connector should accept visual/product intent and return ONLY verified data.
// Required normalised fields:
// {id,name,brand,image,category,retailer,price,currency,url,
//  store:{id,name,address,lat,lon},
//  stock:{status,quantity,updatedAt},match,distanceKm}
// Important: exact product confidence should be based on catalogue evidence,
// not merely on the image category.
