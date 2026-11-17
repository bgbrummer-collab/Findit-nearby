// Only tolerate the exact local Python SimpleHTTPRequestHandler limitation.
// Any other HTTP status, host, or browser/runtime error remains a failure.
export function isOnlyExpectedStaticPost501(detail) {
 const text=String(detail||'').trim();
 if(!text)return false;
 if(!/Unsupported method\s*\(['"]POST['"]\)/i.test(text))return false;
 if(!/https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?\//i.test(text))return false;
 if(/\b(?:Uncaught|Error|TypeError|ReferenceError|SyntaxError|RangeError|console\.error|Failed to fetch|net::ERR_)\b/i.test(text))return false;
 const statuses=[...text.matchAll(/\b([45]\d{2})\b/g)].map(m=>Number(m[1]));
 if(!statuses.length||statuses.some(status=>status!==501))return false;
 return true;
}
