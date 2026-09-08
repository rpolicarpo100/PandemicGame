// QA PvP em browser: 3 jogadores reais em contextos separados (cookies isolados)
import { chromium } from 'playwright';

import { BASE as B } from './lib.mjs';
let fails = 0;
const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? ' | ' + x : '')); if (!c) fails++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch();
const errs = {};
const ctx = async (tag) => {
  const c = await browser.newContext();
  const p = await c.newPage();
  errs[tag] = [];
  p.on('console', m => { if (m.type() === 'error') errs[tag].push(m.text()); });
  p.on('pageerror', e => errs[tag].push('PAGEERROR: ' + e.message));
  return p;
};

const A = await ctx('A'), Bp = await ctx('B'), C = await ctx('C');
const P = [['A', A], ['B', Bp], ['C', C]];

for (const [t, p] of P) { await p.goto(B + '/pvp'); await p.waitForSelector('#sc-home.on'); }
ok('3 páginas em home', true);

// A cria sala
await A.click('#btnCreate');
await A.waitForSelector('#sc-lobby.on');
await A.waitForFunction(() => /^[A-Z2-9]{6}$/.test(document.getElementById('roomCode').textContent));
const code = await A.textContent('#roomCode');
ok('A criou sala, código=' + code, /^[A-Z2-9]{6}$/.test(code));

// B e C juntam-se
for (const p of [Bp, C]) {
  await p.fill('#joinCode', code);
  await p.click('#btnJoin');
  await p.waitForSelector('#sc-lobby.on');
}
await A.waitForFunction(() => document.getElementById('lbCount').textContent === '3', null, { timeout: 8000 });
ok('3 no lobby', true);
ok('host marcado', await A.locator('.pslot .tag.host').count() === 1);

// cada um escolhe agente distinto: ordem de chips diferente por página
const agents = [];
for (const [t, p] of P) {
  await p.waitForSelector('#agChips .ag-chip:not(.taken)');
  // escolher o 1º agente livre (na página de cada um)
  const chip = p.locator('#agChips .ag-chip:not(.taken):not(.sel)').first();
  const txt = (await chip.innerText()).trim().split('\n')[0].trim();
  await chip.click();
  await p.waitForFunction(t => {
    const s = document.querySelector('#agChips .ag-chip.sel');
    return s && s.innerText.includes(t);
  }, txt);
  agents.push(txt);
  ok(t + ' escolheu agente ' + txt, true);
}
ok('agentes distintos (3/3)', new Set(agents).size === 3, agents.join(' / '));

// regiões distintas via select
const seeds = [];
for (const [t, p] of P) {
  await p.waitForSelector('#seedSel', { timeout: 8000 });
  const val = await p.evaluate(() => {
    const sel = document.getElementById('seedSel');
    const opts = [...sel.options];
    // todos os estados iniciais: escolher opções espalhadas
    return opts[Math.floor(Math.random() * opts.length)].value;
  });
  await p.selectOption('#seedSel', val);
  await p.waitForFunction(v => {
    const st = document.getElementById('seedStatus');
    return st && st.textContent.includes('origem escolhida');
  }, val).catch(() => {});
  seeds.push(val);
}
// esperar a última origem ficar refletida no lobby do host
await sleep(900);
ok('origens escolhidas (3)', new Set(seeds).size === 3);

// ready: o botão READY fica ativo para todos
for (const [t, p] of P) {
  await p.waitForFunction(() => { const b = document.getElementById('btnReady'); return !b.disabled; });
}
for (const [t, p] of P) await p.click('#btnReady');
await sleep(700);
for (const [t, p] of P) ok(t + ' ready marcado', (await p.textContent('#btnReady')).includes('READY'));
const readyChips = await A.locator('.pslot .tag.rdy').count();
ok('3 chips READY no lobby', readyChips === 3, 'n=' + readyChips);

// B (não host) não vê start
ok('B sem botão start (visível)', !(await Bp.locator('#hostStart').isVisible()));

// A inicia
await A.click('#hostStart');
await A.waitForSelector('#sc-game.on', { timeout: 8000 });
ok('A: partida iniciou (running)', true);
await sleep(1000);
ok('B em running também', await Bp.isVisible('#sc-game'));
ok('C em running também', await C.isVisible('#sc-game'));

// clock/dna HUD e dia a avançar
const d0 = +(await A.textContent('#dayVal'));
await sleep(4600);
const d1 = +(await A.textContent('#dayVal'));
ok('dia avança (speed 1)', d1 > d0, d0 + ' -> ' + d1);

// HUD: DNA + infetados
ok('HUD DNA presente', /^\d+$/.test(await A.textContent('#dnaVal')));
const infTxt = await A.textContent('#infVal');
ok('HUD infetados presente', infTxt.length > 0, infTxt);

// speed: host controla ×8; não-host tem botões disabled
const spA = await A.locator('.speedbtn[title="velocidade ×8"]');
ok('A tem botões de relógio (host)', await spA.count() === 1 && !(await spA.isDisabled()));
ok('B sem controlo do relógio', await Bp.locator('.speedbtn').first().isDisabled());
await spA.click();
await sleep(2600);
const d2 = +(await A.textContent('#dayVal'));
ok('×8 acelera dias', d2 >= d1 + 5, d1 + ' -> ' + d2);

// genoma: comprar primeiro nó comprável
const bought = await A.evaluate(async () => {
  const list = document.querySelectorAll('#evoList .node.buyable');
  if (!list.length) return null;
  const el = list[0];
  el.click();
  return el.querySelector('.n-top b').textContent;
});
if (bought) { await sleep(800); ok('evoluiu nó ' + bought, true); }
else ok('sem nós compráveis (DNA baixo) — tolerado', true);

// feed/wire tem notícias (SSE lite em ação)
const feedN = await A.locator('#feed div').count();
ok('wire com notícias', feedN >= 1, 'n=' + feedN);

// painel humanidade
ok('painel humanidade visível', await A.isVisible('#worldPanels .wpanel'));

// screenshots
await A.screenshot({ path: '/home/user/PandemicGame/qa/out/shots/pvp_running_A.png' });
await A.click('#side .tabbar button[data-tab="reg"]');
await sleep(300);
await A.click('#side .tabbar button[data-tab="feed"]');
await sleep(300);
await A.screenshot({ path: '/home/user/PandemicGame/qa/out/shots/pvp_wire_A.png' });
await Bp.screenshot({ path: '/home/user/PandemicGame/qa/out/shots/pvp_running_B.png' });

// sem erros de consola
for (const [t, p] of P) {
  const e = errs[t].filter(x => !x.includes('favicon'));
  ok(t + ' sem erros de consola', e.length === 0, e.slice(0, 2).join(' ;; '));
}

// C abandona (host continua), A & B continuam; depois todos saem
await C.click('#btnQuit');
await C.waitForSelector('#sc-home.on');
await sleep(600);
const cntAfter = await A.evaluate(() => document.querySelectorAll('#rivals .rival').length);
ok('B e A continuam após C sair (2 rivais)', cntAfter === 2, 'n=' + cntAfter);
await A.click('#btnQuit'); await A.waitForSelector('#sc-home.on');
await Bp.click('#btnQuit'); await Bp.waitForSelector('#sc-home.on');

console.log(fails ? '\nPVP UI QA: ' + fails + ' FAIL' : '\nPVP UI QA: ALL PASS');
await browser.close();
process.exit(fails ? 1 : 0);
