// PANDEMIC EVOLUTION — QA ronda "implementa" (R6 tooltip hub · R3 medalhas · R9 win-rate no /dev)
// Browser real + chamadas diretas às funções do UI.
import { chromium } from 'playwright';

const BASE = process.env.QA_BASE || 'http://127.0.0.1:3000';
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1500, height: 950 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
const results = [];
const check = (n, ok, d = '') => { results.push([n, !!ok, d]); console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${n}${d ? ' — ' + d : ''}`); };

console.log(`\n▶ R7 EXTRA (R6·R3·R9) — ${BASE}\n`);

// ---- R3: medalOf (funções globais do inline script; requer /play carregado) ----
await page.goto(BASE + '/pve');
await page.waitForFunction(() => typeof S !== 'undefined' && S && S.phase === 'setup');
const medal = await page.evaluate(() => {
  const mk = dp => medalOf({ win: false, dead: dp * 100, worldPop: 100 });
  return {
    absolute: medalOf({ win: true, dead: 99.5, worldPop: 100 }).m,
    total: medalOf({ win: true, dead: 97.5, worldPop: 100 }).m,
    holocausto: mk(0.93).m,
    colapso: mk(0.80).m,
    pandemia: mk(0.60).m,
    surto: mk(0.10).m,
  };
});
check('R3: medalhas — win 99.5% = EXTINÇÃO ABSOLUTA', medal.absolute === 'EXTINÇÃO ABSOLUTA', medal.absolute);
check('R3: medalhas — win 97.5% = EXTINÇÃO TOTAL', medal.total === 'EXTINÇÃO TOTAL', medal.total);
check('R3: medalhas — 93% = HOLOCAUSTO GLOBAL', medal.holocausto === 'HOLOCAUSTO GLOBAL', medal.holocausto);
check('R3: medalhas — 80% = COLAPSO DA HUMANIDADE', medal.colapso === 'COLAPSO DA HUMANIDADE', medal.colapso);
check('R3: medalhas — 60% = PANDEMIA MUNDIAL', medal.pandemia === 'PANDEMIA MUNDIAL', medal.pandemia);
check('R3: medalhas — 10% = SURTO CONTIDO', medal.surto === 'SURTO CONTIDO', medal.surto);

// ---- R6: tooltip com HUB GLOBAL na fase de setup ----
await page.evaluate(() => fetch('/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'newgame', scenario: 'silent' }) }));
await page.waitForFunction(() => S && S.phase === 'setup' && S.scenario === 'silent');
// despacha mousemove nas coordenadas de um hub (aeroporto + pop>=15 + temperate/humid) e lê #tooltip
const tipText = await page.evaluate(() => {
  const r = S.regions.find(x => x.airport && x.pop >= 15 && (x.climate === 'temperate' || x.climate === 'humid'));
  if (!r) return null;
  const cv = document.getElementById('map');
  const rect = cv.getBoundingClientRect();
  const proj = (lon, lat) => {
    const pad = 30;
    const w = Math.min(cv.width - pad * 2, (cv.height - pad * 2) * 2);
    const hh = w / 2;
    const MB = { x: (cv.width - w) / 2, y: (cv.height - hh) / 2, w, h: hh };
    return [MB.x + (lon + 180) / 360 * MB.w, MB.y + (90 - lat) / 180 * MB.h];
  };
  const [mx, my] = proj(r.lon, r.lat);
  const cx = rect.left + mx * (rect.width / cv.width);
  const cy = rect.top + my * (rect.height / cv.height);
  cv.dispatchEvent(new MouseEvent('mousemove', { clientX: cx, clientY: cy, bubbles: true }));
  const tt = document.getElementById('tooltip');
  return tt.style.display === 'block' ? tt.textContent : null;
});
check('R6: tooltip abre no hover (setup)', !!tipText && tipText.length > 0, (tipText || '').slice(0, 60));
check('R6: dica HUB GLOBAL presente no tooltip do hub', !!tipText && tipText.includes('HUB GLOBAL'),
  (tipText || '').includes('HUB GLOBAL') ? 'dica visível' : 'sem dica');

// ---- R9: painel win-rate no /dev (requer ledger com partidas; corre depois do run-all+e2e) ----
const ctx = await b.newContext();
const devPage = await ctx.newPage();
await devPage.goto(BASE + '/dev');
await devPage.waitForTimeout(2500);   // dev é acesso local sem chave (accessKey OFF)
const wr = await devPage.evaluate(() => {
  const tb = document.getElementById('wrTable');
  if (!tb) return { ok: false, why: 'sem wrTable' };
  const rows = [...tb.querySelectorAll('tbody tr')].map(tr => tr.textContent);
  return { ok: true, rows };
});
check('R9: painel WIN RATE POR CENÁRIO existe no /dev', wr.ok, wr.why || '');
check('R9: tabela com ≥2 cenários (silent+rush do QA)', wr.rows.length >= 2, wr.rows.map(r => r.slice(0, 12)).join(' | '));
check('R9: mostra win rate + dia mediano', wr.ok && wr.rows.some(r => /%/.test(r) && /dia|mediano|\d{2,}/.test(r)), 'valores presentes');
await devPage.screenshot({ path: '/home/user/PandemicGame/qa/out/shots/dev_winrate.png' });
await ctx.close();

check('sem page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
const fails = results.filter(r => !r[1]).length;
console.log(`\n  ${results.length - fails}/${results.length} checks OK\n`);
await b.close();
process.exit(fails ? 1 : 0);
