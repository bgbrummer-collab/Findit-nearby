const MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash-lite'];
const BLOCKED = /\b(firearm|gun|rifle|pistol|ammunition|ammo|weapon|knife|knives|machete|sword|switchblade|taser|stun gun|pepper spray|mace|brass knuckles|fireworks|explosive|vape|nicotine|cigarette|cigar|alcohol|beer|wine|liquor|cannabis|marijuana|thc|cbd|psilocybin|magic mushroom|gambling|sports betting|casino|betting|pornography|adult sex toy)\b/i;
const SCHEMA = {
  type: 'OBJECT',
  properties: {
    researched: { type: 'BOOLEAN' },
    whatItDoes: { type: 'STRING' },
    pros: { type: 'ARRAY', items: { type: 'STRING' } },
    cons: { type: 'ARRAY', items: { type: 'STRING' } },
    bestFor: { type: 'STRING' },
    standOut: { type: 'STRING' },
    valueVerdict: { type: 'STRING' }
  },
  required: ['researched', 'whatItDoes', 'pros', 'cons', 'bestFor', 'standOut', 'valueVerdict']
};

const clean = (v, n = 1200) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const norm = v => clean(v, 18000)
  .toLowerCase()
  .replace(/&amp;/g, ' and ')
  .replace(/\b(\d+)\s*(ml|mg|g|kg|l|gb|tb|oz|rolls?|pack|ply|cm|mm|inch|inches)\b/g, '$1$2')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const STOP = new Set(['the','and','for','with','from','this','that','new','product','item','online','shop','buy','model','official','pack','packs','piece','pieces','sale','price']);
const toks = v => [...new Set(norm(v).split(' ').filter(x => x.length > 2 && !STOP.has(x)))];
const JUNK = /\b(shipping|delivery|refund|return policy|checkout|seller review|customer service|cookie policy|privacy policy|sign in|log in|login|newsletter|loyalty|rewards|menu|where to buy|our story|press coverage|featured products|top sellers|view all)\b/i;
const BLOCKPAGE = /\b(captcha|robot or human|verify you are human|are you a human|access denied|access blocked|security check|challenge page|temporarily blocked|request blocked|unusual traffic|enable javascript and cookies|page maybe requiring captcha|forbidden)\b/i;
const DETAIL = /\b(designed|formulated|features?|includes?|contains?|provides?|helps?|offers?|made|uses?|supports?|compatible|connects?|records?|recording|streaming|podcast|gaming|calls?|noise|monitoring|cardioid|sampling|frequency|battery|bluetooth|wireless|usb|plug.?and.?play|soft|strong|absorb|ply|rolls?|cushion|leather|rubber|variable speed|drilling|scientific|statistics|fraction|moistur|detang|frizz)\b/i;
const DISPLAY_JUNK = /accessible version|data-testid|picturehighquality|\bsrc\s*=|\bhref\s*=|\balt\s*=|\bclass\s*=|\bstyle\s*=|javascript:|webpack|aria-|\bhttps?:\/\/|\\[nrt]|<[^>]+>/i;
const NEGATIVE_FACT = /static noise|background noise|breaks?|broke|broken|stability issues?|unstable|\bissues?\b|\bproblems?\b|drawback|limitation|difficult|tricky|struggle|\bpoor\b|\bweak\b|fragile|hiss|crackle|distortion|latency|may not|cannot|doesn.t|does not|requires?|not included|sold separately|only compatible|\bheavy\b|bulky|short battery|\blimited\b|warning|not suitable|disappoint|inconsistent|fragrance|sensitive/i;
const POSITIVE_FACT = /plug.?and.?play|compatible|clear|cardioid|noise cancel|monitor|gain|stand|adapter|durab|soft|strong|absorb|moistur|detang|frizz|shine|manageab|cushion|battery|wireless|bluetooth|usb|easy|support|adjustable|portable|reliable|quality|stream|record|included|includes?|fast|comfort|protect|capacity|variable speed|leather|rubber|structured|construction|forward|reverse|control|scientific|fraction|statistics|calculation|function|two.?ply|2.?ply|rolls?/i;
const PURPOSE_FACT = /\b(is|are|designed|made|used|helps?|provides?|formulated|records?|recording|streaming|connects?|supports?|for voice|for gaming|for calls?|for podcast|for household|for bathroom|for school|for drilling|for listening)\b/i;


