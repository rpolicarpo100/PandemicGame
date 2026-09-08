// PANDEMIC EVOLUTION — QA PvP HTTP: create → join → lobby → start → dias → evolve → SSE
// Uso: servidor local (PORT=4000 node game/server.js) · node qa/pvp-http.mjs
import http from 'node:http';
import { BASE as B } from './lib.mjs';
let fails = 0;
const check = (name, cond, extra) => {
  console.log((cond ? 'PASS' : 'FAIL') + ' ' + name + (extra !== undefined ? ' | ' + extra : ''));
  if (!cond) fails++;
};
const j = (o) => (o && o.error ? o.error : JSON.stringify(o).slice(0, 200));
async function api(method, path, sid, body) {
  const r = await fetch(B + path, {
    method, headers: { 'Content-Type': 'application/json', 'Cookie': 'pev_sid=' + sid },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json();
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

// --- 1. create (A) ---
const A = 'pvpA_' + Math.random().toString(36).slice(2, 8);
const Bs = 'pvpB_' + Math.random().toString(36).slice(2, 8);
const c1 = await api('POST', '/pvp/create', A, {});
check('create ok', c1.ok && /^[A-Z2-9]{6}$/.test(c1.code), j(c1));
const code = c1.code;
check('create state lobby', c1.state && c1.state.phase === 'lobby');
check('create host me', c1.state && c1.state.pvp.host === true);
check('lobby agents list', c1.state.meta.agents.length >= 6, 'agents=' + (c1.state.meta.agents || []).length);

// --- 2. join (B) ---
const c2 = await api('POST', '/pvp/join', Bs, { code });
check('join ok', c2.ok && c2.code === code, j(c2));
const st2 = await api('GET', '/pvp/state?c=' + code, Bs, null);
check('B vê 2 jogadores', st2.state.pvp.players.length === 2);
check('B não é host', st2.state.pvp.host === false);
const st1 = await api('GET', '/pvp/state?c=' + code, A, null);
check('A vê 2 jogadores', st1.state.pvp.players.length === 2);
check('sem agentes default', st1.state.pvp.players.every(p => p.name.includes('OPERADOR')), st1.state.pvp.players.map(p => p.name).join('|'));

// --- 3. lobby: agentes distintos ---
const agents = st1.state.meta.agents.map(a => a.id);
const ra = await api('POST', '/pvp/act', A, { type: 'agent', agent: agents[0] });
const rb = await api('POST', '/pvp/act', Bs, { type: 'agent', agent: agents[1] });
check('A agent ok', ra.ok, j(ra));
check('B agent ok', rb.ok, j(rb));
const dup = await api('POST', '/pvp/act', Bs, { type: 'agent', agent: agents[0] });
check('agente duplicado bloqueado', !dup.ok, j(dup));

// --- 4. seeds distintos ---
const regs = await api('GET', '/pvp/state?c=' + code, A, null);
const [r1, r2] = [regs.state.regions[0], regs.state.regions[1]];
const sa = await api('POST', '/pvp/act', A, { type: 'seed', region: r1.id });
const sb = await api('POST', '/pvp/act', Bs, { type: 'seed', region: r2.id });
check('A seed ok', sa.ok, j(sa));
check('B seed ok', sb.ok, j(sb));
const sdup = await api('POST', '/pvp/act', Bs, { type: 'seed', region: r1.id });
check('região duplicada bloqueada', !sdup.ok, j(sdup));

// --- 5. ready + start ---
const bf = await api('POST', '/pvp/act', Bs, { type: 'start' });           // B não é host
check('só host inicia', !bf.ok, j(bf));
const na = await api('POST', '/pvp/act', A, { type: 'start' });            // sem ready
check('sem ready não inicia', !na.ok, j(na));
await api('POST', '/pvp/act', A, { type: 'ready' });
await api('POST', '/pvp/act', Bs, { type: 'ready' });
const rstart = await api('POST', '/pvp/act', A, { type: 'start' });
check('start ok', rstart.ok, j(rstart));

// --- 6. dias passam (speed 1, 2s/dia) ---
await sleep(6500);
const run = await api('GET', '/pvp/state?c=' + code, A, null);
check('running phase', run.state.phase === 'running', run.state.phase);
check('dia > 0', run.state.day >= 2, 'day=' + run.state.day);
check('minha infeção > 0', run.state.world.infected > 0, 'inf=' + run.state.world.infected);
check('cumInf > 0', run.state.world.cumInf > 0);
check('região seed com i>0', run.state.regions.find(r => r.id === r1.id).i > 0);
check('meta lite no SSE não testado aqui', true);

// --- 7. evolve barato ---
const affordable = (run.state.meta.nodes || []).filter(n => !n.req.length && Math.round(n.cost * run.state.player.costMod) <= run.state.dna);
check('nós iniciais disponíveis', affordable.length > 0, 'n=' + affordable.length);
const ev = await api('POST', '/pvp/act', A, { type: 'evolve', node: affordable[0].id });
check('evolve ok', ev.ok, j(ev));

// --- 8. speed control by host ---
const sp = await api('POST', '/pvp/act', A, { type: 'speed', value: 8 });
check('speed 8 ok', sp.ok && sp.speed === 8, j(sp));
await sleep(2600);
const run2 = await api('GET', '/pvp/state?c=' + code, A, null);
check('dias aceleraram', run2.state.day >= run.state.day + 4, 'day ' + run.state.day + '->' + run2.state.day);

// --- 9. SSE lite (EventSource-like read) ---
const U = new URL(B);
const sseText = await new Promise((resolve) => {
  const req = http.get({ host: U.hostname, port: +U.port, path: '/pvp/events?c=' + code, headers: { Cookie: 'pev_sid=' + A } }, res => {
    let buf = '';
    const t = setTimeout(() => { req.destroy(); resolve(buf); }, 3500);
    res.on('data', d => { buf += d; if (buf.length > 800000) { clearTimeout(t); req.destroy(); resolve(buf); } });
    res.on('error', () => resolve(buf));
  });
});
const frames = sseText.split('\n\n').filter(x => x.startsWith('data:'));
check('SSE recebe frames', frames.length >= 2, 'frames=' + frames.length);
const f1 = JSON.parse(frames[0].slice(6));
check('SSE frame tem state+code', f1.code === code && f1.state && f1.state.phase === 'running');
check('SSE lite sem edges', !f1.state.meta.edges || f1.state.meta.lite === true, JSON.stringify(f1.state.meta).slice(0, 60));
const dayFirst = f1.state.day;

// --- 10. salas terminam por relógio? demasiado longo — pelo menos limpeza: leave ---
const lvB = await api('POST', '/pvp/leave', Bs, {});
check('B saiu', lvB.ok);
const stA = await api('GET', '/pvp/state?c=' + code, A, null);
check('A ainda na sala (2->1)', stA.state.pvp.players.length === 1);
await api('POST', '/pvp/leave', A, {});
const gone = await api('GET', '/pvp/state?c=' + code, A, null);
check('sala apagada quando vazia', gone.room === null);

console.log(fails ? '\nPVP HTTP QA: ' + fails + ' FAIL' : '\nPVP HTTP QA: ALL PASS');
process.exit(fails ? 1 : 0);
