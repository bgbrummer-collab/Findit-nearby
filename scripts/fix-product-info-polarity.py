from pathlib import Path
p=Path('api/product-insights.js')
s=p.read_text()
if 'function isNegativeEvidence(x)' not in s:
    marker='function bestPurpose(i, pages) {'
    fn=r'''function isNegativeEvidence(x) {
  const text = String(x || '');
  if (!text) return false;
  const positiveNoise = /(?:reduce|minimiz|cancel|filter|remove|isolate|reject|suppress).{0,45}(?:background |ambient |unwanted )?noise|noise (?:reduction|cancellation|canceling|cancelling)|zero[- ]latency|without (?:noticeable )?latency/i;
  const explicitNegative = /(?:users? )?(?:report|complain|experience|notice)|breaks?|broke|broken|stability issues?|unstable|\bissues?\b|\bproblems?\b|drawback|limitation|difficult|tricky|struggle|\bpoor\b|\bweak\b|fragile|hiss|crackle|distortion|may not|cannot|doesn.t|does not|requires?|not included|sold separately|only compatible|\bheavy\b|bulky|short battery|\blimited\b|warning|not suitable|disappoint|inconsistent|not withstand|despite|fragrance[- ]sensitive/i;
  if (explicitNegative.test(text)) return true;
  if (positiveNoise.test(text)) return false;
  return /(?:creates?|causes?|produces?|has|with) (?:noticeable )?(?:static|background) noise|high latency/i.test(text);
}

'''
    if marker not in s: raise SystemExit('bestPurpose marker missing')
    s=s.replace(marker,fn+marker,1)
# Restrict replacements to sanitizer area only; the legacy regex remains for fallback discovery.
start=s.index('function bestPurpose(i, pages) {')
end=s.index('function parseJson(v) {', start)
block=s[start:end]
block=block.replace('NEGATIVE_FACT.test(x)', 'isNegativeEvidence(x)')
block=block.replace('NEGATIVE_FACT.test(what)', 'isNegativeEvidence(what)')
s=s[:start]+block+s[end:]
p.write_text(s)
print('POLARITY_PATCH_DONE')
