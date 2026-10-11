// General buying guidance, never a specification of an unidentified SKU.
export function productTypeInformation(i={}) {
 if(i.identityScope==='brand')return null;
 const t=[i.object,i.name,i.category,i.retailCategory].join(' ').toLowerCase();
 const types=[
 [/floor.*paint|stoep.*paint/, 'Floor and stoep paint coats suitable floor surfaces.', 'Before using it outdoors, check the exact tin or manufacturer data sheet for approved surfaces, preparation, primer, drying and recoating times, coverage and exterior suitability. Confirm the colour and tin volume before comparing prices.'],
 [/\bpaint\b/, 'Paint coats and colours surfaces.', 'Check the label for the intended surface and interior or exterior use. Preparation, primer, coverage and drying times depend on the formulation; follow its manufacturer instructions. Confirm the colour, finish and tin volume.'],
 [/facial tissue|\btissues\b/, 'Facial tissues are disposable paper sheets for wiping the nose and face.', 'Compare the sheet count, number of plies and number of boxes. Facial tissues and toilet paper are different products. Do not assume a pictured tissue box is flushable.'],
 [/shoe|sneaker|footwear|trainer/, 'Shoes protect and support the feet; suitability depends on the design and fit.', 'Check the style code inside the shoe or on its box to confirm the model and colourway. Confirm the size system, fit and returns policy. A sneaker photograph alone does not establish suitability for running.'],
 [/microphone|\bmic\b/, 'A microphone converts sound into an audio signal for recording or amplification.', 'Check the model marking and connections before buying. Some models connect by USB; XLR models need compatible audio equipment. Confirm whether the interface, cable, stand and any required power are included or sold separately.'],
 [/conditioner/, 'Hair conditioner helps hair feel softer and easier to detangle.', 'Check whether it is rinse-out or leave-in, the pack size, ingredients and the label directions. Suitability depends on your hair and the formulation.'],
 [/headphone|headset|earbud/, 'Headphones provide private audio listening.', 'Check wired or wireless connections, device compatibility, fit and whether a microphone is included. Battery life and noise cancellation need model-specific evidence.']
 ];
 const found=types.find(([re])=>re.test(t));return found?{overview:found[1],buyingChecks:found[2],scope:'general-product-type'}:null;
}
