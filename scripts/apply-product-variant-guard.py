from pathlib import Path
p=Path('api/product-insights.js')
s=p.read_text()

if 'function variantMeasures(v)' not in s:
    marker='function titleOf(raw, url) {'
    guard=r'''function variantMeasures(v) {
  const n = norm(v), out = { ply: new Set(), rolls: new Set(), ml: new Set(), gb: new Set(), tb: new Set(), oz: new Set() };
  if (/\b(?:twin|two) ply\b/.test(n)) out.ply.add('2');
  for (const m of n.matchAll(/\b(\d+)ply\b/g)) out.ply.add(m[1]);
  for (const m of n.matchAll(/\b(\d+)rolls?\b/g)) out.rolls.add(m[1]);
  for (const m of n.matchAll(/\b(\d+)ml\b/g)) out.ml.add(m[1]);
  for (const m of n.matchAll(/\b(\d+)gb\b/g)) out.gb.add(m[1]);
  for (const m of n.matchAll(/\b(\d+)tb\b/g)) out.tb.add(m[1]);
  for (const m of n.matchAll(/\b(\d+)oz\b/g)) out.oz.add(m[1]);
  return out;
}

function titleVariantConflict(title, i) {
  const wanted = variantMeasures(`${i.model || ''} ${i.name || ''} ${i.searchQuery || ''}`);
  const found = variantMeasures(title || '');
  for (const key of Object.keys(wanted)) {
    if (!wanted[key].size || !found[key].size) continue;
    if (![...wanted[key]].some(v => found[key].has(v))) return true;
  }
  return false;
}

'''
    if marker not in s: raise SystemExit('title marker missing')
    s=s.replace(marker,guard+marker,1)

old="""  if (BLOCKPAGE.test(`${title} ${text.slice(0, 6000)}`)) return null;
  if (/\\b(search|search results|results for)\\b/i.test(title)) return null;"""
new="""  if (BLOCKPAGE.test(`${title} ${text.slice(0, 6000)}`)) return null;
  if (/\\b(search|search results|results for)\\b/i.test(title)) return null;
  if (titleVariantConflict(title, i)) return null;"""
if old not in s: raise SystemExit('productPage marker missing')
s=s.replace(old,new,1)

old2="""    if (BLOCKPAGE.test(`${title} ${text}`)) return;
    const score = resultEvidenceScore(`${title} ${text}`, i);"""
new2="""    if (BLOCKPAGE.test(`${title} ${text}`)) return;
    if (titleVariantConflict(title, i)) return;
    const score = resultEvidenceScore(`${title} ${text}`, i);"""
if old2 not in s: raise SystemExit('snippet marker missing')
s=s.replace(old2,new2,1)

p.write_text(s)
print('PRODUCT_VARIANT_GUARD_PATCHED')