function identity(b = {}) {
  const i = b.identification || b;
  return {
    brand: clean(i.brand, 120),
    model: clean(i.model, 260),
    name: clean(i.name || i.object, 300),
    object: clean(i.object, 160),
    category: clean(i.retailCategory || i.category, 160),
    searchQuery: clean(i.searchQuery || i.query || i.name || i.model || i.object, 420)
  };
}

function exactName(i) {
  const out = [];
  for (const p of [i.brand, i.model || i.name, i.searchQuery].filter(Boolean)) {
    const n = norm(p);
    if (n && !out.some(x => norm(x).includes(n) || n.includes(norm(x)))) out.push(p);
  }
  return clean(out.join(' '), 500);
}

function family(i) {
  const x = norm(`${i.category} ${i.object} ${i.name} ${i.model}`);
  const rules = [
    ['beauty', /conditioner|shampoo|serum|mascara|foundation|lipstick|beauty|cosmetic|hair care|skin care|curl cream|moistur/],
    ['health', /vitamin|pharmacy|health|toothpaste|deodorant|oral care|sanitary|personal care/],
    ['footwear', /shoe|sneaker|footwear|trainer|boot|sandal/],
    ['clothing', /shirt|jacket|jeans|dress|hoodie|clothing|trousers|pants|shorts|jersey|sweater/],
    ['appliances', /fridge|microwave|washing machine|air fryer|kettle|toaster|appliance|dishwasher|vacuum|iron/],
    ['electronics', /phone|headphone|earbud|microphone|monitor|keyboard|mouse|camera|laptop|electronics|tablet|speaker|television|charger|power bank|usb/],
    ['household', /toilet paper|tissue|paper towel|cleaning|detergent|dishwashing|laundry|household|bin bag|foil|cling wrap/],
    ['grocery', /food|grocery|drink|snack|cereal|coffee|tea|milk|bread|sauce|pasta|rice/],
    ['hardware', /drill|hardware|tool|paint|screw|electrical|hammer|spanner|wrench|saw|adhesive/],
    ['stationery', /pencil|pen|stationery|notebook|calculator|school supplies|marker|highlighter|eraser|ruler|binder/],
    ['toys', /toy|lego|doll|puzzle|board game/],
    ['home', /kitchen|cookware|pan|pot|cutlery|bottle|mug|plate|homeware/]
  ];
  for (const [name, re] of rules) if (re.test(x)) return name;
  return 'all';
}

function searchSites(i) {
  const map = {
    beauty: ['clicks.co.za','dischem.co.za','woolworths.co.za','takealot.com'],
    health: ['clicks.co.za','dischem.co.za','takealot.com'],
    electronics: ['takealot.com','makro.co.za','game.co.za','incredible.co.za','hificorp.co.za','manuals.plus','ubuy.za.com'],
    appliances: ['game.co.za','makro.co.za','hirschs.co.za','takealot.com','manuals.plus'],
    footwear: ['sportscene.co.za','totalsports.co.za','jdsports.co.za','nike.com','adidas.co.za','bash.com'],
    clothing: ['bash.com','superbalist.com','woolworths.co.za'],
    household: ['checkers.co.za','pnp.co.za','shoprite.co.za','woolworths.co.za','makro.co.za','takealot.com'],
    grocery: ['checkers.co.za','pnp.co.za','shoprite.co.za','woolworths.co.za','makro.co.za'],
    hardware: ['builders.co.za','makro.co.za','leroymerlin.co.za','buco.co.za','mica.co.za','manuals.plus'],
    stationery: ['pna.co.za','waltons.co.za','makro.co.za','takealot.com'],
    toys: ['toysrus.co.za','game.co.za','makro.co.za','takealot.com'],
    home: ['mrphome.com','woolworths.co.za','makro.co.za','game.co.za','takealot.com'],
    all: ['takealot.com','makro.co.za','game.co.za','woolworths.co.za','manuals.plus','ubuy.za.com']
  };
  return map[family(i)] || map.all;
}

