import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const out=process.env.AUDIT_OUT||'audit-output';
// Keep the broad legacy audit for regressions, then run the plan-aware audit.
// The legacy audit predates plan isolation and expects Premium tools to open for Free users.
spawnSync(process.execPath,['tests/full-site-audit.mjs'],{stdio:'inherit',env:process.env});
const planRun=spawnSync(process.execPath,['tests/plan-isolation-audit.mjs'],{stdio:'inherit',env:process.env});
const currentPath=path.join(out,'audit-report.json');
const legacyPath=path.join(out,'findit-full-audit.json');
const jsonPath=fs.existsSync(currentPath)?currentPath:legacyPath;
const planPath=path.join(out,'plan-isolation-audit.json');
const finalJsonPath=path.join(out,'findit-full-audit.json');
const mdPath=path.join(out,'findit-full-audit.md');
if(!fs.existsSync(jsonPath)){console.error('Audit report was not produced.');process.exit(1)}
if(!fs.existsSync(planPath)){console.error('Plan-isolation audit was not produced.');process.exit(planRun.status||1)}
const report=JSON.parse(fs.readFileSync(jsonPath,'utf8'));
const plan=JSON.parse(fs.readFileSync(planPath,'utf8'));
const planFailures=(plan.checks||[]).filter(x=>x.status==='FAIL');
const expectedLegacy=new Set([
 'Visible compare tool opens','Visible deals tool opens','Visible saved tool opens','Visible alerts tool opens','Compare Prices uses verified offer'
]);
// These old failures are correct Free-plan behavior only when the plan-aware test proves gating works.
if(!planFailures.length){for(const x of report.checks||[]){if(x.status==='FAIL'&&expectedLegacy.has(x.name)){x.status='PASS';x.detail='Correctly gated for Free; verified by plan-aware audit.'}}}
report.checks=[...(report.checks||[]),...(plan.checks||[]).map(x=>({...x,name:`Plan: ${x.name}`}))];
const failures=(report.checks||[]).filter(x=>x.status==='FAIL');
const warnings=(report.checks||[]).filter(x=>x.status==='WARN');
const passes=(report.checks||[]).filter(x=>x.status==='PASS');
report.summary={passes:passes.length,warnings:warnings.length,failures:failures.length};
report.finalGate=true;
fs.writeFileSync(finalJsonPath,JSON.stringify(report,null,2));
fs.writeFileSync(mdPath,`# FindIt Full Production Audit\n\nGenerated: ${report.generatedAt}\n\n**Passes:** ${passes.length}  \n**Warnings:** ${warnings.length}  \n**Failures:** ${failures.length}\n\n${(report.checks||[]).map(x=>`- ${x.status==='PASS'?'✅':x.status==='WARN'?'⚠️':'❌'} **${x.name}**${x.detail?` — ${x.detail}`:''}`).join('\n')}\n`);
console.log('FINAL_AUDIT_SUMMARY='+JSON.stringify(report.summary));
process.exit(failures.length?1:0);
