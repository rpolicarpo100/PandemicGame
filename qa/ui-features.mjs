// PANDEMIC EVOLUTION — UI features (Playwright, opcional; requer qa/node_modules + chromium)
// Verifica as features da ronda C-A-M no browser real:
//   M3 frota adaptativa ao ecrã · M2 banner FASE 2 aos 65% · M1 top-10 localStorage
//   C1 sessões separadas por browser · iron com barra 90% (A2) no header/briefing
// Uso:  node qa/ui-features.mjs          (contra QA_BASE, default http://127.0.0.1:3000)
import { chromium } from 'playwright';

const BASE = process.env.QA_BASE || 'http://127.0.0.1:3000';
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1500, height: 950 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
const qa = () => page.evaluate(() => window.__qa());
const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = [];
const check = (n, ok, d = '') => { results.push([n, !!ok, d]); console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${n}${d ? ' — ' + d : ''}`); };

console.log(`\n▶ UI FEATURES (C1·M1·M2·M3·A2) — ${BASE}\n`);
await page.goto(BASE + '/play');
await page.waitForFunction(() => typeof S !== 'undefined' && S && S.phase === 'setup');

// ---- M3: frota adaptativa ----
await sleep(600);
const wide = await qa();
check('M3: frota cheia em ecrã largo (≥240)', wide.fleet >= 240, `fleet=${wide.fleet} canvas=${wide.canvas[0]}x${wide.canvas[1]}`);
await page.setViewportSize({ width: 700, height: 800 });
await sleep(900);
const narrow = await qa();
check('M3: frota reduzida em ecrã estreito', narrow.fleet > 0 && narrow.fleet < wide.fleet * 0.85,
  `fleet=${narrow.fleet} (largo: ${wide.fleet}) canvas=${narrow.canvas[0]}`);
await page.setViewportSize({ width: 1500, height: 950 });
await sleep(600);

// ---- A2: objetivo dinâmico por cenário ----
check('meta.extinctFrac default = 0.95', (await qa()).extinctFrac === 0.95);

// ---- partida real silent até ao fim (com bot barato no UI + eventos respondidos) ----
await page.evaluate(() => fetch('/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'newgame', scenario: 'silent' }) }));
await page.waitForFunction(() => S && S.scenario === 'silent' && S.phase === 'setup');
const seedOk = await page.evaluate(() => {
  const r = S.regions.find(x => x.airport && (x.climate === 'temperate' || x.climate === 'humid'));
  return r ? window.__qaClickRegion(r.id) : false;
});
check('seed via clique no mapa', seedOk === true);
await page.waitForFunction(() => S && S.phase === 'running');
await page.evaluate(() => fetch('/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'speed', value: 8 }) }));

const PRIOS = ['s_incub', 's_asym', 'a_heat', 't_mob1', 'a_cold', 't_air1', 'sp_rapid', 's_lowdet', 'a_urban', 'a_humid', 'm_rate', 'a_dry'];
let seenPhase2 = false, endState = null, ev = 0, lastDay = -1;
const t0 = Date.now();
while (Date.now() - t0 < 300000) {
  const st = await qa();
  if (st.day !== lastDay) { lastDay = st.day; if (st.day % 100 === 0 || st.day < 5) console.log(`    t+${Math.round((Date.now() - t0) / 1000)}s dia ${st.day} cum=${(100 * st.cumFrac).toFixed(1)}%`); }
  if (st.phase2Seen && !seenPhase2) {
    seenPhase2 = true;
    console.log('    banner FASE 2 avistado');
  }
  if (st.phase === 'ended') { endState = st; break; }
  if (st.pendingEvent) {
    ev++;
    await page.evaluate(() => fetch('/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'eventChoice', option: 0 }) }));
  } else {
    const r = await page.evaluate((prios) => {
      const owned = new Set(S.owned || []);
      const cm = S.player ? S.player.costMod : 1;
      const nodes = S.meta.nodes;
      const find = ids => ids.find(id => { const n = nodes.find(x => x.id === id); return n && !owned.has(id) && n.req.every(q => owned.has(q)) && S.dna >= Math.round(n.cost * cm) + 10; });
      const pick = find(prios) || null;
      if (!pick) {
        const cheap = nodes.filter(x => !owned.has(x.id) && x.req.every(q => owned.has(q))).sort((a, b) => a.cost - b.cost)[0];
        if (cheap && S.dna >= cheap.cost * cm + 15) return cheap.id;
      }
      return pick;
    }, PRIOS);
    if (r) await page.evaluate((id) => fetch('/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'evolve', node: id }) }), r);
  }
  await sleep(700);
}

check('M2: banner FASE 2 apareceu (≥65% infetados)', seenPhase2);
check('jogo terminou (result)', !!endState && endState.day > 0, `day=${endState && endState.day}`);

// ---- M1: top-10 local ----
await sleep(1500);
const fin = await qa();
check('M1: painel TOP-10 visível no fim', fin.endTop.includes('TOP-10'), fin.endTop.trim().slice(0, 60));
const ls = await page.evaluate(() => localStorage.getItem('pevo.top10'));
let top = [];
try { top = JSON.parse(ls || '[]'); } catch (_) {}
check('M1: top-10 gravado em localStorage', Array.isArray(top) && top.length >= 1 && typeof top[0].score === 'number',
  `entries=${top.length} score=${top[0] && top[0].score}`);
await page.screenshot({ path: new URL('./out/shots/end_top10.png', import.meta.url).pathname });

// novo briefing reinicia a ronda na MESMA sessão
await page.evaluate(() => { document.querySelector('#endOverlay .btn').click(); });
await sleep(1200);
const fresh = await qa();
check('novo briefing: setup na MESMA sessão', fresh.phase === 'setup');
check('banner FASE 2 resetado', fresh.phase2Seen === false);
check('top-10 mantém-se entre rondas', (await page.evaluate(() => JSON.parse(localStorage.getItem('pevo.top10') || '[]'))).length >= 1);

// ---- C1: outro browser (contexto novo) entra num mundo próprio ----
const ctx2 = await b.newContext();
const other = await ctx2.newPage();
await other.goto(BASE + '/play');
await other.waitForFunction(() => typeof S !== 'undefined' && S);
const otherState = await other.evaluate(() => ({ phase: S.phase, scenario: S.scenario }));
check('C1: outro browser entra em setup (mundo próprio)', otherState.phase === 'setup',
  `phase=${otherState.phase} scenario=${otherState.scenario} (o nosso: ${fresh.phase}/${fresh.scenario})`);
await ctx2.close();

// ---- A2: iron mostra a barra de 90% no header/briefing ----
const page3 = await b.newPage({ viewport: { width: 1400, height: 900 } });
await page3.goto(BASE + '/play');
await page3.waitForFunction(() => typeof S !== 'undefined' && S && S.phase === 'setup');
await page3.evaluate(() => fetch('/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'newgame', scenario: 'iron' }) }));
await page3.waitForFunction(() => S && S.scenario === 'iron' && S.phase === 'setup');
const iron = await page3.evaluate(() => ({
  hObj: document.getElementById('hObj').textContent,
  brief: document.getElementById('objPct').textContent,
  frac: window.__qa().extinctFrac,
}));
check('A2: iron com barra 90% no UI', iron.frac === 0.9 && iron.hObj.includes('90%') && iron.brief.includes('90%'),
  JSON.stringify(iron));
await page3.close();

check('sem page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
const fails = results.filter(r => !r[1]).length;
console.log(`\n  ${results.length - fails}/${results.length} checks OK\n`);
await b.close();
process.exit(fails ? 1 : 0);
