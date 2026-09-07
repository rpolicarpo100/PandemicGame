// PANDEMIC EVOLUTION — e2e full game via HTTP real (bot policy simples, speed 4)
// Joga uma partida até ao fim pelo protocolo real (POST /action + GET /state)
// e confirma que a dev console regista a partida no ledger/telemetria.
import { check, okAll, jget, jpost, sleep } from './lib.mjs';

const SCENARIO = process.env.E2E_SCENARIO || 'silent';   // silent ~200s, rush ~130s no speed 4
const WALL = 260000;                                      // 260s max por partida

console.log(`\n▶ E2E GAME — partida completa via HTTP (cenário ${SCENARIO}, speed 4)\n`);

const before = (await jget('/api/dev/overview')).json;

let res = await jpost('/action', { type: 'newgame', scenario: SCENARIO });
check(`newgame ${SCENARIO}`, res.json && res.json.ok);

let st = (await jget('/state')).json;
const cand = st.regions.find(x => x.airport && (x.climate === 'temperate' || x.climate === 'humid'));
res = await jpost('/action', { type: 'seed', region: cand.id });
check(`seed ${cand.id}`, res.json && res.json.ok === true);
await jpost('/action', { type: 'speed', value: 4 });

const t0 = Date.now();
let day = 0, actions = 0, buys = 0;
let result = null;
while (Date.now() - t0 < WALL) {
  await sleep(1500);
  st = (await jget('/state')).json;
  if (!st || st.phase === 'ended') { result = st.result; break; }
  if (!st || !st.meta) continue;
  day = st.day;
  if (st.pendingEvent) {
    await jpost('/action', { type: 'eventChoice', option: 0 });
    actions++;
    continue;
  }
  // bot simples: compra evolução barata sempre que houver folga, prioridade stealth/transmissão
  const owned = new Set(st.owned || []);
  const prefs = ['s_incub', 's_asym', 's_lowdet', 'a_heat', 't_mob1', 'a_cold', 't_air1', 'sp_rapid', 'a_urban'];
  let n = null;
  for (const pid of prefs) {
    const nn = st.meta.nodes.find(x => x.id === pid && !owned.has(pid) && x.req.every(r => owned.has(r)));
    if (nn && st.dna >= Math.round(nn.cost * 1.2)) { n = nn; break; }
  }
  if (!n) {
    const cheap = st.meta.nodes.filter(x => !owned.has(x.id) && x.req.every(r => owned.has(r)))
      .sort((a, b) => a.cost - b.cost)[0];
    if (cheap && st.dna >= cheap.cost + 12) n = cheap;
  }
  if (n) { const r2 = await jpost('/action', { type: 'evolve', node: n.id }); if (r2.json && r2.json.ok) buys++; actions++; }
}
check('partida chegou ao fim (result)', !!result && typeof result.win === 'boolean',
  result ? `${result.win ? 'VITÓRIA' : 'DERROTA'} — ${String(result.reason).slice(0, 50)} (dia ${result.day})` : 'timeout');
check('jogo progrediu (dia > 100)', day > 100, `dia ${day}`);

// telemetria
const after = (await jget('/api/dev/overview')).json;
const newLedger = after.ledger.filter(x => x.t > before.t);
const endedDelta = after.game.ended - before.game.ended;
const spentDelta = after.game.dnaSpent - before.game.dnaSpent;
const evoDelta = after.game.evolves - before.game.evolves;
check('ledger: nova partida registada', newLedger.length >= 1, `+${newLedger.length}`);
check('contador de partidas terminadas subiu', endedDelta >= 1, `+${endedDelta}`);
check('DNA gasto acumulado (telemetria económica)', spentDelta > 0 && evoDelta > 0, `+${spentDelta} DNA em +${evoDelta} evoluções`);
const g = newLedger[0];
check('registo com métricas completas', !!g && typeof g.infPct === 'number' && typeof g.dna === 'number' &&
  typeof g.sec === 'number' && g.scenario === SCENARIO, `inf=${g && g.infPct}% dna=${g && g.dna} dur=${g && g.sec}s`);
check('inf% fisicamente plausível (≤150%)', !g || g.infPct <= 150, `inf=${g && g.infPct}%`);
if (newLedger[0]) {
  console.log(`\n  partida: ${newLedger[0].win ? 'WIN' : 'LOSE'} · dia ${newLedger[0].day} · inf ${newLedger[0].infPct}% · nós ${newLedger[0].nodes} · builds ${newLedger[0].builds} · ${newLedger[0].sec}s wall-clock`);
}

const allOk = okAll();
process.exit(allOk ? 0 : 1);
