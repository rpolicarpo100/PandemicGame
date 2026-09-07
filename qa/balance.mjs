// PANDEMIC EVOLUTION — balance test (bots headless do próprio servidor: --simtest)
// Corrida real da simulação completa (sem HTTP) para as 3 estratégias.
// A3: n>=4 por estratégia útil (smart/cheap) + linha IRON (barra 90% + colapso A2).
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, okAll } from './lib.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
// [estratégia, cenário, reps]
const RUNS = [['dumb', 'standard', 2], ['cheap', 'standard', 4], ['smart', 'standard', 4]];
const IRON = ['smart', 'iron', 3];

console.log('\n▶ BALANCE — bots headless (server.js --simtest, bot partilhado lib/bot.cjs)\n');
console.log('  estratégia | resultado                    | win  | dia  | inf% | mortos% | nós | builds | vacina');
console.log('  -----------+------------------------------+------+------+------+---------+-----+--------+-------');

const runs = [];
for (const [strat, scen, reps] of RUNS) {
  for (let rep = 0; rep < reps; rep++) {
    const r = spawnSync(process.execPath, ['game/server.js', '--simtest', strat, '--scenario', scen],
      { cwd: root, encoding: 'utf8', timeout: 180000 });
    const lines = r.stdout.trim().split('\n').filter(Boolean);
    let out = null;
    for (const l of lines) { try { const j = JSON.parse(l); if (j.strategy) out = j; } catch (_) {} }
    runs.push({ strat, scen, rep, out, code: r.status, stderr: (r.stderr || '').slice(0, 300) });
    if (out) {
      console.log(`  ${(strat + '/' + scen).padEnd(10)} | ${String(out.result).slice(0, 28).padEnd(28)} | ${String(out.win).padEnd(4)} | ${String(out.day).padEnd(4)} | ${String(out.cumInfPct).padEnd(4)} | ${String(out.deadPct).padEnd(7)} | ${String(out.nodes).padEnd(3)} | ${String(out.builds).padEnd(6)} | ${out.vaccine}`);
    } else {
      console.log(`  ${strat.padEnd(10)} | FALHOU (exit ${r.code}) ${r.stderr.slice(0, 120)}`);
    }
  }
}

// ---- iron (info; a barra de 90% + colapso A2 tornam-no ganhável mas raro) ----
console.log('  -----------+------------------------------+------+------+------+---------+-----+--------+-------');
console.log('  (IRON info — barra própria 90% + colapso A2; vitória rara de propósito)');
const ironRuns = [];
for (let rep = 0; rep < IRON[2]; rep++) {
  const r = spawnSync(process.execPath, ['game/server.js', '--simtest', IRON[0], '--scenario', IRON[1]],
    { cwd: root, encoding: 'utf8', timeout: 180000 });
  let out = null;
  for (const l of (r.stdout || '').split('\n')) { try { const j = JSON.parse(l); if (j.strategy) out = j; } catch (_) {} }
  ironRuns.push({ out, code: r.status });
  if (out) console.log(`  iron       | ${String(out.result).slice(0, 28).padEnd(28)} | ${String(out.win).padEnd(4)} | ${String(out.day).padEnd(4)} | ${String(out.cumInfPct).padEnd(4)} | ${String(out.deadPct).padEnd(7)} | ${String(out.nodes).padEnd(3)} | ${String(out.builds).padEnd(6)} | ${out.vaccine}`);
}

// assertions
const parsed = runs.filter(x => x.out);
const total = RUNS.reduce((s, x) => s + x[2], 0);
check(`todas as ${total} corridas terminam sem crash`, runs.length === total && runs.every(r => r.code === 0), 'exit codes ok');
check('output JSON com schema completo', parsed.length === total && parsed.every(x =>
  typeof x.out.win === 'boolean' && Number.isFinite(x.out.day) && Number.isFinite(x.out.cumInfPct) &&
  Number.isFinite(x.out.deadPct) && Number.isFinite(x.out.nodes)));
const dumb = runs.filter(x => x.strat === 'dumb').map(x => x.out).filter(Boolean);
check('dumb (sem evoluções) nunca vence', dumb.length >= 2 && dumb.every(x => x.win === false),
  dumb.map(x => x.result).join(' | '));
const smart = runs.filter(x => x.strat === 'smart').map(x => x.out).filter(Boolean);
const cheap = runs.filter(x => x.strat === 'cheap').map(x => x.out).filter(Boolean);
const smartWins = smart.filter(x => x.win).length;
const cheapWins = cheap.filter(x => x.win).length;
check('dia de fim dentro do relógio (≤405)', parsed.every(x => x.out.day <= 405), 'todos os dias ≤405');
check('inf% é percentagem válida', parsed.every(x => x.out.cumInfPct >= 0 && x.out.cumInfPct <= 100));
const agentWins = smartWins + cheapWins;
check('agentes com estratégia vencem em standard', agentWins >= 3, `smart=${smartWins}/4 · cheap=${cheapWins}/4 (calibrado: 3-5/8 típico)`);
const ironOk = ironRuns.length === 3 && ironRuns.every(r => r.code === 0 && r.out);
const ironWins = ironRuns.filter(r => r.out && r.out.win).length;
check('iron: 3 corridas sem crash', ironOk, 'iron info');
console.log(`\n  INFO: iron ${ironWins}/3 vitórias (barra 90%+colapso) · amostras maiores que nas rondas anteriores (A3): smart/cheap 4x, iron 3x.`);

const allOk = okAll();
process.exit(allOk ? 0 : 1);