function htmlToText(s = '') {
  return String(s)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(?:br\s*\/?|\/p|\/li|\/div|\/section|\/h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

async function direct(url, t = 6500) {
  try {
    const r = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 Chrome/140 Safari/537.36',
        accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
        'accept-language': 'en-ZA,en;q=0.9'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(t)
    });
    if (!r.ok) return null;
    return { url: r.url || url, text: (await r.text()).slice(0, 700000) };
  } catch { return null; }
}

async function reader(url, t = 6500) {
  try {
    const r = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: 'text/plain', 'User-Agent': 'FindItNearby/19.0' },
      signal: AbortSignal.timeout(t)
    });
    if (!r.ok) return null;
    return { url, text: (await r.text()).slice(0, 650000) };
  } catch { return null; }
}

async function getDoc(url) { return await reader(url) || await direct(url); }

function unwrap(raw, base) {
  try {
    let u = new URL(String(raw).replace(/&amp;/g, '&'), base);
    let h = u.hostname.toLowerCase();
    if (h.includes('duckduckgo.com')) {
      const t = u.searchParams.get('uddg');
      if (t) u = new URL(decodeURIComponent(t));
    }
    h = u.hostname.toLowerCase();
    if (h.includes('google.')) {
      const t = u.searchParams.get('q') || u.searchParams.get('url') || u.searchParams.get('u');
      if (t) u = new URL(decodeURIComponent(t)); else return null;
    }
    const host = u.hostname.toLowerCase();
    if (!/^https?:$/.test(u.protocol) || /google\.|bing\.com|duckduckgo\.com|youtube\.|facebook\.|instagram\.|tiktok\.|pinterest\.|reddit\./.test(host)) return null;
    return u.href;
  } catch { return null; }
}

function extractLinks(doc, base) {
  const s = String(doc || ''), out = [], seen = new Set();
  const add = v => { const u = unwrap(v, base); if (u && !seen.has(u)) { seen.add(u); out.push(u); } };
  for (const re of [/\]\(([^)\s]+)\)/g, /href\s*=\s*["']([^"']+)["']/gi, /https?:\/\/[^\s)\]>"']+/g]) {
    for (const m of s.matchAll(re)) {
      add(m[1] || m[0].replace(/[.,;:]+$/, ''));
      if (out.length >= 80) return out;
    }
  }
  return out;
}

function likelyProductUrl(v) {
  try {
    const u = new URL(v), p = u.pathname.toLowerCase();
    if (/\/(search|catalogsearch|browse|category|categories|brands?|collections?|all)(\/|$)/.test(p) || /[?&](q|text|search)=/i.test(u.search)) return false;
    return p.split('/').filter(Boolean).length >= 1;
  } catch { return false; }
}

function brandAliases(brand) {
  const b = norm(brand).replace(/\s+/g, '');
  const out = [b];
  for (let j = 1; j < b.length; j++) {
    if (b[j] === b[j - 1]) out.push(b.slice(0, j) + b.slice(j + 1));
  }
  return [...new Set(out.filter(x => x.length >= 3))];
}

function identityParts(i) {
  const brand = norm(i.brand), brandTokens = new Set(toks(i.brand));
  const objectTokens = toks(i.object || i.category).slice(0, 8);
  const generic = new Set([...objectTokens, ...toks(i.category)]);
  const keys = toks(`${i.model || ''} ${i.name || ''} ${i.searchQuery || ''}`)
    .filter(x => !generic.has(x) && !brandTokens.has(x))
    .slice(0, 18);
  const nums = (norm(`${i.model || ''} ${i.name || ''} ${i.searchQuery || ''}`).match(/\b\d+(?:ml|mg|g|kg|l|oz|rolls?|ply|gb|tb)?\b/g) || []).slice(0, 5);
  return { brand, aliases: brandAliases(i.brand), keys, objects: objectTokens, nums };
}

