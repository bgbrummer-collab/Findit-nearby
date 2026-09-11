import fs from 'node:fs';

function patch(path, replacements) {
  let text = fs.readFileSync(path, 'utf8');
  for (const [from, to, label] of replacements) {
    if (text.includes(to)) {
      console.log(`Already patched ${path}: ${label}`);
      continue;
    }
    if (!text.includes(from)) throw new Error(`${path}: expected ${label} block was not found`);
    text = text.replace(from, to);
  }
  fs.writeFileSync(path, text);
  console.log(`Patched ${path}`);
}

patch('api/product-intelligence-v2.js', [
  [
    "if(/\\/(search|category|categories|collections?|brands?|browse|blog|blogs|news|article|articles)(\\/|$)/.test(p))return false;if(h==='nike.com'||h.endsWith('.nike.com'))",
    "if(/\\/(search|category|categories|collections?|brands?|browse|blog|blogs|news|article|articles)(\\/|$)/.test(p))return false;if((h==='logitech.com'||h.endsWith('.logitech.com'))&&/^\\/[^/]*\\/shop\\/c(?:\\/|$)|^\\/shop\\/c(?:\\/|$)/.test(p))return false;if(h==='nike.com'||h.endsWith('.nike.com'))",
    'generic product page filter'
  ],
  [
    "function productTypeConflict(o,request={}){const i=reqIdentity(request),wanted=`${clean(i.object)} ${clean(i.category)} ${clean(i.retailCategory)} ${clean(i.name)} ${clean(i.model)} ${clean(i.searchQuery||i.query)}`.toLowerCase(),candidate=`${clean(o?.product_name||o?.title)} ${clean(o?.product_url||o?.url)}`.toLowerCase();const has=(s,re)=>re.test(s);if(has(wanted,/\\bconditioner\\b/)&&has(candidate,/\\bshampoo\\b/)&&!has(candidate,/\\bconditioner\\b/))return true;if(has(wanted,/\\bshampoo\\b/)&&has(candidate,/\\bconditioner\\b/)&&!has(candidate,/\\bshampoo\\b/))return true;if(has(wanted,/\\b(?:microphone|\\bmic\\b)\\b/)&&has(candidate,/\\b(?:headphones?|headsets?|earbuds?)\\b/)&&!has(candidate,/\\b(?:microphone|\\bmic\\b)\\b/))return true;if(has(wanted,/\\b(?:headphones?|headsets?|earbuds?)\\b/)&&has(candidate,/\\b(?:microphone|\\bmic\\b)\\b/)&&!has(candidate,/\\b(?:headphones?|headsets?|earbuds?)\\b/))return true;return false}",
    "function productTypeConflict(o,request={}){const i=reqIdentity(request),wanted=`${clean(i.object)} ${clean(i.category)} ${clean(i.retailCategory)} ${clean(i.name)} ${clean(i.model)} ${clean(i.searchQuery||i.query)}`.toLowerCase(),candidate=`${clean(o?.product_name||o?.title)} ${clean(o?.product_url||o?.url)}`.toLowerCase();const has=(s,re)=>re.test(s),audio=/\\b(?:headphones?|headsets?|earbuds?)\\b/,mic=/\\b(?:microphone|mic)\\b/,mouse=/\\bmouse\\b/,keyboard=/\\bkeyboard\\b/,camera=/\\b(?:camera|webcam)\\b/,speaker=/\\bspeakers?\\b/,controller=/\\b(?:controller|gamepad)\\b/,shoe=/\\b(?:shoe|shoes|sneaker|sneakers|footwear|trainer|trainers|boot|boots)\\b/,drill=/\\b(?:drill|driver|hammer drill)\\b/;if(has(wanted,/\\bconditioner\\b/)&&has(candidate,/\\bshampoo\\b/)&&!has(candidate,/\\bconditioner\\b/))return true;if(has(wanted,/\\bshampoo\\b/)&&has(candidate,/\\bconditioner\\b/)&&!has(candidate,/\\bshampoo\\b/))return true;if(has(wanted,audio)&&(!has(candidate,audio)||has(candidate,mouse)||has(candidate,keyboard)||has(candidate,camera)||has(candidate,speaker)||has(candidate,controller)))return true;if(has(wanted,mic)&&has(candidate,audio)&&!has(candidate,mic))return true;if(has(wanted,mouse)&&!has(candidate,mouse))return true;if(has(wanted,keyboard)&&!has(candidate,keyboard))return true;if(has(wanted,camera)&&!has(candidate,camera))return true;if(has(wanted,speaker)&&!has(candidate,speaker))return true;if(has(wanted,shoe)&&!has(candidate,shoe))return true;if(has(wanted,drill)&&!has(candidate,drill))return true;return false}",
    'product type conflict guard'
  ]
]);

