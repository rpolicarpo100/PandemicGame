// PANDEMIC EVOLUTION — agentes (regressão por tipo + exclusividade por agente)
// 1 sim smart/silent por tipo de agente (headless) + checks de API (filtro/nós).
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, okAll, jget, jpost } from './lib.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const AGENTS = ['bacteria', 'virus', 'fungo', 'priao', 'nano', 'bio'];

console.log('\n▶ AGENTES — 6 tipos · 1 sim smart/silent cada\n');
const rows = [];
for (const ag of AGENTS) {
  const r = spawnSync(process.execPath, ['game/server.js', '--simtest', 'smart', '--scenario', 'silent'],
    { cwd: root, env: { ...process.env, SIM_AGENT: ag }, encoding: 'utf8', timeout: 120000 });
  let out = null;
  for (const l of (r.stdout || '').split('\n')) { try { const j = JSON.parse(l); if (j && j.strategy) out = j; } catch (_) {} }
  rows.push({ ag, code: r.status, out });
  console.log(`  ${ag.padEnd(9)} ${out ? `win=${String(out.win).padEnd(5)} day=${String(out.day).padEnd(4)} dead=${out.deadPct}% score=${out.score}` : `FALHOU (${r.status})`}`);
}

// 1) todos os agentes correm sem crash
check('6 agentes correm sem crash', rows.every(x => x.code === 0 && x.out && typeof x.out.win === 'boolean'));
// 2) esquema com score presente
check('score presente nos 6', rows.every(x => x.out && Number.isFinite(x.out.score)));
// 3) meta: 6 agentes listados
const st = (await jget('/state')).json;
check('API: 6 agentes listados', st && st.meta && st.meta.agents && st.meta.agents.length === 6,
  `agents=${st && st.meta && st.meta.agents ? st.meta.agents.length : 0}`);
// 4) exclusividade: com bacteria ativo, meta.nodes só inclui sp_bac (não os dos outros)
const owners = {};
for (const ag of AGENTS) {
  await jpost('/action', { type: 'newgame' });
  await jpost('/action', { type: 'agent', agent: ag });
  const s2 = (await jget('/state')).json;
  owners[ag] = s2.meta.nodes.filter(n => n.agentOnly).map(n => n.id);
}
check('nó exclusivo correto por agente',
  owners.bacteria.length === 1 && owners.bacteria[0] === 'sp_bac' &&
  owners.virus[0] === 'sp_vir' && owners.fungo[0] === 'sp_fun' &&
  owners.priao[0] === 'sp_pri' && owners.nano[0] === 'sp_nano' && owners.bio[0] === 'sp_bio',
  JSON.stringify(owners));
// 5) comprar nó exclusivo de OUTRO agente é rejeitado (bacteria tenta sp_vir)
await jpost('/action', { type: 'agent', agent: 'bacteria' });
const st2 = (await jget('/state')).json;
if (st2.phase === 'setup') {
  const cand = st2.regions.find(x => x.airport);
  await jpost('/action', { type: 'newgame', scenario: 'silent' });
  await jpost('/action', { type: 'seed', region: cand.id });
}
const rBuy = await jpost('/action', { type: 'evolve', node: 'sp_vir' });
check('evolve sp_vir com bacteria ativo é rejeitado', rBuy.json && rBuy.json.error,
  JSON.stringify(rBuy.json));

const allOk = okAll();
process.exit(allOk ? 0 : 1);