function brandMatchScore(hay, p) {
  if (!p.brand) return 0;
  if (hay.includes(p.brand)) return 5;
  for (const alias of p.aliases.slice(1)) if (hay.includes(alias)) return 3;
  return -1;
}

function identityScore(text, i, title = '') {
  const hay = norm(`${title} ${String(text || '').slice(0, 130000)}`), p = identityParts(i);
  const b = brandMatchScore(hay, p);
  if (p.brand && b < 0) return 0;
  const kh = p.keys.filter(x => hay.includes(x)).length;
  const oh = p.objects.filter(x => hay.includes(x)).length;
  const nh = p.nums.filter(x => hay.includes(x)).length;
  if (p.keys.length >= 4 && kh < 2) return 0;
  if (p.keys.length > 0 && p.keys.length < 4 && kh < 1) return 0;
  if (b === 3 && kh < 1 && oh < 1) return 0;
  return Math.max(0, b) + kh * 2 + oh + nh * 2;
}

function resultEvidenceScore(text, i) {
  const hay = norm(text), p = identityParts(i);
  const b = brandMatchScore(hay, p);
  if (p.brand && b < 0) return 0;
  const kh = p.keys.filter(x => hay.includes(x)).length;
  const oh = p.objects.filter(x => hay.includes(x)).length;
  const nh = p.nums.filter(x => hay.includes(x)).length;
  if (p.keys.length >= 3 && kh < 2) return 0;
  if (p.keys.length > 0 && p.keys.length < 3 && kh < 1) return 0;
  if (p.objects.length && oh < 1) return 0;
  if (b === 3 && (kh < 1 || oh < 1)) return 0;
  const idTokens = new Set([...toks(i.brand), ...toks(i.model), ...toks(i.name), ...toks(i.searchQuery), ...p.objects]);
  const extras = toks(hay).filter(x => !idTokens.has(x));
  if (extras.length < 4) return 0;
  return Math.max(0, b) + kh * 2 + oh + nh * 2 + Math.min(4, Math.floor(extras.length / 4));
}

