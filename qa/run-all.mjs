// PANDEMIC EVOLUTION — run-all: smoke + concurrency + balance (+ e2e/UI opcionais)
// Uso:  node qa/run-all.mjs [--full] [--ui]
// Pré-requisito: servidor local a correr (ex.: PORT=4000 node game/server.js)
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'qa', 'out');
fs.mkdirSync(outDir, { recursive: true });
const full = process.argv.includes('--full');
const withUi = process.argv.includes('--ui');

const steps = ['smoke.mjs', 'concurrency.mjs', 'balance.mjs'];
if (full) steps.push('e2e-game.mjs');
if (withUi) steps.push('ui.mjs');

const md = ['# QA REPORT — PANDEMIC EVOLUTION', '',
  `- data: ${new Date().toISOString()}`, `- base: ${process.env.QA_BASE || 'http://127.0.0.1:4000'}`,
  `- node: ${process.version}`, '', '## Resumo', ''];
let allOk = true;

for (const step of steps) {
  console.log(`\n${'='.repeat(64)}\n>>> qa/${step}\n${'='.repeat(64)}`);
  const r = spawnSync(process.execPath, [path.join('qa', step)], { cwd: root, encoding: 'utf8', timeout: 900000 });
  process.stdout.write(r.stdout || '');
  if (r.stderr) process.stderr.write(r.stderr);
  const ok = r.status === 0;
  allOk = allOk && ok;
  md.push(`### ${step} — ${ok ? '✅ PASS' : '❌ FAIL'}`);
  md.push('');
  md.push('```');
  md.push((r.stdout || '').trim());
  md.push('```');
  md.push('');
}
md.push(`# RESULTADO GLOBAL: ${allOk ? '✅ TODOS OS TESTES PASSARAM' : '❌ HÁ FALHAS'}`);
fs.writeFileSync(path.join(outDir, 'QA-REPORT.md'), md.join('\n'));
console.log(`\nRelatório: qa/out/QA-REPORT.md`);
process.exit(allOk ? 0 : 1);
