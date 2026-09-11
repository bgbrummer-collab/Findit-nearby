import fs from 'node:fs';

const path = 'api/product-insights.js';
let text = fs.readFileSync(path, 'utf8');

const from = `function stableSourceHints(i) {\n  const b = norm(i.brand), p = norm(\`${'${i.name} ${i.model} ${i.object} ${i.category} ${i.searchQuery}'}\`);\n  if (/^marc anthony$/.test(b) && /strictly curls.*3x moisture.*conditioner|3x moisture.*triple blend conditioner/.test(p)) return [`;

const to = `function stableSourceHints(i) {\n  const b = norm(i.brand), p = norm(\`${'${i.name} ${i.model} ${i.object} ${i.category} ${i.searchQuery}'}\`);\n  if (/^logitech$/.test(b) && /(?:g pro|pro).*?(?:gaming )?headset|(?:gaming )?headset.*?(?:g pro|pro)/.test(p)) return [\n    'https://www.logitechg.com/en-ph/shop/p/pro-gaming-headset'\n  ];\n  if (/^marc anthony$/.test(b) && /strictly curls.*3x moisture.*conditioner|3x moisture.*triple blend conditioner/.test(p)) return [`;

if (text.includes(to)) {
  console.log('Logitech exact headset source hint already installed.');
} else {
  if (!text.includes(from)) throw new Error('Expected stableSourceHints block was not found');
  text = text.replace(from, to);
  fs.writeFileSync(path, text);
  console.log('Installed exact Logitech G PRO headset source hint.');
}
