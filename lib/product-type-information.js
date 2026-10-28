// General buying guidance, never a specification of an unidentified SKU.
export function productTypeInformation(i={}) {
 if(i.identityScope==='brand')return null;
 const t=[i.object,i.name,i.category,i.retailCategory].join(' ').toLowerCase();
 const types=[
 [/toilet paper|toilet tissue|toilet rolls?/, 'Toilet paper is disposable paper used for personal hygiene.', 'Compare the roll count, number of plies and sheets per roll; a larger pack does not always contain more paper. Check the package for added fragrance or lotion and confirm the exact range before comparing prices.'],
 [/floor.*paint|stoep.*paint/, 'Floor and stoep paint coats suitable floor surfaces.', 'Before using it outdoors, check the exact tin or manufacturer data sheet for approved surfaces, preparation, primer, drying and recoating times, coverage and exterior suitability. Confirm the colour and tin volume before comparing prices.'],
 [/\bpaint\b/, 'Paint coats and colours surfaces.', 'Check the label for the intended surface and interior or exterior use. Preparation, primer, coverage and drying times depend on the formulation; follow its manufacturer instructions. Confirm the colour, finish and tin volume.'],
 [/facial tissue|\btissues\b/, 'Facial tissues are disposable paper sheets for wiping the nose and face.', 'Compare the sheet count, number of plies and number of boxes. Facial tissues and toilet paper are different products. Do not assume a pictured tissue box is flushable.'],
 [/shoe|sneaker|footwear|trainer/, 'Shoes protect and support the feet; suitability depends on the design and fit.', 'Check the style code inside the shoe or on its box to confirm the model and colourway. Confirm the size system, fit and returns policy. A sneaker photograph alone does not establish suitability for running.'],
 [/microphone|\bmic\b/, 'A microphone converts sound into an audio signal for recording or amplification.', 'Check the model marking and connections before buying. Some models connect by USB; XLR models need compatible audio equipment. Confirm whether the interface, cable, stand and any required power are included or sold separately.'],
 [/deodorant|anti[ -]?perspirant/, 'Deodorant helps control body odour; anti-perspirant also helps reduce sweating.', 'Confirm the exact range, aerosol or roll-on format and pack volume. Protection-duration claims, ingredients, application directions and warnings need evidence from the current product label. Do not infer a fragrance or formula from the can colour.'],
 [/conditioner/, 'Hair conditioner helps hair feel softer and easier to detangle.', 'Check whether it is rinse-out or leave-in, the pack size, ingredients and the label directions. Suitability depends on your hair and the formulation.'],
 [/headphone|headset|earbud/, 'Headphones provide private audio listening.', 'Check wired or wireless connections, device compatibility, fit and whether a microphone is included. Battery life and noise cancellation need model-specific evidence.'],
 [/drill|screwdriver/, 'A drill makes holes; some models also drive screws or have an impact mode.', 'Check the exact model, supported materials, chuck capacity and power source. Battery platforms are not interchangeable by default. Check whether the battery, charger and bits are included.'],
 [/jeans|shirt|\bdress(?:es)?\b|trousers|clothing|apparel/, 'Clothing fit and comfort depend on the garment cut, measurements and fabric.', 'Check the item code, size chart, colour, fabric composition and care label. Similar styles may use different materials or fits. Confirm returns terms before choosing a size.'],
 [/bookcase|bookshelf|sofa|chair|wardrobe|furniture|\b(?:dressing|coffee|dining|bedside) tables?\b/, 'Furniture provides storage, seating or a work surface according to its design.', 'Measure the available space and delivery access. Check exact dimensions, materials, load limits, assembly requirements and delivery charges. Follow the manufacturer’s wall anchoring instructions where applicable.'],
 [/lego|building blocks|puzzle|board game|\btoy\b/, 'Toys and construction sets support play; contents and suitable ages depend on the exact set.', 'Match the set or model number and check age guidance, included pieces, small parts warnings and whether batteries or other equipment are required. A similar-looking set can have different contents.'],
 [/food|grocery|beverage|soft drink|coca.cola|cereal|coffee|biscuits/, 'Packaged food and drinks should be compared by the exact recipe, pack size and number of units.', 'Read the current package for ingredients, allergens, nutrition, storage and expiry information. Recipes and nutrition can differ by country. Check unit prices and whether a promotion requires multiple packs or a loyalty card.']
 ];
 const found=types.find(([re])=>re.test(t));return found?{overview:found[1],buyingChecks:found[2],scope:'general-product-type'}:null;
}

// Questions are guidance, never inferred specifications. Shared by complete and
// partial Product Info so an uncertain photo still has a useful next step.
export function productInformationChecklist(i={}) {
 const t=[i.object,i.name,i.category,i.retailCategory].join(' ').toLowerCase();
 const rows=[
  [/deodorant|anti[ -]?perspirant/,['Exact range, scent and aerosol or roll-on format','Pack volume and current ingredient list','Published application directions and aerosol / skin warnings'], 'Photograph the front label, barcode and directions / ingredients on the back.'],
  [/conditioner|shampoo|hair care|styling cream/,['Exact range and rinse-out or leave-in formulation','Pack volume and current ingredient list','Published directions and warnings'], 'Photograph the front label and the directions / ingredients on the back.'],
  [/shoe|sneaker|footwear|trainer/,['Style / article code and exact colourway','Size and size system (UK, US or EU)','Published materials, fit and care instructions'], 'Photograph the tongue or inner size label and the box label, including the style code.'],
  [/headphone|headset|earbud|microphone|speaker/,['Model / part number and wired or wireless version','Connector and supported devices; software requirements may differ','Microphone, cables, adapters and other included accessories'], 'Photograph the model / part-number label and the connectors or box label.'],
  [/drill|screwdriver|power tool/,['Exact model and kit code','Battery platform, voltage and included battery / charger','Published capacity, operating modes and supported materials'], 'Photograph the tool nameplate and the kit contents / model label.'],
  [/paint/,['Exact paint range, colour, finish and tin volume','Approved surfaces and indoor / outdoor suitability','Preparation, primer, coverage and drying instructions'], 'Photograph the tin label, colour / batch sticker and application instructions.'],
  [/food|grocery|drink|beverage|cereal/,['Exact recipe, pack quantity and country of sale','Current ingredients, allergens and nutrition label','Storage instructions and best-before / expiry date'], 'Photograph the front, barcode and ingredients / nutrition label.'],
  [/shirt|jeans|dress|clothing|apparel|trousers/,['Article code, colour and size chart','Fabric composition, garment measurements and fit','Care label and included items'], 'Photograph the article / size label and fabric / care label.'],
  [/toy|lego|puzzle|building block/,['Set / model number and edition','Published age guidance and piece count','Included parts and any required batteries or other equipment'], 'Photograph the set number and contents / age-guidance panel.']
 ];
 const row=rows.find(([pattern])=>pattern.test(t));
 return {checks:row?row[1]:['Exact model / article code and variant','Size, quantity, material and included items','Published instructions, compatibility and limitations'],nextPhoto:row?row[2]:'Photograph the product label or nameplate, model / article code and barcode.'};
}