function variantMeasures(v) {
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

function titleOf(raw, url) {
  const s = String(raw || ''), m = s.match(/^Title:\s*(.+)$/mi) || s.match(/<title[^>]*>([^<]+)<\/title>/i);
  try { return clean(m?.[1] || new URL(url).hostname, 180); } catch { return clean(m?.[1] || 'Product source', 180); }
}

function point(v) {
  const x = clean(String(v || '')
    .replace(/^[-*•#>]+\s*/, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[*_`#>|]/g, ' '), 560);
  return x.length >= 18 && !JUNK.test(x) && !BLOCKPAGE.test(x) ? x : '';
}

function evidenceLines(text) {
  const raw = String(text || '').replace(/\r/g, '');
  const pieces = raw.split(/\n+|(?<=[.!?])\s+/);
  const out = [];
  for (const p of pieces) {
    const x = point(p);
    if (x && x.length >= 28 && x.length <= 560 && !out.some(y => norm(y) === norm(x))) out.push(x);
  }
  return out;
}

function evidenceQuality(text, i) {
  const p = identityParts(i), id = new Set([...toks(i.brand), ...toks(i.model), ...toks(i.name), ...toks(i.searchQuery), ...p.objects]);
  let best = 0;
  for (const x of evidenceLines(text)) {
    const n = norm(x);
    const overlap = [...p.objects, ...p.keys].filter(t => n.includes(t)).length;
    const extras = toks(n).filter(t => !id.has(t)).length;
    let score = overlap * 2 + Math.min(4, extras);
    if (DETAIL.test(x)) score += 4;
    if (x.length >= 45 && x.length <= 320) score += 2;
    if (extras < 3 || overlap < 1) score -= 5;
    best = Math.max(best, score);
  }
  return best;
}

async function productPage(url, i) {
  const d = await getDoc(url);
  if (!d) return null;
  const title = titleOf(d.text, d.url || url);
  const text = /<[a-z][\s\S]*>/i.test(d.text)
    ? htmlToText(d.text)
    : String(d.text).replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
  if (BLOCKPAGE.test(`${title} ${text.slice(0, 6000)}`)) return null;
  if (/\b(search|search results|results for)\b/i.test(title)) return null;
  if (titleVariantConflict(title, i)) return null;
  const score = identityScore(text, i, title);
  const quality = evidenceQuality(text, i);
  return score >= 5 && quality >= 6 ? { title, url: d.url || url, text: text.slice(0, 30000), score: score + quality, evidenceType: 'product-page' } : null;
}

function queryVariants(i) {
  const originalBrand = clean(i.brand, 120);
  const aliases = brandAliases(originalBrand);
  const aliasBrand = aliases.length > 1 ? aliases[1] : '';
  const model = clean(i.model || i.name || i.object, 260);
  const exact = exactName(i);
  const out = [
    `"${exact}"`,
    clean(`${originalBrand} ${model}`, 360),
    clean(`${originalBrand} ${model} ${i.object || i.category || ''}`, 420),
    clean(`${originalBrand} ${model} specifications features review`, 440)
  ];
  if (aliasBrand && aliasBrand !== norm(originalBrand).replace(/\s+/g, '')) {
    out.push(clean(`${aliasBrand} ${model} ${i.object || ''}`, 420));
  }
  return [...new Set(out.filter(Boolean))].slice(0, 5);
}

function searchUrls(i) {
  const out = [];
  for (const q of queryVariants(i)) {
    const e = encodeURIComponent(q);
    out.push(`https://www.google.com/search?num=12&hl=en&q=${e}`);
    out.push(`https://www.bing.com/search?q=${e}`);
    out.push(`https://html.duckduckgo.com/html/?q=${e}`);
  }
  const model = clean(i.model || i.name || i.object, 240);
  const brandForms = [clean(i.brand, 120), ...brandAliases(i.brand).slice(1)].filter(Boolean);
  const siteCore = clean(`${brandForms[brandForms.length - 1] || i.brand} ${model}`, 320);
  for (const site of searchSites(i).slice(0, 7)) {
    const q = encodeURIComponent(`site:${site} "${siteCore}"`);
    out.push(`https://www.google.com/search?num=10&hl=en&q=${q}`);
  }
  return [...new Set(out)].slice(0, 24);
}

function snippetCandidates(raw, base, i) {
  const s = String(raw || ''), out = [], seen = new Set();
  const push = (title, url, start, end) => {
    const u = unwrap(url, base);
    if (!u || seen.has(u)) return;
    const text = htmlToText(s.slice(Math.max(0, start - 120), Math.min(s.length, end + 1100)));
    if (BLOCKPAGE.test(`${title} ${text}`)) return;
    if (titleVariantConflict(title, i)) return;
    const score = resultEvidenceScore(`${title} ${text}`, i);
    const quality = evidenceQuality(`${title}\n${text}`, i);
    if (score < 7 || quality < 6) return;
    seen.add(u);
    out.push({ title: clean(title || 'Search result evidence', 180), url: u, text: clean(`${title}. ${text}`, 12000), score: score + quality, evidenceType: 'search-snippet' });
  };
  for (const m of s.matchAll(/\[([^\]]{3,240})\]\((https?:\/\/[^)\s]+)\)/g)) push(m[1], m[2], m.index, m.index + m[0].length);
  for (const m of s.matchAll(/<a[^>]+href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]{1,400}?)<\/a>/gi)) push(htmlToText(m[2]), m[1], m.index, m.index + m[0].length);
  return out.sort((a, b) => b.score - a.score).slice(0, 5);
}

