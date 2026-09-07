// PANDEMIC EVOLUTION — balance test (bots headless do próprio servidor: --simtest)
// Corrida real da simulação completa (sem HTTP) para as 3 estratégias.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, okAll } from './lib.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const STRATS = ['dumb', 'cheap', 'smart'];

console.log('\n▶ BALANCE — bots headless (server.js --simtest)\n');
console.log('  estratégia | resultado                    | win  | dia  | inf% | mortos% | nós | builds | vacina');
console.log('  -----------+------------------------------+------+------+------+---------+-----+--------+-------');

const runs = [];
for (const strat of STRATS) {
  for (let rep = 0; rep < 2; rep++) {
    const r = spawnSync(process.execPath, ['game/server.js', '--simtest', strat], { cwd: root, encoding: 'utf8', timeout: 120000 });
    const lines = r.stdout.trim().split('\n').filter(Boolean);
    let out = null;
    for (const l of lines) { try { const j = JSON.parse(l); if (j.strategy) out = j; } catch (_) {} }
    runs.push({ strat, rep, out, code: r.status, stderr: (r.stderr || '').slice(0, 300) });
    if (out) {
      console.log(`  ${strat.padEnd(10)} | ${String(out.result).slice(0, 28).padEnd(28)} | ${String(out.win).padEnd(4)} | ${String(out.day).padEnd(4)} | ${String(out.cumInfPct).padEnd(4)} | ${String(out.deadPct).padEnd(7)} | ${String(out.nodes).padEnd(3)} | ${String(out.builds).padEnd(6)} | ${out.vaccine}`);
    } else {
      console.log(`  ${strat.padEnd(10)} | FALHOU (exit ${r.code}) ${r.stderr.slice(0, 120)}`);
    }
  }
}

// assertions
const parsed = runs.filter(x => x.out);
check('6 corridas terminam sem crash', runs.length === 6 && runs.every(r => r.code === 0), `exit codes ok`);
check('output JSON com schema completo', parsed.length === 6 && parsed.every(x =>
  typeof x.out.win === 'boolean' && Number.isFinite(x.out.day) && Number.isFinite(x.out.cumInfPct) &&
  Number.isFinite(x.out.deadPct) && Number.isFinite(x.out.nodes)));
const dumb = runs.filter(x => x.strat === 'dumb').map(x => x.out).filter(Boolean);
check('dumb (sem evoluções) nunca vence', dumb.length === 2 && dumb.every(x => x.win === false),
  dumb.map(x => x.result).join(' | '));
const smart = runs.filter(x => x.strat === 'smart').map(x => x.out).filter(Boolean);
const smartWins = smart.filter(x => x.win).length;
const cheap = runs.filter(x => x.strat === 'cheap').map(x => x.out).filter(Boolean);
const agentWins = smartWins + cheap.filter(x => x.win).length;
check('dia de fim dentro do relógio (≤400+5)', parsed.every(x => x.out.day <= 405), 'todos os dias ≤405');
check('inf% é percentagem válida', parsed.every(x => x.out.cumInfPct >= 0 && x.out.cumInfPct <= 100));
const agentOk = agentWins >= 1;
console.log(`\n  ${agentOk ? 'INFO' : '⚠ SINAL DE BALANCE'}: vitórias com estratégia — smart=${smartWins}/2 · cheap=${cheap.filter(x => x.win).length}/2 · dumb=0/2 (amostra pequena; win rates são sinal de calibração, não de bug — comparar com README: cheap ~38%, smart ~60%).`);

const allOk = okAll();
process.exit(allOk ? 0 : 1);
