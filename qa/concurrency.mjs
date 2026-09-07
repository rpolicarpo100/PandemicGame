// PANDEMIC EVOLUTION — concorrência SSE + isolamento de mundos por sessão (C1)
import { check, okAll, jget, readFirstSseFrame, sleep, fresh } from './lib.mjs';

console.log('\n▶ CONCURRENCY — SSE stress + mundos por sessão (C1)\n');

// ---- A) 5 SSE simultâneas, cada uma no seu "browser" ----
const jars = [fresh(), fresh(), fresh(), fresh(), fresh()];
const streams = [];
for (let i = 0; i < 5; i++) streams.push(await readFirstSseFrame(jars[i], 8000));
const framesOk = streams.every(s => s.frame && s.frame.phase);
check('5 SSE abrem + entregam frame', framesOk);

await sleep(1200);
let d = (await jget('/api/dev/overview')).json;
check('sse.active = 5', d.sse.active === 5, `active=${d.sse.active}`);
check('sse.peak >= 5', d.sse.peak >= 5, `peak=${d.sse.peak}`);

// ---- B) isolamento: cada sessão tem o SEU mundo ----
// jogador A: silent e semeado (running)
const A = fresh();
await A.post('/action', { type: 'newgame', scenario: 'silent' });
let a0 = (await A.get('/state')).json;
const cand = a0.regions.find(x => x.airport && (x.climate === 'temperate' || x.climate === 'humid'));
await A.post('/action', { type: 'seed', region: cand.id });
const a1 = (await A.get('/state')).json;
check('A: silent semeado', a1.phase === 'running' && a1.scenario === 'silent');

// jogador B (nunca tocou no mundo do A) entra: deve estar em setup, mundo próprio
const B = fresh();
const b0 = (await B.get('/state')).json;
check('B: entra em mundo próprio (setup, não-running)', b0.phase === 'setup',
  `phase=${b0.phase} (isolation: não herda o running do A)`);
const bCand = b0.regions.find(x => x.airport && (x.climate === 'temperate' || x.climate === 'humid'));
await B.post('/action', { type: 'newgame', scenario: 'rush' });
await B.post('/action', { type: 'seed', region: bCand.id });
const b1 = (await B.get('/state')).json;
check('B: rush semeado no seu mundo', b1.phase === 'running' && b1.scenario === 'rush');

// jogador C: escolhe outro agente no SEU setup — não afeta A nem B
const C = fresh();
await C.post('/action', { type: 'newgame' });
const c1 = (await C.get('/state')).json;
await C.post('/action', { type: 'agent', agent: 'virus' });
const c2 = (await C.get('/state')).json;
check('C: escolhe virus no seu mundo', c1.phase === 'setup' && c2.agent === 'virus');

// A continua intacto apesar de B e C terem jogado (antes: griefing global)
await sleep(400);
const a2 = (await A.get('/state')).json;
check('A: intacto após B+C jogarem (anti-griefing)',
  a2.phase === 'running' && a2.scenario === 'silent' && a2.agent === a1.agent && a2.day >= a1.day,
  `phase=${a2.phase} scenario=${a2.scenario} agent=${a2.agent} dia ${a1.day}->${a2.day}`);

// mesma sessão (mesmo cookie) = mesmo mundo; ?sid= repetido também é coerente
const S1 = fresh();
const q1 = await S1.get('/state?sid=qatest123');
await S1.post('/action', { type: 'newgame', scenario: 'rush' });
const q2 = await S1.get('/state?sid=qatest123');
check('?sid= mantém a mesma sessão entre pedidos', q1.status === 200 && q2.json && q2.json.scenario === 'rush');

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
