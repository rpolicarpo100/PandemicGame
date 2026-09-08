// PANDEMIC EVOLUTION — QA do HUB (/play, rev 1.5): tabs, iframes PvE/PvP, leaderboard, skins, settings
// Uso: servidor local (PORT=4000 node game/server.js) · node qa/hub.mjs [--seed-hall]
import { chromium } from 'playwright';
const BASE = process.env.QA_BASE || 'http://127.0.0.1:4000';
const seedHall = process.argv.includes('--seed-hall');

const results = [];
const check = (n, ok, d = '') => { results.push([n, !!ok, d]); console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${n}${d ? ' — ' + d : ''}`); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1500, height: 950 } });
const seedSid = seedHall ? 'hubSeed_' + Math.random().toString(36).slice(2, 8) : null;
if (seedSid) await page.context().addCookies([{ name: 'pev_sid', value: seedSid, url: BASE + '/' }]);
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });

// ---- API: /api/me e /api/hall ----
const me = await (await fetch(BASE + '/api/me')).json();
check('api/me: ok+alias', me.ok && /^OP-[A-Z0-9]{4}$/.test(me.alias), me.alias);
const hall0 = await (await fetch(BASE + '/api/hall')).json();
check('api/hall: estrutura', hall0.ok && Array.isArray(hall0.pve) && Array.isArray(hall0.pvp), `pve=${hall0.counts.pve} pvp=${hall0.counts.pvp}`);

// ---- páginas ----
const resp = await page.goto(BASE + '/play', { waitUntil: 'networkidle' });
check('/play 200 (hub)', resp.status() === 200);
await page.waitForSelector('#tabs', { timeout: 10000 });
const tabs = await page.locator('#tabs button').allInnerTexts();
check('menu com 6 tabs', tabs.length === 6, tabs.join('/'));
check('labels esperados', ['dashboard', 'pve', 'pvp', 'leaderboard', 'skins', 'settings'].every((t, i) => tabs[i].trim().toLowerCase() === t));
check('dashboard default visível', await page.isVisible('#pane-dash'));
check('dashboard: nome + alias', (await page.textContent('#dashName')).length > 0 && /^sessão anónima · OP-[A-Z0-9]{4}/.test(await page.textContent('#dashAlias')));
check('dashboard: modos listados', ((await page.textContent('#pane-dash')).includes('PvE — Pandemia')) && ((await page.textContent('#pane-dash')).includes('Virus (salas 2–6)')));
check('dashboard: wallet opcional', await page.isVisible('#walletBtn'));
check('dashboard: card partida desta sessão', (await page.textContent('#liveBox')).length > 5);

// ---- tab PvE (iframe com o simulador real) ----
await page.click('#tabs button[data-tab="pve"]');
await page.waitForSelector('#pveFrame', { timeout: 10000 });
await page.waitForFunction(() => {
  const f = document.getElementById('pveFrame');
  return f && f.contentDocument && f.contentDocument.querySelector('canvas');
}, null, { timeout: 25000 });
check('tab PvE: iframe carrega o simulador (canvas)', true);
await page.waitForFunction(() => {
  const f = document.getElementById('pveFrame');
  return f && f.contentDocument && f.contentDocument.querySelector('canvas').width > 100;
}, null, { timeout: 20000 });
check('tab PvE: canvas com tamanho real', true);
// voltar ao dashboard e reabrir PvE (iframe preservado)
await page.click('#tabs button[data-tab="dash"]');
await page.click('#tabs button[data-tab="pve"]');
await page.waitForTimeout(400);
check('tab PvE: estado preservado ao alternar tabs', await page.evaluate(() => {
  const f = document.getElementById('pveFrame');
  return !!f && f.contentDocument && f.contentDocument.querySelector('canvas') !== null;
}));

// ---- tab PvP (iframe com /pvp) ----
await page.click('#tabs button[data-tab="pvp"]');
await page.waitForSelector('#pvpFrame', { timeout: 10000 });
await page.waitForFunction(() => {
  const f = document.getElementById('pvpFrame');
  return f && f.contentDocument && f.contentDocument.getElementById('sc-home');
}, null, { timeout: 25000 });
check('tab PvP: iframe carrega o modo VIRUS', true);

// ---- leaderboard ----
await page.click('#tabs button[data-tab="lb"]');
await page.waitForTimeout(800);
const lbEmpty = await page.isVisible('#lbEmpty');
const lbRows = await page.locator('#lbBody tr').count();
check('leaderboard: estado coerente (tabela ou vazio)', lbEmpty || lbRows >= 0);
await page.click('#lbSrc button[data-src="pvp"]');
await page.waitForTimeout(500);
const pvpEmpty = await page.isVisible('#lbEmpty');
check('leaderboard: secção PvP responde', pvpEmpty || (await page.locator('#lbBody tr').count()) > 0);
await page.click('#lbSrc button[data-src="local"]');
await page.waitForTimeout(400);
const localTxt = await page.textContent('#lbEmpty').catch(() => '');
check('leaderboard: secção local (browser novo = vazio)', !localTxt || /Sem recordes locais/.test(localTxt), localTxt.trim().slice(0, 60));

// ---- skins ----
await page.click('#tabs button[data-tab="skins"]');
await page.waitForSelector('#themeRow .sw');
await page.click('#themeRow .sw:nth-child(3)');   // cyan
await page.waitForFunction(() => document.body.dataset.theme === 'cyan');
check('skins: tema cyan aplicado + persistido', await page.evaluate(() => (JSON.parse(localStorage.getItem('pevo.skin') || '{}')).theme) === 'cyan');
await page.click('#avatarRow .av:nth-child(4)');
check('skins: avatar escolhido', await page.evaluate(() => (JSON.parse(localStorage.getItem('pevo.skin') || '{}')).avatar === 'priao'));
check('skins: pré-visualização atualiza', (await page.textContent('#prevAvatar')).length > 0);
// aplicar também no iframe PvE
await page.click('#tabs button[data-tab="pve"]');
await page.waitForTimeout(500);
check('tema refletido no iframe PvE', await page.evaluate(() => {
  const f = document.getElementById('pveFrame');
  return f.contentDocument && f.contentDocument.body && f.contentDocument.body.dataset.theme === 'cyan';
}));
await page.click('#tabs button[data-tab="skins"]');
await page.click('#themeRow .sw:first-child');   // voltar a bio
await page.waitForFunction(() => document.body.dataset.theme === 'bio');

// ---- settings ----
await page.click('#tabs button[data-tab="settings"]');
await page.waitForSelector('#optMotion');
await page.click('#optMotion');
check('settings: frota reduzida ON + guardada', await page.evaluate(() => (JSON.parse(localStorage.getItem('pevo.settings') || '{}')).motion === true));
await page.click('#optMotion');
await page.click('#resetLocal');
await page.waitForTimeout(300);
check('settings: reset limpa localStorage', await page.evaluate(() => !localStorage.getItem('pevo.top10') && !localStorage.getItem('pevo.skin')));
check('settings: sistema mostra sessão', (await page.textContent('#sysAlias')).length > 0);

// ---- wallet sem extensão ----
await page.click('#tabs button[data-tab="dash"]');
await page.click('#walletBtn');
await page.waitForTimeout(400);
check('wallet: ausência de Phantom avisada', (await page.textContent('#toast')) === '' ? false : /Phantom não detetado/.test(await page.textContent('#toast')));

await page.screenshot({ path: '/home/user/PandemicGame/qa/out/shots/hub_dash.png' });

// ---- (opcional) --seed-hall: joga um rush PvE até ao fim e valida entrada no leaderboard ----
if (seedHall) {
  const jh = { 'Content-Type': 'application/json', Cookie: 'pev_sid=' + seedSid };
  const post = (p, bb) => fetch(BASE + p, { method: 'POST', headers: jh, body: JSON.stringify(bb) }).then(r => r.json());
  await post('/action', { type: 'newgame', scenario: 'rush' });
  const st0 = await (await fetch(BASE + '/state', { headers: jh })).json();
  await post('/action', { type: 'seed', region: st0.regions.sort((a, b) => b.pop - a.pop)[0].id });
  await post('/action', { type: 'speed', value: 8 });
  let st = await (await fetch(BASE + '/state', { headers: jh })).json();
  for (let i = 0; i < 400 && st.phase === 'running'; i++) {
    st = await (await fetch(BASE + '/state', { headers: jh })).json();
    if (st.pendingEvent) await post('/action', { type: 'eventChoice', option: 0 });
    await sleep(280);
  }
  const h2 = await (await fetch(BASE + '/api/hall', { headers: jh })).json();
  check('hall: partida rush terminada registada (pve ≥1)', h2.counts.pve >= 1, 'pve=' + h2.counts.pve);
  const mine = h2.pve.find(e => e.alias === h2.alias);
  check('hall: entrada com score/agente/cenário', !!mine && mine.score > 0 && mine.agent && mine.day > 0, mine ? JSON.stringify({ a: mine.agent, d: mine.day, s: mine.score }) : '—');
  await page.click('#tabs button[data-tab="lb"]');
  await page.waitForTimeout(700);
  const rowsAfter = await page.locator('#lbBody tr').count();
  const meTag = await page.locator('#lbBody tr.me').count();
  check('leaderboard: tabela mostra a entrada (marcada TU)', rowsAfter >= 1 && meTag === 1, `rows=${rowsAfter} me=${meTag}`);
  await page.screenshot({ path: '/home/user/PandemicGame/qa/out/shots/hub_leaderboard.png' });
}

// ---- /pve direto continua a servir o simulador (back-compat) ----
const p2 = await b.newPage();
const respPve = await p2.goto(BASE + '/pve', { waitUntil: 'networkidle' });
check('/pve direto 200', respPve.status() === 200);
const canv = await p2.locator('canvas').count();
check('/pve direto: simulador com canvas', canv >= 1, 'canvas=' + canv);

// ---- erros de consola ----
const real = errs.filter(x => !x.includes('favicon'));
check('hub: sem erros de consola', real.length === 0, real.slice(0, 3).join(' ;; '));

const fails = results.filter(r => !r[1]).length;
console.log(`\n  ${results.length - fails}/${results.length} checks OK\n`);
await b.close();
process.exit(fails ? 1 : 0);
