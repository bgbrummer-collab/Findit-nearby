from pathlib import Path
p=Path('api/product-intelligence-v2.js')
s=p.read_text()
old="result=await augmentRetailerCoverage(result,body);result=sanitizeExact(result,body);result=await universalGroundedRecovery(body,result);result=await verifyAllOffersAtSource(result,body);result=sanitizeExact(result,body);return res.status(200).json(result)"
new="result=await augmentRetailerCoverage(result,body);result=sanitizeExact(result,body);result=await verifyAllOffersAtSource(result,body);result=sanitizeExact(result,body);result=await universalGroundedRecovery(body,result);result=await verifyAllOffersAtSource(result,body);result=sanitizeExact(result,body);return res.status(200).json(result)"
if old not in s:
    raise SystemExit('target handler pipeline not found')
s=s.replace(old,new,1)
p.write_text(s)
print('patched post-verification exact retailer recovery')