patch('api/product-insights.js', [
  [
    "function titleVariantConflict(title, i) {\n  const wanted = variantMeasures(`${i.model || ''} ${i.name || ''} ${i.searchQuery || ''}`);\n  const found = variantMeasures(title || '');\n  for (const key of Object.keys(wanted)) {\n    if (!wanted[key].size || !found[key].size) continue;\n    if (![...wanted[key]].some(v => found[key].has(v))) return true;\n  }\n  return false;\n}\n",
    "function titleVariantConflict(title, i) {\n  const wanted = variantMeasures(`${i.model || ''} ${i.name || ''} ${i.searchQuery || ''}`);\n  const found = variantMeasures(title || '');\n  for (const key of Object.keys(wanted)) {\n    if (!wanted[key].size || !found[key].size) continue;\n    if (![...wanted[key]].some(v => found[key].has(v))) return true;\n  }\n  return false;\n}\n\nfunction researchTypeConflict(text, i) {\n  const wanted = norm(`${i.object || ''} ${i.category || ''} ${i.name || ''} ${i.model || ''} ${i.searchQuery || ''}`), candidate = norm(text);\n  const audio = /\\b(?:headphone|headphones|headset|headsets|earbud|earbuds)\\b/, mouse=/\\bmouse\\b/, keyboard=/\\bkeyboard\\b/, camera=/\\b(?:camera|webcam)\\b/, speaker=/\\bspeakers?\\b/, controller=/\\b(?:controller|gamepad)\\b/, mic=/\\b(?:microphone|mic)\\b/;\n  if (audio.test(wanted) && (!audio.test(candidate) || mouse.test(candidate) || keyboard.test(candidate) || camera.test(candidate) || speaker.test(candidate) || controller.test(candidate))) return true;\n  if (mouse.test(wanted) && !mouse.test(candidate)) return true;\n  if (keyboard.test(wanted) && !keyboard.test(candidate)) return true;\n  if (mic.test(wanted) && audio.test(candidate) && !mic.test(candidate)) return true;\n  if (/\\bconditioner\\b/.test(wanted) && /\\bshampoo\\b/.test(candidate) && !/\\bconditioner\\b/.test(candidate)) return true;\n  if (/\\bshampoo\\b/.test(wanted) && /\\bconditioner\\b/.test(candidate) && !/\\bshampoo\\b/.test(candidate)) return true;\n  return false;\n}\n",
    'research type conflict helper'
  ],
  [
    "  if (titleVariantConflict(title, i)) return null;\n  const score = identityScore(text, i, title);",
    "  if (titleVariantConflict(title, i)) return null;\n  if (researchTypeConflict(`${title} ${text.slice(0, 10000)}`, i)) return null;\n  const score = identityScore(text, i, title);",
    'product page type filter'
  ],
  [
    "    if (titleVariantConflict(title, i)) return;\n    const score = resultEvidenceScore(`${title} ${text}`, i);",
    "    if (titleVariantConflict(title, i)) return;\n    if (researchTypeConflict(`${title} ${text}`, i)) return;\n    const score = resultEvidenceScore(`${title} ${text}`, i);",
    'search snippet type filter'
  ],
  [
    "  for (const raw of Array.isArray(out.cons) ? out.cons : []) {\n    const x = cleanVisible(raw, i);\n    if (x && isNegativeEvidence(x)) addUnique(cons, x);\n  }\n  out.whatItDoes = what;\n  out.pros = pros.slice(0, 4);",
    "  for (const raw of Array.isArray(out.cons) ? out.cons : []) {\n    const x = cleanVisible(raw, i);\n    if (x && isNegativeEvidence(x)) addUnique(cons, x);\n  }\n  if (pros.length < 2) {\n    const evidencePros = [];\n    for (const p of pages || []) for (const raw of evidenceLines(p.text)) {\n      const x = cleanVisible(raw, i);\n      if (!x || researchTypeConflict(x, i) || isNegativeEvidence(x) || !POSITIVE_FACT.test(x) || sentenceScore(x, i) < 5) continue;\n      if (!evidencePros.some(y => norm(y) === norm(x))) evidencePros.push(x);\n    }\n    evidencePros.sort((a,b)=>sentenceScore(b,i)-sentenceScore(a,i));\n    for (const x of evidencePros) { addUnique(pros, x); if (pros.length >= 4) break; }\n  }\n  out.whatItDoes = what;\n  out.pros = pros.slice(0, 4);",
    'evidence-backed pro backfill'
  ],
  [
    "    return /^https?:\\/\\//i.test(u) && !/encrypted-tbn\\d*\\.gstatic\\.com|faviconv2|rstyle\\.me|linksynergy\\.|awin1\\./i.test(u) && !/^image\\s*\\d+$/i.test(t.trim());",
    "    return /^https?:\\/\\//i.test(u) && !researchTypeConflict(`${t} ${u}`, i) && !/encrypted-tbn\\d*\\.gstatic\\.com|faviconv2|rstyle\\.me|linksynergy\\.|awin1\\./i.test(u) && !/^image\\s*\\d+$/i.test(t.trim());",
    'source type filter'
  ],
  [
    "  if (!what || isNegativeEvidence(what) || fallbackNeedsBrand) what = bestPurpose(i, pages);",
    "  if (!what || isNegativeEvidence(what) || fallbackNeedsBrand || researchTypeConflict(what, i)) what = bestPurpose(i, pages);",
    'AI summary exact product type guard'
  ],
  [
    "    if (isNegativeEvidence(x)) addUnique(cons, x);\n    else if (POSITIVE_FACT.test(x)) addUnique(pros, x);",
    "    if (isNegativeEvidence(x)) addUnique(cons, x);\n    else if (!researchTypeConflict(x, i) && (POSITIVE_FACT.test(x) || sentenceScore(x, i) >= 5)) addUnique(pros, x);",
    'AI pro exactness and usefulness guard'
  ],
  [
    "    for (const x of evidencePros) { addUnique(pros, x); if (pros.length >= 4) break; }\n  }\n  out.whatItDoes = what;",
    "    for (const x of evidencePros) { addUnique(pros, x); if (pros.length >= 4) break; }\n  }\n  if (pros.length < 2) {\n    const extraEvidence = [];\n    for (const p of pages || []) for (const raw of evidenceLines(p.text)) {\n      const x = cleanVisible(raw, i);\n      if (!x || researchTypeConflict(x, i) || isNegativeEvidence(x) || sentenceScore(x, i) < 7 || norm(x) === norm(what)) continue;\n      if (!extraEvidence.some(y => norm(y) === norm(x))) extraEvidence.push(x);\n    }\n    extraEvidence.sort((a,b)=>sentenceScore(b,i)-sentenceScore(a,i));\n    for (const x of extraEvidence) { addUnique(pros, x); if (pros.length >= 2) break; }\n  }\n  out.whatItDoes = what;",
    'second evidence-backed pro backfill'
  ]
]);

patch('api/nearby.js', [
  [
    "function nearestPerRetailer(rows,limit=12,preferred=[]){const branches=dedupeBranches(rows,50).sort((a,b)=>preferredRank(a.name,preferred)-preferredRank(b.name,preferred)||a.distanceKm-b.distanceKm),seen=new Set(),out=[];for(const s of branches){const key=retailerChainKey(s.name);if(seen.has(key))continue;seen.add(key);out.push(s);if(out.length>=limit)break}return out}",
    "function nearestPerRetailer(rows,limit=12,preferred=[]){const branches=dedupeBranches(rows,50).sort((a,b)=>a.distanceKm-b.distanceKm),seen=new Set(),out=[];for(const s of branches){const key=retailerChainKey(s.name);if(seen.has(key))continue;seen.add(key);out.push(s)}return out.sort((a,b)=>a.distanceKm-b.distanceKm).slice(0,limit)}",
    'nearest retailer ordering'
  ],
  [
    "(specialist retailers first, nearest branch per retailer).",
    "(closest relevant retailers first, nearest branch per retailer).",
    'nearby result message'
  ]
]);

console.log('All regression fixes applied.');
