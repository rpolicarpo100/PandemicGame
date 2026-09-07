// PANDEMIC EVOLUTION — smoke test (endpoints, SSE, ações, schemas da dev API)
import { BASE, check, okAll, jget, jpost, readFirstSseFrame, sleep } from './lib.mjs';

const out = process.argv.includes('--json');
let failed = false;

console.log(`\n▶ SMOKE — ${BASE}\n`);

// --- páginas e estáticos ---
let r = await jget('/');
check('GET / 200', r.status === 200, `HTTP ${r.status}`);
check('home.html servido', /PANDEMIC EVOLUTION/.test(r.txt));

r = await jget('/play');
check('GET /play 200', r.status === 200, `HTTP ${r.status}`);

r = await jget('/world.js');
check('GET /world.js 200', r.status === 200, `HTTP ${r.status}`);
const wj = await fetch(BASE + '/world.js');
check('world.js content-type javascript', /javascript/.test(wj.headers.get('content-type') || ''), wj.headers.get('content-type'));
const font = await jget('/fonts/mono.woff2');
check('font woff2 200', font.status === 200, `HTTP ${font.status}`);

r = await jget('/nope');
check('404 em rota inexistente', r.status === 404, `HTTP ${r.status}`);

// --- estado ---
r = await jget('/state');
check('GET /state 200 + json', r.status === 200 && r.json && r.json.phase !== undefined);
check('state: ≥170 cidades reais', r.json && Array.isArray(r.json.regions) && r.json.regions.length >= 170, `regions=${r.json && r.json.regions.length}`);
check('state: 3 cenários PvE', r.json && r.json.scenarios && r.json.scenarios.length === 3, `scenarios=${r.json && r.json.scenarios.length}`);

// --- SSE ---
const sse = await readFirstSseFrame(6000);
check('SSE entrega frame JSON', !!sse.frame && typeof sse.frame.phase === 'string', sse.frame ? `phase=${sse.frame.phase}` : 'sem frame');
sse.close();

// --- actions (fluxo de jogo autoritativo) ---
r = await jpost('/action', {});
check('ação sem type -> bad action', r.json && r.json.error === 'bad action', JSON.stringify(r.json));

r = await jpost('/action', { type: 'bogus' });
check('ação desconhecida -> erro', r.json && r.json.error === 'unknown type', JSON.stringify(r.json));

r = await jpost('/action', { type: 'newgame', scenario: 'silent' });
check('newgame silent ok', r.json && r.json.ok === true && r.json.scenario === 'silent', JSON.stringify(r.json));

r = await jpost('/action', { type: 'seed', region: 'regiao-inexistente' });
check('seed região inválida -> erro', r.json && r.json.error === 'bad region', JSON.stringify(r.json));

// seed real
const st = await jget('/state');
const cand = st.json.regions.find(x => x.airport && (x.climate === 'temperate' || x.climate === 'humid'));
r = await jpost('/action', { type: 'seed', region: cand.id });
check('seed região válida ok', r.json && r.json.ok === true, cand.id);

r = await jpost('/action', { type: 'evolve', node: 'nao-existe' });
check('evolve nó inexistente -> erro (em running)', r.json && r.json.error === 'unknown node', JSON.stringify(r.json));

// evolve nó mais barato
const st2 = await jget('/state');
const owned = new Set(st2.json.owned);
const cheap = st2.json.meta.nodes.filter(n => !owned.has(n.id) && n.req.every(x => owned.has(x))).sort((a, b) => a.cost - b.cost)[0];
r = await jpost('/action', { type: 'evolve', node: cheap.id });
check('evolve mais barato ok', r.json && r.json.ok === true && typeof r.json.dna === 'number', `node=${cheap.id} dna=${r.json && r.json.dna}`);

// --- dev console ---
r = await jget('/dev');
check('GET /dev 200 + DEV CONSOLE', r.status === 200 && /DEV CONSOLE/.test(r.txt), `HTTP ${r.status}`);

r = await jget('/api/dev/overview');
const d = r.json;
check('overview json ok', r.status === 200 && d && d.ok === true);
check('overview: wallet dev', d && d.wallet && d.wallet.address && d.wallet.address.startsWith('8biED'), d && d.wallet && d.wallet.address.slice(0, 8) + '…');
check('overview: código local (LOC)', d && d.code && d.code.local && d.code.local.totalLines > 500, d && d.code ? `${d.code.local.totalLines} linhas` : 'n/a');
check('overview: health score com partes', d && d.score && d.score.parts && Object.keys(d.score.parts).length === 6, d && d.score ? `value=${d.score.value}` : 'n/a');
check('overview: findings (auto-crítica)', Array.isArray(d.findings) && d.findings.length >= 1);
check('overview: http total cresceu', d.http.total >= 10, `total=${d.http.total}`);
check('overview: rings 60 bins', Array.isArray(d.rings.http) && d.rings.http.length === 60);

// ações contadas na telemetria
check('telemetria: dnaSpent>0', d.game.dnaSpent > 0, `spent=${d.game.dnaSpent}`);
check('telemetria: evolves>0', d.game.evolves > 0, `evolves=${d.game.evolves}`);

// --- latência (30 pedidos /state) ---
const t0 = Date.now();
for (let i = 0; i < 30; i++) await jget('/state', 2000);
const msAvg = (Date.now() - t0) / 30;
check('latência média /state < 50ms', msAvg < 50, msAvg.toFixed(1) + ' ms');

await sleep(200);
const d2 = (await jget('/api/dev/overview')).json;
const errOk = d2.http.serverErr === 0;
check('zero erros 5xx acumulados', errOk, `5xx=${d2.http.serverErr}`);

const allOk = okAll();
process.exit(allOk ? 0 : 1);