async function discoverPages(i, offers = []) {
  const candidates = [], seen = new Set();
  const add = u => { const x = unwrap(u); if (x && !seen.has(x) && likelyProductUrl(x)) { seen.add(x); candidates.push(x); } };
  for (const o of offers) add(o.url);
  const searches = searchUrls(i);
  const docs = await Promise.allSettled(searches.map(async s => ({ s, d: await getDoc(s) })));
  const snippets = [];
  for (const r of docs) {
    if (r.status !== 'fulfilled' || !r.value.d) continue;
    const { s, d } = r.value;
    for (const u of extractLinks(d.text, d.url || s)) { add(u); if (candidates.length >= 60) break; }
    snippets.push(...snippetCandidates(d.text, d.url || s, i));
  }
  const checked = await Promise.allSettled(candidates.slice(0, 36).map(u => productPage(u, i)));
  const pages = [];
  for (const r of checked) if (r.status === 'fulfilled' && r.value) pages.push(r.value);
  pages.sort((a, b) => b.score - a.score);
  const unique = [];
  for (const p of pages) {
    if (!unique.some(x => x.url === p.url)) unique.push(p);
    if (unique.length >= 6) break;
  }
  if (unique.length) return unique;
  snippets.sort((a, b) => b.score - a.score);
  const cleanSnippets = [];
  for (const s of snippets) {
    if (!cleanSnippets.some(x => x.url === s.url)) cleanSnippets.push(s);
    if (cleanSnippets.length >= 3) break;
  }
  return cleanSnippets;
}

function list(v) {
  const out = [];
  for (const x of Array.isArray(v) ? v : []) {
    const c = point(x);
    if (c && !out.some(y => norm(y) === norm(c))) out.push(c);
    if (out.length >= 4) break;
  }
  return out;
}

function sources(pages) { return pages.map(p => ({ title: p.title || 'Product source', url: p.url })).slice(0, 6); }

function sentenceScore(x, i) {
  const n = norm(x), p = identityParts(i);
  let score = 0;
  for (const t of [...p.keys, ...p.objects].slice(0, 14)) if (n.includes(t)) score++;
  if (DETAIL.test(x)) score += 4;
  if (/\b(is|are|helps?|provides?|formulated|designed|features?|includes?|offers?|made|uses?|gives?|supports?|connects?|records?|contains?)\b/i.test(x)) score += 3;
  if (x.length >= 45 && x.length <= 320) score += 3;
  if (x.length > 420) score -= 4;
  if (JUNK.test(x) || BLOCKPAGE.test(x)) score -= 12;
  return score;
}

function fallback(i, pages) {
  const ss = [];
  for (const p of pages) {
    for (const x of evidenceLines(p.text)) {
      if (x && !ss.some(y => norm(y) === norm(x))) ss.push(x);
    }
  }
  const ranked = [...ss].sort((a, b) => sentenceScore(b, i) - sentenceScore(a, i));
  const purpose = /designed|helps?|provides?|formulated|made to|used to|features?|contains?|includes?|offers?|record|stream|podcast|gaming|microphone|headphone|calculator|drill|toilet|conditioner|shoe|soft|strong|absorb|usb|wireless|compatible|moistur|detang|frizz/i;
  const pos = /soft|strong|absorb|comfort|durab|lightweight|fast|easy|support|performance|battery|quality|reliable|smooth|protect|capacity|efficient|compatible|plug|usb|adjustable|portable|clear|noise|wireless|bluetooth|variable speed|detang|moistur|stream|monitor|cardioid|stand|cushion/i;
  const neg = /however|limitation|drawback|requires?|not included|sold separately|may not|cannot|only compatible|sensitive|heavy|bulky|short|limited|warning|not suitable|single use|disposable|corded/i;
  const what = ranked.find(x => purpose.test(x) && sentenceScore(x, i) >= 6) || ranked.find(x => sentenceScore(x, i) >= 7) || '';
  const pros = ranked.filter(x => pos.test(x) && !neg.test(x) && sentenceScore(x, i) >= 6 && norm(x) !== norm(what)).slice(0, 4);
  const cons = ranked.filter(x => neg.test(x) && sentenceScore(x, i) >= 4 && norm(x) !== norm(what)).slice(0, 3);
  return {
    researched: !!(what || pros.length),
    whatItDoes: what,
    pros,
    cons,
    bestFor: '',
    standOut: '',
    valueVerdict: '',
    sources: sources(pages),
    researchMethod: 'Exact-product web evidence',
    checkedAt: new Date().toISOString()
  };
}

