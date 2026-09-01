import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const out=process.env.AUDIT_OUT||'audit-output';
const run=spawnSync(process.execPath,['tests/full-site-audit.mjs'],{stdio:'inherit',env:process.env});
const currentPath=path.join(out,'audit-report.json');
const legacyPath=path.join(out,'findit-full-audit.json');
const jsonPath=fs.existsSync(currentPath)?currentPath:legacyPath;
const finalJsonPath=path.join(out,'findit-full-audit.json');
const mdPath=path.join(out,'findit-full-audit.md');
if(!fs.existsSync(jsonPath)){console.error('Audit report was not produced.');process.exit(run.status||1)}
const report=JSON.parse(fs.readFileSync(jsonPath,'utf8'));
const failures=(report.checks||[]).filter(x=>x.status==='FAIL');
const warnings=(report.checks||[]).filter(x=>x.status==='WARN');
const passes=(report.checks||[]).filter(x=>x.status==='PASS');
report.summary={passes:passes.length,warnings:warnings.length,failures:failures.length};
report.finalGate=true;
fs.writeFileSync(finalJsonPath,JSON.stringify(report,null,2));
fs.writeFileSync(mdPath,`# FindIt Full Production Audit\n\nGenerated: ${report.generatedAt}\n\n**Passes:** ${passes.length}  \n**Warnings:** ${warnings.length}  \n**Failures:** ${failures.length}\n\n${(report.checks||[]).map(x=>`- ${x.status==='PASS'?'✅':x.status==='WARN'?'⚠️':'❌'} **${x.name}**${x.detail?` — ${x.detail}`:''}`).join('\n')}\n`);
console.log('FINAL_AUDIT_SUMMARY='+JSON.stringify(report.summary));
process.exit(failures.length?1:0);
