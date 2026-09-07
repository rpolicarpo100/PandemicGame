// PANDEMIC EVOLUTION — concorrência SSE + prova do limite "single-world"
import { BASE, check, okAll, jget, jpost, readFirstSseFrame, sleep } from './lib.mjs';

console.log('\n▶ CONCURRENCY — SSE stress + isolamento de mundos\n');

// ---- A) 5 SSE simultâneas ----
const streams = [];
for (let i = 0; i < 5; i++) streams.push(await readFirstSseFrame(8000));
const framesOk = streams.every(s => s.frame && s.frame.phase);
check('5 SSE abrem + entregam frame', framesOk);

await sleep(1200);
let d = (await jget('/api/dev/overview')).json;
check('sse.active = 5', d.sse.active === 5, `active=${d.sse.active}`);
check('sse.peak >= 5', d.sse.peak >= 5, `peak=${d.sse.peak}`);

// ---- B) prova do mundo partilhado (limitação conhecida, documentada) ----
await jpost('/action', { type: 'newgame', scenario: 'silent' });
const st1 = await jget('/state');
const cand = st1.json.regions.find(x => x.airport && (x.climate === 'temperate' || x.climate === 'humid'));
await jpost('/action', { type: 'seed', region: cand.id });
const st2 = await jget('/state');
check('A: silent semeado', st2.json.phase === 'running' && st2.json.scenario === 'silent');

// segundo "jogador" muda de jogo
await jpost('/action', { type: 'newgame', scenario: 'rush' });
const st3 = await jget('/state');
const sharedWorld = st3.json.scenario === 'rush' && st3.json.phase === 'setup';
check('B: mundo GLOBAL partilhado (single-world)', sharedWorld,
  'jogador B alterou o jogo do jogador A — comportamento EXPECTED do slice atual (sem salas).');

// dev console confirma com flag
d = (await jget('/api/dev/overview')).json;
const flagged = (d.findings || []).some(f => f.includes('single-world'));
check('auto-crítica: finding single-world ativo', flagged);

// ---- C) fecho limpo ----
for (const s of streams) s.close();
let active = -1;
for (let i = 0; i < 10 && active !== 0; i++) {
  await sleep(700);
  active = (await jget('/api/dev/overview')).json.sse.active;
}
check('SSE libertadas (active=0)', active === 0, `active=${active}`);
d = (await jget('/api/dev/overview')).json;
check('disconnects contados', d.sse.disconnects >= 5, `disc=${d.sse.disconnects}`);
check('sessões registadas + IP anonimizado', d.sessions.length >= 5 &&
  d.sessions.every(s => /\.0$/.test(s.ip) || s.ip.startsWith('h:')), `sessions=${d.sessions.length}`);

const allOk = okAll();
process.exit(allOk ? 0 : 1);