function cleanVisible(v, i) {
  const original = String(v || '');
  if (DISPLAY_JUNK.test(original)) return '';
  const x = point(original
    .replace(/<[^>]+>/g, ' ')
    .replace(/\b(?:data-testid|src|href|alt|class|style)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, ' ')
    .replace(/\\[nrt]/g, ' ')
    .replace(/[\u{1F000}-\u{1FAFF}]/gu, ' '));
  if (!x) return '';
  const n = norm(x), words = n.split(' ').filter(Boolean);
  if ((x.match(/,/g) || []).length >= 5) return '';
  if (words.length >= 16 && !/[.!?]$/.test(x) && !PURPOSE_FACT.test(x)) return '';
  const id = norm(exactName(i));
  if (id && (n === id || (n.startsWith(id) && words.length < id.split(' ').length + 5))) return '';
  return x.replace(/\s+([,.;:!?])/g, '$1').replace(/([.!?])\1+/g, '$1').trim();
}

function isNegativeEvidence(x) {
  if (/\b(septic(?: tank)? safe|breaks down easily in water|biodegradable|recyclable)\b/i.test(String(x || ''))) return false;
  const text = String(x || '');
  if (!text) return false;
  const positiveNoise = /(?:reduce|minimiz|cancel|filter|remove|isolate|reject|suppress).{0,45}(?:background |ambient |unwanted )?noise|noise (?:reduction|cancellation|canceling|cancelling)|zero[- ]latency|without (?:noticeable )?latency/i;
  const explicitNegative = /(?:users? )?(?:report|complain|experience|notice)|breaks?|broke|broken|stability issues?|unstable|\bissues?\b|\bproblems?\b|drawback|limitation|difficult|tricky|struggle|\bpoor\b|\bweak\b|fragile|hiss|crackle|distortion|may not|cannot|doesn.t|does not|requires?|not included|sold separately|only compatible|\bheavy\b|bulky|short battery|\blimited\b|warning|not suitable|disappoint|inconsistent|not withstand|despite|fragrance[- ]sensitive/i;
  if (explicitNegative.test(text)) return true;
  if (positiveNoise.test(text)) return false;
  return /(?:creates?|causes?|produces?|has|with) (?:noticeable )?(?:static|background) noise|high latency/i.test(text);
}

function bestPurpose(i, pages) {
  const candidates = [];
  for (const p of pages || []) {
    for (const line of evidenceLines(p.text)) {
      const x = cleanVisible(line, i);
      if (!x || isNegativeEvidence(x) || !PURPOSE_FACT.test(x)) continue;
      candidates.push(x);
    }
  }
  candidates.sort((a, b) => sentenceScore(b, i) - sentenceScore(a, i));
  const parts = identityParts(i);
  const branded = candidates.filter(x => !parts.brand || brandMatchScore(norm(x), parts) >= 0);
  return branded[0] || candidates[0] || '';
}

