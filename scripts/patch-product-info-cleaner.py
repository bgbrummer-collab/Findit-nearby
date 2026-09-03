from pathlib import Path
import re

p = Path('api/product-insights.js')
s = p.read_text()

if 'const DISPLAY_JUNK =' not in s:
    detail = re.search(r"const DETAIL = .*?;", s)
    if not detail:
        raise SystemExit('DETAIL marker missing')
    extra = r'''
const DISPLAY_JUNK = /accessible version|data-testid|picturehighquality|\bsrc\s*=|\bhref\s*=|\balt\s*=|\bclass\s*=|\bstyle\s*=|javascript:|webpack|aria-|\bhttps?:\/\/|\\[nrt]|<[^>]+>/i;
const NEGATIVE_FACT = /static noise|background noise|breaks?|broke|broken|stability issues?|unstable|\bissues?\b|\bproblems?\b|drawback|limitation|difficult|tricky|struggle|\bpoor\b|\bweak\b|fragile|hiss|crackle|distortion|latency|may not|cannot|doesn.t|does not|requires?|not included|sold separately|only compatible|\bheavy\b|bulky|short battery|\blimited\b|warning|not suitable|disappoint|inconsistent/i;
const POSITIVE_FACT = /plug.?and.?play|compatible|clear|cardioid|noise cancel|monitor|gain|stand|adapter|durab|soft|strong|absorb|moistur|detang|cushion|battery|wireless|bluetooth|usb|easy|support|adjustable|portable|reliable|quality|stream|record|included|includes?|fast|comfort|protect|capacity|variable speed|leather|rubber|structured|construction|forward|reverse|control|scientific|fraction|statistics|calculation|function|two.?ply|2.?ply|rolls?/i;
const PURPOSE_FACT = /\b(is|are|designed|made|used|helps?|provides?|formulated|records?|recording|streaming|connects?|supports?|for voice|for gaming|for calls?|for podcast|for household|for bathroom|for school|for drilling|for listening)\b/i;
'''
    s = s[:detail.end()] + extra + s[detail.end():]

if 'function cleanVisible(v, i)' not in s:
    marker = 'function parseJson(v) {'
    if marker not in s:
        raise SystemExit('parse marker missing')
    cleaner = r'''function cleanVisible(v, i) {
  const original = String(v || '');
  if (DISPLAY_JUNK.test(original)) return '';
  const x = point(original
    .replace(/<[^>]+>/g, ' ')
    .replace(/\b(?:data-testid|src|href|alt|class|style)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, ' ')
    .replace(/\\[nrt]/g, ' ')
    .replace(/[\u{1F000}-\u{1FAFF}]/gu, ' '));
  if (!x) return '';
  const n = norm(x), words = n.split(' ').filter(Boolean);
  if ((x.match(/,/g) || []).length >= 5 && !PURPOSE_FACT.test(x)) return '';
  if (words.length >= 16 && !/[.!?]$/.test(x) && !PURPOSE_FACT.test(x)) return '';
  const id = norm(exactName(i));
  if (id && (n === id || (n.startsWith(id) && words.length < id.split(' ').length + 5))) return '';
  return x.replace(/\s+([,.;:!?])/g, '$1').replace(/([.!?])\1+/g, '$1').trim();
}

function bestPurpose(i, pages) {
  const candidates = [];
  for (const p of pages || []) {
    for (const line of evidenceLines(p.text)) {
      const x = cleanVisible(line, i);
      if (!x || NEGATIVE_FACT.test(x) || !PURPOSE_FACT.test(x)) continue;
      candidates.push(x);
    }
  }
  candidates.sort((a, b) => sentenceScore(b, i) - sentenceScore(a, i));
  return candidates[0] || '';
}

function sanitizeAnswer(i, answer, pages) {
  const out = { ...answer };
  let what = cleanVisible(out.whatItDoes, i);
  if (!what || NEGATIVE_FACT.test(what)) what = bestPurpose(i, pages);
  const pros = [], cons = [];
  const addUnique = (arr, x) => { if (x && !arr.some(y => norm(y) === norm(x))) arr.push(x); };
  for (const raw of Array.isArray(out.pros) ? out.pros : []) {
    const x = cleanVisible(raw, i);
    if (!x) continue;
    if (NEGATIVE_FACT.test(x)) addUnique(cons, x);
    else if (POSITIVE_FACT.test(x)) addUnique(pros, x);
  }
  for (const raw of Array.isArray(out.cons) ? out.cons : []) {
    const x = cleanVisible(raw, i);
    if (x && NEGATIVE_FACT.test(x)) addUnique(cons, x);
  }
  out.whatItDoes = what;
  out.pros = pros.slice(0, 4);
  out.cons = cons.slice(0, 4);
  out.bestFor = cleanVisible(out.bestFor, i);
  out.standOut = cleanVisible(out.standOut, i);
  out.valueVerdict = cleanVisible(out.valueVerdict, i);
  out.sources = (Array.isArray(out.sources) ? out.sources : []).map(src => ({
    ...src,
    title: clean(String(src?.title || 'Product source').replace(/<[^>]+>/g, ' ').replace(/&lt;[^&]+&gt;/gi, ' '), 180) || 'Product source'
  })).slice(0, 6);
  out.researched = !!(out.whatItDoes || out.pros.length || out.cons.length);
  return out;
}

'''
    s = s.replace(marker, cleaner + marker, 1)

if 'json(sanitizeAnswer(i, answer, pages))' not in s:
    old = 'return res.status(200).json(answer);'
    if old not in s:
        raise SystemExit('answer return marker missing')
    s = s.replace(old, 'return res.status(200).json(sanitizeAnswer(i, answer, pages));', 1)

p.write_text(s)
print('PATCH_PRODUCT_INFO_CLEANER_DONE')