function sanitizeAnswer(i, answer, pages) {
  const out = { ...answer };
  let what = cleanVisible(out.whatItDoes, i);
  const fallbackNeedsBrand = out.researchMethod === 'Exact-product web evidence' && what && identityParts(i).brand && brandMatchScore(norm(what), identityParts(i)) < 0;
  if (!what || isNegativeEvidence(what) || fallbackNeedsBrand) what = bestPurpose(i, pages);
  const pros = [], cons = [];
  const addUnique = (arr, x) => { if (x && !arr.some(y => norm(y) === norm(x))) arr.push(x); };
  for (const raw of Array.isArray(out.pros) ? out.pros : []) {
    const x = cleanVisible(raw, i);
    if (!x) continue;
    if (isNegativeEvidence(x)) addUnique(cons, x);
    else if (POSITIVE_FACT.test(x)) addUnique(pros, x);
  }
  for (const raw of Array.isArray(out.cons) ? out.cons : []) {
    const x = cleanVisible(raw, i);
    if (x && isNegativeEvidence(x)) addUnique(cons, x);
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

function parseJson(v) {
  try { return JSON.parse(String(v || '').replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()); } catch { return null; }
}

async function summarize(key, i, pages) {
  if (!key || !pages.length) return null;
  const evidence = pages.map((p, n) => `SOURCE ${n + 1} (${p.evidenceType || 'page'}): ${p.title}\nURL: ${p.url}\nCONTENT: ${p.text}`).join('\n\n').slice(0, 76000);
  const prompt = `Research this exact retail product: ${exactName(i)}. Category family: ${family(i)}. The image is identity only, never evidence. Use ONLY the supplied web evidence. A small spelling difference in a short brand name can be an OCR error; only accept it when the model/object evidence clearly agrees. Explain what it does/is for, give 2-4 useful source-supported pros, and 0-4 genuine cons only when supported. This must work for ordinary safe retail products and uncommon brands. Do not use appearance, price, stock, shipping or seller service as pros/cons. Never invent specifications. Search snippets are weaker evidence than product/manual pages, so be conservative. Set researched=false if the evidence is clearly for a different product.\n\n${evidence}`;
  for (const model of MODELS) {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 13000);
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST', signal: ctl.signal,
        headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: .05 } })
      });
      const raw = await r.json().catch(() => ({}));
      if (!r.ok) continue;
      const d = parseJson((raw?.candidates?.[0]?.content?.parts || []).map(p => p?.text || '').join('\n'));
      if (!d?.researched) continue;
      const what = point(d.whatItDoes), pros = list(d.pros), cons = list(d.cons);
      if (!what && !pros.length && !cons.length) continue;
      return { researched: true, whatItDoes: what, pros, cons, bestFor: point(d.bestFor), standOut: point(d.standOut), valueVerdict: point(d.valueVerdict), sources: sources(pages), researchMethod: 'Web search + source-grounded AI summary', checkedAt: new Date().toISOString() };
    } catch {} finally { clearTimeout(timer); }
  }
  return null;
}

function offerSources(body) {
  const out = [];
  for (const o of Array.isArray(body?.offers) ? body.offers : []) {
    const u = unwrap(o?.product_url || o?.url);
    if (u) out.push({ url: u });
  }
  return out.slice(0, 6);
}

async function fx(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=86400');
  const base = String(req.query?.base || 'ZAR').toUpperCase(), symbol = String(req.query?.symbols || 'USD').toUpperCase();
  if (!/^[A-Z]{3}$/.test(base) || !/^[A-Z]{3}$/.test(symbol)) return res.status(400).json({ error: 'Invalid currency' });
  if (base === symbol) return res.json({ base, symbol, rate: 1 });
  try {
    const r = await fetch(`https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}&to=${encodeURIComponent(symbol)}`), d = await r.json(), rate = Number(d?.rates?.[symbol]);
    if (!r.ok || !Number.isFinite(rate)) throw new Error('fx');
    return res.json({ base, symbol, rate, date: d.date || null, estimated: true });
  } catch { return res.status(502).json({ error: 'Exchange rate unavailable' }); }
}

export default async function handler(req, res) {
  if (String(req.query?.action || '') === 'fx') return fx(req, res);
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const body = req.method === 'POST' ? (req.body || {}) : (req.query || {}), i = identity(body), id = exactName(i);
  if (!id) return res.status(200).json({ researched: false, whatItDoes: '', pros: [], cons: [], sources: [] });
  if (BLOCKED.test(id)) return res.status(403).json({ error: 'Unsupported product type' });
  try {
    const pages = await discoverPages(i, offerSources(body));
    if (!pages.length) return res.status(200).json({ researched: false, whatItDoes: '', pros: [], cons: [], sources: [], researchMethod: 'No exact-product web evidence verified', checkedAt: new Date().toISOString() });
    const answer = await summarize(process.env.GEMINI_API_KEY, i, pages) || fallback(i, pages);
    return res.status(200).json(sanitizeAnswer(i, answer, pages));
  } catch (e) {
    console.error('product insights error', e);
    return res.status(200).json({ researched: false, whatItDoes: '', pros: [], cons: [], sources: [], error: 'Exact-product research temporarily unavailable' });
  }
}
